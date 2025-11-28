import { useState, useCallback, useRef } from 'react';
import { Photo, EventLogItem, TabType, PhotoStatus } from './types';
import { fetchPhotos } from './api';
import { usePolling } from './hooks/usePolling';
import UploadZone from './components/UploadZone';
import ProcessingQueue from './components/ProcessingQueue';
import PhotoGallery from './components/PhotoGallery';
import EventLog from './components/EventLog';
import TabButton from './components/TabButton';
import Toast, { ToastMessage } from './components/Toast';

const POLLING_INTERVAL = 3000; // 3 seconds (reduced for performance)

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Track previous statuses for detecting changes
  const prevStatusMap = useRef<Map<string, PhotoStatus>>(new Map());

  const addToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addEvent = useCallback((message: string, type: EventLogItem['type'], photoId?: string) => {
    const event: EventLogItem = {
      timestamp: new Date().toISOString(),
      message,
      type,
      photoId,
    };
    setEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events
  }, []);

  // Poll for photo updates
  const pollPhotos = useCallback(async () => {
    try {
      const fetchedPhotos = await fetchPhotos();
      
      // Detect status changes
      fetchedPhotos.forEach(photo => {
        const prevStatus = prevStatusMap.current.get(photo.id);
        if (prevStatus && prevStatus !== photo.status) {
          let message = '';
          let type: EventLogItem['type'] = 'status_change';
          
          if (photo.status === 'PROCESSING') {
            message = `${photo.filename}: PROCESSING`;
          } else if (photo.status === 'DONE') {
            message = `${photo.filename}: DONE`;
            type = 'info';
          } else if (photo.status === 'FAILED') {
            message = `${photo.filename}: FAILED`;
            type = 'error';
          } else {
            message = `${photo.filename}: ${photo.status}`;
          }
          
          addEvent(message, type, photo.id);
        }
        prevStatusMap.current.set(photo.id, photo.status);
      });

      setPhotos(fetchedPhotos);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      if (isLoading) setIsLoading(false);
    }
  }, [addEvent, isLoading]);

  usePolling(pollPhotos, POLLING_INTERVAL);

  const handleUploadStart = useCallback((files: File[]) => {
    addEvent(`Upload started: ${files.length} file${files.length > 1 ? 's' : ''}`, 'upload');
  }, [addEvent]);

  const handleUploadComplete = useCallback((uploadedPhotos: Photo[]) => {
    // Add to local state immediately
    setPhotos(prev => [...uploadedPhotos, ...prev]);
    
    // Track statuses for new photos
    uploadedPhotos.forEach(photo => {
      prevStatusMap.current.set(photo.id, photo.status);
    });

    addEvent(
      `Upload complete: ${uploadedPhotos.length} photo${uploadedPhotos.length > 1 ? 's' : ''} received`,
      'info'
    );

    addToast(`Successfully uploaded ${uploadedPhotos.length} photo${uploadedPhotos.length > 1 ? 's' : ''}`, 'success');

    // Switch to queue tab to see processing
    setActiveTab('queue');
  }, [addEvent, addToast]);

  const handleError = useCallback((message: string) => {
    addEvent(message, 'error');
    addToast(message, 'error');
  }, [addEvent, addToast]);

  const handleWarning = useCallback((message: string) => {
    addToast(message, 'warning');
  }, [addToast]);

  const handlePhotoDeleted = useCallback((id: string) => {
    const photo = photos.find(p => p.id === id);
    setPhotos(prev => prev.filter(p => p.id !== id));
    prevStatusMap.current.delete(id);
    if (photo) {
      addEvent(`Deleted ${photo.filename}`, 'info');
    }
  }, [photos, addEvent]);

  const handlePhotosDeleted = useCallback((ids: string[]) => {
    setPhotos(prev => prev.filter(p => !ids.includes(p.id)));
    ids.forEach(id => prevStatusMap.current.delete(id));
    
    addEvent(`Deleted ${ids.length} photo${ids.length > 1 ? 's' : ''}`, 'info');
    addToast(`Deleted ${ids.length} photo${ids.length > 1 ? 's' : ''}`, 'success');
  }, [photos, addEvent, addToast]);

  // Count photos by status
  const queueCount = photos.filter(p => p.status === 'UPLOADED' || p.status === 'PROCESSING').length;
  const galleryCount = photos.filter(p => p.status === 'DONE' || p.status === 'FAILED').length;

  return (
    <div className="xc-min-h-screen xc-bg-surface-950 xc-text-white">
      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Background gradient */}
      <div className="xc-fixed xc-inset-0 xc-bg-gradient-to-br xc-from-surface-950 xc-via-surface-900 xc-to-surface-950 xc-pointer-events-none" />
      <div className="xc-fixed xc-top-0 xc-left-1/4 xc-w-96 xc-h-96 xc-bg-brand-500/5 xc-rounded-full xc-blur-3xl xc-pointer-events-none" />
      <div className="xc-fixed xc-bottom-0 xc-right-1/4 xc-w-96 xc-h-96 xc-bg-blue-500/5 xc-rounded-full xc-blur-3xl xc-pointer-events-none" />

      <div className="xc-relative xc-max-w-7xl xc-mx-auto xc-px-4 sm:xc-px-6 lg:xc-px-8 xc-py-8">
        {/* Header */}
        <header className="xc-mb-8">
          <div className="xc-flex xc-items-center xc-gap-3 xc-mb-2">
            <div className="xc-p-2 xc-rounded-xl xc-bg-brand-500/20">
              <svg className="xc-w-8 xc-h-8 xc-text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="xc-text-2xl xc-font-bold xc-text-white">Rapid Photo Flow <span className="xc-text-surface-500 xc-font-normal">by Apil</span></h1>
              <p className="xc-text-sm xc-text-surface-400">Photo upload & processing workflow</p>
            </div>
          </div>
        </header>

        <div className="xc-grid xc-grid-cols-1 lg:xc-grid-cols-3 xc-gap-6">
          {/* Main Content */}
          <div className="lg:xc-col-span-2">
            {/* Tabs */}
            <nav className="xc-flex xc-gap-2 xc-mb-6 xc-p-1 xc-bg-surface-900/50 xc-rounded-2xl xc-backdrop-blur-sm xc-border xc-border-surface-800">
              <TabButton
                tab="upload"
                activeTab={activeTab}
                onClick={setActiveTab}
                label="Upload"
                icon={
                  <svg className="xc-w-5 xc-h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                }
              />
              <TabButton
                tab="queue"
                activeTab={activeTab}
                onClick={setActiveTab}
                label="Processing"
                count={queueCount}
                icon={
                  <svg className="xc-w-5 xc-h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              />
              <TabButton
                tab="gallery"
                activeTab={activeTab}
                onClick={setActiveTab}
                label="Gallery"
                count={galleryCount}
                icon={
                  <svg className="xc-w-5 xc-h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </nav>

            {/* Tab Content */}
            <div className="xc-bg-surface-900/30 xc-backdrop-blur-sm xc-rounded-2xl xc-border xc-border-surface-800 xc-p-6">
              {isLoading ? (
                <div className="xc-flex xc-items-center xc-justify-center xc-py-16">
                  <svg className="xc-animate-spin xc-w-8 xc-h-8 xc-text-brand-500" fill="none" viewBox="0 0 24 24">
                    <circle className="xc-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="xc-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              ) : (
                <>
                  {activeTab === 'upload' && (
                    <UploadZone
                      onUploadComplete={handleUploadComplete}
                      onUploadStart={handleUploadStart}
                      onError={handleError}
                      onWarning={handleWarning}
                    />
                  )}
                  {activeTab === 'queue' && (
                    <ProcessingQueue photos={photos} />
                  )}
                  {activeTab === 'gallery' && (
                    <PhotoGallery
                      photos={photos}
                      onPhotoDeleted={handlePhotoDeleted}
                      onPhotosDeleted={handlePhotosDeleted}
                      onError={handleError}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Event Log Sidebar */}
          <div className="lg:xc-col-span-1">
            <div className="xc-sticky xc-top-8">
              <div className="xc-bg-surface-900/30 xc-backdrop-blur-sm xc-rounded-2xl xc-border xc-border-surface-800 xc-p-4">
                <div className="xc-flex xc-items-center xc-justify-between xc-mb-4">
                  <h2 className="xc-text-sm xc-font-medium xc-text-surface-400 xc-uppercase xc-tracking-wider">
                    Event Log
                  </h2>
                  <span className="xc-text-xs xc-text-surface-500">
                    {events.length} events
                  </span>
                </div>
                <EventLog events={events} />
              </div>

              {/* Stats */}
              <div className="xc-mt-4 xc-grid xc-grid-cols-2 xc-gap-3">
                <div className="xc-bg-surface-900/30 xc-backdrop-blur-sm xc-rounded-xl xc-border xc-border-surface-800 xc-p-4">
                  <p className="xc-text-2xl xc-font-bold xc-text-white">{photos.length}</p>
                  <p className="xc-text-xs xc-text-surface-400">Total Photos</p>
                </div>
                <div className="xc-bg-surface-900/30 xc-backdrop-blur-sm xc-rounded-xl xc-border xc-border-surface-800 xc-p-4">
                  <p className="xc-text-2xl xc-font-bold xc-text-brand-400">
                    {photos.filter(p => p.status === 'DONE').length}
                  </p>
                  <p className="xc-text-xs xc-text-surface-400">Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

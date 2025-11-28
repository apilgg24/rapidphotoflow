import { useState, useEffect } from 'react';
import { Photo } from '../types';
import StatusBadge from './StatusBadge';
import { getImageUrl } from '../api';

interface ProcessingQueueProps {
  photos: Photo[];
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Average processing time per photo (in seconds)
const AVG_PROCESSING_TIME = 5;

export default function ProcessingQueue({ photos }: ProcessingQueueProps) {
  const [now, setNow] = useState(Date.now());
  
  // Update time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter to show only non-completed photos (UPLOADED or PROCESSING)
  const queuedPhotos = photos.filter(p => p.status === 'UPLOADED' || p.status === 'PROCESSING');
  const uploadedPhotos = queuedPhotos.filter(p => p.status === 'UPLOADED');
  const processingPhotos = queuedPhotos.filter(p => p.status === 'PROCESSING');
  
  // Calculate total size being processed
  const totalSize = queuedPhotos.reduce((sum, p) => sum + (p.size || 0), 0);

  // Estimate time remaining
  const estimateTimeRemaining = (): string => {
    if (queuedPhotos.length === 0) return '';
    
    // Each photo takes ~3-8 seconds to process (avg 5 sec)
    // UPLOADED photos: need to wait for scheduler pickup (3s) + processing (3-8s)
    // PROCESSING photos: estimate based on when they started
    
    let totalSeconds = 0;
    
    // Uploaded photos need ~8s each (3s to pickup + 5s avg processing)
    totalSeconds += uploadedPhotos.length * 8;
    
    // Processing photos - estimate ~3s remaining each (midway through)
    processingPhotos.forEach(photo => {
      const startTime = new Date(photo.updatedAt).getTime();
      const elapsed = (now - startTime) / 1000;
      const remaining = Math.max(0, AVG_PROCESSING_TIME - elapsed);
      totalSeconds += remaining;
    });
    
    totalSeconds = Math.ceil(totalSeconds);
    
    if (totalSeconds <= 0) return 'Almost done...';
    if (totalSeconds < 60) return `About ${totalSeconds} second${totalSeconds !== 1 ? 's' : ''} remaining`;
    
    const minutes = Math.ceil(totalSeconds / 60);
    return `About ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  };

  // Calculate overall progress (0-100)
  const calculateProgress = (): number => {
    if (queuedPhotos.length === 0) return 100;
    
    let totalProgress = 0;
    
    queuedPhotos.forEach(photo => {
      if (photo.status === 'UPLOADED') {
        // Uploaded but not yet picked up - 0% progress
        totalProgress += 0;
      } else if (photo.status === 'PROCESSING') {
        // Processing - estimate based on time elapsed
        const startTime = new Date(photo.updatedAt).getTime();
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(90, (elapsed / AVG_PROCESSING_TIME) * 100);
        totalProgress += progress;
      }
    });
    
    return Math.round(totalProgress / queuedPhotos.length);
  };

  if (queuedPhotos.length === 0) {
    return (
      <div className="xc-flex xc-flex-col xc-items-center xc-justify-center xc-py-16 xc-text-center">
        <div className="xc-p-4 xc-rounded-full xc-bg-surface-800 xc-mb-4">
          <svg className="xc-w-10 xc-h-10 xc-text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="xc-text-lg xc-font-medium xc-text-white xc-mb-1">Queue Empty</h3>
        <p className="xc-text-surface-400 xc-text-sm xc-mb-4">No photos are currently being processed</p>
        <p className="xc-text-xs xc-text-surface-500">
          💡 You can upload up to <span className="xc-text-brand-400 xc-font-medium">500 MB</span> of photos at a time
        </p>
      </div>
    );
  }

  const progress = calculateProgress();
  const timeRemaining = estimateTimeRemaining();

  return (
    <div className="xc-space-y-4">
      {/* Progress Header */}
      <div className="xc-bg-surface-800/50 xc-rounded-xl xc-border xc-border-surface-700/50 xc-p-4">
        <div className="xc-flex xc-items-center xc-justify-between xc-mb-3">
          <div>
            <h3 className="xc-text-sm xc-font-medium xc-text-white">
              Processing {queuedPhotos.length} photo{queuedPhotos.length !== 1 ? 's' : ''}
              {totalSize > 0 && <span className="xc-text-surface-400 xc-font-normal"> • {formatFileSize(totalSize)}</span>}
            </h3>
            <p className="xc-text-xs xc-text-surface-400 xc-mt-0.5">{timeRemaining}</p>
          </div>
          <div className="xc-text-right">
            <span className="xc-text-2xl xc-font-bold xc-text-brand-400">{progress}%</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="xc-h-2 xc-bg-surface-700 xc-rounded-full xc-overflow-hidden">
          <div 
            className="xc-h-full xc-bg-gradient-to-r xc-from-brand-500 xc-to-brand-400 xc-rounded-full xc-transition-all xc-duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Status breakdown */}
        <div className="xc-flex xc-gap-4 xc-mt-3 xc-text-xs">
          {uploadedPhotos.length > 0 && (
            <span className="xc-text-blue-400">
              ↑ {uploadedPhotos.length} waiting
            </span>
          )}
          {processingPhotos.length > 0 && (
            <span className="xc-text-amber-400">
              ⟳ {processingPhotos.length} processing
            </span>
          )}
        </div>
      </div>

      {/* Queue List */}
      <div className="xc-space-y-2">
        {queuedPhotos.map((photo, index) => {
          // Calculate individual progress for processing photos
          let itemProgress = 0;
          if (photo.status === 'PROCESSING') {
            const startTime = new Date(photo.updatedAt).getTime();
            const elapsed = (now - startTime) / 1000;
            itemProgress = Math.min(95, (elapsed / AVG_PROCESSING_TIME) * 100);
          }
          
          return (
            <div
              key={photo.id}
              className="xc-flex xc-items-center xc-gap-4 xc-p-3 xc-bg-surface-800/50 xc-rounded-xl xc-border xc-border-surface-700/50 xc-animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Thumbnail */}
              <div className="xc-w-12 xc-h-12 xc-rounded-lg xc-overflow-hidden xc-bg-surface-700 xc-flex-shrink-0 xc-relative">
                <img
                  src={getImageUrl(photo)}
                  alt={photo.filename}
                  className="xc-w-full xc-h-full xc-object-cover"
                />
                {/* Mini progress overlay for processing items */}
                {photo.status === 'PROCESSING' && (
                  <div className="xc-absolute xc-bottom-0 xc-left-0 xc-right-0 xc-h-1 xc-bg-black/50">
                    <div 
                      className="xc-h-full xc-bg-brand-400 xc-transition-all xc-duration-1000"
                      style={{ width: `${itemProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="xc-flex-1 xc-min-w-0">
                <p className="xc-text-sm xc-font-medium xc-text-white xc-truncate">
                  {photo.filename}
                </p>
                <p className="xc-text-xs xc-text-surface-500">
                  {photo.size ? formatFileSize(photo.size) : ''} 
                  {photo.size && ' • '}
                  {photo.status === 'PROCESSING' 
                    ? `${Math.round(itemProgress)}% complete`
                    : 'Waiting...'}
                </p>
              </div>

              {/* Status */}
              <StatusBadge status={photo.status} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

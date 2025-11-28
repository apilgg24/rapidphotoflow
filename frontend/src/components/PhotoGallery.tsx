import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Photo } from '../types';
import StatusBadge from './StatusBadge';
import { getImageUrl, deletePhoto } from '../api';

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoDeleted: (id: string) => void;
  onPhotosDeleted: (ids: string[]) => void;
  onError: (message: string) => void;
}

type ViewMode = 'grid' | 'list';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function PhotoGallery({ photos, onPhotoDeleted, onPhotosDeleted, onError }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Separate DONE and FAILED photos
  const donePhotos = photos.filter(p => p.status === 'DONE');
  const failedPhotos = photos.filter(p => p.status === 'FAILED');
  const allCompletedPhotos = [...donePhotos, ...failedPhotos];
  
  // Calculate total size
  const totalSize = allCompletedPhotos.reduce((sum, p) => sum + (p.size || 0), 0);

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    
    if (newSelected.size > 0) {
      setIsSelectMode(true);
    }
  };

  const selectAll = () => {
    const allIds = new Set(allCompletedPhotos.map(p => p.id));
    setSelectedIds(allIds);
    setIsSelectMode(true);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleDelete = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(photo.id);
    try {
      await deletePhoto(photo.id);
      onPhotoDeleted(photo.id);
      selectedIds.delete(photo.id);
      setSelectedIds(new Set(selectedIds));
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(null);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || isBulkDeleting) return;

    setIsBulkDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    const failedDeletes: string[] = [];

    for (const id of idsToDelete) {
      try {
        await deletePhoto(id);
      } catch {
        failedDeletes.push(id);
      }
    }

    const successfulDeletes = idsToDelete.filter(id => !failedDeletes.includes(id));
    if (successfulDeletes.length > 0) {
      onPhotosDeleted(successfulDeletes);
    }

    if (failedDeletes.length > 0) {
      onError(`Failed to delete ${failedDeletes.length} photo(s)`);
    }

    setSelectedIds(new Set());
    setIsSelectMode(false);
    setIsBulkDeleting(false);
  };

  const renderGridView = (photoList: Photo[]) => (
    <div className="xc-grid xc-grid-cols-2 sm:xc-grid-cols-3 lg:xc-grid-cols-4 xc-gap-4">
      {photoList.map((photo) => (
        <div
          key={photo.id}
          onClick={() => setSelectedPhoto(photo)}
          className="xc-group xc-relative xc-aspect-square xc-rounded-xl xc-overflow-hidden xc-bg-surface-800 xc-cursor-pointer xc-border xc-border-surface-700/50 hover:xc-border-surface-600 xc-transition-colors"
        >
          <img
            src={getImageUrl(photo)}
            alt={photo.filename}
            className="xc-w-full xc-h-full xc-object-cover"
            loading="lazy"
          />

          {/* Overlay */}
          <div className="xc-absolute xc-inset-0 xc-bg-gradient-to-t xc-from-black/70 xc-via-transparent xc-to-transparent xc-opacity-0 group-hover:xc-opacity-100 xc-transition-opacity">
            <div className="xc-absolute xc-bottom-0 xc-left-0 xc-right-0 xc-p-3">
              <p className="xc-text-sm xc-font-medium xc-text-white xc-truncate">{photo.filename}</p>
              {photo.size > 0 && (
                <p className="xc-text-xs xc-text-surface-300">{formatFileSize(photo.size)}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="xc-absolute xc-top-2 xc-left-2">
            <StatusBadge status={photo.status} size="sm" />
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => handleDelete(photo, e)}
            disabled={deletingId === photo.id}
            className="xc-absolute xc-top-2 xc-right-2 xc-p-1.5 xc-rounded-lg xc-bg-black/50 xc-text-white xc-opacity-0 group-hover:xc-opacity-100 xc-transition-opacity hover:xc-bg-red-500/80"
          >
            {deletingId === photo.id ? (
              <svg className="xc-w-4 xc-h-4 xc-animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="xc-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="xc-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="xc-w-4 xc-h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      ))}
    </div>
  );

  const renderListView = (photoList: Photo[]) => (
    <div className="xc-space-y-1">
      {/* Header */}
      <div className="xc-grid xc-grid-cols-12 xc-gap-4 xc-px-3 xc-py-2 xc-text-xs xc-font-medium xc-text-surface-400 xc-uppercase xc-tracking-wider xc-border-b xc-border-surface-700">
        <div className="xc-col-span-1"></div>
        <div className="xc-col-span-5">Name</div>
        <div className="xc-col-span-2">Size</div>
        <div className="xc-col-span-2">Status</div>
        <div className="xc-col-span-2">Date Added</div>
      </div>
      
      {photoList.map((photo, index) => (
        <div
          key={photo.id}
          onClick={() => isSelectMode ? toggleSelect(photo.id) : setSelectedPhoto(photo)}
          className={`
            xc-grid xc-grid-cols-12 xc-gap-4 xc-px-3 xc-py-2 xc-rounded-lg xc-cursor-pointer xc-transition-all xc-animate-fade-in
            ${selectedIds.has(photo.id) 
              ? 'xc-bg-brand-500/20 xc-ring-1 xc-ring-brand-500/50' 
              : 'hover:xc-bg-surface-800/50'
            }
          `}
          style={{ animationDelay: `${index * 20}ms` }}
        >
          {/* Checkbox + Thumbnail */}
          <div className="xc-col-span-1 xc-flex xc-items-center xc-gap-2">
            <div 
              onClick={(e) => toggleSelect(photo.id, e)}
              className={`
                xc-w-5 xc-h-5 xc-rounded xc-border-2 xc-flex xc-items-center xc-justify-center xc-transition-all xc-flex-shrink-0
                ${selectedIds.has(photo.id) 
                  ? 'xc-bg-brand-500 xc-border-brand-500' 
                  : 'xc-border-surface-500 hover:xc-border-surface-400'
                }
              `}
            >
              {selectedIds.has(photo.id) && (
                <svg className="xc-w-3 xc-h-3 xc-text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          {/* Filename + Thumbnail */}
          <div className="xc-col-span-5 xc-flex xc-items-center xc-gap-3">
            <div className="xc-w-10 xc-h-10 xc-rounded-lg xc-overflow-hidden xc-bg-surface-700 xc-flex-shrink-0">
              <img
                src={getImageUrl(photo)}
                alt={photo.filename}
                className="xc-w-full xc-h-full xc-object-cover"
              />
            </div>
            <span className="xc-text-sm xc-text-white xc-truncate">{photo.filename}</span>
          </div>

          {/* Size */}
          <div className="xc-col-span-2 xc-flex xc-items-center">
            <span className="xc-text-sm xc-text-surface-400">{photo.size ? formatFileSize(photo.size) : '—'}</span>
          </div>

          {/* Status */}
          <div className="xc-col-span-2 xc-flex xc-items-center">
            <StatusBadge status={photo.status} size="sm" />
          </div>

          {/* Date */}
          <div className="xc-col-span-2 xc-flex xc-items-center xc-justify-between">
            <span className="xc-text-sm xc-text-surface-400">
              {new Date(photo.createdAt).toLocaleDateString()}
            </span>
            
            {/* Delete button */}
            {!isSelectMode && (
              <button
                onClick={(e) => handleDelete(photo, e)}
                disabled={deletingId === photo.id}
                className="xc-p-1 xc-rounded xc-text-surface-500 hover:xc-text-red-400 hover:xc-bg-red-500/20 xc-transition-colors xc-opacity-0 group-hover:xc-opacity-100"
              >
                {deletingId === photo.id ? (
                  <svg className="xc-w-4 xc-h-4 xc-animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="xc-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="xc-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="xc-w-4 xc-h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (donePhotos.length === 0 && failedPhotos.length === 0) {
    return (
      <div className="xc-flex xc-flex-col xc-items-center xc-justify-center xc-py-16 xc-text-center">
        <div className="xc-p-4 xc-rounded-full xc-bg-surface-800 xc-mb-4">
          <svg className="xc-w-10 xc-h-10 xc-text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="xc-text-lg xc-font-medium xc-text-white xc-mb-1">No Photos Yet</h3>
        <p className="xc-text-surface-400 xc-text-sm">Upload some photos to see them here</p>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="xc-flex xc-items-center xc-justify-between xc-mb-4">
        {/* Selection info (list view only) or total size */}
        {viewMode === 'list' && selectedIds.size > 0 ? (
          <div className="xc-flex xc-items-center xc-gap-3">
            <span className="xc-text-sm xc-text-white xc-font-medium">
              {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={selectAll}
              className="xc-text-xs xc-text-brand-400 hover:xc-text-brand-300 xc-transition-colors"
            >
              Select all
            </button>
            <button
              onClick={clearSelection}
              className="xc-text-xs xc-text-surface-400 hover:xc-text-white xc-transition-colors"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="xc-text-sm xc-text-surface-400">
            {allCompletedPhotos.length} photo{allCompletedPhotos.length !== 1 ? 's' : ''} • {formatFileSize(totalSize)} total
          </div>
        )}

        <div className="xc-flex xc-items-center xc-gap-2">
          {/* Bulk delete button (list view only) */}
          {viewMode === 'list' && selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="xc-flex xc-items-center xc-gap-1.5 xc-px-3 xc-py-1.5 xc-bg-red-500/20 xc-text-red-400 xc-rounded-lg hover:xc-bg-red-500/30 xc-transition-colors disabled:xc-opacity-50 xc-text-sm"
            >
              {isBulkDeleting ? (
                <svg className="xc-w-4 xc-h-4 xc-animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="xc-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="xc-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="xc-w-4 xc-h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Delete
            </button>
          )}

          {/* View toggle */}
          <div className="xc-flex xc-bg-surface-800 xc-rounded-lg xc-p-0.5">
            <button
              onClick={() => { setViewMode('grid'); clearSelection(); }}
              className={`xc-p-1.5 xc-rounded-md xc-transition-colors ${viewMode === 'grid' ? 'xc-bg-surface-700 xc-text-white' : 'xc-text-surface-400 hover:xc-text-white'}`}
              title="Grid view"
            >
              <svg className="xc-w-4 xc-h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`xc-p-1.5 xc-rounded-md xc-transition-colors ${viewMode === 'list' ? 'xc-bg-surface-700 xc-text-white' : 'xc-text-surface-400 hover:xc-text-white'}`}
              title="List view"
            >
              <svg className="xc-w-4 xc-h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Photos */}
      {viewMode === 'grid' ? (
        <>
          {donePhotos.length > 0 && (
            <div className="xc-mb-6">
              {failedPhotos.length > 0 && (
                <h3 className="xc-text-sm xc-font-medium xc-text-surface-400 xc-uppercase xc-tracking-wider xc-mb-3">
                  ✓ Completed ({donePhotos.length})
                </h3>
              )}
              {renderGridView(donePhotos)}
            </div>
          )}
          {failedPhotos.length > 0 && (
            <div className="xc-mt-6 xc-pt-6 xc-border-t xc-border-surface-700">
              <h3 className="xc-text-sm xc-font-medium xc-text-surface-400 xc-uppercase xc-tracking-wider xc-mb-3">
                ✕ Failed Processing ({failedPhotos.length})
              </h3>
              {renderGridView(failedPhotos)}
            </div>
          )}
        </>
      ) : (
        <>
          {donePhotos.length > 0 && (
            <div className="xc-mb-6">
              {failedPhotos.length > 0 && (
                <h3 className="xc-text-sm xc-font-medium xc-text-surface-400 xc-uppercase xc-tracking-wider xc-mb-3">
                  ✓ Completed ({donePhotos.length})
                </h3>
              )}
              {renderListView(donePhotos)}
            </div>
          )}
          {failedPhotos.length > 0 && (
            <div className="xc-mt-6 xc-pt-6 xc-border-t xc-border-surface-700">
              <h3 className="xc-text-sm xc-font-medium xc-text-surface-400 xc-uppercase xc-tracking-wider xc-mb-3">
                ✕ Failed Processing ({failedPhotos.length})
              </h3>
              {renderListView(failedPhotos)}
            </div>
          )}
        </>
      )}

      {/* Lightbox Modal - Rendered via Portal to body for true viewport centering */}
      {selectedPhoto && createPortal(
        <div 
          className="xc-fixed xc-inset-0 xc-z-[9999] xc-flex xc-items-center xc-justify-center xc-bg-black/95 xc-p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="xc-absolute xc-top-4 xc-right-4 xc-p-2 xc-rounded-full xc-bg-surface-800 xc-text-white hover:xc-bg-surface-700 xc-transition-colors xc-z-10"
          >
            <svg className="xc-w-6 xc-h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="xc-max-w-5xl xc-max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img
              src={getImageUrl(selectedPhoto)}
              alt={selectedPhoto.filename}
              className="xc-max-w-full xc-max-h-[80vh] xc-object-contain xc-rounded-lg"
            />
            <div className="xc-mt-4 xc-flex xc-items-center xc-justify-between xc-text-white">
              <div>
                <p className="xc-font-medium">{selectedPhoto.filename}</p>
                <p className="xc-text-sm xc-text-surface-400">
                  {selectedPhoto.size ? formatFileSize(selectedPhoto.size) : ''} • {new Date(selectedPhoto.createdAt).toLocaleString()}
                </p>
              </div>
              <StatusBadge status={selectedPhoto.status} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

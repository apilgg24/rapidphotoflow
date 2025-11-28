import { useState, useRef, useCallback } from 'react';
import { Photo } from '../types';
import { uploadPhotos } from '../api';

interface UploadZoneProps {
  onUploadComplete: (photos: Photo[]) => void;
  onUploadStart: (files: File[]) => void;
  onError: (message: string) => void;
  onWarning: (message: string) => void;
}

export default function UploadZone({ onUploadComplete, onUploadStart, onError, onWarning }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const allFiles = Array.from(files);
    const imageFiles = allFiles.filter(file => file.type.startsWith('image/'));
    const nonImageFiles = allFiles.filter(file => !file.type.startsWith('image/'));
    
    // Warn about unsupported files
    if (nonImageFiles.length > 0) {
      const truncateName = (name: string, maxLen: number = 25) => {
        if (name.length <= maxLen) return name;
        const ext = name.split('.').pop() || '';
        const base = name.slice(0, name.length - ext.length - 1);
        const keep = maxLen - ext.length - 4; // 4 for "..." and "."
        return `${base.slice(0, keep)}...${ext}`;
      };
      
      if (nonImageFiles.length === 1) {
        onWarning(`Skipped "${truncateName(nonImageFiles[0].name)}" — only images allowed`);
      } else {
        onWarning(`Skipped ${nonImageFiles.length} unsupported files — only images allowed`);
      }
    }
    
    if (imageFiles.length === 0) {
      onError('No valid image files selected');
      return;
    }
    
    const fileArray = imageFiles;

    setIsUploading(true);
    setUploadProgress(`Uploading ${fileArray.length} photo${fileArray.length > 1 ? 's' : ''}...`);
    onUploadStart(fileArray);

    try {
      const photos = await uploadPhotos(fileArray);
      onUploadComplete(photos);
      setUploadProgress('');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete, onUploadStart, onError, onWarning]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="xc-w-full">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          xc-relative xc-border-2 xc-border-dashed xc-rounded-2xl xc-p-12
          xc-flex xc-flex-col xc-items-center xc-justify-center
          xc-cursor-pointer xc-transition-all xc-duration-200
          ${isDragging 
            ? 'xc-border-brand-500 xc-bg-brand-500/10' 
            : 'xc-border-surface-600 xc-bg-surface-900/50 hover:xc-border-surface-500 hover:xc-bg-surface-800/50'
          }
          ${isUploading ? 'xc-pointer-events-none xc-opacity-70' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Upload Icon */}
        <div className={`xc-mb-4 xc-p-4 xc-rounded-full ${isDragging ? 'xc-bg-brand-500/20' : 'xc-bg-surface-800'}`}>
          <svg 
            className={`xc-w-10 xc-h-10 ${isDragging ? 'xc-text-brand-400' : 'xc-text-surface-400'}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>

        {isUploading ? (
          <>
            <div className="xc-flex xc-items-center xc-gap-2 xc-mb-2">
              <svg className="xc-animate-spin xc-w-5 xc-h-5 xc-text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle className="xc-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="xc-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="xc-text-lg xc-font-medium xc-text-white">{uploadProgress}</span>
            </div>
          </>
        ) : (
          <>
            <h3 className="xc-text-lg xc-font-semibold xc-text-white xc-mb-1">
              {isDragging ? 'Drop photos here' : 'Upload Photos'}
            </h3>
            <p className="xc-text-surface-400 xc-text-sm xc-mb-4">
              Drag & drop images or click to browse
            </p>
            <div className="xc-flex xc-items-center xc-gap-2 xc-text-xs xc-text-surface-500">
              <span className="xc-px-2 xc-py-1 xc-bg-surface-800 xc-rounded">JPG</span>
              <span className="xc-px-2 xc-py-1 xc-bg-surface-800 xc-rounded">PNG</span>
              <span className="xc-px-2 xc-py-1 xc-bg-surface-800 xc-rounded">GIF</span>
              <span className="xc-px-2 xc-py-1 xc-bg-surface-800 xc-rounded">WebP</span>
            </div>
            <p className="xc-mt-4 xc-text-xs xc-text-surface-500">
              💡 You can upload up to <span className="xc-text-brand-400 xc-font-medium">500 MB</span> of photos at a time
            </p>
          </>
        )}
      </div>
    </div>
  );
}


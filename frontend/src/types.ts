export type PhotoStatus = "UPLOADED" | "PROCESSING" | "DONE" | "FAILED";

export interface Photo {
  id: string;
  filename: string;
  status: PhotoStatus;
  createdAt: string;
  updatedAt: string;
  imageUrl: string;
  size: number; // File size in bytes
}

export interface EventLogItem {
  timestamp: string;
  message: string;
  photoId?: string;
  type: 'upload' | 'status_change' | 'error' | 'info';
}

export type TabType = 'upload' | 'queue' | 'gallery';


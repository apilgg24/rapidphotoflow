import { Photo } from './types';

const API_BASE = '/photos';

/**
 * Fetch all photos from the backend
 */
export async function fetchPhotos(): Promise<Photo[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch photos: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch a single photo by ID
 */
export async function fetchPhoto(id: string): Promise<Photo> {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch photo: ${response.status}`);
  }
  return response.json();
}

/**
 * Upload multiple photos
 * @param files Array of File objects to upload
 * @returns Array of created Photo objects
 */
export async function uploadPhotos(files: File[]): Promise<Photo[]> {
  const formData = new FormData();
  
  // Backend expects "file" as the param name for each file
  files.forEach((file) => {
    formData.append('file', file);
  });

  const response = await fetch(API_BASE, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload photos: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a photo by ID
 */
export async function deletePhoto(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete photo: ${response.status}`);
  }
}

/**
 * Get the full image URL for a photo
 */
export function getImageUrl(photo: Photo): string {
  // The imageUrl from backend is relative, prepend the base if needed
  if (photo.imageUrl.startsWith('/')) {
    return photo.imageUrl;
  }
  return `${API_BASE}/${photo.id}/image`;
}


package com.rapidphotoflow.repository;

import com.rapidphotoflow.model.Photo;
import com.rapidphotoflow.model.PhotoStatus;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory repository for Photo entities using ConcurrentHashMap.
 * Thread-safe for concurrent access.
 */
@Repository
public class PhotoRepository {

    private final Map<UUID, Photo> photos = new ConcurrentHashMap<>();
    private final Map<UUID, byte[]> imageData = new ConcurrentHashMap<>();

    /**
     * Save a photo to the repository.
     */
    public Photo save(Photo photo) {
        photos.put(photo.getId(), photo);
        return photo;
    }

    /**
     * Save image bytes for a photo.
     */
    public void saveImageData(UUID photoId, byte[] data) {
        imageData.put(photoId, data);
    }

    /**
     * Find a photo by its ID.
     */
    public Optional<Photo> findById(UUID id) {
        return Optional.ofNullable(photos.get(id));
    }

    /**
     * Get image bytes for a photo.
     */
    public Optional<byte[]> getImageData(UUID photoId) {
        return Optional.ofNullable(imageData.get(photoId));
    }

    /**
     * Get all photos.
     */
    public List<Photo> findAll() {
        return new ArrayList<>(photos.values());
    }

    /**
     * Find all photos with a specific status.
     */
    public List<Photo> findByStatus(PhotoStatus status) {
        return photos.values().stream()
                .filter(photo -> photo.getStatus() == status)
                .toList();
    }

    /**
     * Delete a photo by its ID.
     */
    public void deleteById(UUID id) {
        photos.remove(id);
        imageData.remove(id);
    }

    /**
     * Check if a photo exists by ID.
     */
    public boolean existsById(UUID id) {
        return photos.containsKey(id);
    }

    /**
     * Get the count of all photos.
     */
    public long count() {
        return photos.size();
    }

    /**
     * Clear all photos (useful for testing).
     */
    public void clear() {
        photos.clear();
        imageData.clear();
    }
}


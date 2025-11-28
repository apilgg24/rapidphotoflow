package com.rapidphotoflow.service;

import com.rapidphotoflow.model.Photo;
import com.rapidphotoflow.model.PhotoStatus;
import com.rapidphotoflow.repository.PhotoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service layer for photo operations.
 */
@Service
public class PhotoService {

    private static final Logger log = LoggerFactory.getLogger(PhotoService.class);

    private final PhotoRepository photoRepository;

    public PhotoService(PhotoRepository photoRepository) {
        this.photoRepository = photoRepository;
    }

    /**
     * Upload a new photo.
     *
     * @param file The multipart file containing the image
     * @return The created Photo entity
     * @throws IOException If there's an error reading the file
     */
    public Photo uploadPhoto(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            filename = "unknown_" + System.currentTimeMillis();
        }

        // Store the image bytes in memory
        byte[] imageBytes = file.getBytes();
        
        // Create the photo entity with file size
        Photo photo = Photo.createNew(filename, imageBytes.length);
        photoRepository.saveImageData(photo.getId(), imageBytes);

        // Save and return the photo
        Photo savedPhoto = photoRepository.save(photo);
        log.info("Uploaded photo: id={}, filename={}, size={} bytes",
                savedPhoto.getId(), filename, imageBytes.length);

        return savedPhoto;
    }

    /**
     * Get all photos.
     */
    public List<Photo> getAllPhotos() {
        return photoRepository.findAll();
    }

    /**
     * Get a photo by ID.
     */
    public Optional<Photo> getPhotoById(UUID id) {
        return photoRepository.findById(id);
    }

    /**
     * Get image data for a photo.
     */
    public Optional<byte[]> getImageData(UUID photoId) {
        return photoRepository.getImageData(photoId);
    }

    /**
     * Get all photos with a specific status.
     */
    public List<Photo> getPhotosByStatus(PhotoStatus status) {
        return photoRepository.findByStatus(status);
    }

    /**
     * Update a photo's status.
     */
    public Optional<Photo> updatePhotoStatus(UUID id, PhotoStatus newStatus) {
        return photoRepository.findById(id)
                .map(photo -> {
                    PhotoStatus oldStatus = photo.getStatus();
                    photo.setStatus(newStatus);
                    photoRepository.save(photo);
                    log.info("Photo {} status changed: {} -> {}", id, oldStatus, newStatus);
                    return photo;
                });
    }

    /**
     * Delete a photo.
     */
    public void deletePhoto(UUID id) {
        photoRepository.deleteById(id);
        log.info("Deleted photo: {}", id);
    }
}


package com.rapidphotoflow.controller;

import com.rapidphotoflow.model.Photo;
import com.rapidphotoflow.service.PhotoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for photo operations.
 */
@RestController
@RequestMapping("/photos")
@CrossOrigin(origins = "*") // Allow CORS for frontend development
public class PhotoController {

    private static final Logger log = LoggerFactory.getLogger(PhotoController.class);

    private final PhotoService photoService;

    public PhotoController(PhotoService photoService) {
        this.photoService = photoService;
    }

    /**
     * Upload one or more photos.
     * POST /photos
     *
     * @param files The image files (multipart/form-data, field name: file)
     * @return List of created Photo objects
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<Photo>> uploadPhotos(@RequestParam("file") List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            log.warn("Attempted to upload with no files");
            return ResponseEntity.badRequest().build();
        }

        List<Photo> uploadedPhotos = new ArrayList<>();
        int skippedCount = 0;

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                log.warn("Skipping empty file");
                skippedCount++;
                continue;
            }

            // Validate that it's an image
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                log.warn("Skipping non-image file: {} ({})", file.getOriginalFilename(), contentType);
                skippedCount++;
                continue;
            }

            try {
                Photo photo = photoService.uploadPhoto(file);
                uploadedPhotos.add(photo);
            } catch (IOException e) {
                log.error("Error uploading photo: {}", file.getOriginalFilename(), e);
                skippedCount++;
            }
        }

        if (skippedCount > 0) {
            log.info("Uploaded {} photos, skipped {} files", uploadedPhotos.size(), skippedCount);
        }

        if (uploadedPhotos.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(uploadedPhotos);
    }

    /**
     * Get all photos.
     * GET /photos
     *
     * @return List of all Photo objects
     */
    @GetMapping
    public ResponseEntity<List<Photo>> getAllPhotos() {
        List<Photo> photos = photoService.getAllPhotos();
        return ResponseEntity.ok(photos);
    }

    /**
     * Get a specific photo's metadata.
     * GET /photos/{id}
     *
     * @param id The photo UUID
     * @return The Photo object
     */
    @GetMapping("/{id}")
    public ResponseEntity<Photo> getPhoto(@PathVariable UUID id) {
        return photoService.getPhotoById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get a photo's image data.
     * GET /photos/{id}/image
     *
     * @param id The photo UUID
     * @return The image bytes
     */
    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getPhotoImage(@PathVariable UUID id) {
        return photoService.getPhotoById(id)
                .flatMap(photo -> photoService.getImageData(id)
                        .map(imageData -> {
                            HttpHeaders headers = new HttpHeaders();
                            // Determine content type from filename
                            String filename = photo.getFilename().toLowerCase();
                            MediaType mediaType = MediaType.IMAGE_JPEG;
                            if (filename.endsWith(".png")) {
                                mediaType = MediaType.IMAGE_PNG;
                            } else if (filename.endsWith(".gif")) {
                                mediaType = MediaType.IMAGE_GIF;
                            } else if (filename.endsWith(".webp")) {
                                mediaType = MediaType.parseMediaType("image/webp");
                            }
                            headers.setContentType(mediaType);
                            headers.setContentLength(imageData.length);
                            // Use inline disposition so browser displays instead of downloads
                            headers.set("Content-Disposition", "inline; filename=\"" + photo.getFilename() + "\"");
                            return new ResponseEntity<>(imageData, headers, HttpStatus.OK);
                        }))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a photo.
     * DELETE /photos/{id}
     *
     * @param id The photo UUID
     * @return No content on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id) {
        if (photoService.getPhotoById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        photoService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }
}


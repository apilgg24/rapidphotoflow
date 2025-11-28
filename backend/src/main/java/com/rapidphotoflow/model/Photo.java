package com.rapidphotoflow.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Photo entity representing an uploaded image and its processing state.
 */
public class Photo {

    private UUID id;
    private String filename;
    private PhotoStatus status;
    private Instant createdAt;
    private Instant updatedAt;
    private String imageUrl;
    private long size; // File size in bytes

    public Photo() {
    }

    public Photo(UUID id, String filename, PhotoStatus status, Instant createdAt, Instant updatedAt, String imageUrl, long size) {
        this.id = id;
        this.filename = filename;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.imageUrl = imageUrl;
        this.size = size;
    }

    // Static factory method for creating a new photo upon upload
    public static Photo createNew(String filename, long size) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        return new Photo(
                id,
                filename,
                PhotoStatus.UPLOADED,
                now,
                now,
                "/photos/" + id + "/image",
                size
        );
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public PhotoStatus getStatus() {
        return status;
    }

    public void setStatus(PhotoStatus status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    @Override
    public String toString() {
        return "Photo{" +
                "id=" + id +
                ", filename='" + filename + '\'' +
                ", status=" + status +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", imageUrl='" + imageUrl + '\'' +
                ", size=" + size +
                '}';
    }
}


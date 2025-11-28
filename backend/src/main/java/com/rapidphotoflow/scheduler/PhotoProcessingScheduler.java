package com.rapidphotoflow.scheduler;

import com.rapidphotoflow.model.Photo;
import com.rapidphotoflow.model.PhotoStatus;
import com.rapidphotoflow.service.PhotoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Scheduled job that simulates photo processing workflow.
 * Transitions photos: UPLOADED → PROCESSING → DONE/FAILED
 */
@Component
public class PhotoProcessingScheduler {

    private static final Logger log = LoggerFactory.getLogger(PhotoProcessingScheduler.class);

    // Probability that a photo processing will fail (0% - only fail on actual errors)
    private static final double FAILURE_PROBABILITY = 0.0;

    // Minimum time a photo should be in PROCESSING state (in milliseconds)
    private static final long MIN_PROCESSING_TIME_MS = 3000;

    // Maximum additional random time for processing (in milliseconds)
    private static final long MAX_ADDITIONAL_PROCESSING_TIME_MS = 5000;

    private final PhotoService photoService;
    private final Random random = new Random();

    // Track when each photo started processing
    private final Map<UUID, Instant> processingStartTimes = new ConcurrentHashMap<>();

    public PhotoProcessingScheduler(PhotoService photoService) {
        this.photoService = photoService;
    }

    /**
     * Scheduled job that runs every 3 seconds.
     * Handles photo state transitions.
     */
    @Scheduled(fixedRate = 3000)
    public void processPhotos() {
        processUploadedPhotos();
        processProcessingPhotos();
    }

    /**
     * Move photos from UPLOADED to PROCESSING state.
     */
    private void processUploadedPhotos() {
        List<Photo> uploadedPhotos = photoService.getPhotosByStatus(PhotoStatus.UPLOADED);

        for (Photo photo : uploadedPhotos) {
            log.info("Starting processing for photo: {} ({})", photo.getId(), photo.getFilename());
            photoService.updatePhotoStatus(photo.getId(), PhotoStatus.PROCESSING);
            processingStartTimes.put(photo.getId(), Instant.now());
        }
    }

    /**
     * Move photos from PROCESSING to DONE or FAILED state after sufficient delay.
     */
    private void processProcessingPhotos() {
        List<Photo> processingPhotos = photoService.getPhotosByStatus(PhotoStatus.PROCESSING);

        for (Photo photo : processingPhotos) {
            Instant startTime = processingStartTimes.get(photo.getId());

            // If we don't have a start time recorded, record it now
            if (startTime == null) {
                processingStartTimes.put(photo.getId(), Instant.now());
                continue;
            }

            // Calculate how long the photo has been processing
            long elapsedMs = Instant.now().toEpochMilli() - startTime.toEpochMilli();

            // Generate a random processing time for this photo (if not already generated)
            long requiredProcessingTime = MIN_PROCESSING_TIME_MS +
                    (long) (random.nextDouble() * MAX_ADDITIONAL_PROCESSING_TIME_MS);

            // Check if enough time has passed
            if (elapsedMs >= requiredProcessingTime) {
                // Determine if processing should succeed or fail
                boolean shouldFail = random.nextDouble() < FAILURE_PROBABILITY;
                PhotoStatus newStatus = shouldFail ? PhotoStatus.FAILED : PhotoStatus.DONE;

                log.info("Completing processing for photo: {} ({}) -> {}",
                        photo.getId(), photo.getFilename(), newStatus);

                photoService.updatePhotoStatus(photo.getId(), newStatus);
                processingStartTimes.remove(photo.getId());
            }
        }
    }
}


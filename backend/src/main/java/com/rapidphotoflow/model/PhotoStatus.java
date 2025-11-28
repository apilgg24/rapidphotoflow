package com.rapidphotoflow.model;

/**
 * Enum representing the processing status of a photo.
 * Photos move through these states: UPLOADED → PROCESSING → DONE/FAILED
 */
public enum PhotoStatus {
    UPLOADED,
    PROCESSING,
    DONE,
    FAILED
}


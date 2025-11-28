# RapidPhotoFlow – Design Document (Apil)

## 1. Overview

**RapidPhotoFlow** is a lightweight web application that demonstrates a complete **photo upload → processing → review** workflow, tailored to field service use cases. It showcases how field technicians’ photos can be ingested, processed (potentially by AI), and reviewed with clear statuses and an event log.

This project is built **AI-first**: all application code will be generated using AI tools (ChatGPT, Cursor with Claude Sonnet 4.5) with minimal manual editing.

---

## 2. Context & Problem

In field service SaaS, photos are increasingly critical:

- Technicians capture **before/after** images of jobs.
- Operations teams rely on photos for **verification, compliance, damage assessment**, and **reporting**.
- AI-driven analysis (quality checks, object detection, damage classification, text/OCR) is becoming standard.

However, many systems lack a **clear, transparent workflow** showing how photos move through stages: *uploaded → in processing → ready for review*, and what exactly happened at each step.

**RapidPhotoFlow** addresses this by providing a small but realistic **photo workflow micro-app** that could be integrated into a larger field service platform.

---

## 3. Goals & Non-Goals

### Goals

- Provide a clean, end-to-end **photo workflow demo**:
  - Upload multiple photos concurrently.
  - Simulate asynchronous processing.
  - Display photos in a gallery with clear status indicators.
  - Maintain a human-readable event/workflow log.
- Use **modern, minimal UI** suitable for internal tools.
- Demonstrate a design that can later plug in real AI photo processing.

### Non-Goals

- Not a full Google Photos / iOS Photos / Google Drive clone.
- No multi-tenant auth, complex permissions, or long-term storage policies.
- No advanced search, albums, or sharing features.

---

## 4. Users & User Stories

### Primary user

- **Ops / back-office user** reviewing field photos for a job (or internal demo user in the hackathon).

### User stories

1. **Upload photos**  
   As a user, I can drag-and-drop or select multiple photos at once so that I can quickly ingest all images from a job.

2. **See processing progress**  
   As a user, I can see each photo’s status (Uploaded, Processing, Done, Failed) so I know where it is in the workflow.

3. **Review completed photos**  
   As a user, I can view a gallery of completed photos, with basic metadata and status.

4. **Understand the workflow**  
   As a user, I can see a chronological log of key events (upload, processing start, processing completion) so I can understand and debug the workflow.

---

## 5. System Overview & Architecture

### Tech stack

- **Frontend:** React (TypeScript, Vite) – single-page app.
- **Backend:** Java 21 + Spring Boot 3 – REST API.
- **Storage:** In-memory store for metadata (e.g., `ConcurrentHashMap`) and local file storage for images (or in-memory only for demo).
- **AI tools for development:**  
  - ChatGPT (design, prompting, architecture, refactoring ideas).  
  - Cursor + Claude Sonnet 4.5 (code generation for frontend & backend).

### High-level architecture

- **Frontend SPA**
  - 3 main views/tabs:
    1. **Upload Photos** – file input / dropzone; triggers uploads.
    2. **Processing Queue** – list of non-completed photos with statuses.
    3. **Review Photos** – gallery of completed photos.
  - **Event Log** panel visible across views.
  - Periodic polling of backend (`GET /photos`) to refresh statuses.

- **Backend service**
  - Exposes REST endpoints for:
    - Uploading photos.
    - Listing photos and their statuses.
  - Uses an **internal scheduler** to simulate async processing:
    - Transition `UPLOADED → PROCESSING → DONE/FAILED` with delays.
  - (Optional) placeholder/methods where real AI calls could later be added.

---

## 6. Data Model

### Entities

**Photo**

- `id: string` (UUID)
- `filename: string`
- `status: PhotoStatus`
- `createdAt: Instant`
- `updatedAt: Instant`
- `imageUrl: string` (URL for serving the image)
- (Optional future fields)
  - `tags: string[]` (e.g., “meter”, “pipe”, “rust”)
  - `notes: string` (AI-generated or manual summary)
  - `jobId: string` (if linked to a specific field service job)

**PhotoStatus** (enum)

- `UPLOADED`
- `PROCESSING`
- `DONE`
- `FAILED`

**Event** (frontend only for v1)

- `timestamp: string`
- `message: string`
- (Optionally) `photoId: string`

---

## 7. API Design (Initial)

**POST `/photos`**

- **Purpose:** Upload a new photo.
- **Request:** `multipart/form-data` with:
  - `file`: image file (PNG/JPEG).
- **Response (JSON):**
  ```json
  {
    "id": "uuid",
    "filename": "job-123-before.jpg",
    "status": "UPLOADED",
    "createdAt": "2025-11-27T10:00:00Z",
    "updatedAt": "2025-11-27T10:00:00Z",
    "imageUrl": "/photos/{id}/image"
  }
  ```

**GET `/photos`**

- **Purpose:** Fetch all photos and statuses.
- **Response:** Array of `Photo` objects.

**GET `/photos/{id}/image`** (optional)

- **Purpose:** Serve the image content (or redirect to object storage).

*(Optional, if needed for more explicit control)*  
**PATCH `/photos/{id}/status`**

- Used internally/by tests to manipulate status, but likely unnecessary if scheduler handles transitions.

---

## 8. Processing Workflow

### State machine

Each photo moves through these states:

1. **UPLOADED**  
   Immediately after `POST /photos` succeeds.

2. **PROCESSING**  
   A scheduled job runs every N seconds (e.g., 3–5s), finds photos in `UPLOADED`, and updates them to `PROCESSING`.

3. **DONE** or **FAILED**  
   After a random or fixed delay from `PROCESSING`, the scheduler updates the status to `DONE` (mostly) or `FAILED` (occasionally to simulate errors).

The frontend polls `GET /photos` periodically (e.g., every 2–3 seconds) and updates the UI. If a status change is detected, it appends a new entry to the **event log**.

### Future AI integration (beyond MVP)

- When transitioning from `PROCESSING → DONE`, the backend could:
  - Call an image analysis API and fill `tags` and `notes`.
  - For field service, this might include:
    - Detecting if required objects are present (e.g., meter, valve).
    - Estimating damage severity.
    - Performing OCR on labels/meters.

This is **out of strict scope** for MVP, but the architecture leaves a clear hook (`processPhoto(photoId)`) for this.

---

## 9. AI Usage Plan (Hackathon Angle)

1. **Development co-pilot**
   - Use ChatGPT to:
     - Draft architecture and data model (this doc).
     - Draft specs/prompts for Cursor.
     - Review and refine design.
   - Use Cursor + Claude Sonnet 4.5 to:
     - Generate the Spring Boot project (controllers, models, scheduler).
     - Generate the React app (components, hooks, API client).
     - Implement tests and small refactors via AI instructions.

2. **(Optional) Product AI**
   - If time permits, add a simple AI step:
     - Use a vision API to generate tags or a one-line description when a photo reaches `DONE`.
     - Display these tags in the Review view as “AI insights”.

3. **Documentation**
   - Document in the README which parts were AI-generated and show example prompts.

---

## 10. Implementation Plan / Milestones

**Phase 1 – Skeleton (Backend + Frontend)**  
- Generate Spring Boot project with `/photos` endpoints and in-memory storage.  
- Generate React app with basic layout and manual mock data.

**Phase 2 – End-to-end workflow**  
- Connect frontend upload to `POST /photos`.  
- Implement polling to `GET /photos` and display statuses.  
- Implement scheduler for status transitions.

**Phase 3 – UX & event log**  
- Build a minimal, modern UI: tabs/views, gallery, queue table.  
- Implement event log in frontend based on:
  - Upload start/success.
  - Status changes detected during polling.

**Phase 4 – Polish & (Optional) AI features**  
- Add filters, badges, and responsive layout.  
- Optionally, integrate a simple AI tagging/summary step on `DONE`.  
- Add short README and screenshots for demo.

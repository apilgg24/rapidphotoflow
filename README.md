# RapidPhotoFlow

**Photo upload & processing workflow** — A lightweight web application demonstrating a complete photo upload → processing → review workflow, built for field service use cases.

![RapidPhotoFlow](https://img.shields.io/badge/Built%20with-AI--First-blueviolet) ![Java](https://img.shields.io/badge/Java-21-orange) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)

---

## 🎯 Overview

RapidPhotoFlow showcases how field technicians' photos can be ingested, processed, and reviewed with clear statuses and an event log. Built **AI-first** using Cursor + Claude.

### Key Features

- 📤 **Batch Upload** — Drag & drop multiple photos at once
- ⏱️ **Processing Queue** — Live progress with time remaining estimates
- 🖼️ **Photo Gallery** — Grid/List views with file sizes, bulk delete
- 📋 **Event Log** — Real-time activity feed
- 🔔 **Toast Notifications** — Success/warning/error feedback

---

## 🏗️ Architecture

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐
│                 │ ◄─────────────────► │                 │
│  React Frontend │                     │  Spring Boot    │
│  (TypeScript)   │     /photos API     │  Backend (Java) │
│                 │                     │                 │
└─────────────────┘                     └─────────────────┘
     Port 5173                              Port 8080
         │                                      │
         │                                      ▼
         │                              ┌─────────────────┐
         │                              │  In-Memory      │
         └──── Polls every 3s ─────────►│  Storage        │
                                        │  (HashMap)      │
                                        └─────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Java 21, Spring Boot 3.2, Maven |
| **Storage** | In-memory (ConcurrentHashMap) |

---

## 🚀 Quick Start

### Prerequisites

- **Java 21** (or 17+)
- **Node.js 18+**
- **Maven** (or use included wrapper)

### 1. Start the Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on **http://localhost:8080**

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/photos` | Upload photos (multipart/form-data) |
| `GET` | `/photos` | List all photos |
| `GET` | `/photos/{id}` | Get photo metadata |
| `GET` | `/photos/{id}/image` | Get image bytes |
| `DELETE` | `/photos/{id}` | Delete a photo |

### Photo Status Flow

```
UPLOADED (Queued) → PROCESSING → DONE
```

---

## 🖥️ Screenshots

### Upload View
Drag & drop zone with supported file types and 500MB limit indicator.

### Processing Queue
Live progress bar, time remaining estimate, per-photo progress.

### Photo Gallery
Grid and List views with file sizes, bulk selection (list view), and lightbox preview.

---

## 📁 Project Structure

```
rapidphotoflow/
├── backend/                    # Spring Boot API
│   ├── src/main/java/com/rapidphotoflow/
│   │   ├── controller/         # REST endpoints
│   │   ├── service/            # Business logic
│   │   ├── repository/         # In-memory storage
│   │   ├── model/              # Photo entity
│   │   └── scheduler/          # Processing workflow
│   └── pom.xml
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Custom hooks
│   │   ├── api.ts              # Backend client
│   │   └── App.tsx             # Main app
│   └── package.json
│
└── README.md
```

---

## 🤖 AI-First Development

This project was built using AI tools:

- **Cursor + Claude** — Code generation for frontend & backend
- **ChatGPT** — Architecture design, prompting, refinement

### Example Prompts Used

1. *"Create a Spring Boot 3 backend with Photo entity, REST endpoints, and scheduled processing"*
2. *"Build a React frontend with drag-drop upload, processing queue with time estimates, and photo gallery"*
3. *"Add toast notifications for unsupported files and batch delete in list view"*

---

## 🔮 Future Enhancements

- [ ] Real AI processing (image analysis, tagging)
- [ ] Persistent storage (PostgreSQL + S3)
- [ ] User authentication
- [ ] Mobile-responsive design improvements

---

## 👤 Author

**Apil** — Built for hackathon demonstration

---

## 📄 License

MIT License — feel free to use and modify.


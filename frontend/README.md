# RapidPhotoFlow Frontend

A React + TypeScript + Vite frontend for the RapidPhotoFlow photo upload and processing workflow application.

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** with `xc-` prefix for utility classes

## Prerequisites

- **Node.js 18+** installed
- Backend server running on `http://localhost:8080`

## Getting Started

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── UploadZone.tsx      # Drag-and-drop upload
│   │   ├── ProcessingQueue.tsx # Processing status list
│   │   ├── PhotoGallery.tsx    # Photo grid with lightbox
│   │   ├── EventLog.tsx        # Activity log
│   │   ├── StatusBadge.tsx     # Status indicator
│   │   └── TabButton.tsx       # Navigation tabs
│   ├── hooks/
│   │   └── usePolling.ts       # Polling hook for live updates
│   ├── api.ts                  # Backend API client
│   ├── types.ts                # TypeScript interfaces
│   ├── App.tsx                 # Main application
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind imports
├── tailwind.config.js          # Tailwind with xc- prefix
├── vite.config.ts              # Vite config with proxy
└── package.json
```

## Features

### Upload Photos
- Drag-and-drop or click to select
- Multiple file upload support
- Image validation (JPG, PNG, GIF, WebP)

### Processing Queue
- Live view of photos being processed
- Status badges (UPLOADED, PROCESSING)
- Auto-refreshes every 2.5 seconds

### Photo Gallery
- Grid view of completed photos
- Click to view full-size in lightbox
- Delete photos
- Status indicators (DONE, FAILED)

### Event Log
- Real-time activity feed
- Tracks uploads, status changes, errors
- Timestamped entries

## API Integration

The frontend proxies API requests to the backend:

| Frontend Request | Backend Request |
|-----------------|-----------------|
| `/photos` | `http://localhost:8080/photos` |
| `/photos/{id}` | `http://localhost:8080/photos/{id}` |
| `/photos/{id}/image` | `http://localhost:8080/photos/{id}/image` |

## Tailwind CSS Prefix

All Tailwind utilities use the `xc-` prefix:

```jsx
// Example usage
<div className="xc-bg-surface-900 xc-text-white xc-p-4 xc-rounded-xl">
  Content
</div>
```

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Development Notes

- Polling interval: 2.5 seconds
- Max events in log: 100
- Supports dark theme only
- Responsive design for mobile/tablet/desktop


# RapidPhotoFlow Backend

A Spring Boot 3 backend service for the RapidPhotoFlow photo upload and processing workflow application.

## Technology Stack

- **Java 21**
- **Spring Boot 3.2.0**
- **Maven** (build tool)
- **In-memory storage** (ConcurrentHashMap)

## Project Structure

```
backend/
├── src/main/java/com/rapidphotoflow/
│   ├── RapidPhotoFlowApplication.java    # Main application entry point
│   ├── controller/
│   │   └── PhotoController.java          # REST API endpoints
│   ├── model/
│   │   ├── Photo.java                    # Photo entity
│   │   └── PhotoStatus.java              # Status enum
│   ├── repository/
│   │   └── PhotoRepository.java          # In-memory data store
│   ├── scheduler/
│   │   └── PhotoProcessingScheduler.java # Background processing job
│   └── service/
│       └── PhotoService.java             # Business logic
├── src/main/resources/
│   └── application.yml                   # Configuration
└── pom.xml                               # Maven build file
```

## Prerequisites

- **Java 21** or later installed
- **Maven 3.8+** installed (or use the included wrapper)

## Running the Application

### Using Maven

```bash
cd backend
mvn spring-boot:run
```

### Using the JAR file

```bash
cd backend
mvn clean package
java -jar target/rapidphotoflow-backend-1.0.0-SNAPSHOT.jar
```

The server will start on `http://localhost:8080`.

## API Endpoints

### Upload Photo
```
POST /photos
Content-Type: multipart/form-data

Field: file (image file)
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "job-123-before.jpg",
  "status": "UPLOADED",
  "createdAt": "2025-11-27T10:00:00Z",
  "updatedAt": "2025-11-27T10:00:00Z",
  "imageUrl": "/photos/550e8400-e29b-41d4-a716-446655440000/image"
}
```

### List All Photos
```
GET /photos
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "job-123-before.jpg",
    "status": "DONE",
    "createdAt": "2025-11-27T10:00:00Z",
    "updatedAt": "2025-11-27T10:00:05Z",
    "imageUrl": "/photos/550e8400-e29b-41d4-a716-446655440000/image"
  }
]
```

### Get Photo Metadata
```
GET /photos/{id}
```

### Get Photo Image
```
GET /photos/{id}/image
```

Returns the image binary data with appropriate content-type header.

### Delete Photo
```
DELETE /photos/{id}
```

## Photo Processing Workflow

Photos automatically transition through the following states:

1. **UPLOADED** - Initial state after upload
2. **PROCESSING** - Scheduler picks up the photo (every 3 seconds)
3. **DONE** or **FAILED** - Processing completes after 3-8 seconds
   - 90% chance of success (DONE)
   - 10% chance of failure (FAILED)

The scheduled job runs every 3 seconds and handles state transitions.

## Configuration

Key configuration in `application.yml`:

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | 8080 | Server port |
| `spring.servlet.multipart.max-file-size` | 10MB | Max upload file size |
| `spring.servlet.multipart.max-request-size` | 10MB | Max request size |

## CORS

CORS is enabled for all origins (`*`) to support frontend development. For production, restrict this to specific origins.

## Example Usage with cURL

```bash
# Upload a photo
curl -X POST http://localhost:8080/photos \
  -F "file=@/path/to/your/image.jpg"

# List all photos
curl http://localhost:8080/photos

# Get photo metadata
curl http://localhost:8080/photos/{photo-id}

# Download photo image
curl http://localhost:8080/photos/{photo-id}/image --output downloaded.jpg

# Delete a photo
curl -X DELETE http://localhost:8080/photos/{photo-id}
```

## Development Notes

- This is a demo/hackathon project with in-memory storage
- All data is lost when the server restarts
- Image files are stored in memory (not on disk)
- The processing workflow is simulated, not real AI processing


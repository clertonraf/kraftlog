# Routine Import Feature

## Overview

The Routine Import feature allows users to import complete workout routines from XLSX files. This feature integrates the KraftLog mobile app with the KraftLogImport service to parse structured Excel files and automatically create routines, workouts, and exercises in the system.

## Architecture

### Components

1. **Frontend (React Native/Expo)**
   - `services/routineImportService.ts`: Service for communicating with the import API
   - `app/(tabs)/routines.tsx`: Updated with import button and file picker

2. **Import Service (Spring Boot - Port 8082)**
   - `KraftLogImport`: Microservice that parses XLSX files
   - Endpoint: `POST /api/routine-import/import`
   - Docker image: `kraftlog-import:latest`

3. **Backend API (Spring Boot - Port 8080)**
   - `KraftLogApi`: Main API that stores routines, workouts, and exercises
   - Receives data from import service via REST calls

4. **Database (PostgreSQL - Port 5433)**
   - Stores all workout data

### Data Flow

```
User selects XLSX file
       ↓
Frontend (expo-document-picker)
       ↓
routineImportService (port 8082)
       ↓
KraftLogImport parses XLSX
       ↓
Creates routine via KraftLogApi (port 8080)
       ↓
Stores in PostgreSQL
       ↓
Returns import results to Frontend
       ↓
User sees success/failure statistics
```

## XLSX File Format

The import service expects XLSX files with the following structure:

### Worksheet Layout
- **5 workouts** arranged in columns
- **Workout 1**: Column B (rows 2-16)
- **Workout 2**: Column F (rows 2-16)
- **Workout 3**: Column J (rows 2-16)
- **Workout 4**: Column B (rows 18-32)
- **Workout 5**: Column F (rows 18-32)

### Columns per Workout
- **Column 1**: Workout name (row 2) and Exercise names
- **Column 2**: Sets x Repetitions (e.g., "3x12")
- **Column 3**: Advanced Technique (optional)
- **Row 16**: Rest interval (e.g., "1 a 2 minutos")

### Example Structure
```
     B            C         D
2  | Push Day  |           |
3  |           |           |
4  | Bench Press| 4x8     | Drop Set
5  | Incline DB | 3x12    |
6  | Tricep Dip | 3x10    |
...
16 | 1 a 2 minutos         |
```

## Usage

### For Users

1. **Open the App**
   - Navigate to the "Routines" tab

2. **Import a Routine**
   - Tap the "Import" button in the header
   - Select an XLSX file from your device
   - Wait for the import to complete

3. **Review Results**
   - Success message shows:
     - Workouts imported: X/Y successful
     - Exercises imported: X/Y successful
   - Any errors are listed

### For Developers

#### Starting the Services

```bash
# From the kraftlog directory
./scripts/start-backend.sh

# Or manually with docker-compose
docker-compose up -d
```

This starts:
- PostgreSQL (port 5433)
- Backend API (port 8080)
- Import Service (port 8082)

#### Testing the Import

```bash
# Test import endpoint directly
curl -X POST http://localhost:8082/api/routine-import/import \
  -H "Content-Type: multipart/form-data" \
  -F "file=@routine.xlsx" \
  -F "userId=<user-uuid>"
```

#### Running the App

```bash
# Start Expo
npx expo start

# Press 'i' for iOS simulator
# Or scan QR code for physical device
```

## API Endpoints

### Import Service (Port 8082)

#### Import Routine
```
POST /api/routine-import/import
Content-Type: multipart/form-data

Parameters:
- file: XLSX file
- userId: User UUID

Response:
{
  "success": true,
  "message": "Import completed successfully",
  "result": {
    "routineName": "My Routine",
    "routineId": "uuid",
    "totalWorkouts": 5,
    "successfulWorkouts": 5,
    "failedWorkouts": 0,
    "totalExercises": 25,
    "successfulExercises": 25,
    "failedExercises": 0,
    "errors": []
  }
}
```

#### Generate JSON Preview
```
POST /api/routine-import/generate-json
Content-Type: multipart/form-data

Parameters:
- file: XLSX file

Response:
{
  "success": true,
  "json": "{ ... }"
}
```

## Docker Configuration

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5433:5432"
    # ...

  backend:
    image: kraftlog-api:latest
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    # ...

  import-service:
    image: kraftlog-import:latest
    ports:
      - "8082:8082"
    environment:
      KRAFTLOG_API_URL: http://backend:8080
      SERVER_PORT: 8082
    depends_on:
      - backend
    # ...
```

## Implementation Details

### Frontend Service

The `routineImportService` handles:
- File upload with proper headers
- Authentication token injection
- Platform-specific API URL resolution (iOS/Android)
- Error handling and result parsing

### Import Processing

1. **XLSX Parsing**
   - Apache POI library reads Excel file
   - Extracts workout names, exercises, sets/reps, techniques
   - Parses rest intervals

2. **Routine Creation**
   - Creates routine in KraftLogApi
   - For each workout:
     - Creates workout
     - For each exercise:
       - Searches for existing exercise
       - Creates new exercise if not found
       - Links exercise to workout with details

3. **Error Handling**
   - Continues on individual failures
   - Collects error messages
   - Returns comprehensive statistics

### Muscle Group Mapping

The import service can automatically assign muscle groups to exercises based on name patterns. Configuration file: `exercise-muscle-groups.yml`

Example:
```yaml
muscleGroupMappings:
  BENCH: Chest
  SQUAT: Legs
  DEADLIFT: Back
  CURL: Arms
```

## Testing

### Unit Tests

```bash
cd /Users/clerton/workspace/KraftLogImport
mvn test
```

### Integration Tests

```bash
cd /Users/clerton/workspace/KraftLogApi
mvn test
```

### E2E Tests (Planned)

Future E2E tests will:
1. Start all Docker services
2. Upload a sample XLSX file
3. Verify routine creation
4. Check exercise details
5. Validate data in database

## Troubleshooting

### Import Service Won't Start

```bash
# Check logs
docker logs kraftlog-import

# Common issues:
# - Port 8082 already in use
# - Backend API not ready
# - Missing Docker image
```

### Import Fails

**Check:**
1. XLSX file format matches expected structure
2. User ID is valid
3. Backend API is accessible
4. Database connection is working

**Logs:**
```bash
docker logs kraftlog-import --tail 100
docker logs kraftlog-backend --tail 100
```

### File Not Uploading

**Mobile:**
- Ensure `expo-document-picker` permissions are granted
- Check file size limits
- Verify network connectivity

**Web:**
- CORS policy may block uploads
- Check browser console for errors

## Future Enhancements

1. **Validation**
   - Pre-import validation of XLSX format
   - Show preview before importing
   - Better error messages for malformed files

2. **Bulk Operations**
   - Import multiple routines at once
   - Export routines to XLSX
   - Routine templates library

3. **Advanced Features**
   - Custom column mappings
   - Support for PDF import
   - Image attachments for exercises
   - Video URL imports

4. **Testing**
   - Comprehensive E2E test suite
   - Performance testing for large files
   - Maestro test flows

## Related Documentation

- [KraftLogImport README](../KraftLogImport/README.md)
- [KraftLogApi README](../KraftLogApi/README.md)
- [Docker Deployment Guide](./DOCKER_DEPLOYMENT.md)

## Contributing

When contributing to this feature:

1. **Backend changes**: Update KraftLogApi repository
2. **Import service changes**: Update KraftLogImport repository
3. **Frontend changes**: Update this repository
4. **Always test** the complete flow end-to-end
5. **Update tests** for any new functionality
6. **Document** any changes to XLSX format expectations

## Support

For issues or questions:
1. Check the logs first
2. Review this documentation
3. Check related issues in GitHub
4. Create a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs
   - Sample XLSX file (if applicable)

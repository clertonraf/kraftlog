# Backend Fix Plan

## Issues Identified

### 1. Exercise DTO Missing Timestamps ✅ CRITICAL
**Problem**: `ExerciseResponse` DTO doesn't include `createdAt` and `updatedAt` fields
**Impact**: Frontend sync fails with "NOT NULL constraint failed: exercises.created_at"
**Location**: `/Users/clerton/workspace/KraftLogApi/src/main/java/com/kraftlog/dto/ExerciseResponse.java`
**Fix**: Add timestamp fields to the DTO

### 2. Docker Images Not Built ✅ CRITICAL
**Problem**: `kraftlog-api:latest` and `kraftlog-import:latest` images don't exist
**Impact**: Backend services won't start
**Location**: Docker images need to be built from KraftLogApi and KraftLogImport projects
**Fix**: Created `build-docker-images.sh` script

### 3. Token Expiration Handling ✅ DONE
**Problem**: Expired tokens cause 403 errors
**Impact**: User gets errors but isn't logged out
**Location**: `/Users/clerton/workspace/kraftlog/services/api.ts`
**Status**: Already implemented correctly (lines 77-92)

### 4. Health Endpoint ✅ EXISTS
**Problem**: Frontend calls `/api/health` which returns 500
**Status**: Backend has `/api/health` endpoint correctly implemented
**Root Cause**: Likely timing issue during startup or Docker networking issue

### 5. Routine Import Errors
**Problem**: Import fails with "Failed to create routine in KraftLog API"
**Impact**: Users can't import routines from XLSX files
**Location**: Import service and communication with API
**Fix**: Need to verify import service configuration and add better error handling

## Implementation Plan

### Phase 1: Build Docker Images ✅ IN PROGRESS
1. Build kraftlog-api:latest from KraftLogApi
2. Build kraftlog-import:latest from KraftLogImport

### Phase 2: Fix Exercise Response DTO
1. Add `createdAt` and `updatedAt` fields to ExerciseResponse
2. Update mapping to include these fields  
3. Rebuild Docker image

### Phase 3: Test Backend Services
1. Start all services with docker-compose
2. Verify health endpoints
3. Test exercise sync
4. Test routine import

### Phase 4: Frontend Adjustments
1. Verify token expiration handling works
2. Test routine import flow
3. Add E2E tests for token expiration

## Files to Modify

### Backend (KraftLogApi)
- `src/main/java/com/kraftlog/dto/ExerciseResponse.java` - Add timestamp fields

### Frontend (kraftlog)
- Scripts already created for building and managing Docker images
- No frontend code changes needed (token handling already correct)

## Testing Checklist

- [ ] Docker images build successfully
- [ ] Backend starts and responds to /actuator/health
- [ ] Backend responds to /api/health
- [ ] Exercise list includes createdAt/updatedAt
- [ ] Frontend syncs exercises without errors
- [ ] Token expiration logs user out correctly
- [ ] Routine import works from XLSX file
- [ ] E2E tests pass

# Backend Fixes Summary

## Issues Identified and Fixed

### 1. Import Service Authentication Issue ⚠️ NEEDS BACKEND CODE FIX
**Problem:** Import service is failing with error "email: Email is required" when trying to authenticate with KraftLog API.

**Root Cause:** The import service needed admin credentials (ADMIN_EMAIL and ADMIN_PASSWORD) to authenticate with the backend API. Environment variables were added to docker-compose.yml and are correctly set in the container, BUT the KraftLogImport application code is not reading these environment variables.

**Solution (Partial):** Added ADMIN_EMAIL and ADMIN_PASSWORD environment variables to the import-service configuration in docker-compose.yml:
```yaml
import-service:
  environment:
    KRAFTLOG_API_URL: http://backend:8080
    SERVER_PORT: 8082
    ADMIN_EMAIL: ${ADMIN_EMAIL:-admin@kraftlog.com}
    ADMIN_PASSWORD: ${ADMIN_PASSWORD:-admin123}
```

**Required Backend Code Changes (KraftLogImport repository):**

The `KraftLogApiClient.java` needs to be updated to read the ADMIN_EMAIL and ADMIN_PASSWORD from environment variables. Current code appears to have empty credentials.

Update the authentication method to:
```java
@Value("${ADMIN_EMAIL:admin@kraftlog.com}")
private String adminEmail;

@Value("${ADMIN_PASSWORD:admin123}")
private String adminPassword;

public void authenticate() {
    // Use adminEmail and adminPassword instead of empty strings
    LoginRequest request = new LoginRequest(adminEmail, adminPassword);
    // ... rest of authentication logic
}
```

**Verification:**
```bash
# Environment variables are correctly set:
$ docker exec kraftlog-import env | grep ADMIN
ADMIN_EMAIL=admin@kraftlog.com
ADMIN_PASSWORD=admin123

# But authentication still fails because code doesn't use them
```

**Status:** Docker config fixed ✅ | Backend code needs update ⚠️

---

### 2. Database Schema - Exercise timestamps ✅
**Problem:** Error "NOT NULL constraint failed: exercises.created_at" when syncing exercises from the API.

**Root Cause:** The backend API doesn't return `created_at` and `updated_at` fields for exercises, but the local SQLite schema requires these fields to be NOT NULL.

**Solution:** Already implemented in `services/syncService.ts` (lines 336-348):
- Code provides default timestamps when fields are missing from API response
- Uses `exercise.createdAt || exercise.created_at || now` pattern
- Wrapped in try-catch to continue syncing even if individual exercises fail

**Status:** Already fixed in code

---

### 3. Token Expiry Handling ✅
**Problem:** Users needed better handling when their JWT token expires.

**Solution:** Already implemented in `services/api.ts` (lines 76-92):
- Intercepts 401/403 responses
- Clears stored token and user data
- Triggers global auth error callback
- Shows user-friendly error message
- Redirects to login screen

**Status:** Already implemented

---

### 4. Web Platform SQLite Issue ⚠️
**Problem:** Web bundler shows errors about missing wa-sqlite.wasm module.

**Root Cause:** SQLite is not supported on web platforms, but the module is still being imported.

**Current Status:** Partially handled - code checks Platform.OS === 'web' and skips database operations, but bundler still tries to resolve the import.

**Solution in Place:** 
- Database service returns null on web (line 9 in `services/database.ts`)
- App uses API-only mode on web
- Sync service skips local database operations on web

**Note:** The bundler warning is cosmetic and doesn't affect functionality. SQLite operations are properly skipped on web.

---

## Testing

### Routine Import Test
To test the routine import functionality:

1. Ensure Docker services are running:
   ```bash
   docker-compose ps
   ```

2. Backend should show "Up" status
3. Import service should show "Up" status
4. Access the web app and try importing the XLSX file from `tmp/2025-12-23.xlsx`

### Expected Behavior:
- Import service authenticates with backend using admin credentials
- XLSX file is parsed and routine is created
- Workouts and exercises are imported with proper associations
- User sees success message with import statistics

---

## Configuration Files Modified

1. **docker-compose.yml**
   - Added ADMIN_EMAIL environment variable to import-service
   - Added ADMIN_PASSWORD environment variable to import-service

---

## Remaining Notes

### Required Changes in Backend Repositories

#### KraftLogImport Repository
File: `src/main/java/com/kraftlog/pdfimport/client/KraftLogApiClient.java`

The authentication method needs to read credentials from environment variables:

```java
@Component
public class KraftLogApiClient {
    
    @Value("${ADMIN_EMAIL:admin@kraftlog.com}")
    private String adminEmail;
    
    @Value("${ADMIN_PASSWORD:admin123}")
    private String adminPassword;
    
    @Value("${KRAFTLOG_API_URL:http://localhost:8080}")
    private String apiUrl;
    
    // Update authenticate method to use these values
    public String authenticate() throws IOException {
        LoginRequest request = new LoginRequest();
        request.setEmail(adminEmail);
        request.setPassword(adminPassword);
        
        // ... rest of authentication logic
    }
}
```

**Why:** The application currently has hardcoded empty credentials or is not reading from environment variables properly.

**Test after fix:**
```bash
# Rebuild import service image
cd /path/to/KraftLogImport
docker build -t kraftlog-import:latest .

# Restart services
cd /path/to/kraftlog
docker-compose down
docker-compose up -d

# Test import
./scripts/test-backend-services.sh
```

---

### Health Check Endpoints
- Backend uses `/actuator/health` (Spring Boot Actuator)
- Sync service uses HEAD request to `/exercises` endpoint for connectivity check
- This is working as expected

### Docker Image Dependencies
- Backend: `kraftlog-api:latest`
- Import Service: `kraftlog-import:latest`
- Database: `postgres:16-alpine`

Both backend images should be rebuilt from their respective repositories when backend code changes are needed.

---

## Next Steps

1. **Test Routine Import**: Verify XLSX import works end-to-end
2. **Monitor Logs**: Check for any remaining authentication issues
3. **E2E Tests**: Run smoke tests to verify all functionality
4. **Production Readiness**: Consider enabling healthchecks in docker-compose once all issues are resolved

---

## Quick Commands

### Restart Services
```bash
docker-compose down && docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f import-service
docker-compose logs -f backend
```

### Check Service Status
```bash
docker-compose ps
```

### Test Import Endpoint
```bash
curl -X POST http://localhost:8082/api/routine-import/import \
  -F "file=@tmp/2025-12-23.xlsx" \
  -F "userId=USER_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

# Backend Fixes Required

## Critical Issues Found

### 1. Database Sync Errors
**Problem**: `NOT NULL constraint failed: exercises.created_at`
**Cause**: Backend API doesn't return `createdAt` and `updatedAt` fields for exercises
**Fix**: Already handled in `syncService.ts` with default timestamps

### 2. Health Endpoint Missing  
**Problem**: `/health` endpoint returns 500 error
**Cause**: Endpoint doesn't exist in backend
**Fix Needed in KraftLogApi**: Add health endpoint

### 3. Web Platform SQLite Issues
**Problem**: Missing WASM files for SQLite on web
**Status**: Already fixed - web platform skips SQLite and uses API directly

### 4. HTTP 403 on Routines
**Problem**: Expired tokens causing 403 errors
**Status**: Already handled - API interceptor logs out user on 401/403

## Backend Changes Required (KraftLogApi)

### Add Health Endpoint
```java
@RestController
@RequestMapping("/api")
public class HealthController {
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
}
```

### Add Timestamps to Exercise Entity
Ensure Exercise entity has proper `@CreatedDate` and `@LastModifiedDate` annotations:

```java
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Exercise {
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    // ... other fields
}
```

### Enable JPA Auditing
```java
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
```

## Frontend Status

### ✅ Already Fixed
1. Token expiration handling (API interceptor + AuthContext)
2. Web platform SQLite bypass
3. Default timestamps in sync service
4. Offline sync error handling

### ⚠️ Needs Testing
1. E2E tests for expired token flow
2. Full test coverage for all E2E flows
3. Web version compatibility testing

## Next Steps

1. Update KraftLogApi with health endpoint and timestamps
2. Rebuild and push Docker images
3. Add E2E tests for token expiration
4. Test full offline/online sync flow

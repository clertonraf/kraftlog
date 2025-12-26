# Backend Fix Summary

## Issues Fixed

### 1. Database Constraint Error: `NOT NULL constraint failed: exercises.created_at`
**Problem**: The backend API was returning exercise data without `createdAt` and `updatedAt` fields, but the local SQLite schema required these fields as NOT NULL.

**Solution**: Modified `syncService.ts` to always use the current timestamp when saving exercises to local database, regardless of what the backend returns.

```typescript
private async saveExercisesToLocal(exercises: any[]) {
  const db = await getDatabase();
  if (!db) return; // Skip on web
  
  const now = new Date().toISOString();
  
  for (const exercise of exercises) {
    await db.runAsync(
      `INSERT OR REPLACE INTO exercises (id, name, description, video_url, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [exercise.id, exercise.name, exercise.description || null, exercise.videoUrl || null, now, now]
    );
  }
}
```

### 2. Web Platform SQLite Error: `Unable to resolve module ./wa-sqlite/wa-sqlite.wasm`
**Problem**: expo-sqlite tries to load WASM modules on web platform, but they're not available/configured properly.

**Solution**: Added platform checks to skip SQLite operations on web platform:
- Modified `database.ts` to return null on web
- Updated all sync service methods to check for null database before operations
- Web users will now use API directly without local caching

```typescript
export const initDatabase = async () => {
  // SQLite is not fully supported on web - use in-memory fallback or skip
  if (Platform.OS === 'web') {
    console.warn('SQLite is not available on web platform');
    return null;
  }
  // ... rest of initialization
};
```

### 3. Improved Online Status Detection
**Problem**: The sync service was treating all API errors as "offline" status.

**Solution**: Modified `checkOnlineStatus` to differentiate between network errors and API errors:

```typescript
private async checkOnlineStatus(): Promise<boolean> {
  try {
    await api.get('/exercises', { timeout: 3000 });
    return true;
  } catch (error: any) {
    // Consider device offline only on network errors, not API errors
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      console.log('Device is offline, skipping sync');
      return false;
    }
    // If we got a response (even an error), we're online
    return true;
  }
}
```

## Testing

1. **Clear app data**: Use the new `test-db-reset.sh` script to reset iOS simulator
   ```bash
   ./test-db-reset.sh
   ```

2. **Test iOS app**: 
   - Start backend: `docker compose up`
   - Start Expo: `npx expo start`
   - Press 'i' to open iOS simulator
   - Login and verify exercises sync without errors

3. **Test web** (if needed):
   - Start backend: `docker compose up`
   - Start Expo: `npx expo start`
   - Press 'w' to open web browser
   - Note: Local offline functionality won't work on web, but API calls should work

## Files Modified

1. `services/database.ts` - Added platform checks for web
2. `services/syncService.ts` - Fixed exercise timestamp handling and added web platform checks
3. `test-db-reset.sh` - New script to reset iOS simulator app data

## What's Still Needed

The backend API should ideally return `createdAt` and `updatedAt` fields for all entities to maintain proper sync tracking. However, the current fix handles the missing fields gracefully.

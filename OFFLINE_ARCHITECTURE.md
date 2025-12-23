# Offline-First Architecture

## Overview

KraftLog now implements an **offline-first architecture** that allows the app to work seamlessly without an internet connection. All data is stored locally using SQLite and synchronized with the backend when online.

## Key Features

- ✅ **Full offline functionality** - All app features work without internet
- ✅ **Automatic background sync** - Data syncs when app comes to foreground
- ✅ **Conflict-free operation** - Local changes queue and sync when online
- ✅ **Real-time sync status** - Visual indicator shows sync state
- ✅ **Optimistic UI updates** - Instant feedback without waiting for server

## Architecture Components

### 1. Local Database (`services/database.ts`)

SQLite database with complete schema including:
- Users
- Routines and Workouts
- Exercises
- Workout Logs (history)
- Sync queue for pending operations

### 2. Sync Service (`services/syncService.ts`)

Handles bidirectional synchronization:
- **Pull**: Downloads data from backend to local database
- **Push**: Uploads local changes to backend
- **Queue**: Manages pending operations when offline
- **Retry logic**: Automatically retries failed syncs

### 3. Offline Services

Example: `services/offlineRoutineService.ts`

Wraps API calls to work offline-first:
```typescript
// Works offline - reads from local DB
const routines = await offlineRoutineService.getRoutinesByUserId(userId);

// Saves locally, queues for sync
await offlineRoutineService.createRoutine(data);
```

### 4. Offline Context (`contexts/OfflineContext.tsx`)

Provides:
- Database initialization
- Sync status updates
- Manual sync trigger
- Automatic sync on app state changes

### 5. UI Components

- `SyncStatusIndicator` - Shows last sync time and pending changes
- Displayed on home screen for visibility

## How It Works

### Data Flow

```
User Action → Local Database → Sync Queue → Background Sync → Backend API
                     ↓
                 UI Update (Immediate)
```

### Sync Strategy

1. **On App Start**: Initialize database, pull latest data from server
2. **On User Action**: Save to local DB immediately, queue for sync
3. **On Foreground**: Auto-sync pending changes
4. **On Manual Trigger**: Force sync all data

### Conflict Resolution

- **Last-write-wins**: Server data takes precedence during pull
- **Queue-based**: Local changes uploaded in order
- **Retry mechanism**: Failed operations retry up to 5 times

## Implementation Guide

### For Existing Services

To make a service offline-capable:

1. **Create offline service wrapper**:
```typescript
// services/offlineMyService.ts
import { getDatabase } from './database';
import { syncService } from './syncService';

class OfflineMyService {
  async getItems() {
    const db = await getDatabase();
    return await db.getAllAsync('SELECT * FROM items');
  }

  async createItem(data) {
    const db = await getDatabase();
    const id = uuidv4();
    
    // Save locally
    await db.runAsync(
      'INSERT INTO items (id, name) VALUES (?, ?)',
      [id, data.name]
    );
    
    // Queue for sync
    await syncService.addToSyncQueue('items', id, 'CREATE', data);
    
    // Try immediate sync (optional)
    syncService.syncAll().catch(() => {});
    
    return { id, ...data };
  }
}
```

2. **Update components to use offline service**:
```typescript
import { offlineMyService } from '@/services/offlineMyService';

// Instead of:
// const items = await myService.getItems();

// Use:
const items = await offlineMyService.getItems();
```

### Database Schema Updates

To add new tables:

1. Update `services/database.ts`
2. Add CREATE TABLE statement
3. Add indexes for performance
4. Increment database version if needed

### Sync Implementation

To sync new entities:

1. Add endpoint mapping in `syncService.getEndpoint()`
2. Implement pull logic in `syncService.pullFromServer()`
3. Implement save logic (e.g., `saveItemsToLocal()`)

## Monitoring & Debugging

### Sync Status

The `SyncStatusIndicator` component shows:
- Last sync time ("Just now", "5m ago", etc.)
- Number of pending changes
- Sync in progress indicator

### Console Logs

Key log messages:
```
"Database initialized"
"Performing initial sync..."
"Pulling data from server..."
"Syncing routines..."
"Sync completed successfully"
```

### Checking Local Data

Use Expo dev tools or database viewer:
```bash
# On iOS
xcrun simctl get_app_container booted com.clerton.kraftlog data

# View database
sqlite3 kraftlog.db
```

## Performance Considerations

- **Indexes**: Added on foreign keys for fast queries
- **WAL mode**: Enables concurrent reads during writes
- **Batch operations**: Multiple inserts in single transaction
- **Lazy loading**: Only fetch needed data

## Future Enhancements

- [ ] Delta sync (only changed records)
- [ ] Compression for large payloads
- [ ] Background sync with WorkManager (Android) / BackgroundTasks (iOS)
- [ ] Conflict resolution UI
- [ ] Export/import local database
- [ ] Multi-device sync indicator

## Troubleshooting

### Data not syncing

1. Check network connection
2. Verify backend is running
3. Check sync queue: `SELECT * FROM sync_queue`
4. Force sync from UI

### Database errors

1. Clear app data and reinstall
2. Check database migrations
3. Verify schema matches backend

### Duplicate data

1. Check `synced` flag on records
2. Verify UUID generation for new records
3. Check for race conditions in sync logic

## Migration from Online-Only

Existing users will automatically:
1. Initialize local database on next app launch
2. Pull all data from backend
3. Continue using app offline-first

No data loss or manual migration required.

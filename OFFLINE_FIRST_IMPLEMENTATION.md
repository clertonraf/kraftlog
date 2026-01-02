# Offline-First Architecture Implementation

## Overview
KraftLog now supports **offline-first** usage, allowing users to use the app without requiring a server connection. Users can choose between offline mode and remote server mode.

## Key Changes

### 1. **No Login Required**
- App starts without requiring authentication
- Users can immediately start using the app in offline mode
- All data is stored locally in SQLite database

### 2. **Server Configuration Screen**
New screen: `app/server-config.tsx`
- First-time users choose between:
  - **Offline Mode**: Use app without server, all data local
  - **Remote Server**: Connect to backend for multi-device sync

### 3. **Settings Screen**
New tab: `app/(tabs)/settings.tsx`
- View and change mode (offline ↔ remote)
- Configure server URL
- View account information (if logged in)
- Logout option

### 4. **Dynamic API Configuration**
Updated: `services/api.ts`
- API URL is now configurable at runtime
- `updateApiUrl()` function to change server URL
- Falls back to default URL if not configured

### 5. **Configuration Service**
New service: `services/configService.ts`
- Manages app configuration in AsyncStorage
- Stores:
  - `useRemoteServer`: boolean
  - `apiUrl`: string | null
  - `isConfigured`: boolean

## User Flows

### First-Time User - Offline Mode
```
1. Open app
2. See server config screen
3. Choose "Use Offline"
4. → Immediately access app features
5. All data stored locally
```

### First-Time User - Remote Server
```
1. Open app
2. See server config screen
3. Enter server URL
4. Choose "Connect to Server"
5. → Redirected to login/register
6. Login or create account
7. → Access app with sync enabled
```

### Existing User
```
1. Open app
2. Check configuration:
   - If offline mode → Go to tabs
   - If remote mode + authenticated → Go to tabs
   - If remote mode + not authenticated → Go to login
```

### Switching Modes
```
From Settings:
1. Tap "Change" next to mode
2. Confirm switch
3. App reconfigures and restarts
```

## Technical Implementation

### AuthContext Changes
```typescript
interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  isOfflineMode: boolean;          // NEW
  useRemoteServer: boolean;        // NEW
  // ... other fields
}

// In offline mode, isAuthenticated always returns true
isAuthenticated: useRemoteServer ? !!user : true
```

### OfflineContext Changes
```typescript
// Only syncs when:
// 1. User is logged in
// 2. Database is initialized
// 3. useRemoteServer is true

if (user && isInitialized && useRemoteServer) {
  performInitialSync();
}
```

### Route Protection
Updated `app/_layout.tsx`:
- Config screen accessible always
- If offline mode: direct access to tabs
- If remote mode: enforce authentication

## Configuration Storage

### Structure
```json
{
  "useRemoteServer": false,
  "apiUrl": null,
  "isConfigured": true
}
```

### Storage Key
`app_config` in AsyncStorage

### Methods
```typescript
configService.getConfig()                    // Load config
configService.saveConfig(config)             // Save config
configService.setOfflineMode()               // Switch to offline
configService.setRemoteServer(apiUrl)        // Switch to remote
configService.clearConfig()                  // Reset
configService.isConfigured()                 // Check if configured
configService.getApiUrl()                    // Get current API URL
```

## Database Behavior

### Offline Mode
- All data stored in local SQLite
- No network requests
- CRUD operations work normally
- No sync operations

### Remote Server Mode
- Data stored in both local SQLite AND remote server
- Sync on app start
- Sync on app foreground
- Manual sync available
- Conflict resolution via sync service

## UI Updates

### New Screens
1. **Server Config** (`/server-config`)
   - Shown on first launch
   - Choose offline or remote mode
   - Enter server URL for remote mode

2. **Settings** (`/(tabs)/settings`)
   - View current mode
   - Switch modes
   - Edit server URL
   - View account info
   - Logout

### Modified Screens
1. **Login** (`/login`)
   - Shows current server URL
   - Added "Use Offline Mode" button
   - Allows switching to offline without login

2. **Tab Layout** (`/(tabs)/_layout.tsx`)
   - Added Settings tab with gear icon

## Migration Path

### Existing Users (Already Logged In)
```
1. App detects no configuration
2. Assumes remote server mode
3. Keeps existing authentication
4. Sets configured flag
```

### Implementation
```typescript
// In AuthContext initialization
const config = await configService.getConfig();
if (!config.isConfigured && isAuth) {
  // User was already logged in
  await configService.setRemoteServer(currentApiUrl);
}
```

## Testing

### Test Cases
- [ ] First launch shows server config
- [ ] Choosing offline mode works
- [ ] Choosing remote server works
- [ ] Offline mode allows app usage
- [ ] Remote mode requires login
- [ ] Settings screen displays correctly
- [ ] Mode switching works
- [ ] Server URL editing works
- [ ] Logout works
- [ ] Data persists in offline mode
- [ ] Sync works in remote mode
- [ ] Switching modes preserves local data

### E2E Tests Needed
1. `15-offline-mode-flow.yaml`
2. `16-server-config-flow.yaml`
3. `17-mode-switching.yaml`

## Benefits

### For Users
✅ No barrier to entry - start using immediately
✅ Works without internet
✅ Choose when/if to sync
✅ Privacy control over data
✅ Faster app start (no auth check)

### For Developers
✅ Simplified onboarding
✅ Reduced server dependency
✅ Better offline experience
✅ Flexible deployment (with/without backend)
✅ Easier testing

## Deployment Notes

### Backend Optional
- App works completely without backend
- Backend only needed for:
  - Multi-device sync
  - Cloud backup
  - Shared routines
  - User accounts

### Configuration
No environment variables required for offline mode!

For remote server support:
```env
EXPO_PUBLIC_API_URL=http://your-server/api  # Optional default
```

## Backward Compatibility

### Existing Installations
- Will see server config screen on first launch after update
- If already logged in, automatically configured as remote mode
- No data loss
- Auth state preserved

### API Changes
- No breaking changes to services
- Auth methods work same way
- Database operations unchanged
- Sync service only activates when `useRemoteServer === true`

## Future Enhancements

1. **Import/Export**
   - Export local data to file
   - Import data from file
   - Share data between devices manually

2. **Selective Sync**
   - Choose what to sync
   - Sync specific routines only
   - Sync settings

3. **Multiple Servers**
   - Support connecting to different servers
   - Server profiles
   - Quick switch between servers

4. **Anonymous Accounts**
   - Create local account with username
   - Optional upgrade to synced account later

5. **Peer-to-Peer Sync**
   - Sync directly between devices
   - No server required
   - Local network sync

## Summary

✅ **Implemented:**
- Offline-first architecture
- Server configuration screen
- Settings screen with mode switching
- Dynamic API URL configuration
- Configuration persistence
- Updated authentication flow
- Updated routing logic

✅ **Files Created:**
- `services/configService.ts`
- `app/server-config.tsx`
- `app/(tabs)/settings.tsx`

✅ **Files Modified:**
- `services/api.ts`
- `contexts/AuthContext.tsx`
- `contexts/OfflineContext.tsx`
- `app/_layout.tsx`
- `app/index.tsx`
- `app/login.tsx`
- `app/(tabs)/_layout.tsx`

The app now provides a **seamless offline experience** while maintaining full server sync capabilities when desired!

# Fixes Applied - 2024-01-03

## Issues Fixed

### 1. Settings Screen Crash (isOfflineMode undefined)
**File**: `app/(tabs)/settings.tsx`
**Fix**: Added proper destructuring of auth context to avoid undefined reference
```typescript
const auth = useAuth();
const { user, logout, useRemoteServer, isOfflineMode } = auth;
```

### 2. Web Platform SQLite Error
**Files**: 
- `services/configService.ts`
- `services/offlineRoutineService.ts`

**Fixes**:
- Forced web platform to always use remote server mode (no offline mode on web)
- Added fallback logic in `offlineRoutineService.getRoutinesByUserId()` to handle both SQLite (native) and web database
- Added check in `configService.getConfig()` to return default config if web tries to use offline mode

### 3. Mode Switching on Web
**File**: `app/(tabs)/settings.tsx`
**Fix**: Improved `handleSwitchMode()` to properly handle web platform:
- Uses `window.location.href` for navigation on web instead of router.replace
- Uses native `confirm()` dialog on web instead of React Native Alert
- Properly clears config when switching from offline to remote

### 4. Pre-populated Exercises
**Action**: Created script to clear local database
**File**: `scripts/clear-local-db.sh`
- Script locates and removes the SQLite database from iOS simulator
- Run with: `./scripts/clear-local-db.sh`

## Testing Recommendations

### Test on iOS (Native)
1. Clear cache and database:
   ```bash
   ./scripts/clear-local-db.sh
   npx expo start --clear
   ```

2. Test offline mode:
   - Start app → Choose "Use Offline"
   - Verify exercises list is empty
   - Create a new exercise
   - Create a new routine
   - Verify data persists after app restart

3. Test remote mode:
   - Start app → Enter server URL → Connect
   - Login with credentials
   - Verify sync works
   - Switch to offline mode from settings
   - Switch back to remote mode

### Test on Web
1. Start web version:
   ```bash
   npx expo start --web
   ```

2. Verify:
   - Offline mode option is hidden/disabled
   - Only remote server connection is available
   - After connecting to server, all features work
   - Mode switching navigates properly using page reload

### Test Modal Component
The error about `@/components/themed-text` and `@/components/haptic-tab` not being found appears to be a Metro cache issue. If it persists:
1. Stop Metro
2. Run: `npx expo start --clear`
3. Delete node_modules and reinstall if needed

## Known Issues Not Fixed

1. **TypeScript compilation warnings** - There are some lint warnings about array index keys that should be addressed for better performance
2. **Component re-rendering** - The explore.tsx screen logs suggest potential over-rendering, but needs profiling to confirm
3. **Database schema** - The `is_active` column migration should be verified to ensure it runs properly on all devices

## Files Modified
- `app/(tabs)/settings.tsx` - Fixed crash and improved mode switching
- `services/configService.ts` - Added web platform checks
- `services/offlineRoutineService.ts` - Added fallback for web database
- `scripts/clear-local-db.sh` - New script to clear local data

## Next Steps
1. Test on actual devices (iOS/Android)
2. Add unit tests for config service
3. Add E2E tests for mode switching
4. Profile and optimize exercise list rendering
5. Add proper error boundaries for better error handling

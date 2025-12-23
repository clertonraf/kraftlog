# Workout Calendar and History Reference Implementation

## Summary

Successfully implemented two major features:
1. **Workout Calendar View** - Visual calendar showing completed workout sessions within a routine
2. **Previous Workout Reference** - Shows last workout data as reference during current session

## 1. Workout Calendar View

### Features Implemented

#### Routine Details Screen - Calendar Tab
- Added tab bar with two tabs: "Workouts" and "History"
- **Calendar Component** using `react-native-calendars`:
  - Marks dates with completed workouts (green dots)
  - Interactive date selection
  - Custom theme matching app colors

#### History List Below Calendar
- Shows recent 10 completed workout sessions
- Each card displays:
  - Date and time of workout
  - Number of workouts completed
  - Total duration
  - Tap to view full details in history screen

#### Visual Indicators
- **Legend** showing what marked dates mean
- **Empty state** when no workout history exists
- **Green dots** on calendar for completed workouts
- **Selected date highlighting**

### Technical Implementation

**Frontend:**
- Added `react-native-calendars` package
- New state variable `activeTab` for tab switching
- Fetches `LogRoutines` when loading routine
- Helper functions:
  - `getMarkedDates()` - Creates calendar markers
  - `getWorkoutSessionsForDate()` - Filters sessions by date
  - `formatTime()` - Formats time display
  - `calculateDuration()` - Calculates workout duration

**Styles Added:**
- Tab bar styling with active/inactive states
- Calendar container with shadow and rounded corners
- Legend component styling
- History card styling with icons
- Responsive layout

## 2. Previous Workout Reference

### Features Implemented

#### During Workout Session
- **Collapsible Reference Card** showing last completed workout
- Located between video player and current sets section
- Shows exercise name from previous session
- Displays all sets from last time:
  - Set number
  - Reps performed
  - Weight used

#### Smart Display Logic
- Only shows if previous workout exists
- Only shows for exercises that were logged before
- Collapsed by default to save space
- Toggle to expand/collapse with chevron icon

### Technical Implementation

**Backend Changes:**

1. **New Repository Method** (`LogWorkoutRepository.java`):
```java
List<LogWorkout> findByWorkoutIdAndEndDatetimeIsNotNullOrderByEndDatetimeDesc(UUID workoutId);
```

2. **New Service Method** (`LogWorkoutService.java`):
```java
Optional<LogWorkoutResponse> getLastCompletedWorkout(UUID workoutId)
```
- Returns the most recent completed workout
- Filters by endDatetime (completed workouts only)
- Orders by endDatetime descending
- Returns Optional (may not exist)

3. **New Controller Endpoint** (`LogWorkoutController.java`):
```
GET /api/log-workouts/workout/{workoutId}/last
```
- Returns 200 with workout data if found
- Returns 404 if no completed workout exists

**Frontend Changes:**

1. **Service Method** (`logService.ts`):
```typescript
async getLastCompletedWorkout(workoutId: string): Promise<LogWorkoutResponse | null>
```
- Calls backend endpoint
- Returns null if 404 (no previous workout)
- Handles other errors appropriately

2. **Workout Session Screen** (`workout/session/[workoutId].tsx`):
- New state: `previousWorkout`, `showPreviousData`
- Fetches previous workout on load (parallel with workout data)
- Helper: `getPreviousExerciseData()` - matches exercise by ID
- UI component showing previous sets in expandable card

**Styles Added:**
- Yellow/cream colored reference card
- Collapsible header with chevron
- Previous set items with white background
- Clear visual separation from current workout
- Icons for time reference

## User Experience Flow

### Viewing Calendar
1. User opens routine details
2. Taps "History" tab
3. Sees calendar with green dots on workout days
4. Below calendar, sees recent workout list
5. Can tap any workout to see full details

### Using Previous Workout Reference
1. User starts a workout session
2. If they've done this workout before, sees yellow "Last Workout Reference" card
3. Card is collapsed by default
4. Taps to expand and see previous sets/reps/weights
5. Uses this as reference when logging current sets
6. Can refer back throughout the workout

## Benefits

### Calendar View
- ✅ Visual progress tracking
- ✅ See workout frequency patterns
- ✅ Quick access to recent workouts
- ✅ Motivational (see streak of completed workouts)
- ✅ Easy date-based navigation

### Previous Workout Reference
- ✅ Progressive overload tracking
- ✅ Know what weights to use
- ✅ Compare performance
- ✅ Set realistic goals for current workout
- ✅ No need to remember previous numbers

## Data Flow

### Calendar View
```
Routine Details Screen Load
  ↓
Fetch LogRoutines by routine ID
  ↓
Filter completed (has endDatetime)
  ↓
Extract dates and mark on calendar
  ↓
Display recent sessions in list
```

### Previous Workout Reference
```
Start Workout Session
  ↓
Fetch current workout + last completed workout (parallel)
  ↓
Match exercises by exerciseId
  ↓
Display previous sets for current exercise
  ↓
User expands to see reference data
  ↓
Logs new sets using previous as guide
```

## Database Queries

### New Query (Optimized)
```sql
SELECT * FROM log_workouts 
WHERE workout_id = ? 
  AND end_datetime IS NOT NULL 
ORDER BY end_datetime DESC 
LIMIT 1
```
- Indexed on workout_id
- Filtered for completed workouts only
- Ordered to get most recent first
- Limit 1 for performance

## Testing Recommendations

### Calendar Feature
1. Complete several workouts on different dates
2. Navigate to routine details → History tab
3. Verify calendar shows green dots on correct dates
4. Tap on different dates
5. Verify recent sessions list shows correct info
6. Tap a session card → should navigate to detail view

### Previous Workout Reference
1. Complete a workout session fully
2. Start the same workout again
3. Verify yellow reference card appears
4. Tap to expand → see previous sets
5. Verify data matches what was logged before
6. Check with exercises that weren't logged previously (shouldn't show)
7. Test with workout that's never been completed (no reference card)

## Performance Considerations

- Calendar marks are pre-computed from logRoutines array
- Previous workout query is optimized (indexed, limited)
- Reference card collapsed by default (less initial render)
- Parallel data fetching (workout + previous workout)
- Conditional rendering (only shows if data exists)

## Future Enhancements

Possible improvements:
- Click calendar date to see that day's workouts
- Show stats on calendar (volume, duration bubbles)
- Compare multiple previous sessions (last 3 workouts)
- Trend indicators (up/down arrows for weight changes)
- Personal records highlighted in reference
- Export calendar data
- Share workout calendar
- Calendar filters (date range, workout type)

## Files Modified

### Frontend
**Created:**
- None (all changes in existing files)

**Modified:**
- `/app/routine/[id]/index.tsx` - Added calendar tab and UI
- `/app/workout/session/[workoutId].tsx` - Added previous workout reference
- `/services/logService.ts` - Added `getLastCompletedWorkout()`
- `package.json` - Added `react-native-calendars` dependency

### Backend
**Modified:**
- `/repository/LogWorkoutRepository.java` - Added query method
- `/service/LogWorkoutService.java` - Added service method
- `/controller/LogWorkoutController.java` - Added endpoint

## Dependencies Added

- `react-native-calendars` - Calendar component with marking support

---

**Implementation Complete! ✅**

Users can now:
1. View their workout history in a visual calendar
2. See previous workout data as reference during sessions
3. Track progress over time with easy date-based navigation
4. Use historical data to guide current workout intensity

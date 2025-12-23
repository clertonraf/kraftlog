# Calendar and Previous Workout Reference - Bug Fixes

## Issues Found and Fixed

### Issue 1: Workouts Not Showing in Calendar ❌

**Problem:**
- Completed workouts were not appearing in the calendar
- The calendar marks dates where `LogRoutine.endDatetime` is set
- However, we were only setting `LogWorkout.endDatetime`, not `LogRoutine.endDatetime`

**Root Cause:**
When completing a workout session, we were updating:
- ✅ `LogExercise.endDatetime` (for each exercise)
- ✅ `LogWorkout.endDatetime` (for the workout)
- ❌ `LogRoutine.endDatetime` (for the routine) **<-- MISSING**

**Fix Applied:**
Updated `/app/workout/session/[workoutId].tsx` in `handleCompleteWorkout()`:

```typescript
// After updating log workout
await logWorkoutService.updateLogWorkout(logWorkout.id, {...});

// NOW ALSO complete the log routine
if (logRoutineId) {
  await logRoutineService.completeLogRoutine(logRoutineId);
}
```

This ensures the `LogRoutine.endDatetime` is set, which makes it appear in the calendar.

---

### Issue 2: LogWorkouts Not Loaded in Calendar View ❌

**Problem:**
- Calendar was trying to display workout count and duration
- But `LogRoutine.logWorkouts` was not being loaded (lazy loading issue)
- Resulted in empty/missing data in the history list

**Root Cause:**
- `LogRoutine` entity has `@OneToMany` relationship with `LogWorkout` (lazy by default)
- When fetching `LogRoutines` for calendar, the `logWorkouts` collection wasn't loaded
- Led to `N+1` query problem or empty collections

**Fix Applied:**
Added `@EntityGraph` to `LogRoutineRepository.java`:

```java
@EntityGraph(attributePaths = {
    "logWorkouts", 
    "logWorkouts.logExercises", 
    "logWorkouts.logExercises.logSets"
})
List<LogRoutine> findByRoutineIdOrderByStartDatetimeDesc(UUID routineId);

@EntityGraph(attributePaths = {
    "logWorkouts", 
    "logWorkouts.logExercises", 
    "logWorkouts.logExercises.logSets"
})
List<LogRoutine> findByRoutine_UserIdOrderByStartDatetimeDesc(UUID userId);
```

This eagerly fetches all nested data in a single query, avoiding lazy loading issues.

Also updated `LogRoutineService.java` to explicitly map `logWorkouts`:

```java
private LogRoutineResponse mapToResponse(LogRoutine logRoutine) {
    LogRoutineResponse response = modelMapper.map(logRoutine, LogRoutineResponse.class);
    response.setRoutineId(logRoutine.getRoutine().getId());
    // Explicitly map logWorkouts
    response.setLogWorkouts(logRoutine.getLogWorkouts().stream()
            .map(lw => modelMapper.map(lw, LogWorkoutResponse.class))
            .collect(Collectors.toList()));
    return response;
}
```

---

### Issue 3: Previous Workout Reference Not Showing ❓

**Potential Issues to Check:**

1. **Exercise ID Mismatch**
   - The `getPreviousExerciseData()` matches by `exerciseId`
   - Added console logging to debug:
   
   ```typescript
   const getPreviousExerciseData = (exerciseId: string) => {
     if (!previousWorkout || !previousWorkout.logExercises) {
       console.log('No previous workout or exercises');
       return null;
     }
     const found = previousWorkout.logExercises.find(ex => ex.exerciseId === exerciseId);
     console.log(`Looking for exerciseId ${exerciseId}, found:`, found);
     return found;
   };
   ```

2. **Data Loading**
   - Added console logs in `loadData()` to verify previous workout is fetched:
   
   ```typescript
   console.log('Previous workout data:', previousWorkoutData);
   console.log('Current workout exercises:', workoutData.exercises);
   ```

**What to Check:**
- Open browser console when starting a workout
- Look for the console logs
- Verify `previousWorkoutData` contains exercises
- Verify `exerciseId` values match between current and previous workout

---

## Testing Instructions

### Test 1: Calendar Display
1. Complete a full workout session (don't just start it)
2. Click "Complete Workout" and confirm
3. Navigate back to Routine Details
4. Switch to "History" tab
5. **Expected:** Calendar shows a green dot on today's date
6. **Expected:** Recent sessions list shows the completed workout

### Test 2: Previous Workout Reference
1. Complete a workout session fully (log at least one set per exercise)
2. Go back to routine details
3. Start THE SAME workout again
4. For each exercise:
   - **Expected:** See yellow "Last Workout Reference" card
   - Tap to expand
   - **Expected:** See previous sets with reps and weights
5. Check browser console for debug logs

### Test 3: Data Consistency
Check browser console for:
```
Previous workout data: { ... }
Current workout exercises: [ ... ]
Looking for exerciseId xxx, found: { ... }
```

---

## Files Modified

### Frontend
- `/app/workout/session/[workoutId].tsx`
  - Added `logRoutineService.completeLogRoutine()` call
  - Added debug console logs
  - Enhanced `getPreviousExerciseData()` with logging

### Backend
- `/repository/LogRoutineRepository.java`
  - Added `@EntityGraph` to eagerly fetch nested data
  
- `/service/LogRoutineService.java`
  - Added explicit mapping of `logWorkouts` in response
  - Added import for `LogWorkoutResponse`

---

## Expected Behavior After Fixes

### Calendar
✅ Completed workouts appear as green dots  
✅ Recent sessions list shows workout details  
✅ Workout count, duration, and time display correctly  
✅ Tapping a session navigates to detail view  

### Previous Workout Reference
✅ Yellow reference card appears if previous workout exists  
✅ Card shows correct exercise data from last session  
✅ Set numbers, reps, and weights match previous session  
✅ Only shows for exercises that were logged before  
✅ Expandable/collapsible with chevron icon  

---

## Debugging Steps if Issues Persist

### If Calendar Still Empty:
1. Check if `LogRoutine.endDatetime` is actually set in database
2. Verify the date format matches `YYYY-MM-DD`
3. Check if `getMarkedDates()` is being called
4. Add console log: `console.log('Marked dates:', getMarkedDates())`

### If Previous Workout Not Showing:
1. Check console logs for:
   - "Previous workout data"
   - "Looking for exerciseId"
2. Verify the workout was completed (has endDatetime)
3. Check if exerciseIds match between sessions
4. Ensure backend returns `logExercises` with `exerciseId` field

### If Backend Errors:
1. Restart backend server after Maven compile
2. Check for any database constraint errors
3. Verify all entities have proper relationships configured
4. Test endpoints directly with curl/Postman

---

## Performance Notes

The `@EntityGraph` approach:
- ✅ Fetches all data in **one query** (efficient)
- ✅ Avoids N+1 query problems
- ✅ Loads logWorkouts → logExercises → logSets in single JOIN
- ⚠️ May fetch more data than needed (tradeoff for simplicity)

For large datasets, consider:
- Pagination
- DTO projections
- Separate endpoints for summary vs. detail

---

**All fixes applied! Test the features and check console logs for any remaining issues.** 🐛✅

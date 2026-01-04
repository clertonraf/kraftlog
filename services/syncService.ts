import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { getDatabase } from './database';

export interface SyncStatus {
  lastSync: string | null;
  isSyncing: boolean;
  pendingChanges: number;
}

interface DbRoutine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  workouts?: DbWorkout[];
}

interface DbWorkout {
  id: string;
  name: string;
  description?: string;
  dayOfWeek?: number;
  createdAt: string;
  updatedAt: string;
  workoutExercises?: DbWorkoutExercise[];
}

interface DbWorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  orderIndex: number;
  sets: number;
  targetReps?: number;
  reps?: number;
  targetWeight?: number;
  restSeconds?: number;
  restTimeSeconds?: number;
}

interface DbLogRoutine {
  id: string;
  routineId: string;
  userId: string;
  startDatetime: string;
  endDatetime?: string;
  createdAt: string;
  updatedAt: string;
  logWorkouts?: DbLogWorkout[];
}

interface DbLogWorkout {
  id: string;
  workoutId: string;
  startDatetime: string;
  endDatetime?: string;
  createdAt: string;
  logExercises?: unknown[];
}

interface DbExercise {
  id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  categoryId?: string;
  equipmentId?: string;
  createdAt: string;
  updatedAt: string;
}

class SyncService {
  private isSyncing = false;
  private syncCallbacks: ((status: SyncStatus) => void)[] = [];

  // Subscribe to sync status updates
  subscribe(callback: (status: SyncStatus) => void) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers(status: SyncStatus) {
    for (const callback of this.syncCallbacks) {
      callback(status);
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const db = await getDatabase();

    // On web, database is not available
    if (!db) {
      const lastSync = await AsyncStorage.getItem('lastSync');
      return {
        lastSync,
        isSyncing: this.isSyncing,
        pendingChanges: 0,
      };
    }

    const result = (await db.getFirstAsync('SELECT COUNT(*) as count FROM sync_queue')) as {
      count: number;
    } | null;
    const lastSync = await AsyncStorage.getItem('lastSync');

    return {
      lastSync,
      isSyncing: this.isSyncing,
      pendingChanges: result?.count || 0,
    };
  }

  async addToSyncQueue(
    entityType: string,
    entityId: string,
    operation: string,
    data: Record<string, unknown>
  ) {
    const db = await getDatabase();
    if (!db) {
      console.warn('Database not available on web platform');
      return;
    }

    await db.runAsync(
      `INSERT INTO sync_queue (entity_type, entity_id, operation, data, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [entityType, entityId, operation, JSON.stringify(data), new Date().toISOString()]
    );
  }

  async syncAll(force = false) {
    if (this.isSyncing && !force) {
      console.log('Sync already in progress');
      return;
    }

    this.isSyncing = true;
    this.notifySubscribers(await this.getSyncStatus());

    try {
      // Check if online
      const isOnline = await this.checkOnlineStatus();
      if (!isOnline) {
        console.log('Device is offline, skipping sync');
        return;
      }

      // Sync in order: users, routines, workouts, exercises, logs
      await this.syncEntity('users');
      await this.syncEntity('routines');
      await this.syncEntity('workouts');
      await this.syncEntity('exercises');
      await this.syncEntity('log_routines');
      await this.syncEntity('log_workouts');
      await this.syncEntity('log_exercises');
      await this.syncEntity('log_sets');

      // Process sync queue
      await this.processSyncQueue();

      // Update last sync time
      await AsyncStorage.setItem('lastSync', new Date().toISOString());

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
      this.notifySubscribers(await this.getSyncStatus());
    }
  }

  private async checkOnlineStatus(): Promise<boolean> {
    try {
      // Use exercises endpoint to check connectivity (lightweight and always available)
      // Don't include auth token for this check
      const testUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';
      const response = await fetch(`${testUrl}/exercises`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });
      // Consider online if we get any response (including 401/403 which means server is up)
      return response.ok || response.status === 401 || response.status === 403;
    } catch (_error: unknown) {
      // Consider device offline only on network errors
      console.log('Device is offline, skipping sync');
      return false;
    }
  }

  private async syncEntity(entityType: string) {
    console.log(`Syncing ${entityType}...`);
    // This will be implemented to fetch data from backend
    // and update local database
  }

  private async processSyncQueue() {
    const db = await getDatabase();
    if (!db) return; // Skip on web

    const queue = (await db.getAllAsync(
      'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50'
    )) as {
      id: number;
      entity_type: string;
      entity_id: string;
      operation: string;
      data: string;
      retry_count: number;
    }[];

    for (const item of queue) {
      try {
        const data = JSON.parse(item.data);

        switch (item.operation) {
          case 'CREATE':
            await this.syncCreate(item.entity_type, data);
            break;
          case 'UPDATE':
            await this.syncUpdate(item.entity_type, item.entity_id, data);
            break;
          case 'DELETE':
            await this.syncDelete(item.entity_type, item.entity_id);
            break;
        }

        // Remove from queue after successful sync
        await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
      } catch (error) {
        console.error(`Failed to sync ${item.entity_type} ${item.entity_id}:`, error);

        // Increment retry count
        if (item.retry_count < 5) {
          await db.runAsync('UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?', [
            item.id,
          ]);
        } else {
          // Remove after too many retries
          console.warn(`Removing ${item.entity_type} ${item.entity_id} from queue after 5 retries`);
          await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
        }
      }
    }
  }

  private async syncCreate(entityType: string, data: Record<string, unknown>) {
    const endpoint = this.getEndpoint(entityType);
    const response = await api.post(endpoint, data);
    return response.data;
  }

  private async syncUpdate(entityType: string, entityId: string, data: Record<string, unknown>) {
    const endpoint = this.getEndpoint(entityType);
    const response = await api.put(`${endpoint}/${entityId}`, data);
    return response.data;
  }

  private async syncDelete(entityType: string, entityId: string) {
    const endpoint = this.getEndpoint(entityType);
    await api.delete(`${endpoint}/${entityId}`);
  }

  private getEndpoint(entityType: string): string {
    const endpoints: Record<string, string> = {
      users: '/users',
      routines: '/routines',
      workouts: '/workouts',
      exercises: '/exercises',
      log_routines: '/log-routines',
      log_workouts: '/log-workouts',
      log_exercises: '/log-exercises',
      log_sets: '/log-sets',
    };
    return endpoints[entityType] || `/${entityType}`;
  }

  // Pull data from server
  async pullFromServer(userId: string) {
    try {
      console.log('Pulling data from server...');

      // Pull routines
      const routines = await api.get(`/routines/user/${userId}`);
      await this.saveRoutinesToLocal(routines.data);

      // Pull log routines (workout history)
      const logRoutines = await api.get(`/log-routines/user/${userId}`);
      await this.saveLogRoutinesToLocal(logRoutines.data);

      // Pull exercises
      const exercises = await api.get('/exercises');
      await this.saveExercisesToLocal(exercises.data);

      console.log('Pull from server completed');
    } catch (error) {
      console.error('Pull from server failed:', error);
      throw error;
    }
  }

  private async saveRoutinesToLocal(routines: unknown[]) {
    const db = await getDatabase();
    if (!db) return; // Skip on web

    for (const routineData of routines) {
      const routine = routineData as unknown as DbRoutine;
      await db.runAsync(
        `INSERT OR REPLACE INTO routines (id, user_id, name, description, created_at, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          routine.id,
          routine.userId,
          routine.name,
          routine.description || null,
          routine.createdAt,
          routine.updatedAt,
        ] as (string | number | null | boolean)[]
      );

      // Save workouts
      if (routine.workouts) {
        for (const workoutData of routine.workouts) {
          const workout = workoutData as unknown as DbWorkout;
          await db.runAsync(
            `INSERT OR REPLACE INTO workouts (id, routine_id, name, description, day_of_week, created_at, updated_at, synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              workout.id,
              routine.id,
              workout.name,
              workout.description || null,
              workout.dayOfWeek || null,
              workout.createdAt,
              workout.updatedAt,
            ] as (string | number | null | boolean)[]
          );

          // Save workout exercises
          if (workout.workoutExercises) {
            for (const we of workout.workoutExercises) {
              await db.runAsync(
                `INSERT OR REPLACE INTO workout_exercises (id, workout_id, exercise_id, order_index, sets, reps, rest_time_seconds, created_at, synced)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                  we.id,
                  workout.id,
                  we.exerciseId,
                  we.orderIndex,
                  we.sets,
                  we.reps || we.targetReps || null,
                  we.restTimeSeconds || we.restSeconds || null,
                  new Date().toISOString(),
                ] as (string | number | null | boolean)[]
              );
            }
          }
        }
      }
    }
  }

  private async saveLogRoutinesToLocal(logRoutines: unknown[]) {
    const db = await getDatabase();
    if (!db) return; // Skip on web

    for (const logRoutineData of logRoutines) {
      const logRoutine = logRoutineData as unknown as DbLogRoutine;
      await db.runAsync(
        `INSERT OR REPLACE INTO log_routines (id, routine_id, user_id, start_datetime, end_datetime, created_at, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          logRoutine.id,
          logRoutine.routineId,
          logRoutine.userId || '',
          logRoutine.startDatetime,
          logRoutine.endDatetime || null,
          new Date().toISOString(),
          new Date().toISOString(),
        ] as (string | number | null | boolean)[]
      );

      // Save log workouts
      if (logRoutine.logWorkouts) {
        for (const logWorkoutData of logRoutine.logWorkouts) {
          const logWorkout = logWorkoutData as unknown as DbLogWorkout;
          await db.runAsync(
            `INSERT OR REPLACE INTO log_workouts (id, log_routine_id, workout_id, start_datetime, end_datetime, created_at, synced)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [
              logWorkout.id,
              logRoutine.id,
              logWorkout.workoutId,
              logWorkout.startDatetime,
              logWorkout.endDatetime || null,
              new Date().toISOString(),
            ] as (string | number | null | boolean)[]
          );

          // Save log exercises
          if (logWorkout.logExercises) {
            for (const logExerciseData of logWorkout.logExercises) {
              const logExercise = logExerciseData as {
                id: string;
                exerciseId: string;
                exerciseName: string;
                startDatetime: string;
                endDatetime?: string;
                notes?: string;
                repetitions: number;
                completed: boolean;
                logSets?: unknown[];
              };
              await db.runAsync(
                `INSERT OR REPLACE INTO log_exercises (id, log_workout_id, exercise_id, exercise_name, start_datetime, end_datetime, notes, repetitions, completed, created_at, synced)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                  logExercise.id,
                  logWorkout.id,
                  logExercise.exerciseId,
                  logExercise.exerciseName,
                  logExercise.startDatetime,
                  logExercise.endDatetime || null,
                  logExercise.notes || null,
                  logExercise.repetitions,
                  logExercise.completed ? 1 : 0,
                  new Date().toISOString(),
                ] as (string | number | null | boolean)[]
              );

              // Save log sets
              if (logExercise.logSets) {
                for (const logSetData of logExercise.logSets) {
                  const logSet = logSetData as {
                    id: string;
                    setNumber: number;
                    reps: number;
                    weight?: number;
                    weightKg?: number;
                    restTimeSeconds?: number;
                    timestamp?: string;
                    notes?: string;
                    completed: boolean;
                  };
                  await db.runAsync(
                    `INSERT OR REPLACE INTO log_sets (id, log_exercise_id, set_number, reps, weight_kg, rest_time_seconds, timestamp, notes, created_at, synced)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [
                      logSet.id,
                      logExercise.id,
                      logSet.setNumber,
                      logSet.reps,
                      logSet.weightKg || logSet.weight || null,
                      logSet.restTimeSeconds || null,
                      logSet.timestamp || null,
                      logSet.notes || null,
                      new Date().toISOString(),
                    ] as (string | number | null | boolean)[]
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  private async saveExercisesToLocal(exercises: unknown[]) {
    const db = await getDatabase();
    if (!db) return; // Skip on web

    const now = new Date().toISOString();

    for (const exerciseData of exercises) {
      try {
        const exercise = exerciseData as unknown as DbExercise & {
          created_at?: string;
          updated_at?: string;
          video_url?: string;
        };
        // Ensure we always have valid timestamps
        const createdAt = exercise.createdAt || exercise.created_at || now;
        const updatedAt = exercise.updatedAt || exercise.updated_at || now;

        await db.runAsync(
          `INSERT OR REPLACE INTO exercises (id, name, description, video_url, created_at, updated_at, synced)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            exercise.id,
            exercise.name,
            exercise.description || null,
            exercise.videoUrl || exercise.video_url || null,
            createdAt,
            updatedAt,
          ]
        );
      } catch (error) {
        const exercise = exerciseData as unknown as { id?: string };
        console.error(`Failed to save exercise ${exercise.id}:`, error);
        // Continue with next exercise instead of failing entire sync
      }
    }
  }
}

export const syncService = new SyncService();

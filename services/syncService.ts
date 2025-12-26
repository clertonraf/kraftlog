import { getDatabase } from './database';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SyncStatus {
  lastSync: string | null;
  isSyncing: boolean;
  pendingChanges: number;
}

class SyncService {
  private isSyncing = false;
  private syncCallbacks: ((status: SyncStatus) => void)[] = [];

  // Subscribe to sync status updates
  subscribe(callback: (status: SyncStatus) => void) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(status: SyncStatus) {
    this.syncCallbacks.forEach(callback => callback(status));
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
    
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue'
    );
    const lastSync = await AsyncStorage.getItem('lastSync');
    
    return {
      lastSync,
      isSyncing: this.isSyncing,
      pendingChanges: result?.count || 0,
    };
  }

  async addToSyncQueue(entityType: string, entityId: string, operation: string, data: any) {
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
      // Use a simple endpoint to check connectivity
      // Try to get exercises list with a short timeout
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

  private async syncEntity(entityType: string) {
    console.log(`Syncing ${entityType}...`);
    // This will be implemented to fetch data from backend
    // and update local database
  }

  private async processSyncQueue() {
    const db = await getDatabase();
    if (!db) return; // Skip on web
    
    const queue = await db.getAllAsync<{
      id: number;
      entity_type: string;
      entity_id: string;
      operation: string;
      data: string;
      retry_count: number;
    }>('SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50');

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
          await db.runAsync(
            'UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?',
            [item.id]
          );
        } else {
          // Remove after too many retries
          console.warn(`Removing ${item.entity_type} ${item.entity_id} from queue after 5 retries`);
          await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
        }
      }
    }
  }

  private async syncCreate(entityType: string, data: any) {
    const endpoint = this.getEndpoint(entityType);
    const response = await api.post(endpoint, data);
    return response.data;
  }

  private async syncUpdate(entityType: string, entityId: string, data: any) {
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

  private async saveRoutinesToLocal(routines: any[]) {
    const db = await getDatabase();
    if (!db) return; // Skip on web
    
    for (const routine of routines) {
      await db.runAsync(
        `INSERT OR REPLACE INTO routines (id, user_id, name, description, created_at, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [routine.id, routine.userId, routine.name, routine.description, 
         routine.createdAt, routine.updatedAt]
      );

      // Save workouts
      if (routine.workouts) {
        for (const workout of routine.workouts) {
          await db.runAsync(
            `INSERT OR REPLACE INTO workouts (id, routine_id, name, description, day_of_week, created_at, updated_at, synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [workout.id, routine.id, workout.name, workout.description, 
             workout.dayOfWeek, workout.createdAt, workout.updatedAt]
          );

          // Save workout exercises
          if (workout.workoutExercises) {
            for (const we of workout.workoutExercises) {
              await db.runAsync(
                `INSERT OR REPLACE INTO workout_exercises (id, workout_id, exercise_id, order_index, sets, reps, rest_time_seconds, created_at, synced)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [we.id, workout.id, we.exerciseId, we.orderIndex, we.sets, we.reps, 
                 we.restTimeSeconds, new Date().toISOString()]
              );
            }
          }
        }
      }
    }
  }

  private async saveLogRoutinesToLocal(logRoutines: any[]) {
    const db = await getDatabase();
    if (!db) return; // Skip on web
    
    for (const logRoutine of logRoutines) {
      await db.runAsync(
        `INSERT OR REPLACE INTO log_routines (id, routine_id, user_id, start_datetime, end_datetime, created_at, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [logRoutine.id, logRoutine.routineId, logRoutine.userId || '', 
         logRoutine.startDatetime, logRoutine.endDatetime, 
         new Date().toISOString(), new Date().toISOString()]
      );

      // Save log workouts
      if (logRoutine.logWorkouts) {
        for (const logWorkout of logRoutine.logWorkouts) {
          await db.runAsync(
            `INSERT OR REPLACE INTO log_workouts (id, log_routine_id, workout_id, start_datetime, end_datetime, created_at, synced)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [logWorkout.id, logRoutine.id, logWorkout.workoutId, 
             logWorkout.startDatetime, logWorkout.endDatetime, new Date().toISOString()]
          );

          // Save log exercises
          if (logWorkout.logExercises) {
            for (const logExercise of logWorkout.logExercises) {
              await db.runAsync(
                `INSERT OR REPLACE INTO log_exercises (id, log_workout_id, exercise_id, exercise_name, start_datetime, end_datetime, notes, repetitions, completed, created_at, synced)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [logExercise.id, logWorkout.id, logExercise.exerciseId, logExercise.exerciseName,
                 logExercise.startDatetime, logExercise.endDatetime, logExercise.notes,
                 logExercise.repetitions, logExercise.completed ? 1 : 0, new Date().toISOString()]
              );

              // Save log sets
              if (logExercise.logSets) {
                for (const logSet of logExercise.logSets) {
                  await db.runAsync(
                    `INSERT OR REPLACE INTO log_sets (id, log_exercise_id, set_number, reps, weight_kg, rest_time_seconds, timestamp, notes, created_at, synced)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [logSet.id, logExercise.id, logSet.setNumber, logSet.reps, logSet.weightKg,
                     logSet.restTimeSeconds, logSet.timestamp, logSet.notes, new Date().toISOString()]
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  private async saveExercisesToLocal(exercises: any[]) {
    const db = await getDatabase();
    if (!db) return; // Skip on web
    
    const now = new Date().toISOString();
    
    for (const exercise of exercises) {
      // Always use current timestamp as backend doesn't provide these fields
      await db.runAsync(
        `INSERT OR REPLACE INTO exercises (id, name, description, video_url, created_at, updated_at, synced)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          exercise.id, 
          exercise.name, 
          exercise.description || null, 
          exercise.videoUrl || null,
          now,
          now
        ]
      );
    }
  }
}

export const syncService = new SyncService();

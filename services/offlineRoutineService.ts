import { getDatabase } from './database';
import { routineService as onlineRoutineService } from './routineService';
import { syncService } from './syncService';
import { v4 as uuidv4 } from 'uuid';

export interface RoutineLocal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

class OfflineRoutineService {
  // Get all routines for a user from local database
  async getRoutinesByUserId(userId: string, online = true): Promise<any[]> {
    const db = await getDatabase();
    
    // Try to get from local DB first
    const routines = await db.getAllAsync<RoutineLocal>(
      'SELECT * FROM routines WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // If online, try to sync first
    if (online) {
      try {
        await syncService.pullFromServer(userId);
        // Refetch after sync
        const updatedRoutines = await db.getAllAsync<RoutineLocal>(
          'SELECT * FROM routines WHERE user_id = ? ORDER BY created_at DESC',
          [userId]
        );
        return updatedRoutines;
      } catch (error) {
        console.log('Failed to sync, using local data');
      }
    }

    return routines;
  }

  // Get routine by ID from local database
  async getRoutineById(id: string): Promise<any> {
    const db = await getDatabase();
    
    const routine = await db.getFirstAsync(
      'SELECT * FROM routines WHERE id = ?',
      [id]
    );

    if (!routine) {
      throw new Error('Routine not found');
    }

    // Get workouts for this routine
    const workouts = await db.getAllAsync(
      'SELECT * FROM workouts WHERE routine_id = ? ORDER BY day_of_week',
      [id]
    );

    // Get exercises for each workout
    for (const workout of workouts as any[]) {
      workout.workoutExercises = await db.getAllAsync(
        `SELECT we.*, e.name as exercise_name 
         FROM workout_exercises we
         LEFT JOIN exercises e ON we.exercise_id = e.id
         WHERE we.workout_id = ?
         ORDER BY we.order_index`,
        [workout.id]
      );
    }

    return {
      ...routine,
      workouts,
    };
  }

  // Create routine (save locally and queue for sync)
  async createRoutine(data: any): Promise<any> {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO routines (id, user_id, name, description, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [id, data.userId, data.name, data.description || '', now, now]
    );

    // Add to sync queue
    await syncService.addToSyncQueue('routines', id, 'CREATE', {
      ...data,
      id,
    });

    // Try to sync immediately if online
    syncService.syncAll().catch(() => {
      console.log('Background sync will retry later');
    });

    return {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      synced: false,
    };
  }

  // Update routine
  async updateRoutine(id: string, data: any): Promise<any> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE routines 
       SET name = ?, description = ?, updated_at = ?, synced = 0
       WHERE id = ?`,
      [data.name, data.description || '', now, id]
    );

    // Add to sync queue
    await syncService.addToSyncQueue('routines', id, 'UPDATE', data);

    // Try to sync immediately if online
    syncService.syncAll().catch(() => {
      console.log('Background sync will retry later');
    });

    return { id, ...data, updatedAt: now, synced: false };
  }

  // Delete routine
  async deleteRoutine(id: string): Promise<void> {
    const db = await getDatabase();

    // Delete from local database (cascade will handle related records)
    await db.runAsync('DELETE FROM routines WHERE id = ?', [id]);

    // Add to sync queue
    await syncService.addToSyncQueue('routines', id, 'DELETE', {});

    // Try to sync immediately if online
    syncService.syncAll().catch(() => {
      console.log('Background sync will retry later');
    });
  }
}

export const offlineRoutineService = new OfflineRoutineService();

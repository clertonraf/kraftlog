import { getDatabase } from './database';
import { routineService as onlineRoutineService } from './routineService';
import { syncService } from './syncService';
import { v4 as uuidv4 } from '@/utils/uuid';

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
      `INSERT INTO routines (id, user_id, name, description, is_active, start_date, end_date, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        data.userId,
        data.name,
        data.description || '',
        data.isActive ? 1 : 0,
        data.startDate || null,
        data.endDate || null,
        now,
        now
      ]
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

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }
    if (data.startDate !== undefined) {
      updates.push('start_date = ?');
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push('end_date = ?');
      values.push(data.endDate);
    }

    updates.push('updated_at = ?', 'synced = 0');
    values.push(now, id);

    await db.runAsync(
      `UPDATE routines SET ${updates.join(', ')} WHERE id = ?`,
      values
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

  // Create workout
  async createWorkout(data: any): Promise<any> {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO workouts (id, routine_id, name, description, day_of_week, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, data.routineId, data.name, data.description || '', data.dayOfWeek || null, now, now]
    );

    // Add to sync queue
    await syncService.addToSyncQueue('workouts', id, 'CREATE', {
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

  // Update workout
  async updateWorkout(id: string, data: any): Promise<any> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE workouts 
       SET name = ?, description = ?, day_of_week = ?, updated_at = ?, synced = 0
       WHERE id = ?`,
      [data.name, data.description || '', data.dayOfWeek || null, now, id]
    );

    // Add to sync queue
    await syncService.addToSyncQueue('workouts', id, 'UPDATE', data);

    // Try to sync immediately if online
    syncService.syncAll().catch(() => {
      console.log('Background sync will retry later');
    });

    return { id, ...data, updatedAt: now, synced: false };
  }

  // Delete workout
  async deleteWorkout(id: string): Promise<void> {
    const db = await getDatabase();

    // Delete from local database (cascade will handle related records)
    await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);

    // Add to sync queue
    await syncService.addToSyncQueue('workouts', id, 'DELETE', {});

    // Try to sync immediately if online
    syncService.syncAll().catch(() => {
      console.log('Background sync will retry later');
    });
  }

  // Get workout by ID
  async getWorkoutById(id: string): Promise<any> {
    const db = await getDatabase();
    
    const workout = await db.getFirstAsync(
      'SELECT * FROM workouts WHERE id = ?',
      [id]
    );

    if (!workout) {
      throw new Error('Workout not found');
    }

    // Get exercises for this workout
    const workoutExercises = await db.getAllAsync(
      `SELECT we.*, e.name as exercise_name 
       FROM workout_exercises we
       LEFT JOIN exercises e ON we.exercise_id = e.id
       WHERE we.workout_id = ?
       ORDER BY we.order_index`,
      [id]
    );

    return {
      ...workout,
      workoutExercises,
    };
  }
}

export const offlineRoutineService = new OfflineRoutineService();

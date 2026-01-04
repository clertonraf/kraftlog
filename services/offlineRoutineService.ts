import { v4 as uuidv4 } from '@/utils/uuid';
import { getDatabase } from './database';
import { syncService } from './syncService';

export interface RoutineLocal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

interface DbRoutineRow {
  id: string;
  user_id?: string;
  userId?: string;
  name: string;
  description?: string;
  is_active?: number;
  isActive?: boolean;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  synced?: boolean;
  workouts?: DbRoutineRow[];
  workoutExercises?: unknown[];
}

// Helper to transform database snake_case to camelCase
const transformRoutine = (routine: DbRoutineRow) => ({
  ...routine,
  userId: routine.user_id || routine.userId,
  isActive: routine.is_active === 1,
  startDate: routine.start_date || routine.startDate,
  endDate: routine.end_date || routine.endDate,
  createdAt: routine.created_at || routine.createdAt,
  updatedAt: routine.updated_at || routine.updatedAt,
});

class OfflineRoutineService {
  // Helper method to check database availability
  private async checkDatabase() {
    const db = await getDatabase();
    if (!db) {
      throw new Error('Database not available on this platform (web not supported)');
    }
    return db;
  }

  // Get all routines for a user from local database
  async getRoutinesByUserId(userId: string, _online = false): Promise<DbRoutineRow[]> {
    try {
      const db = await getDatabase();
      if (!db) {
        console.log('Database not available (web platform or not initialized)');
        return [];
      }

      // Check if db has getAllAsync method (SQLite) or custom methods (Web)
      let routines: DbRoutineRow[];
      if (typeof db.getAllAsync === 'function') {
        // SQLite database (native)
        routines = (await db.getAllAsync(
          'SELECT * FROM routines WHERE user_id = ? ORDER BY created_at DESC',
          [userId]
        )) as DbRoutineRow[];
      } else {
        // Web - no offline support on web
        console.log('Web database not supported for offline routines');
        return [];
      }

      // Transform to camelCase
      return routines.map(transformRoutine);
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.log('Error loading routines:', err.message);
      return [];
    }
  }

  // Get routine by ID from local database
  async getRoutineById(id: string): Promise<DbRoutineRow> {
    const db = await this.checkDatabase();

    const routine = await db.getFirstAsync('SELECT * FROM routines WHERE id = ?', [id]);

    if (!routine) {
      throw new Error('Routine not found');
    }

    // Get workouts for this routine
    const workouts = await db.getAllAsync(
      'SELECT * FROM workouts WHERE routine_id = ? ORDER BY day_of_week',
      [id]
    );

    // Get exercises for each workout
    for (const workout of workouts as DbRoutineRow[]) {
      workout.workoutExercises = await db.getAllAsync(
        `SELECT we.*, e.name as exercise_name 
         FROM workout_exercises we
         LEFT JOIN exercises e ON we.exercise_id = e.id
         WHERE we.workout_id = ?
         ORDER BY we.order_index`,
        [workout.id]
      );
    }

    return transformRoutine({
      ...(routine as DbRoutineRow),
      workouts: workouts as unknown as DbRoutineRow[],
    } as DbRoutineRow);
  }

  // Create routine (save locally and queue for sync)
  async createRoutine(data: Record<string, unknown>): Promise<DbRoutineRow> {
    const db = await this.checkDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO routines (id, user_id, name, description, is_active, start_date, end_date, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        data.userId as string,
        data.name as string,
        (data.description as string) || '',
        data.isActive ? 1 : 0,
        (data.startDate as string | null) || null,
        (data.endDate as string | null) || null,
        now,
        now,
      ] as (string | number | null | boolean)[]
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
    } as DbRoutineRow;
  }

  // Update routine
  async updateRoutine(id: string, data: Record<string, unknown>): Promise<DbRoutineRow> {
    const db = await this.checkDatabase();
    const now = new Date().toISOString();

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name as string);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description as string);
    }
    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }
    if (data.startDate !== undefined) {
      updates.push('start_date = ?');
      values.push(data.startDate as string | null);
    }
    if (data.endDate !== undefined) {
      updates.push('end_date = ?');
      values.push(data.endDate as string | null);
    }

    updates.push('updated_at = ?', 'synced = 0');
    values.push(now, id);

    await db.runAsync(
      `UPDATE routines SET ${updates.join(', ')} WHERE id = ?`,
      values as (string | number | null | boolean)[]
    );

    // Add to sync queue
    await syncService.addToSyncQueue('routines', id, 'UPDATE', data);

    // Try to sync immediately if online
    syncService.syncAll().catch(() => {
      console.log('Background sync will retry later');
    });

    // Return the updated routine
    return this.getRoutineById(id);
  }

  // Activate routine (deactivate all others first)
  async activateRoutine(id: string): Promise<DbRoutineRow> {
    console.log('[offlineRoutineService] Activating routine:', id);
    const db = await this.checkDatabase();

    // First, deactivate all routines
    console.log('[offlineRoutineService] Deactivating all routines');
    await db.runAsync('UPDATE routines SET is_active = 0 WHERE is_active = 1');

    // Then activate the selected routine
    console.log('[offlineRoutineService] Activating selected routine');
    const result = await this.updateRoutine(id, {
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
    });
    console.log('[offlineRoutineService] Routine activated:', result);
    return result;
  }

  // Delete routine
  async deleteRoutine(id: string): Promise<void> {
    const db = await this.checkDatabase();

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
  async createWorkout(data: Record<string, unknown>): Promise<DbRoutineRow> {
    const db = await this.checkDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO workouts (id, routine_id, name, description, day_of_week, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        data.routineId as string,
        data.name as string,
        (data.description as string) || '',
        (data.dayOfWeek as number | null) || null,
        now,
        now,
      ] as (string | number | null | boolean)[]
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
    } as DbRoutineRow;
  }

  // Update workout
  async updateWorkout(id: string, data: Record<string, unknown>): Promise<DbRoutineRow> {
    const db = await this.checkDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE workouts 
       SET name = ?, description = ?, day_of_week = ?, updated_at = ?, synced = 0
       WHERE id = ?`,
      [
        data.name as string,
        (data.description as string) || '',
        (data.dayOfWeek as number | null) || null,
        now,
        id,
      ] as (string | number | null | boolean)[]
    );

    // Add to sync queue
    await syncService.addToSyncQueue('workouts', id, 'UPDATE', data);

    // Try to sync immediately if online
    syncService.syncAll().catch(() => {
      console.log('Background sync will retry later');
    });

    return {
      id,
      name: data.name as string,
      ...data,
      updatedAt: now,
      synced: false,
    } as DbRoutineRow;
  }

  // Delete workout
  async deleteWorkout(id: string): Promise<void> {
    const db = await this.checkDatabase();

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
  async getWorkoutById(id: string): Promise<DbRoutineRow> {
    const db = await this.checkDatabase();

    const workout = await db.getFirstAsync('SELECT * FROM workouts WHERE id = ?', [id]);

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
    } as DbRoutineRow;
  }
}

export const offlineRoutineService = new OfflineRoutineService();

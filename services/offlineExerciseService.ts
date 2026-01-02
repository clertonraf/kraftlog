import { getDatabase } from './database';
import { ExerciseResponse, MuscleResponse, MuscleGroup, EquipmentType } from './exerciseService';
import { v4 as uuidv4 } from 'uuid';

export const offlineExerciseService = {
  async getAllExercises(): Promise<ExerciseResponse[]> {
    const db = await getDatabase();
    if (!db) return [];

    try {
      const exercises = await db.getAllAsync<any>(`
        SELECT * FROM exercises ORDER BY name ASC
      `);

      // Get muscles for each exercise
      const exercisesWithMuscles = await Promise.all(
        exercises.map(async (exercise) => {
          const muscles = await db.getAllAsync<any>(`
            SELECT m.* FROM muscles m
            INNER JOIN exercise_muscles em ON m.id = em.muscle_id
            WHERE em.exercise_id = ?
          `, [exercise.id]);

          return {
            id: exercise.id,
            name: exercise.name,
            description: exercise.description,
            videoUrl: exercise.video_url,
            equipmentType: exercise.equipment_type as EquipmentType,
            muscles: muscles.map(m => ({
              id: m.id,
              name: m.name,
              muscleGroup: m.muscle_group as MuscleGroup,
            })),
          };
        })
      );

      return exercisesWithMuscles;
    } catch (error) {
      console.error('Error loading exercises from local database:', error);
      return [];
    }
  },

  async createExercise(data: {
    name: string;
    description?: string;
    videoUrl?: string;
    equipmentType?: EquipmentType;
    muscleIds?: string[];
  }): Promise<ExerciseResponse> {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.runAsync(`
      INSERT INTO exercises (id, name, description, video_url, equipment_type, created_at, updated_at, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [id, data.name, data.description || null, data.videoUrl || null, data.equipmentType || null, now, now]);

    // Add muscles
    if (data.muscleIds && data.muscleIds.length > 0) {
      for (const muscleId of data.muscleIds) {
        await db.runAsync(`
          INSERT INTO exercise_muscles (id, exercise_id, muscle_id)
          VALUES (?, ?, ?)
        `, [uuidv4(), id, muscleId]);
      }
    }

    // Get the created exercise
    const exercises = await this.getAllExercises();
    return exercises.find(e => e.id === id) || {
      id,
      name: data.name,
      description: data.description,
      videoUrl: data.videoUrl,
      equipmentType: data.equipmentType,
      muscles: [],
    };
  },

  async updateExercise(id: string, data: {
    name?: string;
    description?: string;
    videoUrl?: string;
    equipmentType?: EquipmentType;
    muscleIds?: string[];
  }): Promise<ExerciseResponse> {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const now = new Date().toISOString();

    // Build update query dynamically
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
    if (data.videoUrl !== undefined) {
      updates.push('video_url = ?');
      values.push(data.videoUrl);
    }
    if (data.equipmentType !== undefined) {
      updates.push('equipment_type = ?');
      values.push(data.equipmentType);
    }

    updates.push('updated_at = ?');
    values.push(now);
    updates.push('synced = 0');
    values.push(id);

    await db.runAsync(`
      UPDATE exercises SET ${updates.join(', ')}
      WHERE id = ?
    `, values);

    // Update muscles if provided
    if (data.muscleIds) {
      // Remove existing muscles
      await db.runAsync('DELETE FROM exercise_muscles WHERE exercise_id = ?', [id]);

      // Add new muscles
      for (const muscleId of data.muscleIds) {
        await db.runAsync(`
          INSERT INTO exercise_muscles (id, exercise_id, muscle_id)
          VALUES (?, ?, ?)
        `, [uuidv4(), id, muscleId]);
      }
    }

    const exercises = await this.getAllExercises();
    const updated = exercises.find(e => e.id === id);
    if (!updated) throw new Error('Exercise not found after update');
    return updated;
  },

  async deleteExercise(id: string): Promise<void> {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    await db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
  },

  async getAllMuscles(): Promise<MuscleResponse[]> {
    const db = await getDatabase();
    if (!db) return [];

    try {
      const muscles = await db.getAllAsync<any>('SELECT * FROM muscles ORDER BY name ASC');
      return muscles.map(m => ({
        id: m.id,
        name: m.name,
        muscleGroup: m.muscle_group as MuscleGroup,
      }));
    } catch (error) {
      console.error('Error loading muscles from local database:', error);
      return [];
    }
  },

  async createMuscle(name: string, muscleGroup: MuscleGroup): Promise<MuscleResponse> {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');

    const id = uuidv4();
    await db.runAsync(`
      INSERT INTO muscles (id, name, muscle_group)
      VALUES (?, ?, ?)
    `, [id, name, muscleGroup]);

    return { id, name, muscleGroup };
  },
};

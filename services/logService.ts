import api from './api';
import { isOfflineMode } from './api';
import { getDatabase } from './database';

export interface LogSetResponse {
  id: string;
  logExerciseId: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  restTimeSeconds?: number;
  timestamp: string;
  notes?: string;
}

export interface LogSetCreateRequest {
  logExerciseId: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  restTimeSeconds?: number;
  notes?: string;
}

export interface LogExerciseResponse {
  id: string;
  logWorkoutId: string;
  exerciseId: string;
  exerciseName?: string;
  startDatetime?: string;
  endDatetime?: string;
  notes?: string;
  repetitions?: number;
  completed?: boolean;
  logSets: LogSetResponse[];
}

export interface LogExerciseCreateRequest {
  logWorkoutId: string;
  exerciseId: string;
  startDatetime?: string;
  endDatetime?: string;
  notes?: string;
  repetitions?: number;
  completed?: boolean;
}

export interface LogWorkoutResponse {
  id: string;
  logRoutineId: string;
  workoutId: string;
  startDatetime: string;
  endDatetime?: string;
  logExercises: LogExerciseResponse[];
}

export interface LogWorkoutCreateRequest {
  logRoutineId: string;
  workoutId: string;
  startDatetime: string;
  endDatetime?: string;
}

export interface LogRoutineResponse {
  id: string;
  routineId: string;
  startDatetime: string;
  endDatetime?: string;
  logWorkouts: LogWorkoutResponse[];
}

export interface LogRoutineCreateRequest {
  routineId: string;
  startDatetime: string;
  endDatetime?: string;
}

export const logRoutineService = {
  async createLogRoutine(data: LogRoutineCreateRequest): Promise<LogRoutineResponse> {
    const response = await api.post<LogRoutineResponse>('/log-routines', data);
    return response.data;
  },

  async getLogRoutineById(id: string): Promise<LogRoutineResponse> {
    const response = await api.get<LogRoutineResponse>(`/log-routines/${id}`);
    return response.data;
  },

  async getAllLogRoutines(): Promise<LogRoutineResponse[]> {
    const response = await api.get<LogRoutineResponse[]>('/log-routines');
    return response.data;
  },

  async getLogRoutinesByUserId(userId: string): Promise<LogRoutineResponse[]> {
    if (await isOfflineMode()) {
      // Return data from local database
      const db = await getDatabase();
      if (!db) return [];
      
      try {
        const logRoutines = await db.getAllAsync<any>(`
          SELECT * FROM log_routines 
          WHERE user_id = ? 
          ORDER BY start_datetime DESC
        `, [userId]);
        
        // Get workouts for each log routine
        const result = await Promise.all(
          logRoutines.map(async (logRoutine) => {
            const logWorkouts = await db.getAllAsync<any>(`
              SELECT * FROM log_workouts 
              WHERE log_routine_id = ?
            `, [logRoutine.id]);
            
            // Get exercises for each workout
            for (const workout of logWorkouts) {
              const logExercises = await db.getAllAsync<any>(`
                SELECT * FROM log_exercises 
                WHERE log_workout_id = ?
              `, [workout.id]);
              
              // Get sets for each exercise
              for (const exercise of logExercises) {
                const logSets = await db.getAllAsync<any>(`
                  SELECT * FROM log_sets 
                  WHERE log_exercise_id = ?
                  ORDER BY set_number
                `, [exercise.id]);
                
                exercise.logSets = logSets.map(set => ({
                  id: set.id,
                  logExerciseId: set.log_exercise_id,
                  setNumber: set.set_number,
                  reps: set.reps,
                  weightKg: set.weight_kg,
                  restTimeSeconds: set.rest_time_seconds,
                  timestamp: set.timestamp,
                  notes: set.notes,
                }));
              }
              
              workout.logExercises = logExercises.map(ex => ({
                id: ex.id,
                logWorkoutId: ex.log_workout_id,
                exerciseId: ex.exercise_id,
                exerciseName: ex.exercise_name,
                startDatetime: ex.start_datetime,
                endDatetime: ex.end_datetime,
                notes: ex.notes,
                repetitions: ex.repetitions,
                completed: ex.completed === 1,
                logSets: ex.logSets,
              }));
            }
            
            return {
              id: logRoutine.id,
              routineId: logRoutine.routine_id,
              userId: logRoutine.user_id,
              startDatetime: logRoutine.start_datetime,
              endDatetime: logRoutine.end_datetime,
              logWorkouts: logWorkouts.map(w => ({
                id: w.id,
                logRoutineId: w.log_routine_id,
                workoutId: w.workout_id,
                startDatetime: w.start_datetime,
                endDatetime: w.end_datetime,
                logExercises: w.logExercises,
              })),
            };
          })
        );
        
        return result;
      } catch (error) {
        console.error('Error loading log routines from local database:', error);
        return [];
      }
    }
    
    const response = await api.get<LogRoutineResponse[]>(`/log-routines/user/${userId}`);
    return response.data;
  },

  async getLogRoutinesByRoutineId(routineId: string): Promise<LogRoutineResponse[]> {
    if (await isOfflineMode()) {
      // TODO: Implement offline log routines service
      return [];
    }
    const response = await api.get<LogRoutineResponse[]>(`/log-routines/routine/${routineId}`);
    return response.data;
  },

  async updateLogRoutine(id: string, data: Partial<LogRoutineCreateRequest>): Promise<LogRoutineResponse> {
    const response = await api.put<LogRoutineResponse>(`/log-routines/${id}`, data);
    return response.data;
  },

  async deleteLogRoutine(id: string): Promise<void> {
    if (await isOfflineMode()) {
      const db = await getDatabase();
      if (!db) throw new Error('Database not available');
      
      // Delete cascade will handle related records
      await db.runAsync('DELETE FROM log_routines WHERE id = ?', [id]);
      return;
    }
    
    await api.delete(`/log-routines/${id}`);
  },

  async completeLogRoutine(id: string): Promise<LogRoutineResponse> {
    // First fetch the current log routine to get required fields
    const logRoutine = await api.get<LogRoutineResponse>(`/log-routines/${id}`);
    const now = new Date().toISOString();
    
    // Update with all required fields
    const response = await api.put<LogRoutineResponse>(`/log-routines/${id}`, {
      routineId: logRoutine.data.routineId,
      startDatetime: logRoutine.data.startDatetime,
      endDatetime: now,
    });
    return response.data;
  },
};

export const logWorkoutService = {
  async createLogWorkout(data: LogWorkoutCreateRequest): Promise<LogWorkoutResponse> {
    const response = await api.post<LogWorkoutResponse>('/log-workouts', data);
    return response.data;
  },

  async getLogWorkoutById(id: string): Promise<LogWorkoutResponse> {
    const response = await api.get<LogWorkoutResponse>(`/log-workouts/${id}`);
    return response.data;
  },

  async updateLogWorkout(id: string, data: Partial<LogWorkoutCreateRequest>): Promise<LogWorkoutResponse> {
    const response = await api.put<LogWorkoutResponse>(`/log-workouts/${id}`, data);
    return response.data;
  },

  async deleteLogWorkout(id: string): Promise<void> {
    await api.delete(`/log-workouts/${id}`);
  },

  async completeLogWorkout(id: string): Promise<LogWorkoutResponse> {
    const now = new Date().toISOString();
    const response = await api.put<LogWorkoutResponse>(`/log-workouts/${id}`, { endDatetime: now });
    return response.data;
  },

  async getLastCompletedWorkout(workoutId: string): Promise<LogWorkoutResponse | null> {
    try {
      const response = await api.get<LogWorkoutResponse>(`/log-workouts/workout/${workoutId}/last`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

export const logExerciseService = {
  async createLogExercise(data: LogExerciseCreateRequest): Promise<LogExerciseResponse> {
    const response = await api.post<LogExerciseResponse>('/log-exercises', data);
    return response.data;
  },

  async getLogExerciseById(id: string): Promise<LogExerciseResponse> {
    const response = await api.get<LogExerciseResponse>(`/log-exercises/${id}`);
    return response.data;
  },

  async updateLogExercise(id: string, data: Partial<LogExerciseCreateRequest>): Promise<LogExerciseResponse> {
    const response = await api.put<LogExerciseResponse>(`/log-exercises/${id}`, data);
    return response.data;
  },

  async deleteLogExercise(id: string): Promise<void> {
    await api.delete(`/log-exercises/${id}`);
  },

  async completeLogExercise(id: string): Promise<LogExerciseResponse> {
    const response = await api.put<LogExerciseResponse>(`/log-exercises/${id}`, { 
      completed: true,
      endDatetime: new Date().toISOString()
    });
    return response.data;
  },
};

export const logSetService = {
  async createLogSet(data: LogSetCreateRequest): Promise<LogSetResponse> {
    const response = await api.post<LogSetResponse>('/log-sets', data);
    return response.data;
  },

  async getLogSetById(id: string): Promise<LogSetResponse> {
    const response = await api.get<LogSetResponse>(`/log-sets/${id}`);
    return response.data;
  },

  async updateLogSet(id: string, data: Partial<LogSetCreateRequest>): Promise<LogSetResponse> {
    const response = await api.put<LogSetResponse>(`/log-sets/${id}`, data);
    return response.data;
  },

  async deleteLogSet(id: string): Promise<void> {
    await api.delete(`/log-sets/${id}`);
  },
};

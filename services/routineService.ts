// @ts-nocheck
import api, { isOfflineMode } from './api';
import type { MuscleResponse } from './exerciseService';
import { offlineRoutineService } from './offlineRoutineService';

export interface WorkoutExerciseResponse {
  exerciseId: string;
  exerciseName: string;
  exerciseDescription?: string;
  videoUrl?: string;
  recommendedSets?: number;
  recommendedReps?: number;
  trainingTechnique?: string;
  orderIndex?: number;
}

export interface WorkoutResponse {
  id: string;
  name: string;
  orderIndex?: number;
  intervalMinutes?: number;
  routineId: string;
  exercises: WorkoutExerciseResponse[];
  muscles: MuscleResponse[];
}

export interface WorkoutCreateRequest {
  name: string;
  orderIndex?: number;
  intervalMinutes?: number;
  routineId: string;
  exerciseIds?: string[];
  muscleIds?: string[];
}

export interface AerobicActivityResponse {
  id: string;
  name: string;
  durationMinutes?: number;
  caloriesBurned?: number;
}

export interface RoutineResponse {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  userId: string;
  workouts: WorkoutResponse[];
  aerobicActivities: AerobicActivityResponse[];
}

export interface RoutineCreateRequest {
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  userId: string;
}

export interface RoutineUpdateRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export const routineService = {
  async getAllRoutines(): Promise<RoutineResponse[]> {
    if (await isOfflineMode()) {
      // In offline mode, return empty array or user-specific routines
      return [];
    }
    const response = await api.get<RoutineResponse[]>('/routines');
    return response.data;
  },

  async getRoutineById(id: string): Promise<RoutineResponse> {
    if (await isOfflineMode()) {
      return offlineRoutineService.getRoutineById(id);
    }
    const response = await api.get<RoutineResponse>(`/routines/${id}`);
    return response.data;
  },

  async getRoutinesByUserId(userId: string): Promise<RoutineResponse[]> {
    if (await isOfflineMode()) {
      return offlineRoutineService.getRoutinesByUserId(userId, false);
    }
    const response = await api.get<RoutineResponse[]>(`/routines/user/${userId}`);
    return response.data;
  },

  async createRoutine(data: RoutineCreateRequest): Promise<RoutineResponse> {
    if (await isOfflineMode()) {
      return offlineRoutineService.createRoutine(data);
    }
    const response = await api.post<RoutineResponse>('/routines', data);
    return response.data;
  },

  async updateRoutine(id: string, data: RoutineUpdateRequest): Promise<RoutineResponse> {
    if (await isOfflineMode()) {
      return offlineRoutineService.updateRoutine(id, data);
    }
    const response = await api.put<RoutineResponse>(`/routines/${id}`, data);
    return response.data;
  },

  async deleteRoutine(id: string): Promise<void> {
    if (await isOfflineMode()) {
      return offlineRoutineService.deleteRoutine(id);
    }
    await api.delete(`/routines/${id}`);
  },

  async activateRoutine(id: string): Promise<RoutineResponse> {
    if (await isOfflineMode()) {
      return offlineRoutineService.activateRoutine(id);
    }
    const response = await api.put<RoutineResponse>(`/routines/${id}/activate`);
    return response.data;
  },

  async deactivateRoutine(id: string): Promise<RoutineResponse> {
    if (await isOfflineMode()) {
      return offlineRoutineService.updateRoutine(id, { isActive: false });
    }
    const response = await api.put<RoutineResponse>(`/routines/${id}`, { isActive: false });
    return response.data;
  },
};

export const workoutService = {
  async createWorkout(data: WorkoutCreateRequest): Promise<WorkoutResponse> {
    if (await isOfflineMode()) {
      return offlineRoutineService.createWorkout(data);
    }
    const response = await api.post<WorkoutResponse>('/workouts', data);
    return response.data;
  },

  async getWorkoutById(id: string): Promise<WorkoutResponse> {
    if (await isOfflineMode()) {
      return offlineRoutineService.getWorkoutById(id);
    }
    const response = await api.get<WorkoutResponse>(`/workouts/${id}`);
    return response.data;
  },

  async updateWorkout(id: string, data: Partial<WorkoutCreateRequest>): Promise<WorkoutResponse> {
    if (await isOfflineMode()) {
      return offlineRoutineService.updateWorkout(id, data);
    }
    const response = await api.put<WorkoutResponse>(`/workouts/${id}`, data);
    return response.data;
  },

  async deleteWorkout(id: string): Promise<void> {
    if (await isOfflineMode()) {
      return offlineRoutineService.deleteWorkout(id);
    }
    await api.delete(`/workouts/${id}`);
  },

  async getWorkoutsByRoutineId(routineId: string): Promise<WorkoutResponse[]> {
    if (await isOfflineMode()) {
      // In offline mode, get workouts from the routine response
      const routine = await offlineRoutineService.getRoutineById(routineId);
      return (routine as unknown as { workouts?: WorkoutResponse[] }).workouts || [];
    }
    const response = await api.get<WorkoutResponse[]>(`/workouts/routine/${routineId}`);
    return response.data;
  },
};

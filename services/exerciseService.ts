import api from './api';
import { isOfflineMode } from './api';
import { offlineExerciseService } from './offlineExerciseService';
import {
  MuscleGroup,
  EquipmentType,
} from '@/types/exercise';
import type {
  MuscleResponse,
  ExerciseResponse,
  ExerciseUpdateRequest,
  ImportResult,
} from '@/types/exercise';

// Re-export types for backward compatibility
export type {
  MuscleResponse,
  ExerciseResponse,
  ExerciseUpdateRequest,
  ImportResult,
};

// Re-export enums (must be imported as values, not types)
export { MuscleGroup, EquipmentType };

export const exerciseService = {
  async getAllExercises(): Promise<ExerciseResponse[]> {
    if (await isOfflineMode()) {
      return offlineExerciseService.getAllExercises();
    }
    const response = await api.get<ExerciseResponse[]>('/exercises');
    return response.data;
  },

  async getExerciseById(id: string): Promise<ExerciseResponse> {
    if (await isOfflineMode()) {
      const exercises = await offlineExerciseService.getAllExercises();
      const exercise = exercises.find(e => e.id === id);
      if (!exercise) throw new Error('Exercise not found');
      return exercise;
    }
    const response = await api.get<ExerciseResponse>(`/exercises/${id}`);
    return response.data;
  },

  async updateExercise(id: string, data: ExerciseUpdateRequest): Promise<ExerciseResponse> {
    if (await isOfflineMode()) {
      return offlineExerciseService.updateExercise(id, data);
    }
    const response = await api.put<ExerciseResponse>(`/exercises/${id}`, data);
    return response.data;
  },

  async createExercise(data: ExerciseUpdateRequest): Promise<ExerciseResponse> {
    if (await isOfflineMode()) {
      return offlineExerciseService.createExercise(data);
    }
    const response = await api.post<ExerciseResponse>('/admin/exercises', data);
    return response.data;
  },

  async deleteExercise(id: string): Promise<void> {
    if (await isOfflineMode()) {
      return offlineExerciseService.deleteExercise(id);
    }
    await api.delete(`/exercises/${id}`);
  },

  async getAllMuscles(): Promise<MuscleResponse[]> {
    if (await isOfflineMode()) {
      return offlineExerciseService.getAllMuscles();
    }
    const response = await api.get<MuscleResponse[]>('/muscles');
    return response.data;
  },

  async importExercisesFromPdf(formData: FormData): Promise<ImportResult> {
    // PDF import only works with server
    if (await isOfflineMode()) {
      throw new Error('PDF import is only available in remote server mode');
    }
    const response = await api.post<ImportResult>('/admin/exercises/import-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

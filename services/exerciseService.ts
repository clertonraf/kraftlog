import api from './api';

export interface MuscleResponse {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
}

export enum MuscleGroup {
  CHEST = 'CHEST',
  DELTOIDS = 'DELTOIDS',
  SHOULDERS = 'SHOULDERS',
  BICEPS = 'BICEPS',
  TRICEPS = 'TRICEPS',
  BACK = 'BACK',
  FOREARMS = 'FOREARMS',
  GLUTES = 'GLUTES',
  LEGS = 'LEGS',
  CALVES = 'CALVES',
}

export enum EquipmentType {
  BARBELL = 'BARBELL',
  DUMBBELL = 'DUMBBELL',
  MACHINE = 'MACHINE',
  CABLE = 'CABLE',
  BODYWEIGHT = 'BODYWEIGHT',
  OTHER = 'OTHER',
}

export interface ExerciseResponse {
  id: string;
  name: string;
  description?: string;
  sets?: number;
  repetitions?: number;
  technique?: string;
  defaultWeightKg?: number;
  videoUrl?: string;
  equipmentType?: EquipmentType;
  muscles: MuscleResponse[];
}

export interface ExerciseUpdateRequest {
  name?: string;
  description?: string;
  sets?: number;
  repetitions?: number;
  technique?: string;
  defaultWeightKg?: number;
  videoUrl?: string;
  equipmentType?: EquipmentType;
  muscleIds?: string[];
}

export interface ImportResult {
  status: string;
  message: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  failures: any[];
}

export const exerciseService = {
  async getAllExercises(): Promise<ExerciseResponse[]> {
    const response = await api.get<ExerciseResponse[]>('/exercises');
    return response.data;
  },

  async getExerciseById(id: string): Promise<ExerciseResponse> {
    const response = await api.get<ExerciseResponse>(`/exercises/${id}`);
    return response.data;
  },

  async updateExercise(id: string, data: ExerciseUpdateRequest): Promise<ExerciseResponse> {
    const response = await api.put<ExerciseResponse>(`/exercises/${id}`, data);
    return response.data;
  },

  async createExercise(data: ExerciseUpdateRequest): Promise<ExerciseResponse> {
    const response = await api.post<ExerciseResponse>('/admin/exercises', data);
    return response.data;
  },

  async deleteExercise(id: string): Promise<void> {
    await api.delete(`/exercises/${id}`);
  },

  async getAllMuscles(): Promise<MuscleResponse[]> {
    const response = await api.get<MuscleResponse[]>('/muscles');
    return response.data;
  },

  async importExercisesFromPdf(formData: FormData): Promise<ImportResult> {
    const response = await api.post<ImportResult>('/admin/exercises/import-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

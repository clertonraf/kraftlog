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
  failures: Array<{ exercise: string; error: string }>;
}

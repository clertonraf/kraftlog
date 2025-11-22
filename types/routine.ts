export interface Routine {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  userId: string;
  workouts?: Workout[];
}

export interface RoutineCreateRequest {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  userId: string;
}

export interface Workout {
  id: string;
  name: string;
  orderIndex: number;
  intervalMinutes: number;
  routineId: string;
  exercises?: WorkoutExerciseResponse[];
  muscles?: Muscle[];
}

export interface WorkoutCreateRequest {
  name: string;
  orderIndex?: number;
  intervalMinutes?: number;
  routineId: string;
  exercises?: WorkoutExerciseRequest[];
  muscleIds?: string[];
}

export interface WorkoutExerciseRequest {
  exerciseId: string;
  recommendedSets?: number;
  recommendedReps?: number;
  trainingTechnique?: string;
  orderIndex?: number;
}

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

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  orderIndex: number;
  recommendedWeight?: number;
  recommendedReps?: number;
  technique?: WorkoutTechnique;
  exercise?: Exercise;
}

export interface WorkoutExerciseCreateRequest {
  workoutId: string;
  exerciseId: string;
  orderIndex: number;
  recommendedWeight?: number;
  recommendedReps?: number;
  technique?: WorkoutTechnique;
}

export type WorkoutTechnique = 
  | 'STANDARD'
  | 'SST'
  | 'GIRONDA'
  | 'GVT'
  | 'DROP_SET'
  | 'REST_PAUSE'
  | 'PYRAMID'
  | 'REVERSE_PYRAMID';

export interface LogRoutine {
  id: string;
  routineId: string;
  startDatetime: string;
  endDatetime?: string;
  logWorkouts?: LogWorkout[];
}

export interface LogRoutineCreateRequest {
  routineId: string;
  startDatetime: string;
  endDatetime?: string;
}

export interface LogWorkout {
  id: string;
  logRoutineId: string;
  workoutId: string;
  startDatetime: string;
  endDatetime?: string;
  logExercises?: LogExercise[];
}

export interface LogWorkoutCreateRequest {
  logRoutineId: string;
  workoutId: string;
  startDatetime: string;
  endDatetime?: string;
}

export interface LogExercise {
  id: string;
  logWorkoutId: string;
  exerciseId: string;
  startDatetime?: string;
  endDatetime?: string;
  notes?: string;
  repetitions?: number;
  completed: boolean;
  logSets?: LogSet[];
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

export interface LogSet {
  id: string;
  logExerciseId: string;
  setNumber: number;
  weight: number;
  repetitions: number;
  createdAt: string;
}

export interface LogSetCreateRequest {
  logExerciseId: string;
  setNumber: number;
  weight: number;
  repetitions: number;
}

interface Exercise {
  id: string;
  name: string;
  videoUrl?: string;
  muscles?: Muscle[];
}

interface Muscle {
  id: string;
  name: string;
  muscleGroup: string;
}

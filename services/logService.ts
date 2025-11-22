import api from './api';

export interface LogSetResponse {
  id: string;
  logExerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  restTimeSeconds?: number;
  timestamp: string;
  notes?: string;
}

export interface LogSetCreateRequest {
  logExerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  restTimeSeconds?: number;
  notes?: string;
}

export interface LogExerciseResponse {
  id: string;
  logWorkoutId: string;
  exerciseId: string;
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
  userId: string;
  startDate: string;
  endDate?: string;
  logWorkouts: LogWorkoutResponse[];
}

export interface LogRoutineCreateRequest {
  routineId: string;
  userId: string;
  startDate: string;
  endDate?: string;
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

  async updateLogRoutine(id: string, data: Partial<LogRoutineCreateRequest>): Promise<LogRoutineResponse> {
    const response = await api.put<LogRoutineResponse>(`/log-routines/${id}`, data);
    return response.data;
  },

  async deleteLogRoutine(id: string): Promise<void> {
    await api.delete(`/log-routines/${id}`);
  },

  async completeLogRoutine(id: string): Promise<LogRoutineResponse> {
    const now = new Date().toISOString();
    const response = await api.put<LogRoutineResponse>(`/log-routines/${id}`, { endDate: now });
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

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface RoutineImportResult {
  routineName: string;
  routineId: string;
  totalWorkouts: number;
  successfulWorkouts: number;
  failedWorkouts: number;
  totalExercises: number;
  successfulExercises: number;
  failedExercises: number;
  errors: string[];
}

export interface RoutineImportResponse {
  success: boolean;
  message: string;
  result?: RoutineImportResult;
  error?: string;
}

// Import service runs on port 8082
const getImportApiUrl = () => {
  const envUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    // Replace port 8080 with 8082 for import service
    return envUrl.replace(':8080', ':8082').replace('/api', '');
  }
  
  if (Platform.OS === 'ios') {
    return 'http://localhost:8082';
  } else if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8082';
  }
  
  return 'http://localhost:8082';
};

const IMPORT_API_URL = getImportApiUrl();

export const routineImportService = {
  /**
   * Import a routine from an XLSX file
   * @param file - The XLSX file to import
   * @param userId - The user ID who owns the routine
   * @returns Import result with statistics
   */
  async importRoutineFromXlsx(file: File | Blob, userId: string): Promise<RoutineImportResponse> {
    const formData = new FormData();
    
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      formData.append('file', file, 'routine.xlsx');
    }
    formData.append('userId', userId);

    // Get auth token
    const token = await AsyncStorage.getItem('token');
    const headers: any = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post<RoutineImportResponse>(
      `${IMPORT_API_URL}/api/routine-import/import`,
      formData,
      { headers }
    );

    return response.data;
  },

  /**
   * Generate JSON preview from an XLSX file without importing
   * @param file - The XLSX file to preview
   * @returns JSON structure of the routine
   */
  async generateJsonFromXlsx(file: File | Blob): Promise<{ success: boolean; json?: string; error?: string }> {
    const formData = new FormData();
    
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      formData.append('file', file, 'routine.xlsx');
    }

    // Get auth token
    const token = await AsyncStorage.getItem('token');
    const headers: any = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post<{ success: boolean; json?: string; error?: string }>(
      `${IMPORT_API_URL}/api/routine-import/generate-json`,
      formData,
      { headers }
    );

    return response.data;
  },
};

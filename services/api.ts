import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// For iOS Simulator, use localhost
// For Android Emulator, use 10.0.2.2 (Android's special alias for host machine)
// For physical devices, use the actual IP or environment variable
const getApiUrl = () => {
  // Check environment variable first
  const envUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Default URLs for development
  if (Platform.OS === 'ios') {
    return 'http://localhost:8080/api';
  } else if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api';
  }
  
  return 'http://localhost:8080/api';
};

const API_URL = getApiUrl();

console.log('API Configuration:', {
  platform: Platform.OS,
  apiUrl: API_URL,
  env: process.env.EXPO_PUBLIC_API_URL
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth error callback for global handling
let onAuthError: (() => void) | null = null;

export const setAuthErrorCallback = (callback: () => void) => {
  onAuthError = callback;
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Token from storage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    console.log('Response data:', response.data);
    return response;
  },
  async (error) => {
    // Suppress logging for expected 404s on last workout endpoint
    if (error.response?.status === 404 && error.config?.url?.includes('/last')) {
      return Promise.reject(error);
    }
    
    // Handle expired token / unauthorized access
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Authentication failed - logging out user');
      // Clear stored credentials
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Trigger global auth error handler
      if (onAuthError) {
        onAuthError();
      }
      
      // Reject with a specific error type for the UI to handle
      const authError = new Error('Session expired. Please login again.');
      (authError as any).isAuthError = true;
      return Promise.reject(authError);
    }
    
    console.error('API Error:', error.response?.status, error.config?.url);
    console.error('Error data:', error.response?.data);
    return Promise.reject(error);
  }
);

export default api;

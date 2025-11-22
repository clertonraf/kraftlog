import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  surname: string;
  birthDate?: string;
  email: string;
  password: string;
  weightKg?: number;
  heightCm?: number;
}

export interface UserResponse {
  id: number;
  name: string;
  surname: string;
  email: string;
  birthDate?: string;
  weightKg?: number;
  heightCm?: number;
  admin: boolean;
}

export interface LoginResponse {
  token: string;
  type: string;
  user: UserResponse;
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data);
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/register', data);
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<UserResponse | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },
};

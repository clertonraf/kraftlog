import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url);
    console.error('Error data:', error.response?.data);
    return Promise.reject(error);
  }
);

export default api;

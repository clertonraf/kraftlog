import { router } from 'expo-router';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setAuthErrorCallback, updateApiUrl } from '@/services/api';
import {
  authService,
  type LoginRequest,
  type RegisterRequest,
  type UserResponse,
} from '@/services/authService';
import { configService } from '@/services/configService';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  isOfflineMode: boolean;
  useRemoteServer: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [useRemoteServer, setUseRemoteServer] = useState(false);

  const initializeAuth = useCallback(async () => {
    try {
      // Load configuration
      const config = await configService.getConfig();
      setIsOfflineMode(!config.useRemoteServer);
      setUseRemoteServer(config.useRemoteServer);

      // Update API URL if using remote server
      if (config.useRemoteServer && config.apiUrl) {
        await updateApiUrl();
      }

      // Check authentication only if using remote server
      if (config.useRemoteServer) {
        const isAuth = await authService.isAuthenticated();
        if (isAuth) {
          const currentUser = await authService.getCurrentUser();
          console.log('Current user from storage:', currentUser);
          console.log('isAdmin value:', currentUser?.admin);
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();

    // Set up global auth error handler
    setAuthErrorCallback(() => {
      console.log('Auth error detected - logging out');
      setUser(null);
      // Navigate to login screen
      try {
        router.replace('/login');
      } catch (error) {
        console.error('Failed to navigate to login:', error);
      }
    });
  }, [initializeAuth]);

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);
    setUser(response.user);
  };

  const register = async (data: RegisterRequest) => {
    const response = await authService.register(data);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOfflineMode,
        useRemoteServer,
        login,
        register,
        logout,
        isAuthenticated: useRemoteServer ? !!user : true, // Always authenticated in offline mode
        isAdmin: user?.isAdmin || user?.admin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

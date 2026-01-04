import Constants from 'expo-constants';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { updateApiUrl } from '@/services/api';
import { configService } from '@/services/configService';

export default function Index() {
  const { isAuthenticated, loading, useRemoteServer } = useAuth();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [isNavigating, setIsNavigating] = useState(false);
  const hasNavigatedRef = useRef(false);

  const checkAndRedirect = useCallback(async () => {
    // Prevent multiple simultaneous navigation attempts
    if (isNavigating || hasNavigatedRef.current) {
      return;
    }

    setIsNavigating(true);
    hasNavigatedRef.current = true;

    try {
      // On web, auto-configure from environment variable
      if (Platform.OS === 'web') {
        const envUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

        if (!envUrl) {
          console.error('EXPO_PUBLIC_API_URL not set for web platform');
        }

        // Auto-configure remote server for web
        await configService.setRemoteServer(envUrl || '');
        await updateApiUrl();

        // Go to login if not authenticated, otherwise to tabs
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
        return;
      }

      // Mobile flow - check if configured
      const isConfigured = await configService.isConfigured();

      if (!isConfigured) {
        router.replace('/server-config');
      } else if (useRemoteServer && isAuthenticated) {
        router.replace('/(tabs)');
      } else if (useRemoteServer && !isAuthenticated) {
        router.replace('/login');
      } else {
        // Offline mode - go directly to tabs
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      hasNavigatedRef.current = false;
    } finally {
      setIsNavigating(false);
    }
  }, [isAuthenticated, router, useRemoteServer, isNavigating]);

  useEffect(() => {
    if (!rootNavigationState?.key || loading) return;

    checkAndRedirect();
  }, [loading, rootNavigationState?.key, checkAndRedirect]);

  return (
    <View style={styles.container} testID="loading-screen">
      <ActivityIndicator size="large" color="#007AFF" testID="loading-spinner" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

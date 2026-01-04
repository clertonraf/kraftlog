import Constants from 'expo-constants';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { updateApiUrl } from '@/services/api';
import { configService } from '@/services/configService';

export default function Index() {
  const { isAuthenticated, loading: authLoading, useRemoteServer } = useAuth();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const hasInitializedRef = useRef(false);
  const lastNavigationRef = useRef<string | null>(null);

  useEffect(() => {
    // Wait for navigation state and auth to be ready
    if (!rootNavigationState?.key || authLoading) {
      console.log('[Index] Waiting for navigation state or auth loading...', {
        hasKey: !!rootNavigationState?.key,
        authLoading,
      });
      return;
    }

    const initializeAndNavigate = async () => {
      try {
        // Initialize configuration only once
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          console.log('[Index] First initialization');

          // On web, auto-configure from environment variable
          if (Platform.OS === 'web') {
            const envUrl = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

            if (!envUrl) {
              console.error('EXPO_PUBLIC_API_URL not set for web platform');
            }

            // Auto-configure remote server for web
            await configService.setRemoteServer(envUrl || '');
            await updateApiUrl();
            console.log('[Index] Web configuration complete');
          } else {
            // Mobile flow - check if configured
            const isConfigured = await configService.isConfigured();

            if (!isConfigured) {
              console.log('[Index] Not configured, navigating to server-config');
              lastNavigationRef.current = '/server-config';
              router.replace('/server-config');
              return;
            }
          }
        }

        // Determine target route
        let targetRoute: string;
        if (useRemoteServer && isAuthenticated) {
          targetRoute = '/(tabs)/routines';
        } else if (useRemoteServer && !isAuthenticated) {
          targetRoute = '/login';
        } else {
          targetRoute = '/(tabs)/routines';
        }

        // Only navigate if we're going to a different route
        if (lastNavigationRef.current !== targetRoute) {
          console.log('[Index] Navigating to:', targetRoute, {
            useRemoteServer,
            isAuthenticated,
            previous: lastNavigationRef.current,
          });
          lastNavigationRef.current = targetRoute;
          router.replace(targetRoute as Parameters<typeof router.replace>[0]);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        hasInitializedRef.current = false;
      }
    };

    initializeAndNavigate();
  }, [authLoading, rootNavigationState?.key, isAuthenticated, useRemoteServer, router.replace]);

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

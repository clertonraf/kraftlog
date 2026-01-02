import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { configService } from '@/services/configService';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, loading, useRemoteServer } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [configChecked, setConfigChecked] = useState(false);

  useEffect(() => {
    checkInitialConfig();
  }, [checkInitialConfig]);

  const checkInitialConfig = async () => {
    const isConfigured = await configService.isConfigured();
    setConfigChecked(true);

    if (!isConfigured) {
      router.replace('/server-config');
    }
  };

  useEffect(() => {
    if (loading || !configChecked) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthenticatedRoute =
      inAuthGroup ||
      segments[0] === 'routine' ||
      segments[0] === 'workout' ||
      segments[0] === 'history';
    const inConfigScreen = segments[0] === 'server-config';

    // Skip auth check for config screen
    if (inConfigScreen) return;

    // If using remote server and not authenticated, redirect to login
    if (useRemoteServer && !isAuthenticated && inAuthenticatedRoute) {
      router.replace('/login');
    }
    // If authenticated with remote server and not in authenticated route, go to tabs
    else if (
      useRemoteServer &&
      isAuthenticated &&
      !inAuthenticatedRoute &&
      segments[0] !== 'register' &&
      segments[0] !== 'modal'
    ) {
      router.replace('/(tabs)');
    }
    // If offline mode (not using remote server), allow access to tabs
    else if (
      !useRemoteServer &&
      !inAuthenticatedRoute &&
      segments[0] !== 'login' &&
      segments[0] !== 'register' &&
      segments[0] !== 'modal' &&
      segments[0] !== 'forgot-password' &&
      segments[0] !== 'reset-password'
    ) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, loading, useRemoteServer, configChecked, router.replace]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <RootLayoutNav />
      </OfflineProvider>
    </AuthProvider>
  );
}

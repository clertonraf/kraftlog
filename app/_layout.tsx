import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useCallback, useEffect, useState } from 'react';
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

  const checkInitialConfig = useCallback(async () => {
    const isConfigured = await configService.isConfigured();

    // On web, auto-configure from environment variable if not configured
    if (!isConfigured && typeof window !== 'undefined') {
      const webApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
      console.log('[RootLayout] Auto-configuring web with API URL:', webApiUrl);
      await configService.setRemoteServer(webApiUrl);
    }

    setConfigChecked(true);

    // Only redirect to config screen on mobile if not configured
    if (!isConfigured && typeof window === 'undefined') {
      router.replace('/server-config');
    }
  }, [router]);

  useEffect(() => {
    checkInitialConfig();
  }, [checkInitialConfig]);

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

    // Only protect authenticated routes - redirect to login if not authenticated
    // Do NOT redirect authenticated users from public pages - let them navigate naturally
    if (useRemoteServer && !isAuthenticated && inAuthenticatedRoute) {
      router.replace('/login');
    }
  }, [isAuthenticated, segments, loading, useRemoteServer, configChecked, router]);

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

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/contexts/OfflineContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthenticatedRoute = inAuthGroup || segments[0] === 'routine' || segments[0] === 'workout' || segments[0] === 'history';

    if (!isAuthenticated && inAuthenticatedRoute) {
      router.replace('/login');
    } else if (isAuthenticated && !inAuthenticatedRoute && segments[0] !== 'register' && segments[0] !== 'modal') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, loading]);

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

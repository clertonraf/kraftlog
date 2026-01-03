import { useRootNavigationState, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { configService } from '@/services/configService';

export default function Index() {
  const { isAuthenticated, loading, useRemoteServer } = useAuth();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const checkAndRedirect = useCallback(async () => {
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
  }, [isAuthenticated, router, useRemoteServer]);

  useEffect(() => {
    if (!rootNavigationState?.key || loading) return;

    checkAndRedirect();
  }, [loading, rootNavigationState?.key, checkAndRedirect]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
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

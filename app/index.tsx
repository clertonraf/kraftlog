import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key || loading) return;

    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, rootNavigationState?.key]);

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

import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { user, logout, useRemoteServer } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to KraftLog!</Text>
          <Text style={styles.subtitle}>
            {useRemoteServer && user ? `Hello, ${user.name}!` : 'Track your fitness journey'}
          </Text>
        </View>

        {useRemoteServer && <SyncStatusIndicator />}

        {useRemoteServer && user && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Profile</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>
                {user.name} {user.surname}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            {user.birthDate && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Birth Date:</Text>
                <Text style={styles.value}>{user.birthDate}</Text>
              </View>
            )}
            {user.weightKg && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Weight:</Text>
                <Text style={styles.value}>{user.weightKg} kg</Text>
              </View>
            )}
            {user.heightCm && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Height:</Text>
                <Text style={styles.value}>{user.heightCm} cm</Text>
              </View>
            )}
          </View>
        )}

        {!useRemoteServer && !user && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Offline Mode</Text>
            <Text style={styles.infoText}>
              You're using KraftLog in offline mode. All your data is stored locally on this device.
            </Text>
            <Text style={styles.infoText}>
              Go to Settings to connect to a remote server and sync your data across devices.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/history')}>
            <Text style={styles.actionButtonText}>📊 View Workout History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          <Text style={styles.comingSoon}>Coming soon...</Text>
        </View>

        {useRemoteServer && user && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  comingSoon: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

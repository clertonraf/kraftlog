import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { updateApiUrl } from '@/services/api';
import { configService } from '@/services/configService';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const { user, logout, useRemoteServer, isOfflineMode } = auth;
  const router = useRouter();
  const [apiUrl, setApiUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await configService.getConfig();
      if (config.apiUrl) {
        setApiUrl(config.apiUrl);
      }
    };
    loadConfig();
  }, []);

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to logout?')) {
        doLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };

  const handleSwitchMode = () => {
    // On web, offline mode is not supported
    if (Platform.OS === 'web' && !isOfflineMode) {
      if (
        confirm('Offline mode is not supported on web. You can only change the remote server URL.')
      ) {
        setIsEditing(true);
      }
      return;
    }

    const switchToMode = isOfflineMode ? 'remote server' : 'offline';
    const message = `Switch to ${switchToMode} mode? ${Platform.OS === 'web' ? 'The page will reload.' : 'This will restart the app.'}`;

    const confirmSwitch = async () => {
      if (isOfflineMode) {
        // Switching from offline to remote
        await configService.clearConfig();
        if (Platform.OS === 'web') {
          window.location.href = '/server-config';
        } else {
          router.replace('/server-config');
        }
      } else {
        // Switching from remote to offline
        await configService.setOfflineMode();
        await logout();
        if (Platform.OS === 'web') {
          window.location.href = '/';
        } else {
          router.replace('/');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(message)) {
        confirmSwitch();
      }
    } else {
      Alert.alert('Change Mode', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: confirmSwitch },
      ]);
    }
  };

  const handleUpdateApiUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    try {
      new URL(apiUrl);
    } catch (_error) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      await configService.setRemoteServer(apiUrl.trim());
      await updateApiUrl();
      Alert.alert('Success', 'Server URL updated. Please login again.', [
        {
          text: 'OK',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]);
    } catch (_error) {
      Alert.alert('Error', 'Failed to update server URL');
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
    >
      <Text style={styles.title}>Settings</Text>

      {/* Mode Section - Hide on web */}
      {Platform.OS !== 'web' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.label}>
                  {isOfflineMode ? '🏠 Offline Mode' : '☁️ Remote Server'}
                </Text>
                <Text style={styles.description}>
                  {isOfflineMode ? 'All data stored locally' : 'Data synced with server'}
                </Text>
              </View>
              <TouchableOpacity style={styles.changeButton} onPress={handleSwitchMode}>
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Clear Local Data Button (only in offline mode) */}
          {isOfflineMode && (
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={() => {
                Alert.alert(
                  'Clear Local Data',
                  'This will delete ALL your local exercises, routines, and workouts. This action cannot be undone!',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear All Data',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const { clearAllData } = await import('@/services/database');
                          await clearAllData();
                          Alert.alert('Success', 'All local data has been cleared');
                        } catch (error) {
                          console.error('Failed to clear data:', error);
                          Alert.alert('Error', 'Failed to clear local data');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.dangerButtonText}>🗑️ Clear Local Data</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Server Configuration (only show if using remote server) */}
      {useRemoteServer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Configuration</Text>
          <View style={styles.card}>
            {Platform.OS === 'web' ? (
              <View>
                <View style={styles.rowContent}>
                  <Text style={styles.label}>Server URL</Text>
                  <Text style={styles.value}>{apiUrl || 'Not configured'}</Text>
                </View>
                <Text style={styles.helpText}>
                  On web, the server URL is configured via the EXPO_PUBLIC_API_URL environment
                  variable.
                </Text>
              </View>
            ) : !isEditing ? (
              <View style={styles.row}>
                <View style={styles.rowContent}>
                  <Text style={styles.label}>Server URL</Text>
                  <Text style={styles.value}>{apiUrl || 'Not configured'}</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.label}>Server URL</Text>
                <TextInput
                  style={styles.input}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  placeholder="http://192.168.1.100:8080/api"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={async () => {
                      const config = await configService.getConfig();
                      if (config.apiUrl) {
                        setApiUrl(config.apiUrl);
                      }
                      setIsEditing(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleUpdateApiUrl}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Account Section (only show if logged in) */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>
                {user.name} {user.surname}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            {user.isAdmin && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Role</Text>
                  <Text style={[styles.value, styles.adminBadge]}>Admin</Text>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>App</Text>
            <Text style={styles.value}>KraftLog</Text>
          </View>
        </View>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  changeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  logoutButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  logoutButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  dangerButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  adminBadge: {
    color: '#007AFF',
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

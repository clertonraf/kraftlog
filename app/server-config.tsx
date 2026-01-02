import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { configService } from '@/services/configService';

export default function ServerConfigScreen() {
  const [apiUrl, setApiUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReconfiguring, setIsReconfiguring] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();

  useEffect(() => {
    loadCurrentConfig();
  }, [loadCurrentConfig]);

  const loadCurrentConfig = async () => {
    const config = await configService.getConfig();
    if (config.isConfigured) {
      setIsReconfiguring(true);
      if (config.apiUrl) {
        setApiUrl(config.apiUrl);
      }
    }
  };

  const handleOfflineMode = async () => {
    if (isReconfiguring) {
      Alert.alert(
        'Switch to Offline Mode',
        'Are you sure you want to switch to offline mode? You will need to login again to use remote server features.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              try {
                await configService.setOfflineMode();
                // Clear auth data
                const { authService } = await import('@/services/authService');
                await authService.logout();
                router.replace('/(tabs)');
              } catch (_error) {
                Alert.alert('Error', 'Failed to switch to offline mode');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      await configService.setOfflineMode();
      Alert.alert(
        'Offline Mode',
        'You are using the app in offline mode. All data will be stored locally on your device.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (_error) {
      Alert.alert('Error', 'Failed to configure offline mode');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoteServer = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(apiUrl);
    } catch (_error) {
      Alert.alert('Error', 'Please enter a valid URL (e.g., http://192.168.1.100:8080/api)');
      return;
    }

    setLoading(true);
    try {
      await configService.setRemoteServer(apiUrl.trim());

      if (isReconfiguring) {
        // If reconfiguring, clear auth and go to login
        const { authService } = await import('@/services/authService');
        await authService.logout();
        Alert.alert('Server Updated', 'Server URL has been updated. Please login again.', [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]);
      } else {
        Alert.alert(
          'Remote Server',
          'Server configured successfully. You can now login to sync your data.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to configure server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, layout.isWeb && styles.webScrollContainer]}
      >
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + 40 },
            layout.isWeb && {
              maxWidth: layout.formMaxWidth as any,
              alignSelf: 'center',
              width: '100%',
            },
          ]}
        >
          <Text style={styles.title}>
            {isReconfiguring ? 'Server Settings' : 'Welcome to KraftLog'}
          </Text>
          <Text style={styles.subtitle}>
            {isReconfiguring
              ? 'Update your connection settings'
              : 'Choose how you want to use the app'}
          </Text>

          {Platform.OS !== 'web' && (
            <>
              <View style={styles.optionContainer}>
                <Text style={styles.optionTitle}>🏠 Offline Mode</Text>
                <Text style={styles.optionDescription}>
                  Use the app without a server. All your data will be stored locally on this device.
                </Text>
                <TouchableOpacity
                  style={[styles.button, styles.offlineButton, loading && styles.buttonDisabled]}
                  onPress={handleOfflineMode}
                  disabled={loading}
                  testID="offline-mode-button"
                >
                  <Text style={styles.buttonText}>Use Offline</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          <View style={styles.optionContainer}>
            <Text style={styles.optionTitle}>☁️ Remote Server</Text>
            <Text style={styles.optionDescription}>
              Connect to a server to sync your data across devices.{' '}
              {Platform.OS === 'web'
                ? 'Server connection is required for web version.'
                : "You'll need to login or register."}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Server URL (e.g., http://192.168.1.100:8080/api)"
              value={apiUrl}
              onChangeText={setApiUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!loading}
              testID="api-url-input"
            />

            <TouchableOpacity
              style={[styles.button, styles.remoteButton, loading && styles.buttonDisabled]}
              onPress={handleRemoteServer}
              disabled={loading}
              testID="remote-server-button"
            >
              <Text style={styles.buttonText}>Connect to Server</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS !== 'web' && !isReconfiguring && (
            <Text style={styles.footerText}>
              You can change this setting later in the app settings.
            </Text>
          )}
          {isReconfiguring && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          {Platform.OS === 'web' && (
            <Text style={styles.footerText}>
              Note: Offline mode is not available on web. Please connect to a server to use the app.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  optionContainer: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  offlineButton: {
    backgroundColor: '#4CAF50',
  },
  remoteButton: {
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },
  footerText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 20,
  },
  webScrollContainer: {
    minHeight: '100%',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    marginTop: 10,
  },
});

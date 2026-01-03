import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '@/contexts/AuthContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { configService } from '@/services/configService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();

  const loadApiUrl = useCallback(async () => {
    const url = await configService.getApiUrl();
    setApiUrl(url || '');
  }, []);

  useEffect(() => {
    loadApiUrl();
  }, [loadApiUrl]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUseOffline = async () => {
    setLoading(true);
    try {
      // Import clearAllData
      const { clearAllData } = await import('@/services/database');
      await clearAllData();
      await configService.setOfflineMode();
      // Force reload by replacing to index which will redirect to tabs
      router.replace('/');
    } catch (error) {
      console.error('Failed to switch to offline mode:', error);
      Alert.alert('Error', 'Failed to switch to offline mode');
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
          <Text style={styles.title}>KraftLog</Text>
          <Text style={styles.subtitle}>Login to sync your data</Text>

          {apiUrl && (
            <View style={styles.serverInfo}>
              <View style={styles.serverInfoHeader}>
                <View style={styles.serverInfoText}>
                  <Text style={styles.serverLabel}>Connected to:</Text>
                  <Text style={styles.serverUrl}>{apiUrl}</Text>
                </View>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    onPress={() => router.push('/server-config')}
                    style={styles.changeServerButton}
                    disabled={loading}
                  >
                    <Text style={styles.changeServerButtonText}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/forgot-password')}
              disabled={loading}
              testID="forgot-password-link"
            >
              <Text style={styles.linkText}>
                <Text style={styles.linkBold}>Forgot Password?</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/register')}
              disabled={loading}
              style={styles.registerLink}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>

            {Platform.OS !== 'web' && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.offlineButton]}
                  onPress={handleUseOffline}
                  disabled={loading}
                  testID="use-offline-button"
                >
                  <Text style={styles.offlineButtonText}>Use Offline Mode</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 10,
  },
  serverInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  serverInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serverInfoText: {
    flex: 1,
  },
  serverLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  serverUrl: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  changeServerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeServerButtonText: {
    color: '#fff',
    fontSize: 12,
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
  offlineButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  offlineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webScrollContainer: {
    minHeight: '100%',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
});

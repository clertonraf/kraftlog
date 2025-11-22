import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!name || !surname || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        surname,
        email,
        password,
        birthDate: birthDate || undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join KraftLog today!</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="First Name *"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Last Name *"
              value={surname}
              onChangeText={setSurname}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password * (min 6 characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Birth Date (DD-MM-YYYY)"
              value={birthDate}
              onChangeText={setBirthDate}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Weight (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Height (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkBold}>Login</Text>
              </Text>
            </TouchableOpacity>
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
    paddingBottom: 40,
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
    marginBottom: 30,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
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
});

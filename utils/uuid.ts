import * as Crypto from 'expo-crypto';

/**
 * Generates a UUID v4 using expo-crypto
 * Compatible with React Native
 */
export const generateUUID = (): string => {
  return Crypto.randomUUID();
};

// Alias for compatibility with uuid library usage
export const v4 = generateUUID;

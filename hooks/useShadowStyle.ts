import { Platform, type ViewStyle } from 'react-native';

interface ShadowConfig {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

/**
 * Hook to generate cross-platform shadow styles
 * Uses boxShadow for web and native shadow props for iOS/Android
 */
export const useShadowStyle = (config: ShadowConfig): ViewStyle => {
  const {
    shadowColor = '#000',
    shadowOffset = { width: 0, height: 2 },
    shadowOpacity = 0.1,
    shadowRadius = 4,
    elevation = 2,
  } = config;

  if (Platform.OS === 'web') {
    // Convert to boxShadow for web
    const offsetX = shadowOffset.width;
    const offsetY = shadowOffset.height;
    const blur = shadowRadius;
    const alpha = Math.round(shadowOpacity * 255)
      .toString(16)
      .padStart(2, '0');
    const color = `${shadowColor}${alpha}`;

    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px ${color}`,
    } as ViewStyle;
  }

  // Native shadow styles for iOS/Android
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation, // Android
  };
};

/**
 * Predefined shadow presets
 */
export const shadowPresets = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

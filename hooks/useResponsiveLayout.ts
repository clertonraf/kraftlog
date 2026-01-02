import { Platform, useWindowDimensions } from 'react-native';

export const useResponsiveLayout = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  
  // Breakpoints
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  
  // Layout configurations
  const maxContentWidth = isDesktop ? 1200 : isTablet ? 900 : width;
  const contentPadding = isDesktop ? 40 : isTablet ? 30 : 20;
  const cardMaxWidth = isDesktop ? 600 : isTablet ? 500 : '100%';
  const formMaxWidth = isDesktop ? 500 : isTablet ? 400 : '100%';
  
  return {
    isWeb,
    isMobile,
    isTablet,
    isDesktop,
    maxContentWidth,
    contentPadding,
    cardMaxWidth,
    formMaxWidth,
    width,
  };
};

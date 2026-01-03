import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppConfig {
  useRemoteServer: boolean;
  apiUrl: string | null;
  isConfigured: boolean;
}

const CONFIG_KEY = 'app_config';
const DEFAULT_CONFIG: AppConfig = {
  useRemoteServer: false,
  apiUrl: null,
  isConfigured: false,
};

export const configService = {
  async getConfig(): Promise<AppConfig> {
    try {
      const configStr = await AsyncStorage.getItem(CONFIG_KEY);
      if (!configStr) {
        return DEFAULT_CONFIG;
      }
      return JSON.parse(configStr);
    } catch (error) {
      console.error('Failed to load config:', error);
      return DEFAULT_CONFIG;
    }
  },

  async saveConfig(config: AppConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  },

  async setOfflineMode(): Promise<void> {
    // Don't allow offline mode on web - instead set remote server with default URL
    if (typeof window !== 'undefined') {
      console.warn('Offline mode not supported on web - using remote server mode');
      return;
    }

    const config: AppConfig = {
      useRemoteServer: false,
      apiUrl: null,
      isConfigured: true,
    };
    await this.saveConfig(config);
  },

  async setRemoteServer(apiUrl: string): Promise<void> {
    const config: AppConfig = {
      useRemoteServer: true,
      apiUrl,
      isConfigured: true,
    };
    await this.saveConfig(config);
  },

  async clearConfig(): Promise<void> {
    await AsyncStorage.removeItem(CONFIG_KEY);
  },

  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return config.isConfigured;
  },

  async getApiUrl(): Promise<string | null> {
    const config = await this.getConfig();
    return config.useRemoteServer ? config.apiUrl : null;
  },
};

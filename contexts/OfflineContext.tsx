import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { initDatabase } from '@/services/database';
import { syncService, SyncStatus } from '@/services/syncService';
import { useAuth } from './AuthContext';

interface OfflineContextType {
  isInitialized: boolean;
  syncStatus: SyncStatus;
  sync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isSyncing: false,
    pendingChanges: 0,
  });

  useEffect(() => {
    // Initialize database (will be skipped on web)
    initDatabase()
      .then(() => {
        console.log('Database initialized');
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
        // On web, database init returns null but shouldn't fail
        if (Platform.OS === 'web') {
          setIsInitialized(true);
        }
      });

    // Subscribe to sync status updates
    const unsubscribe = syncService.subscribe(setSyncStatus);

    // Setup app state listener for background sync (skip on web)
    let subscription: any = null;
    if (Platform.OS !== 'web') {
      subscription = AppState.addEventListener('change', handleAppStateChange);
    }

    return () => {
      unsubscribe();
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Sync when user logs in and database is initialized
    if (user && isInitialized) {
      performInitialSync();
    }
  }, [user, isInitialized]);

  const performInitialSync = async () => {
    if (!user) return;
    
    try {
      console.log('Performing initial sync...');
      // On web, only pull from server (no local database sync)
      if (Platform.OS === 'web') {
        console.log('Web platform - skipping local database sync');
      } else {
        await syncService.pullFromServer(user.id);
        await syncService.syncAll();
      }
    } catch (error) {
      console.error('Initial sync failed:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && user && isInitialized) {
      // Sync when app comes to foreground
      syncService.syncAll().catch((error) => {
        console.error('Background sync failed:', error);
      });
    }
  };

  const sync = async () => {
    if (!user) {
      throw new Error('User not logged in');
    }
    await syncService.syncAll(true);
  };

  return (
    <OfflineContext.Provider value={{ isInitialized, syncStatus, sync }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

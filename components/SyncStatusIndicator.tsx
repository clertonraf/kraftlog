import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '@/contexts/OfflineContext';

export function SyncStatusIndicator() {
  const { syncStatus, sync } = useOffline();

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never synced';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => sync()}
        disabled={syncStatus.isSyncing}
      >
        {syncStatus.isSyncing ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Ionicons 
            name="sync" 
            size={16} 
            color={syncStatus.pendingChanges > 0 ? '#FF9500' : '#007AFF'} 
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            {syncStatus.isSyncing ? 'Syncing...' : formatLastSync(syncStatus.lastSync)}
          </Text>
          {syncStatus.pendingChanges > 0 && !syncStatus.isSyncing && (
            <Text style={styles.pendingText}>
              {syncStatus.pendingChanges} pending
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    gap: 8,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: '#666',
  },
  pendingText: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 2,
  },
});

import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { routineService, RoutineResponse } from '@/services/routineService';
import { routineImportService } from '@/services/routineImportService';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState<RoutineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Reload routines whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [user])
  );

  const loadRoutines = async () => {
    if (!user?.id) return;
    
    try {
      const data = await routineService.getRoutinesByUserId(user.id);
      setRoutines(data);
    } catch (error: any) {
      console.error('Error loading routines:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load routines';
      
      // If user not found (404), ask to re-login
      if (error.response?.status === 404 && errorMsg.includes('User not found')) {
        if (Platform.OS === 'web') {
          if (confirm('Your session is invalid. Would you like to login again?')) {
            router.replace('/login');
          }
        } else {
          Alert.alert(
            'Session Invalid',
            'Your user account was not found. Please login again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Login', onPress: () => router.replace('/login') }
            ]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          alert(`Error: ${errorMsg}`);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRoutines();
  };

  const handleActivateRoutine = async (id: string) => {
    try {
      await routineService.activateRoutine(id);
      loadRoutines();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to activate routine';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    const confirmDelete = () => {
      routineService.deleteRoutine(id)
        .then(() => loadRoutines())
        .catch((error: any) => {
          const errorMsg = error.response?.data?.message || error.message || 'Failed to delete routine';
          if (Platform.OS === 'web') {
            alert(`Error: ${errorMsg}`);
          } else {
            Alert.alert('Error', errorMsg);
          }
        });
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this routine?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Routine',
        'Are you sure you want to delete this routine?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleImportRoutine = async () => {
    if (!user?.id) return;

    try {
      setImporting(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setImporting(false);
        return;
      }

      const asset = result.assets[0];
      
      // Fetch the file as blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      // Import the routine
      const importResult = await routineImportService.importRoutineFromXlsx(blob, user.id);

      setImporting(false);

      if (importResult.success) {
        const result = importResult.result!;
        const message = `Import completed!\n\nWorkouts: ${result.successfulWorkouts}/${result.totalWorkouts} successful\nExercises: ${result.successfulExercises}/${result.totalExercises} successful${result.errors.length > 0 ? '\n\nSome errors occurred during import.' : ''}`;
        
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Import Successful', message);
        }
        
        loadRoutines();
      } else {
        throw new Error(importResult.error || 'Import failed');
      }
    } catch (error: any) {
      setImporting(false);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to import routine';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Import Error', errorMsg);
      }
    }
  };

  const renderRoutine = ({ item }: { item: RoutineResponse }) => (
    <TouchableOpacity 
      style={[styles.routineCard, item.isActive && styles.activeRoutine]}
      onPress={() => router.push(`/routine/${item.id}`)}
    >
      <View style={styles.routineHeader}>
        <View style={styles.routineInfo}>
          <Text style={styles.routineName}>{item.name}</Text>
          {item.startDate && (
            <Text style={styles.routineDate}>
              {item.startDate} {item.endDate && `- ${item.endDate}`}
            </Text>
          )}
          <Text style={styles.routineStats}>
            {item.workouts?.length || 0} workouts
          </Text>
        </View>
        
        {item.isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.routineActions}>
        {!item.isActive && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleActivateRoutine(item.id);
            }}
          >
            <Ionicons name="play-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Activate</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/routine/create?id=${item.id}`);
          }}
        >
          <Ionicons name="create-outline" size={24} color="#007AFF" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteRoutine(item.id);
          }}
        >
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Routines</Text>
        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImportRoutine}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#007AFF" />
              <Text style={styles.importButtonText}>Import</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={routines}
        renderItem={renderRoutine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#999" />
            <Text style={styles.emptyText}>No routines yet</Text>
            <Text style={styles.emptySubtext}>Create your first workout routine</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => router.push('/routine/create')}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  routineCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeRoutine: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  routineDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  routineStats: {
    fontSize: 14,
    color: '#666',
  },
  activeBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  routineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

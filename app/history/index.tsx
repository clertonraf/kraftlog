import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logRoutineService, LogRoutineResponse } from '@/services/logService';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [logRoutines, setLogRoutines] = useState<LogRoutineResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const loadHistory = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await logRoutineService.getLogRoutinesByUserId(user.id);
      setLogRoutines(data.sort((a, b) => 
        new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()
      ));
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load history';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (logRoutineId: string, date: string) => {
    if (Platform.OS === 'web') {
      if (!confirm(`Are you sure you want to delete this workout from ${date}?`)) return;
    } else {
      Alert.alert(
        'Delete Workout',
        `Are you sure you want to delete this workout from ${date}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteWorkout(logRoutineId);
            },
          },
        ]
      );
      return;
    }
    await deleteWorkout(logRoutineId);
  };

  const deleteWorkout = async (logRoutineId: string) => {
    try {
      await logRoutineService.deleteLogRoutine(logRoutineId);
      setLogRoutines(prev => prev.filter(log => log.id !== logRoutineId));
      if (Platform.OS === 'web') {
        alert('Workout deleted successfully');
      } else {
        Alert.alert('Success', 'Workout deleted successfully');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete workout';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    if (!endDate) return 'In progress';
    
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {logRoutines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={80} color="#999" />
            <Text style={styles.emptyTitle}>No Workout History</Text>
            <Text style={styles.emptyText}>
              Start logging your workouts to see them here
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {logRoutines.map((logRoutine) => (
              <TouchableOpacity
                key={logRoutine.id}
                style={styles.logCard}
                onPress={() => router.push(`/history/routine/${logRoutine.id}`)}
              >
                <View style={styles.logHeader}>
                  <View style={styles.logInfo}>
                    <Text style={styles.logDate}>{formatDate(logRoutine.startDatetime)}</Text>
                    <Text style={styles.logWorkouts}>
                      {logRoutine.logWorkouts?.length || 0} workout{logRoutine.logWorkouts?.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.logMeta}>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkout(logRoutine.id, formatDate(logRoutine.startDatetime));
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.logMetaRow}>
                  <Text style={styles.logDuration}>
                    {formatDuration(logRoutine.startDatetime, logRoutine.endDatetime)}
                  </Text>
                  {logRoutine.endDatetime && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  )}
                </View>
                
                {logRoutine.logWorkouts && logRoutine.logWorkouts.length > 0 && (
                  <View style={styles.workoutsList}>
                    {logRoutine.logWorkouts.map((workout, idx) => (
                      <View key={workout.id} style={styles.workoutItem}>
                        <Ionicons name="barbell" size={16} color="#666" />
                        <Text style={styles.workoutText}>
                          {workout.logExercises?.length || 0} exercises
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.logFooter}>
                  <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  logCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logInfo: {
    flex: 1,
  },
  logDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  logWorkouts: {
    fontSize: 14,
    color: '#666',
  },
  logMeta: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    padding: 8,
  },
  logMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  workoutsList: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  workoutText: {
    fontSize: 14,
    color: '#666',
  },
  logFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
});

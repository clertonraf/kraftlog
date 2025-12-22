import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logRoutineService, LogRoutineResponse } from '@/services/logService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RoutineHistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [logRoutine, setLogRoutine] = useState<LogRoutineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await logRoutineService.getLogRoutineById(id);
      setLogRoutine(data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load workout details';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const calculateTotalVolume = () => {
    if (!logRoutine?.logWorkouts) return 0;
    
    let total = 0;
    logRoutine.logWorkouts.forEach(workout => {
      workout.logExercises?.forEach(exercise => {
        exercise.logSets?.forEach(set => {
          total += set.weightKg * set.reps;
        });
      });
    });
    return Math.round(total);
  };

  const calculateTotalSets = () => {
    if (!logRoutine?.logWorkouts) return 0;
    
    let total = 0;
    logRoutine.logWorkouts.forEach(workout => {
      workout.logExercises?.forEach(exercise => {
        total += exercise.logSets?.length || 0;
      });
    });
    return total;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!logRoutine) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryDate}>{formatDateTime(logRoutine.startDatetime)}</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(logRoutine.startDatetime, logRoutine.endDatetime)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{calculateTotalSets()}</Text>
              <Text style={styles.statLabel}>Total Sets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{calculateTotalVolume()}</Text>
              <Text style={styles.statLabel}>Volume (kg)</Text>
            </View>
          </View>
        </View>

        <View style={styles.workoutsSection}>
          <Text style={styles.sectionTitle}>Workouts ({logRoutine.logWorkouts?.length || 0})</Text>
          
          {logRoutine.logWorkouts?.map((workout, index) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutNumber}>
                  <Text style={styles.workoutNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTime}>
                    {formatDateTime(workout.startDatetime)}
                  </Text>
                  {workout.endDatetime && (
                    <Text style={styles.workoutDuration}>
                      Duration: {formatDuration(workout.startDatetime, workout.endDatetime)}
                    </Text>
                  )}
                </View>
              </View>

              {workout.logExercises && workout.logExercises.length > 0 && (
                <View style={styles.exercisesList}>
                  {workout.logExercises.map((exercise, exIdx) => (
                    <View key={exercise.id} style={styles.exerciseCard}>
                      <Text style={styles.exerciseName}>
                        {exercise.exerciseName || `Exercise ${exIdx + 1}`}
                      </Text>
                      <View style={styles.setsGrid}>
                        {exercise.logSets?.map((set, setIdx) => (
                          <View key={set.id} style={styles.setItem}>
                            <Text style={styles.setLabel}>Set {set.setNumber}</Text>
                            <Text style={styles.setValue}>
                              {set.reps} × {set.weightKg}kg
                            </Text>
                          </View>
                        ))}
                      </View>
                      {exercise.completed && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                          <Text style={styles.completedText}>Completed</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
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
  summaryCard: {
    backgroundColor: '#007AFF',
    padding: 24,
    margin: 16,
    borderRadius: 12,
  },
  summaryDate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  workoutsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  workoutCard: {
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
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutNumberText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  workoutDuration: {
    fontSize: 14,
    color: '#666',
  },
  exercisesList: {
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  setsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  setItem: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    padding: 8,
    minWidth: 80,
  },
  setLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  setValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
});

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { routineService, RoutineResponse, workoutService, WorkoutResponse } from '@/services/routineService';
import { logRoutineService, logWorkoutService } from '@/services/logService';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StartRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [routineData, workoutsData] = await Promise.all([
        routineService.getRoutineById(id),
        workoutService.getWorkoutsByRoutineId(id),
      ]);
      setRoutine(routineData);
      setWorkouts(workoutsData.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load routine';
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

  const handleStartWorkout = async (workoutId: string) => {
    if (!user?.id || !id) return;

    setStarting(true);
    try {
      const logRoutine = await logRoutineService.createLogRoutine({
        routineId: id,
        startDatetime: new Date().toISOString(),
      });

      router.push({
        pathname: `/workout/session/[workoutId]`,
        params: { workoutId, logRoutineId: logRoutine.id },
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to start workout';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!routine) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start Workout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.routineSection}>
          <Text style={styles.routineName}>{routine.name}</Text>
          <Text style={styles.dateRange}>
            {routine.startDate} - {routine.endDate}
          </Text>
        </View>

        <View style={styles.workoutsSection}>
          <Text style={styles.sectionTitle}>Workout Plan ({workouts.length} workouts)</Text>
          
          {workouts.map((workout, index) => (
            <TouchableOpacity 
              key={workout.id} 
              style={styles.workoutCard}
              onPress={() => handleStartWorkout(workout.id)}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{index + 1}</Text>
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutDetails}>
                    {workout.exercises?.length || 0} exercises
                    {workout.intervalMinutes ? ` • ${workout.intervalMinutes} min rest` : ''}
                  </Text>
                </View>
                <Ionicons name="play-circle" size={32} color="#34C759" />
              </View>
              
              {workout.exercises && workout.exercises.length > 0 && (
                <View style={styles.exercisesList}>
                  {workout.exercises.slice(0, 3).map((exercise, idx) => (
                    <Text key={`${workout.id}-${exercise.exerciseId}-${idx}`} style={styles.exerciseItem}>
                      • {exercise.exerciseName}
                    </Text>
                  ))}
                  {workout.exercises.length > 3 && (
                    <Text style={styles.moreExercises}>
                      +{workout.exercises.length - 3} more
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Ready to start?</Text>
            <Text style={styles.infoText}>
              Tap on any workout above to start your session. Track your sets, reps, and weight for each exercise.
            </Text>
          </View>
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
  routineSection: {
    backgroundColor: '#007AFF',
    padding: 24,
    alignItems: 'center',
  },
  routineName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: 12,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    color: '#666',
  },
  exercisesList: {
    paddingLeft: 44,
  },
  exerciseItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  moreExercises: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#999',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, FlatList } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { workoutService, WorkoutResponse, WorkoutExerciseResponse } from '@/services/routineService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function WorkoutDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuth();
  const [workout, setWorkout] = useState<WorkoutResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadWorkout();
    }, [id])
  );

  const loadWorkout = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await workoutService.getWorkoutById(id);
      setWorkout(data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load workout';
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

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!workout) return;

    const confirmDelete = async () => {
      try {
        const updatedExerciseIds = workout.exercises
          ?.filter(e => e.exerciseId !== exerciseId)
          .map(e => e.exerciseId) || [];
        
        await workoutService.updateWorkout(workout.id, {
          name: workout.name,
          orderIndex: workout.orderIndex,
          intervalMinutes: workout.intervalMinutes,
          routineId: workout.routineId,
          exerciseIds: updatedExerciseIds,
        });
        
        loadWorkout();
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to remove exercise';
        if (Platform.OS === 'web') {
          alert(`Error: ${errorMsg}`);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Remove this exercise from the workout?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Remove Exercise',
        'Remove this exercise from the workout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const handleEditWorkout = () => {
    if (!workout) return;
    router.push(`/workout/create?id=${workout.id}&routineId=${workout.routineId}`);
  };

  const handleAddExercises = () => {
    if (!workout) return;
    router.push(`/workout/create?id=${workout.id}&routineId=${workout.routineId}`);
  };

  const renderExercise = ({ item, index }: { item: WorkoutExerciseResponse; index: number }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <View style={styles.exerciseTitleRow}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.exerciseName}>{item.exerciseName}</Text>
          </View>
          {item.videoUrl && (
            <Text style={styles.exerciseLink} numberOfLines={1}>
              <Ionicons name="logo-youtube" size={14} color="#FF0000" /> Video available
            </Text>
          )}
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteExercise(item.exerciseId)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Details</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.editButton} onPress={handleEditWorkout}>
            <Ionicons name="pencil" size={24} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Workout Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="list" size={20} color="#666" />
              <Text style={styles.statText}>{workout.exercises?.length || 0} exercises</Text>
            </View>
            {workout.intervalMinutes && (
              <View style={styles.statItem}>
                <Ionicons name="time" size={20} color="#666" />
                <Text style={styles.statText}>{workout.intervalMinutes} min rest</Text>
              </View>
            )}
          </View>
        </View>

        {/* Exercises Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddExercises}
              >
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>

          {workout.exercises && workout.exercises.length > 0 ? (
            <FlatList
              data={workout.exercises}
              renderItem={renderExercise}
              keyExtractor={(item, index) => item.exerciseId || `exercise-${index}`}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No exercises yet</Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.addFirstButton}
                  onPress={handleAddExercises}
                >
                  <Text style={styles.addFirstButtonText}>Add Exercises</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  editButton: {
    padding: 8,
    marginRight: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  addButton: {
    padding: 4,
  },
  exerciseCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  orderBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  exerciseLink: {
    fontSize: 12,
    color: '#666',
    marginLeft: 32,
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
  },
  musclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginLeft: 32,
  },
  muscleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E5F1FF',
  },
  muscleBadgeText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  addFirstButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
});

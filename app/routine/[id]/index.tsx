import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { routineService, RoutineResponse, workoutService, WorkoutResponse } from '@/services/routineService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';

export default function RoutineDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [id])
  );

  const loadRoutine = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [routineData, workoutsData] = await Promise.all([
        routineService.getRoutineById(id),
        workoutService.getWorkoutsByRoutineId(id),
      ]);
      setRoutine(routineData);
      setWorkouts(workoutsData);
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

  const handleDeleteWorkout = async (workoutId: string) => {
    const confirmDelete = async () => {
      try {
        await workoutService.deleteWorkout(workoutId);
        loadRoutine();
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete workout';
        if (Platform.OS === 'web') {
          alert(`Error: ${errorMsg}`);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this workout?')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Workout',
        'Are you sure you want to delete this workout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const renderWorkout = ({ item, index }: { item: WorkoutResponse; index: number }) => (
    <TouchableOpacity
      style={styles.workoutCard}
      onPress={() => router.push(`/workout/${item.id}`)}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <View style={styles.workoutTitleRow}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.workoutName}>{item.name}</Text>
          </View>
          <Text style={styles.workoutStats}>
            {item.exercises?.length || 0} exercises
            {item.intervalMinutes ? ` • ${item.intervalMinutes} min rest` : ''}
          </Text>
          {item.muscles && item.muscles.length > 0 && (
            <View style={styles.musclesRow}>
              {item.muscles.slice(0, 3).map((muscle) => (
                <View key={muscle.id} style={styles.muscleBadge}>
                  <Text style={styles.muscleBadgeText}>{muscle.name}</Text>
                </View>
              ))}
              {item.muscles.length > 3 && (
                <Text style={styles.moreMuscles}>+{item.muscles.length - 3}</Text>
              )}
            </View>
          )}
        </View>
        
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteWorkout(item.id);
          }}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
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

  if (!routine) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{routine.name}</Text>
        <TouchableOpacity onPress={() => router.push(`/routine/create?id=${id}`)}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.routineInfo}>
          {routine.isActive && (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#FFF" />
              <Text style={styles.activeBadgeText}>ACTIVE ROUTINE</Text>
            </View>
          )}
          
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.dateText}>
              {routine.startDate} - {routine.endDate}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workouts.length}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Total Exercises</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workouts</Text>
            <TouchableOpacity
              onPress={() => router.push(`/workout/create?routineId=${id}`)}
              style={styles.addButton}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.addButtonText}>Add Workout</Text>
            </TouchableOpacity>
          </View>

          {workouts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="fitness-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>Add workouts to build your routine</Text>
            </View>
          ) : (
            <FlatList
              data={workouts.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))}
              renderItem={renderWorkout}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push(`/routine/${id}/start`)}
        >
          <Ionicons name="play-circle" size={24} color="#FFF" />
          <Text style={styles.startButtonText}>Start This Routine</Text>
        </TouchableOpacity>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  routineInfo: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  workoutStats: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  musclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  muscleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  muscleBadgeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  moreMuscles: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

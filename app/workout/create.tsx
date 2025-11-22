import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator, FlatList, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { workoutService } from '@/services/routineService';
import { exerciseService, ExerciseResponse } from '@/services/exerciseService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutExerciseRequest } from '@/types/routine';

const TRAINING_TECHNIQUES = [
  'None',
  'SST (Super Slow Training)',
  "Rest'n'Pause",
  'Gironda',
  'FST-7',
  'GVT (German Volume Training)',
  'Strip Set',
  'Drop Set',
];

interface WorkoutExerciseWithDetails extends WorkoutExerciseRequest {
  exercise?: ExerciseResponse;
}

export default function CreateWorkoutScreen() {
  const { id, routineId } = useLocalSearchParams<{ id?: string; routineId?: string }>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(true);
  
  const [name, setName] = useState('');
  const [orderIndex, setOrderIndex] = useState('1');
  const [intervalMinutes, setIntervalMinutes] = useState('');
  const [allExercises, setAllExercises] = useState<ExerciseResponse[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseWithDetails[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExercise, setEditingExercise] = useState<WorkoutExerciseWithDetails | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    if (id && allExercises.length > 0) {
      loadWorkout();
    }
  }, [id, allExercises]);

  const loadExercises = async () => {
    try {
      const exercises = await exerciseService.getAllExercises();
      setAllExercises(exercises);
    } catch (error: any) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const loadWorkout = async () => {
    if (!id) return;
    
    try {
      const workout = await workoutService.getWorkoutById(id);
      setName(workout.name);
      setOrderIndex(workout.orderIndex?.toString() || '1');
      setIntervalMinutes(workout.intervalMinutes?.toString() || '');
      
      if (workout.exercises) {
        const exercises: WorkoutExerciseWithDetails[] = workout.exercises.map((we, index) => {
          const exercise = allExercises.find(e => e.id === we.exerciseId);
          return {
            exerciseId: we.exerciseId,
            recommendedSets: we.recommendedSets,
            recommendedReps: we.recommendedReps,
            trainingTechnique: we.trainingTechnique,
            orderIndex: we.orderIndex ?? index,
            exercise,
          };
        });
        setWorkoutExercises(exercises);
      }
    } catch (error: any) {
      console.error('Error loading workout:', error);
    }
  };

  const filteredExercises = allExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !workoutExercises.some(we => we.exerciseId === exercise.id)
  );

  const handleSave = async () => {
    if (!name.trim()) {
      const msg = 'Please enter a workout name';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Validation Error', msg);
      }
      return;
    }

    if (!routineId) {
      const msg = 'Routine ID not found';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    setLoading(true);
    try {
      const exercises: WorkoutExerciseRequest[] = workoutExercises.map((we, index) => ({
        exerciseId: we.exerciseId,
        recommendedSets: we.recommendedSets,
        recommendedReps: we.recommendedReps,
        trainingTechnique: we.trainingTechnique && we.trainingTechnique !== 'None' ? we.trainingTechnique : undefined,
        orderIndex: index,
      }));

      const data = {
        name: name.trim(),
        orderIndex: parseInt(orderIndex) || 1,
        intervalMinutes: intervalMinutes ? parseInt(intervalMinutes) : undefined,
        routineId,
        exercises,
      };

      if (id) {
        await workoutService.updateWorkout(id, data);
      } else {
        await workoutService.createWorkout(data);
      }

      router.back();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save workout';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const addExercise = (exercise: ExerciseResponse) => {
    const newExercise: WorkoutExerciseWithDetails = {
      exerciseId: exercise.id,
      recommendedSets: 3,
      recommendedReps: 10,
      trainingTechnique: 'None',
      orderIndex: workoutExercises.length,
      exercise,
    };
    setWorkoutExercises(prev => [...prev, newExercise]);
    setShowExercisePicker(false);
  };

  const removeExercise = (exerciseId: string) => {
    setWorkoutExercises(prev => prev.filter(we => we.exerciseId !== exerciseId));
  };

  const updateExerciseDetails = (exerciseId: string, updates: Partial<WorkoutExerciseRequest>) => {
    setWorkoutExercises(prev => prev.map(we =>
      we.exerciseId === exerciseId ? { ...we, ...updates } : we
    ));
  };

  const renderExercisePickerItem = ({ item }: { item: ExerciseResponse }) => (
    <TouchableOpacity
      style={styles.exercisePickerItem}
      onPress={() => addExercise(item)}
    >
      <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
      <Text style={styles.exercisePickerName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderWorkoutExercise = ({ item, index }: { item: WorkoutExerciseWithDetails; index: number }) => (
    <View style={styles.workoutExerciseCard}>
      <View style={styles.workoutExerciseHeader}>
        <View style={styles.exerciseOrderBadge}>
          <Text style={styles.exerciseOrderText}>{index + 1}</Text>
        </View>
        <Text style={styles.workoutExerciseName}>{item.exercise?.name || 'Unknown Exercise'}</Text>
        <TouchableOpacity onPress={() => removeExercise(item.exerciseId)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseDetailsRow}>
        <View style={styles.exerciseDetailInput}>
          <Text style={styles.exerciseDetailLabel}>Sets</Text>
          <TextInput
            style={styles.smallInput}
            value={item.recommendedSets?.toString() || ''}
            onChangeText={(text) => updateExerciseDetails(item.exerciseId, { recommendedSets: parseInt(text) || undefined })}
            keyboardType="number-pad"
            placeholder="3"
          />
        </View>

        <View style={styles.exerciseDetailInput}>
          <Text style={styles.exerciseDetailLabel}>Reps</Text>
          <TextInput
            style={styles.smallInput}
            value={item.recommendedReps?.toString() || ''}
            onChangeText={(text) => updateExerciseDetails(item.exerciseId, { recommendedReps: parseInt(text) || undefined })}
            keyboardType="number-pad"
            placeholder="10"
          />
        </View>

        <TouchableOpacity
          style={styles.techniqueButton}
          onPress={() => setEditingExercise(item)}
        >
          <Text style={styles.techniqueButtonLabel}>Technique</Text>
          <Text style={styles.techniqueButtonValue} numberOfLines={1}>
            {item.trainingTechnique || 'None'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{id ? 'Edit Workout' : 'New Workout'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Workout Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Push Day A"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Order</Text>
            <TextInput
              style={styles.input}
              value={orderIndex}
              onChangeText={setOrderIndex}
              placeholder="1"
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Rest (min)</Text>
            <TextInput
              style={styles.input}
              value={intervalMinutes}
              onChangeText={setIntervalMinutes}
              placeholder="Optional"
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Exercises ({workoutExercises.length})</Text>
            <TouchableOpacity
              onPress={() => setShowExercisePicker(true)}
              style={styles.addButton}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {workoutExercises.length > 0 ? (
            <FlatList
              data={workoutExercises}
              renderItem={renderWorkoutExercise}
              keyExtractor={(item) => item.exerciseId}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No exercises added yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal
        visible={showExercisePicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {loadingExercises ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={filteredExercises}
              renderItem={renderExercisePickerItem}
              keyExtractor={(item) => item.id}
              style={styles.exercisePickerList}
            />
          )}
        </View>
      </Modal>

      {/* Technique Picker Modal */}
      <Modal
        visible={editingExercise !== null}
        animationType="slide"
        transparent
      >
        <View style={styles.techniqueModalOverlay}>
          <View style={styles.techniqueModalContent}>
            <Text style={styles.techniqueModalTitle}>Select Training Technique</Text>
            <ScrollView style={styles.techniqueList}>
              {TRAINING_TECHNIQUES.map((technique) => (
                <TouchableOpacity
                  key={technique}
                  style={[
                    styles.techniqueOption,
                    editingExercise?.trainingTechnique === technique && styles.techniqueOptionSelected
                  ]}
                  onPress={() => {
                    if (editingExercise) {
                      updateExerciseDetails(editingExercise.exerciseId, { trainingTechnique: technique });
                      setEditingExercise(null);
                    }
                  }}
                >
                  <Text style={[
                    styles.techniqueOptionText,
                    editingExercise?.trainingTechnique === technique && styles.techniqueOptionTextSelected
                  ]}>
                    {technique}
                  </Text>
                  {editingExercise?.trainingTechnique === technique && (
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.techniqueModalClose}
              onPress={() => setEditingExercise(null)}
            >
              <Text style={styles.techniqueModalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  saveButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 15,
    padding: 20,
  },
  workoutExerciseCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  workoutExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseOrderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  exerciseOrderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  workoutExerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  exerciseDetailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseDetailInput: {
    flex: 1,
  },
  exerciseDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#000',
    textAlign: 'center',
  },
  techniqueButton: {
    flex: 2,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
  },
  techniqueButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  techniqueButtonValue: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCancel: {
    fontSize: 17,
    color: '#007AFF',
    width: 60,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  exercisePickerList: {
    flex: 1,
  },
  exercisePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  exercisePickerName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  techniqueModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  techniqueModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: '70%',
  },
  techniqueModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  techniqueList: {
    maxHeight: 400,
  },
  techniqueOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  techniqueOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  techniqueOptionText: {
    fontSize: 16,
    color: '#000',
  },
  techniqueOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  techniqueModalClose: {
    marginTop: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  techniqueModalCloseText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
});

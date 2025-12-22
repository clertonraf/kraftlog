import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, TextInput, Modal, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { workoutService, WorkoutResponse } from '@/services/routineService';
import { logWorkoutService, logExerciseService, logSetService, logRoutineService, LogWorkoutResponse } from '@/services/logService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  recommendedSets?: number;
  recommendedReps?: number;
  trainingTechnique?: string;
  videoUrl?: string;
  logExerciseId?: string;
  sets: SetLog[];
}

interface SetLog {
  setNumber: number;
  reps: number;
  weightKg: number | null;
  logSetId?: string;
  saved: boolean;
  untilFailure?: boolean;
}

export default function WorkoutSessionScreen() {
  const { workoutId, logRoutineId } = useLocalSearchParams<{ workoutId: string; logRoutineId: string }>();
  const insets = useSafeAreaInsets();
  const [workout, setWorkout] = useState<WorkoutResponse | null>(null);
  const [logWorkout, setLogWorkout] = useState<LogWorkoutResponse | null>(null);
  const [previousWorkout, setPreviousWorkout] = useState<LogWorkoutResponse | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showSetModal, setShowSetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [newSetReps, setNewSetReps] = useState('');
  const [newSetWeight, setNewSetWeight] = useState('');
  const [useWeight, setUseWeight] = useState(true);
  const [untilFailure, setUntilFailure] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showPreviousData, setShowPreviousData] = useState(false);

  useEffect(() => {
    loadData();
  }, [workoutId]);

  const loadData = async () => {
    if (!workoutId || !logRoutineId) return;
    
    setLoading(true);
    try {
      const [workoutData, previousWorkoutData] = await Promise.all([
        workoutService.getWorkoutById(workoutId),
        logWorkoutService.getLastCompletedWorkout(workoutId),
      ]);
      setWorkout(workoutData);
      setPreviousWorkout(previousWorkoutData);
      
      console.log('Previous workout data:', previousWorkoutData);
      console.log('Previous workout logExercises:', previousWorkoutData?.logExercises);
      console.log('Current workout exercises:', workoutData.exercises);

      const now = new Date().toISOString();
      const logWorkoutData = await logWorkoutService.createLogWorkout({
        logRoutineId: logRoutineId,
        workoutId: workoutId,
        startDatetime: now,
      });
      setLogWorkout(logWorkoutData);

      const initialLogs: ExerciseLog[] = (workoutData.exercises || []).map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        recommendedSets: ex.recommendedSets,
        recommendedReps: ex.recommendedReps,
        trainingTechnique: ex.trainingTechnique,
        videoUrl: ex.videoUrl,
        sets: [],
      }));
      setExerciseLogs(initialLogs);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to start workout';
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

  const handleAddSet = async () => {
    if (!logWorkout || (!untilFailure && !newSetReps) || (useWeight && !newSetWeight)) return;

    const currentExercise = exerciseLogs[currentExerciseIndex];
    
    try {
      let logExerciseId = currentExercise.logExerciseId;
      
      if (!logExerciseId) {
        const logExercise = await logExerciseService.createLogExercise({
          logWorkoutId: logWorkout.id,
          exerciseId: currentExercise.exerciseId,
          startDatetime: new Date().toISOString(),
          completed: false,
        });
        logExerciseId = logExercise.id;
      }

      const setNumber = currentExercise.sets.length + 1;
      const logSet = await logSetService.createLogSet({
        logExerciseId: logExerciseId,
        setNumber: setNumber,
        reps: untilFailure ? 0 : parseInt(newSetReps),
        weightKg: useWeight ? parseFloat(newSetWeight) : null,
      });

      const newSet: SetLog = {
        setNumber: setNumber,
        reps: untilFailure ? 0 : parseInt(newSetReps),
        weightKg: useWeight ? parseFloat(newSetWeight) : null,
        logSetId: logSet.id,
        saved: true,
        untilFailure: untilFailure,
      };

      const updatedLogs = [...exerciseLogs];
      updatedLogs[currentExerciseIndex] = {
        ...currentExercise,
        logExerciseId: logExerciseId,
        sets: [...currentExercise.sets, newSet],
      };
      setExerciseLogs(updatedLogs);

      setNewSetReps('');
      setNewSetWeight('');
      setUntilFailure(false);
      setShowSetModal(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to log set';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const handleDuplicateLastSet = () => {
    const currentExercise = exerciseLogs[currentExerciseIndex];
    if (currentExercise.sets.length === 0) return;
    
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    setNewSetReps(lastSet.reps.toString());
    setNewSetWeight(lastSet.weightKg?.toString() || '');
    setUseWeight(lastSet.weightKg !== null);
    setUntilFailure(lastSet.untilFailure || false);
    setShowSetModal(true);
  };

  const handleEditSet = (index: number) => {
    const currentExercise = exerciseLogs[currentExerciseIndex];
    const set = currentExercise.sets[index];
    setEditingSetIndex(index);
    setNewSetReps(set.reps.toString());
    setNewSetWeight(set.weightKg?.toString() || '');
    setUseWeight(set.weightKg !== null);
    setUntilFailure(set.untilFailure || false);
    setShowEditModal(true);
  };

  const handleUpdateSet = async () => {
    if ((!untilFailure && !newSetReps) || (useWeight && !newSetWeight) || editingSetIndex === null) return;

    const currentExercise = exerciseLogs[currentExerciseIndex];
    const set = currentExercise.sets[editingSetIndex];

    try {
      if (set.logSetId) {
        await logSetService.updateLogSet(set.logSetId, {
          logExerciseId: currentExercise.logExerciseId!,
          setNumber: set.setNumber,
          reps: untilFailure ? 0 : parseInt(newSetReps),
          weightKg: useWeight ? parseFloat(newSetWeight) : null,
        });
      }

      const updatedLogs = [...exerciseLogs];
      updatedLogs[currentExerciseIndex].sets[editingSetIndex] = {
        ...set,
        reps: untilFailure ? 0 : parseInt(newSetReps),
        weightKg: useWeight ? parseFloat(newSetWeight) : null,
        untilFailure: untilFailure,
      };
      setExerciseLogs(updatedLogs);

      setNewSetReps('');
      setNewSetWeight('');
      setUntilFailure(false);
      setEditingSetIndex(null);
      setShowEditModal(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update set';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const handleDeleteSet = async (index: number) => {
    const currentExercise = exerciseLogs[currentExerciseIndex];
    const set = currentExercise.sets[index];

    const confirmMsg = 'Delete this set?';
    const shouldDelete = Platform.OS === 'web'
      ? window.confirm(confirmMsg)
      : await new Promise(resolve => {
          Alert.alert('Delete Set', confirmMsg, [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
          ]);
        });

    if (!shouldDelete) return;

    try {
      if (set.logSetId) {
        await logSetService.deleteLogSet(set.logSetId);
      }

      const updatedLogs = [...exerciseLogs];
      updatedLogs[currentExerciseIndex].sets.splice(index, 1);
      // Renumber remaining sets
      updatedLogs[currentExerciseIndex].sets.forEach((s, i) => {
        s.setNumber = i + 1;
      });
      setExerciseLogs(updatedLogs);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete set';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getPreviousExerciseData = (exerciseId: string) => {
    if (!previousWorkout || !previousWorkout.logExercises) {
      console.log('No previous workout or exercises');
      return null;
    }
    const found = previousWorkout.logExercises.find(ex => ex.exerciseId === exerciseId);
    console.log(`Looking for exerciseId ${exerciseId}, found:`, found);
    return found;
  };

  const handleCompleteWorkout = async () => {
    if (!logWorkout) return;

    const confirmMsg = 'Are you sure you want to complete this workout?';
    const shouldComplete = Platform.OS === 'web' 
      ? window.confirm(confirmMsg)
      : await new Promise(resolve => {
          Alert.alert('Complete Workout', confirmMsg, [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Complete', onPress: () => resolve(true) },
          ]);
        });

    if (!shouldComplete) return;

    setCompleting(true);
    try {
      for (const exerciseLog of exerciseLogs) {
        if (exerciseLog.logExerciseId && exerciseLog.sets.length > 0) {
          await logExerciseService.updateLogExercise(exerciseLog.logExerciseId, {
            logWorkoutId: logWorkout.id,
            exerciseId: exerciseLog.exerciseId,
            endDatetime: new Date().toISOString(),
            completed: true,
          });
        }
      }

      await logWorkoutService.updateLogWorkout(logWorkout.id, {
        logRoutineId: logWorkout.logRoutineId,
        workoutId: workoutId!,
        startDatetime: logWorkout.startDatetime,
        endDatetime: new Date().toISOString(),
      });

      // Also complete the log routine
      if (logRoutineId) {
        await logRoutineService.completeLogRoutine(logRoutineId);
      }

      const successMsg = 'Workout completed successfully!';
      if (Platform.OS === 'web') {
        alert(successMsg);
      } else {
        Alert.alert('Success', successMsg);
      }
      router.back();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to complete workout';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setCompleting(false);
    }
  };

  const currentExercise = exerciseLogs[currentExerciseIndex];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!workout || !currentExercise) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workout.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${((currentExerciseIndex + 1) / exerciseLogs.length) * 100}%` }
          ]} 
        />
        <Text style={styles.progressText}>
          Exercise {currentExerciseIndex + 1} of {exerciseLogs.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{currentExercise.exerciseName}</Text>
          {currentExercise.recommendedSets && currentExercise.recommendedReps && (
            <Text style={styles.recommended}>
              Recommended: {currentExercise.recommendedSets} sets × {currentExercise.recommendedReps} reps
            </Text>
          )}
          {currentExercise.trainingTechnique && (
            <View style={styles.techniqueBadge}>
              <Ionicons name="flash" size={14} color="#FF9500" />
              <Text style={styles.techniqueText}>{currentExercise.trainingTechnique}</Text>
            </View>
          )}
          {currentExercise.videoUrl && (
            <TouchableOpacity 
              style={styles.videoButton}
              onPress={() => setShowVideo(!showVideo)}
            >
              <Ionicons name={showVideo ? "videocam" : "videocam-outline"} size={20} color="#007AFF" />
              <Text style={styles.videoButtonText}>
                {showVideo ? 'Hide Video' : 'Show Video'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showVideo && currentExercise.videoUrl && (
          <View style={styles.videoContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                width="100%"
                height="250"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(currentExercise.videoUrl)}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 8 }}
              />
            ) : (
              <WebView
                style={styles.webView}
                source={{ uri: `https://www.youtube.com/embed/${getYouTubeVideoId(currentExercise.videoUrl)}` }}
                allowsFullscreenVideo
              />
            )}
          </View>
        )}

        {previousWorkout && getPreviousExerciseData(currentExercise.exerciseId) && (
          <View style={styles.previousDataCard}>
            <TouchableOpacity 
              style={styles.previousDataHeader}
              onPress={() => setShowPreviousData(!showPreviousData)}
            >
              <View style={styles.previousDataTitleRow}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.previousDataTitle}>Last Workout Reference</Text>
              </View>
              <Ionicons 
                name={showPreviousData ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {showPreviousData && (
              <View style={styles.previousDataContent}>
                <Text style={styles.previousDataDate}>
                  {new Date(previousWorkout.startDatetime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
                {getPreviousExerciseData(currentExercise.exerciseId)?.logSets?.map((set, idx) => (
                  <View key={idx} style={styles.previousSetItem}>
                    <Text style={styles.previousSetLabel}>Set {set.setNumber}:</Text>
                    <Text style={styles.previousSetValue}>
                      {set.reps} reps × {set.weightKg} kg
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.setsSection}>
          <Text style={styles.sectionTitle}>Sets ({currentExercise.sets.length})</Text>
          
          {currentExercise.sets.map((set, index) => (
            <View key={index} style={styles.setCard}>
              <View style={styles.setNumber}>
                <Text style={styles.setNumberText}>{set.setNumber}</Text>
              </View>
              <View style={styles.setDetails}>
                <Text style={styles.setDetailText}>
                  {set.untilFailure ? 'Failure' : `${set.reps} reps`}
                </Text>
                {set.weightKg !== null && (
                  <Text style={styles.setDetailText}>{set.weightKg} kg</Text>
                )}
                {set.weightKg === null && !set.untilFailure && (
                  <Text style={[styles.setDetailText, { color: '#999' }]}>Bodyweight</Text>
                )}
              </View>
              <View style={styles.setActions}>
                <TouchableOpacity onPress={() => handleEditSet(index)} style={styles.iconButton}>
                  <Ionicons name="create-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteSet(index)} style={styles.iconButton}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.addSetButtons}>
            <TouchableOpacity 
              style={styles.addSetButton}
              onPress={() => {
                setNewSetReps('');
                setNewSetWeight('');
                setUseWeight(true);
                setUntilFailure(false);
                setShowSetModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>

            {currentExercise.sets.length > 0 && (
              <TouchableOpacity 
                style={[styles.addSetButton, { marginLeft: 8, backgroundColor: '#E3F2FD' }]}
                onPress={handleDuplicateLastSet}
              >
                <Ionicons name="copy-outline" size={24} color="#007AFF" />
                <Text style={styles.addSetText}>Duplicate Last</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {currentExerciseIndex > 0 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        {currentExerciseIndex < exerciseLogs.length - 1 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
          >
            <Text style={styles.navButtonTextNext}>Next</Text>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.completeButton, completing && styles.completeButtonDisabled]}
            onPress={handleCompleteWorkout}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={24} color="#FFF" />
                <Text style={styles.completeButtonText}>Complete Workout</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showSetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Set</Text>
            
            <View style={styles.checkboxRow}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setUntilFailure(!untilFailure)}
              >
                <Ionicons 
                  name={untilFailure ? "checkbox" : "square-outline"} 
                  size={24} 
                  color="#007AFF" 
                />
                <Text style={styles.checkboxLabel}>Until Failure</Text>
              </TouchableOpacity>
            </View>

            {!untilFailure && (
              <>
                <Text style={styles.inputLabel}>Repetitions</Text>
                <TextInput
                  style={styles.input}
                  value={newSetReps}
                  onChangeText={setNewSetReps}
                  placeholder="Enter reps"
                  keyboardType="number-pad"
                />
              </>
            )}
            
            <View style={styles.checkboxRow}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setUseWeight(!useWeight)}
              >
                <Ionicons 
                  name={useWeight ? "checkbox" : "square-outline"} 
                  size={24} 
                  color="#007AFF" 
                />
                <Text style={styles.checkboxLabel}>Use Weight</Text>
              </TouchableOpacity>
            </View>

            {useWeight && (
              <>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={newSetWeight}
                  onChangeText={setNewSetWeight}
                  placeholder="Enter weight"
                  keyboardType="decimal-pad"
                />
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSetModal(false);
                  setNewSetReps('');
                  setNewSetWeight('');
                  setUseWeight(true);
                  setUntilFailure(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton, 
                  ((!untilFailure && !newSetReps) || (useWeight && !newSetWeight)) && styles.modalSaveButtonDisabled
                ]}
                onPress={handleAddSet}
                disabled={(!untilFailure && !newSetReps) || (useWeight && !newSetWeight)}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingSetIndex(null);
          setNewSetReps('');
          setNewSetWeight('');
          setUseWeight(true);
          setUntilFailure(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Set</Text>
            
            <View style={styles.checkboxRow}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setUntilFailure(!untilFailure)}
              >
                <Ionicons 
                  name={untilFailure ? "checkbox" : "square-outline"} 
                  size={24} 
                  color="#007AFF" 
                />
                <Text style={styles.checkboxLabel}>Until Failure</Text>
              </TouchableOpacity>
            </View>

            {!untilFailure && (
              <>
                <Text style={styles.inputLabel}>Repetitions</Text>
                <TextInput
                  style={styles.input}
                  value={newSetReps}
                  onChangeText={setNewSetReps}
                  placeholder="Enter reps"
                  keyboardType="number-pad"
                />
              </>
            )}
            
            <View style={styles.checkboxRow}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setUseWeight(!useWeight)}
              >
                <Ionicons 
                  name={useWeight ? "checkbox" : "square-outline"} 
                  size={24} 
                  color="#007AFF" 
                />
                <Text style={styles.checkboxLabel}>Use Weight</Text>
              </TouchableOpacity>
            </View>

            {useWeight && (
              <>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={newSetWeight}
                  onChangeText={setNewSetWeight}
                  placeholder="Enter weight"
                  keyboardType="decimal-pad"
                />
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingSetIndex(null);
                  setNewSetReps('');
                  setNewSetWeight('');
                  setUseWeight(true);
                  setUntilFailure(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton, 
                  ((!untilFailure && !newSetReps) || (useWeight && !newSetWeight)) && styles.modalSaveButtonDisabled
                ]}
                onPress={handleUpdateSet}
                disabled={(!untilFailure && !newSetReps) || (useWeight && !newSetWeight)}
              >
                <Text style={styles.modalSaveText}>Update</Text>
              </TouchableOpacity>
            </View>
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
  progressBar: {
    backgroundColor: '#E5E5EA',
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  exerciseCard: {
    backgroundColor: '#007AFF',
    padding: 24,
    margin: 16,
    borderRadius: 12,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  recommended: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  techniqueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 6,
  },
  techniqueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  videoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  videoContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webView: {
    width: '100%',
    height: 250,
  },
  setsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  setCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  setNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  setNumberText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  setDetails: {
    flex: 1,
  },
  setDetailText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  setActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  previousDataCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  previousDataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previousDataTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previousDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  previousDataContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFE082',
  },
  previousDataDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  previousSetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  previousSetLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  previousSetValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  addSetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addSetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    gap: 8,
  },
  addSetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  checkboxRow: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 1,
    gap: 8,
  },
  nextButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  navButtonTextNext: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    gap: 8,
  },
  completeButtonDisabled: {
    backgroundColor: '#999',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#999',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

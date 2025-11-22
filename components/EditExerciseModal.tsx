import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exerciseService, ExerciseResponse, ExerciseUpdateRequest, MuscleResponse, MuscleGroup, EquipmentType } from '@/services/exerciseService';

interface EditExerciseModalProps {
  visible: boolean;
  exercise: ExerciseResponse;
  muscles: MuscleResponse[];
  onClose: () => void;
  onSave: () => void;
  isCreating?: boolean;
}

export default function EditExerciseModal({ visible, exercise, muscles, onClose, onSave, isCreating = false }: EditExerciseModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sets, setSets] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [defaultWeight, setDefaultWeight] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedMuscleIds, setSelectedMuscleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (exercise) {
      setName(exercise.name || '');
      setDescription(exercise.description || '');
      setSets(exercise.sets?.toString() || '');
      setRepetitions(exercise.repetitions?.toString() || '');
      setDefaultWeight(exercise.defaultWeightKg?.toString() || '');
      setVideoUrl(exercise.videoUrl || '');
      setSelectedMuscleIds(exercise.muscles.map(m => m.id));
    }
  }, [exercise]);

  const toggleMuscle = (muscleId: string) => {
    setSelectedMuscleIds(prev =>
      prev.includes(muscleId)
        ? prev.filter(id => id !== muscleId)
        : [...prev, muscleId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('Exercise name is required');
      } else {
        Alert.alert('Error', 'Exercise name is required');
      }
      return;
    }

    setSaving(true);

    try {
      const updateData: ExerciseUpdateRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        sets: sets ? parseInt(sets) : undefined,
        repetitions: repetitions ? parseInt(repetitions) : undefined,
        defaultWeightKg: defaultWeight ? parseFloat(defaultWeight) : undefined,
        videoUrl: videoUrl.trim() || undefined,
        muscleIds: selectedMuscleIds.length > 0 ? selectedMuscleIds : undefined,
      };

      if (isCreating) {
        await exerciseService.createExercise(updateData);
        if (Platform.OS === 'web') {
          alert('Exercise created successfully');
        } else {
          Alert.alert('Success', 'Exercise created successfully');
        }
      } else {
        await exerciseService.updateExercise(exercise.id, updateData);
        if (Platform.OS === 'web') {
          alert('Exercise updated successfully');
        } else {
          Alert.alert('Success', 'Exercise updated successfully');
        }
      }
      
      onSave();
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || `Failed to ${isCreating ? 'create' : 'update'} exercise`;
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const musclesByGroup = muscles.reduce((acc, muscle) => {
    if (!acc[muscle.muscleGroup]) {
      acc[muscle.muscleGroup] = [];
    }
    acc[muscle.muscleGroup].push(muscle);
    return acc;
  }, {} as Record<MuscleGroup, MuscleResponse[]>);

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isCreating ? 'Create Exercise' : 'Edit Exercise'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.label}>Exercise Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Bench Press"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Exercise description..."
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Sets</Text>
              <TextInput
                style={styles.input}
                value={sets}
                onChangeText={setSets}
                placeholder="3"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>Repetitions</Text>
              <TextInput
                style={styles.input}
                value={repetitions}
                onChangeText={setRepetitions}
                placeholder="10"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={styles.label}>Default Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={defaultWeight}
            onChangeText={setDefaultWeight}
            placeholder="20"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Video URL</Text>
          <TextInput
            style={styles.input}
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="https://youtube.com/watch?v=..."
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.label}>Target Muscles</Text>
          {Object.entries(musclesByGroup).map(([group, groupMuscles]) => (
            <View key={group} style={styles.muscleGroupSection}>
              <Text style={styles.muscleGroupTitle}>{group}</Text>
              <View style={styles.muscleList}>
                {groupMuscles.map(muscle => (
                  <TouchableOpacity
                    key={muscle.id}
                    style={[
                      styles.muscleChip,
                      selectedMuscleIds.includes(muscle.id) && styles.muscleChipSelected,
                    ]}
                    onPress={() => toggleMuscle(muscle.id)}
                  >
                    <Text
                      style={[
                        styles.muscleChipText,
                        selectedMuscleIds.includes(muscle.id) && styles.muscleChipTextSelected,
                      ]}
                    >
                      {muscle.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  muscleGroupSection: {
    marginTop: 12,
  },
  muscleGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  muscleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  muscleChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  muscleChipText: {
    fontSize: 14,
    color: '#333',
  },
  muscleChipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { exerciseService, ExerciseResponse, MuscleResponse, MuscleGroup } from '@/services/exerciseService';
import EditExerciseModal from '@/components/EditExerciseModal';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useAuth } from '@/contexts/AuthContext';

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<ExerciseResponse[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseResponse[]>([]);
  const [muscles, setMuscles] = useState<MuscleResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuth();

  // Reload data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    console.log('Filtering exercises...');
    console.log('Total exercises:', exercises.length);
    console.log('Search query:', searchQuery);
    console.log('Selected muscle group:', selectedMuscleGroup);
    filterExercises();
  }, [searchQuery, selectedMuscleGroup, exercises]);

  const loadData = async () => {
    try {
      console.log('=== LOADING DATA ===');
      console.log('Loading exercises and muscles...');
      setLoading(true);
      const [exercisesData, musclesData] = await Promise.all([
        exerciseService.getAllExercises(),
        exerciseService.getAllMuscles(),
      ]);
      console.log('Loaded exercises:', exercisesData.length);
      console.log('Sample exercise:', exercisesData[0]);
      console.log('Loaded muscles:', musclesData.length);
      console.log('Sample muscle:', musclesData[0]);
      setExercises(exercisesData);
      setMuscles(musclesData);
    } catch (error: any) {
      console.error('Load data error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    if (searchQuery) {
      filtered = filtered.filter((ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedMuscleGroup !== 'ALL') {
      filtered = filtered.filter((ex) =>
        ex.muscles.some((m) => m.muscleGroup === selectedMuscleGroup)
      );
    }

    console.log('Filtered exercises:', filtered.length);
    setFilteredExercises(filtered);
  };

  const handleImportPdf = async () => {
    console.log('=== IMPORT PDF STARTED ===');
    try {
      console.log('Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('User canceled');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('No assets in result');
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);
      
      // Show confirmation
      if (Platform.OS === 'web') {
        // On web, use window.confirm instead of Alert.alert
        const confirmed = window.confirm(
          `Import exercises from:\n${file.name}\n\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nClick OK to import.`
        );
        
        if (!confirmed) {
          console.log('User canceled confirmation');
          return;
        }

        console.log('User confirmed, starting import...');
        setImporting(true);
        
        try {
          const formData = new FormData();
          const response = await fetch(file.uri);
          const blob = await response.blob();
          console.log('Fetched blob:', blob.size, 'bytes');
          formData.append('file', blob, file.name);

          console.log('Calling import API...');
          const importResult = await exerciseService.importExercisesFromPdf(formData);
          console.log('Import result:', importResult);

          alert(`Import Complete!\n\nSuccessfully imported ${importResult.successful} exercises.\nFailed: ${importResult.failed}`);
          loadData();
        } catch (error: any) {
          console.error('Import error:', error);
          const errorMsg = error.response?.data?.message || error.message || 'Failed to import PDF';
          alert(`Import Error: ${errorMsg}`);
        } finally {
          setImporting(false);
        }
      } else {
        // Native platform - use Alert.alert
        Alert.alert(
          'Confirm Import',
          `Import exercises from:\n${file.name}\n\nSize: ${(file.size / 1024).toFixed(1)} KB`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Import',
              onPress: async () => {
                setImporting(true);
                
                try {
                  const formData = new FormData();
                  formData.append('file', {
                    uri: file.uri,
                    type: file.mimeType || 'application/pdf',
                    name: file.name,
                  } as any);

                  const importResult = await exerciseService.importExercisesFromPdf(formData);

                  Alert.alert(
                    'Import Complete',
                    `Successfully imported ${importResult.successful} exercises.\nFailed: ${importResult.failed}`,
                    [{ text: 'OK', onPress: loadData }]
                  );
                } catch (error: any) {
                  const errorMsg = error.response?.data?.message || error.message || 'Failed to import PDF';
                  Alert.alert('Import Error', errorMsg);
                } finally {
                  setImporting(false);
                }
              }
            },
          ]
        );
      }
      
    } catch (error: any) {
      console.error('PDF selection error:', error);
      alert(`Error: ${error.message || 'Failed to select PDF file'}`);
    }
  };

  const handleExercisePress = (exercise: ExerciseResponse) => {
    console.log('Exercise pressed:', exercise.name);
    if (isAdmin) {
      setEditingExercise(exercise);
      setIsCreating(false);
    }
  };

  const handleCreateExercise = () => {
    // Create an empty exercise object for new exercise
    const newExercise: ExerciseResponse = {
      id: '',
      name: '',
      description: '',
      videoUrl: '',
      muscles: [],
    };
    setEditingExercise(newExercise);
    setIsCreating(true);
  };

  const handleEditExercise = (exercise: ExerciseResponse) => {
    setEditingExercise(exercise);
  };

  const handleDeleteExercise = (exercise: ExerciseResponse) => {
    const confirmDelete = async () => {
      try {
        await exerciseService.deleteExercise(exercise.id);
        if (Platform.OS === 'web') {
          alert('Exercise deleted successfully');
        } else {
          Alert.alert('Success', 'Exercise deleted successfully');
        }
        loadData();
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete exercise';
        if (Platform.OS === 'web') {
          alert(`Error: ${errorMsg}`);
        } else {
          Alert.alert('Error', errorMsg);
        }
      }
    };

    if (Platform.OS === 'web') {
      confirmDelete();
    } else {
      Alert.alert(
        'Delete Exercise',
        `Are you sure you want to delete "${exercise.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: confirmDelete,
          },
        ]
      );
    }
  };

  const extractYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  const handleOpenVideo = (videoUrl: string) => {
    if (videoUrl) {
      Linking.openURL(videoUrl).catch(() =>
        Alert.alert('Error', 'Could not open video URL')
      );
    }
  };

  const renderExercise = ({ item }: { item: ExerciseResponse }) => {
    const videoId = item.videoUrl ? extractYoutubeVideoId(item.videoUrl) : null;
    console.log('Exercise:', item.name, 'videoUrl:', item.videoUrl, 'videoId:', videoId);
    
    return (
      <View style={styles.exerciseCard}>
        {videoId && (
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            <View style={styles.videoContainer}>
              <YoutubePlayer
                height={200}
                videoId={videoId}
                play={false}
              />
            </View>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.exerciseContent}
          onPress={() => handleExercisePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <View style={styles.exerciseActions}>
              {item.videoUrl && (
                <TouchableOpacity
                  style={styles.videoButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleOpenVideo(item.videoUrl!);
                  }}
                >
                  <Text style={styles.videoButtonText}>🔗</Text>
                </TouchableOpacity>
              )}
              {isAdmin && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteExercise(item);
                  }}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {item.description && (
            <Text style={styles.exerciseDescription}>{item.description}</Text>
          )}

          <View style={styles.exerciseDetails}>
            {item.sets && (
              <Text style={styles.detailText}>Sets: {item.sets}</Text>
            )}
            {item.repetitions && (
              <Text style={styles.detailText}>Reps: {item.repetitions}</Text>
            )}
            {item.defaultWeightKg && (
              <Text style={styles.detailText}>Weight: {item.defaultWeightKg}kg</Text>
            )}
          </View>

          <View style={styles.musclesContainer}>
            {item.muscles.map((muscle) => (
              <View key={muscle.id} style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>{muscle.name}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const muscleGroups: Array<MuscleGroup | 'ALL'> = [
    'ALL',
    ...Object.values(MuscleGroup),
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Exercises</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <FlatList
          horizontal
          data={muscleGroups}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedMuscleGroup === item && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedMuscleGroup(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedMuscleGroup === item && styles.filterButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {isAdmin && (
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImportPdf}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.importButtonText}>📄 Import PDF</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercises found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your filters or import exercises from a PDF
            </Text>
          </View>
        }
      />

      {isAdmin && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={handleCreateExercise}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {editingExercise && (
        <EditExerciseModal
          visible={true}
          exercise={editingExercise}
          muscles={muscles}
          onClose={() => {
            setEditingExercise(null);
            setIsCreating(false);
          }}
          onSave={loadData}
          isCreating={isCreating}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  filterList: {
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  importButton: {
    backgroundColor: '#34C759',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000',
  },
  exerciseContent: {
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  videoButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  videoButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#888',
    marginRight: 15,
  },
  musclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  muscleTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  muscleTagText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    paddingHorizontal: 40,
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
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
  },
});

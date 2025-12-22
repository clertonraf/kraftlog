import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { routineService, RoutineResponse, workoutService, WorkoutResponse } from '@/services/routineService';
import { logRoutineService, LogRoutineResponse } from '@/services/logService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';
import { Calendar } from 'react-native-calendars';

type TabType = 'workouts' | 'calendar';

export default function RoutineDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [routine, setRoutine] = useState<RoutineResponse | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [logRoutines, setLogRoutines] = useState<LogRoutineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('workouts');

  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [id])
  );

  const loadRoutine = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [routineData, workoutsData, logRoutinesData] = await Promise.all([
        routineService.getRoutineById(id),
        workoutService.getWorkoutsByRoutineId(id),
        logRoutineService.getLogRoutinesByRoutineId(id),
      ]);
      setRoutine(routineData);
      setWorkouts(workoutsData);
      setLogRoutines(logRoutinesData);
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

  const getMarkedDates = () => {
    const marked: any = {};
    
    logRoutines.forEach((log) => {
      if (log.endDatetime) {
        const date = new Date(log.startDatetime).toISOString().split('T')[0];
        marked[date] = {
          marked: true,
          dotColor: '#34C759',
          selected: true,
          selectedColor: '#E8F5E9',
        };
      }
    });
    
    return marked;
  };

  const getWorkoutSessionsForDate = (dateString: string) => {
    return logRoutines.filter((log) => {
      const logDate = new Date(log.startDatetime).toISOString().split('T')[0];
      return logDate === dateString && log.endDatetime;
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return '0m';
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
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

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workouts' && styles.activeTab]}
          onPress={() => setActiveTab('workouts')}
        >
          <Ionicons 
            name="barbell" 
            size={20} 
            color={activeTab === 'workouts' ? '#007AFF' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'workouts' && styles.activeTabText]}>
            Workouts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={activeTab === 'calendar' ? '#007AFF' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
            History
          </Text>
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

        {activeTab === 'workouts' && (
          <>
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

            {routine.isActive && workouts.length > 0 && (
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => router.push(`/routine/${id}/start`)}
              >
                <Ionicons name="play-circle" size={24} color="#FFF" />
                <Text style={styles.startButtonText}>Start Workout Session</Text>
              </TouchableOpacity>
            )}

            {!routine.isActive && (
              <View style={styles.inactiveNotice}>
                <Ionicons name="information-circle" size={24} color="#FF9500" />
                <View style={styles.inactiveNoticeContent}>
                  <Text style={styles.inactiveNoticeTitle}>Inactive Routine</Text>
                  <Text style={styles.inactiveNoticeText}>
                    Activate this routine to start logging workouts
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === 'calendar' && (
          <View style={styles.section}>
            <View style={styles.calendarContainer}>
              <Calendar
                markedDates={getMarkedDates()}
                onDayPress={(day) => {
                  const sessions = getWorkoutSessionsForDate(day.dateString);
                  if (sessions.length > 0) {
                    // Show sessions for this date
                  }
                }}
                theme={{
                  todayTextColor: '#007AFF',
                  selectedDayBackgroundColor: '#007AFF',
                  dotColor: '#34C759',
                  arrowColor: '#007AFF',
                }}
              />
            </View>

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
                <Text style={styles.legendText}>Completed Workout</Text>
              </View>
            </View>

            <View style={styles.historyList}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              {logRoutines.filter(log => log.endDatetime).slice(0, 10).map((log) => (
                <TouchableOpacity
                  key={log.id}
                  style={styles.historyCard}
                  onPress={() => router.push(`/history/routine/${log.id}`)}
                >
                  <View style={styles.historyHeader}>
                    <View style={styles.historyDateContainer}>
                      <Ionicons name="calendar" size={18} color="#007AFF" />
                      <Text style={styles.historyDate}>
                        {new Date(log.startDatetime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <Text style={styles.historyTime}>
                      {formatTime(log.startDatetime)}
                    </Text>
                  </View>
                  <View style={styles.historyDetails}>
                    <View style={styles.historyDetailItem}>
                      <Ionicons name="barbell" size={16} color="#666" />
                      <Text style={styles.historyDetailText}>
                        {log.logWorkouts?.length || 0} workout{log.logWorkouts?.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.historyDetailItem}>
                      <Ionicons name="time" size={16} color="#666" />
                      <Text style={styles.historyDetailText}>
                        {calculateDuration(log.startDatetime, log.endDatetime)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {logRoutines.filter(log => log.endDatetime).length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>No workout history</Text>
                  <Text style={styles.emptySubtext}>Complete workouts to see them here</Text>
                </View>
              )}
            </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
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
  inactiveNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9E6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 12,
  },
  inactiveNoticeContent: {
    flex: 1,
  },
  inactiveNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  inactiveNoticeText: {
    fontSize: 14,
    color: '#B8860B',
    lineHeight: 20,
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  legendContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  historyTime: {
    fontSize: 14,
    color: '#666',
  },
  historyDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  historyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDetailText: {
    fontSize: 14,
    color: '#666',
  },
});

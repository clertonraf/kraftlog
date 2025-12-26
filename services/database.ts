import { Platform } from 'react-native';

let db: any | null = null;
let SQLite: any = null;

export const initDatabase = async () => {
  // SQLite is not fully supported on web - use in-memory fallback or skip
  if (Platform.OS === 'web') {
    console.log('SQLite is not available on web platform - using API only mode');
    // Return null for web - app will use API directly
    return null;
  }
  
  // Dynamically import SQLite only on native platforms
  if (!SQLite) {
    SQLite = await import('expo-sqlite');
  }
  
  if (db) return db;
  
  try {
    db = await SQLite.openDatabaseAsync('kraftlog.db');
  
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
    
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      surname TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      birth_date TEXT,
      weight_kg REAL,
      height_cm REAL,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
    
    -- Routines table
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Workouts table
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      routine_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      day_of_week INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
    );
    
    -- Exercises table
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      video_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
    
    -- Workout exercises junction table
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      sets INTEGER,
      reps INTEGER,
      rest_time_seconds INTEGER,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );
    
    -- Log routines table
    CREATE TABLE IF NOT EXISTS log_routines (
      id TEXT PRIMARY KEY,
      routine_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (routine_id) REFERENCES routines(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    -- Log workouts table
    CREATE TABLE IF NOT EXISTS log_workouts (
      id TEXT PRIMARY KEY,
      log_routine_id TEXT NOT NULL,
      workout_id TEXT NOT NULL,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (log_routine_id) REFERENCES log_routines(id) ON DELETE CASCADE,
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );
    
    -- Log exercises table
    CREATE TABLE IF NOT EXISTS log_exercises (
      id TEXT PRIMARY KEY,
      log_workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT,
      start_datetime TEXT,
      end_datetime TEXT,
      notes TEXT,
      repetitions INTEGER,
      completed INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (log_workout_id) REFERENCES log_workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
    
    -- Log sets table
    CREATE TABLE IF NOT EXISTS log_sets (
      id TEXT PRIMARY KEY,
      log_exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER,
      weight_kg REAL,
      rest_time_seconds INTEGER,
      timestamp TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (log_exercise_id) REFERENCES log_exercises(id) ON DELETE CASCADE
    );
    
    -- Sync queue table for tracking pending operations
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0
    );
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
    CREATE INDEX IF NOT EXISTS idx_workouts_routine_id ON workouts(routine_id);
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
    CREATE INDEX IF NOT EXISTS idx_log_routines_user_id ON log_routines(user_id);
    CREATE INDEX IF NOT EXISTS idx_log_workouts_log_routine_id ON log_workouts(log_routine_id);
    CREATE INDEX IF NOT EXISTS idx_log_exercises_log_workout_id ON log_exercises(log_workout_id);
    CREATE INDEX IF NOT EXISTS idx_log_sets_log_exercise_id ON log_sets(log_exercise_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
  `);
  
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = async () => {
  if (Platform.OS === 'web') {
    return null;
  }
  
  if (!db) {
    return await initDatabase();
  }
  return db;
};

export const closeDatabase = async () => {
  if (db && Platform.OS !== 'web') {
    await db.closeAsync();
    db = null;
  }
};

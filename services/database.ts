import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let db: any | null = null;
let SQLite: any = null;

// Web storage keys
const WEB_STORAGE_PREFIX = 'kraftlog_';

// Simple in-memory store for web
class WebDatabase {
  private data: Map<string, any[]> = new Map();
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    // Load from AsyncStorage on web
    try {
      const keys = await AsyncStorage.getAllKeys();
      const kraftlogKeys = keys.filter(k => k.startsWith(WEB_STORAGE_PREFIX));
      const items = await AsyncStorage.multiGet(kraftlogKeys);
      
      items.forEach(([key, value]) => {
        if (value) {
          const tableName = key.replace(WEB_STORAGE_PREFIX, '');
          this.data.set(tableName, JSON.parse(value));
        }
      });
    } catch (error) {
      console.error('Failed to load web database:', error);
    }
    
    this.initialized = true;
  }

  async saveTable(tableName: string) {
    const data = this.data.get(tableName) || [];
    await AsyncStorage.setItem(`${WEB_STORAGE_PREFIX}${tableName}`, JSON.stringify(data));
  }

  getTable(tableName: string): any[] {
    if (!this.data.has(tableName)) {
      this.data.set(tableName, []);
    }
    return this.data.get(tableName)!;
  }

  async insert(tableName: string, item: any) {
    const table = this.getTable(tableName);
    table.push(item);
    await this.saveTable(tableName);
    return item;
  }

  async update(tableName: string, id: string, updates: any) {
    const table = this.getTable(tableName);
    const index = table.findIndex(item => item.id === id);
    if (index !== -1) {
      table[index] = { ...table[index], ...updates };
      await this.saveTable(tableName);
      return table[index];
    }
    return null;
  }

  async delete(tableName: string, id: string) {
    const table = this.getTable(tableName);
    const index = table.findIndex(item => item.id === id);
    if (index !== -1) {
      table.splice(index, 1);
      await this.saveTable(tableName);
      return true;
    }
    return false;
  }

  async findAll(tableName: string): Promise<any[]> {
    return this.getTable(tableName);
  }

  async findById(tableName: string, id: string): Promise<any | null> {
    const table = this.getTable(tableName);
    return table.find(item => item.id === id) || null;
  }

  async findBy(tableName: string, predicate: (item: any) => boolean): Promise<any[]> {
    const table = this.getTable(tableName);
    return table.filter(predicate);
  }

  async clear(tableName: string) {
    this.data.set(tableName, []);
    await this.saveTable(tableName);
  }

  async clearAll() {
    const keys = Array.from(this.data.keys());
    this.data.clear();
    await Promise.all(
      keys.map(key => AsyncStorage.removeItem(`${WEB_STORAGE_PREFIX}${key}`))
    );
  }
}

let webDb: WebDatabase | null = null;

export const initDatabase = async () => {
  // Use WebDatabase for web platform
  if (Platform.OS === 'web') {
    console.log('Initializing web database using AsyncStorage');
    if (!webDb) {
      webDb = new WebDatabase();
      await webDb.init();
    }
    return webDb;
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
      is_active INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
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
      equipment_type TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
    
    -- Muscles table
    CREATE TABLE IF NOT EXISTS muscles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL
    );
    
    -- Exercise muscles junction table
    CREATE TABLE IF NOT EXISTS exercise_muscles (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      muscle_id TEXT NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
      FOREIGN KEY (muscle_id) REFERENCES muscles(id) ON DELETE CASCADE
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
  
    // Run migrations
    await runMigrations(db);
  
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = async () => {
  if (Platform.OS === 'web') {
    if (!webDb) {
      return await initDatabase();
    }
    return webDb;
  }
  
  if (!db) {
    return await initDatabase();
  }
  return db;
};

export const closeDatabase = async () => {
  if (Platform.OS === 'web') {
    // Web database doesn't need closing - data is persisted to AsyncStorage
    return;
  }
  
  if (db) {
    await db.closeAsync();
    db = null;
  }
};

export const clearAllData = async () => {
  if (Platform.OS === 'web') {
    if (webDb) {
      await webDb.clearAll();
    }
    return;
  }
  
  const database = await getDatabase();
  if (!database) return;
  
  console.log('Clearing all local data...');
  
  try {
    // Clear all tables except migrations
    await database.execAsync(`
      DELETE FROM log_sets;
      DELETE FROM log_exercises;
      DELETE FROM log_workouts;
      DELETE FROM log_routines;
      DELETE FROM workout_exercises;
      DELETE FROM workouts;
      DELETE FROM routines;
      DELETE FROM exercise_muscles;
      DELETE FROM exercises;
      DELETE FROM muscles;
      DELETE FROM sync_queue;
    `);
    
    console.log('All local data cleared successfully');
  } catch (error) {
    console.error('Failed to clear local data:', error);
    throw error;
  }
};

// Migration system
const runMigrations = async (database: any) => {
  // Create migrations table if it doesn't exist
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // Get current version
  const result = await database.getAllAsync('SELECT MAX(version) as version FROM migrations');
  const currentVersion = result[0]?.version || 0;

  // Migration 1: Add is_active, start_date, end_date to routines table
  if (currentVersion < 1) {
    try {
      // Check if columns already exist
      const tableInfo = await database.getAllAsync('PRAGMA table_info(routines)');
      const hasIsActive = tableInfo.some((col: any) => col.name === 'is_active');
      const hasStartDate = tableInfo.some((col: any) => col.name === 'start_date');
      const hasEndDate = tableInfo.some((col: any) => col.name === 'end_date');

      if (!hasIsActive) {
        await database.execAsync('ALTER TABLE routines ADD COLUMN is_active INTEGER DEFAULT 0');
      }
      if (!hasStartDate) {
        await database.execAsync('ALTER TABLE routines ADD COLUMN start_date TEXT');
      }
      if (!hasEndDate) {
        await database.execAsync('ALTER TABLE routines ADD COLUMN end_date TEXT');
      }

      await database.runAsync(
        'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
        [1, new Date().toISOString()]
      );
      console.log('Migration 1 applied: Added routine activation fields');
    } catch (error) {
      console.error('Migration 1 failed:', error);
      throw error;
    }
  }
};

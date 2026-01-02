#!/usr/bin/env node

const SQLite = require('expo-sqlite');
const path = require('path');

async function clearDatabase() {
  try {
    console.log('Opening database...');
    const db = await SQLite.openDatabaseAsync('kraftlog.db');
    
    console.log('Clearing all data...');
    await db.execAsync(`
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
    
    console.log('✅ Database cleared successfully!');
    await db.closeAsync();
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
  }
}

clearDatabase();

/**
 * Common test data and fixtures for E2E tests
 */

export const TEST_USERS = {
  admin: {
    email: process.env.TEST_USER_EMAIL || 'admin@kraftlog.com',
    password: process.env.TEST_USER_PASSWORD || 'admin123',
    name: 'Admin User',
  },
  testUser: {
    email: 'test@kraftlog.com',
    password: 'Test123456!',
    name: 'Test User',
  },
};

export const SAMPLE_ROUTINES = [
  {
    name: 'Summer Cut 2024',
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    isActive: true,
  },
  {
    name: 'Bulk Phase',
    startDate: '2024-09-01',
    endDate: '2024-12-31',
    isActive: false,
  },
];

export const SAMPLE_EXERCISES = [
  {
    name: 'Bench Press',
    muscleGroup: 'CHEST',
    videoUrl: 'https://youtu.be/example1',
  },
  {
    name: 'Squat',
    muscleGroup: 'LEGS',
    videoUrl: 'https://youtu.be/example2',
  },
  {
    name: 'Deadlift',
    muscleGroup: 'BACK',
    videoUrl: 'https://youtu.be/example3',
  },
];

export const SAMPLE_WORKOUTS = [
  {
    name: 'Push Day',
    exercises: ['Bench Press', 'Overhead Press', 'Tricep Dips'],
  },
  {
    name: 'Pull Day',
    exercises: ['Deadlift', 'Rows', 'Bicep Curls'],
  },
  {
    name: 'Leg Day',
    exercises: ['Squat', 'Leg Press', 'Lunges'],
  },
];

/**
 * Generate unique test data with timestamp
 */
export function generateTestData(prefix: string) {
  const timestamp = Date.now();
  return {
    routine: `${prefix} Routine ${timestamp}`,
    workout: `${prefix} Workout ${timestamp}`,
    exercise: `${prefix} Exercise ${timestamp}`,
    email: `${prefix.toLowerCase()}${timestamp}@test.com`,
  };
}

/**
 * Common test timeouts
 */
export const TIMEOUTS = {
  short: 2000,
  medium: 5000,
  long: 10000,
  veryLong: 30000,
};

/**
 * Common selectors
 */
export const SELECTORS = {
  loading: '[data-testid="loading"], .loading, [aria-busy="true"]',
  error: '[data-testid="error"], .error, [role="alert"]',
  success: '[data-testid="success"], .success',
  modal: '[role="dialog"], .modal',
  toast: '[role="status"], .toast',
};

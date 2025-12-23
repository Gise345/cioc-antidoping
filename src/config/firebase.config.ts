/**
 * Firebase Configuration
 *
 * Reads configuration from environment variables.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Create a new project or select existing one
 * 3. Enable Authentication with Email/Password provider
 * 4. Create a Firestore database
 * 5. Go to Project Settings > General > Your apps
 * 6. Add a Web app and copy the configuration
 * 7. Create .env.development file from .env.example
 * 8. Fill in your Firebase credentials
 */

import Constants from 'expo-constants';

// Environment variables with Expo's public prefix
const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.warn(`[Firebase Config] Missing environment variable: ${key}`);
    return '';
  }
  return value;
};

/**
 * Firebase configuration object
 */
export const firebaseConfig = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
  measurementId: getEnvVar('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'),
};

/**
 * Validate that all required Firebase config values are present
 */
export const validateFirebaseConfig = (): { valid: boolean; missing: string[] } => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ] as const;

  const missing = requiredKeys.filter(
    (key) => !firebaseConfig[key] || firebaseConfig[key] === ''
  );

  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Get current environment
 */
export const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const env = getEnvVar('EXPO_PUBLIC_APP_ENV');
  if (env === 'staging' || env === 'production') {
    return env;
  }
  return 'development';
};

/**
 * Feature flags
 */
export const featureFlags = {
  enableAnalytics: getEnvVar('EXPO_PUBLIC_ENABLE_ANALYTICS') === 'true',
  enableCrashlytics: getEnvVar('EXPO_PUBLIC_ENABLE_CRASHLYTICS') === 'true',
};

/**
 * Log configuration status (only in development)
 */
export const logConfigStatus = (): void => {
  if (__DEV__) {
    const { valid, missing } = validateFirebaseConfig();
    if (valid) {
      console.log('[Firebase Config] ✓ Configuration loaded successfully');
      console.log(`[Firebase Config] Project: ${firebaseConfig.projectId}`);
    } else {
      console.error('[Firebase Config] ✗ Missing required configuration:');
      missing.forEach((key) => console.error(`  - ${key}`));
      console.error('[Firebase Config] Please check your .env.development file');
    }
  }
};

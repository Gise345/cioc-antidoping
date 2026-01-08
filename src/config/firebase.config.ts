/**
 * Firebase Configuration
 *
 * Reads configuration from app.config.js extra field (for EAS builds)
 * or falls back to environment variables (for local development).
 */

import Constants from 'expo-constants';

// Get extra config from app.config.js
const extra = Constants.expoConfig?.extra ?? {};

/**
 * Get config value from Constants.extra (EAS build) or process.env (local dev)
 */
const getConfigValue = (extraKey: string, envKey: string): string => {
  // First try Constants.extra (populated by app.config.js in EAS builds)
  if (extra[extraKey]) {
    return extra[extraKey];
  }
  // Fall back to process.env (for local development)
  const envValue = process.env[envKey];
  if (envValue) {
    return envValue;
  }
  console.warn(`[Firebase Config] Missing config: ${extraKey}`);
  return '';
};

/**
 * Firebase configuration object
 */
export const firebaseConfig = {
  apiKey: getConfigValue('firebaseApiKey', 'EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getConfigValue('firebaseAuthDomain', 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getConfigValue('firebaseProjectId', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getConfigValue('firebaseStorageBucket', 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getConfigValue('firebaseMessagingSenderId', 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getConfigValue('firebaseAppId', 'EXPO_PUBLIC_FIREBASE_APP_ID'),
  measurementId: getConfigValue('firebaseMeasurementId', 'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'),
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
  const env = extra.appEnv || process.env.EXPO_PUBLIC_APP_ENV;
  if (env === 'staging' || env === 'production') {
    return env;
  }
  return 'development';
};

/**
 * Feature flags
 */
export const featureFlags = {
  enableAnalytics: extra.enableAnalytics === true || process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableCrashlytics: extra.enableCrashlytics === true || process.env.EXPO_PUBLIC_ENABLE_CRASHLYTICS === 'true',
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

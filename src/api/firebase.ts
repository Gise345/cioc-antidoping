/**
 * Firebase Service
 * Initialize and export Firebase instances
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  connectAuthEmulator,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  connectStorageEmulator,
} from 'firebase/storage';
import { firebaseConfig, validateFirebaseConfig, logConfigStatus } from '../config/firebase.config';

// ============================================================================
// INITIALIZATION
// ============================================================================

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

/**
 * Initialize Firebase
 * Should be called once at app startup
 */
export const initializeFirebase = (): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
} => {
  // Validate configuration
  const { valid, missing } = validateFirebaseConfig();
  if (!valid) {
    console.error(`[Firebase] Configuration missing: ${missing.join(', ')}`);
    // Don't throw - let the app continue and show an error to the user
  }

  // Log config status in development
  logConfigStatus();

  // Initialize app if not already done
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] App initialized');
  } else {
    app = getApp();
    console.log('[Firebase] Using existing app instance');
  }

  // Initialize Auth with AsyncStorage persistence for React Native
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log('[Firebase] Auth initialized with AsyncStorage persistence');
  } catch (error) {
    // If already initialized, get existing instance
    auth = getAuth(app);
    console.log('[Firebase] Using existing Auth instance');
  }

  // Initialize Firestore (without web-specific persistence that breaks React Native)
  try {
    db = getFirestore(app);
    console.log('[Firebase] Firestore initialized');
  } catch (error) {
    console.error('[Firebase] Firestore initialization error:', error);
    throw error;
  }

  // Initialize Storage
  storage = getStorage(app);

  // Connect to emulators in development (if configured)
  if (__DEV__ && process.env.EXPO_PUBLIC_USE_EMULATORS === 'true') {
    connectToEmulators();
  }

  return { app, auth, db, storage };
};

/**
 * Connect to Firebase emulators for local development
 */
const connectToEmulators = (): void => {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('[Firebase] Connected to emulators');
  } catch (error) {
    console.warn('[Firebase] Failed to connect to emulators:', error);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Get Firebase app instance
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    const result = initializeFirebase();
    return result.app;
  }
  return app;
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    const result = initializeFirebase();
    return result.auth;
  }
  return auth;
};

/**
 * Get Firestore instance
 */
export const getFirestoreDb = (): Firestore => {
  if (!db) {
    const result = initializeFirebase();
    return result.db;
  }
  return db;
};

/**
 * Get Firebase Storage instance
 */
export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    const result = initializeFirebase();
    return result.storage;
  }
  return storage;
};

// ============================================================================
// AUTH HELPERS
// ============================================================================

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  const authInstance = getFirebaseAuth();
  return authInstance.currentUser;
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  const authInstance = getFirebaseAuth();
  await firebaseSignOut(authInstance);
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthChanges = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  const authInstance = getFirebaseAuth();
  return onAuthStateChanged(authInstance, callback);
};

/**
 * Wait for auth state to be ready (with timeout)
 */
export const waitForAuthReady = (): Promise<FirebaseUser | null> => {
  const authInstance = getFirebaseAuth();
  return new Promise((resolve, reject) => {
    // Add timeout to prevent infinite hang
    const timeout = setTimeout(() => {
      console.warn('[Firebase] Auth ready timeout - resolving with null');
      resolve(null);
    }, 10000); // 10 second timeout

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { FirebaseApp } from 'firebase/app';
export type { Auth, User as FirebaseUser } from 'firebase/auth';
export type { Firestore } from 'firebase/firestore';
export type { FirebaseStorage } from 'firebase/storage';

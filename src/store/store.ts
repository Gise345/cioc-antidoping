/**
 * Redux Store Configuration
 * Configured with redux-persist for offline support
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import slices
import authReducer from './slices/authSlice';
import whereaboutsReducer from './slices/whereaboutsSlice';
import locationsReducer from './slices/locationsSlice';
import uiReducer from './slices/uiSlice';
import adminReducer from './slices/adminSlice';

// Root reducer combining all slices
const rootReducer = combineReducers({
  auth: authReducer,
  whereabouts: whereaboutsReducer,
  locations: locationsReducer,
  ui: uiReducer,
  admin: adminReducer,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  // Whitelist - only persist these reducers
  whitelist: ['auth', 'locations'],
  // Blacklist - never persist these reducers
  blacklist: ['ui'],
};

// Auth-specific persist config for sensitive data
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  // Only persist non-sensitive auth state
  whitelist: ['isAuthenticated', 'user', 'athlete'],
  blacklist: ['loading', 'error'],
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions for serializable check
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore paths that may contain non-serializable values
        ignoredPaths: [
          'auth.user.createdAt',
          'auth.user.updatedAt',
          'auth.athlete.dateOfBirth',
          'auth.athlete.createdAt',
          'auth.athlete.updatedAt',
        ],
      },
    }),
  devTools: __DEV__,
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type for the persisted state
export type PersistedState = ReturnType<typeof persistedReducer>;

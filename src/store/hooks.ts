/**
 * Typed Redux Hooks
 * Use these hooks throughout the app instead of plain `useDispatch` and `useSelector`
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed dispatch hook
 * Use this instead of plain `useDispatch`
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed selector hook
 * Use this instead of plain `useSelector`
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  return useAppSelector((state) => state.auth.isAuthenticated);
};

/**
 * Hook to get current user
 */
export const useCurrentUser = () => {
  return useAppSelector((state) => state.auth.user);
};

/**
 * Hook to get current athlete profile
 */
export const useAthleteProfile = () => {
  return useAppSelector((state) => state.auth.athlete);
};

/**
 * Hook to get auth loading state
 */
export const useAuthLoading = () => {
  return useAppSelector((state) => state.auth.loading);
};

/**
 * Hook to get auth error
 */
export const useAuthError = () => {
  return useAppSelector((state) => state.auth.error);
};

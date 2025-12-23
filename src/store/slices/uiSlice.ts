/**
 * UI Slice
 * Redux state management for UI state (loading, toasts, modals, etc.)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ============================================================================
// STATE TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface UIState {
  // Global loading
  globalLoading: boolean;
  loadingMessage: string | null;

  // Toast notifications
  toasts: Toast[];

  // Network status
  isOffline: boolean;
  isReconnecting: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Modal states
  activeModal: string | null;
  modalData: Record<string, unknown> | null;

  // Keyboard
  keyboardVisible: boolean;
  keyboardHeight: number;
}

const initialState: UIState = {
  globalLoading: false,
  loadingMessage: null,
  toasts: [],
  isOffline: false,
  isReconnecting: false,
  theme: 'system',
  activeModal: null,
  modalData: null,
  keyboardVisible: false,
  keyboardHeight: 0,
};

// ============================================================================
// SLICE
// ============================================================================

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Show global loading overlay
     */
    showLoading: (state, action: PayloadAction<string | undefined>) => {
      state.globalLoading = true;
      state.loadingMessage = action.payload || null;
    },

    /**
     * Hide global loading overlay
     */
    hideLoading: (state) => {
      state.globalLoading = false;
      state.loadingMessage = null;
    },

    /**
     * Add a toast notification
     */
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      state.toasts.push({
        ...action.payload,
        id,
        duration: action.payload.duration || 3000,
      });
    },

    /**
     * Remove a toast by ID
     */
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    /**
     * Clear all toasts
     */
    clearToasts: (state) => {
      state.toasts = [];
    },

    /**
     * Set offline status
     */
    setOffline: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },

    /**
     * Set reconnecting status
     */
    setReconnecting: (state, action: PayloadAction<boolean>) => {
      state.isReconnecting = action.payload;
    },

    /**
     * Set theme
     */
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },

    /**
     * Open modal
     */
    openModal: (
      state,
      action: PayloadAction<{ modal: string; data?: Record<string, unknown> }>
    ) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },

    /**
     * Close modal
     */
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },

    /**
     * Set keyboard state
     */
    setKeyboardState: (
      state,
      action: PayloadAction<{ visible: boolean; height: number }>
    ) => {
      state.keyboardVisible = action.payload.visible;
      state.keyboardHeight = action.payload.height;
    },
  },
});

export const {
  showLoading,
  hideLoading,
  addToast,
  removeToast,
  clearToasts,
  setOffline,
  setReconnecting,
  setTheme,
  openModal,
  closeModal,
  setKeyboardState,
} = uiSlice.actions;

export default uiSlice.reducer;

// ============================================================================
// HELPER ACTIONS
// ============================================================================

/**
 * Show success toast
 */
export const showSuccessToast = (message: string) =>
  addToast({ type: 'success', message });

/**
 * Show error toast
 */
export const showErrorToast = (message: string) =>
  addToast({ type: 'error', message, duration: 5000 });

/**
 * Show warning toast
 */
export const showWarningToast = (message: string) =>
  addToast({ type: 'warning', message });

/**
 * Show info toast
 */
export const showInfoToast = (message: string) =>
  addToast({ type: 'info', message });

// ============================================================================
// SELECTORS
// ============================================================================

export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectIsOffline = (state: { ui: UIState }) => state.ui.isOffline;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectActiveModal = (state: { ui: UIState }) => state.ui.activeModal;

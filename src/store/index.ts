/**
 * Redux Store Index
 * Central export for store, hooks, and actions
 */

// Store
export { store, persistor } from './store';
export type { RootState, AppDispatch } from './store';

// Hooks
export {
  useAppDispatch,
  useAppSelector,
  useIsAuthenticated,
  useCurrentUser,
  useAthleteProfile,
  useAuthLoading,
  useAuthError,
} from './hooks';

// Auth Slice
export {
  default as authReducer,
  // Actions
  clearError as clearAuthError,
  setRegistrationStep,
  updateRegistrationData,
  clearRegistrationData,
  setAuthState,
  setInitialized,
  setRequiresPasswordChange,
  clearPasswordChangeRequirement,
  devBypassAuth,
  // Thunks
  initializeAuth,
  loginAsync,
  registerAsync,
  logoutAsync,
  resetPasswordAsync,
  loadUserProfile,
  updateProfileAsync,
  checkFirstLoginAsync,
  changePasswordAsync,
  // Selectors
  selectAuth,
  selectUser,
  selectUserProfile,
  selectAthlete,
  selectIsAuthenticated,
  selectIsInitialized,
  selectRequiresPasswordChange,
  selectIsFirstLogin,
  selectAuthLoading,
  selectPasswordChangeLoading,
  selectAuthError,
  selectRegistrationData,
  selectRegistrationStep,
} from './slices/authSlice';

// Whereabouts Slice
export {
  default as whereaboutsReducer,
  // Actions
  setQuarters,
  setCurrentQuarter,
  updateDailySlot,
  setTemplates,
  updateMissingDates,
  clearError as clearWhereaboutsError,
  resetWhereabouts,
  // Async Thunks - Quarters
  fetchQuartersAsync,
  fetchQuarterAsync,
  fetchCurrentQuarterAsync,
  createQuarterAsync,
  updateQuarterAsync,
  submitQuarterAsync,
  copyQuarterAsync,
  // Async Thunks - Daily Slots
  fetchDailySlotsAsync,
  upsertDailySlotAsync,
  bulkUpsertSlotsAsync,
  updateSlotAsync,
  // Async Thunks - Templates
  fetchTemplatesAsync,
  saveTemplateAsync,
  applyTemplateAsync,
  deleteTemplateAsync,
  // Selectors
  selectWhereabouts,
  selectQuarters,
  selectCurrentQuarter,
  selectDailySlots,
  selectCurrentQuarterSlots,
  selectTemplates,
  selectDefaultTemplate,
  selectDaysUntilDeadline,
  selectMissingDates,
  selectWhereaboutsLoading,
  selectSlotsLoading,
  selectWhereaboutsSaving,
  selectWhereaboutsSubmitting,
  selectWhereaboutsError,
  selectQuarterById,
  selectSlotByDate,
  selectQuarterCompletionPercentage,
  selectUpcomingDeadline,
  selectQuartersByStatus,
  selectActiveQuarters,
  selectSubmittedQuarters,
  // Types
  type QuarterWithId,
  type SlotWithId,
  type TemplateWithId,
  type WhereaboutsState,
} from './slices/whereaboutsSlice';

// Locations Slice
export {
  default as locationsReducer,
  // Actions
  setHomeLocation,
  setTrainingLocation,
  setGymLocation,
  setCompetitions,
  setLoading as setLocationsLoading,
  setError as setLocationsError,
  clearError as clearLocationsError,
  resetLocations,
  // Async Thunks
  fetchAllLocationsAsync,
  saveHomeLocationAsync,
  saveTrainingLocationAsync,
  saveGymLocationAsync,
  deleteGymLocationAsync,
  addCompetitionAsync,
  updateCompetitionAsync,
  deleteCompetitionAsync,
  // Selectors
  selectHomeLocation,
  selectTrainingLocation,
  selectGymLocation,
  selectAllCompetitions,
  selectUpcomingCompetitions,
  selectPastCompetitions,
  selectCompetitionById,
  selectLocationCompletionStatus,
  selectLocationsLoading,
  selectLocationsError,
  selectHasMandatoryLocations,
  selectHasCompetitions,
  selectActiveCompetitions,
  // Types
  type LocationsState,
  type LocationCompletionStatus,
} from './slices/locationsSlice';

// UI Slice
export {
  default as uiReducer,
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
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  selectUI,
  selectGlobalLoading,
  selectToasts,
  selectIsOffline,
  selectTheme,
  selectActiveModal,
} from './slices/uiSlice';

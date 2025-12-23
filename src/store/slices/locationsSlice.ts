/**
 * Locations Slice
 * Redux state management for athlete locations and competitions
 *
 * State Structure:
 * - homeLocation: LocationWithSchedule | null (required)
 * - trainingLocation: LocationWithSchedule | null (required)
 * - gymLocation: LocationWithSchedule | null (optional)
 * - competitions: Competition[]
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LocationWithSchedule, Competition } from '../../types';
import {
  saveHomeLocation,
  getHomeLocation,
  saveTrainingLocation,
  getTrainingLocation,
  saveGymLocation,
  getGymLocation,
  deleteGymLocation,
  addCompetition,
  getAthleteCompetitions,
  updateCompetition,
  deleteCompetition,
  fetchAllAthleteLocations,
  LocationValidationError,
} from '../../api/locations';

// ============================================================================
// STATE TYPES
// ============================================================================

export interface LocationsState {
  homeLocation: LocationWithSchedule | null;
  trainingLocation: LocationWithSchedule | null;
  gymLocation: LocationWithSchedule | null;
  competitions: Competition[];
  loading: boolean;
  error: string | null;
}

export interface LocationCompletionStatus {
  homeComplete: boolean;
  trainingComplete: boolean;
  gymComplete: boolean;
  allMandatoryComplete: boolean;
}

const initialState: LocationsState = {
  homeLocation: null,
  trainingLocation: null,
  gymLocation: null,
  competitions: [],
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Fetch all locations and competitions for an athlete in parallel
 */
export const fetchAllLocationsAsync = createAsyncThunk<
  {
    homeLocation: LocationWithSchedule | null;
    trainingLocation: LocationWithSchedule | null;
    gymLocation: LocationWithSchedule | null;
    competitions: Competition[];
  },
  string, // athleteId
  { rejectValue: string }
>('locations/fetchAll', async (athleteId, { rejectWithValue }) => {
  try {
    console.log('[LocationsSlice] Fetching all locations for:', athleteId);
    const result = await fetchAllAthleteLocations(athleteId);
    return result;
  } catch (error) {
    console.error('[LocationsSlice] Fetch all error:', error);
    if (error instanceof LocationValidationError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to fetch locations');
  }
});

/**
 * Save home location
 */
export const saveHomeLocationAsync = createAsyncThunk<
  LocationWithSchedule,
  { athleteId: string; data: LocationWithSchedule },
  { rejectValue: string }
>('locations/saveHome', async ({ athleteId, data }, { rejectWithValue }) => {
  try {
    console.log('[LocationsSlice] Saving home location for:', athleteId);
    const result = await saveHomeLocation(athleteId, data);
    return result;
  } catch (error) {
    console.error('[LocationsSlice] Save home error:', error);
    if (error instanceof LocationValidationError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to save home location');
  }
});

/**
 * Save training location
 */
export const saveTrainingLocationAsync = createAsyncThunk<
  LocationWithSchedule,
  { athleteId: string; data: LocationWithSchedule },
  { rejectValue: string }
>('locations/saveTraining', async ({ athleteId, data }, { rejectWithValue }) => {
  try {
    console.log('[LocationsSlice] Saving training location for:', athleteId);
    const result = await saveTrainingLocation(athleteId, data);
    return result;
  } catch (error) {
    console.error('[LocationsSlice] Save training error:', error);
    if (error instanceof LocationValidationError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to save training location');
  }
});

/**
 * Save gym location (optional)
 */
export const saveGymLocationAsync = createAsyncThunk<
  LocationWithSchedule,
  { athleteId: string; data: LocationWithSchedule },
  { rejectValue: string }
>('locations/saveGym', async ({ athleteId, data }, { rejectWithValue }) => {
  try {
    console.log('[LocationsSlice] Saving gym location for:', athleteId);
    const result = await saveGymLocation(athleteId, data);
    return result;
  } catch (error) {
    console.error('[LocationsSlice] Save gym error:', error);
    if (error instanceof LocationValidationError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to save gym location');
  }
});

/**
 * Delete gym location
 */
export const deleteGymLocationAsync = createAsyncThunk<
  void,
  string, // athleteId
  { rejectValue: string }
>('locations/deleteGym', async (athleteId, { rejectWithValue }) => {
  try {
    console.log('[LocationsSlice] Deleting gym location for:', athleteId);
    await deleteGymLocation(athleteId);
  } catch (error) {
    console.error('[LocationsSlice] Delete gym error:', error);
    if (error instanceof LocationValidationError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to delete gym location');
  }
});

/**
 * Add a new competition
 */
export const addCompetitionAsync = createAsyncThunk<
  Competition,
  { athleteId: string; data: Omit<Competition, 'id' | 'created_at' | 'updated_at'> },
  { rejectValue: string }
>('locations/addCompetition', async ({ athleteId, data }, { rejectWithValue }) => {
  try {
    console.log('[LocationsSlice] Adding competition for:', athleteId);
    const result = await addCompetition(athleteId, data);
    return result;
  } catch (error) {
    console.error('[LocationsSlice] Add competition error:', error);
    if (error instanceof LocationValidationError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to add competition');
  }
});

/**
 * Update a competition
 */
export const updateCompetitionAsync = createAsyncThunk<
  Competition,
  { competitionId: string; data: Partial<Competition> },
  { rejectValue: string }
>('locations/updateCompetition', async ({ competitionId, data }, { rejectWithValue }) => {
  try {
    console.log('[LocationsSlice] Updating competition:', competitionId);
    const result = await updateCompetition(competitionId, data);
    return result;
  } catch (error) {
    console.error('[LocationsSlice] Update competition error:', error);
    if (error instanceof LocationValidationError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to update competition');
  }
});

/**
 * Delete a competition
 */
export const deleteCompetitionAsync = createAsyncThunk<
  string, // Returns the deleted competition ID
  string, // competitionId
  { rejectValue: string }
>('locations/deleteCompetition', async (competitionId, { rejectWithValue }) => {
  try {
    console.log('[LocationsSlice] Deleting competition:', competitionId);
    await deleteCompetition(competitionId);
    return competitionId;
  } catch (error) {
    console.error('[LocationsSlice] Delete competition error:', error);
    if (error instanceof LocationValidationError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to delete competition');
  }
});

// ============================================================================
// SLICE
// ============================================================================

const locationsSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    /**
     * Set home location directly
     */
    setHomeLocation: (state, action: PayloadAction<LocationWithSchedule | null>) => {
      state.homeLocation = action.payload;
    },

    /**
     * Set training location directly
     */
    setTrainingLocation: (state, action: PayloadAction<LocationWithSchedule | null>) => {
      state.trainingLocation = action.payload;
    },

    /**
     * Set gym location directly
     */
    setGymLocation: (state, action: PayloadAction<LocationWithSchedule | null>) => {
      state.gymLocation = action.payload;
    },

    /**
     * Set competitions array directly
     */
    setCompetitions: (state, action: PayloadAction<Competition[]>) => {
      state.competitions = action.payload;
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Reset state (on logout)
     */
    resetLocations: () => initialState,
  },

  extraReducers: (builder) => {
    // ========================================
    // Fetch All Locations
    // ========================================
    builder
      .addCase(fetchAllLocationsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLocationsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.homeLocation = action.payload.homeLocation;
        state.trainingLocation = action.payload.trainingLocation;
        state.gymLocation = action.payload.gymLocation;
        state.competitions = action.payload.competitions;
      })
      .addCase(fetchAllLocationsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch locations';
      });

    // ========================================
    // Save Home Location
    // ========================================
    builder
      .addCase(saveHomeLocationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveHomeLocationAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.homeLocation = action.payload;
      })
      .addCase(saveHomeLocationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to save home location';
      });

    // ========================================
    // Save Training Location
    // ========================================
    builder
      .addCase(saveTrainingLocationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveTrainingLocationAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.trainingLocation = action.payload;
      })
      .addCase(saveTrainingLocationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to save training location';
      });

    // ========================================
    // Save Gym Location
    // ========================================
    builder
      .addCase(saveGymLocationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveGymLocationAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.gymLocation = action.payload;
      })
      .addCase(saveGymLocationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to save gym location';
      });

    // ========================================
    // Delete Gym Location
    // ========================================
    builder
      .addCase(deleteGymLocationAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGymLocationAsync.fulfilled, (state) => {
        state.loading = false;
        state.gymLocation = null;
      })
      .addCase(deleteGymLocationAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete gym location';
      });

    // ========================================
    // Add Competition
    // ========================================
    builder
      .addCase(addCompetitionAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCompetitionAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Add to competitions array and sort by start_date
        state.competitions = [...state.competitions, action.payload].sort(
          (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
      })
      .addCase(addCompetitionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add competition';
      });

    // ========================================
    // Update Competition
    // ========================================
    builder
      .addCase(updateCompetitionAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompetitionAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Update competition in array
        const index = state.competitions.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.competitions[index] = action.payload;
          // Re-sort by start_date
          state.competitions = [...state.competitions].sort(
            (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          );
        }
      })
      .addCase(updateCompetitionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update competition';
      });

    // ========================================
    // Delete Competition
    // ========================================
    builder
      .addCase(deleteCompetitionAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompetitionAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.competitions = state.competitions.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCompetitionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete competition';
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setHomeLocation,
  setTrainingLocation,
  setGymLocation,
  setCompetitions,
  setLoading,
  setError,
  clearError,
  resetLocations,
} = locationsSlice.actions;

export default locationsSlice.reducer;

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Select home location
 */
export const selectHomeLocation = (state: { locations: LocationsState }) =>
  state.locations.homeLocation;

/**
 * Select training location
 */
export const selectTrainingLocation = (state: { locations: LocationsState }) =>
  state.locations.trainingLocation;

/**
 * Select gym location
 */
export const selectGymLocation = (state: { locations: LocationsState }) =>
  state.locations.gymLocation;

/**
 * Select all competitions
 */
export const selectAllCompetitions = (state: { locations: LocationsState }) =>
  state.locations.competitions;

/**
 * Select upcoming competitions (end_date >= today)
 */
export const selectUpcomingCompetitions = (state: { locations: LocationsState }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return state.locations.competitions.filter((competition) => {
    const endDate = new Date(competition.end_date);
    endDate.setHours(23, 59, 59, 999);
    return endDate >= today;
  });
};

/**
 * Select past competitions (end_date < today)
 */
export const selectPastCompetitions = (state: { locations: LocationsState }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return state.locations.competitions.filter((competition) => {
    const endDate = new Date(competition.end_date);
    endDate.setHours(23, 59, 59, 999);
    return endDate < today;
  });
};

/**
 * Select competition by ID
 */
export const selectCompetitionById = (id: string) => (state: { locations: LocationsState }) =>
  state.locations.competitions.find((c) => c.id === id);

/**
 * Select location completion status
 */
export const selectLocationCompletionStatus = (state: { locations: LocationsState }): LocationCompletionStatus => {
  const { homeLocation, trainingLocation, gymLocation } = state.locations;

  const homeComplete = homeLocation !== null;
  const trainingComplete = trainingLocation !== null;
  const gymComplete = gymLocation !== null;
  const allMandatoryComplete = homeComplete && trainingComplete;

  return {
    homeComplete,
    trainingComplete,
    gymComplete,
    allMandatoryComplete,
  };
};

/**
 * Select loading state
 */
export const selectLocationsLoading = (state: { locations: LocationsState }) =>
  state.locations.loading;

/**
 * Select error state
 */
export const selectLocationsError = (state: { locations: LocationsState }) =>
  state.locations.error;

/**
 * Select whether athlete has all mandatory locations set up
 */
export const selectHasMandatoryLocations = (state: { locations: LocationsState }) => {
  const { homeLocation, trainingLocation } = state.locations;
  return homeLocation !== null && trainingLocation !== null;
};

/**
 * Select whether athlete has any competitions
 */
export const selectHasCompetitions = (state: { locations: LocationsState }) =>
  state.locations.competitions.length > 0;

/**
 * Select active competitions (currently ongoing)
 */
export const selectActiveCompetitions = (state: { locations: LocationsState }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return state.locations.competitions.filter((competition) => {
    const startDate = new Date(competition.start_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(competition.end_date);
    endDate.setHours(23, 59, 59, 999);

    return startDate <= today && endDate >= today;
  });
};

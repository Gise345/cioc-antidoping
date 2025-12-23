/**
 * Admin Slice
 * Redux state management for admin functionality
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  createAthleteAccount,
  listAthletes,
  getAthleteDetails,
  updateAthleteDetails,
  deactivateAthlete,
  reactivateAthlete,
  resetAthletePassword,
  getAthleteStatistics,
  getRecentAthletes,
  CreateAthleteAccountData,
  AthleteWithUser,
  ListAthletesFilters,
  AdminError,
} from '../../api/admin';
import {
  UserDocument,
  AthleteDocument,
  TestingPoolStatus,
  AthleteStatus,
  ResidenceStatus,
} from '../../types/firestore';

// ============================================================================
// STATE TYPES
// ============================================================================

export interface AdminFilters {
  sport: string;
  residenceStatus: string;
  testingPoolStatus: string;
  status: string;
  searchQuery: string;
}

export interface AthleteStatistics {
  totalAthletes: number;
  activeAthletes: number;
  inactiveAthletes: number;
  byTestingPool: { NONE: number; RTP: number; TP: number };
  bySport: Record<string, number>;
  byResidenceStatus: { local: number; overseas: number };
}

export interface AdminState {
  athletes: AthleteWithUser[];
  selectedAthlete: { user: UserDocument; athlete: AthleteDocument } | null;
  recentAthletes: AthleteWithUser[];
  statistics: AthleteStatistics | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  filters: AdminFilters;
  lastCreatedAthlete: {
    userId: string;
    tempPassword: string;
    email: string;
    name: string;
  } | null;
}

const initialFilters: AdminFilters = {
  sport: '',
  residenceStatus: '',
  testingPoolStatus: '',
  status: '',
  searchQuery: '',
};

const initialState: AdminState = {
  athletes: [],
  selectedAthlete: null,
  recentAthletes: [],
  statistics: null,
  loading: false,
  creating: false,
  error: null,
  filters: initialFilters,
  lastCreatedAthlete: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Create a new athlete account
 */
export const createAthleteAsync = createAsyncThunk<
  { userId: string; tempPassword: string; email: string; name: string },
  CreateAthleteAccountData,
  { rejectValue: string }
>('admin/createAthlete', async (data, { rejectWithValue }) => {
  try {
    console.log('[AdminSlice] Creating athlete:', data.email);
    const result = await createAthleteAccount(data);
    return {
      ...result,
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
    };
  } catch (error) {
    console.error('[AdminSlice] Create athlete error:', error);
    if (error instanceof AdminError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to create athlete account');
  }
});

/**
 * Fetch all athletes with optional filters
 */
export const fetchAthletesAsync = createAsyncThunk<
  AthleteWithUser[],
  ListAthletesFilters | undefined,
  { rejectValue: string; state: { admin: AdminState } }
>('admin/fetchAthletes', async (filters, { rejectWithValue, getState }) => {
  try {
    // Use provided filters or get from state
    const state = getState();
    const effectiveFilters = filters || buildFiltersFromState(state.admin.filters);

    console.log('[AdminSlice] Fetching athletes with filters:', effectiveFilters);
    const athletes = await listAthletes(effectiveFilters);
    return athletes;
  } catch (error) {
    console.error('[AdminSlice] Fetch athletes error:', error);
    if (error instanceof AdminError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to fetch athletes');
  }
});

/**
 * Fetch athlete details
 */
export const fetchAthleteDetailsAsync = createAsyncThunk<
  { user: UserDocument; athlete: AthleteDocument },
  string, // athleteId
  { rejectValue: string }
>('admin/fetchAthleteDetails', async (athleteId, { rejectWithValue }) => {
  try {
    console.log('[AdminSlice] Fetching athlete details:', athleteId);
    const details = await getAthleteDetails(athleteId);
    return details;
  } catch (error) {
    console.error('[AdminSlice] Fetch athlete details error:', error);
    if (error instanceof AdminError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to fetch athlete details');
  }
});

/**
 * Update athlete details
 */
export const updateAthleteAsync = createAsyncThunk<
  { athleteId: string; data: Partial<AthleteDocument> },
  { athleteId: string; data: Partial<AthleteDocument> },
  { rejectValue: string }
>('admin/updateAthlete', async ({ athleteId, data }, { rejectWithValue }) => {
  try {
    console.log('[AdminSlice] Updating athlete:', athleteId);
    await updateAthleteDetails(athleteId, data);
    return { athleteId, data };
  } catch (error) {
    console.error('[AdminSlice] Update athlete error:', error);
    if (error instanceof AdminError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to update athlete');
  }
});

/**
 * Deactivate athlete account
 */
export const deactivateAthleteAsync = createAsyncThunk<
  string, // athleteId
  string, // athleteId
  { rejectValue: string }
>('admin/deactivateAthlete', async (athleteId, { rejectWithValue }) => {
  try {
    console.log('[AdminSlice] Deactivating athlete:', athleteId);
    await deactivateAthlete(athleteId);
    return athleteId;
  } catch (error) {
    console.error('[AdminSlice] Deactivate athlete error:', error);
    if (error instanceof AdminError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to deactivate athlete');
  }
});

/**
 * Reactivate athlete account
 */
export const reactivateAthleteAsync = createAsyncThunk<
  string, // athleteId
  string, // athleteId
  { rejectValue: string }
>('admin/reactivateAthlete', async (athleteId, { rejectWithValue }) => {
  try {
    console.log('[AdminSlice] Reactivating athlete:', athleteId);
    await reactivateAthlete(athleteId);
    return athleteId;
  } catch (error) {
    console.error('[AdminSlice] Reactivate athlete error:', error);
    if (error instanceof AdminError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to reactivate athlete');
  }
});

/**
 * Reset athlete password
 */
export const resetPasswordAsync = createAsyncThunk<
  { athleteId: string; tempPassword: string },
  { athleteId: string; email: string },
  { rejectValue: string }
>('admin/resetPassword', async ({ athleteId, email }, { rejectWithValue }) => {
  try {
    console.log('[AdminSlice] Resetting password for:', athleteId);
    const tempPassword = await resetAthletePassword(athleteId, email);
    return { athleteId, tempPassword };
  } catch (error) {
    console.error('[AdminSlice] Reset password error:', error);
    if (error instanceof AdminError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to reset password');
  }
});

/**
 * Fetch athlete statistics
 */
export const fetchStatisticsAsync = createAsyncThunk<
  AthleteStatistics,
  void,
  { rejectValue: string }
>('admin/fetchStatistics', async (_, { rejectWithValue }) => {
  try {
    console.log('[AdminSlice] Fetching statistics');
    const stats = await getAthleteStatistics();
    return stats;
  } catch (error) {
    console.error('[AdminSlice] Fetch statistics error:', error);
    if (error instanceof AdminError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to fetch statistics');
  }
});

/**
 * Fetch recent athletes
 */
export const fetchRecentAthletesAsync = createAsyncThunk<
  AthleteWithUser[],
  number | undefined,
  { rejectValue: string }
>('admin/fetchRecentAthletes', async (limit = 5, { rejectWithValue }) => {
  try {
    console.log('[AdminSlice] Fetching recent athletes');
    const athletes = await getRecentAthletes(limit);
    return athletes;
  } catch (error) {
    console.error('[AdminSlice] Fetch recent athletes error:', error);
    if (error instanceof AdminError) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Failed to fetch recent athletes');
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build API filters from state filters
 */
const buildFiltersFromState = (stateFilters: AdminFilters): ListAthletesFilters => {
  const filters: ListAthletesFilters = {};

  if (stateFilters.sport) {
    filters.sport = stateFilters.sport;
  }
  if (stateFilters.residenceStatus) {
    filters.residenceStatus = stateFilters.residenceStatus as ResidenceStatus;
  }
  if (stateFilters.testingPoolStatus) {
    filters.testingPoolStatus = stateFilters.testingPoolStatus as TestingPoolStatus;
  }
  if (stateFilters.status) {
    filters.status = stateFilters.status as AthleteStatus;
  }
  if (stateFilters.searchQuery) {
    filters.searchQuery = stateFilters.searchQuery;
  }

  return filters;
};

// ============================================================================
// SLICE
// ============================================================================

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    /**
     * Set filter values
     */
    setFilters: (state, action: PayloadAction<Partial<AdminFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    /**
     * Clear all filters
     */
    clearFilters: (state) => {
      state.filters = initialFilters;
    },

    /**
     * Clear selected athlete
     */
    clearSelectedAthlete: (state) => {
      state.selectedAthlete = null;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Clear last created athlete info
     */
    clearLastCreatedAthlete: (state) => {
      state.lastCreatedAthlete = null;
    },

    /**
     * Reset admin state (on logout)
     */
    resetAdmin: () => initialState,
  },

  extraReducers: (builder) => {
    // ========================================
    // Create Athlete
    // ========================================
    builder
      .addCase(createAthleteAsync.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createAthleteAsync.fulfilled, (state, action) => {
        state.creating = false;
        state.lastCreatedAthlete = action.payload;
        // Note: We don't add to athletes array here because we don't have full data
        // The list should be refreshed after creation
      })
      .addCase(createAthleteAsync.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload || 'Failed to create athlete';
      });

    // ========================================
    // Fetch Athletes
    // ========================================
    builder
      .addCase(fetchAthletesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAthletesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.athletes = action.payload;
      })
      .addCase(fetchAthletesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch athletes';
      });

    // ========================================
    // Fetch Athlete Details
    // ========================================
    builder
      .addCase(fetchAthleteDetailsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAthleteDetailsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAthlete = action.payload;
      })
      .addCase(fetchAthleteDetailsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch athlete details';
      });

    // ========================================
    // Update Athlete
    // ========================================
    builder
      .addCase(updateAthleteAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAthleteAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { athleteId, data } = action.payload;

        // Update in athletes array
        const index = state.athletes.findIndex((a) => a.id === athleteId);
        if (index !== -1) {
          state.athletes[index].athlete = {
            ...state.athletes[index].athlete,
            ...data,
          };
        }

        // Update selected athlete if it's the same
        if (state.selectedAthlete && state.selectedAthlete.athlete.user_id === athleteId) {
          state.selectedAthlete.athlete = {
            ...state.selectedAthlete.athlete,
            ...data,
          };
        }
      })
      .addCase(updateAthleteAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update athlete';
      });

    // ========================================
    // Deactivate Athlete
    // ========================================
    builder
      .addCase(deactivateAthleteAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateAthleteAsync.fulfilled, (state, action) => {
        state.loading = false;
        const athleteId = action.payload;

        // Update in athletes array
        const index = state.athletes.findIndex((a) => a.id === athleteId);
        if (index !== -1) {
          state.athletes[index].athlete.status = 'inactive';
          state.athletes[index].user.is_active = false;
        }

        // Update selected athlete if it's the same
        if (state.selectedAthlete && state.selectedAthlete.athlete.user_id === athleteId) {
          state.selectedAthlete.athlete.status = 'inactive';
          state.selectedAthlete.user.is_active = false;
        }
      })
      .addCase(deactivateAthleteAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to deactivate athlete';
      });

    // ========================================
    // Reactivate Athlete
    // ========================================
    builder
      .addCase(reactivateAthleteAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reactivateAthleteAsync.fulfilled, (state, action) => {
        state.loading = false;
        const athleteId = action.payload;

        // Update in athletes array
        const index = state.athletes.findIndex((a) => a.id === athleteId);
        if (index !== -1) {
          state.athletes[index].athlete.status = 'active';
          state.athletes[index].user.is_active = true;
        }

        // Update selected athlete if it's the same
        if (state.selectedAthlete && state.selectedAthlete.athlete.user_id === athleteId) {
          state.selectedAthlete.athlete.status = 'active';
          state.selectedAthlete.user.is_active = true;
        }
      })
      .addCase(reactivateAthleteAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to reactivate athlete';
      });

    // ========================================
    // Reset Password
    // ========================================
    builder
      .addCase(resetPasswordAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPasswordAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Password reset successful - temp password returned in action.payload
        const athleteId = action.payload.athleteId;

        // Update requires_password_change in athletes array
        const index = state.athletes.findIndex((a) => a.id === athleteId);
        if (index !== -1) {
          state.athletes[index].user.requires_password_change = true;
        }

        // Update selected athlete if it's the same
        if (state.selectedAthlete && state.selectedAthlete.athlete.user_id === athleteId) {
          state.selectedAthlete.user.requires_password_change = true;
        }
      })
      .addCase(resetPasswordAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to reset password';
      });

    // ========================================
    // Fetch Statistics
    // ========================================
    builder
      .addCase(fetchStatisticsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatisticsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchStatisticsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch statistics';
      });

    // ========================================
    // Fetch Recent Athletes
    // ========================================
    builder
      .addCase(fetchRecentAthletesAsync.pending, (state) => {
        // Don't set loading for recent athletes to avoid UI flicker
        state.error = null;
      })
      .addCase(fetchRecentAthletesAsync.fulfilled, (state, action) => {
        state.recentAthletes = action.payload;
      })
      .addCase(fetchRecentAthletesAsync.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch recent athletes';
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setFilters,
  clearFilters,
  clearSelectedAthlete,
  clearError,
  clearLastCreatedAthlete,
  resetAdmin,
} = adminSlice.actions;

export default adminSlice.reducer;

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Select all athletes
 */
export const selectAllAthletes = (state: { admin: AdminState }) =>
  state.admin.athletes;

/**
 * Select filtered athletes based on current filters
 */
export const selectFilteredAthletes = (state: { admin: AdminState }) => {
  const { athletes, filters } = state.admin;

  return athletes.filter((athlete) => {
    // Sport filter
    if (filters.sport && athlete.athlete.sport_id !== filters.sport) {
      return false;
    }

    // Residence status filter
    if (filters.residenceStatus && athlete.athlete.residence_status !== filters.residenceStatus) {
      return false;
    }

    // Testing pool status filter
    if (filters.testingPoolStatus && athlete.athlete.testing_pool_status !== filters.testingPoolStatus) {
      return false;
    }

    // Status filter
    if (filters.status && athlete.athlete.status !== filters.status) {
      return false;
    }

    // Search query filter
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      const fullName = `${athlete.athlete.first_name} ${athlete.athlete.last_name}`.toLowerCase();
      const email = athlete.user.email.toLowerCase();

      if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Select active athletes only
 */
export const selectActiveAthletes = (state: { admin: AdminState }) =>
  state.admin.athletes.filter((a) => a.athlete.status === 'active');

/**
 * Select inactive athletes only
 */
export const selectInactiveAthletes = (state: { admin: AdminState }) =>
  state.admin.athletes.filter((a) => a.athlete.status === 'inactive');

/**
 * Select athletes by sport
 */
export const selectAthletesBySport = (sport: string) => (state: { admin: AdminState }) =>
  state.admin.athletes.filter((a) => a.athlete.sport_id === sport);

/**
 * Select selected athlete
 */
export const selectSelectedAthlete = (state: { admin: AdminState }) =>
  state.admin.selectedAthlete;

/**
 * Select recent athletes
 */
export const selectRecentAthletes = (state: { admin: AdminState }) =>
  state.admin.recentAthletes;

/**
 * Select statistics
 */
export const selectStatistics = (state: { admin: AdminState }) =>
  state.admin.statistics;

/**
 * Select loading state
 */
export const selectAdminLoading = (state: { admin: AdminState }) =>
  state.admin.loading;

/**
 * Select creating state
 */
export const selectAdminCreating = (state: { admin: AdminState }) =>
  state.admin.creating;

/**
 * Select error
 */
export const selectAdminError = (state: { admin: AdminState }) =>
  state.admin.error;

/**
 * Select filters
 */
export const selectAdminFilters = (state: { admin: AdminState }) =>
  state.admin.filters;

/**
 * Select last created athlete info
 */
export const selectLastCreatedAthlete = (state: { admin: AdminState }) =>
  state.admin.lastCreatedAthlete;

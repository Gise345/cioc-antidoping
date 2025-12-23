/**
 * Whereabouts Slice
 * Redux state management for whereabouts quarters, daily slots, and templates
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  WhereaboutsQuarterDocument,
  DailySlotDocument,
  WeeklyTemplateDocument,
  CreateWeeklyTemplateDocument,
  QuarterName,
  QuarterStatus,
} from '../../types/firestore';
import {
  getAthleteQuarters,
  getQuarter,
  getCurrentQuarter,
  createQuarter,
  updateQuarter,
  submitQuarter,
  copyQuarter,
  getQuarterSlots,
  getSlotByDate,
  upsertDailySlot,
  bulkUpsertSlots,
  updateSlot,
  getAthleteTemplates,
  saveTemplate,
  applyTemplate,
  deleteTemplate,
  calculateQuarterDates,
  getCurrentQuarterInfo,
  calculateDaysUntilDeadline,
  findMissingDates,
  calculateCompletionPercentage,
  CreateQuarterData,
  CreateSlotData,
  UpdateSlotData,
  WhereaboutsServiceError,
  // Pattern-based operations
  createQuarterWithPattern,
  applyPatternToExistingQuarter,
  extractPatternFromQuarter,
  copyQuarterPattern,
  WeeklyPattern as APIWeeklyPattern,
  DailySlotSelection,
} from '../../api/whereabouts';
import { WeeklyPattern, Competition } from '../../types';

// ============================================================================
// STATE TYPES
// ============================================================================

export interface QuarterWithId extends WhereaboutsQuarterDocument {
  id: string;
}

export interface SlotWithId extends DailySlotDocument {
  id: string;
}

export interface TemplateWithId extends WeeklyTemplateDocument {
  id: string;
}

export interface WhereaboutsState {
  // Quarters
  quarters: QuarterWithId[];
  currentQuarter: QuarterWithId | null;

  // Daily slots - keyed by date string for quick lookup
  dailySlots: Record<string, SlotWithId>;
  currentQuarterSlots: SlotWithId[];

  // Templates
  templates: TemplateWithId[];
  defaultTemplate: TemplateWithId | null;

  // Pattern Builder State
  currentPattern: WeeklyPattern | null;
  isCreatingQuarter: boolean;
  creationProgress: number; // 0-100 for progress indicator
  creationStep: 'idle' | 'creating_quarter' | 'generating_slots' | 'saving_slots' | 'complete' | 'error';

  // Compliance info
  daysUntilDeadline: number;
  missingDates: string[];

  // Loading states
  loading: boolean;
  quartersLoading: boolean;
  slotsLoading: boolean;
  templatesLoading: boolean;
  saving: boolean;
  submitting: boolean;

  // Error state
  error: WhereaboutsServiceError | null;

  // Sync state
  lastSyncAt: string | null;
  pendingChanges: number;
}

const initialState: WhereaboutsState = {
  quarters: [],
  currentQuarter: null,
  dailySlots: {},
  currentQuarterSlots: [],
  templates: [],
  defaultTemplate: null,
  currentPattern: null,
  isCreatingQuarter: false,
  creationProgress: 0,
  creationStep: 'idle',
  daysUntilDeadline: 0,
  missingDates: [],
  loading: false,
  quartersLoading: false,
  slotsLoading: false,
  templatesLoading: false,
  saving: false,
  submitting: false,
  error: null,
  lastSyncAt: null,
  pendingChanges: 0,
};

// ============================================================================
// ASYNC THUNKS - QUARTERS
// ============================================================================

/**
 * Fetch all quarters for an athlete
 */
export const fetchQuartersAsync = createAsyncThunk<
  QuarterWithId[],
  string, // athleteId
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/fetchQuarters', async (athleteId, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Fetching quarters for:', athleteId);
    const result = await getAthleteQuarters(athleteId);

    if (!result.success || !result.quarters) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to fetch quarters' }
      );
    }

    return result.quarters;
  } catch (error) {
    console.error('[WhereaboutsSlice] Fetch quarters error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Fetch a specific quarter
 */
export const fetchQuarterAsync = createAsyncThunk<
  QuarterWithId,
  string, // quarterId
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/fetchQuarter', async (quarterId, { rejectWithValue }) => {
  try {
    const result = await getQuarter(quarterId);

    if (!result.success || !result.quarter) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to fetch quarter' }
      );
    }

    return result.quarter;
  } catch (error) {
    console.error('[WhereaboutsSlice] Fetch quarter error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Fetch current quarter for athlete
 */
export const fetchCurrentQuarterAsync = createAsyncThunk<
  QuarterWithId | null,
  string, // athleteId
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/fetchCurrentQuarter', async (athleteId, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Fetching current quarter');
    const result = await getCurrentQuarter(athleteId);

    if (!result.success) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to fetch current quarter' }
      );
    }

    return result.quarter || null;
  } catch (error) {
    console.error('[WhereaboutsSlice] Fetch current quarter error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Create a new quarter
 */
export const createQuarterAsync = createAsyncThunk<
  QuarterWithId,
  CreateQuarterData,
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/createQuarter', async (data, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Creating quarter:', data.year, data.quarter);
    const result = await createQuarter(data);

    if (!result.success || !result.quarter) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to create quarter' }
      );
    }

    return result.quarter;
  } catch (error) {
    console.error('[WhereaboutsSlice] Create quarter error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Update a quarter
 */
export const updateQuarterAsync = createAsyncThunk<
  QuarterWithId,
  { quarterId: string; data: Partial<WhereaboutsQuarterDocument> },
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/updateQuarter', async ({ quarterId, data }, { rejectWithValue }) => {
  try {
    const result = await updateQuarter(quarterId, data);

    if (!result.success || !result.quarter) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to update quarter' }
      );
    }

    return result.quarter;
  } catch (error) {
    console.error('[WhereaboutsSlice] Update quarter error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Submit quarter for compliance
 */
export const submitQuarterAsync = createAsyncThunk<
  QuarterWithId,
  string, // quarterId
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/submitQuarter', async (quarterId, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Submitting quarter:', quarterId);
    const result = await submitQuarter(quarterId);

    if (!result.success || !result.quarter) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to submit quarter' }
      );
    }

    return result.quarter;
  } catch (error) {
    console.error('[WhereaboutsSlice] Submit quarter error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Copy quarter from previous
 */
export const copyQuarterAsync = createAsyncThunk<
  QuarterWithId,
  {
    sourceQuarterId: string;
    targetYear: number;
    targetQuarter: QuarterName;
    athleteId: string;
  },
  { rejectValue: WhereaboutsServiceError }
>(
  'whereabouts/copyQuarter',
  async ({ sourceQuarterId, targetYear, targetQuarter, athleteId }, { rejectWithValue }) => {
    try {
      console.log('[WhereaboutsSlice] Copying quarter from:', sourceQuarterId);
      const result = await copyQuarter(sourceQuarterId, targetYear, targetQuarter, athleteId);

      if (!result.success || !result.quarter) {
        return rejectWithValue(
          result.error || { code: 'unknown', message: 'Failed to copy quarter' }
        );
      }

      return result.quarter;
    } catch (error) {
      console.error('[WhereaboutsSlice] Copy quarter error:', error);
      return rejectWithValue({
        code: 'unknown',
        message: 'An unexpected error occurred',
      });
    }
  }
);

// ============================================================================
// ASYNC THUNKS - DAILY SLOTS
// ============================================================================

/**
 * Fetch slots for a quarter
 */
export const fetchDailySlotsAsync = createAsyncThunk<
  SlotWithId[],
  string, // quarterId
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/fetchDailySlots', async (quarterId, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Fetching slots for quarter:', quarterId);
    const result = await getQuarterSlots(quarterId);

    if (!result.success || !result.slots) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to fetch slots' }
      );
    }

    return result.slots;
  } catch (error) {
    console.error('[WhereaboutsSlice] Fetch slots error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Upsert a daily slot
 */
export const upsertDailySlotAsync = createAsyncThunk<
  SlotWithId,
  { quarterId: string; slotData: CreateSlotData },
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/upsertDailySlot', async ({ quarterId, slotData }, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Upserting slot:', slotData.date);
    const result = await upsertDailySlot(quarterId, slotData);

    if (!result.success || !result.slot) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to save slot' }
      );
    }

    return result.slot;
  } catch (error) {
    console.error('[WhereaboutsSlice] Upsert slot error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Bulk upsert slots
 */
export const bulkUpsertSlotsAsync = createAsyncThunk<
  SlotWithId[],
  { quarterId: string; slots: CreateSlotData[] },
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/bulkUpsertSlots', async ({ quarterId, slots }, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Bulk upserting', slots.length, 'slots');
    const result = await bulkUpsertSlots(quarterId, slots);

    if (!result.success) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to bulk save slots' }
      );
    }

    return result.slots || [];
  } catch (error) {
    console.error('[WhereaboutsSlice] Bulk upsert error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Update a single slot
 */
export const updateSlotAsync = createAsyncThunk<
  SlotWithId,
  { slotId: string; data: UpdateSlotData },
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/updateSlot', async ({ slotId, data }, { rejectWithValue }) => {
  try {
    const result = await updateSlot(slotId, data);

    if (!result.success || !result.slot) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to update slot' }
      );
    }

    return result.slot;
  } catch (error) {
    console.error('[WhereaboutsSlice] Update slot error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

// ============================================================================
// ASYNC THUNKS - TEMPLATES
// ============================================================================

/**
 * Fetch templates for an athlete
 */
export const fetchTemplatesAsync = createAsyncThunk<
  TemplateWithId[],
  string, // athleteId
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/fetchTemplates', async (athleteId, { rejectWithValue }) => {
  try {
    const result = await getAthleteTemplates(athleteId);

    if (!result.success || !result.templates) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to fetch templates' }
      );
    }

    return result.templates;
  } catch (error) {
    console.error('[WhereaboutsSlice] Fetch templates error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Save a new template
 */
export const saveTemplateAsync = createAsyncThunk<
  TemplateWithId,
  CreateWeeklyTemplateDocument,
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/saveTemplate', async (data, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Saving template:', data.name);
    const result = await saveTemplate(data);

    if (!result.success || !result.template) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to save template' }
      );
    }

    return result.template;
  } catch (error) {
    console.error('[WhereaboutsSlice] Save template error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Apply template to quarter
 */
export const applyTemplateAsync = createAsyncThunk<
  void,
  { quarterId: string; templateId: string; athleteId: string },
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/applyTemplate', async ({ quarterId, templateId, athleteId }, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Applying template:', templateId);
    const result = await applyTemplate(quarterId, templateId, athleteId);

    if (!result.success) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to apply template' }
      );
    }
  } catch (error) {
    console.error('[WhereaboutsSlice] Apply template error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Delete a template
 */
export const deleteTemplateAsync = createAsyncThunk<
  string,
  string, // templateId
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/deleteTemplate', async (templateId, { rejectWithValue }) => {
  try {
    const result = await deleteTemplate(templateId);

    if (!result.success) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to delete template' }
      );
    }

    return templateId;
  } catch (error) {
    console.error('[WhereaboutsSlice] Delete template error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

// ============================================================================
// ASYNC THUNKS - PATTERN-BASED OPERATIONS
// ============================================================================

/**
 * Create a quarter with a weekly pattern
 * This is the main entry point for the quarter creation wizard
 */
export const createQuarterWithPatternAsync = createAsyncThunk<
  { quarter: QuarterWithId; slotsCreated: number },
  {
    athleteId: string;
    year: number;
    quarter: QuarterName;
    pattern: WeeklyPattern;
    competitions?: Competition[];
  },
  { rejectValue: WhereaboutsServiceError }
>(
  'whereabouts/createQuarterWithPattern',
  async ({ athleteId, year, quarter, pattern, competitions = [] }, { rejectWithValue, dispatch }) => {
    try {
      console.log('[WhereaboutsSlice] Creating quarter with pattern:', year, quarter);

      // Convert competitions to the format expected by the API
      const apiCompetitions = competitions.map((comp) => ({
        id: comp.id,
        name: comp.name,
        start_date: comp.start_date,
        end_date: comp.end_date,
        location_address: comp.location_address || '',
      }));

      const result = await createQuarterWithPattern(
        athleteId,
        year,
        quarter,
        pattern as APIWeeklyPattern,
        apiCompetitions
      );

      if (!result.success || !result.quarter) {
        return rejectWithValue(
          result.error || { code: 'unknown', message: 'Failed to create quarter with pattern' }
        );
      }

      return {
        quarter: result.quarter,
        slotsCreated: result.slotsCreated || 0,
      };
    } catch (error) {
      console.error('[WhereaboutsSlice] Create quarter with pattern error:', error);
      return rejectWithValue({
        code: 'unknown',
        message: 'An unexpected error occurred',
      });
    }
  }
);

/**
 * Apply a pattern to an existing quarter
 */
export const applyPatternToQuarterAsync = createAsyncThunk<
  { slotsCreated: number; slotsUpdated: number },
  {
    quarterId: string;
    athleteId: string;
    pattern: WeeklyPattern;
    overwriteExisting?: boolean;
  },
  { rejectValue: WhereaboutsServiceError }
>(
  'whereabouts/applyPatternToQuarter',
  async ({ quarterId, athleteId, pattern, overwriteExisting = false }, { rejectWithValue }) => {
    try {
      console.log('[WhereaboutsSlice] Applying pattern to quarter:', quarterId);

      const result = await applyPatternToExistingQuarter(
        quarterId,
        athleteId,
        pattern as APIWeeklyPattern,
        overwriteExisting
      );

      if (!result.success) {
        return rejectWithValue(
          result.error || { code: 'unknown', message: 'Failed to apply pattern' }
        );
      }

      return {
        slotsCreated: result.slotsCreated,
        slotsUpdated: result.slotsUpdated,
      };
    } catch (error) {
      console.error('[WhereaboutsSlice] Apply pattern error:', error);
      return rejectWithValue({
        code: 'unknown',
        message: 'An unexpected error occurred',
      });
    }
  }
);

/**
 * Extract pattern from an existing quarter
 */
export const extractPatternAsync = createAsyncThunk<
  WeeklyPattern,
  string, // quarterId
  { rejectValue: WhereaboutsServiceError }
>('whereabouts/extractPattern', async (quarterId, { rejectWithValue }) => {
  try {
    console.log('[WhereaboutsSlice] Extracting pattern from quarter:', quarterId);

    const result = await extractPatternFromQuarter(quarterId);

    if (!result.success || !result.pattern) {
      return rejectWithValue(
        result.error || { code: 'unknown', message: 'Failed to extract pattern' }
      );
    }

    return result.pattern as WeeklyPattern;
  } catch (error) {
    console.error('[WhereaboutsSlice] Extract pattern error:', error);
    return rejectWithValue({
      code: 'unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Copy pattern from one quarter to create a new quarter
 */
export const copyQuarterPatternAsync = createAsyncThunk<
  { quarter: QuarterWithId; slotsCreated: number },
  {
    sourceQuarterId: string;
    targetYear: number;
    targetQuarter: QuarterName;
    athleteId: string;
  },
  { rejectValue: WhereaboutsServiceError }
>(
  'whereabouts/copyQuarterPattern',
  async ({ sourceQuarterId, targetYear, targetQuarter, athleteId }, { rejectWithValue }) => {
    try {
      console.log('[WhereaboutsSlice] Copying pattern from:', sourceQuarterId);

      const result = await copyQuarterPattern(
        sourceQuarterId,
        targetYear,
        targetQuarter,
        athleteId
      );

      if (!result.success || !result.quarter) {
        return rejectWithValue(
          result.error || { code: 'unknown', message: 'Failed to copy quarter pattern' }
        );
      }

      return {
        quarter: result.quarter,
        slotsCreated: result.slotsCreated || 0,
      };
    } catch (error) {
      console.error('[WhereaboutsSlice] Copy quarter pattern error:', error);
      return rejectWithValue({
        code: 'unknown',
        message: 'An unexpected error occurred',
      });
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const whereaboutsSlice = createSlice({
  name: 'whereabouts',
  initialState,
  reducers: {
    /**
     * Set quarters list
     */
    setQuarters: (state, action: PayloadAction<QuarterWithId[]>) => {
      state.quarters = action.payload;
    },

    /**
     * Set current quarter
     */
    setCurrentQuarter: (state, action: PayloadAction<QuarterWithId | null>) => {
      state.currentQuarter = action.payload;
      if (action.payload) {
        state.daysUntilDeadline = calculateDaysUntilDeadline(
          action.payload.filing_deadline
        );
      }
    },

    /**
     * Update a single daily slot (optimistic)
     */
    updateDailySlot: (state, action: PayloadAction<SlotWithId>) => {
      state.dailySlots[action.payload.date] = action.payload;
      const index = state.currentQuarterSlots.findIndex(
        (s) => s.date === action.payload.date
      );
      if (index !== -1) {
        state.currentQuarterSlots[index] = action.payload;
      } else {
        state.currentQuarterSlots.push(action.payload);
      }
      state.pendingChanges += 1;
    },

    /**
     * Set templates
     */
    setTemplates: (state, action: PayloadAction<TemplateWithId[]>) => {
      state.templates = action.payload;
      state.defaultTemplate = action.payload.find((t) => t.is_default) || null;
    },

    /**
     * Update missing dates calculation
     */
    updateMissingDates: (state) => {
      if (state.currentQuarter) {
        const filledDates = Object.keys(state.dailySlots);
        state.missingDates = findMissingDates(
          filledDates,
          state.currentQuarter.year,
          state.currentQuarter.quarter
        );
      }
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Set current pattern (for pattern builder)
     */
    setCurrentPattern: (state, action: PayloadAction<WeeklyPattern | null>) => {
      state.currentPattern = action.payload;
    },

    /**
     * Update creation progress
     */
    setCreationProgress: (state, action: PayloadAction<number>) => {
      state.creationProgress = Math.min(100, Math.max(0, action.payload));
    },

    /**
     * Update creation step
     */
    setCreationStep: (
      state,
      action: PayloadAction<WhereaboutsState['creationStep']>
    ) => {
      state.creationStep = action.payload;
    },

    /**
     * Reset creation state (after success or error)
     */
    resetCreationState: (state) => {
      state.isCreatingQuarter = false;
      state.creationProgress = 0;
      state.creationStep = 'idle';
    },

    /**
     * Reset state (on logout)
     */
    resetWhereabouts: () => initialState,
  },

  extraReducers: (builder) => {
    // Fetch Quarters
    builder
      .addCase(fetchQuartersAsync.pending, (state) => {
        state.quartersLoading = true;
        state.error = null;
      })
      .addCase(fetchQuartersAsync.fulfilled, (state, action) => {
        state.quartersLoading = false;
        state.quarters = action.payload;
        state.lastSyncAt = new Date().toISOString();
      })
      .addCase(fetchQuartersAsync.rejected, (state, action) => {
        state.quartersLoading = false;
        state.error = action.payload || null;
      });

    // Fetch Quarter
    builder
      .addCase(fetchQuarterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuarterAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuarter = action.payload;
        state.daysUntilDeadline = calculateDaysUntilDeadline(
          action.payload.filing_deadline
        );
        // Update in quarters list
        const index = state.quarters.findIndex((q) => q.id === action.payload.id);
        if (index !== -1) {
          state.quarters[index] = action.payload;
        }
      })
      .addCase(fetchQuarterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      });

    // Fetch Current Quarter
    builder
      .addCase(fetchCurrentQuarterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentQuarterAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuarter = action.payload;
        if (action.payload) {
          state.daysUntilDeadline = calculateDaysUntilDeadline(
            action.payload.filing_deadline
          );
        }
      })
      .addCase(fetchCurrentQuarterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      });

    // Create Quarter
    builder
      .addCase(createQuarterAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createQuarterAsync.fulfilled, (state, action) => {
        state.saving = false;
        state.quarters.unshift(action.payload);
        state.currentQuarter = action.payload;
        state.daysUntilDeadline = calculateDaysUntilDeadline(
          action.payload.filing_deadline
        );
      })
      .addCase(createQuarterAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || null;
      });

    // Update Quarter
    builder
      .addCase(updateQuarterAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateQuarterAsync.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.quarters.findIndex((q) => q.id === action.payload.id);
        if (index !== -1) {
          state.quarters[index] = action.payload;
        }
        if (state.currentQuarter?.id === action.payload.id) {
          state.currentQuarter = action.payload;
        }
      })
      .addCase(updateQuarterAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || null;
      });

    // Submit Quarter
    builder
      .addCase(submitQuarterAsync.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitQuarterAsync.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.quarters.findIndex((q) => q.id === action.payload.id);
        if (index !== -1) {
          state.quarters[index] = action.payload;
        }
        if (state.currentQuarter?.id === action.payload.id) {
          state.currentQuarter = action.payload;
        }
      })
      .addCase(submitQuarterAsync.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || null;
      });

    // Copy Quarter
    builder
      .addCase(copyQuarterAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(copyQuarterAsync.fulfilled, (state, action) => {
        state.saving = false;
        state.quarters.unshift(action.payload);
        state.currentQuarter = action.payload;
      })
      .addCase(copyQuarterAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || null;
      });

    // Fetch Daily Slots
    builder
      .addCase(fetchDailySlotsAsync.pending, (state) => {
        state.slotsLoading = true;
        state.error = null;
      })
      .addCase(fetchDailySlotsAsync.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.currentQuarterSlots = action.payload;
        // Index by date for quick lookup
        state.dailySlots = {};
        action.payload.forEach((slot) => {
          state.dailySlots[slot.date] = slot;
        });
        // Update missing dates
        if (state.currentQuarter) {
          const filledDates = action.payload.map((s) => s.date);
          state.missingDates = findMissingDates(
            filledDates,
            state.currentQuarter.year,
            state.currentQuarter.quarter
          );
        }
      })
      .addCase(fetchDailySlotsAsync.rejected, (state, action) => {
        state.slotsLoading = false;
        state.error = action.payload || null;
      });

    // Upsert Daily Slot
    builder
      .addCase(upsertDailySlotAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(upsertDailySlotAsync.fulfilled, (state, action) => {
        state.saving = false;
        state.dailySlots[action.payload.date] = action.payload;
        const index = state.currentQuarterSlots.findIndex(
          (s) => s.date === action.payload.date
        );
        if (index !== -1) {
          state.currentQuarterSlots[index] = action.payload;
        } else {
          state.currentQuarterSlots.push(action.payload);
        }
        // Update missing dates
        if (state.currentQuarter) {
          const filledDates = Object.keys(state.dailySlots);
          state.missingDates = findMissingDates(
            filledDates,
            state.currentQuarter.year,
            state.currentQuarter.quarter
          );
        }
      })
      .addCase(upsertDailySlotAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || null;
      });

    // Bulk Upsert Slots
    builder
      .addCase(bulkUpsertSlotsAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(bulkUpsertSlotsAsync.fulfilled, (state) => {
        state.saving = false;
        // Slots need to be refetched after bulk operation
      })
      .addCase(bulkUpsertSlotsAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || null;
      });

    // Update Slot
    builder
      .addCase(updateSlotAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateSlotAsync.fulfilled, (state, action) => {
        state.saving = false;
        state.dailySlots[action.payload.date] = action.payload;
        const index = state.currentQuarterSlots.findIndex(
          (s) => s.id === action.payload.id
        );
        if (index !== -1) {
          state.currentQuarterSlots[index] = action.payload;
        }
      })
      .addCase(updateSlotAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || null;
      });

    // Fetch Templates
    builder
      .addCase(fetchTemplatesAsync.pending, (state) => {
        state.templatesLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplatesAsync.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload;
        state.defaultTemplate = action.payload.find((t) => t.is_default) || null;
      })
      .addCase(fetchTemplatesAsync.rejected, (state, action) => {
        state.templatesLoading = false;
        state.error = action.payload || null;
      });

    // Save Template
    builder
      .addCase(saveTemplateAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveTemplateAsync.fulfilled, (state, action) => {
        state.saving = false;
        state.templates.push(action.payload);
        if (action.payload.is_default) {
          // Update default template
          state.templates.forEach((t) => {
            if (t.id !== action.payload.id) {
              t.is_default = false;
            }
          });
          state.defaultTemplate = action.payload;
        }
      })
      .addCase(saveTemplateAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || null;
      });

    // Apply Template
    builder
      .addCase(applyTemplateAsync.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(applyTemplateAsync.fulfilled, (state) => {
        state.saving = false;
        // Slots need to be refetched after applying template
      })
      .addCase(applyTemplateAsync.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || null;
      });

    // Delete Template
    builder
      .addCase(deleteTemplateAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTemplateAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = state.templates.filter((t) => t.id !== action.payload);
        if (state.defaultTemplate?.id === action.payload) {
          state.defaultTemplate = null;
        }
      })
      .addCase(deleteTemplateAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      });

    // ========================================================================
    // PATTERN-BASED OPERATIONS
    // ========================================================================

    // Create Quarter With Pattern
    builder
      .addCase(createQuarterWithPatternAsync.pending, (state) => {
        state.isCreatingQuarter = true;
        state.creationProgress = 10;
        state.creationStep = 'creating_quarter';
        state.error = null;
      })
      .addCase(createQuarterWithPatternAsync.fulfilled, (state, action) => {
        state.isCreatingQuarter = false;
        state.creationProgress = 100;
        state.creationStep = 'complete';
        state.quarters.unshift(action.payload.quarter);
        state.currentQuarter = action.payload.quarter;
        state.daysUntilDeadline = calculateDaysUntilDeadline(
          action.payload.quarter.filing_deadline
        );
        state.lastSyncAt = new Date().toISOString();
      })
      .addCase(createQuarterWithPatternAsync.rejected, (state, action) => {
        state.isCreatingQuarter = false;
        state.creationProgress = 0;
        state.creationStep = 'error';
        state.error = action.payload || null;
      });

    // Apply Pattern To Existing Quarter
    builder
      .addCase(applyPatternToQuarterAsync.pending, (state) => {
        state.saving = true;
        state.creationProgress = 20;
        state.creationStep = 'generating_slots';
        state.error = null;
      })
      .addCase(applyPatternToQuarterAsync.fulfilled, (state) => {
        state.saving = false;
        state.creationProgress = 100;
        state.creationStep = 'complete';
        // Slots need to be refetched after applying pattern
      })
      .addCase(applyPatternToQuarterAsync.rejected, (state, action) => {
        state.saving = false;
        state.creationProgress = 0;
        state.creationStep = 'error';
        state.error = action.payload || null;
      });

    // Extract Pattern From Quarter
    builder
      .addCase(extractPatternAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(extractPatternAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPattern = action.payload;
      })
      .addCase(extractPatternAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      });

    // Copy Quarter Pattern
    builder
      .addCase(copyQuarterPatternAsync.pending, (state) => {
        state.isCreatingQuarter = true;
        state.creationProgress = 10;
        state.creationStep = 'creating_quarter';
        state.error = null;
      })
      .addCase(copyQuarterPatternAsync.fulfilled, (state, action) => {
        state.isCreatingQuarter = false;
        state.creationProgress = 100;
        state.creationStep = 'complete';
        state.quarters.unshift(action.payload.quarter);
        state.currentQuarter = action.payload.quarter;
        state.daysUntilDeadline = calculateDaysUntilDeadline(
          action.payload.quarter.filing_deadline
        );
        state.lastSyncAt = new Date().toISOString();
      })
      .addCase(copyQuarterPatternAsync.rejected, (state, action) => {
        state.isCreatingQuarter = false;
        state.creationProgress = 0;
        state.creationStep = 'error';
        state.error = action.payload || null;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  setQuarters,
  setCurrentQuarter,
  updateDailySlot,
  setTemplates,
  updateMissingDates,
  clearError,
  setCurrentPattern,
  setCreationProgress,
  setCreationStep,
  resetCreationState,
  resetWhereabouts,
} = whereaboutsSlice.actions;

export default whereaboutsSlice.reducer;

// ============================================================================
// SELECTORS
// ============================================================================

export const selectWhereabouts = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts;

export const selectQuarters = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.quarters;

export const selectCurrentQuarter = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.currentQuarter;

export const selectDailySlots = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.dailySlots;

export const selectCurrentQuarterSlots = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.currentQuarterSlots;

export const selectTemplates = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.templates;

export const selectDefaultTemplate = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.defaultTemplate;

export const selectDaysUntilDeadline = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.daysUntilDeadline;

export const selectMissingDates = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.missingDates;

export const selectWhereaboutsLoading = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.loading || state.whereabouts.quartersLoading;

export const selectSlotsLoading = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.slotsLoading;

export const selectWhereaboutsSaving = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.saving;

export const selectWhereaboutsSubmitting = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.submitting;

export const selectWhereaboutsError = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.error;

export const selectQuarterById =
  (id: string) => (state: { whereabouts: WhereaboutsState }) =>
    state.whereabouts.quarters.find((q) => q.id === id);

export const selectSlotByDate =
  (date: string) => (state: { whereabouts: WhereaboutsState }) =>
    state.whereabouts.dailySlots[date];

export const selectQuarterCompletionPercentage =
  (quarterId: string) => (state: { whereabouts: WhereaboutsState }) => {
    const quarter = state.whereabouts.quarters.find((q) => q.id === quarterId);
    return quarter?.completion_percentage || 0;
  };

export const selectUpcomingDeadline = (state: { whereabouts: WhereaboutsState }) => {
  const { currentQuarter, daysUntilDeadline } = state.whereabouts;
  if (!currentQuarter) return null;

  return {
    deadline: currentQuarter.filing_deadline,
    daysLeft: daysUntilDeadline,
    isUrgent: daysUntilDeadline <= 7,
    isCritical: daysUntilDeadline <= 3,
  };
};

export const selectQuartersByStatus =
  (status: QuarterStatus) => (state: { whereabouts: WhereaboutsState }) =>
    state.whereabouts.quarters.filter((q) => q.status === status);

export const selectActiveQuarters = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.quarters.filter(
    (q) => q.status === 'draft' || q.status === 'incomplete'
  );

export const selectSubmittedQuarters = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.quarters.filter(
    (q) => q.status === 'submitted' || q.status === 'complete'
  );

// ============================================================================
// PATTERN-BASED SELECTORS
// ============================================================================

export const selectCurrentPattern = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.currentPattern;

export const selectIsCreatingQuarter = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.isCreatingQuarter;

export const selectCreationProgress = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.creationProgress;

export const selectCreationStep = (state: { whereabouts: WhereaboutsState }) =>
  state.whereabouts.creationStep;

/**
 * Helper to convert DayScheduleDocument to DaySlotPattern
 */
const convertDayScheduleToPattern = (
  schedule: { slot_60min: { start_time: string; end_time: string; location_id: string } },
  locationId: string
): { location_type: 'home' | 'training' | 'gym'; time_start: string; time_end: string } => {
  // Extract location type from location_id if it follows the pattern "type:userId"
  let locationType: 'home' | 'training' | 'gym' = 'home';
  if (locationId.startsWith('home')) locationType = 'home';
  else if (locationId.startsWith('training')) locationType = 'training';
  else if (locationId.startsWith('gym')) locationType = 'gym';

  return {
    location_type: locationType,
    time_start: schedule.slot_60min.start_time,
    time_end: schedule.slot_60min.end_time,
  };
};

/**
 * Select templates formatted for the TemplateSelector component
 * Converts TemplateWithId to SavedTemplate format
 */
export const selectSavedTemplates = (state: { whereabouts: WhereaboutsState }) => {
  return state.whereabouts.templates.map((template) => {
    // Convert day schedules to WeeklyPattern format
    const pattern: WeeklyPattern = {
      monday: convertDayScheduleToPattern(template.monday, template.monday.slot_60min.location_id),
      tuesday: convertDayScheduleToPattern(template.tuesday, template.tuesday.slot_60min.location_id),
      wednesday: convertDayScheduleToPattern(template.wednesday, template.wednesday.slot_60min.location_id),
      thursday: convertDayScheduleToPattern(template.thursday, template.thursday.slot_60min.location_id),
      friday: convertDayScheduleToPattern(template.friday, template.friday.slot_60min.location_id),
      saturday: convertDayScheduleToPattern(template.saturday, template.saturday.slot_60min.location_id),
      sunday: convertDayScheduleToPattern(template.sunday, template.sunday.slot_60min.location_id),
    };

    // Convert Firestore Timestamps to Dates
    const createdAt = template.created_at && typeof template.created_at === 'object' && 'toDate' in template.created_at
      ? (template.created_at as { toDate: () => Date }).toDate()
      : new Date();
    const updatedAt = template.updated_at && typeof template.updated_at === 'object' && 'toDate' in template.updated_at
      ? (template.updated_at as { toDate: () => Date }).toDate()
      : new Date();

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      pattern,
      usage_count: template.usage_count || 0,
      is_default: template.is_default || false,
      created_at: createdAt,
      updated_at: updatedAt,
    };
  });
};

/**
 * Select the most used template
 */
export const selectMostUsedTemplate = (state: { whereabouts: WhereaboutsState }) => {
  const templates = state.whereabouts.templates;
  if (templates.length === 0) return null;

  return templates.reduce((most, current) => {
    const mostUsage = most.usage_count || 0;
    const currentUsage = current.usage_count || 0;
    return currentUsage > mostUsage ? current : most;
  }, templates[0]);
};

/**
 * Select creation status with helpful metadata
 */
export const selectQuarterCreationStatus = (state: { whereabouts: WhereaboutsState }) => {
  const { isCreatingQuarter, creationProgress, creationStep, error } = state.whereabouts;

  const stepLabels: Record<WhereaboutsState['creationStep'], string> = {
    idle: 'Ready',
    creating_quarter: 'Creating quarter...',
    generating_slots: 'Generating daily slots...',
    saving_slots: 'Saving slots...',
    complete: 'Complete!',
    error: 'Error occurred',
  };

  return {
    isCreating: isCreatingQuarter,
    progress: creationProgress,
    step: creationStep,
    stepLabel: stepLabels[creationStep],
    hasError: creationStep === 'error',
    error: error,
    isComplete: creationStep === 'complete',
  };
};

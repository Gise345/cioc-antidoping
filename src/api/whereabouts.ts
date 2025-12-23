/**
 * Whereabouts Service
 * Firestore operations for whereabouts quarters, daily slots, and templates
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import {
  WhereaboutsQuarterDocument,
  DailySlotDocument,
  WeeklyTemplateDocument,
  CreateQuarterDocument,
  CreateDailySlotDocument,
  CreateWeeklyTemplateDocument,
  TimeSlotDocument,
  QuarterName,
  QuarterStatus,
  COLLECTIONS,
} from '../types/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface WhereaboutsServiceError {
  code: string;
  message: string;
  originalError?: unknown;
}

export interface QuarterResult {
  success: boolean;
  quarter?: WhereaboutsQuarterDocument & { id: string };
  error?: WhereaboutsServiceError;
}

export interface QuartersResult {
  success: boolean;
  quarters?: (WhereaboutsQuarterDocument & { id: string })[];
  error?: WhereaboutsServiceError;
}

export interface SlotResult {
  success: boolean;
  slot?: DailySlotDocument & { id: string };
  error?: WhereaboutsServiceError;
}

export interface SlotsResult {
  success: boolean;
  slots?: (DailySlotDocument & { id: string })[];
  error?: WhereaboutsServiceError;
}

export interface TemplateResult {
  success: boolean;
  template?: WeeklyTemplateDocument & { id: string };
  error?: WhereaboutsServiceError;
}

export interface TemplatesResult {
  success: boolean;
  templates?: (WeeklyTemplateDocument & { id: string })[];
  error?: WhereaboutsServiceError;
}

export interface CreateQuarterData {
  athleteId: string;
  year: number;
  quarter: QuarterName;
  copyFromQuarterId?: string;
}

export interface CreateSlotData {
  quarterId: string;
  athleteId: string;
  date: string;
  slot60min: TimeSlotDocument;
  overnightLocationId?: string;
  overnightLocationName?: string;
}

export interface UpdateSlotData {
  slot60min?: TimeSlotDocument;
  overnightLocationId?: string;
  overnightLocationName?: string;
  isComplete?: boolean;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

const getErrorMessage = (error: unknown): WhereaboutsServiceError => {
  if (error && typeof error === 'object' && 'code' in error) {
    const firestoreError = error as { code: string; message?: string };
    return {
      code: firestoreError.code,
      message: firestoreError.message || 'An unexpected error occurred',
      originalError: error,
    };
  }

  return {
    code: 'unknown',
    message: 'An unexpected error occurred',
    originalError: error,
  };
};

// ============================================================================
// QUARTER OPERATIONS
// ============================================================================

/**
 * Create a new quarter
 */
export const createQuarter = async (
  data: CreateQuarterData
): Promise<QuarterResult> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Creating quarter:', data.year, data.quarter);

    // Calculate quarter dates
    const { startDate, endDate, filingDeadline, totalDays } = calculateQuarterDates(
      data.year,
      data.quarter
    );

    const docRef = doc(collection(db, COLLECTIONS.WHEREABOUTS_QUARTERS));

    const quarterDoc: CreateQuarterDocument = {
      athlete_id: data.athleteId,
      year: data.year,
      quarter: data.quarter,
      start_date: startDate,
      end_date: endDate,
      filing_deadline: filingDeadline,
      status: 'draft',
      completion_percentage: 0,
      days_completed: 0,
      total_days: totalDays,
      copied_from_quarter_id: data.copyFromQuarterId,
    };

    await setDoc(docRef, {
      ...quarterDoc,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    console.log('[Whereabouts] Quarter created:', docRef.id);

    // Fetch and return created quarter
    const createdDoc = await getDoc(docRef);
    if (createdDoc.exists()) {
      return {
        success: true,
        quarter: {
          id: createdDoc.id,
          ...(createdDoc.data() as WhereaboutsQuarterDocument),
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[Whereabouts] Create quarter error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Get all quarters for an athlete
 */
export const getAthleteQuarters = async (
  athleteId: string
): Promise<QuartersResult> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Fetching quarters for athlete:', athleteId);

    const q = query(
      collection(db, COLLECTIONS.WHEREABOUTS_QUARTERS),
      where('athlete_id', '==', athleteId),
      orderBy('year', 'desc'),
      orderBy('quarter', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const quarters: (WhereaboutsQuarterDocument & { id: string })[] = [];

    querySnapshot.forEach((doc) => {
      quarters.push({
        id: doc.id,
        ...(doc.data() as WhereaboutsQuarterDocument),
      });
    });

    console.log('[Whereabouts] Found', quarters.length, 'quarters');
    return { success: true, quarters };
  } catch (error) {
    console.error('[Whereabouts] Fetch quarters error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Get a specific quarter by ID
 */
export const getQuarter = async (quarterId: string): Promise<QuarterResult> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.WHEREABOUTS_QUARTERS, quarterId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: { code: 'not-found', message: 'Quarter not found' },
      };
    }

    return {
      success: true,
      quarter: {
        id: docSnap.id,
        ...(docSnap.data() as WhereaboutsQuarterDocument),
      },
    };
  } catch (error) {
    console.error('[Whereabouts] Get quarter error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Get current active quarter for athlete
 */
export const getCurrentQuarter = async (
  athleteId: string
): Promise<QuarterResult> => {
  const db = getFirestoreDb();

  try {
    const { year, quarter } = getCurrentQuarterInfo();

    const q = query(
      collection(db, COLLECTIONS.WHEREABOUTS_QUARTERS),
      where('athlete_id', '==', athleteId),
      where('year', '==', year),
      where('quarter', '==', quarter),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: true,
        quarter: undefined, // No current quarter exists
      };
    }

    const doc = querySnapshot.docs[0];
    return {
      success: true,
      quarter: {
        id: doc.id,
        ...(doc.data() as WhereaboutsQuarterDocument),
      },
    };
  } catch (error) {
    console.error('[Whereabouts] Get current quarter error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Update quarter status and completion
 */
export const updateQuarter = async (
  quarterId: string,
  data: Partial<WhereaboutsQuarterDocument>
): Promise<QuarterResult> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Updating quarter:', quarterId);

    const docRef = doc(db, COLLECTIONS.WHEREABOUTS_QUARTERS, quarterId);

    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp(),
    });

    const updatedDoc = await getDoc(docRef);
    return {
      success: true,
      quarter: {
        id: updatedDoc.id,
        ...(updatedDoc.data() as WhereaboutsQuarterDocument),
      },
    };
  } catch (error) {
    console.error('[Whereabouts] Update quarter error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Submit quarter for compliance
 */
export const submitQuarter = async (quarterId: string): Promise<QuarterResult> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Submitting quarter:', quarterId);

    const docRef = doc(db, COLLECTIONS.WHEREABOUTS_QUARTERS, quarterId);

    await updateDoc(docRef, {
      status: 'submitted',
      submitted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    const updatedDoc = await getDoc(docRef);
    return {
      success: true,
      quarter: {
        id: updatedDoc.id,
        ...(updatedDoc.data() as WhereaboutsQuarterDocument),
      },
    };
  } catch (error) {
    console.error('[Whereabouts] Submit quarter error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Copy quarter from previous quarter
 */
export const copyQuarter = async (
  sourceQuarterId: string,
  targetYear: number,
  targetQuarter: QuarterName,
  athleteId: string
): Promise<QuarterResult> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Copying quarter from:', sourceQuarterId);

    // Create new quarter with copy reference
    const newQuarterResult = await createQuarter({
      athleteId,
      year: targetYear,
      quarter: targetQuarter,
      copyFromQuarterId: sourceQuarterId,
    });

    if (!newQuarterResult.success || !newQuarterResult.quarter) {
      return newQuarterResult;
    }

    // Copy daily slots from source quarter
    const slotsResult = await getQuarterSlots(sourceQuarterId);
    if (slotsResult.success && slotsResult.slots) {
      // Adjust dates for new quarter
      const { startDate: newStartDate } = calculateQuarterDates(targetYear, targetQuarter);
      const sourceStart = new Date(newQuarterResult.quarter.start_date);

      const batch = writeBatch(db);

      for (const slot of slotsResult.slots) {
        // Calculate day offset and apply to new quarter
        const slotDate = new Date(slot.date);
        const dayOffset = Math.floor(
          (slotDate.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        const newDate = new Date(newStartDate);
        newDate.setDate(newDate.getDate() + dayOffset);

        const newSlotRef = doc(collection(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS));

        batch.set(newSlotRef, {
          quarter_id: newQuarterResult.quarter.id,
          athlete_id: athleteId,
          date: newDate.toISOString().split('T')[0],
          slot_60min: slot.slot_60min,
          overnight_location_id: slot.overnight_location_id,
          overnight_location_name: slot.overnight_location_name,
          is_complete: false,
          modification_count: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      await batch.commit();
      console.log('[Whereabouts] Copied', slotsResult.slots.length, 'slots');
    }

    return newQuarterResult;
  } catch (error) {
    console.error('[Whereabouts] Copy quarter error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

// ============================================================================
// DAILY SLOT OPERATIONS
// ============================================================================

/**
 * Create or update a daily slot
 */
export const upsertDailySlot = async (
  quarterId: string,
  data: CreateSlotData
): Promise<SlotResult> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Upserting slot for date:', data.date);

    // Check if slot already exists
    const q = query(
      collection(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS),
      where('quarter_id', '==', quarterId),
      where('date', '==', data.date),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update existing slot
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data() as DailySlotDocument;

      await updateDoc(existingDoc.ref, {
        slot_60min: data.slot60min,
        overnight_location_id: data.overnightLocationId || null,
        overnight_location_name: data.overnightLocationName || null,
        is_complete: true,
        modification_count: (existingData.modification_count || 0) + 1,
        updated_at: serverTimestamp(),
      });

      const updatedDoc = await getDoc(existingDoc.ref);
      return {
        success: true,
        slot: {
          id: updatedDoc.id,
          ...(updatedDoc.data() as DailySlotDocument),
        },
      };
    } else {
      // Create new slot
      const docRef = doc(collection(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS));

      const slotDoc: CreateDailySlotDocument = {
        quarter_id: quarterId,
        athlete_id: data.athleteId,
        date: data.date,
        slot_60min: data.slot60min,
        overnight_location_id: data.overnightLocationId,
        overnight_location_name: data.overnightLocationName,
        is_complete: true,
        modification_count: 0,
      };

      await setDoc(docRef, {
        ...slotDoc,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Update quarter completion
      await updateQuarterCompletion(quarterId);

      const createdDoc = await getDoc(docRef);
      return {
        success: true,
        slot: {
          id: createdDoc.id,
          ...(createdDoc.data() as DailySlotDocument),
        },
      };
    }
  } catch (error) {
    console.error('[Whereabouts] Upsert slot error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Bulk upsert daily slots
 */
export const bulkUpsertSlots = async (
  quarterId: string,
  slots: CreateSlotData[]
): Promise<SlotsResult> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Bulk upserting', slots.length, 'slots');

    const batch = writeBatch(db);
    const results: (DailySlotDocument & { id: string })[] = [];

    for (const slot of slots) {
      const docRef = doc(collection(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS));

      batch.set(docRef, {
        quarter_id: quarterId,
        athlete_id: slot.athleteId,
        date: slot.date,
        slot_60min: slot.slot60min,
        overnight_location_id: slot.overnightLocationId || null,
        overnight_location_name: slot.overnightLocationName || null,
        is_complete: true,
        modification_count: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }

    await batch.commit();

    // Update quarter completion
    await updateQuarterCompletion(quarterId);

    console.log('[Whereabouts] Bulk upsert complete');
    return { success: true, slots: results };
  } catch (error) {
    console.error('[Whereabouts] Bulk upsert error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Get all slots for a quarter
 */
export const getQuarterSlots = async (quarterId: string): Promise<SlotsResult> => {
  const db = getFirestoreDb();

  try {
    const q = query(
      collection(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS),
      where('quarter_id', '==', quarterId),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const slots: (DailySlotDocument & { id: string })[] = [];

    querySnapshot.forEach((doc) => {
      slots.push({
        id: doc.id,
        ...(doc.data() as DailySlotDocument),
      });
    });

    return { success: true, slots };
  } catch (error) {
    console.error('[Whereabouts] Get slots error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Get slot by date
 */
export const getSlotByDate = async (
  quarterId: string,
  date: string
): Promise<SlotResult> => {
  const db = getFirestoreDb();

  try {
    const q = query(
      collection(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS),
      where('quarter_id', '==', quarterId),
      where('date', '==', date),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, slot: undefined };
    }

    const doc = querySnapshot.docs[0];
    return {
      success: true,
      slot: {
        id: doc.id,
        ...(doc.data() as DailySlotDocument),
      },
    };
  } catch (error) {
    console.error('[Whereabouts] Get slot by date error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Update a single slot
 */
export const updateSlot = async (
  slotId: string,
  data: UpdateSlotData
): Promise<SlotResult> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS, slotId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: { code: 'not-found', message: 'Slot not found' },
      };
    }

    const existingData = docSnap.data() as DailySlotDocument;

    const updatePayload: Record<string, unknown> = {
      updated_at: serverTimestamp(),
      modification_count: (existingData.modification_count || 0) + 1,
    };

    if (data.slot60min !== undefined) updatePayload.slot_60min = data.slot60min;
    if (data.overnightLocationId !== undefined)
      updatePayload.overnight_location_id = data.overnightLocationId;
    if (data.overnightLocationName !== undefined)
      updatePayload.overnight_location_name = data.overnightLocationName;
    if (data.isComplete !== undefined) updatePayload.is_complete = data.isComplete;

    await updateDoc(docRef, updatePayload);

    // Update quarter completion
    await updateQuarterCompletion(existingData.quarter_id);

    const updatedDoc = await getDoc(docRef);
    return {
      success: true,
      slot: {
        id: updatedDoc.id,
        ...(updatedDoc.data() as DailySlotDocument),
      },
    };
  } catch (error) {
    console.error('[Whereabouts] Update slot error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * DailySlotSelection interface for bulk operations
 */
export interface DailySlotSelection {
  date: string;
  location_type: 'home' | 'training' | 'gym';
  time_start: string;
  time_end: string;
  location_id?: string;
  location_name?: string;
  location_address?: string;
  notes?: string;
  is_competition?: boolean;
  competition_id?: string;
}

/**
 * WeeklyPattern interface for pattern operations
 */
export interface WeeklyPattern {
  monday: DayPattern;
  tuesday: DayPattern;
  wednesday: DayPattern;
  thursday: DayPattern;
  friday: DayPattern;
  saturday: DayPattern;
  sunday: DayPattern;
}

export interface DayPattern {
  location_type: 'home' | 'training' | 'gym';
  time_start: string;
  time_end: string;
}

/**
 * Bulk create daily slots from DailySlotSelection array
 * Uses Firestore batch writes with 500 item limit per batch
 */
export const bulkCreateDailySlots = async (
  quarterId: string,
  athleteId: string,
  slots: DailySlotSelection[]
): Promise<{ success: boolean; slotsCreated: number; error?: WhereaboutsServiceError }> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Bulk creating', slots.length, 'daily slots');

    // Firestore batch limit is 500
    const BATCH_SIZE = 500;
    let slotsCreated = 0;

    // Process in batches
    for (let i = 0; i < slots.length; i += BATCH_SIZE) {
      const batchSlots = slots.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const slot of batchSlots) {
        const docRef = doc(collection(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS));

        batch.set(docRef, {
          quarter_id: quarterId,
          athlete_id: athleteId,
          date: slot.date,
          slot_60min: {
            start_time: slot.time_start,
            end_time: slot.time_end,
            location_id: slot.location_id || `${slot.location_type}:${athleteId}`,
            location_name: slot.location_name || slot.location_type,
            location_address: slot.location_address,
          },
          overnight_location_id: null,
          overnight_location_name: null,
          is_complete: true,
          modification_count: 0,
          notes: slot.notes || '',
          is_competition: slot.is_competition || false,
          competition_id: slot.competition_id || null,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });

        slotsCreated++;
      }

      // Execute batch
      await batch.commit();
      console.log(`[Whereabouts] Committed batch ${Math.floor(i / BATCH_SIZE) + 1}, ${batchSlots.length} slots`);
    }

    // Update quarter completion
    await updateQuarterCompletion(quarterId);

    console.log('[Whereabouts] Bulk create complete:', slotsCreated, 'slots created');
    return { success: true, slotsCreated };
  } catch (error) {
    console.error('[Whereabouts] Bulk create error:', error);
    return {
      success: false,
      slotsCreated: 0,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Create a quarter and generate daily slots from a weekly pattern
 */
export const createQuarterWithPattern = async (
  athleteId: string,
  year: number,
  quarter: QuarterName,
  pattern: WeeklyPattern,
  competitions: { id: string; name: string; start_date: string; end_date: string; location_address?: string }[] = []
): Promise<{
  success: boolean;
  quarter?: WhereaboutsQuarterDocument & { id: string };
  slotsCreated?: number;
  error?: WhereaboutsServiceError;
}> => {
  try {
    console.log('[Whereabouts] Creating quarter with pattern:', year, quarter);

    // Create the quarter first
    const quarterResult = await createQuarter({
      athleteId,
      year,
      quarter,
    });

    if (!quarterResult.success || !quarterResult.quarter) {
      return {
        success: false,
        error: quarterResult.error || { code: 'unknown', message: 'Failed to create quarter' },
      };
    }

    const createdQuarter = quarterResult.quarter;

    // Generate daily slots from pattern
    const slots = generateSlotsFromPattern(
      pattern,
      createdQuarter.start_date,
      createdQuarter.end_date,
      competitions
    );

    // Bulk create the slots
    const bulkResult = await bulkCreateDailySlots(
      createdQuarter.id,
      athleteId,
      slots
    );

    if (!bulkResult.success) {
      console.error('[Whereabouts] Failed to create slots, but quarter exists');
      // Quarter was created but slots failed - return quarter anyway
      return {
        success: true,
        quarter: createdQuarter,
        slotsCreated: 0,
        error: bulkResult.error,
      };
    }

    return {
      success: true,
      quarter: createdQuarter,
      slotsCreated: bulkResult.slotsCreated,
    };
  } catch (error) {
    console.error('[Whereabouts] Create quarter with pattern error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Extract weekly pattern from a quarter's slots
 */
export const extractPatternFromQuarter = async (
  quarterId: string
): Promise<{
  success: boolean;
  pattern?: WeeklyPattern;
  error?: WhereaboutsServiceError;
}> => {
  try {
    console.log('[Whereabouts] Extracting pattern from quarter:', quarterId);

    // Get all slots for the quarter
    const slotsResult = await getQuarterSlots(quarterId);
    if (!slotsResult.success || !slotsResult.slots || slotsResult.slots.length === 0) {
      return {
        success: false,
        error: { code: 'no-slots', message: 'No slots found in quarter' },
      };
    }

    // Group slots by day of week and find most common pattern for each day
    const dayPatterns: Record<string, { location_type: string; time_start: string; time_end: string; count: number }[]> = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    };

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (const slot of slotsResult.slots) {
      const date = new Date(slot.date);
      const dayName = dayNames[date.getDay()];
      const slot60min = slot.slot_60min;

      // Extract location type from location_id (format: "type:athleteId")
      let locationType = 'home';
      if (slot60min.location_id) {
        const parts = slot60min.location_id.split(':');
        if (parts.length > 0 && ['home', 'training', 'gym'].includes(parts[0])) {
          locationType = parts[0];
        }
      }

      const key = `${locationType}:${slot60min.start_time}:${slot60min.end_time}`;
      const existing = dayPatterns[dayName].find(
        (p) => `${p.location_type}:${p.time_start}:${p.time_end}` === key
      );

      if (existing) {
        existing.count++;
      } else {
        dayPatterns[dayName].push({
          location_type: locationType,
          time_start: slot60min.start_time,
          time_end: slot60min.end_time,
          count: 1,
        });
      }
    }

    // Get the most common pattern for each day
    const pattern: WeeklyPattern = {} as WeeklyPattern;

    for (const day of dayNames) {
      const patterns = dayPatterns[day];
      if (patterns.length > 0) {
        // Sort by count and take the most common
        patterns.sort((a, b) => b.count - a.count);
        const mostCommon = patterns[0];
        pattern[day as keyof WeeklyPattern] = {
          location_type: mostCommon.location_type as 'home' | 'training' | 'gym',
          time_start: mostCommon.time_start,
          time_end: mostCommon.time_end,
        };
      } else {
        // Default pattern if no data for this day
        pattern[day as keyof WeeklyPattern] = {
          location_type: 'home',
          time_start: '06:00',
          time_end: '07:00',
        };
      }
    }

    return { success: true, pattern };
  } catch (error) {
    console.error('[Whereabouts] Extract pattern error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Copy pattern from previous quarter to create new quarter
 */
export const copyQuarterPattern = async (
  sourceQuarterId: string,
  targetYear: number,
  targetQuarter: QuarterName,
  athleteId: string
): Promise<{
  success: boolean;
  quarter?: WhereaboutsQuarterDocument & { id: string };
  slotsCreated?: number;
  error?: WhereaboutsServiceError;
}> => {
  try {
    console.log('[Whereabouts] Copying pattern from:', sourceQuarterId);

    // Extract pattern from source quarter
    const patternResult = await extractPatternFromQuarter(sourceQuarterId);
    if (!patternResult.success || !patternResult.pattern) {
      return {
        success: false,
        error: patternResult.error || { code: 'no-pattern', message: 'Could not extract pattern' },
      };
    }

    // Create new quarter with extracted pattern
    return await createQuarterWithPattern(
      athleteId,
      targetYear,
      targetQuarter,
      patternResult.pattern
    );
  } catch (error) {
    console.error('[Whereabouts] Copy quarter pattern error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Apply pattern to an existing quarter
 * Can optionally overwrite existing slots
 */
export const applyPatternToExistingQuarter = async (
  quarterId: string,
  athleteId: string,
  pattern: WeeklyPattern,
  overwriteExisting: boolean = false
): Promise<{
  success: boolean;
  slotsCreated: number;
  slotsUpdated: number;
  error?: WhereaboutsServiceError;
}> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Applying pattern to quarter:', quarterId, 'overwrite:', overwriteExisting);

    // Get quarter info
    const quarterResult = await getQuarter(quarterId);
    if (!quarterResult.success || !quarterResult.quarter) {
      return {
        success: false,
        slotsCreated: 0,
        slotsUpdated: 0,
        error: { code: 'not-found', message: 'Quarter not found' },
      };
    }

    const quarter = quarterResult.quarter;

    // Get existing slots
    const existingSlotsResult = await getQuarterSlots(quarterId);
    const existingSlots = existingSlotsResult.slots || [];
    const existingDates = new Set(existingSlots.map((s) => s.date));

    // Generate all slots from pattern
    const allPatternSlots = generateSlotsFromPattern(
      pattern,
      quarter.start_date,
      quarter.end_date,
      []
    );

    let slotsCreated = 0;
    let slotsUpdated = 0;

    if (overwriteExisting) {
      // Delete all existing slots and create new ones
      const BATCH_SIZE = 500;

      // Delete existing slots in batches
      for (let i = 0; i < existingSlots.length; i += BATCH_SIZE) {
        const batchSlots = existingSlots.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        for (const slot of batchSlots) {
          const docRef = doc(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS, slot.id);
          batch.delete(docRef);
        }

        await batch.commit();
      }

      slotsUpdated = existingSlots.length;

      // Create all new slots
      const bulkResult = await bulkCreateDailySlots(quarterId, athleteId, allPatternSlots);
      slotsCreated = bulkResult.slotsCreated;
    } else {
      // Only create slots for dates that don't have existing slots
      const missingSlots = allPatternSlots.filter((s) => !existingDates.has(s.date));

      if (missingSlots.length > 0) {
        const bulkResult = await bulkCreateDailySlots(quarterId, athleteId, missingSlots);
        slotsCreated = bulkResult.slotsCreated;
      }
    }

    // Update quarter completion
    await updateQuarterCompletion(quarterId);

    console.log('[Whereabouts] Pattern applied:', slotsCreated, 'created,', slotsUpdated, 'updated');
    return {
      success: true,
      slotsCreated,
      slotsUpdated,
    };
  } catch (error) {
    console.error('[Whereabouts] Apply pattern error:', error);
    return {
      success: false,
      slotsCreated: 0,
      slotsUpdated: 0,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Generate daily slots from a weekly pattern for a date range
 */
const generateSlotsFromPattern = (
  pattern: WeeklyPattern,
  startDateStr: string,
  endDateStr: string,
  competitions: { id: string; name: string; start_date: string; end_date: string; location_address?: string }[]
): DailySlotSelection[] => {
  const slots: DailySlotSelection[] = [];
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const currentDate = new Date(startDate);

  const dayMap: Record<number, keyof WeeklyPattern> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay();
    const dayName = dayMap[dayOfWeek];
    const dayPattern = pattern[dayName];

    // Check if this date is during a competition
    const competition = competitions.find((comp) => {
      const compStart = new Date(comp.start_date);
      const compEnd = new Date(comp.end_date);
      return currentDate >= compStart && currentDate <= compEnd;
    });

    slots.push({
      date: dateStr,
      location_type: dayPattern.location_type,
      time_start: dayPattern.time_start,
      time_end: dayPattern.time_end,
      is_competition: !!competition,
      competition_id: competition?.id,
      location_name: competition ? competition.location_address : undefined,
      notes: competition ? `Competition: ${competition.name}` : undefined,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
};

// ============================================================================
// TEMPLATE OPERATIONS
// ============================================================================

/**
 * Get all templates for an athlete
 */
export const getAthleteTemplates = async (
  athleteId: string
): Promise<TemplatesResult> => {
  const db = getFirestoreDb();

  try {
    const q = query(
      collection(db, COLLECTIONS.WHEREABOUTS_TEMPLATES),
      where('athlete_id', '==', athleteId),
      orderBy('usage_count', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const templates: (WeeklyTemplateDocument & { id: string })[] = [];

    querySnapshot.forEach((doc) => {
      templates.push({
        id: doc.id,
        ...(doc.data() as WeeklyTemplateDocument),
      });
    });

    return { success: true, templates };
  } catch (error) {
    console.error('[Whereabouts] Get templates error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Save a new template
 */
export const saveTemplate = async (
  data: CreateWeeklyTemplateDocument
): Promise<TemplateResult> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Saving template:', data.name);

    // If setting as default, unset other defaults
    if (data.is_default) {
      await unsetDefaultTemplates(data.athlete_id);
    }

    const docRef = doc(collection(db, COLLECTIONS.WHEREABOUTS_TEMPLATES));

    await setDoc(docRef, {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    const createdDoc = await getDoc(docRef);
    return {
      success: true,
      template: {
        id: createdDoc.id,
        ...(createdDoc.data() as WeeklyTemplateDocument),
      },
    };
  } catch (error) {
    console.error('[Whereabouts] Save template error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Apply template to a quarter
 */
export const applyTemplate = async (
  quarterId: string,
  templateId: string,
  athleteId: string
): Promise<{ success: boolean; error?: WhereaboutsServiceError }> => {
  const db = getFirestoreDb();

  try {
    console.log('[Whereabouts] Applying template:', templateId, 'to quarter:', quarterId);

    // Get template
    const templateDoc = await getDoc(
      doc(db, COLLECTIONS.WHEREABOUTS_TEMPLATES, templateId)
    );

    if (!templateDoc.exists()) {
      return {
        success: false,
        error: { code: 'not-found', message: 'Template not found' },
      };
    }

    const template = templateDoc.data() as WeeklyTemplateDocument;

    // Get quarter to determine date range
    const quarterResult = await getQuarter(quarterId);
    if (!quarterResult.success || !quarterResult.quarter) {
      return {
        success: false,
        error: { code: 'not-found', message: 'Quarter not found' },
      };
    }

    const quarter = quarterResult.quarter;
    const startDate = new Date(quarter.start_date);
    const endDate = new Date(quarter.end_date);

    // Generate slots based on template
    const daySchedules: Record<number, typeof template.monday> = {
      0: template.sunday,
      1: template.monday,
      2: template.tuesday,
      3: template.wednesday,
      4: template.thursday,
      5: template.friday,
      6: template.saturday,
    };

    const slots: CreateSlotData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const schedule = daySchedules[dayOfWeek];

      if (schedule) {
        slots.push({
          quarterId,
          athleteId,
          date: currentDate.toISOString().split('T')[0],
          slot60min: schedule.slot_60min,
          overnightLocationId: schedule.overnight_location_id,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Bulk create slots
    await bulkUpsertSlots(quarterId, slots);

    // Increment template usage count
    await updateDoc(templateDoc.ref, {
      usage_count: (template.usage_count || 0) + 1,
      updated_at: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('[Whereabouts] Apply template error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (
  templateId: string
): Promise<{ success: boolean; error?: WhereaboutsServiceError }> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.WHEREABOUTS_TEMPLATES, templateId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('[Whereabouts] Delete template error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate quarter dates
 */
export const calculateQuarterDates = (
  year: number,
  quarter: QuarterName
): {
  startDate: string;
  endDate: string;
  filingDeadline: string;
  totalDays: number;
} => {
  const quarterMonths: Record<QuarterName, { start: number; end: number; deadline: number }> = {
    Q1: { start: 0, end: 2, deadline: 11 }, // Jan-Mar, deadline Dec 15 previous year
    Q2: { start: 3, end: 5, deadline: 2 }, // Apr-Jun, deadline Mar 15
    Q3: { start: 6, end: 8, deadline: 5 }, // Jul-Sep, deadline Jun 15
    Q4: { start: 9, end: 11, deadline: 8 }, // Oct-Dec, deadline Sep 15
  };

  const { start, end, deadline } = quarterMonths[quarter];

  const startDate = new Date(year, start, 1);
  const endDate = new Date(year, end + 1, 0); // Last day of end month

  // Filing deadline is 15th of the month before quarter starts
  const deadlineYear = quarter === 'Q1' ? year - 1 : year;
  const filingDeadline = new Date(deadlineYear, deadline, 15);

  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    filingDeadline: filingDeadline.toISOString().split('T')[0],
    totalDays,
  };
};

/**
 * Get current quarter info
 */
export const getCurrentQuarterInfo = (): { year: number; quarter: QuarterName } => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  let quarter: QuarterName;
  if (month <= 2) quarter = 'Q1';
  else if (month <= 5) quarter = 'Q2';
  else if (month <= 8) quarter = 'Q3';
  else quarter = 'Q4';

  return { year, quarter };
};

/**
 * Calculate days until deadline
 */
export const calculateDaysUntilDeadline = (deadlineDate: string): number => {
  const deadline = new Date(deadlineDate);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Generate all dates for a quarter
 */
export const generateQuarterDays = (year: number, quarter: QuarterName): string[] => {
  const { startDate, endDate } = calculateQuarterDates(year, quarter);
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Calculate completion percentage
 */
export const calculateCompletionPercentage = (
  completedSlots: number,
  totalDays: number
): number => {
  if (totalDays === 0) return 0;
  return Math.round((completedSlots / totalDays) * 100);
};

/**
 * Find missing dates in a quarter
 */
export const findMissingDates = (
  filledDates: string[],
  year: number,
  quarter: QuarterName
): string[] => {
  const allDates = generateQuarterDays(year, quarter);
  const filledSet = new Set(filledDates);
  return allDates.filter((date) => !filledSet.has(date));
};

/**
 * Validate slot time (must be 60 minutes between 5 AM and 11 PM)
 */
export const validateSlotTime = (
  startTime: string,
  endTime: string
): { valid: boolean; error?: string } => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Check 5 AM - 11 PM constraint
  if (startHour < 5 || endHour > 23 || (endHour === 23 && endMin > 0)) {
    return {
      valid: false,
      error: 'Time slot must be between 5:00 AM and 11:00 PM',
    };
  }

  // Check 60-minute duration
  if (endMinutes - startMinutes !== 60) {
    return {
      valid: false,
      error: 'Time slot must be exactly 60 minutes',
    };
  }

  return { valid: true };
};

/**
 * Update quarter completion based on slots
 */
const updateQuarterCompletion = async (quarterId: string): Promise<void> => {
  const db = getFirestoreDb();

  try {
    // Get quarter
    const quarterDoc = await getDoc(
      doc(db, COLLECTIONS.WHEREABOUTS_QUARTERS, quarterId)
    );

    if (!quarterDoc.exists()) return;

    const quarter = quarterDoc.data() as WhereaboutsQuarterDocument;

    // Count completed slots
    const slotsQuery = query(
      collection(db, COLLECTIONS.WHEREABOUTS_DAILY_SLOTS),
      where('quarter_id', '==', quarterId),
      where('is_complete', '==', true)
    );

    const slotsSnapshot = await getDocs(slotsQuery);
    const completedCount = slotsSnapshot.size;

    // Calculate percentage
    const percentage = calculateCompletionPercentage(
      completedCount,
      quarter.total_days
    );

    // Determine status
    let status: QuarterStatus = quarter.status;
    if (status !== 'submitted' && status !== 'locked') {
      if (completedCount === 0) {
        status = 'draft';
      } else if (percentage < 100) {
        status = 'incomplete';
      } else {
        status = 'complete';
      }
    }

    // Update quarter
    await updateDoc(quarterDoc.ref, {
      days_completed: completedCount,
      completion_percentage: percentage,
      status,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('[Whereabouts] Update completion error:', error);
  }
};

/**
 * Unset default flag for all templates
 */
const unsetDefaultTemplates = async (athleteId: string): Promise<void> => {
  const db = getFirestoreDb();

  const q = query(
    collection(db, COLLECTIONS.WHEREABOUTS_TEMPLATES),
    where('athlete_id', '==', athleteId),
    where('is_default', '==', true)
  );

  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);

  querySnapshot.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      is_default: false,
      updated_at: serverTimestamp(),
    });
  });

  if (!querySnapshot.empty) {
    await batch.commit();
  }
};

/**
 * Locations Service
 * Firestore operations for athlete location management
 *
 * Collections:
 * - home_locations/{athleteId} - One document per athlete
 * - training_locations/{athleteId} - One document per athlete
 * - gym_locations/{athleteId} - One document per athlete (optional)
 * - competitions/{competitionId} - Multiple documents, query by athlete_id
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { LocationWithSchedule, Competition } from '../types';

// ============================================================================
// COLLECTIONS
// ============================================================================

const COLLECTIONS = {
  HOME_LOCATIONS: 'home_locations',
  TRAINING_LOCATIONS: 'training_locations',
  GYM_LOCATIONS: 'gym_locations',
  COMPETITIONS: 'competitions',
} as const;

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface LocationServiceError {
  code: string;
  message: string;
  field?: string;
  originalError?: unknown;
}

export class LocationValidationError extends Error {
  code: string;
  field?: string;

  constructor(message: string, code: string = 'validation_error', field?: string) {
    super(message);
    this.name = 'LocationValidationError';
    this.code = code;
    this.field = field;
  }
}

// ============================================================================
// SERIALIZATION UTILITIES
// ============================================================================

/**
 * Convert Firestore Timestamps to ISO strings for Redux serialization
 */
const convertTimestamps = <T extends Record<string, unknown>>(data: T): T => {
  const converted = { ...data };
  for (const key in converted) {
    const value = converted[key];
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      (converted as Record<string, unknown>)[key] = (value as Timestamp).toDate().toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (converted as Record<string, unknown>)[key] = convertTimestamps(value as Record<string, unknown>);
    }
  }
  return converted;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate HH:mm time format
 */
const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Convert time string to minutes for comparison
 */
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Validate that end time is after start time
 */
export const validateTimeRange = (start: string, end: string): boolean => {
  if (!isValidTimeFormat(start)) {
    throw new LocationValidationError(
      `Invalid start time format: ${start}. Expected HH:mm`,
      'invalid_time_format',
      'start_time'
    );
  }

  if (!isValidTimeFormat(end)) {
    throw new LocationValidationError(
      `Invalid end time format: ${end}. Expected HH:mm`,
      'invalid_time_format',
      'end_time'
    );
  }

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (endMinutes <= startMinutes) {
    throw new LocationValidationError(
      `End time (${end}) must be after start time (${start})`,
      'invalid_time_range',
      'end_time'
    );
  }

  return true;
};

/**
 * Validate date range for competitions
 */
export const validateDateRange = (start: string, end: string): boolean => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime())) {
    throw new LocationValidationError(
      `Invalid start date: ${start}. Expected ISO format (YYYY-MM-DD)`,
      'invalid_date_format',
      'start_date'
    );
  }

  if (isNaN(endDate.getTime())) {
    throw new LocationValidationError(
      `Invalid end date: ${end}. Expected ISO format (YYYY-MM-DD)`,
      'invalid_date_format',
      'end_date'
    );
  }

  if (endDate < startDate) {
    throw new LocationValidationError(
      `End date (${end}) must be on or after start date (${start})`,
      'invalid_date_range',
      'end_date'
    );
  }

  return true;
};

/**
 * Validate all days in a location schedule
 */
export const validateLocationSchedule = (schedule: LocationWithSchedule): boolean => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

  // Validate required address fields
  if (!schedule.address_line1 || schedule.address_line1.trim() === '') {
    throw new LocationValidationError(
      'Address line 1 is required',
      'required_field',
      'address_line1'
    );
  }

  if (!schedule.city || schedule.city.trim() === '') {
    throw new LocationValidationError(
      'City is required',
      'required_field',
      'city'
    );
  }

  if (!schedule.country || schedule.country.trim() === '') {
    throw new LocationValidationError(
      'Country is required',
      'required_field',
      'country'
    );
  }

  // Validate each day's time range
  for (const day of days) {
    const startKey = `${day}_start` as keyof LocationWithSchedule;
    const endKey = `${day}_end` as keyof LocationWithSchedule;

    const startTime = schedule[startKey] as string;
    const endTime = schedule[endKey] as string;

    if (!startTime || startTime.trim() === '') {
      throw new LocationValidationError(
        `${day.charAt(0).toUpperCase() + day.slice(1)} start time is required`,
        'required_field',
        startKey
      );
    }

    if (!endTime || endTime.trim() === '') {
      throw new LocationValidationError(
        `${day.charAt(0).toUpperCase() + day.slice(1)} end time is required`,
        'required_field',
        endKey
      );
    }

    try {
      validateTimeRange(startTime, endTime);
    } catch (error) {
      if (error instanceof LocationValidationError) {
        throw new LocationValidationError(
          `${day.charAt(0).toUpperCase() + day.slice(1)}: ${error.message}`,
          error.code,
          `${day}_${error.field}`
        );
      }
      throw error;
    }
  }

  return true;
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

const handleFirestoreError = (error: unknown): LocationServiceError => {
  if (error instanceof LocationValidationError) {
    return {
      code: error.code,
      message: error.message,
      field: error.field,
    };
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const firestoreError = error as { code: string; message?: string };

    // Map Firestore error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested resource was not found',
      'already-exists': 'This resource already exists',
      'resource-exhausted': 'Too many requests. Please try again later',
      'unavailable': 'Service temporarily unavailable. Please try again',
      'unauthenticated': 'Please sign in to continue',
    };

    return {
      code: firestoreError.code,
      message: errorMessages[firestoreError.code] || firestoreError.message || 'An unexpected error occurred',
      // Don't store originalError - it's not serializable
    };
  }

  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    // Don't store originalError - it's not serializable
  };
};

// ============================================================================
// FIRESTORE DATA CONVERSION
// ============================================================================

const convertTimestampToString = (timestamp: Timestamp | Date | string | undefined): string | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp; // Already a string
};

const locationFromFirestore = (data: Record<string, unknown>): LocationWithSchedule => {
  return {
    address_line1: data.address_line1 as string,
    address_line2: data.address_line2 as string | undefined,
    city: data.city as string,
    country: data.country as string,
    postal_code: data.postal_code as string | undefined,
    latitude: data.latitude as number | undefined,
    longitude: data.longitude as number | undefined,
    additional_info: data.additional_info as string | undefined,
    monday_start: data.monday_start as string,
    monday_end: data.monday_end as string,
    tuesday_start: data.tuesday_start as string,
    tuesday_end: data.tuesday_end as string,
    wednesday_start: data.wednesday_start as string,
    wednesday_end: data.wednesday_end as string,
    thursday_start: data.thursday_start as string,
    thursday_end: data.thursday_end as string,
    friday_start: data.friday_start as string,
    friday_end: data.friday_end as string,
    saturday_start: data.saturday_start as string,
    saturday_end: data.saturday_end as string,
    sunday_start: data.sunday_start as string,
    sunday_end: data.sunday_end as string,
    created_at: convertTimestampToString(data.created_at as Timestamp),
    updated_at: convertTimestampToString(data.updated_at as Timestamp),
  };
};

const competitionFromFirestore = (id: string, data: Record<string, unknown>): Competition => {
  return {
    id,
    athlete_id: data.athlete_id as string,
    name: data.name as string,
    start_date: data.start_date as string,
    end_date: data.end_date as string,
    location_address: data.location_address as string,
    city: data.city as string,
    country: data.country as string,
    additional_info: data.additional_info as string | undefined,
    created_at: convertTimestampToString(data.created_at as Timestamp) || new Date().toISOString(),
    updated_at: convertTimestampToString(data.updated_at as Timestamp) || new Date().toISOString(),
  };
};

// ============================================================================
// HOME LOCATION FUNCTIONS
// ============================================================================

/**
 * Save home location for an athlete
 */
export const saveHomeLocation = async (
  athleteId: string,
  data: LocationWithSchedule
): Promise<LocationWithSchedule> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Saving home location for athlete:', athleteId);

    // Validate the schedule
    validateLocationSchedule(data);

    const docRef = doc(db, COLLECTIONS.HOME_LOCATIONS, athleteId);

    const locationData = {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(docRef, locationData);

    console.log('[Locations] Home location saved successfully');

    // Fetch and return the saved document
    const savedDoc = await getDoc(docRef);
    if (savedDoc.exists()) {
      return locationFromFirestore(savedDoc.data());
    }

    return data;
  } catch (error) {
    console.error('[Locations] Save home location error:', error);
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code, serviceError.field);
  }
};

/**
 * Get home location for an athlete
 */
export const getHomeLocation = async (
  athleteId: string
): Promise<LocationWithSchedule | null> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Fetching home location for athlete:', athleteId);

    const docRef = doc(db, COLLECTIONS.HOME_LOCATIONS, athleteId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('[Locations] No home location found');
      return null;
    }

    console.log('[Locations] Home location found');
    return locationFromFirestore(docSnap.data());
  } catch (error) {
    console.error('[Locations] Get home location error:', error);
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// TRAINING LOCATION FUNCTIONS
// ============================================================================

/**
 * Save training location for an athlete
 */
export const saveTrainingLocation = async (
  athleteId: string,
  data: LocationWithSchedule
): Promise<LocationWithSchedule> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Saving training location for athlete:', athleteId);

    // Validate the schedule
    validateLocationSchedule(data);

    const docRef = doc(db, COLLECTIONS.TRAINING_LOCATIONS, athleteId);

    const locationData = {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(docRef, locationData);

    console.log('[Locations] Training location saved successfully');

    // Fetch and return the saved document
    const savedDoc = await getDoc(docRef);
    if (savedDoc.exists()) {
      return locationFromFirestore(savedDoc.data());
    }

    return data;
  } catch (error) {
    console.error('[Locations] Save training location error:', error);
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code, serviceError.field);
  }
};

/**
 * Get training location for an athlete
 */
export const getTrainingLocation = async (
  athleteId: string
): Promise<LocationWithSchedule | null> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Fetching training location for athlete:', athleteId);

    const docRef = doc(db, COLLECTIONS.TRAINING_LOCATIONS, athleteId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('[Locations] No training location found');
      return null;
    }

    console.log('[Locations] Training location found');
    return locationFromFirestore(docSnap.data());
  } catch (error) {
    console.error('[Locations] Get training location error:', error);
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// GYM LOCATION FUNCTIONS (OPTIONAL)
// ============================================================================

/**
 * Save gym location for an athlete (optional)
 */
export const saveGymLocation = async (
  athleteId: string,
  data: LocationWithSchedule
): Promise<LocationWithSchedule> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Saving gym location for athlete:', athleteId);

    // Validate the schedule
    validateLocationSchedule(data);

    const docRef = doc(db, COLLECTIONS.GYM_LOCATIONS, athleteId);

    const locationData = {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(docRef, locationData);

    console.log('[Locations] Gym location saved successfully');

    // Fetch and return the saved document
    const savedDoc = await getDoc(docRef);
    if (savedDoc.exists()) {
      return locationFromFirestore(savedDoc.data());
    }

    return data;
  } catch (error) {
    console.error('[Locations] Save gym location error:', error);
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code, serviceError.field);
  }
};

/**
 * Get gym location for an athlete
 */
export const getGymLocation = async (
  athleteId: string
): Promise<LocationWithSchedule | null> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Fetching gym location for athlete:', athleteId);

    const docRef = doc(db, COLLECTIONS.GYM_LOCATIONS, athleteId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('[Locations] No gym location found');
      return null;
    }

    console.log('[Locations] Gym location found');
    return locationFromFirestore(docSnap.data());
  } catch (error) {
    console.error('[Locations] Get gym location error:', error);
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code);
  }
};

/**
 * Delete gym location for an athlete
 */
export const deleteGymLocation = async (athleteId: string): Promise<void> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Deleting gym location for athlete:', athleteId);

    const docRef = doc(db, COLLECTIONS.GYM_LOCATIONS, athleteId);
    await deleteDoc(docRef);

    console.log('[Locations] Gym location deleted successfully');
  } catch (error) {
    console.error('[Locations] Delete gym location error:', error);
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// COMPETITION FUNCTIONS
// ============================================================================

/**
 * Add a new competition for an athlete
 */
export const addCompetition = async (
  athleteId: string,
  data: Omit<Competition, 'id' | 'created_at' | 'updated_at'>
): Promise<Competition> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Adding competition for athlete:', athleteId);

    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      throw new LocationValidationError('Competition name is required', 'required_field', 'name');
    }

    if (!data.start_date) {
      throw new LocationValidationError('Start date is required', 'required_field', 'start_date');
    }

    if (!data.end_date) {
      throw new LocationValidationError('End date is required', 'required_field', 'end_date');
    }

    // Validate date range
    validateDateRange(data.start_date, data.end_date);

    if (!data.location_address || data.location_address.trim() === '') {
      throw new LocationValidationError('Location address is required', 'required_field', 'location_address');
    }

    if (!data.city || data.city.trim() === '') {
      throw new LocationValidationError('City is required', 'required_field', 'city');
    }

    if (!data.country || data.country.trim() === '') {
      throw new LocationValidationError('Country is required', 'required_field', 'country');
    }

    const competitionData = {
      athlete_id: athleteId,
      name: data.name.trim(),
      start_date: data.start_date,
      end_date: data.end_date,
      location_address: data.location_address.trim(),
      city: data.city.trim(),
      country: data.country.trim(),
      additional_info: data.additional_info?.trim() || null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.COMPETITIONS), competitionData);

    console.log('[Locations] Competition added:', docRef.id);

    // Fetch and return the created document
    const savedDoc = await getDoc(docRef);
    if (savedDoc.exists()) {
      return competitionFromFirestore(docRef.id, savedDoc.data());
    }

    // Return with current date as fallback
    return {
      id: docRef.id,
      athlete_id: athleteId,
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      location_address: data.location_address,
      city: data.city,
      country: data.country,
      additional_info: data.additional_info,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (error) {
    console.error('[Locations] Add competition error:', error);
    if (error instanceof LocationValidationError) {
      throw error;
    }
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code, serviceError.field);
  }
};

/**
 * Get all competitions for an athlete
 */
export const getAthleteCompetitions = async (athleteId: string): Promise<Competition[]> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Fetching competitions for athlete:', athleteId);

    const q = query(
      collection(db, COLLECTIONS.COMPETITIONS),
      where('athlete_id', '==', athleteId),
      orderBy('start_date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const competitions: Competition[] = [];

    querySnapshot.forEach((doc) => {
      competitions.push(competitionFromFirestore(doc.id, doc.data()));
    });

    console.log('[Locations] Found', competitions.length, 'competitions');
    return competitions;
  } catch (error) {
    console.error('[Locations] Get competitions error:', error);
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code);
  }
};

/**
 * Update a competition
 */
export const updateCompetition = async (
  competitionId: string,
  data: Partial<Competition>
): Promise<Competition> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Updating competition:', competitionId);

    const docRef = doc(db, COLLECTIONS.COMPETITIONS, competitionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new LocationValidationError('Competition not found', 'not_found', 'id');
    }

    // If dates are being updated, validate the range
    const currentData = docSnap.data();
    const newStartDate = data.start_date || currentData.start_date;
    const newEndDate = data.end_date || currentData.end_date;

    if (data.start_date || data.end_date) {
      validateDateRange(newStartDate, newEndDate);
    }

    // Build update object (exclude id, athlete_id, created_at)
    const updateData: Record<string, unknown> = {
      updated_at: serverTimestamp(),
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;
    if (data.location_address !== undefined) updateData.location_address = data.location_address.trim();
    if (data.city !== undefined) updateData.city = data.city.trim();
    if (data.country !== undefined) updateData.country = data.country.trim();
    if (data.additional_info !== undefined) updateData.additional_info = data.additional_info?.trim() || null;

    await updateDoc(docRef, updateData);

    console.log('[Locations] Competition updated successfully');

    // Fetch and return updated document
    const updatedDoc = await getDoc(docRef);
    return competitionFromFirestore(competitionId, updatedDoc.data()!);
  } catch (error) {
    console.error('[Locations] Update competition error:', error);
    if (error instanceof LocationValidationError) {
      throw error;
    }
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code, serviceError.field);
  }
};

/**
 * Delete a competition
 */
export const deleteCompetition = async (competitionId: string): Promise<void> => {
  const db = getFirestoreDb();

  try {
    console.log('[Locations] Deleting competition:', competitionId);

    const docRef = doc(db, COLLECTIONS.COMPETITIONS, competitionId);
    await deleteDoc(docRef);

    console.log('[Locations] Competition deleted successfully');
  } catch (error) {
    console.error('[Locations] Delete competition error:', error);
    const serviceError = handleFirestoreError(error);
    throw new LocationValidationError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// FETCH ALL LOCATIONS
// ============================================================================

/**
 * Fetch all locations and competitions for an athlete in parallel
 */
export const fetchAllAthleteLocations = async (
  athleteId: string
): Promise<{
  homeLocation: LocationWithSchedule | null;
  trainingLocation: LocationWithSchedule | null;
  gymLocation: LocationWithSchedule | null;
  competitions: Competition[];
}> => {
  console.log('[Locations] Fetching all locations for athlete:', athleteId);

  const [homeLocation, trainingLocation, gymLocation, competitions] = await Promise.all([
    getHomeLocation(athleteId),
    getTrainingLocation(athleteId),
    getGymLocation(athleteId),
    getAthleteCompetitions(athleteId),
  ]);

  return {
    homeLocation,
    trainingLocation,
    gymLocation,
    competitions,
  };
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { COLLECTIONS as LOCATION_COLLECTIONS };

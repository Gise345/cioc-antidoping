/**
 * Admin Service
 * Administrative operations for managing athlete accounts
 *
 * Note: Some operations require Firebase Admin SDK which runs server-side.
 * For client-side operations, we use Firebase Auth and Firestore directly.
 * Password updates and user disabling would typically require Cloud Functions.
 */

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from './firebase';
import {
  UserDocument,
  AthleteDocument,
  CreateUserDocument,
  CreateAthleteDocument,
  TestingPoolStatus,
  AthleteStatus,
  Gender,
  ResidenceStatus,
  COLLECTIONS,
} from '../types/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateAthleteAccountData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  nocId: string;
  sport: string;
  sportName?: string;
  residenceStatus: ResidenceStatus;
  testingPoolStatus: TestingPoolStatus;
}

export interface CreateAthleteAccountResult {
  userId: string;
  tempPassword: string;
}

export interface AthleteWithUser {
  id: string;
  user: UserDocument;
  athlete: AthleteDocument;
}

export interface ListAthletesFilters {
  sport?: string;
  residenceStatus?: ResidenceStatus;
  testingPoolStatus?: TestingPoolStatus;
  status?: AthleteStatus;
  searchQuery?: string;
}

export interface AdminServiceError {
  code: string;
  message: string;
  field?: string;
  originalError?: unknown;
}

export class AdminError extends Error {
  code: string;
  field?: string;

  constructor(message: string, code: string = 'admin_error', field?: string) {
    super(message);
    this.name = 'AdminError';
    this.code = code;
    this.field = field;
  }
}

// ============================================================================
// PASSWORD GENERATION
// ============================================================================

/**
 * Character sets for password generation
 */
const CHAR_SETS = {
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ', // Excluded I, O to avoid confusion
  lowercase: 'abcdefghjkmnpqrstuvwxyz', // Excluded i, l, o to avoid confusion
  numbers: '23456789', // Excluded 0, 1 to avoid confusion
  special: '!@#$%&*', // Limited special chars for compatibility
};

/**
 * Generate a secure temporary password
 * - 12 characters long
 * - Includes uppercase, lowercase, numbers, and special characters
 * - Meets Firebase password requirements (min 6 chars)
 */
export const generateTemporaryPassword = (): string => {
  const { uppercase, lowercase, numbers, special } = CHAR_SETS;
  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one character from each set
  const requiredChars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  // Fill remaining with random characters
  const remainingLength = 12 - requiredChars.length;
  const randomChars: string[] = [];

  for (let i = 0; i < remainingLength; i++) {
    randomChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Combine and shuffle
  const passwordArray = [...requiredChars, ...randomChars];
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

const handleError = (error: unknown): AdminServiceError => {
  if (error instanceof AdminError) {
    return {
      code: error.code,
      message: error.message,
      field: error.field,
    };
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message?: string };

    // Map Firebase error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/invalid-email': 'Invalid email address format',
      'auth/weak-password': 'Password does not meet requirements',
      'auth/user-not-found': 'Athlete account not found',
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested resource was not found',
    };

    return {
      code: firebaseError.code,
      message: errorMessages[firebaseError.code] || firebaseError.message || 'An unexpected error occurred',
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

const convertTimestampToDate = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

/**
 * Convert Firestore Timestamp to ISO string for Redux serialization
 */
const convertTimestampToISO = (timestamp: Timestamp | Date | string | undefined): string | undefined => {
  if (!timestamp) return undefined;
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  // Handle plain object with seconds/nanoseconds (already serialized Timestamp)
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date((timestamp as { seconds: number }).seconds * 1000).toISOString();
  }
  return undefined;
};

const userFromFirestore = (data: Record<string, unknown>): UserDocument => {
  return {
    email: data.email as string,
    role: data.role as UserDocument['role'],
    email_verified: data.email_verified as boolean,
    phone_verified: data.phone_verified as boolean,
    is_active: data.is_active as boolean,
    requires_password_change: data.requires_password_change as boolean,
    last_login_at: convertTimestampToISO(data.last_login_at as Timestamp | undefined) as string | undefined,
    fcm_tokens: data.fcm_tokens as string[] | undefined,
    created_at: convertTimestampToISO(data.created_at as Timestamp) as string,
    updated_at: convertTimestampToISO(data.updated_at as Timestamp) as string,
  };
};

const athleteFromFirestore = (data: Record<string, unknown>): AthleteDocument => {
  return {
    user_id: data.user_id as string,
    first_name: data.first_name as string,
    last_name: data.last_name as string,
    phone: data.phone as string,
    date_of_birth: data.date_of_birth as string,
    gender: data.gender as Gender,
    sport_id: data.sport_id as string,
    sport_name: data.sport_name as string | undefined,
    nationality: data.nationality as string,
    noc_id: data.noc_id as string,
    residence_status: data.residence_status as ResidenceStatus,
    testing_pool_status: data.testing_pool_status as TestingPoolStatus,
    status: data.status as AthleteStatus,
    wada_id: data.wada_id as string | undefined,
    cioc_athlete_number: data.cioc_athlete_number as string | undefined,
    profile_photo_url: data.profile_photo_url as string | undefined,
    emergency_contact: data.emergency_contact as AthleteDocument['emergency_contact'],
    created_at: convertTimestampToISO(data.created_at as Timestamp) as string,
    updated_at: convertTimestampToISO(data.updated_at as Timestamp) as string,
  };
};

// ============================================================================
// ATHLETE ACCOUNT CREATION
// ============================================================================

/**
 * Create a new athlete account
 * - Generates temporary password
 * - Creates Firebase Auth user
 * - Creates user document in Firestore
 * - Creates athlete document in Firestore
 */
export const createAthleteAccount = async (
  data: CreateAthleteAccountData
): Promise<CreateAthleteAccountResult> => {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Creating athlete account for:', data.email);

    // Validate required fields
    validateCreateAthleteData(data);

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();

    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      tempPassword
    );
    const firebaseUser = userCredential.user;
    console.log('[Admin] Firebase Auth user created:', firebaseUser.uid);

    // Step 2: Update display name
    await updateProfile(firebaseUser, {
      displayName: `${data.firstName} ${data.lastName}`,
    });

    // Step 3: Create user document in Firestore
    const userDoc: CreateUserDocument = {
      email: data.email,
      role: 'athlete',
      email_verified: false,
      phone_verified: false,
      is_active: true,
      requires_password_change: true,
    };

    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      ...userDoc,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    console.log('[Admin] User document created');

    // Step 4: Create athlete document in Firestore
    const athleteDoc: CreateAthleteDocument = {
      user_id: firebaseUser.uid,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      sport_id: data.sport,
      sport_name: data.sportName,
      nationality: 'Cayman Islands',
      noc_id: data.nocId,
      residence_status: data.residenceStatus,
      testing_pool_status: data.testingPoolStatus,
      status: 'active',
    };

    await setDoc(doc(db, COLLECTIONS.ATHLETES, firebaseUser.uid), {
      ...athleteDoc,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    console.log('[Admin] Athlete document created');

    // TODO: Send welcome email with temporary password
    // This would typically be done via Cloud Functions
    console.log('[Admin] TODO: Send welcome email to:', data.email);

    return {
      userId: firebaseUser.uid,
      tempPassword,
    };
  } catch (error) {
    console.error('[Admin] Create athlete account error:', error);
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code, serviceError.field);
  }
};

/**
 * Validate create athlete data
 */
const validateCreateAthleteData = (data: CreateAthleteAccountData): void => {
  if (!data.firstName || data.firstName.trim().length < 2) {
    throw new AdminError('First name must be at least 2 characters', 'validation_error', 'firstName');
  }
  if (!data.lastName || data.lastName.trim().length < 2) {
    throw new AdminError('Last name must be at least 2 characters', 'validation_error', 'lastName');
  }
  if (!data.email || !isValidEmail(data.email)) {
    throw new AdminError('Please enter a valid email address', 'validation_error', 'email');
  }
  if (!data.phone) {
    throw new AdminError('Phone number is required', 'validation_error', 'phone');
  }
  if (!data.dateOfBirth) {
    throw new AdminError('Date of birth is required', 'validation_error', 'dateOfBirth');
  }
  if (!data.gender) {
    throw new AdminError('Gender is required', 'validation_error', 'gender');
  }
  if (!data.nocId) {
    throw new AdminError('National Olympic Committee is required', 'validation_error', 'nocId');
  }
  if (!data.sport) {
    throw new AdminError('Sport is required', 'validation_error', 'sport');
  }
  if (!data.residenceStatus) {
    throw new AdminError('Residence status is required', 'validation_error', 'residenceStatus');
  }
  if (!data.testingPoolStatus) {
    throw new AdminError('Testing pool status is required', 'validation_error', 'testingPoolStatus');
  }
};

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ============================================================================
// ATHLETE LISTING & RETRIEVAL
// ============================================================================

/**
 * List all athletes with optional filters
 */
export const listAthletes = async (
  filters?: ListAthletesFilters
): Promise<AthleteWithUser[]> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Listing athletes with filters:', filters);

    // Build query
    let q = query(
      collection(db, COLLECTIONS.ATHLETES),
      orderBy('created_at', 'desc'),
      limit(100)
    );

    // Apply filters
    if (filters?.sport) {
      q = query(q, where('sport_id', '==', filters.sport));
    }
    if (filters?.residenceStatus) {
      q = query(q, where('residence_status', '==', filters.residenceStatus));
    }
    if (filters?.testingPoolStatus) {
      q = query(q, where('testing_pool_status', '==', filters.testingPoolStatus));
    }
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    const querySnapshot = await getDocs(q);
    const athletes: AthleteWithUser[] = [];

    // Fetch user data for each athlete
    for (const athleteDoc of querySnapshot.docs) {
      const athleteData = athleteFromFirestore(athleteDoc.data());
      const athleteId = athleteDoc.id;

      // Get user document
      const userDocRef = doc(db, COLLECTIONS.USERS, athleteId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userFromFirestore(userDocSnap.data());

        // Apply search filter in memory (case-insensitive)
        if (filters?.searchQuery) {
          const searchLower = filters.searchQuery.toLowerCase();
          const fullName = `${athleteData.first_name} ${athleteData.last_name}`.toLowerCase();
          const email = userData.email.toLowerCase();

          if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
            continue; // Skip this athlete
          }
        }

        athletes.push({
          id: athleteId,
          user: userData,
          athlete: athleteData,
        });
      }
    }

    console.log('[Admin] Found', athletes.length, 'athletes');
    return athletes;
  } catch (error) {
    console.error('[Admin] List athletes error:', error);
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

/**
 * Get detailed athlete information
 */
export const getAthleteDetails = async (
  athleteId: string
): Promise<{ user: UserDocument; athlete: AthleteDocument }> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Getting athlete details for:', athleteId);

    // Fetch both documents in parallel
    const [userDocSnap, athleteDocSnap] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.USERS, athleteId)),
      getDoc(doc(db, COLLECTIONS.ATHLETES, athleteId)),
    ]);

    if (!userDocSnap.exists()) {
      throw new AdminError('User account not found', 'not_found', 'userId');
    }
    if (!athleteDocSnap.exists()) {
      throw new AdminError('Athlete profile not found', 'not_found', 'athleteId');
    }

    const user = userFromFirestore(userDocSnap.data());
    const athlete = athleteFromFirestore(athleteDocSnap.data());

    console.log('[Admin] Athlete details retrieved');
    return { user, athlete };
  } catch (error) {
    console.error('[Admin] Get athlete details error:', error);
    if (error instanceof AdminError) {
      throw error;
    }
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// ATHLETE UPDATES
// ============================================================================

/**
 * Update athlete details
 */
export const updateAthleteDetails = async (
  athleteId: string,
  data: Partial<AthleteDocument>
): Promise<void> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Updating athlete:', athleteId);

    // Verify athlete exists
    const athleteDocRef = doc(db, COLLECTIONS.ATHLETES, athleteId);
    const athleteDocSnap = await getDoc(athleteDocRef);

    if (!athleteDocSnap.exists()) {
      throw new AdminError('Athlete not found', 'not_found', 'athleteId');
    }

    // Remove fields that shouldn't be updated directly
    const { user_id, created_at, updated_at, ...updateData } = data as Record<string, unknown>;

    // Update athlete document
    await updateDoc(athleteDocRef, {
      ...updateData,
      updated_at: serverTimestamp(),
    });

    console.log('[Admin] Athlete updated successfully');
  } catch (error) {
    console.error('[Admin] Update athlete error:', error);
    if (error instanceof AdminError) {
      throw error;
    }
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// ACCOUNT STATUS MANAGEMENT
// ============================================================================

/**
 * Deactivate an athlete account
 * - Sets athlete status to inactive
 * - Sets user is_active to false
 * Note: Disabling Firebase Auth would require Admin SDK (Cloud Functions)
 */
export const deactivateAthlete = async (athleteId: string): Promise<void> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Deactivating athlete:', athleteId);

    // Verify athlete exists
    const athleteDocRef = doc(db, COLLECTIONS.ATHLETES, athleteId);
    const userDocRef = doc(db, COLLECTIONS.USERS, athleteId);

    const [athleteDocSnap, userDocSnap] = await Promise.all([
      getDoc(athleteDocRef),
      getDoc(userDocRef),
    ]);

    if (!athleteDocSnap.exists() || !userDocSnap.exists()) {
      throw new AdminError('Athlete account not found', 'not_found', 'athleteId');
    }

    // Update both documents
    await Promise.all([
      updateDoc(athleteDocRef, {
        status: 'inactive',
        updated_at: serverTimestamp(),
      }),
      updateDoc(userDocRef, {
        is_active: false,
        updated_at: serverTimestamp(),
      }),
    ]);

    // TODO: Disable Firebase Auth user (requires Admin SDK / Cloud Function)
    console.log('[Admin] TODO: Disable Firebase Auth user');
    console.log('[Admin] Athlete deactivated successfully');
  } catch (error) {
    console.error('[Admin] Deactivate athlete error:', error);
    if (error instanceof AdminError) {
      throw error;
    }
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

/**
 * Reactivate an athlete account
 * - Sets athlete status to active
 * - Sets user is_active to true
 * Note: Enabling Firebase Auth would require Admin SDK (Cloud Functions)
 */
export const reactivateAthlete = async (athleteId: string): Promise<void> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Reactivating athlete:', athleteId);

    // Verify athlete exists
    const athleteDocRef = doc(db, COLLECTIONS.ATHLETES, athleteId);
    const userDocRef = doc(db, COLLECTIONS.USERS, athleteId);

    const [athleteDocSnap, userDocSnap] = await Promise.all([
      getDoc(athleteDocRef),
      getDoc(userDocRef),
    ]);

    if (!athleteDocSnap.exists() || !userDocSnap.exists()) {
      throw new AdminError('Athlete account not found', 'not_found', 'athleteId');
    }

    // Update both documents
    await Promise.all([
      updateDoc(athleteDocRef, {
        status: 'active',
        updated_at: serverTimestamp(),
      }),
      updateDoc(userDocRef, {
        is_active: true,
        updated_at: serverTimestamp(),
      }),
    ]);

    // TODO: Enable Firebase Auth user (requires Admin SDK / Cloud Function)
    console.log('[Admin] TODO: Enable Firebase Auth user');
    console.log('[Admin] Athlete reactivated successfully');
  } catch (error) {
    console.error('[Admin] Reactivate athlete error:', error);
    if (error instanceof AdminError) {
      throw error;
    }
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Reset an athlete's password
 * - Generates new temporary password
 * - Sends password reset email
 * Note: Directly updating password requires Admin SDK (Cloud Functions)
 *       For now, we send a password reset email
 */
export const resetAthletePassword = async (
  athleteId: string,
  email: string
): Promise<string> => {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Resetting password for athlete:', athleteId);

    // Verify athlete exists
    const userDocRef = doc(db, COLLECTIONS.USERS, athleteId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new AdminError('User account not found', 'not_found', 'athleteId');
    }

    const userData = userDocSnap.data();
    if (userData.email !== email) {
      throw new AdminError('Email does not match athlete account', 'validation_error', 'email');
    }

    // Generate new temporary password
    const newTempPassword = generateTemporaryPassword();

    // For now, send password reset email instead of directly updating
    // Direct password update would require Admin SDK
    await sendPasswordResetEmail(auth, email);

    // Mark that password change is required
    await updateDoc(userDocRef, {
      requires_password_change: true,
      updated_at: serverTimestamp(),
    });

    // TODO: Directly update password using Admin SDK (Cloud Function)
    // For now, we return the temp password for admin to manually communicate
    console.log('[Admin] Password reset email sent to:', email);
    console.log('[Admin] Generated temp password (for manual communication):', newTempPassword);

    return newTempPassword;
  } catch (error) {
    console.error('[Admin] Reset password error:', error);
    if (error instanceof AdminError) {
      throw error;
    }
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get athlete statistics for admin dashboard
 */
export const getAthleteStatistics = async (): Promise<{
  totalAthletes: number;
  activeAthletes: number;
  inactiveAthletes: number;
  byTestingPool: { NONE: number; RTP: number; TP: number };
  bySport: Record<string, number>;
  byResidenceStatus: { local: number; overseas: number };
}> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Fetching athlete statistics');

    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ATHLETES));

    const stats = {
      totalAthletes: 0,
      activeAthletes: 0,
      inactiveAthletes: 0,
      byTestingPool: { NONE: 0, RTP: 0, TP: 0 },
      bySport: {} as Record<string, number>,
      byResidenceStatus: { local: 0, overseas: 0 },
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.totalAthletes++;

      // Status
      if (data.status === 'active') {
        stats.activeAthletes++;
      } else {
        stats.inactiveAthletes++;
      }

      // Testing pool
      const testingPool = data.testing_pool_status as TestingPoolStatus;
      if (testingPool in stats.byTestingPool) {
        stats.byTestingPool[testingPool]++;
      }

      // Sport
      const sportName = data.sport_name || data.sport_id;
      if (sportName) {
        stats.bySport[sportName] = (stats.bySport[sportName] || 0) + 1;
      }

      // Residence status
      const residence = data.residence_status as ResidenceStatus;
      if (residence in stats.byResidenceStatus) {
        stats.byResidenceStatus[residence]++;
      }
    });

    console.log('[Admin] Statistics retrieved:', stats);
    return stats;
  } catch (error) {
    console.error('[Admin] Get statistics error:', error);
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

/**
 * Get recently created athletes
 */
export const getRecentAthletes = async (limitCount: number = 5): Promise<AthleteWithUser[]> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Fetching recent athletes');

    const q = query(
      collection(db, COLLECTIONS.ATHLETES),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const athletes: AthleteWithUser[] = [];

    for (const athleteDoc of querySnapshot.docs) {
      const athleteData = athleteFromFirestore(athleteDoc.data());
      const athleteId = athleteDoc.id;

      const userDocRef = doc(db, COLLECTIONS.USERS, athleteId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        athletes.push({
          id: athleteId,
          user: userFromFirestore(userDocSnap.data()),
          athlete: athleteData,
        });
      }
    }

    return athletes;
  } catch (error) {
    console.error('[Admin] Get recent athletes error:', error);
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// ADMIN USER MANAGEMENT (Super Admin Only)
// ============================================================================

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * List all admin users (super_admin only)
 */
export const listAdminUsers = async (): Promise<AdminUser[]> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Listing admin users');

    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('role', 'in', ['admin', 'super_admin']),
      orderBy('created_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const admins: AdminUser[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      admins.push({
        id: docSnap.id,
        email: data.email,
        role: data.role,
        is_active: data.is_active ?? true,
        created_at: convertTimestampToISO(data.created_at as Timestamp) || new Date().toISOString(),
        updated_at: convertTimestampToISO(data.updated_at as Timestamp) || new Date().toISOString(),
      });
    });

    console.log('[Admin] Found', admins.length, 'admin users');
    return admins;
  } catch (error) {
    console.error('[Admin] List admin users error:', error);
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

/**
 * Create a new admin account (super_admin only)
 */
export const createAdminAccount = async (
  email: string,
  role: 'admin' | 'super_admin' = 'admin'
): Promise<{ userId: string; tempPassword: string }> => {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Creating admin account for:', email);

    // Validate email
    if (!email || !isValidEmail(email)) {
      throw new AdminError('Please enter a valid email address', 'validation_error', 'email');
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      tempPassword
    );
    const firebaseUser = userCredential.user;
    console.log('[Admin] Firebase Auth user created:', firebaseUser.uid);

    // Create user document in Firestore
    const userDoc: CreateUserDocument = {
      email: email,
      role: role,
      email_verified: false,
      phone_verified: false,
      is_active: true,
      requires_password_change: true,
    };

    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      ...userDoc,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    console.log('[Admin] Admin user document created');

    return {
      userId: firebaseUser.uid,
      tempPassword,
    };
  } catch (error) {
    console.error('[Admin] Create admin account error:', error);
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

/**
 * Update admin role (super_admin only)
 */
export const updateAdminRole = async (
  userId: string,
  newRole: 'admin' | 'super_admin'
): Promise<void> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Updating admin role:', userId, 'to', newRole);

    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new AdminError('Admin user not found', 'not_found', 'userId');
    }

    const userData = userDocSnap.data();
    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      throw new AdminError('User is not an admin', 'validation_error', 'role');
    }

    await updateDoc(userDocRef, {
      role: newRole,
      updated_at: serverTimestamp(),
    });

    console.log('[Admin] Admin role updated successfully');
  } catch (error) {
    console.error('[Admin] Update admin role error:', error);
    if (error instanceof AdminError) {
      throw error;
    }
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

/**
 * Deactivate admin account (super_admin only)
 */
export const deactivateAdminAccount = async (userId: string): Promise<void> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Deactivating admin account:', userId);

    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new AdminError('Admin user not found', 'not_found', 'userId');
    }

    const userData = userDocSnap.data();
    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      throw new AdminError('User is not an admin', 'validation_error', 'role');
    }

    await updateDoc(userDocRef, {
      is_active: false,
      updated_at: serverTimestamp(),
    });

    console.log('[Admin] Admin account deactivated successfully');
  } catch (error) {
    console.error('[Admin] Deactivate admin error:', error);
    if (error instanceof AdminError) {
      throw error;
    }
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

/**
 * Reactivate admin account (super_admin only)
 */
export const reactivateAdminAccount = async (userId: string): Promise<void> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Reactivating admin account:', userId);

    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new AdminError('Admin user not found', 'not_found', 'userId');
    }

    await updateDoc(userDocRef, {
      is_active: true,
      updated_at: serverTimestamp(),
    });

    console.log('[Admin] Admin account reactivated successfully');
  } catch (error) {
    console.error('[Admin] Reactivate admin error:', error);
    if (error instanceof AdminError) {
      throw error;
    }
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

/**
 * Remove admin privileges (demote to no role / delete user doc)
 */
export const removeAdminAccount = async (userId: string): Promise<void> => {
  const db = getFirestoreDb();

  try {
    console.log('[Admin] Removing admin account:', userId);

    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new AdminError('Admin user not found', 'not_found', 'userId');
    }

    // Set role to undefined/null to revoke access
    // Or we could set is_active to false
    await updateDoc(userDocRef, {
      is_active: false,
      role: 'athlete', // Demote to athlete role (no admin access)
      updated_at: serverTimestamp(),
    });

    console.log('[Admin] Admin account removed successfully');
  } catch (error) {
    console.error('[Admin] Remove admin error:', error);
    if (error instanceof AdminError) {
      throw error;
    }
    const serviceError = handleError(error);
    throw new AdminError(serviceError.message, serviceError.code);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  UserDocument,
  AthleteDocument,
  TestingPoolStatus,
  AthleteStatus,
  Gender,
  ResidenceStatus,
};

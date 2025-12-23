/**
 * Authentication Service
 * Firebase Auth and Firestore operations for user management
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
  AuthError,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from './firebase';
import {
  UserDocument,
  AthleteDocument,
  CreateUserDocument,
  CreateAthleteDocument,
  COLLECTIONS,
  Gender,
} from '../types/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  sportId: string;
  sportName?: string;
  nationality?: string;
}

export interface AuthResult {
  success: boolean;
  user?: FirebaseUser;
  userProfile?: UserDocument;
  athleteProfile?: AthleteDocument;
  requiresPasswordChange?: boolean;
  error?: AuthServiceError;
}

export interface AuthServiceError {
  code: string;
  message: string;
  originalError?: unknown;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Map Firebase error codes to user-friendly messages
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Sign up errors
  'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
  'auth/weak-password': 'Password is too weak. Please use at least 8 characters with numbers and letters.',

  // Sign in errors
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email. Please check your email or sign up.',
  'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
  'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',

  // Rate limiting
  'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again in a few minutes.',

  // Network errors
  'auth/network-request-failed': 'Network error. Please check your internet connection.',

  // Password reset errors
  'auth/expired-action-code': 'This password reset link has expired. Please request a new one.',
  'auth/invalid-action-code': 'This password reset link is invalid. Please request a new one.',

  // Generic errors
  'auth/internal-error': 'An unexpected error occurred. Please try again.',
};

/**
 * Get user-friendly error message from Firebase error
 */
/**
 * Convert Firestore Timestamps to ISO strings for Redux serialization
 */
const convertTimestamps = <T extends Record<string, unknown>>(data: T): T => {
  const converted = { ...data };
  for (const key in converted) {
    const value = converted[key];
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      // It's a Firestore Timestamp
      (converted as Record<string, unknown>)[key] = (value as Timestamp).toDate().toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively convert nested objects
      (converted as Record<string, unknown>)[key] = convertTimestamps(value as Record<string, unknown>);
    }
  }
  return converted;
};

const getErrorMessage = (error: unknown): AuthServiceError => {
  if (error && typeof error === 'object' && 'code' in error) {
    const authError = error as AuthError;
    const message = AUTH_ERROR_MESSAGES[authError.code] || 'An unexpected error occurred. Please try again.';
    return {
      code: authError.code,
      message,
      originalError: error,
    };
  }

  return {
    code: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    originalError: error,
  };
};

// ============================================================================
// AUTHENTICATION OPERATIONS
// ============================================================================

/**
 * Register a new user with email and password
 * Creates both Firebase Auth user and Firestore documents
 */
export const register = async (data: RegisterData): Promise<AuthResult> => {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();

  try {
    console.log('[Auth] Starting registration for:', data.email);

    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    const firebaseUser = userCredential.user;
    console.log('[Auth] Firebase user created:', firebaseUser.uid);

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
    };

    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
      ...userDoc,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    console.log('[Auth] User document created');

    // Step 4: Create athlete profile document
    const athleteDoc: CreateAthleteDocument = {
      user_id: firebaseUser.uid,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
      sport_id: data.sportId,
      sport_name: data.sportName,
      nationality: data.nationality || 'Cayman Islands',
      testing_pool_status: 'NONE',
      status: 'active',
    };

    await setDoc(doc(db, COLLECTIONS.ATHLETES, firebaseUser.uid), {
      ...athleteDoc,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    console.log('[Auth] Athlete document created');

    // Step 5: Send email verification
    try {
      await sendEmailVerification(firebaseUser);
      console.log('[Auth] Verification email sent');
    } catch (verifyError) {
      // Don't fail registration if email verification fails
      console.warn('[Auth] Failed to send verification email:', verifyError);
    }

    // Step 6: Fetch created profiles to return
    const userProfile = await getUserProfile(firebaseUser.uid);
    const athleteProfile = await getAthleteProfile(firebaseUser.uid);

    return {
      success: true,
      user: firebaseUser,
      userProfile: userProfile || undefined,
      athleteProfile: athleteProfile || undefined,
    };
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const auth = getFirebaseAuth();

  try {
    console.log('[Auth] Signing in:', email);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('[Auth] Sign in successful:', firebaseUser.uid);

    // Update last login timestamp
    await updateLastLogin(firebaseUser.uid);

    // Fetch user profiles
    const userProfile = await getUserProfile(firebaseUser.uid);
    const athleteProfile = await getAthleteProfile(firebaseUser.uid);

    // Check if user is active
    if (userProfile && !userProfile.is_active) {
      await firebaseSignOut(auth);
      return {
        success: false,
        error: {
          code: 'auth/user-disabled',
          message: 'This account has been deactivated. Please contact support.',
        },
      };
    }

    // Check if password change is required (for admin-created accounts)
    const requiresPasswordChange = await checkRequiresPasswordChange(firebaseUser.uid);
    console.log('[Auth] Requires password change:', requiresPasswordChange);

    return {
      success: true,
      user: firebaseUser,
      userProfile: userProfile || undefined,
      athleteProfile: athleteProfile || undefined,
      requiresPasswordChange,
    };
  } catch (error) {
    console.error('[Auth] Sign in error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<AuthResult> => {
  const auth = getFirebaseAuth();

  try {
    console.log('[Auth] Signing out');
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('[Auth] Sign out error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<AuthResult> => {
  const auth = getFirebaseAuth();

  try {
    console.log('[Auth] Sending password reset to:', email);
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('[Auth] Password reset error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Resend email verification
 */
export const resendVerificationEmail = async (): Promise<AuthResult> => {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    return {
      success: false,
      error: {
        code: 'auth/no-user',
        message: 'No user is currently signed in.',
      },
    };
  }

  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch (error) {
    console.error('[Auth] Resend verification error:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

// ============================================================================
// PROFILE OPERATIONS
// ============================================================================

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId: string): Promise<UserDocument | null> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Convert Timestamps to ISO strings for Redux serialization
      return convertTimestamps(docSnap.data()) as UserDocument;
    }
    return null;
  } catch (error) {
    console.error('[Auth] Error fetching user profile:', error);
    return null;
  }
};

/**
 * Get athlete profile from Firestore
 */
export const getAthleteProfile = async (userId: string): Promise<AthleteDocument | null> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.ATHLETES, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Convert Timestamps to ISO strings for Redux serialization
      return convertTimestamps(docSnap.data()) as AthleteDocument;
    }
    return null;
  } catch (error) {
    console.error('[Auth] Error fetching athlete profile:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: Partial<UserDocument>
): Promise<AuthResult> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('[Auth] Error updating user profile:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Update athlete profile
 */
export const updateAthleteProfile = async (
  userId: string,
  data: Partial<AthleteDocument>
): Promise<AuthResult> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.ATHLETES, userId);
    await updateDoc(docRef, {
      ...data,
      updated_at: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('[Auth] Error updating athlete profile:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Update last login timestamp
 */
const updateLastLogin = async (userId: string): Promise<void> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      last_login_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    // Don't throw - this is not critical
    console.warn('[Auth] Failed to update last login:', error);
  }
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
 */
export const validatePassword = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate Cayman phone number format
 * Format: +1-345-xxx-xxxx or similar variations
 */
export const isValidCaymanPhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Should be 10 digits (without country code) or 11 (with 1)
  if (digits.length === 10) {
    return digits.startsWith('345');
  }
  if (digits.length === 11) {
    return digits.startsWith('1345');
  }
  return false;
};

// ============================================================================
// FIRST LOGIN / PASSWORD CHANGE OPERATIONS
// ============================================================================

/**
 * Check if user requires password change (first login with admin-created account)
 * @param userId - The user's Firebase UID
 * @returns true if password change is required, false otherwise
 */
export const checkRequiresPasswordChange = async (userId: string): Promise<boolean> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // If user document doesn't exist, require password change for safety
      console.warn('[Auth] User document not found, requiring password change');
      return true;
    }

    const userData = docSnap.data();
    // Return true if field doesn't exist (for safety) or if explicitly set to true
    return userData.requires_password_change !== false;
  } catch (error) {
    console.error('[Auth] Error checking password change requirement:', error);
    // Return true on error for safety
    return true;
  }
};

/**
 * Change user password (for first login or profile password change)
 * @param currentPassword - The current/temporary password
 * @param newPassword - The new password
 * @returns AuthResult with success/error status
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<AuthResult> => {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user || !user.email) {
    return {
      success: false,
      error: {
        code: 'auth/no-user',
        message: 'No user is currently signed in.',
      },
    };
  }

  try {
    console.log('[Auth] Changing password for user:', user.uid);

    // Step 1: Re-authenticate with current password (security requirement)
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    console.log('[Auth] Re-authentication successful');

    // Step 2: Update password in Firebase Auth
    await updatePassword(user, newPassword);
    console.log('[Auth] Password updated in Firebase Auth');

    // Step 3: Update Firestore user document
    await markPasswordChanged(user.uid);
    console.log('[Auth] Firestore document updated');

    return { success: true };
  } catch (error) {
    console.error('[Auth] Change password error:', error);

    // Handle specific error cases
    if (error && typeof error === 'object' && 'code' in error) {
      const authError = error as AuthError;

      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        return {
          success: false,
          error: {
            code: authError.code,
            message: 'The current password you entered is incorrect.',
          },
        };
      }

      if (authError.code === 'auth/weak-password') {
        return {
          success: false,
          error: {
            code: authError.code,
            message: 'The new password is too weak. Please use a stronger password.',
          },
        };
      }

      if (authError.code === 'auth/requires-recent-login') {
        return {
          success: false,
          error: {
            code: authError.code,
            message: 'Please sign out and sign in again before changing your password.',
          },
        };
      }
    }

    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Mark password as changed in Firestore
 * Updates the user document to indicate password change is no longer required
 * @param userId - The user's Firebase UID
 */
export const markPasswordChanged = async (userId: string): Promise<AuthResult> => {
  const db = getFirestoreDb();

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      requires_password_change: false,
      password_changed_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    console.log('[Auth] Marked password as changed for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('[Auth] Error marking password changed:', error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * Validate date of birth (must be at least 10 years old)
 */
export const isValidDateOfBirth = (dateString: string): {
  valid: boolean;
  error?: string;
} => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  const today = new Date();
  const age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  const actualAge =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
      ? age - 1
      : age;

  if (actualAge < 10) {
    return { valid: false, error: 'You must be at least 10 years old' };
  }
  if (actualAge > 100) {
    return { valid: false, error: 'Please enter a valid date of birth' };
  }

  return { valid: true };
};

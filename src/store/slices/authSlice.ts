/**
 * Auth Slice
 * Redux state management for authentication
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User as FirebaseUser } from 'firebase/auth';
import {
  register as authRegister,
  signIn as authSignIn,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  getUserProfile,
  getAthleteProfile,
  updateAthleteProfile,
  checkRequiresPasswordChange,
  changePassword as authChangePassword,
  RegisterData,
  AuthServiceError,
} from '../../api/auth';
import { subscribeToAuthChanges, waitForAuthReady } from '../../api/firebase';
import { UserDocument, AthleteDocument } from '../../types/firestore';

// ============================================================================
// STATE TYPES
// ============================================================================

export interface SerializedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

export interface AuthState {
  // User data
  user: SerializedUser | null;
  userProfile: UserDocument | null;
  athlete: AthleteDocument | null;

  // Status flags
  isAuthenticated: boolean;
  isInitialized: boolean;

  // First login / password change flags
  requiresPasswordChange: boolean;
  isFirstLogin: boolean;

  // Loading states
  loading: boolean;
  loginLoading: boolean;
  registerLoading: boolean;
  resetPasswordLoading: boolean;
  profileLoading: boolean;
  passwordChangeLoading: boolean;

  // Error state
  error: AuthServiceError | null;

  // Registration flow state
  registrationStep: number;
  registrationData: Partial<RegisterData> | null;
}

const initialState: AuthState = {
  user: null,
  userProfile: null,
  athlete: null,
  isAuthenticated: false,
  isInitialized: false,
  requiresPasswordChange: false,
  isFirstLogin: false,
  loading: false,
  loginLoading: false,
  registerLoading: false,
  resetPasswordLoading: false,
  profileLoading: false,
  passwordChangeLoading: false,
  error: null,
  registrationStep: 1,
  registrationData: null,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Serialize Firebase User to plain object (for Redux storage)
 */
const serializeUser = (user: FirebaseUser): SerializedUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  emailVerified: user.emailVerified,
  phoneNumber: user.phoneNumber,
});

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Initialize auth state on app startup
 * Checks for existing session and loads user data
 */
export const initializeAuth = createAsyncThunk<
  {
    user: SerializedUser | null;
    userProfile: UserDocument | null;
    athlete: AthleteDocument | null;
  },
  void,
  { rejectValue: AuthServiceError }
>('auth/initialize', async (_, { rejectWithValue }) => {
  try {
    console.log('[AuthSlice] Initializing auth state');

    // Wait for Firebase auth to be ready
    const firebaseUser = await waitForAuthReady();

    if (!firebaseUser) {
      console.log('[AuthSlice] No authenticated user');
      return { user: null, userProfile: null, athlete: null };
    }

    console.log('[AuthSlice] User found:', firebaseUser.uid);

    // Fetch user profiles
    const [userProfile, athlete] = await Promise.all([
      getUserProfile(firebaseUser.uid),
      getAthleteProfile(firebaseUser.uid),
    ]);

    return {
      user: serializeUser(firebaseUser),
      userProfile,
      athlete,
    };
  } catch (error) {
    console.error('[AuthSlice] Initialize error:', error);
    return rejectWithValue({
      code: 'init/error',
      message: 'Failed to initialize authentication',
    });
  }
});

/**
 * Login with email and password
 */
export const loginAsync = createAsyncThunk<
  {
    user: SerializedUser;
    userProfile: UserDocument | null;
    athlete: AthleteDocument | null;
    requiresPasswordChange: boolean;
  },
  { email: string; password: string },
  { rejectValue: AuthServiceError }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    console.log('[AuthSlice] Login attempt:', email);

    const result = await authSignIn(email, password);

    if (!result.success || !result.user) {
      return rejectWithValue(result.error || {
        code: 'auth/unknown',
        message: 'Login failed',
      });
    }

    return {
      user: serializeUser(result.user),
      userProfile: result.userProfile || null,
      athlete: result.athleteProfile || null,
      requiresPasswordChange: result.requiresPasswordChange || false,
    };
  } catch (error) {
    console.error('[AuthSlice] Login error:', error);
    return rejectWithValue({
      code: 'auth/unknown',
      message: 'An unexpected error occurred during login',
    });
  }
});

/**
 * Register new user
 */
export const registerAsync = createAsyncThunk<
  {
    user: SerializedUser;
    userProfile: UserDocument | null;
    athlete: AthleteDocument | null;
  },
  RegisterData,
  { rejectValue: AuthServiceError }
>('auth/register', async (data, { rejectWithValue }) => {
  try {
    console.log('[AuthSlice] Registration attempt:', data.email);

    const result = await authRegister(data);

    if (!result.success || !result.user) {
      return rejectWithValue(result.error || {
        code: 'auth/unknown',
        message: 'Registration failed',
      });
    }

    return {
      user: serializeUser(result.user),
      userProfile: result.userProfile || null,
      athlete: result.athleteProfile || null,
    };
  } catch (error) {
    console.error('[AuthSlice] Registration error:', error);
    return rejectWithValue({
      code: 'auth/unknown',
      message: 'An unexpected error occurred during registration',
    });
  }
});

/**
 * Logout current user
 */
export const logoutAsync = createAsyncThunk<
  void,
  void,
  { rejectValue: AuthServiceError }
>('auth/logout', async (_, { rejectWithValue }) => {
  try {
    console.log('[AuthSlice] Logout');
    const result = await authSignOut();

    if (!result.success) {
      return rejectWithValue(result.error || {
        code: 'auth/unknown',
        message: 'Logout failed',
      });
    }
  } catch (error) {
    console.error('[AuthSlice] Logout error:', error);
    return rejectWithValue({
      code: 'auth/unknown',
      message: 'An unexpected error occurred during logout',
    });
  }
});

/**
 * Send password reset email
 */
export const resetPasswordAsync = createAsyncThunk<
  void,
  string,
  { rejectValue: AuthServiceError }
>('auth/resetPassword', async (email, { rejectWithValue }) => {
  try {
    console.log('[AuthSlice] Password reset for:', email);

    const result = await authResetPassword(email);

    if (!result.success) {
      return rejectWithValue(result.error || {
        code: 'auth/unknown',
        message: 'Password reset failed',
      });
    }
  } catch (error) {
    console.error('[AuthSlice] Password reset error:', error);
    return rejectWithValue({
      code: 'auth/unknown',
      message: 'An unexpected error occurred',
    });
  }
});

/**
 * Reload user profile from Firestore
 */
export const loadUserProfile = createAsyncThunk<
  {
    userProfile: UserDocument | null;
    athlete: AthleteDocument | null;
  },
  void,
  { rejectValue: AuthServiceError; state: { auth: AuthState } }
>('auth/loadProfile', async (_, { getState, rejectWithValue }) => {
  try {
    const { user } = getState().auth;

    if (!user) {
      return rejectWithValue({
        code: 'auth/no-user',
        message: 'No user logged in',
      });
    }

    const [userProfile, athlete] = await Promise.all([
      getUserProfile(user.uid),
      getAthleteProfile(user.uid),
    ]);

    return { userProfile, athlete };
  } catch (error) {
    console.error('[AuthSlice] Load profile error:', error);
    return rejectWithValue({
      code: 'profile/error',
      message: 'Failed to load profile',
    });
  }
});

/**
 * Update athlete profile
 */
export const updateProfileAsync = createAsyncThunk<
  AthleteDocument,
  Partial<AthleteDocument>,
  { rejectValue: AuthServiceError; state: { auth: AuthState } }
>('auth/updateProfile', async (data, { getState, rejectWithValue }) => {
  try {
    const { user, athlete } = getState().auth;

    if (!user || !athlete) {
      return rejectWithValue({
        code: 'auth/no-user',
        message: 'No user logged in',
      });
    }

    const result = await updateAthleteProfile(user.uid, data);

    if (!result.success) {
      return rejectWithValue(result.error || {
        code: 'profile/error',
        message: 'Failed to update profile',
      });
    }

    // Return updated athlete data
    return { ...athlete, ...data } as AthleteDocument;
  } catch (error) {
    console.error('[AuthSlice] Update profile error:', error);
    return rejectWithValue({
      code: 'profile/error',
      message: 'Failed to update profile',
    });
  }
});

/**
 * Check if first login (password change required)
 */
export const checkFirstLoginAsync = createAsyncThunk<
  boolean,
  void,
  { rejectValue: AuthServiceError; state: { auth: AuthState } }
>('auth/checkFirstLogin', async (_, { getState, rejectWithValue }) => {
  try {
    const { user } = getState().auth;

    if (!user) {
      return rejectWithValue({
        code: 'auth/no-user',
        message: 'No user logged in',
      });
    }

    const requiresChange = await checkRequiresPasswordChange(user.uid);
    console.log('[AuthSlice] Check first login:', requiresChange);
    return requiresChange;
  } catch (error) {
    console.error('[AuthSlice] Check first login error:', error);
    return rejectWithValue({
      code: 'auth/check-failed',
      message: 'Failed to check login status',
    });
  }
});

/**
 * Change password (for first login or profile)
 */
export const changePasswordAsync = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { rejectValue: AuthServiceError }
>('auth/changePassword', async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    console.log('[AuthSlice] Changing password');

    const result = await authChangePassword(currentPassword, newPassword);

    if (!result.success) {
      return rejectWithValue(result.error || {
        code: 'auth/change-failed',
        message: 'Failed to change password',
      });
    }

    console.log('[AuthSlice] Password changed successfully');
  } catch (error) {
    console.error('[AuthSlice] Change password error:', error);
    return rejectWithValue({
      code: 'auth/change-failed',
      message: 'An unexpected error occurred while changing password',
    });
  }
});

// ============================================================================
// SLICE
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clear any auth errors
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Set registration step
     */
    setRegistrationStep: (state, action: PayloadAction<number>) => {
      state.registrationStep = action.payload;
    },

    /**
     * Update registration data (for multi-step form)
     */
    updateRegistrationData: (state, action: PayloadAction<Partial<RegisterData>>) => {
      state.registrationData = {
        ...state.registrationData,
        ...action.payload,
      };
    },

    /**
     * Clear registration data
     */
    clearRegistrationData: (state) => {
      state.registrationData = null;
      state.registrationStep = 1;
    },

    /**
     * Handle auth state change from Firebase listener
     */
    setAuthState: (
      state,
      action: PayloadAction<{
        user: SerializedUser | null;
        userProfile: UserDocument | null;
        athlete: AthleteDocument | null;
      }>
    ) => {
      state.user = action.payload.user;
      state.userProfile = action.payload.userProfile;
      state.athlete = action.payload.athlete;
      state.isAuthenticated = !!action.payload.user;
      state.isInitialized = true;
    },

    /**
     * Mark auth as initialized (even if no user)
     */
    setInitialized: (state) => {
      state.isInitialized = true;
    },

    /**
     * Set requires password change flag
     */
    setRequiresPasswordChange: (state, action: PayloadAction<boolean>) => {
      state.requiresPasswordChange = action.payload;
      state.isFirstLogin = action.payload;
    },

    /**
     * Clear password change requirement (after successful change)
     */
    clearPasswordChangeRequirement: (state) => {
      state.requiresPasswordChange = false;
      state.isFirstLogin = false;
    },

    /**
     * Dev-only: Bypass authentication for testing
     */
    devBypassAuth: (state) => {
      if (__DEV__) {
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.requiresPasswordChange = false;
        state.isFirstLogin = false;
        state.user = {
          uid: 'dev-user',
          email: 'dev@test.com',
          displayName: 'Dev User',
          photoURL: null,
          emailVerified: true,
          phoneNumber: null,
        };
      }
    },
  },

  extraReducers: (builder) => {
    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.user = action.payload.user;
        state.userProfile = action.payload.userProfile;
        state.athlete = action.payload.athlete;
        state.isAuthenticated = !!action.payload.user;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.error = action.payload || null;
      });

    // Login
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loginLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.user = action.payload.user;
        state.userProfile = action.payload.userProfile;
        state.athlete = action.payload.athlete;
        state.isAuthenticated = true;
        state.requiresPasswordChange = action.payload.requiresPasswordChange;
        state.isFirstLogin = action.payload.requiresPasswordChange;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loginLoading = false;
        state.error = action.payload || null;
      });

    // Register
    builder
      .addCase(registerAsync.pending, (state) => {
        state.registerLoading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.registerLoading = false;
        state.user = action.payload.user;
        state.userProfile = action.payload.userProfile;
        state.athlete = action.payload.athlete;
        state.isAuthenticated = true;
        state.registrationData = null;
        state.registrationStep = 1;
        state.error = null;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.registerLoading = false;
        state.error = action.payload || null;
      });

    // Logout
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        // Reset to initial state
        return { ...initialState, isInitialized: true };
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      });

    // Reset Password
    builder
      .addCase(resetPasswordAsync.pending, (state) => {
        state.resetPasswordLoading = true;
        state.error = null;
      })
      .addCase(resetPasswordAsync.fulfilled, (state) => {
        state.resetPasswordLoading = false;
      })
      .addCase(resetPasswordAsync.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.error = action.payload || null;
      });

    // Load Profile
    builder
      .addCase(loadUserProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.userProfile = action.payload.userProfile;
        state.athlete = action.payload.athlete;
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload || null;
      });

    // Update Profile
    builder
      .addCase(updateProfileAsync.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.athlete = action.payload;
      })
      .addCase(updateProfileAsync.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload || null;
      });

    // Check First Login
    builder
      .addCase(checkFirstLoginAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkFirstLoginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.requiresPasswordChange = action.payload;
        state.isFirstLogin = action.payload;
      })
      .addCase(checkFirstLoginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      });

    // Change Password
    builder
      .addCase(changePasswordAsync.pending, (state) => {
        state.passwordChangeLoading = true;
        state.error = null;
      })
      .addCase(changePasswordAsync.fulfilled, (state) => {
        state.passwordChangeLoading = false;
        state.requiresPasswordChange = false;
        state.isFirstLogin = false;
        state.error = null;
      })
      .addCase(changePasswordAsync.rejected, (state, action) => {
        state.passwordChangeLoading = false;
        state.error = action.payload || null;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  clearError,
  setRegistrationStep,
  updateRegistrationData,
  clearRegistrationData,
  setAuthState,
  setInitialized,
  setRequiresPasswordChange,
  clearPasswordChangeRequirement,
  devBypassAuth,
} = authSlice.actions;

export default authSlice.reducer;

// ============================================================================
// SELECTORS
// ============================================================================

export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectUserProfile = (state: { auth: AuthState }) => state.auth.userProfile;
export const selectAthlete = (state: { auth: AuthState }) => state.auth.athlete;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectRequiresPasswordChange = (state: { auth: AuthState }) => state.auth.requiresPasswordChange;
export const selectIsFirstLogin = (state: { auth: AuthState }) => state.auth.isFirstLogin;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.loading || state.auth.loginLoading || state.auth.registerLoading;
export const selectPasswordChangeLoading = (state: { auth: AuthState }) => state.auth.passwordChangeLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectRegistrationData = (state: { auth: AuthState }) => state.auth.registrationData;
export const selectRegistrationStep = (state: { auth: AuthState }) => state.auth.registrationStep;

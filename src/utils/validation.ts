/**
 * Form Validation Schemas
 * Using Yup for form validation with react-hook-form
 */

import * as yup from 'yup';

// ============================================================================
// VALIDATION MESSAGES
// ============================================================================

const messages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  minLength: (field: string, min: number) =>
    `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) =>
    `${field} must be at most ${max} characters`,
  lettersOnly: (field: string) => `${field} must contain only letters`,
  passwordMismatch: 'Passwords do not match',
  invalidPhone: 'Please enter a valid Cayman Islands phone number',
  tooYoung: 'You must be at least 10 years old',
  invalidDate: 'Please enter a valid date',
};

// ============================================================================
// REGEX PATTERNS
// ============================================================================

const patterns = {
  // Letters only (including accented characters)
  lettersOnly: /^[a-zA-ZÀ-ÿ\s'-]+$/,
  // Cayman phone: +1-345-xxx-xxxx or variations
  caymanPhone: /^(\+?1)?[-.\s]?345[-.\s]?\d{3}[-.\s]?\d{4}$/,
  // At least one uppercase
  hasUppercase: /[A-Z]/,
  // At least one lowercase
  hasLowercase: /[a-z]/,
  // At least one number
  hasNumber: /[0-9]/,
};

// ============================================================================
// LOGIN SCHEMA
// ============================================================================

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required(messages.required('Email'))
    .email(messages.email)
    .trim()
    .lowercase(),
  password: yup
    .string()
    .required(messages.required('Password')),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;

// ============================================================================
// REGISTRATION STEP 1: ACCOUNT DETAILS
// ============================================================================

export const registerStep1Schema = yup.object().shape({
  email: yup
    .string()
    .required(messages.required('Email'))
    .email(messages.email)
    .trim()
    .lowercase(),
  password: yup
    .string()
    .required(messages.required('Password'))
    .min(8, messages.minLength('Password', 8))
    .matches(patterns.hasUppercase, 'Password must contain at least one uppercase letter')
    .matches(patterns.hasLowercase, 'Password must contain at least one lowercase letter')
    .matches(patterns.hasNumber, 'Password must contain at least one number'),
  confirmPassword: yup
    .string()
    .required(messages.required('Confirm password'))
    .oneOf([yup.ref('password')], messages.passwordMismatch),
});

export type RegisterStep1Data = yup.InferType<typeof registerStep1Schema>;

// ============================================================================
// REGISTRATION STEP 2: PERSONAL INFO
// ============================================================================

export const registerStep2Schema = yup.object().shape({
  firstName: yup
    .string()
    .required(messages.required('First name'))
    .min(2, messages.minLength('First name', 2))
    .max(50, messages.maxLength('First name', 50))
    .matches(patterns.lettersOnly, messages.lettersOnly('First name'))
    .trim(),
  lastName: yup
    .string()
    .required(messages.required('Last name'))
    .min(2, messages.minLength('Last name', 2))
    .max(50, messages.maxLength('Last name', 50))
    .matches(patterns.lettersOnly, messages.lettersOnly('Last name'))
    .trim(),
  phone: yup
    .string()
    .required(messages.required('Phone number'))
    .matches(patterns.caymanPhone, messages.invalidPhone),
  dateOfBirth: yup
    .string()
    .required(messages.required('Date of birth'))
    .test('is-valid-age', messages.tooYoung, (value) => {
      if (!value) return false;
      const date = new Date(value);
      if (isNaN(date.getTime())) return false;

      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
          ? age - 1
          : age;

      return actualAge >= 10;
    }),
  gender: yup
    .string()
    .required(messages.required('Gender'))
    .oneOf(['male', 'female', 'other'], 'Please select a valid gender'),
});

export type RegisterStep2Data = yup.InferType<typeof registerStep2Schema>;

// ============================================================================
// REGISTRATION STEP 3: SPORT SELECTION
// ============================================================================

export const registerStep3Schema = yup.object().shape({
  sportId: yup
    .string()
    .required(messages.required('Sport selection')),
  sportName: yup.string(),
});

export type RegisterStep3Data = yup.InferType<typeof registerStep3Schema>;

// ============================================================================
// COMPLETE REGISTRATION SCHEMA
// ============================================================================

export const fullRegistrationSchema = yup.object().shape({
  email: yup
    .string()
    .required(messages.required('Email'))
    .email(messages.email),
  password: yup
    .string()
    .required(messages.required('Password'))
    .min(8, messages.minLength('Password', 8)),
  firstName: yup
    .string()
    .required(messages.required('First name'))
    .min(2, messages.minLength('First name', 2)),
  lastName: yup
    .string()
    .required(messages.required('Last name'))
    .min(2, messages.minLength('Last name', 2)),
  phone: yup
    .string()
    .required(messages.required('Phone number')),
  dateOfBirth: yup
    .string()
    .required(messages.required('Date of birth')),
  gender: yup
    .string()
    .required(messages.required('Gender'))
    .oneOf(['male', 'female', 'other']),
  sportId: yup
    .string()
    .required(messages.required('Sport selection')),
  sportName: yup.string().optional(),
  nationality: yup.string().optional(),
});

export type FullRegistrationData = yup.InferType<typeof fullRegistrationSchema>;

// ============================================================================
// FORGOT PASSWORD SCHEMA
// ============================================================================

export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .required(messages.required('Email'))
    .email(messages.email)
    .trim()
    .lowercase(),
});

export type ForgotPasswordData = yup.InferType<typeof forgotPasswordSchema>;

// ============================================================================
// PROFILE UPDATE SCHEMA
// ============================================================================

export const updateProfileSchema = yup.object().shape({
  firstName: yup
    .string()
    .min(2, messages.minLength('First name', 2))
    .max(50, messages.maxLength('First name', 50))
    .matches(patterns.lettersOnly, messages.lettersOnly('First name')),
  lastName: yup
    .string()
    .min(2, messages.minLength('Last name', 2))
    .max(50, messages.maxLength('Last name', 50))
    .matches(patterns.lettersOnly, messages.lettersOnly('Last name')),
  phone: yup
    .string()
    .matches(patterns.caymanPhone, messages.invalidPhone),
});

export type UpdateProfileData = yup.InferType<typeof updateProfileSchema>;

// ============================================================================
// LOCATION SCHEMA (Legacy - keeping for backwards compatibility)
// ============================================================================

export const locationSchema = yup.object().shape({
  name: yup
    .string()
    .required(messages.required('Location name'))
    .min(2, messages.minLength('Location name', 2))
    .max(100, messages.maxLength('Location name', 100)),
  type: yup
    .string()
    .required(messages.required('Location type'))
    .oneOf(
      ['home', 'training', 'gym', 'competition', 'work', 'school', 'hotel', 'other'],
      'Please select a valid location type'
    ),
  street: yup
    .string()
    .required(messages.required('Street address'))
    .min(5, messages.minLength('Street address', 5))
    .max(200, messages.maxLength('Street address', 200)),
  city: yup
    .string()
    .required(messages.required('City'))
    .min(2, messages.minLength('City', 2))
    .max(100, messages.maxLength('City', 100)),
  country: yup
    .string()
    .default('Cayman Islands'),
  additionalInfo: yup
    .string()
    .max(500, messages.maxLength('Additional info', 500)),
  isDefault: yup.boolean().default(false),
});

export type LocationFormData = yup.InferType<typeof locationSchema>;

// ============================================================================
// TIME VALIDATION PATTERNS
// ============================================================================

const timePatterns = {
  // HH:mm format (00:00 to 23:59)
  time24Hour: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  // Cayman postal code (KY1-XXXX format)
  caymanPostalCode: /^KY\d-\d{4}$/,
};

// ============================================================================
// LOCATION WITH SCHEDULE SCHEMA
// ============================================================================

export const locationScheduleSchema = yup.object().shape({
  address_line1: yup
    .string()
    .required(messages.required('Address line 1'))
    .max(200, messages.maxLength('Address line 1', 200)),
  address_line2: yup
    .string()
    .max(200, messages.maxLength('Address line 2', 200)),
  city: yup
    .string()
    .required(messages.required('City'))
    .max(100, messages.maxLength('City', 100)),
  country: yup
    .string()
    .required(messages.required('Country'))
    .max(100, messages.maxLength('Country', 100)),
  postal_code: yup
    .string()
    .matches(timePatterns.caymanPostalCode, 'Invalid Cayman postal code (format: KY1-XXXX)')
    .nullable(),
  additional_info: yup
    .string()
    .max(500, messages.maxLength('Additional information', 500)),
  // Monday
  monday_start: yup
    .string()
    .required(messages.required('Monday start time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  monday_end: yup
    .string()
    .required(messages.required('Monday end time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  // Tuesday
  tuesday_start: yup
    .string()
    .required(messages.required('Tuesday start time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  tuesday_end: yup
    .string()
    .required(messages.required('Tuesday end time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  // Wednesday
  wednesday_start: yup
    .string()
    .required(messages.required('Wednesday start time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  wednesday_end: yup
    .string()
    .required(messages.required('Wednesday end time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  // Thursday
  thursday_start: yup
    .string()
    .required(messages.required('Thursday start time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  thursday_end: yup
    .string()
    .required(messages.required('Thursday end time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  // Friday
  friday_start: yup
    .string()
    .required(messages.required('Friday start time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  friday_end: yup
    .string()
    .required(messages.required('Friday end time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  // Saturday
  saturday_start: yup
    .string()
    .required(messages.required('Saturday start time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  saturday_end: yup
    .string()
    .required(messages.required('Saturday end time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  // Sunday
  sunday_start: yup
    .string()
    .required(messages.required('Sunday start time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
  sunday_end: yup
    .string()
    .required(messages.required('Sunday end time'))
    .matches(timePatterns.time24Hour, 'Invalid time format (HH:mm)'),
});

export type LocationScheduleFormData = yup.InferType<typeof locationScheduleSchema>;

// ============================================================================
// COMPETITION SCHEMA
// ============================================================================

export const competitionSchema = yup.object().shape({
  name: yup
    .string()
    .required(messages.required('Competition name'))
    .min(3, messages.minLength('Competition name', 3))
    .max(200, messages.maxLength('Competition name', 200)),
  start_date: yup
    .string()
    .required(messages.required('Start date')),
  end_date: yup
    .string()
    .required(messages.required('End date')),
  location_address: yup
    .string()
    .required(messages.required('Location address'))
    .max(300, messages.maxLength('Location address', 300)),
  city: yup
    .string()
    .required(messages.required('City'))
    .max(100, messages.maxLength('City', 100)),
  country: yup
    .string()
    .required(messages.required('Country'))
    .max(100, messages.maxLength('Country', 100)),
  additional_info: yup
    .string()
    .max(500, messages.maxLength('Additional information', 500)),
});

export type CompetitionFormData = yup.InferType<typeof competitionSchema>;

// ============================================================================
// PASSWORD STRENGTH SCHEMA
// ============================================================================

/**
 * Strong password schema with all requirements
 */
export const passwordStrengthSchema = yup
  .string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .matches(/[0-9]/, 'Password must contain at least one number')
  .matches(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// ============================================================================
// FIRST LOGIN SCHEMA
// ============================================================================

/**
 * Schema for first login password change
 */
export const firstLoginSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: passwordStrengthSchema
    .notOneOf([yup.ref('currentPassword')], 'New password must be different from current password'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

export type FirstLoginFormData = yup.InferType<typeof firstLoginSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate password strength as weak/medium/strong
 */
export const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (patterns.hasUppercase.test(password)) score++;
  if (patterns.hasLowercase.test(password)) score++;
  if (patterns.hasNumber.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

/**
 * Get password strength score (0-5)
 */
export const getPasswordStrength = (password: string): number => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (patterns.hasUppercase.test(password)) score++;
  if (patterns.hasLowercase.test(password)) score++;
  if (patterns.hasNumber.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++; // Special character
  return Math.min(score, 5);
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (score: number): string => {
  if (score <= 1) return 'Weak';
  if (score <= 2) return 'Fair';
  if (score <= 3) return 'Good';
  if (score <= 4) return 'Strong';
  return 'Very Strong';
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
};

// ============================================================================
// TIME AND DATE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate time format (HH:mm) and that end is after start
 * @param start - Start time in HH:mm format
 * @param end - End time in HH:mm format
 * @returns true if valid
 * @throws Error with descriptive message if invalid
 */
export const validateTimeRange = (start: string, end: string): boolean => {
  // Check format
  if (!timePatterns.time24Hour.test(start)) {
    throw new Error(`Invalid start time format: "${start}". Expected HH:mm (e.g., 09:00)`);
  }

  if (!timePatterns.time24Hour.test(end)) {
    throw new Error(`Invalid end time format: "${end}". Expected HH:mm (e.g., 17:00)`);
  }

  // Parse times to minutes for comparison
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);

  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;

  // Validate range
  if (endTotal <= startTotal) {
    throw new Error(
      `End time (${end}) must be after start time (${start}). ` +
      `Start: ${startHours}:${startMinutes.toString().padStart(2, '0')}, ` +
      `End: ${endHours}:${endMinutes.toString().padStart(2, '0')}`
    );
  }

  return true;
};

/**
 * Validate date format (ISO) and that end is on or after start
 * @param start - Start date in ISO format (YYYY-MM-DD)
 * @param end - End date in ISO format (YYYY-MM-DD)
 * @returns true if valid
 * @throws Error with descriptive message if invalid
 */
export const validateDateRange = (start: string, end: string): boolean => {
  // Parse dates
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Check validity
  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid start date: "${start}". Expected ISO format (YYYY-MM-DD)`);
  }

  if (isNaN(endDate.getTime())) {
    throw new Error(`Invalid end date: "${end}". Expected ISO format (YYYY-MM-DD)`);
  }

  // Normalize to start of day for comparison
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  // Validate range (end must be same day or after start)
  if (endDate < startDate) {
    throw new Error(
      `End date (${end}) must be on or after start date (${start})`
    );
  }

  return true;
};

/**
 * Validate a full weekly schedule
 * @param schedule - Object with day_start and day_end properties
 * @returns Object with isValid flag and errors array
 */
export const validateWeeklySchedule = (
  schedule: Record<string, string>
): { isValid: boolean; errors: Array<{ field: string; message: string }> } => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const errors: Array<{ field: string; message: string }> = [];

  for (const day of days) {
    const startKey = `${day}_start`;
    const endKey = `${day}_end`;
    const startTime = schedule[startKey];
    const endTime = schedule[endKey];

    // Check if times are provided
    if (!startTime) {
      errors.push({ field: startKey, message: `${day} start time is required` });
    }
    if (!endTime) {
      errors.push({ field: endKey, message: `${day} end time is required` });
    }

    // If both provided, validate the range
    if (startTime && endTime) {
      try {
        validateTimeRange(startTime, endTime);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid time range';
        errors.push({ field: `${day}_time`, message: `${day}: ${message}` });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check if a time string is in valid HH:mm format
 */
export const isValidTimeFormat = (time: string): boolean => {
  return timePatterns.time24Hour.test(time);
};

/**
 * Check if a Cayman postal code is valid
 */
export const isValidCaymanPostalCode = (postalCode: string): boolean => {
  return timePatterns.caymanPostalCode.test(postalCode);
};

// ============================================================================
// ADMIN: CREATE ATHLETE SCHEMA
// ============================================================================

/**
 * Schema for admin creating a new athlete account
 */
export const adminCreateAthleteSchema = yup.object().shape({
  firstName: yup
    .string()
    .required(messages.required('First name'))
    .min(2, messages.minLength('First name', 2))
    .max(100, messages.maxLength('First name', 100))
    .matches(patterns.lettersOnly, messages.lettersOnly('First name'))
    .trim(),
  lastName: yup
    .string()
    .required(messages.required('Last name'))
    .min(2, messages.minLength('Last name', 2))
    .max(100, messages.maxLength('Last name', 100))
    .matches(patterns.lettersOnly, messages.lettersOnly('Last name'))
    .trim(),
  email: yup
    .string()
    .required(messages.required('Email'))
    .email(messages.email)
    .trim()
    .lowercase(),
  phone: yup
    .string()
    .required(messages.required('Phone number'))
    .matches(patterns.caymanPhone, 'Invalid Cayman phone format (+1-345-XXX-XXXX)'),
  dateOfBirth: yup
    .string()
    .required(messages.required('Date of birth'))
    .test('is-valid-age', 'Athlete must be at least 10 years old', (value) => {
      if (!value) return false;
      const date = new Date(value);
      if (isNaN(date.getTime())) return false;

      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
          ? age - 1
          : age;

      return actualAge >= 10;
    }),
  gender: yup
    .string()
    .required(messages.required('Gender'))
    .oneOf(
      ['Male', 'Female', 'Other', 'Prefer not to say'],
      'Please select a valid gender'
    ),
  nocId: yup
    .string()
    .required(messages.required('National Olympic Committee')),
  sport: yup
    .string()
    .required(messages.required('Sport')),
  residenceStatus: yup
    .string()
    .required(messages.required('Residence status'))
    .oneOf(['local', 'overseas'], 'Please select a valid residence status'),
  testingPoolStatus: yup
    .string()
    .required(messages.required('Testing pool status'))
    .oneOf(['NONE', 'RTP', 'TP'], 'Please select a valid testing pool status'),
});

export type AdminCreateAthleteData = yup.InferType<typeof adminCreateAthleteSchema>;

// ============================================================================
// ADMIN: UPDATE ATHLETE SCHEMA
// ============================================================================

/**
 * Schema for admin updating an existing athlete
 * All fields are optional - only provided fields will be updated
 */
export const updateAthleteSchema = yup.object().shape({
  firstName: yup
    .string()
    .min(2, messages.minLength('First name', 2))
    .max(100, messages.maxLength('First name', 100))
    .matches(patterns.lettersOnly, messages.lettersOnly('First name'))
    .trim(),
  lastName: yup
    .string()
    .min(2, messages.minLength('Last name', 2))
    .max(100, messages.maxLength('Last name', 100))
    .matches(patterns.lettersOnly, messages.lettersOnly('Last name'))
    .trim(),
  phone: yup
    .string()
    .matches(patterns.caymanPhone, 'Invalid Cayman phone format (+1-345-XXX-XXXX)'),
  dateOfBirth: yup
    .string()
    .test('is-valid-age', 'Athlete must be at least 10 years old', (value) => {
      if (!value) return true; // Optional field
      const date = new Date(value);
      if (isNaN(date.getTime())) return false;

      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
          ? age - 1
          : age;

      return actualAge >= 10;
    }),
  gender: yup
    .string()
    .oneOf(
      ['Male', 'Female', 'Other', 'Prefer not to say'],
      'Please select a valid gender'
    ),
  sport: yup.string(),
  sportName: yup.string(),
  residenceStatus: yup
    .string()
    .oneOf(['local', 'overseas'], 'Please select a valid residence status'),
  testingPoolStatus: yup
    .string()
    .oneOf(['NONE', 'RTP', 'TP'], 'Please select a valid testing pool status'),
});

export type UpdateAthleteData = yup.InferType<typeof updateAthleteSchema>;

// ============================================================================
// WEEKLY PATTERN VALIDATION
// ============================================================================

/**
 * Days of the week type
 */
export type DayOfWeekKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Location type
 */
export type LocationType = 'home' | 'training' | 'gym';

/**
 * Day slot pattern structure
 */
export interface DaySlotPattern {
  location_type: LocationType;
  time_start: string;
  time_end: string;
}

/**
 * Weekly pattern structure
 */
export type WeeklyPatternType = Record<DayOfWeekKey, DaySlotPattern>;

/**
 * Location with schedule for availability checking
 */
export interface LocationSchedule {
  monday_start?: string;
  monday_end?: string;
  tuesday_start?: string;
  tuesday_end?: string;
  wednesday_start?: string;
  wednesday_end?: string;
  thursday_start?: string;
  thursday_end?: string;
  friday_start?: string;
  friday_end?: string;
  saturday_start?: string;
  saturday_end?: string;
  sunday_start?: string;
  sunday_end?: string;
}

/**
 * Pattern validation error
 */
export interface PatternValidationError {
  day: DayOfWeekKey;
  field: 'location_type' | 'time_start' | 'time_end' | 'time_range' | 'availability';
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Pattern validation result
 */
export interface PatternValidationResult {
  isValid: boolean;
  errors: PatternValidationError[];
  warnings: PatternValidationError[];
}

/**
 * Days of the week constant
 */
export const DAYS_OF_WEEK: DayOfWeekKey[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

/**
 * Day labels for display
 */
export const DAY_LABELS: Record<DayOfWeekKey, { full: string; short: string }> = {
  monday: { full: 'Monday', short: 'Mon' },
  tuesday: { full: 'Tuesday', short: 'Tue' },
  wednesday: { full: 'Wednesday', short: 'Wed' },
  thursday: { full: 'Thursday', short: 'Thu' },
  friday: { full: 'Friday', short: 'Fri' },
  saturday: { full: 'Saturday', short: 'Sat' },
  sunday: { full: 'Sunday', short: 'Sun' },
};

/**
 * Valid location types
 */
export const VALID_LOCATION_TYPES: LocationType[] = ['home', 'training', 'gym'];

/**
 * Convert time string (HH:mm) to minutes from midnight
 */
export const timeToMinutes = (time: string): number => {
  if (!time || !isValidTimeFormat(time)) return -1;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes from midnight to time string (HH:mm)
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Validate that a time slot is exactly 60 minutes
 */
export const validateTimeSlotDuration = (startTime: string, endTime: string): boolean => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (startMinutes === -1 || endMinutes === -1) return false;

  return (endMinutes - startMinutes) === 60;
};

/**
 * Validate a single day's slot pattern
 */
export const validateDaySlotPattern = (
  pattern: DaySlotPattern,
  day: DayOfWeekKey
): PatternValidationError[] => {
  const errors: PatternValidationError[] = [];
  const dayLabel = DAY_LABELS[day].full;

  // Validate location type
  if (!pattern.location_type) {
    errors.push({
      day,
      field: 'location_type',
      message: `${dayLabel}: Location type is required`,
      severity: 'error',
    });
  } else if (!VALID_LOCATION_TYPES.includes(pattern.location_type)) {
    errors.push({
      day,
      field: 'location_type',
      message: `${dayLabel}: Invalid location type "${pattern.location_type}"`,
      severity: 'error',
    });
  }

  // Validate time start
  if (!pattern.time_start) {
    errors.push({
      day,
      field: 'time_start',
      message: `${dayLabel}: Start time is required`,
      severity: 'error',
    });
  } else if (!isValidTimeFormat(pattern.time_start)) {
    errors.push({
      day,
      field: 'time_start',
      message: `${dayLabel}: Invalid start time format "${pattern.time_start}"`,
      severity: 'error',
    });
  }

  // Validate time end
  if (!pattern.time_end) {
    errors.push({
      day,
      field: 'time_end',
      message: `${dayLabel}: End time is required`,
      severity: 'error',
    });
  } else if (!isValidTimeFormat(pattern.time_end)) {
    errors.push({
      day,
      field: 'time_end',
      message: `${dayLabel}: Invalid end time format "${pattern.time_end}"`,
      severity: 'error',
    });
  }

  // Validate time range
  if (pattern.time_start && pattern.time_end &&
      isValidTimeFormat(pattern.time_start) && isValidTimeFormat(pattern.time_end)) {
    const startMinutes = timeToMinutes(pattern.time_start);
    const endMinutes = timeToMinutes(pattern.time_end);

    if (endMinutes <= startMinutes) {
      errors.push({
        day,
        field: 'time_range',
        message: `${dayLabel}: End time must be after start time`,
        severity: 'error',
      });
    } else if (endMinutes - startMinutes !== 60) {
      errors.push({
        day,
        field: 'time_range',
        message: `${dayLabel}: Slot must be exactly 60 minutes (currently ${endMinutes - startMinutes} minutes)`,
        severity: 'error',
      });
    }
  }

  return errors;
};

/**
 * Check if a location is available on a given day at the specified time
 */
export const checkLocationAvailability = (
  day: DayOfWeekKey,
  startTime: string,
  endTime: string,
  location: LocationSchedule | null
): { available: boolean; message?: string } => {
  if (!location) {
    return { available: false, message: 'Location not set up' };
  }

  const locationStart = location[`${day}_start` as keyof LocationSchedule] as string | undefined;
  const locationEnd = location[`${day}_end` as keyof LocationSchedule] as string | undefined;

  // Check if location has hours set for this day
  if (!locationStart || !locationEnd) {
    return { available: false, message: `Location not available on ${DAY_LABELS[day].full}` };
  }

  // Check if times are valid
  if (!isValidTimeFormat(locationStart) || !isValidTimeFormat(locationEnd)) {
    return { available: false, message: 'Invalid location schedule' };
  }

  const locStartMinutes = timeToMinutes(locationStart);
  const locEndMinutes = timeToMinutes(locationEnd);
  const slotStartMinutes = timeToMinutes(startTime);
  const slotEndMinutes = timeToMinutes(endTime);

  // Check if slot is within location hours
  if (slotStartMinutes < locStartMinutes) {
    return {
      available: false,
      message: `Slot starts before location opens (${locationStart})`
    };
  }

  if (slotEndMinutes > locEndMinutes) {
    return {
      available: false,
      message: `Slot ends after location closes (${locationEnd})`
    };
  }

  return { available: true };
};

/**
 * Validate a complete weekly pattern
 */
export const validateWeeklyPattern = (
  pattern: WeeklyPatternType,
  locations?: {
    home?: LocationSchedule | null;
    training?: LocationSchedule | null;
    gym?: LocationSchedule | null;
  }
): PatternValidationResult => {
  const errors: PatternValidationError[] = [];
  const warnings: PatternValidationError[] = [];

  for (const day of DAYS_OF_WEEK) {
    const dayPattern = pattern[day];

    if (!dayPattern) {
      errors.push({
        day,
        field: 'location_type',
        message: `${DAY_LABELS[day].full}: Pattern not defined`,
        severity: 'error',
      });
      continue;
    }

    // Validate day pattern
    const dayErrors = validateDaySlotPattern(dayPattern, day);
    errors.push(...dayErrors);

    // Check location availability if locations provided
    if (locations && dayErrors.length === 0) {
      const location = locations[dayPattern.location_type];
      const availability = checkLocationAvailability(
        day,
        dayPattern.time_start,
        dayPattern.time_end,
        location || null
      );

      if (!availability.available) {
        warnings.push({
          day,
          field: 'availability',
          message: `${DAY_LABELS[day].full}: ${availability.message}`,
          severity: 'warning',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Get the count of each location type in a pattern
 */
export const getPatternLocationCounts = (
  pattern: WeeklyPatternType
): Record<LocationType, number> => {
  const counts: Record<LocationType, number> = {
    home: 0,
    training: 0,
    gym: 0,
  };

  for (const day of DAYS_OF_WEEK) {
    const dayPattern = pattern[day];
    if (dayPattern && VALID_LOCATION_TYPES.includes(dayPattern.location_type)) {
      counts[dayPattern.location_type]++;
    }
  }

  return counts;
};

/**
 * Check if all days in a pattern use the same location
 */
export const isUniformPattern = (pattern: WeeklyPatternType): boolean => {
  const firstType = pattern.monday?.location_type;
  if (!firstType) return false;

  return DAYS_OF_WEEK.every(day => pattern[day]?.location_type === firstType);
};

/**
 * Check if weekdays (Mon-Fri) have the same pattern
 */
export const hasUniformWeekdays = (pattern: WeeklyPatternType): boolean => {
  const weekdays: DayOfWeekKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const monday = pattern.monday;

  if (!monday) return false;

  return weekdays.every(day => {
    const dayPattern = pattern[day];
    return dayPattern &&
           dayPattern.location_type === monday.location_type &&
           dayPattern.time_start === monday.time_start &&
           dayPattern.time_end === monday.time_end;
  });
};

/**
 * Check if weekends (Sat-Sun) have the same pattern
 */
export const hasUniformWeekends = (pattern: WeeklyPatternType): boolean => {
  const saturday = pattern.saturday;
  const sunday = pattern.sunday;

  if (!saturday || !sunday) return false;

  return saturday.location_type === sunday.location_type &&
         saturday.time_start === sunday.time_start &&
         saturday.time_end === sunday.time_end;
};

/**
 * Create a default pattern with specified location and time
 */
export const createDefaultPattern = (
  locationType: LocationType = 'home',
  startTime: string = '06:00',
  endTime: string = '07:00'
): WeeklyPatternType => {
  const pattern: Partial<WeeklyPatternType> = {};

  for (const day of DAYS_OF_WEEK) {
    pattern[day] = {
      location_type: locationType,
      time_start: startTime,
      time_end: endTime,
    };
  }

  return pattern as WeeklyPatternType;
};

/**
 * Copy pattern from one day to others
 */
export const copyDayPattern = (
  pattern: WeeklyPatternType,
  sourceDay: DayOfWeekKey,
  targetDays: DayOfWeekKey[]
): WeeklyPatternType => {
  const sourcePattern = pattern[sourceDay];
  if (!sourcePattern) return pattern;

  const newPattern = { ...pattern };

  for (const targetDay of targetDays) {
    newPattern[targetDay] = { ...sourcePattern };
  }

  return newPattern;
};

/**
 * Schema for weekly pattern validation
 */
export const weeklyPatternSchema = yup.object().shape({
  monday: yup.object().shape({
    location_type: yup.string().required().oneOf(['home', 'training', 'gym']),
    time_start: yup.string().required().matches(timePatterns.time24Hour),
    time_end: yup.string().required().matches(timePatterns.time24Hour),
  }).required(),
  tuesday: yup.object().shape({
    location_type: yup.string().required().oneOf(['home', 'training', 'gym']),
    time_start: yup.string().required().matches(timePatterns.time24Hour),
    time_end: yup.string().required().matches(timePatterns.time24Hour),
  }).required(),
  wednesday: yup.object().shape({
    location_type: yup.string().required().oneOf(['home', 'training', 'gym']),
    time_start: yup.string().required().matches(timePatterns.time24Hour),
    time_end: yup.string().required().matches(timePatterns.time24Hour),
  }).required(),
  thursday: yup.object().shape({
    location_type: yup.string().required().oneOf(['home', 'training', 'gym']),
    time_start: yup.string().required().matches(timePatterns.time24Hour),
    time_end: yup.string().required().matches(timePatterns.time24Hour),
  }).required(),
  friday: yup.object().shape({
    location_type: yup.string().required().oneOf(['home', 'training', 'gym']),
    time_start: yup.string().required().matches(timePatterns.time24Hour),
    time_end: yup.string().required().matches(timePatterns.time24Hour),
  }).required(),
  saturday: yup.object().shape({
    location_type: yup.string().required().oneOf(['home', 'training', 'gym']),
    time_start: yup.string().required().matches(timePatterns.time24Hour),
    time_end: yup.string().required().matches(timePatterns.time24Hour),
  }).required(),
  sunday: yup.object().shape({
    location_type: yup.string().required().oneOf(['home', 'training', 'gym']),
    time_start: yup.string().required().matches(timePatterns.time24Hour),
    time_end: yup.string().required().matches(timePatterns.time24Hour),
  }).required(),
});

/**
 * Format validation errors for display
 */
export const formatPatternErrors = (result: PatternValidationResult): string[] => {
  const messages: string[] = [];

  for (const error of result.errors) {
    messages.push(`Error: ${error.message}`);
  }

  for (const warning of result.warnings) {
    messages.push(`Warning: ${warning.message}`);
  }

  return messages;
};

/**
 * Get a summary of pattern validation
 */
export const getPatternValidationSummary = (result: PatternValidationResult): string => {
  if (result.isValid && result.warnings.length === 0) {
    return 'Pattern is valid';
  }

  if (result.isValid && result.warnings.length > 0) {
    return `Pattern is valid with ${result.warnings.length} warning(s)`;
  }

  return `Pattern has ${result.errors.length} error(s)`;
};

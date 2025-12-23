/**
 * CIOC Athlete App Constants
 */

export * from './theme';

// ============================================================================
// APP CONSTANTS
// ============================================================================

export const APP_NAME = 'CIOC Athlete';
export const APP_VERSION = '1.0.0';

// ============================================================================
// WHEREABOUTS CONSTANTS
// ============================================================================

/**
 * WADA-compliant time slot constraints
 * Athletes must be available during their 60-minute slot
 */
export const SLOT_CONSTRAINTS = {
  MIN_START_HOUR: 5,     // 5:00 AM earliest start
  MAX_END_HOUR: 23,      // 11:00 PM latest end
  SLOT_DURATION: 60,     // 60 minutes
} as const;

/**
 * Quarter date ranges (standard calendar quarters)
 */
export const QUARTERS = {
  Q1: { startMonth: 0, endMonth: 2 },   // Jan 1 - Mar 31
  Q2: { startMonth: 3, endMonth: 5 },   // Apr 1 - Jun 30
  Q3: { startMonth: 6, endMonth: 8 },   // Jul 1 - Sep 30
  Q4: { startMonth: 9, endMonth: 11 },  // Oct 1 - Dec 31
} as const;

/**
 * Days in each quarter (approximate, varies by leap year)
 */
export const QUARTER_DAYS = {
  Q1: 90,   // 91 in leap year
  Q2: 91,
  Q3: 92,
  Q4: 92,
} as const;

/**
 * Deadline reminders (days before quarter end)
 */
export const DEADLINE_REMINDERS = [30, 14, 7, 3, 1] as const;

/**
 * Days of the week for template scheduling
 */
export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

/**
 * Abbreviated days for compact display
 */
export const DAYS_ABBREVIATED = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
} as const;

// ============================================================================
// LOCATION CONSTANTS
// ============================================================================

export const LOCATION_TYPES = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'training', label: 'Training Facility', icon: 'fitness-center' },
  { id: 'gym', label: 'Gym', icon: 'sports-gymnastics' },
  { id: 'competition', label: 'Competition Venue', icon: 'emoji-events' },
  { id: 'work', label: 'Work', icon: 'work' },
  { id: 'school', label: 'School/University', icon: 'school' },
  { id: 'hotel', label: 'Hotel/Accommodation', icon: 'hotel' },
  { id: 'other', label: 'Other', icon: 'place' },
] as const;

/**
 * Default Cayman Islands locations (pre-populated)
 */
export const CAYMAN_DEFAULT_LOCATIONS = [
  {
    name: 'Truman Bodden Sports Complex',
    type: 'training',
    address: {
      street: 'Olympic Way',
      city: 'George Town',
      country: 'Cayman Islands',
    },
  },
  {
    name: 'Lions Aquatic Centre',
    type: 'training',
    address: {
      street: 'Crewe Road',
      city: 'George Town',
      country: 'Cayman Islands',
    },
  },
  {
    name: 'Ed Bush Stadium',
    type: 'competition',
    address: {
      street: 'West Bay Road',
      city: 'West Bay',
      country: 'Cayman Islands',
    },
  },
] as const;

// ============================================================================
// SPORT CONSTANTS
// ============================================================================

export const SPORTS = [
  { id: 'athletics', name: 'Athletics', code: 'ATH' },
  { id: 'aquatics', name: 'Aquatics', code: 'AQU' },
  { id: 'badminton', name: 'Badminton', code: 'BDM' },
  { id: 'basketball', name: 'Basketball', code: 'BKB' },
  { id: 'cricket', name: 'Cricket', code: 'CRI' },
  { id: 'cycling', name: 'Cycling', code: 'CYC' },
  { id: 'esports', name: 'eSports', code: 'ESP' },
  { id: 'equestrian', name: 'Equestrian', code: 'EQU' },
  { id: 'football', name: 'Football', code: 'FBL' },
  { id: 'golf', name: 'Golf', code: 'GOL' },
  { id: 'hockey', name: 'Hockey', code: 'HOC' },
  { id: 'judo', name: 'Judo', code: 'JUD' },
  { id: 'karate', name: 'Karate', code: 'KAR' },
  { id: 'lacrosse', name: 'Lacrosse', code: 'LAC' },
  { id: 'netball', name: 'Netball', code: 'NET' },
  { id: 'rugby', name: 'Rugby', code: 'RUG' },
  { id: 'sailing', name: 'Sailing', code: 'SAI' },
  { id: 'squash', name: 'Squash', code: 'SQU' },
  { id: 'taekwondo', name: 'Taekwondo', code: 'TKD' },
  { id: 'volleyball', name: 'Volleyball', code: 'VBV' },
  { id: 'wrestling', name: 'Wrestling', code: 'WRE' },
] as const;

// ============================================================================
// NOC CONSTANTS
// ============================================================================

export const NOC_LIST = [
  { id: 'cayman_islands', name: 'Cayman Islands Olympic Committee' },
] as const;

// ============================================================================
// RESIDENCE STATUS
// ============================================================================

export const RESIDENCE_STATUS = ['local', 'overseas'] as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  ADDRESS_MIN_LENGTH: 5,
  ADDRESS_MAX_LENGTH: 200,
} as const;

// ============================================================================
// PASSWORD REQUIREMENTS
// ============================================================================

/**
 * Password requirements for display
 */
export const PASSWORD_REQUIREMENTS = [
  'At least 8 characters',
  'One uppercase letter',
  'One lowercase letter',
  'One number',
  'One special character',
] as const;

// ============================================================================
// TESTING POOL OPTIONS
// ============================================================================

/**
 * WADA Testing Pool levels
 */
export const TESTING_POOL_OPTIONS = [
  { value: 'NONE', label: 'Not in Testing Pool' },
  { value: 'RTP', label: 'Registered Testing Pool (RTP)' },
  { value: 'TP', label: 'Testing Pool (TP)' },
] as const;

// ============================================================================
// GENDER OPTIONS
// ============================================================================

/**
 * Gender options for athlete profiles
 */
export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Other',
  'Prefer not to say',
] as const;

// ============================================================================
// API CONSTANTS
// ============================================================================

export const API_TIMEOUTS = {
  DEFAULT: 30000,       // 30 seconds
  UPLOAD: 120000,       // 2 minutes
  LONG_POLL: 60000,     // 1 minute
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@cioc/auth_token',
  USER_DATA: '@cioc/user_data',
  ATHLETE_DATA: '@cioc/athlete_data',
  THEME_PREFERENCE: '@cioc/theme',
  NOTIFICATION_PREFS: '@cioc/notification_prefs',
  OFFLINE_QUEUE: '@cioc/offline_queue',
  CACHED_LOCATIONS: '@cioc/cached_locations',
  CACHED_QUARTERS: '@cioc/cached_quarters',
  LAST_SYNC: '@cioc/last_sync',
} as const;

// ============================================================================
// NOTIFICATION CHANNELS (Android)
// ============================================================================

export const NOTIFICATION_CHANNELS = {
  DEFAULT: {
    id: 'default',
    name: 'General',
    description: 'General notifications',
  },
  REMINDERS: {
    id: 'reminders',
    name: 'Reminders',
    description: 'Deadline and slot reminders',
  },
  UPDATES: {
    id: 'updates',
    name: 'Updates',
    description: 'System updates and announcements',
  },
} as const;

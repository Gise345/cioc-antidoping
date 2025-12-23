/**
 * Navigation Types for CIOC Athlete App
 * Uses Expo Router (file-based routing)
 */

// ============================================================================
// ROUTE PARAMS
// ============================================================================

/**
 * Auth stack route params
 */
export type AuthRouteParams = {
  '/auth/login': undefined;
  '/auth/register': undefined;
  '/auth/register/personal-info': {
    email: string;
    password: string;
  };
  '/auth/register/sport-selection': {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
  };
  '/auth/register/welcome': undefined;
  '/auth/forgot-password': undefined;
  '/auth/reset-password': {
    oobCode: string;
  };
  '/auth/verify-email': {
    email: string;
  };
};

/**
 * Main app tabs route params
 */
export type MainTabsRouteParams = {
  '/(tabs)': undefined;
  '/(tabs)/home': undefined;
  '/(tabs)/whereabouts': undefined;
  '/(tabs)/profile': undefined;
};

/**
 * Whereabouts stack route params
 */
export type WhereaboutsRouteParams = {
  '/whereabouts': undefined;
  '/whereabouts/create-quarter': {
    year?: number;
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    copyFromQuarterId?: string;
  };
  '/whereabouts/quarter/[id]': {
    id: string;
  };
  '/whereabouts/quarter/[id]/locations': {
    id: string;
  };
  '/whereabouts/quarter/[id]/weekly-template': {
    id: string;
    templateId?: string;
  };
  '/whereabouts/quarter/[id]/calendar': {
    id: string;
  };
  '/whereabouts/quarter/[id]/day/[date]': {
    id: string;
    date: string; // YYYY-MM-DD
  };
  '/whereabouts/quarter/[id]/competitions': {
    id: string;
  };
  '/whereabouts/quarter/[id]/review': {
    id: string;
  };
};

/**
 * Location management route params
 */
export type LocationRouteParams = {
  '/locations': undefined;
  '/locations/add': {
    returnTo?: string;
    prefillType?: string;
  };
  '/locations/edit/[id]': {
    id: string;
  };
  '/locations/search': {
    query?: string;
  };
};

/**
 * Profile route params
 */
export type ProfileRouteParams = {
  '/profile': undefined;
  '/profile/edit': undefined;
  '/profile/settings': undefined;
  '/profile/notifications': undefined;
  '/profile/help': undefined;
  '/profile/about': undefined;
};

/**
 * Modal route params
 */
export type ModalRouteParams = {
  '/modal/time-picker': {
    currentTime?: string;
    minTime?: string;
    maxTime?: string;
    onSelect?: string; // Callback route
  };
  '/modal/location-picker': {
    selectedLocationId?: string;
    locationType?: string;
    onSelect?: string;
  };
  '/modal/date-picker': {
    currentDate?: string;
    minDate?: string;
    maxDate?: string;
    onSelect?: string;
  };
  '/modal/confirmation': {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: string;
  };
  '/modal/success': {
    title: string;
    message: string;
    buttonText?: string;
    redirectTo?: string;
  };
};

/**
 * Combined route params for the entire app
 */
export type AppRouteParams = AuthRouteParams &
  MainTabsRouteParams &
  WhereaboutsRouteParams &
  LocationRouteParams &
  ProfileRouteParams &
  ModalRouteParams;

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Route path literals for type-safe navigation
 */
export const Routes = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REGISTER_PERSONAL: '/auth/register/personal-info',
  REGISTER_SPORT: '/auth/register/sport-selection',
  REGISTER_WELCOME: '/auth/register/welcome',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',

  // Main Tabs
  HOME: '/(tabs)/home',
  WHEREABOUTS_TAB: '/(tabs)/whereabouts',
  PROFILE_TAB: '/(tabs)/profile',

  // Whereabouts
  WHEREABOUTS: '/whereabouts',
  CREATE_QUARTER: '/whereabouts/create-quarter',
  QUARTER_DETAIL: '/whereabouts/quarter',
  QUARTER_LOCATIONS: '/whereabouts/quarter/locations',
  QUARTER_TEMPLATE: '/whereabouts/quarter/weekly-template',
  QUARTER_CALENDAR: '/whereabouts/quarter/calendar',
  QUARTER_DAY: '/whereabouts/quarter/day',
  QUARTER_COMPETITIONS: '/whereabouts/quarter/competitions',
  QUARTER_REVIEW: '/whereabouts/quarter/review',

  // Locations
  LOCATIONS: '/locations',
  ADD_LOCATION: '/locations/add',
  EDIT_LOCATION: '/locations/edit',
  SEARCH_LOCATION: '/locations/search',

  // Profile
  PROFILE: '/profile',
  EDIT_PROFILE: '/profile/edit',
  SETTINGS: '/profile/settings',
  NOTIFICATIONS: '/profile/notifications',
  HELP: '/profile/help',
  ABOUT: '/profile/about',

  // Modals
  TIME_PICKER: '/modal/time-picker',
  LOCATION_PICKER: '/modal/location-picker',
  DATE_PICKER: '/modal/date-picker',
  CONFIRMATION: '/modal/confirmation',
  SUCCESS: '/modal/success',
} as const;

export type RouteKey = keyof typeof Routes;
export type RoutePath = (typeof Routes)[RouteKey];

// ============================================================================
// TAB CONFIG
// ============================================================================

export interface TabConfig {
  name: string;
  title: string;
  icon: string;
  iconFocused: string;
  badge?: number | string;
}

export const TAB_CONFIG: Record<string, TabConfig> = {
  home: {
    name: 'home',
    title: 'Home',
    icon: 'home-outline',
    iconFocused: 'home',
  },
  whereabouts: {
    name: 'whereabouts',
    title: 'Whereabouts',
    icon: 'calendar-outline',
    iconFocused: 'calendar',
  },
  profile: {
    name: 'profile',
    title: 'Profile',
    icon: 'person-outline',
    iconFocused: 'person',
  },
};

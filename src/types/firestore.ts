/**
 * Firestore Document Types
 * TypeScript interfaces matching Firestore document structure
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * Base document interface with common fields
 * Note: Timestamps can be Firestore Timestamp objects or ISO strings (after serialization)
 */
export interface BaseDocument {
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

/**
 * Firestore Timestamp type helper
 */
export type FirestoreTimestamp = Timestamp;

// ============================================================================
// USER DOCUMENT - users/{userId}
// ============================================================================

export type UserRole = 'athlete' | 'admin' | 'super_admin';

export interface UserDocument extends BaseDocument {
  email: string;
  role: UserRole;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  requires_password_change: boolean;
  last_login_at?: Timestamp | string;
  fcm_tokens?: string[]; // Firebase Cloud Messaging tokens
}

/**
 * User document for creation (without timestamps - Firestore will add them)
 */
export interface CreateUserDocument {
  email: string;
  role: UserRole;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  requires_password_change?: boolean;
}

// ============================================================================
// ATHLETE DOCUMENT - athletes/{userId}
// ============================================================================

export type TestingPoolStatus = 'NONE' | 'RTP' | 'TP';
export type AthleteStatus = 'active' | 'inactive' | 'retired';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ResidenceStatus = 'local' | 'overseas';

export interface AthleteDocument extends BaseDocument {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string; // ISO date string YYYY-MM-DD
  gender: Gender;
  sport_id: string;
  sport_name?: string; // Denormalized for display
  nationality: string;
  noc_id: string; // National Olympic Committee ID
  residence_status: ResidenceStatus;
  testing_pool_status: TestingPoolStatus;
  status: AthleteStatus;
  wada_id?: string;
  cioc_athlete_number?: string;
  profile_photo_url?: string;
  emergency_contact?: EmergencyContactDocument;
}

export interface EmergencyContactDocument {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

/**
 * Athlete document for creation
 */
export interface CreateAthleteDocument {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  gender: Gender;
  sport_id: string;
  sport_name?: string;
  nationality: string;
  noc_id: string;
  residence_status: ResidenceStatus;
  testing_pool_status: TestingPoolStatus;
  status: AthleteStatus;
}

// ============================================================================
// SPORT DOCUMENT - sports/{sportId}
// ============================================================================

export interface SportDocument extends BaseDocument {
  name: string;
  code: string; // e.g., "ATH" for Athletics
  federation: string;
  is_active: boolean;
}

// ============================================================================
// WHEREABOUTS QUARTER DOCUMENT - whereabouts_quarters/{quarterId}
// ============================================================================

export type QuarterName = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type QuarterStatus = 'draft' | 'incomplete' | 'complete' | 'submitted' | 'locked';

export interface WhereaboutsQuarterDocument extends BaseDocument {
  athlete_id: string;
  year: number;
  quarter: QuarterName;
  start_date: string; // ISO date
  end_date: string; // ISO date
  filing_deadline: string; // ISO date
  status: QuarterStatus;
  completion_percentage: number;
  days_completed: number;
  total_days: number;
  submitted_at?: Timestamp;
  locked_at?: Timestamp;
  copied_from_quarter_id?: string;
}

/**
 * Quarter document for creation
 */
export interface CreateQuarterDocument {
  athlete_id: string;
  year: number;
  quarter: QuarterName;
  start_date: string;
  end_date: string;
  filing_deadline: string;
  status: QuarterStatus;
  completion_percentage: number;
  days_completed: number;
  total_days: number;
  copied_from_quarter_id?: string;
}

// ============================================================================
// LOCATION DOCUMENT - whereabouts_locations/{locationId}
// ============================================================================

export type LocationType =
  | 'home'
  | 'training'
  | 'gym'
  | 'competition'
  | 'work'
  | 'school'
  | 'hotel'
  | 'other';

export interface AddressDocument {
  street: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  place_id?: string; // Google Places ID
}

export interface LocationDocument extends BaseDocument {
  athlete_id: string;
  name: string;
  type: LocationType;
  address: AddressDocument;
  additional_info?: string;
  is_default: boolean;
  usage_count: number;
  last_used_at?: Timestamp;
  // Daily availability schedule (HH:mm format)
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
 * Location document for creation (without timestamps)
 */
export interface CreateLocationDocument {
  athlete_id: string;
  name: string;
  type: LocationType;
  address: AddressDocument;
  additional_info?: string;
  is_default: boolean;
  usage_count: number;
  // Daily availability schedule (HH:mm format)
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

// ============================================================================
// DAILY SLOT DOCUMENT - whereabouts_daily_slots/{slotId}
// ============================================================================

export interface TimeSlotDocument {
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  location_id: string;
  location_name?: string; // Denormalized
  location_address?: string; // Denormalized
}

export interface DailySlotDocument extends BaseDocument {
  quarter_id: string;
  athlete_id: string;
  date: string; // YYYY-MM-DD format
  slot_60min: TimeSlotDocument;
  overnight_location_id?: string;
  overnight_location_name?: string;
  is_complete: boolean;
  modification_count: number;
  // Location type for pattern matching
  location_type?: 'home' | 'training' | 'gym';
  notes?: string;
}

/**
 * Daily slot document for creation
 */
export interface CreateDailySlotDocument {
  quarter_id: string;
  athlete_id: string;
  date: string;
  slot_60min: TimeSlotDocument;
  overnight_location_id?: string;
  overnight_location_name?: string;
  is_complete: boolean;
  modification_count: number;
  location_type?: 'home' | 'training' | 'gym';
  notes?: string;
}

// ============================================================================
// TEMPLATE DOCUMENT - whereabouts_templates/{templateId}
// ============================================================================

export interface DayScheduleDocument {
  slot_60min: {
    start_time: string;
    end_time: string;
    location_id: string;
  };
  overnight_location_id?: string;
}

export interface WeeklyTemplateDocument extends BaseDocument {
  athlete_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  monday: DayScheduleDocument;
  tuesday: DayScheduleDocument;
  wednesday: DayScheduleDocument;
  thursday: DayScheduleDocument;
  friday: DayScheduleDocument;
  saturday: DayScheduleDocument;
  sunday: DayScheduleDocument;
  usage_count: number;
}

/**
 * Template document for creation
 */
export interface CreateWeeklyTemplateDocument {
  athlete_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  monday: DayScheduleDocument;
  tuesday: DayScheduleDocument;
  wednesday: DayScheduleDocument;
  thursday: DayScheduleDocument;
  friday: DayScheduleDocument;
  saturday: DayScheduleDocument;
  sunday: DayScheduleDocument;
  usage_count: number;
}

// ============================================================================
// COMPETITION DOCUMENT - competitions/{competitionId}
// ============================================================================

export type CompetitionStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface CompetitionDocument extends BaseDocument {
  athlete_id: string;
  name: string;
  sport_id: string;
  start_date: string;
  end_date: string;
  location: AddressDocument;
  accommodation_location?: AddressDocument;
  is_international: boolean;
  status: CompetitionStatus;
}

// ============================================================================
// NOTIFICATION DOCUMENT - notifications/{notificationId}
// ============================================================================

export type NotificationType =
  | 'quarterly_reminder'
  | 'deadline_warning'
  | 'daily_slot_reminder'
  | 'submission_confirmation'
  | 'update_required'
  | 'system';

export interface NotificationDocument extends BaseDocument {
  athlete_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  sent_at: Timestamp;
  read_at?: Timestamp;
}

// ============================================================================
// NOTIFICATION PREFERENCES - notification_preferences/{userId}
// ============================================================================

export interface NotificationPreferencesDocument extends BaseDocument {
  athlete_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  monthly_reminder: boolean;
  deadline_reminders: {
    days_30: boolean;
    days_14: boolean;
    days_7: boolean;
    days_3: boolean;
    days_1: boolean;
  };
  daily_slot_reminder: boolean;
  daily_slot_reminder_minutes_before: number;
}

// ============================================================================
// AUDIT LOG DOCUMENT - audit_logs/{logId}
// ============================================================================

export type AuditAction = 'create' | 'update' | 'delete' | 'submit' | 'view';
export type AuditEntityType = 'whereabouts' | 'location' | 'profile' | 'competition' | 'slot';

export interface AuditLogDocument {
  athlete_id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  previous_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Timestamp;
}

// ============================================================================
// COLLECTION PATHS
// ============================================================================

export const COLLECTIONS = {
  USERS: 'users',
  ATHLETES: 'athletes',
  SPORTS: 'sports',
  WHEREABOUTS_QUARTERS: 'whereabouts_quarters',
  WHEREABOUTS_LOCATIONS: 'whereabouts_locations',
  WHEREABOUTS_DAILY_SLOTS: 'whereabouts_daily_slots',
  WHEREABOUTS_TEMPLATES: 'whereabouts_templates',
  COMPETITIONS: 'competitions',
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  AUDIT_LOGS: 'audit_logs',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

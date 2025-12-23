/**
 * Core TypeScript types for CIOC Athlete Whereabouts App
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Athlete {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationality: string;
  sportId: string;
  sportName: string;
  profilePhotoUrl?: string;
  testingPoolLevel: 'RTP' | 'NTP' | 'DTP'; // Registered, National, Domestic Testing Pool
  wadaId?: string;
  ciocAthleteNumber?: string;
  emergencyContact?: EmergencyContact;
  noc_id: string;
  residence_status: 'local' | 'overseas';
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface Sport {
  id: string;
  name: string;
  code: string; // e.g., "ATH" for Athletics
  federation: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  athlete: Athlete | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  sportId: string;
  phoneNumber?: string;
}

// ============================================================================
// WHEREABOUTS TYPES
// ============================================================================

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface WhereaboutsQuarter {
  id: string;
  athleteId: string;
  year: number;
  quarter: Quarter;
  startDate: Date;
  endDate: Date;
  status: QuarterStatus;
  completionPercentage: number;
  submittedAt?: Date;
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type QuarterStatus =
  | 'draft'           // Not started or in progress
  | 'incomplete'      // Started but missing required fields
  | 'complete'        // All fields filled
  | 'submitted'       // Submitted to WADA
  | 'locked';         // Past quarter, no edits allowed

export interface WhereaboutsLocation {
  id: string;
  athleteId: string;
  name: string;
  type: LocationType;
  address: Address;
  additionalInfo?: string; // Gate code, parking, unit #
  isDefault: boolean;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Location form data for creating/updating locations
 */
export interface LocationFormData {
  name: string;
  type: LocationType;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  additionalInfo?: string;
  isDefault: boolean;
}

/**
 * Grouped locations by type for display
 */
export interface GroupedLocations {
  type: LocationType;
  label: string;
  locations: WhereaboutsLocation[];
}

export type LocationType =
  | 'home'
  | 'training'
  | 'gym'
  | 'competition'
  | 'work'
  | 'school'
  | 'hotel'
  | 'other';

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  placeId?: string; // Google Places ID
}

export interface DailySlot {
  id: string;
  quarterId: string;
  athleteId: string;
  date: Date;
  dateString: string; // YYYY-MM-DD format for easy lookup
  slot60Min: TimeSlot;
  overnightLocation?: WhereaboutsLocation;
  additionalLocations?: DayLocation[];
  isComplete: boolean;
  lastModifiedAt: Date;
  modificationHistory?: SlotModification[];
}

export interface TimeSlot {
  startTime: string; // HH:MM format (24hr)
  endTime: string;   // HH:MM format (24hr)
  locationId: string;
  locationName?: string; // Denormalized for display
  locationAddress?: string; // Denormalized for display
}

export interface DayLocation {
  startTime: string;
  endTime: string;
  locationId: string;
  activityType?: ActivityType;
}

export type ActivityType =
  | 'training'
  | 'competition'
  | 'travel'
  | 'rest'
  | 'other';

export interface SlotModification {
  modifiedAt: Date;
  previousValue: TimeSlot;
  newValue: TimeSlot;
  reason?: string;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface WeeklyTemplate {
  id: string;
  athleteId: string;
  name: string;
  isDefault: boolean;
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  createdAt: Date;
  updatedAt: Date;
}

export interface DaySchedule {
  slot60Min: {
    startTime: string;
    endTime: string;
    locationId: string;
  };
  overnightLocationId?: string;
  additionalActivities?: TemplateActivity[];
}

export interface TemplateActivity {
  startTime: string;
  endTime: string;
  locationId: string;
  activityType: ActivityType;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// ============================================================================
// LOCATION WITH SCHEDULE TYPES
// ============================================================================

export interface LocationWithSchedule {
  address_line1: string;
  address_line2?: string;
  city: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  additional_info?: string;
  monday_start: string;
  monday_end: string;
  tuesday_start: string;
  tuesday_end: string;
  wednesday_start: string;
  wednesday_end: string;
  thursday_start: string;
  thursday_end: string;
  friday_start: string;
  friday_end: string;
  saturday_start: string;
  saturday_end: string;
  sunday_start: string;
  sunday_end: string;
  created_at?: string; // ISO date string for Redux serialization
  updated_at?: string; // ISO date string for Redux serialization
}

// ============================================================================
// COMPETITION TYPES
// ============================================================================

export interface Competition {
  id: string;
  athlete_id: string;
  name: string;
  start_date: string;
  end_date: string;
  location_address: string;
  city: string;
  country: string;
  additional_info?: string;
  created_at: string; // ISO date string for Redux serialization
  updated_at: string; // ISO date string for Redux serialization
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  athleteId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
}

export type NotificationType =
  | 'quarterly_reminder'
  | 'deadline_warning'
  | 'daily_slot_reminder'
  | 'submission_confirmation'
  | 'update_required'
  | 'system';

export interface NotificationPreferences {
  athleteId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  monthlyReminder: boolean;
  deadlineReminders: {
    days30: boolean;
    days14: boolean;
    days7: boolean;
    days3: boolean;
    days1: boolean;
  };
  dailySlotReminder: boolean;
  dailySlotReminderMinutesBefore: number; // Default 30
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface UIState {
  isLoading: boolean;
  loadingMessage?: string;
  toast: ToastMessage | null;
  isOffline: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// COMPLIANCE TYPES
// ============================================================================

export interface ComplianceStatus {
  athleteId: string;
  currentQuarter: QuarterInfo;
  missedTests: number;
  filingFailures: number;
  lastTestDate?: Date;
  riskLevel: 'low' | 'medium' | 'high';
  nextDeadline: Date;
  daysUntilDeadline: number;
}

export interface QuarterInfo {
  year: number;
  quarter: Quarter;
  startDate: Date;
  endDate: Date;
  filingDeadline: Date;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  athleteId: string;
  action: AuditAction;
  entityType: 'whereabouts' | 'location' | 'profile' | 'competition';
  entityId: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'submit'
  | 'view';

// ============================================================================
// WEEKLY PATTERN TYPES (for Quarter Filing)
// ============================================================================

/**
 * Slot location type for the 60-minute daily slot
 */
export type SlotLocationType = 'home' | 'training' | 'gym';

/**
 * Single day's slot pattern
 */
export interface DaySlotPattern {
  location_type: SlotLocationType;
  time_start: string; // HH:mm format
  time_end: string;   // HH:mm format
}

/**
 * Weekly pattern for applying to quarter days
 * Each day specifies where the athlete will be for their 60-minute slot
 */
export interface WeeklyPattern {
  id?: string;
  athlete_id?: string;
  name?: string;
  is_default?: boolean;
  monday: DaySlotPattern;
  tuesday: DaySlotPattern;
  wednesday: DaySlotPattern;
  thursday: DaySlotPattern;
  friday: DaySlotPattern;
  saturday: DaySlotPattern;
  sunday: DaySlotPattern;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Daily slot selection for a specific date in the quarter
 */
export interface DailySlotSelection {
  date: string;              // ISO date YYYY-MM-DD
  location_type: SlotLocationType;
  time_start: string;        // HH:mm format
  time_end: string;          // HH:mm format
  location_name?: string;    // Denormalized for display
  location_address?: string; // Denormalized for display
  notes?: string;
  is_competition?: boolean;  // If this day is a competition override
  competition_id?: string;   // Reference to competition if applicable
}

/**
 * Quarter filing wizard step
 */
export type QuarterFilingStep =
  | 'select_quarter'
  | 'choose_method'
  | 'build_pattern'
  | 'review'
  | 'adjustments';

/**
 * Filing method options
 */
export type FilingMethod =
  | 'use_template'
  | 'create_pattern'
  | 'copy_previous'
  | 'manual';

/**
 * Quarter filing wizard state
 */
export interface QuarterFilingWizardState {
  currentStep: QuarterFilingStep;
  selectedYear: number;
  selectedQuarter: Quarter;
  filingMethod: FilingMethod | null;
  selectedTemplateId: string | null;
  weeklyPattern: WeeklyPattern | null;
  dailySlots: DailySlotSelection[];
  isApplying: boolean;
  progress: number; // 0-100
}

/**
 * Pattern copy options
 */
export type PatternCopyTarget =
  | 'all_days'
  | 'weekdays'
  | 'weekends';

/**
 * Day schedule info for pattern builder display
 */
export interface DayScheduleInfo {
  day: DayOfWeek;
  pattern: DaySlotPattern;
  locationAvailable: boolean;
  locationHours?: { start: string; end: string };
  warning?: string;
}

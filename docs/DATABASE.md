# CIOC Athlete Whereabouts - Database Schema

This document describes the Firebase Firestore database schema for the CIOC Athlete Whereabouts application.

## Collections Overview

| Collection | Description | Access |
|------------|-------------|--------|
| `users` | User authentication profiles | Owner, Admin |
| `athletes` | Athlete personal information | Owner, Admin |
| `sports` | List of supported sports | Public read |
| `whereabouts_quarters` | Quarterly whereabouts submissions | Owner, Admin |
| `whereabouts_locations` | Athlete saved locations | Owner, Admin |
| `whereabouts_daily_slots` | Daily 60-minute testing slots | Owner, Admin |
| `whereabouts_templates` | Weekly pattern templates | Owner, Admin |
| `competitions` | Athlete competitions | Owner, Admin |
| `notifications` | Push notifications | Owner |
| `notification_preferences` | User notification settings | Owner |
| `audit_logs` | Compliance audit trail | Admin only |
| `system_config` | App configuration | Admin only |

---

## Collection Details

### 1. `users/{userId}`

User authentication and account information.

```typescript
{
  email: string;                    // User email address
  role: 'athlete' | 'admin' | 'super_admin';
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  requires_password_change: boolean;
  last_login_at?: Timestamp;
  fcm_tokens?: string[];           // Firebase Cloud Messaging tokens
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:** None required (queries by document ID)

---

### 2. `athletes/{athleteId}`

Athlete profile and personal information. Document ID matches user ID.

```typescript
{
  user_id: string;                 // Reference to users collection
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;           // ISO format YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  sport_id: string;                // Reference to sports collection
  sport_name?: string;             // Denormalized for display
  nationality: string;
  noc_id: string;                  // National Olympic Committee ID (e.g., "CAY")
  residence_status: 'local' | 'overseas';
  testing_pool_status: 'NONE' | 'RTP' | 'TP';
  status: 'active' | 'inactive' | 'retired';
  wada_id?: string;
  cioc_athlete_number?: string;
  profile_photo_url?: string;
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:**
- `sport_id` + `status` + `last_name`
- `testing_pool_status` + `status`

---

### 3. `sports/{sportId}`

Available sports for athlete registration.

```typescript
{
  name: string;                    // e.g., "Athletics"
  code: string;                    // e.g., "ATH"
  federation: string;              // Governing body name
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:** None required (small collection, read-only)

---

### 4. `whereabouts_quarters/{quarterId}`

Quarterly whereabouts filing periods.

```typescript
{
  athlete_id: string;              // Reference to athletes collection
  year: number;                    // e.g., 2024
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  start_date: string;              // ISO format YYYY-MM-DD
  end_date: string;
  filing_deadline: string;
  status: 'draft' | 'incomplete' | 'complete' | 'submitted' | 'locked';
  completion_percentage: number;   // 0-100
  days_completed: number;
  total_days: number;              // Usually 90-92 days
  submitted_at?: Timestamp;
  locked_at?: Timestamp;
  copied_from_quarter_id?: string; // If copied from previous quarter
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:**
- `athlete_id` + `year` (DESC) + `quarter` (DESC)
- `athlete_id` + `status`
- `status` + `filing_deadline`

---

### 5. `whereabouts_locations/{locationId}`

Saved locations for athletes.

```typescript
{
  athlete_id: string;
  name: string;                    // e.g., "Home", "Truman Bodden Complex"
  type: 'home' | 'training' | 'gym' | 'competition' | 'work' | 'school' | 'hotel' | 'other';
  address: {
    street: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    place_id?: string;             // Google Places ID
  };
  additional_info?: string;        // Gate codes, parking info, etc.
  is_default: boolean;             // Default location for this type
  usage_count: number;             // Track usage for suggestions
  last_used_at?: Timestamp;

  // Daily availability schedule (HH:mm format)
  monday_start?: string;           // e.g., "05:00"
  monday_end?: string;             // e.g., "22:00"
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

  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:**
- `athlete_id` + `type` + `is_default` (DESC)
- `athlete_id` + `usage_count` (DESC)

---

### 6. `whereabouts_daily_slots/{slotId}`

Daily 60-minute testing availability slots.

```typescript
{
  quarter_id: string;              // Reference to whereabouts_quarters
  athlete_id: string;              // Reference to athletes (denormalized)
  date: string;                    // ISO format YYYY-MM-DD
  slot_60min: {
    start_time: string;            // HH:mm format (24hr)
    end_time: string;
    location_id: string;
    location_name?: string;        // Denormalized for display
    location_address?: string;     // Denormalized for display
  };
  overnight_location_id?: string;
  overnight_location_name?: string;
  is_complete: boolean;
  modification_count: number;      // Track changes for compliance
  location_type?: 'home' | 'training' | 'gym'; // For pattern matching
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:**
- `quarter_id` + `date`
- `athlete_id` + `date`
- `athlete_id` + `is_complete` + `date`

---

### 7. `whereabouts_templates/{templateId}`

Weekly pattern templates for quick filing.

```typescript
{
  athlete_id: string;
  name: string;                    // e.g., "Regular Training Week"
  description?: string;
  is_default: boolean;             // Default template for this athlete

  // Each day has a slot configuration
  monday: {
    slot_60min: {
      start_time: string;          // HH:mm format
      end_time: string;
      location_id: string;
    };
    overnight_location_id?: string;
  };
  tuesday: { /* same structure */ };
  wednesday: { /* same structure */ };
  thursday: { /* same structure */ };
  friday: { /* same structure */ };
  saturday: { /* same structure */ };
  sunday: { /* same structure */ };

  usage_count: number;             // Track how often template is used
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:**
- `athlete_id` + `is_default` (DESC) + `usage_count` (DESC)
- `athlete_id` + `created_at` (DESC)

---

### 8. `competitions/{competitionId}`

Athlete competition schedule.

```typescript
{
  athlete_id: string;
  name: string;                    // e.g., "CARIFTA Games 2024"
  sport_id: string;
  start_date: string;              // ISO format
  end_date: string;
  location: {
    street: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  accommodation_location?: {       // Hotel/accommodation address
    /* same structure as location */
  };
  is_international: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:**
- `athlete_id` + `start_date`
- `athlete_id` + `status` + `start_date`

---

### 9. `notifications/{notificationId}`

Push notifications sent to athletes.

```typescript
{
  athlete_id: string;
  type: 'quarterly_reminder' | 'deadline_warning' | 'daily_slot_reminder' |
        'submission_confirmation' | 'update_required' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>; // Custom data for deep linking
  is_read: boolean;
  sent_at: Timestamp;
  read_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:**
- `athlete_id` + `is_read` + `sent_at` (DESC)
- `athlete_id` + `sent_at` (DESC)

---

### 10. `notification_preferences/{userId}`

User notification settings.

```typescript
{
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
  daily_slot_reminder_minutes_before: number; // e.g., 30
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Indexes:** None required (queries by document ID)

---

### 11. `audit_logs/{logId}`

Immutable audit trail for compliance.

```typescript
{
  athlete_id: string;
  action: 'create' | 'update' | 'delete' | 'submit' | 'view';
  entity_type: 'whereabouts' | 'location' | 'profile' | 'competition' | 'slot';
  entity_id: string;
  previous_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Timestamp;
}
```

**Indexes:**
- `athlete_id` + `timestamp` (DESC)
- `entity_type` + `entity_id` + `timestamp` (DESC)
- `action` + `timestamp` (DESC)

---

### 12. `system_config/{configId}`

Application configuration (admin-managed).

```typescript
// app_settings document
{
  app_name: string;
  app_version: string;
  min_supported_version: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  updated_at: Timestamp;
}

// filing_settings document
{
  advance_filing_days: number;     // Days before quarter to start filing
  reminder_days: number[];         // Days before deadline for reminders
  slot_duration_minutes: number;   // Always 60 for WADA compliance
  earliest_slot_time: string;      // "05:00"
  latest_slot_time: string;        // "23:00"
  updated_at: Timestamp;
}

// notification_settings document
{
  default_daily_reminder_minutes: number;
  max_notifications_per_day: number;
  updated_at: Timestamp;
}
```

---

## Data Relationships

```
users (1) ─────┬───── (1) athletes
               │
               └───── (1) notification_preferences

athletes (1) ──┬───── (N) whereabouts_quarters ───── (N) whereabouts_daily_slots
               │
               ├───── (N) whereabouts_locations
               │
               ├───── (N) whereabouts_templates
               │
               ├───── (N) competitions
               │
               ├───── (N) notifications
               │
               └───── (N) audit_logs

sports (1) ────────── (N) athletes
```

---

## Security Rules Summary

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| users | Owner, Admin | Owner (signup) | Owner*, Admin | Super Admin |
| athletes | Owner, Admin | Owner | Owner*, Admin | Admin |
| sports | Public | Admin | Admin | Admin |
| whereabouts_quarters | Owner, Admin | Owner | Owner (if not locked) | Admin |
| whereabouts_locations | Owner, Admin | Owner | Owner | Owner |
| whereabouts_daily_slots | Owner, Admin | Owner | Owner | Admin |
| whereabouts_templates | Owner, Admin | Owner | Owner | Owner |
| competitions | Owner, Admin | Owner | Owner | Owner |
| notifications | Owner | Admin | Owner (read status only) | Admin |
| notification_preferences | Owner | Owner | Owner | Owner |
| audit_logs | Admin | Authenticated | Never | Never |
| system_config | Authenticated | Super Admin | Super Admin | Super Admin |

\* Some fields are protected from owner updates (e.g., role, testing_pool_status)

---

## Setup Instructions

### 1. Deploy Security Rules

```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

### 3. Seed Initial Data

```bash
# Set your service account credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

# Run seed script
npx ts-node scripts/seed-firestore.ts
```

### 4. Use Firebase Emulator (Development)

```bash
# Start emulators
firebase emulators:start

# Access Firestore UI at http://localhost:4000
```

---

## Best Practices

1. **Denormalization**: Location names and addresses are denormalized in daily slots for performance
2. **Timestamps**: All documents include `created_at` and `updated_at` fields
3. **Soft Deletes**: Consider using `is_active` flags instead of hard deletes
4. **Batch Writes**: Use batch operations when creating/updating multiple daily slots
5. **Offline Support**: Firestore automatically caches data for offline access
6. **Index Management**: Add new indexes as query patterns emerge

---

## Backup Strategy

1. Enable daily automated backups in Firebase Console
2. Export data before major migrations
3. Use point-in-time recovery for compliance requirements

```bash
# Export all collections
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)
```

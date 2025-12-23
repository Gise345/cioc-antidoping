/**
 * Client-side Firestore Seed Utility
 * Uses Firebase client SDK (not Admin SDK) for seeding initial data
 *
 * This can be called from the app during development or testing
 */

import { collection, doc, getDocs, writeBatch, serverTimestamp, query, limit } from 'firebase/firestore';
import { getFirestoreDb } from '../api/firebase';

// ============================================================================
// SEED DATA
// ============================================================================

/**
 * Sports available in the Cayman Islands
 */
const SPORTS = [
  { name: 'Athletics', code: 'ATH', federation: 'CAAA - Cayman Islands Amateur Athletic Association' },
  { name: 'Swimming', code: 'SWM', federation: 'CIASA - Cayman Islands Amateur Swimming Association' },
  { name: 'Football (Soccer)', code: 'FTB', federation: 'CIFA - Cayman Islands Football Association' },
  { name: 'Basketball', code: 'BKB', federation: 'CIBA - Cayman Islands Basketball Association' },
  { name: 'Tennis', code: 'TEN', federation: 'CILTA - Cayman Islands Lawn Tennis Association' },
  { name: 'Volleyball', code: 'VBL', federation: 'CIVF - Cayman Islands Volleyball Federation' },
  { name: 'Cycling', code: 'CYC', federation: 'CICA - Cayman Islands Cycling Association' },
  { name: 'Boxing', code: 'BOX', federation: 'CIBA - Cayman Islands Boxing Association' },
  { name: 'Triathlon', code: 'TRI', federation: 'CITA - Cayman Islands Triathlon Association' },
  { name: 'Judo', code: 'JUD', federation: 'CIJA - Cayman Islands Judo Association' },
  { name: 'Sailing', code: 'SAL', federation: 'CISA - Cayman Islands Sailing Association' },
  { name: 'Golf', code: 'GLF', federation: 'CIGA - Cayman Islands Golf Association' },
  { name: 'Rugby', code: 'RUG', federation: 'CIRFU - Cayman Islands Rugby Football Union' },
  { name: 'Netball', code: 'NTB', federation: 'CINA - Cayman Islands Netball Association' },
  { name: 'Squash', code: 'SQH', federation: 'CISRA - Cayman Islands Squash Rackets Association' },
  { name: 'Table Tennis', code: 'TTN', federation: 'CITTA - Cayman Islands Table Tennis Association' },
  { name: 'Badminton', code: 'BDM', federation: 'CIBA - Cayman Islands Badminton Association' },
  { name: 'Cricket', code: 'CRK', federation: 'CICA - Cayman Islands Cricket Association' },
  { name: 'Field Hockey', code: 'HOC', federation: 'CIHA - Cayman Islands Hockey Association' },
  { name: 'Equestrian', code: 'EQU', federation: 'CIEF - Cayman Islands Equestrian Federation' },
];

/**
 * System configuration defaults
 */
const SYSTEM_CONFIG = {
  app_settings: {
    app_name: 'CIOC Athlete Whereabouts',
    app_version: '1.0.0',
    min_supported_version: '1.0.0',
    maintenance_mode: false,
    maintenance_message: '',
  },
  filing_settings: {
    advance_filing_days: 15,
    reminder_days: [30, 14, 7, 3, 1],
    slot_duration_minutes: 60,
    earliest_slot_time: '05:00',
    latest_slot_time: '23:00',
  },
  notification_settings: {
    default_daily_reminder_minutes: 30,
    max_notifications_per_day: 5,
  },
};

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

export interface SeedResult {
  success: boolean;
  message: string;
  sportsCreated?: number;
  configCreated?: number;
}

/**
 * Check if database has already been seeded
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const db = getFirestoreDb();
    const sportsRef = collection(db, 'sports');
    const snapshot = await getDocs(query(sportsRef, limit(1)));
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if database is seeded:', error);
    return false;
  }
}

/**
 * Seed sports collection
 */
async function seedSports(): Promise<number> {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  const sportsRef = collection(db, 'sports');

  for (const sport of SPORTS) {
    const docRef = doc(sportsRef);
    batch.set(docRef, {
      ...sport,
      is_active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }

  await batch.commit();
  return SPORTS.length;
}

/**
 * Seed system configuration
 */
async function seedSystemConfig(): Promise<number> {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  const configRef = collection(db, 'system_config');

  for (const [key, value] of Object.entries(SYSTEM_CONFIG)) {
    const docRef = doc(configRef, key);
    batch.set(docRef, {
      ...value,
      updated_at: serverTimestamp(),
    });
  }

  await batch.commit();
  return Object.keys(SYSTEM_CONFIG).length;
}

/**
 * Main seed function
 * Call this to populate the database with initial data
 */
export async function seedFirestore(): Promise<SeedResult> {
  console.log('Starting Firestore seed...');

  try {
    // Check if already seeded
    const isSeeded = await isDatabaseSeeded();
    if (isSeeded) {
      return {
        success: true,
        message: 'Database already seeded. To re-seed, delete the sports collection first.',
      };
    }

    // Seed data
    const sportsCreated = await seedSports();
    console.log(`Created ${sportsCreated} sports`);

    const configCreated = await seedSystemConfig();
    console.log(`Created ${configCreated} system config documents`);

    return {
      success: true,
      message: 'Database seeded successfully!',
      sportsCreated,
      configCreated,
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    return {
      success: false,
      message: `Failed to seed database: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get current database stats
 */
export async function getDatabaseStats(): Promise<{ sports: number; config: number }> {
  try {
    const db = getFirestoreDb();
    const [sportsSnapshot, configSnapshot] = await Promise.all([
      getDocs(collection(db, 'sports')),
      getDocs(collection(db, 'system_config')),
    ]);

    return {
      sports: sportsSnapshot.size,
      config: configSnapshot.size,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { sports: 0, config: 0 };
  }
}

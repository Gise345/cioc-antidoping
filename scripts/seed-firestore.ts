/**
 * Firestore Seed Script
 * Populates the database with initial data for development and testing
 *
 * Usage:
 *   npx ts-node scripts/seed-firestore.ts
 *
 * Prerequisites:
 *   - Firebase CLI must be logged in: firebase login
 *   - Project must be set: firebase use cioc-antidoping
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin using Application Default Credentials
// This works when logged in via Firebase CLI
initializeApp({
  credential: applicationDefault(),
  projectId: 'cioc-antidoping',
});

const db = getFirestore();

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

/**
 * Seed sports collection
 */
async function seedSports(): Promise<void> {
  console.log('Seeding sports...');
  const batch = db.batch();
  const sportsRef = db.collection('sports');

  for (const sport of SPORTS) {
    const docRef = sportsRef.doc();
    batch.set(docRef, {
      ...sport,
      is_active: true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`  Created ${SPORTS.length} sports`);
}

/**
 * Seed system configuration
 */
async function seedSystemConfig(): Promise<void> {
  console.log('Seeding system configuration...');
  const configRef = db.collection('system_config');

  for (const [key, value] of Object.entries(SYSTEM_CONFIG)) {
    await configRef.doc(key).set({
      ...value,
      updated_at: FieldValue.serverTimestamp(),
    });
  }

  console.log('  System configuration created');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('CIOC Athlete Whereabouts - Firestore Seed Script');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Check if already seeded
    const sportsSnapshot = await db.collection('sports').limit(1).get();
    if (!sportsSnapshot.empty) {
      console.log('Database already seeded!');
      console.log('To re-seed, delete the sports collection first.');
      console.log('');

      // Show current stats
      const [sports, config] = await Promise.all([
        db.collection('sports').get(),
        db.collection('system_config').get(),
      ]);

      console.log('Current database stats:');
      console.log(`  - Sports: ${sports.size}`);
      console.log(`  - System config docs: ${config.size}`);
      return;
    }

    // Seed data
    await seedSports();
    await seedSystemConfig();

    console.log('');
    console.log('='.repeat(60));
    console.log('Seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    console.log('1. Create a test user in Firebase Console > Authentication');
    console.log('2. Run the app: npx expo start');
    console.log('3. Sign up/login with the test user');
    console.log('');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run
main().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

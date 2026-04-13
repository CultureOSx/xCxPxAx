/**
 * Seed Auth + Firestore on the Firebase Emulator for local QA:
 * - Test user (email/password from env)
 * - users/{uid} doc (organizer)
 * - profiles/{id} organisation "The CAP"
 * - 5 published events linked via publisherProfileId + organizerId
 *
 * Prerequisites:
 *   firebase emulators:start --only auth,firestore
 *
 * Run (from repo root or functions/):
 *   cd functions && npx tsx scripts/seed-emulator-cap-org.ts
 *
 * Env (optional):
 *   SEED_TEST_EMAIL, SEED_TEST_PASSWORD, SEED_PROJECT_ID,
 *   FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST
 */

import * as admin from 'firebase-admin';
import * as geofire from 'geofire-common';

const PROJECT_ID =
  process.env.SEED_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  process.env.FIREBASE_PROJECT_ID ??
  'culturepass-4f264';

const EMAIL = process.env.SEED_TEST_EMAIL ?? 'cap-emulator@test.local';
const PASSWORD = process.env.SEED_TEST_PASSWORD ?? 'CapEmulator1!';

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const auth = admin.auth();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const SEED_BATCH = 'cap-emulator';
const ORG_NAME = 'The CAP';

const SYDNEY = { lat: -33.8688, lng: 151.2093 };

function nowIso(): string {
  return new Date().toISOString();
}

function cpid(prefix: string): string {
  const n = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CP-${prefix}-${n}`;
}

async function main(): Promise<void> {
  console.log(`[seed] project=${PROJECT_ID} auth=${process.env.FIREBASE_AUTH_EMULATOR_HOST} firestore=${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`[seed] email=${EMAIL}`);

  let user: admin.auth.UserRecord;
  try {
    user = await auth.createUser({
      email: EMAIL,
      password: PASSWORD,
      emailVerified: true,
      displayName: 'CAP Tester',
    });
    console.log(`[seed] created Auth user uid=${user.uid}`);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/email-already-exists') {
      user = await auth.getUserByEmail(EMAIL);
      console.log(`[seed] using existing Auth user uid=${user.uid}`);
    } else {
      throw e;
    }
  }

  const uid = user.uid;
  const now = nowIso();

  await db
    .collection('users')
    .doc(uid)
    .set(
      {
        id: uid,
        username: EMAIL.split('@')[0]!.replace(/[^a-z0-9_]/gi, '_').toLowerCase() || 'cap_tester',
        displayName: 'CAP Tester',
        email: EMAIL,
        role: 'organizer',
        culturePassId: cpid('USR'),
        city: 'Sydney',
        country: 'Australia',
        membership: { tier: 'free', isActive: true },
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  console.log(`[seed] upserted users/${uid}`);

  const ownedProfiles = await db.collection('profiles').where('ownerId', '==', uid).get();
  const orgDoc = ownedProfiles.docs.find(
    (d) => d.data().entityType === 'organisation' && d.data().name === ORG_NAME,
  );

  let profileId: string;
  if (orgDoc) {
    profileId = orgDoc.id;
    await orgDoc.ref.set(
      {
        name: ORG_NAME,
        description: 'Emulator seed organisation for CulturePass local testing.',
        city: 'Sydney',
        country: 'Australia',
        status: 'published',
        updatedAt: now,
      },
      { merge: true },
    );
    console.log(`[seed] updated profiles/${profileId} (${ORG_NAME})`);
  } else {
    const ref = db.collection('profiles').doc();
    profileId = ref.id;
    await ref.set({
      id: profileId,
      entityType: 'organisation',
      name: ORG_NAME,
      description: 'Emulator seed organisation for CulturePass local testing.',
      city: 'Sydney',
      country: 'Australia',
      ownerId: uid,
      isVerified: false,
      status: 'published',
      handleStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    console.log(`[seed] created profiles/${profileId} (${ORG_NAME})`);
  }

  const prior = await db.collection('events').where('organizerId', '==', uid).get();
  let removed = 0;
  for (const d of prior.docs) {
    const meta = d.data().metadata as { seedBatch?: string } | undefined;
    if (meta?.seedBatch === SEED_BATCH) {
      await d.ref.delete();
      removed += 1;
    }
  }
  if (removed) console.log(`[seed] removed ${removed} prior seed events`);

  const geoHash = geofire.geohashForLocation([SYDNEY.lat, SYDNEY.lng]);

  for (let i = 1; i <= 5; i += 1) {
    const ref = db.collection('events').doc();
    const day = String(8 + i).padStart(2, '0');
    await ref.set({
      id: ref.id,
      title: `${ORG_NAME} — Seed Event ${i}`,
      description: `Emulator seed event ${i} for ${ORG_NAME}. Safe to delete.`,
      communityId: 'emulator-seed',
      venue: `${ORG_NAME} Hall`,
      address: `${i} Seed Street, Sydney NSW`,
      date: `2026-06-${day}`,
      time: `${10 + i}:00`,
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      latitude: SYDNEY.lat,
      longitude: SYDNEY.lng,
      geoHash,
      category: 'Community',
      eventType: 'community',
      organizerId: uid,
      organizer: ORG_NAME,
      publisherProfileId: profileId,
      status: 'published',
      isFree: i % 2 === 0,
      priceCents: i % 2 === 0 ? 0 : 1500 + i * 250,
      priceLabel: i % 2 === 0 ? 'Free' : `$${(15 + i * 2.5).toFixed(0)}`,
      capacity: 80 + i * 10,
      attending: 0,
      imageUrl: '',
      imageColor: '#0066CC',
      cpid: cpid('EVT'),
      metadata: { seedBatch: SEED_BATCH },
      createdAt: now,
      updatedAt: now,
    });
    console.log(`[seed] created events/${ref.id} (${i}/5)`);
  }

  console.log('[seed] done. Sign in the app against emulators with the same email/password you set in env (or defaults).');
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});

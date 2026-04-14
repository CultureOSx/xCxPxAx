/**
 * Firebase Admin SDK initialization — Cloud Functions side only.
 * Never imported by the Expo client bundle.
 */

import * as admin from 'firebase-admin';
import Stripe from 'stripe';

/** Used for Admin SDK init — avoids "Unable to detect a Project Id" when FIREBASE_CONFIG is unset (e.g. `tsx scripts/server-dev.ts`). */
const resolvedProjectId =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.GOOGLE_CLOUD_PROJECT ??
  process.env.GCLOUD_PROJECT ??
  process.env.PROJECT_ID ??
  'culturepass-4f264';

const explicitBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: resolvedProjectId,
    ...(explicitBucket ? { storageBucket: explicitBucket } : {}),
  });
}

/** Firestore database instance */
export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

/** Firebase Auth Admin instance (for verifyIdToken, setCustomUserClaims, etc.) */
export const authAdmin = admin.auth();

/** Firebase Storage bucket (for image uploads) */
export const storageBucket = (() => {
  try {
    return admin.storage().bucket();
  } catch {
    return null;
  }
})();

export const projectId = admin.apps[0]?.options?.projectId ?? resolvedProjectId;

/**
 * True when Firestore should be reachable: production CF, local ADC, Functions emulator,
 * or Firestore emulator (`FIRESTORE_EMULATOR_HOST` — required for `npm run test:integration` against emulators).
 * `projectId` alone does not imply live queries work without one of these.
 */
export const isFirestoreConfigured = Boolean(
  process.env.FUNCTIONS_EMULATOR ||
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.K_SERVICE // Cloud Functions production env
);

/** Stripe instance */
export const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any,
    })
  : null;

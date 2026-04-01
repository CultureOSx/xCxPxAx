/**
 * Firebase client SDK initialization — Expo app side.
 * Consumed by lib/auth.tsx and any screen that needs client Firebase access.
 *
 * All config is read from EXPO_PUBLIC_* env vars so they are baked
 * into the bundle at build time (Expo convention).
 *
 * ─── Setup ─────────────────────────────────────────────────────────────────
 * 1. Go to: console.firebase.google.com → your project → Project Settings
 *    → Your apps → Web app → SDK setup and configuration
 * 2. Copy the config values into your .env file (see .env.example)
 * 3. For EAS builds set the same vars inside eas.json build.*.env
 * ───────────────────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  connectAuthEmulator,
  type Persistence,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirebaseWebConfig,
  getMissingFirebaseEnvKeys,
  shouldUseFirebaseEmulators,
  getFirebaseEmulatorHost,
} from '@/lib/config';

const missingKeys = getMissingFirebaseEnvKeys();

// Empty EXPO_PUBLIC_FIREBASE_* values produce firebaseConfig.apiKey === ''.
// initializeApp() still runs, but getAuth() then throws auth/invalid-api-key — obscure on Expo web.
if (missingKeys.length > 0) {
  const emulatorNote = shouldUseFirebaseEmulators()
    ? ' Emulator mode still needs the same Web app keys for initializeApp; only traffic is redirected to emulators.\n'
    : '';
  const hint =
    emulatorNote +
    'Copy .env.example to .env, paste your Web app config from Firebase Console → Project settings, ' +
    'then stop and restart Expo (EXPO_PUBLIC_* are baked in at bundler startup).';
  throw new Error(`[CulturePass] Firebase is not configured (missing: ${missingKeys.join(', ')}).\n${hint}`);
}

const firebaseConfig = getFirebaseWebConfig();

// Guard against duplicate initialization in hot-reload / fast refresh
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Firebase Auth instance with platform-appropriate persistence:
 * - Web:     localStorage (Firebase default via getAuth)
 * - Native:  AsyncStorage (survives app restarts)
 *
 * getReactNativePersistence exists in Metro's RN bundle but is absent from the
 * web TypeScript types, so we resolve it via require() to avoid TS2305.
 * initializeAuth throws if called twice on the same app (hot reload),
 * so we fall back to getAuth() which returns the existing instance.
 */
export const auth = (() => {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require('firebase/auth') as {
      getReactNativePersistence: (storage: typeof ReactNativeAsyncStorage) => Persistence;
    };
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (error) {
    const maybeFirebaseError = error as { code?: string; message?: string };
    if (maybeFirebaseError.code !== 'auth/already-initialized') {
      console.warn('[firebase] initializeAuth fallback to getAuth:', maybeFirebaseError.message ?? error);
    }
    // Auth already initialized (Expo fast refresh) or native persistence init failed.
    return getAuth(firebaseApp);
  }
})();

export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp, 'us-central1');

let emulatorsConnected = false;

if (__DEV__ && shouldUseFirebaseEmulators() && !emulatorsConnected) {
  const host = Platform.OS === 'android' ? '10.0.2.2' : getFirebaseEmulatorHost();

  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  } catch {}

  try {
    connectFirestoreEmulator(db, host, 8080);
  } catch {}

  try {
    connectStorageEmulator(storage, host, 9199);
  } catch {}

  try {
    connectFunctionsEmulator(functions, host, 5001);
  } catch {}

  emulatorsConnected = true;
}

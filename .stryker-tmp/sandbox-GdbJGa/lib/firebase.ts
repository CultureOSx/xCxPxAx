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
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, connectAuthEmulator, type Persistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseWebConfig, getMissingFirebaseEnvKeys, shouldUseFirebaseEmulators, getFirebaseEmulatorHost } from '@/lib/config';
const missingKeys = getMissingFirebaseEnvKeys();

// Empty EXPO_PUBLIC_FIREBASE_* values produce firebaseConfig.apiKey === ''.
// initializeApp() still runs, but getAuth() then throws auth/invalid-api-key — obscure on Expo web.
if (stryMutAct_9fa48("3237") ? missingKeys.length <= 0 : stryMutAct_9fa48("3236") ? missingKeys.length >= 0 : stryMutAct_9fa48("3235") ? false : stryMutAct_9fa48("3234") ? true : (stryCov_9fa48("3234", "3235", "3236", "3237"), missingKeys.length > 0)) {
  if (stryMutAct_9fa48("3238")) {
    {}
  } else {
    stryCov_9fa48("3238");
    const emulatorNote = shouldUseFirebaseEmulators() ? stryMutAct_9fa48("3239") ? "" : (stryCov_9fa48("3239"), ' Emulator mode still needs the same Web app keys for initializeApp; only traffic is redirected to emulators.\n') : stryMutAct_9fa48("3240") ? "Stryker was here!" : (stryCov_9fa48("3240"), '');
    const hint = emulatorNote + (stryMutAct_9fa48("3241") ? "" : (stryCov_9fa48("3241"), 'Copy .env.example to .env, paste your Web app config from Firebase Console → Project settings, ')) + (stryMutAct_9fa48("3242") ? "" : (stryCov_9fa48("3242"), 'then stop and restart Expo (EXPO_PUBLIC_* are baked in at bundler startup).'));
    throw new Error(stryMutAct_9fa48("3243") ? `` : (stryCov_9fa48("3243"), `[CulturePass] Firebase is not configured (missing: ${missingKeys.join(stryMutAct_9fa48("3244") ? "" : (stryCov_9fa48("3244"), ', '))}).\n${hint}`));
  }
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
  if (stryMutAct_9fa48("3245")) {
    {}
  } else {
    stryCov_9fa48("3245");
    if (stryMutAct_9fa48("3248") ? Platform.OS !== 'web' : stryMutAct_9fa48("3247") ? false : stryMutAct_9fa48("3246") ? true : (stryCov_9fa48("3246", "3247", "3248"), Platform.OS === (stryMutAct_9fa48("3249") ? "" : (stryCov_9fa48("3249"), 'web')))) {
      if (stryMutAct_9fa48("3250")) {
        {}
      } else {
        stryCov_9fa48("3250");
        return getAuth(firebaseApp);
      }
    }
    try {
      if (stryMutAct_9fa48("3251")) {
        {}
      } else {
        stryCov_9fa48("3251");
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const {
          getReactNativePersistence
        } = require('firebase/auth') as {
          getReactNativePersistence: (storage: typeof ReactNativeAsyncStorage) => Persistence;
        };
        return initializeAuth(firebaseApp, stryMutAct_9fa48("3252") ? {} : (stryCov_9fa48("3252"), {
          persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        }));
      }
    } catch (error) {
      if (stryMutAct_9fa48("3253")) {
        {}
      } else {
        stryCov_9fa48("3253");
        const maybeFirebaseError = error as {
          code?: string;
          message?: string;
        };
        if (stryMutAct_9fa48("3256") ? maybeFirebaseError.code === 'auth/already-initialized' : stryMutAct_9fa48("3255") ? false : stryMutAct_9fa48("3254") ? true : (stryCov_9fa48("3254", "3255", "3256"), maybeFirebaseError.code !== (stryMutAct_9fa48("3257") ? "" : (stryCov_9fa48("3257"), 'auth/already-initialized')))) {
          if (stryMutAct_9fa48("3258")) {
            {}
          } else {
            stryCov_9fa48("3258");
            console.warn(stryMutAct_9fa48("3259") ? "" : (stryCov_9fa48("3259"), '[firebase] initializeAuth fallback to getAuth:'), stryMutAct_9fa48("3260") ? maybeFirebaseError.message && error : (stryCov_9fa48("3260"), maybeFirebaseError.message ?? error));
          }
        }
        // Auth already initialized (Expo fast refresh) or native persistence init failed.
        return getAuth(firebaseApp);
      }
    }
  }
})();
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp, stryMutAct_9fa48("3261") ? "" : (stryCov_9fa48("3261"), 'us-central1'));
let emulatorsConnected = stryMutAct_9fa48("3262") ? true : (stryCov_9fa48("3262"), false);
if (stryMutAct_9fa48("3265") ? __DEV__ && shouldUseFirebaseEmulators() || !emulatorsConnected : stryMutAct_9fa48("3264") ? false : stryMutAct_9fa48("3263") ? true : (stryCov_9fa48("3263", "3264", "3265"), (stryMutAct_9fa48("3267") ? __DEV__ || shouldUseFirebaseEmulators() : stryMutAct_9fa48("3266") ? true : (stryCov_9fa48("3266", "3267"), __DEV__ && shouldUseFirebaseEmulators())) && (stryMutAct_9fa48("3268") ? emulatorsConnected : (stryCov_9fa48("3268"), !emulatorsConnected)))) {
  if (stryMutAct_9fa48("3269")) {
    {}
  } else {
    stryCov_9fa48("3269");
    const host = (stryMutAct_9fa48("3272") ? Platform.OS !== 'android' : stryMutAct_9fa48("3271") ? false : stryMutAct_9fa48("3270") ? true : (stryCov_9fa48("3270", "3271", "3272"), Platform.OS === (stryMutAct_9fa48("3273") ? "" : (stryCov_9fa48("3273"), 'android')))) ? stryMutAct_9fa48("3274") ? "" : (stryCov_9fa48("3274"), '10.0.2.2') : getFirebaseEmulatorHost();
    try {
      if (stryMutAct_9fa48("3275")) {
        {}
      } else {
        stryCov_9fa48("3275");
        connectAuthEmulator(auth, stryMutAct_9fa48("3276") ? `` : (stryCov_9fa48("3276"), `http://${host}:9099`), stryMutAct_9fa48("3277") ? {} : (stryCov_9fa48("3277"), {
          disableWarnings: stryMutAct_9fa48("3278") ? false : (stryCov_9fa48("3278"), true)
        }));
      }
    } catch {}
    try {
      if (stryMutAct_9fa48("3279")) {
        {}
      } else {
        stryCov_9fa48("3279");
        connectFirestoreEmulator(db, host, 8080);
      }
    } catch {}
    try {
      if (stryMutAct_9fa48("3280")) {
        {}
      } else {
        stryCov_9fa48("3280");
        connectStorageEmulator(storage, host, 9199);
      }
    } catch {}
    try {
      if (stryMutAct_9fa48("3281")) {
        {}
      } else {
        stryCov_9fa48("3281");
        connectFunctionsEmulator(functions, host, 5001);
      }
    } catch {}
    emulatorsConnected = stryMutAct_9fa48("3282") ? false : (stryCov_9fa48("3282"), true);
  }
}
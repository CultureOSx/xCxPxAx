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
import { Platform } from 'react-native';
type RequiredFirebaseEnvKey = 'EXPO_PUBLIC_FIREBASE_API_KEY' | 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN' | 'EXPO_PUBLIC_FIREBASE_PROJECT_ID' | 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET' | 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID' | 'EXPO_PUBLIC_FIREBASE_APP_ID';
const REQUIRED_FIREBASE_KEYS: RequiredFirebaseEnvKey[] = stryMutAct_9fa48("2022") ? [] : (stryCov_9fa48("2022"), [stryMutAct_9fa48("2023") ? "" : (stryCov_9fa48("2023"), 'EXPO_PUBLIC_FIREBASE_API_KEY'), stryMutAct_9fa48("2024") ? "" : (stryCov_9fa48("2024"), 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'), stryMutAct_9fa48("2025") ? "" : (stryCov_9fa48("2025"), 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'), stryMutAct_9fa48("2026") ? "" : (stryCov_9fa48("2026"), 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'), stryMutAct_9fa48("2027") ? "" : (stryCov_9fa48("2027"), 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'), stryMutAct_9fa48("2028") ? "" : (stryCov_9fa48("2028"), 'EXPO_PUBLIC_FIREBASE_APP_ID')]);

// No hardcoded fallback values — all config must come from EXPO_PUBLIC_* env vars
// baked in at build time via eas.json build.*.env or a local .env file.
// If a key is missing, getFirebaseWebConfig() logs a warning and Firebase will
// fail gracefully on first use (auth won't work — which is the correct behaviour
// for a misconfigured build, rather than silently using stale credentials).
const FALLBACK_ENV: Record<string, never> = {};
function normalizeBaseUrl(url: string): string {
  if (stryMutAct_9fa48("2029")) {
    {}
  } else {
    stryCov_9fa48("2029");
    return url.replace(stryMutAct_9fa48("2031") ? /\/$/ : stryMutAct_9fa48("2030") ? /\/+/ : (stryCov_9fa48("2030", "2031"), /\/+$/), stryMutAct_9fa48("2032") ? "Stryker was here!" : (stryCov_9fa48("2032"), '')) + (stryMutAct_9fa48("2033") ? "" : (stryCov_9fa48("2033"), '/'));
  }
}
const ENV = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_USE_FIREBASE_EMULATORS: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS,
  EXPO_PUBLIC_FIREBASE_EMULATOR_HOST: process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST
} as const;
function getEnv(name: string): string | undefined {
  if (stryMutAct_9fa48("2034")) {
    {}
  } else {
    stryCov_9fa48("2034");
    const rawValue = stryMutAct_9fa48("2035") ? ENV[name as keyof typeof ENV] && FALLBACK_ENV[name as keyof typeof FALLBACK_ENV] : (stryCov_9fa48("2035"), ENV[name as keyof typeof ENV] ?? FALLBACK_ENV[name as keyof typeof FALLBACK_ENV]);
    let value = (stryMutAct_9fa48("2038") ? typeof rawValue === 'string' || rawValue.trim().length > 0 : stryMutAct_9fa48("2037") ? false : stryMutAct_9fa48("2036") ? true : (stryCov_9fa48("2036", "2037", "2038"), (stryMutAct_9fa48("2040") ? typeof rawValue !== 'string' : stryMutAct_9fa48("2039") ? true : (stryCov_9fa48("2039", "2040"), typeof rawValue === (stryMutAct_9fa48("2041") ? "" : (stryCov_9fa48("2041"), 'string')))) && (stryMutAct_9fa48("2044") ? rawValue.trim().length <= 0 : stryMutAct_9fa48("2043") ? rawValue.trim().length >= 0 : stryMutAct_9fa48("2042") ? true : (stryCov_9fa48("2042", "2043", "2044"), (stryMutAct_9fa48("2045") ? rawValue.length : (stryCov_9fa48("2045"), rawValue.trim().length)) > 0)))) ? stryMutAct_9fa48("2046") ? rawValue : (stryCov_9fa48("2046"), rawValue.trim()) : undefined;

    // Auto-translate localhost for Android emulator networking
    if (stryMutAct_9fa48("2049") ? value && Platform.OS === 'android' || value.includes('localhost') : stryMutAct_9fa48("2048") ? false : stryMutAct_9fa48("2047") ? true : (stryCov_9fa48("2047", "2048", "2049"), (stryMutAct_9fa48("2051") ? value || Platform.OS === 'android' : stryMutAct_9fa48("2050") ? true : (stryCov_9fa48("2050", "2051"), value && (stryMutAct_9fa48("2053") ? Platform.OS !== 'android' : stryMutAct_9fa48("2052") ? true : (stryCov_9fa48("2052", "2053"), Platform.OS === (stryMutAct_9fa48("2054") ? "" : (stryCov_9fa48("2054"), 'android')))))) && value.includes(stryMutAct_9fa48("2055") ? "" : (stryCov_9fa48("2055"), 'localhost')))) {
      if (stryMutAct_9fa48("2056")) {
        {}
      } else {
        stryCov_9fa48("2056");
        value = value.replace(/localhost/g, stryMutAct_9fa48("2057") ? "" : (stryCov_9fa48("2057"), '10.0.2.2'));
      }
    } else if (stryMutAct_9fa48("2060") ? value && Platform.OS === 'android' || value.includes('127.0.0.1') : stryMutAct_9fa48("2059") ? false : stryMutAct_9fa48("2058") ? true : (stryCov_9fa48("2058", "2059", "2060"), (stryMutAct_9fa48("2062") ? value || Platform.OS === 'android' : stryMutAct_9fa48("2061") ? true : (stryCov_9fa48("2061", "2062"), value && (stryMutAct_9fa48("2064") ? Platform.OS !== 'android' : stryMutAct_9fa48("2063") ? true : (stryCov_9fa48("2063", "2064"), Platform.OS === (stryMutAct_9fa48("2065") ? "" : (stryCov_9fa48("2065"), 'android')))))) && value.includes(stryMutAct_9fa48("2066") ? "" : (stryCov_9fa48("2066"), '127.0.0.1')))) {
      if (stryMutAct_9fa48("2067")) {
        {}
      } else {
        stryCov_9fa48("2067");
        value = value.replace(/127\.0\.0\.1/g, stryMutAct_9fa48("2068") ? "" : (stryCov_9fa48("2068"), '10.0.2.2'));
      }
    }
    return value;
  }
}
export function getExplicitApiUrl(): string | undefined {
  if (stryMutAct_9fa48("2069")) {
    {}
  } else {
    stryCov_9fa48("2069");
    const apiUrl = getEnv(stryMutAct_9fa48("2070") ? "" : (stryCov_9fa48("2070"), 'EXPO_PUBLIC_API_URL'));
    return apiUrl ? normalizeBaseUrl(apiUrl) : undefined;
  }
}
export function getMissingFirebaseEnvKeys(): RequiredFirebaseEnvKey[] {
  if (stryMutAct_9fa48("2071")) {
    {}
  } else {
    stryCov_9fa48("2071");
    return stryMutAct_9fa48("2072") ? REQUIRED_FIREBASE_KEYS : (stryCov_9fa48("2072"), REQUIRED_FIREBASE_KEYS.filter(stryMutAct_9fa48("2073") ? () => undefined : (stryCov_9fa48("2073"), key => stryMutAct_9fa48("2074") ? getEnv(key) : (stryCov_9fa48("2074"), !getEnv(key)))));
  }
}
export function getFirebaseWebConfig() {
  if (stryMutAct_9fa48("2075")) {
    {}
  } else {
    stryCov_9fa48("2075");
    const missing = getMissingFirebaseEnvKeys();
    if (stryMutAct_9fa48("2079") ? missing.length <= 0 : stryMutAct_9fa48("2078") ? missing.length >= 0 : stryMutAct_9fa48("2077") ? false : stryMutAct_9fa48("2076") ? true : (stryCov_9fa48("2076", "2077", "2078", "2079"), missing.length > 0)) {
      if (stryMutAct_9fa48("2080")) {
        {}
      } else {
        stryCov_9fa48("2080");
        console.warn((stryMutAct_9fa48("2081") ? "" : (stryCov_9fa48("2081"), '[CulturePass] Missing Firebase environment variables: ')) + missing.join(stryMutAct_9fa48("2082") ? "" : (stryCov_9fa48("2082"), ', ')) + (stryMutAct_9fa48("2083") ? "" : (stryCov_9fa48("2083"), '. Firebase services (Auth, Firestore, Storage) will not work.')) + (stryMutAct_9fa48("2084") ? "" : (stryCov_9fa48("2084"), ' The app will not be functional until these variables are configured in .env and EAS build profiles.')));
      }
    }
    return stryMutAct_9fa48("2085") ? {} : (stryCov_9fa48("2085"), {
      apiKey: stryMutAct_9fa48("2086") ? getEnv('EXPO_PUBLIC_FIREBASE_API_KEY') && '' : (stryCov_9fa48("2086"), getEnv(stryMutAct_9fa48("2087") ? "" : (stryCov_9fa48("2087"), 'EXPO_PUBLIC_FIREBASE_API_KEY')) ?? (stryMutAct_9fa48("2088") ? "Stryker was here!" : (stryCov_9fa48("2088"), ''))),
      authDomain: stryMutAct_9fa48("2089") ? getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') && '' : (stryCov_9fa48("2089"), getEnv(stryMutAct_9fa48("2090") ? "" : (stryCov_9fa48("2090"), 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN')) ?? (stryMutAct_9fa48("2091") ? "Stryker was here!" : (stryCov_9fa48("2091"), ''))),
      projectId: stryMutAct_9fa48("2092") ? getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID') && '' : (stryCov_9fa48("2092"), getEnv(stryMutAct_9fa48("2093") ? "" : (stryCov_9fa48("2093"), 'EXPO_PUBLIC_FIREBASE_PROJECT_ID')) ?? (stryMutAct_9fa48("2094") ? "Stryker was here!" : (stryCov_9fa48("2094"), ''))),
      storageBucket: stryMutAct_9fa48("2095") ? getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') && '' : (stryCov_9fa48("2095"), getEnv(stryMutAct_9fa48("2096") ? "" : (stryCov_9fa48("2096"), 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET')) ?? (stryMutAct_9fa48("2097") ? "Stryker was here!" : (stryCov_9fa48("2097"), ''))),
      messagingSenderId: stryMutAct_9fa48("2098") ? getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') && '' : (stryCov_9fa48("2098"), getEnv(stryMutAct_9fa48("2099") ? "" : (stryCov_9fa48("2099"), 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID')) ?? (stryMutAct_9fa48("2100") ? "Stryker was here!" : (stryCov_9fa48("2100"), ''))),
      appId: stryMutAct_9fa48("2101") ? getEnv('EXPO_PUBLIC_FIREBASE_APP_ID') && '' : (stryCov_9fa48("2101"), getEnv(stryMutAct_9fa48("2102") ? "" : (stryCov_9fa48("2102"), 'EXPO_PUBLIC_FIREBASE_APP_ID')) ?? (stryMutAct_9fa48("2103") ? "Stryker was here!" : (stryCov_9fa48("2103"), '')))
    });
  }
}
export function shouldUseFirebaseEmulators(): boolean {
  if (stryMutAct_9fa48("2104")) {
    {}
  } else {
    stryCov_9fa48("2104");
    return stryMutAct_9fa48("2107") ? getEnv('EXPO_PUBLIC_USE_FIREBASE_EMULATORS') !== 'true' : stryMutAct_9fa48("2106") ? false : stryMutAct_9fa48("2105") ? true : (stryCov_9fa48("2105", "2106", "2107"), getEnv(stryMutAct_9fa48("2108") ? "" : (stryCov_9fa48("2108"), 'EXPO_PUBLIC_USE_FIREBASE_EMULATORS')) === (stryMutAct_9fa48("2109") ? "" : (stryCov_9fa48("2109"), 'true')));
  }
}
export function getFirebaseEmulatorHost(): string {
  if (stryMutAct_9fa48("2110")) {
    {}
  } else {
    stryCov_9fa48("2110");
    return stryMutAct_9fa48("2111") ? getEnv('EXPO_PUBLIC_FIREBASE_EMULATOR_HOST') && '127.0.0.1' : (stryCov_9fa48("2111"), getEnv(stryMutAct_9fa48("2112") ? "" : (stryCov_9fa48("2112"), 'EXPO_PUBLIC_FIREBASE_EMULATOR_HOST')) ?? (stryMutAct_9fa48("2113") ? "" : (stryCov_9fa48("2113"), '127.0.0.1')));
  }
}
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
import { fetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getExplicitApiUrl, getFirebaseEmulatorHost, getFirebaseWebConfig, shouldUseFirebaseEmulators } from '@/lib/config';

/**
 * CulturePassAU Sydney Query Client v2.0
 * Sydney API + Kerala diaspora optimized
 */

// Module-level token store — set by AuthProvider via setAccessToken().
// This avoids calling useAuth() outside a React component (hook rule violation).
let _accessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  if (stryMutAct_9fa48("4063")) {
    {}
  } else {
    stryCov_9fa48("4063");
    _accessToken = token;
  }
}
export function getAccessToken(): string | null {
  if (stryMutAct_9fa48("4064")) {
    {}
  } else {
    stryCov_9fa48("4064");
    return _accessToken;
  }
}

// Optional token refresher — injected by AuthProvider so apiRequest can
// self-heal on 401 responses without importing Firebase directly.
let _tokenRefresher: (() => Promise<string | null>) | null = null;
export function setTokenRefresher(fn: (() => Promise<string | null>) | null): void {
  if (stryMutAct_9fa48("4065")) {
    {}
  } else {
    stryCov_9fa48("4065");
    _tokenRefresher = fn;
  }
}
function normalizeBaseUrl(url: string): string {
  if (stryMutAct_9fa48("4066")) {
    {}
  } else {
    stryCov_9fa48("4066");
    return url.replace(stryMutAct_9fa48("4068") ? /\/$/ : stryMutAct_9fa48("4067") ? /\/+/ : (stryCov_9fa48("4067", "4068"), /\/+$/), stryMutAct_9fa48("4069") ? "Stryker was here!" : (stryCov_9fa48("4069"), '')) + (stryMutAct_9fa48("4070") ? "" : (stryCov_9fa48("4070"), '/'));
  }
}

/**
 * Base URL for the Functions-hosted HTTP API (Express `api` function).
 * - Production / preview: EXPO_PUBLIC_API_URL or same-origin `/api` on hosted web
 * - Local web: explicit URL, or Functions emulator (5001) when emulators enabled,
 *   else legacy `server-dev.ts` on 5050
 */
function localFunctionsEmulatorApiBase(host: string): string {
  if (stryMutAct_9fa48("4071")) {
    {}
  } else {
    stryCov_9fa48("4071");
    const projectId = getFirebaseWebConfig().projectId;
    return normalizeBaseUrl(stryMutAct_9fa48("4072") ? `` : (stryCov_9fa48("4072"), `http://${host}:5001/${projectId}/us-central1/api`));
  }
}
let _cachedApiUrl: string | null = null;
function resolveApiUrl(): string {
  if (stryMutAct_9fa48("4073")) {
    {}
  } else {
    stryCov_9fa48("4073");
    const explicit = getExplicitApiUrl();
    if (stryMutAct_9fa48("4076") ? Platform.OS === 'web' || typeof window !== 'undefined' : stryMutAct_9fa48("4075") ? false : stryMutAct_9fa48("4074") ? true : (stryCov_9fa48("4074", "4075", "4076"), (stryMutAct_9fa48("4078") ? Platform.OS !== 'web' : stryMutAct_9fa48("4077") ? true : (stryCov_9fa48("4077", "4078"), Platform.OS === (stryMutAct_9fa48("4079") ? "" : (stryCov_9fa48("4079"), 'web')))) && (stryMutAct_9fa48("4081") ? typeof window === 'undefined' : stryMutAct_9fa48("4080") ? true : (stryCov_9fa48("4080", "4081"), typeof window !== (stryMutAct_9fa48("4082") ? "" : (stryCov_9fa48("4082"), 'undefined')))))) {
      if (stryMutAct_9fa48("4083")) {
        {}
      } else {
        stryCov_9fa48("4083");
        const isLocalhost = (stryMutAct_9fa48("4084") ? [] : (stryCov_9fa48("4084"), [stryMutAct_9fa48("4085") ? "" : (stryCov_9fa48("4085"), 'localhost'), stryMutAct_9fa48("4086") ? "" : (stryCov_9fa48("4086"), '127.0.0.1')])).includes(window.location.hostname);

        // Hosted web should use same-origin `/api` rewrites to avoid cross-origin
        // CORS drift between Firebase Hosting and direct Functions domains.
        if (stryMutAct_9fa48("4089") ? false : stryMutAct_9fa48("4088") ? true : stryMutAct_9fa48("4087") ? isLocalhost : (stryCov_9fa48("4087", "4088", "4089"), !isLocalhost)) {
          if (stryMutAct_9fa48("4090")) {
            {}
          } else {
            stryCov_9fa48("4090");
            return normalizeBaseUrl(window.location.origin);
          }
        }
        if (stryMutAct_9fa48("4092") ? false : stryMutAct_9fa48("4091") ? true : (stryCov_9fa48("4091", "4092"), explicit)) return normalizeBaseUrl(explicit);
        if (stryMutAct_9fa48("4094") ? false : stryMutAct_9fa48("4093") ? true : (stryCov_9fa48("4093", "4094"), shouldUseFirebaseEmulators())) {
          if (stryMutAct_9fa48("4095")) {
            {}
          } else {
            stryCov_9fa48("4095");
            const host = getFirebaseEmulatorHost();
            const base = localFunctionsEmulatorApiBase(host);
            if (stryMutAct_9fa48("4097") ? false : stryMutAct_9fa48("4096") ? true : (stryCov_9fa48("4096", "4097"), __DEV__)) {
              if (stryMutAct_9fa48("4098")) {
                {}
              } else {
                stryCov_9fa48("4098");
                console.log(stryMutAct_9fa48("4099") ? "" : (stryCov_9fa48("4099"), '[api] Local web + emulators →'), base);
              }
            }
            return base;
          }
        }
        if (stryMutAct_9fa48("4101") ? false : stryMutAct_9fa48("4100") ? true : (stryCov_9fa48("4100", "4101"), __DEV__)) {
          if (stryMutAct_9fa48("4102")) {
            {}
          } else {
            stryCov_9fa48("4102");
            console.warn(stryMutAct_9fa48("4103") ? "" : (stryCov_9fa48("4103"), '[api] EXPO_PUBLIC_API_URL not set on localhost — falling back to http://localhost:5050 (server-dev).'), stryMutAct_9fa48("4104") ? "" : (stryCov_9fa48("4104"), 'For Firebase emulator use EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true, or set EXPO_PUBLIC_API_URL to production.'));
          }
        }
        return normalizeBaseUrl(stryMutAct_9fa48("4105") ? "" : (stryCov_9fa48("4105"), 'http://localhost:5050'));
      }
    }
    if (stryMutAct_9fa48("4107") ? false : stryMutAct_9fa48("4106") ? true : (stryCov_9fa48("4106", "4107"), explicit)) return normalizeBaseUrl(explicit);
    const EMULATOR_HOST = (stryMutAct_9fa48("4110") ? Platform.OS !== 'android' : stryMutAct_9fa48("4109") ? false : stryMutAct_9fa48("4108") ? true : (stryCov_9fa48("4108", "4109", "4110"), Platform.OS === (stryMutAct_9fa48("4111") ? "" : (stryCov_9fa48("4111"), 'android')))) ? stryMutAct_9fa48("4112") ? "" : (stryCov_9fa48("4112"), '10.0.2.2') : stryMutAct_9fa48("4113") ? "" : (stryCov_9fa48("4113"), 'localhost');
    if (stryMutAct_9fa48("4116") ? Platform.OS === 'web' : stryMutAct_9fa48("4115") ? false : stryMutAct_9fa48("4114") ? true : (stryCov_9fa48("4114", "4115", "4116"), Platform.OS !== (stryMutAct_9fa48("4117") ? "" : (stryCov_9fa48("4117"), 'web')))) {
      if (stryMutAct_9fa48("4118")) {
        {}
      } else {
        stryCov_9fa48("4118");
        if (stryMutAct_9fa48("4121") ? false : stryMutAct_9fa48("4120") ? true : stryMutAct_9fa48("4119") ? __DEV__ : (stryCov_9fa48("4119", "4120", "4121"), !__DEV__)) {
          if (stryMutAct_9fa48("4122")) {
            {}
          } else {
            stryCov_9fa48("4122");
            throw new Error(stryMutAct_9fa48("4123") ? "" : (stryCov_9fa48("4123"), 'EXPO_PUBLIC_API_URL must be configured for production builds.'));
          }
        }
        if (stryMutAct_9fa48("4125") ? false : stryMutAct_9fa48("4124") ? true : (stryCov_9fa48("4124", "4125"), shouldUseFirebaseEmulators())) {
          if (stryMutAct_9fa48("4126")) {
            {}
          } else {
            stryCov_9fa48("4126");
            const host = (stryMutAct_9fa48("4129") ? Platform.OS !== 'android' : stryMutAct_9fa48("4128") ? false : stryMutAct_9fa48("4127") ? true : (stryCov_9fa48("4127", "4128", "4129"), Platform.OS === (stryMutAct_9fa48("4130") ? "" : (stryCov_9fa48("4130"), 'android')))) ? stryMutAct_9fa48("4131") ? "" : (stryCov_9fa48("4131"), '10.0.2.2') : getFirebaseEmulatorHost();
            return localFunctionsEmulatorApiBase(host);
          }
        }
        console.warn(stryMutAct_9fa48("4132") ? `` : (stryCov_9fa48("4132"), `[api] EXPO_PUBLIC_API_URL not set — falling back to http://${EMULATOR_HOST}:5050. Set it in .env to use the Firebase emulator or production API.`));
        return normalizeBaseUrl(stryMutAct_9fa48("4133") ? `` : (stryCov_9fa48("4133"), `http://${EMULATOR_HOST}:5050`));
      }
    }
    const host = process.env.EXPO_PUBLIC_DOMAIN;
    if (stryMutAct_9fa48("4135") ? false : stryMutAct_9fa48("4134") ? true : (stryCov_9fa48("4134", "4135"), host)) return normalizeBaseUrl(stryMutAct_9fa48("4136") ? `` : (stryCov_9fa48("4136"), `https://${host}`));
    if (stryMutAct_9fa48("4139") ? typeof window === 'undefined' : stryMutAct_9fa48("4138") ? false : stryMutAct_9fa48("4137") ? true : (stryCov_9fa48("4137", "4138", "4139"), typeof window !== (stryMutAct_9fa48("4140") ? "" : (stryCov_9fa48("4140"), 'undefined')))) {
      if (stryMutAct_9fa48("4141")) {
        {}
      } else {
        stryCov_9fa48("4141");
        return normalizeBaseUrl(window.location.origin);
      }
    }
    return normalizeBaseUrl(stryMutAct_9fa48("4142") ? `` : (stryCov_9fa48("4142"), `http://${EMULATOR_HOST}:5050`));
  }
}
export function resetApiUrlCache(): void {
  if (stryMutAct_9fa48("4143")) {
    {}
  } else {
    stryCov_9fa48("4143");
    _cachedApiUrl = null;
  }
}
export function getApiUrl(): string {
  if (stryMutAct_9fa48("4144")) {
    {}
  } else {
    stryCov_9fa48("4144");
    if (stryMutAct_9fa48("4146") ? false : stryMutAct_9fa48("4145") ? true : (stryCov_9fa48("4145", "4146"), _cachedApiUrl)) return _cachedApiUrl;
    const resolved = resolveApiUrl();
    _cachedApiUrl = resolved;
    return resolved;
  }
}
function normalizeRoute(route: string): string {
  if (stryMutAct_9fa48("4147")) {
    {}
  } else {
    stryCov_9fa48("4147");
    return (stryMutAct_9fa48("4148") ? route.endsWith('/') : (stryCov_9fa48("4148"), route.startsWith(stryMutAct_9fa48("4149") ? "" : (stryCov_9fa48("4149"), '/')))) ? stryMutAct_9fa48("4150") ? route : (stryCov_9fa48("4150"), route.slice(1)) : route;
  }
}
function isDirectFunctionsBase(baseUrl: string): boolean {
  if (stryMutAct_9fa48("4151")) {
    {}
  } else {
    stryCov_9fa48("4151");
    const {
      hostname
    } = new URL(baseUrl);
    return stryMutAct_9fa48("4154") ? hostname.endsWith('cloudfunctions.net') && hostname.endsWith('.run.app') : stryMutAct_9fa48("4153") ? false : stryMutAct_9fa48("4152") ? true : (stryCov_9fa48("4152", "4153", "4154"), (stryMutAct_9fa48("4155") ? hostname.startsWith('cloudfunctions.net') : (stryCov_9fa48("4155"), hostname.endsWith(stryMutAct_9fa48("4156") ? "" : (stryCov_9fa48("4156"), 'cloudfunctions.net')))) || (stryMutAct_9fa48("4157") ? hostname.startsWith('.run.app') : (stryCov_9fa48("4157"), hostname.endsWith(stryMutAct_9fa48("4158") ? "" : (stryCov_9fa48("4158"), '.run.app')))));
  }
}
function routeForBase(baseUrl: string, route: string): string {
  if (stryMutAct_9fa48("4159")) {
    {}
  } else {
    stryCov_9fa48("4159");
    const cleanedRoute = normalizeRoute(route);
    const basePath = new URL(baseUrl).pathname.replace(stryMutAct_9fa48("4161") ? /\/$/ : stryMutAct_9fa48("4160") ? /\/+/ : (stryCov_9fa48("4160", "4161"), /\/+$/), stryMutAct_9fa48("4162") ? "Stryker was here!" : (stryCov_9fa48("4162"), ''));
    const baseHasApiPrefix = stryMutAct_9fa48("4163") ? basePath.startsWith('/api') : (stryCov_9fa48("4163"), basePath.endsWith(stryMutAct_9fa48("4164") ? "" : (stryCov_9fa48("4164"), '/api')));
    const routeHasApiPrefix = stryMutAct_9fa48("4165") ? cleanedRoute.endsWith('api/') : (stryCov_9fa48("4165"), cleanedRoute.startsWith(stryMutAct_9fa48("4166") ? "" : (stryCov_9fa48("4166"), 'api/')));

    // If the base URL exported by the Cloud Function already ends in /api,
    // we must ensure we don't send /api/api/... by stripping it from the route.
    if (stryMutAct_9fa48("4169") ? baseHasApiPrefix || routeHasApiPrefix : stryMutAct_9fa48("4168") ? false : stryMutAct_9fa48("4167") ? true : (stryCov_9fa48("4167", "4168", "4169"), baseHasApiPrefix && routeHasApiPrefix)) {
      if (stryMutAct_9fa48("4170")) {
        {}
      } else {
        stryCov_9fa48("4170");
        return stryMutAct_9fa48("4171") ? cleanedRoute : (stryCov_9fa48("4171"), cleanedRoute.slice(4));
      }
    }

    // If we are hitting a Hosting rewrite (base is just root /) 
    // but the route is missing the api/ prefix, we might want to add it?
    // Our api.ts always includes it, so we're safe.

    return cleanedRoute;
  }
}
export function buildApiUrl(route: string): string {
  if (stryMutAct_9fa48("4172")) {
    {}
  } else {
    stryCov_9fa48("4172");
    const baseUrl = getApiUrl();
    const normalizedRoute = routeForBase(baseUrl, route);
    return new URL(normalizedRoute, baseUrl).toString();
  }
}
export async function throwIfResNotOk(res: Response): Promise<void> {
  if (stryMutAct_9fa48("4173")) {
    {}
  } else {
    stryCov_9fa48("4173");
    if (stryMutAct_9fa48("4175") ? false : stryMutAct_9fa48("4174") ? true : (stryCov_9fa48("4174", "4175"), res.ok)) return;
    let errorText = res.statusText;
    try {
      if (stryMutAct_9fa48("4176")) {
        {}
      } else {
        stryCov_9fa48("4176");
        errorText = await res.text();
      }
    } catch {}
    const error = new Error(`${res.status}: ${errorText} (${res.url})`) as Error & {
      status: number;
      response: string;
    };
    error.status = res.status;
    error.response = errorText;
    throw error;
  }
}

/**
 * Auth-aware API request. Reads token from module-level store (set by AuthProvider)
 * rather than calling useAuth() which would violate React hook rules.
 *
 * On 401: attempts one token refresh via _tokenRefresher (injected by AuthProvider)
 * and retries the request. If the retry also fails, the error is re-thrown.
 */
const API_TIMEOUT_MS = 30_000; // 30 second timeout for API requests

export async function apiRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', route: string, data?: unknown, options: Omit<RequestInit, 'method' | 'body'> = {}, _isRetry = stryMutAct_9fa48("4177") ? true : (stryCov_9fa48("4177"), false)): Promise<Response> {
  if (stryMutAct_9fa48("4178")) {
    {}
  } else {
    stryCov_9fa48("4178");
    const url = new URL(buildApiUrl(route));
    const headers: Record<string, string> = stryMutAct_9fa48("4179") ? {} : (stryCov_9fa48("4179"), {
      'Content-Type': stryMutAct_9fa48("4180") ? "" : (stryCov_9fa48("4180"), 'application/json'),
      ...(options.headers as Record<string, string>)
    });
    if (stryMutAct_9fa48("4182") ? false : stryMutAct_9fa48("4181") ? true : (stryCov_9fa48("4181", "4182"), _accessToken)) {
      if (stryMutAct_9fa48("4183")) {
        {}
      } else {
        stryCov_9fa48("4183");
        headers[stryMutAct_9fa48("4184") ? "" : (stryCov_9fa48("4184"), 'Authorization')] = stryMutAct_9fa48("4185") ? `` : (stryCov_9fa48("4185"), `Bearer ${_accessToken}`);
      }
    }

    // expo/fetch uses FetchRequestInit which rejects null signal — strip it out.
    const {
      signal: callerSignal,
      ...safeOptions
    } = options as RequestInit & {
      signal?: AbortSignal | null;
    };
    const credentials = (stryMutAct_9fa48("4188") ? Platform.OS !== 'web' : stryMutAct_9fa48("4187") ? false : stryMutAct_9fa48("4186") ? true : (stryCov_9fa48("4186", "4187", "4188"), Platform.OS === (stryMutAct_9fa48("4189") ? "" : (stryCov_9fa48("4189"), 'web')))) ? stryMutAct_9fa48("4190") ? "" : (stryCov_9fa48("4190"), 'omit') : safeOptions.credentials;

    // Use caller's signal if provided, otherwise create a timeout signal.
    // Some runtimes (including certain Expo environments) do not implement AbortSignal.timeout.
    let signal = stryMutAct_9fa48("4191") ? callerSignal && undefined : (stryCov_9fa48("4191"), callerSignal ?? undefined);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (stryMutAct_9fa48("4194") ? false : stryMutAct_9fa48("4193") ? true : stryMutAct_9fa48("4192") ? signal : (stryCov_9fa48("4192", "4193", "4194"), !signal)) {
      if (stryMutAct_9fa48("4195")) {
        {}
      } else {
        stryCov_9fa48("4195");
        const timeoutCapableAbortSignal = stryMutAct_9fa48("4198") ? typeof AbortSignal !== 'undefined' || typeof (AbortSignal as typeof AbortSignal & {
          timeout?: (ms: number) => AbortSignal;
        }).timeout === 'function' : stryMutAct_9fa48("4197") ? false : stryMutAct_9fa48("4196") ? true : (stryCov_9fa48("4196", "4197", "4198"), (stryMutAct_9fa48("4200") ? typeof AbortSignal === 'undefined' : stryMutAct_9fa48("4199") ? true : (stryCov_9fa48("4199", "4200"), typeof AbortSignal !== (stryMutAct_9fa48("4201") ? "" : (stryCov_9fa48("4201"), 'undefined')))) && (stryMutAct_9fa48("4203") ? typeof (AbortSignal as typeof AbortSignal & {
          timeout?: (ms: number) => AbortSignal;
        }).timeout !== 'function' : stryMutAct_9fa48("4202") ? true : (stryCov_9fa48("4202", "4203"), typeof (AbortSignal as typeof AbortSignal & {
          timeout?: (ms: number) => AbortSignal;
        }).timeout === (stryMutAct_9fa48("4204") ? "" : (stryCov_9fa48("4204"), 'function')))));
        if (stryMutAct_9fa48("4206") ? false : stryMutAct_9fa48("4205") ? true : (stryCov_9fa48("4205", "4206"), timeoutCapableAbortSignal)) {
          if (stryMutAct_9fa48("4207")) {
            {}
          } else {
            stryCov_9fa48("4207");
            signal = (AbortSignal as typeof AbortSignal & {
              timeout: (ms: number) => AbortSignal;
            }).timeout(API_TIMEOUT_MS);
          }
        } else {
          if (stryMutAct_9fa48("4208")) {
            {}
          } else {
            stryCov_9fa48("4208");
            const controller = new AbortController();
            timeoutId = setTimeout(stryMutAct_9fa48("4209") ? () => undefined : (stryCov_9fa48("4209"), () => controller.abort()), API_TIMEOUT_MS);
            signal = controller.signal;
          }
        }
      }
    }
    let res: Response;
    try {
      if (stryMutAct_9fa48("4210")) {
        {}
      } else {
        stryCov_9fa48("4210");
        res = await fetch(url.toString(), {
          ...safeOptions,
          method,
          headers,
          body: data !== undefined ? JSON.stringify(data) : undefined,
          credentials,
          signal
        } as Parameters<typeof fetch>[1]);
      }
    } finally {
      if (stryMutAct_9fa48("4211")) {
        {}
      } else {
        stryCov_9fa48("4211");
        if (stryMutAct_9fa48("4213") ? false : stryMutAct_9fa48("4212") ? true : (stryCov_9fa48("4212", "4213"), timeoutId)) clearTimeout(timeoutId);
      }
    }

    // On 401, attempt a token refresh and retry once.
    if (stryMutAct_9fa48("4216") ? res.status === 401 && !_isRetry || _tokenRefresher : stryMutAct_9fa48("4215") ? false : stryMutAct_9fa48("4214") ? true : (stryCov_9fa48("4214", "4215", "4216"), (stryMutAct_9fa48("4218") ? res.status === 401 || !_isRetry : stryMutAct_9fa48("4217") ? true : (stryCov_9fa48("4217", "4218"), (stryMutAct_9fa48("4220") ? res.status !== 401 : stryMutAct_9fa48("4219") ? true : (stryCov_9fa48("4219", "4220"), res.status === 401)) && (stryMutAct_9fa48("4221") ? _isRetry : (stryCov_9fa48("4221"), !_isRetry)))) && _tokenRefresher)) {
      if (stryMutAct_9fa48("4222")) {
        {}
      } else {
        stryCov_9fa48("4222");
        try {
          if (stryMutAct_9fa48("4223")) {
            {}
          } else {
            stryCov_9fa48("4223");
            const newToken = await _tokenRefresher();
            if (stryMutAct_9fa48("4225") ? false : stryMutAct_9fa48("4224") ? true : (stryCov_9fa48("4224", "4225"), newToken)) {
              if (stryMutAct_9fa48("4226")) {
                {}
              } else {
                stryCov_9fa48("4226");
                return apiRequest(method, route, data, options, stryMutAct_9fa48("4227") ? false : (stryCov_9fa48("4227"), true));
              }
            }
          }
        } catch {
          // Refresh failed — fall through to throwIfResNotOk which will throw 401.
        }
      }
    }
    await throwIfResNotOk(res);
    return res;
  }
}

/**
 * Multipart upload (e.g. images). Does not set Content-Type — the runtime sets the boundary.
 * Uses the same auth + 401 refresh behaviour as apiRequest.
 */
export async function apiRequestMultipart(method: 'POST' | 'PUT', route: string, formData: FormData, options: Omit<RequestInit, 'method' | 'body'> = {}, _isRetry = stryMutAct_9fa48("4228") ? true : (stryCov_9fa48("4228"), false)): Promise<Response> {
  if (stryMutAct_9fa48("4229")) {
    {}
  } else {
    stryCov_9fa48("4229");
    const url = new URL(buildApiUrl(route));
    const headers: Record<string, string> = stryMutAct_9fa48("4230") ? {} : (stryCov_9fa48("4230"), {
      ...(options.headers as Record<string, string>)
    });
    if (stryMutAct_9fa48("4232") ? false : stryMutAct_9fa48("4231") ? true : (stryCov_9fa48("4231", "4232"), _accessToken)) {
      if (stryMutAct_9fa48("4233")) {
        {}
      } else {
        stryCov_9fa48("4233");
        headers.Authorization = stryMutAct_9fa48("4234") ? `` : (stryCov_9fa48("4234"), `Bearer ${_accessToken}`);
      }
    }
    const {
      signal: callerSignal,
      ...safeOptions
    } = options as RequestInit & {
      signal?: AbortSignal | null;
    };
    const credentials = (stryMutAct_9fa48("4237") ? Platform.OS !== 'web' : stryMutAct_9fa48("4236") ? false : stryMutAct_9fa48("4235") ? true : (stryCov_9fa48("4235", "4236", "4237"), Platform.OS === (stryMutAct_9fa48("4238") ? "" : (stryCov_9fa48("4238"), 'web')))) ? stryMutAct_9fa48("4239") ? "" : (stryCov_9fa48("4239"), 'omit') : safeOptions.credentials;
    let signal = stryMutAct_9fa48("4240") ? callerSignal && undefined : (stryCov_9fa48("4240"), callerSignal ?? undefined);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (stryMutAct_9fa48("4243") ? false : stryMutAct_9fa48("4242") ? true : stryMutAct_9fa48("4241") ? signal : (stryCov_9fa48("4241", "4242", "4243"), !signal)) {
      if (stryMutAct_9fa48("4244")) {
        {}
      } else {
        stryCov_9fa48("4244");
        const timeoutCapableAbortSignal = stryMutAct_9fa48("4247") ? typeof AbortSignal !== 'undefined' || typeof (AbortSignal as typeof AbortSignal & {
          timeout?: (ms: number) => AbortSignal;
        }).timeout === 'function' : stryMutAct_9fa48("4246") ? false : stryMutAct_9fa48("4245") ? true : (stryCov_9fa48("4245", "4246", "4247"), (stryMutAct_9fa48("4249") ? typeof AbortSignal === 'undefined' : stryMutAct_9fa48("4248") ? true : (stryCov_9fa48("4248", "4249"), typeof AbortSignal !== (stryMutAct_9fa48("4250") ? "" : (stryCov_9fa48("4250"), 'undefined')))) && (stryMutAct_9fa48("4252") ? typeof (AbortSignal as typeof AbortSignal & {
          timeout?: (ms: number) => AbortSignal;
        }).timeout !== 'function' : stryMutAct_9fa48("4251") ? true : (stryCov_9fa48("4251", "4252"), typeof (AbortSignal as typeof AbortSignal & {
          timeout?: (ms: number) => AbortSignal;
        }).timeout === (stryMutAct_9fa48("4253") ? "" : (stryCov_9fa48("4253"), 'function')))));
        if (stryMutAct_9fa48("4255") ? false : stryMutAct_9fa48("4254") ? true : (stryCov_9fa48("4254", "4255"), timeoutCapableAbortSignal)) {
          if (stryMutAct_9fa48("4256")) {
            {}
          } else {
            stryCov_9fa48("4256");
            signal = (AbortSignal as typeof AbortSignal & {
              timeout: (ms: number) => AbortSignal;
            }).timeout(API_TIMEOUT_MS);
          }
        } else {
          if (stryMutAct_9fa48("4257")) {
            {}
          } else {
            stryCov_9fa48("4257");
            const controller = new AbortController();
            timeoutId = setTimeout(stryMutAct_9fa48("4258") ? () => undefined : (stryCov_9fa48("4258"), () => controller.abort()), API_TIMEOUT_MS);
            signal = controller.signal;
          }
        }
      }
    }
    let res: Response;
    try {
      if (stryMutAct_9fa48("4259")) {
        {}
      } else {
        stryCov_9fa48("4259");
        res = await fetch(url.toString(), {
          ...safeOptions,
          method,
          headers,
          body: formData,
          credentials,
          signal
        } as Parameters<typeof fetch>[1]);
      }
    } finally {
      if (stryMutAct_9fa48("4260")) {
        {}
      } else {
        stryCov_9fa48("4260");
        if (stryMutAct_9fa48("4262") ? false : stryMutAct_9fa48("4261") ? true : (stryCov_9fa48("4261", "4262"), timeoutId)) clearTimeout(timeoutId);
      }
    }
    if (stryMutAct_9fa48("4265") ? res.status === 401 && !_isRetry || _tokenRefresher : stryMutAct_9fa48("4264") ? false : stryMutAct_9fa48("4263") ? true : (stryCov_9fa48("4263", "4264", "4265"), (stryMutAct_9fa48("4267") ? res.status === 401 || !_isRetry : stryMutAct_9fa48("4266") ? true : (stryCov_9fa48("4266", "4267"), (stryMutAct_9fa48("4269") ? res.status !== 401 : stryMutAct_9fa48("4268") ? true : (stryCov_9fa48("4268", "4269"), res.status === 401)) && (stryMutAct_9fa48("4270") ? _isRetry : (stryCov_9fa48("4270"), !_isRetry)))) && _tokenRefresher)) {
      if (stryMutAct_9fa48("4271")) {
        {}
      } else {
        stryCov_9fa48("4271");
        try {
          if (stryMutAct_9fa48("4272")) {
            {}
          } else {
            stryCov_9fa48("4272");
            const newToken = await _tokenRefresher();
            if (stryMutAct_9fa48("4274") ? false : stryMutAct_9fa48("4273") ? true : (stryCov_9fa48("4273", "4274"), newToken)) {
              if (stryMutAct_9fa48("4275")) {
                {}
              } else {
                stryCov_9fa48("4275");
                return apiRequestMultipart(method, route, formData, options, stryMutAct_9fa48("4276") ? false : (stryCov_9fa48("4276"), true));
              }
            }
          }
        } catch {
          // fall through
        }
      }
    }
    await throwIfResNotOk(res);
    return res;
  }
}

// In-process request cache (5 min TTL)
const _cache = new Map<string, {
  data: unknown;
  timestamp: number;
}>();
const CACHE_TTL = stryMutAct_9fa48("4277") ? 5 * 60 / 1000 : (stryCov_9fa48("4277"), (stryMutAct_9fa48("4278") ? 5 / 60 : (stryCov_9fa48("4278"), 5 * 60)) * 1000);
export async function apiRequestCached(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', route: string, data?: unknown): Promise<unknown> {
  if (stryMutAct_9fa48("4279")) {
    {}
  } else {
    stryCov_9fa48("4279");
    const cacheKey = stryMutAct_9fa48("4280") ? `` : (stryCov_9fa48("4280"), `${method}:${route}:${JSON.stringify(stryMutAct_9fa48("4281") ? data && {} : (stryCov_9fa48("4281"), data ?? {}))}`);
    const cached = _cache.get(cacheKey);
    if (stryMutAct_9fa48("4284") ? cached || Date.now() - cached.timestamp < CACHE_TTL : stryMutAct_9fa48("4283") ? false : stryMutAct_9fa48("4282") ? true : (stryCov_9fa48("4282", "4283", "4284"), cached && (stryMutAct_9fa48("4287") ? Date.now() - cached.timestamp >= CACHE_TTL : stryMutAct_9fa48("4286") ? Date.now() - cached.timestamp <= CACHE_TTL : stryMutAct_9fa48("4285") ? true : (stryCov_9fa48("4285", "4286", "4287"), (stryMutAct_9fa48("4288") ? Date.now() + cached.timestamp : (stryCov_9fa48("4288"), Date.now() - cached.timestamp)) < CACHE_TTL)))) {
      if (stryMutAct_9fa48("4289")) {
        {}
      } else {
        stryCov_9fa48("4289");
        return cached.data;
      }
    }
    const res = await apiRequest(method, route, data);
    const json = await res.json();
    _cache.set(cacheKey, stryMutAct_9fa48("4290") ? {} : (stryCov_9fa48("4290"), {
      data: json,
      timestamp: Date.now()
    }));
    return json;
  }
}
type UnauthorizedBehavior = 'returnNull' | 'throw' | 'redirect';
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> = stryMutAct_9fa48("4291") ? () => undefined : (stryCov_9fa48("4291"), (() => {
  const getQueryFn: <T>(options: {
    on401: UnauthorizedBehavior;
  }) => QueryFunction<T> = ({
    on401
  }) => async ({
    queryKey
  }) => {
    if (stryMutAct_9fa48("4292")) {
      {}
    } else {
      stryCov_9fa48("4292");
      const route = Array.isArray(queryKey) ? queryKey.join(stryMutAct_9fa48("4293") ? "" : (stryCov_9fa48("4293"), '/')) : String(queryKey);
      const res = await fetch(buildApiUrl(route), stryMutAct_9fa48("4294") ? {} : (stryCov_9fa48("4294"), {
        headers: _accessToken ? stryMutAct_9fa48("4295") ? {} : (stryCov_9fa48("4295"), {
          Authorization: stryMutAct_9fa48("4296") ? `` : (stryCov_9fa48("4296"), `Bearer ${_accessToken}`)
        }) : undefined,
        credentials: (stryMutAct_9fa48("4299") ? Platform.OS !== 'web' : stryMutAct_9fa48("4298") ? false : stryMutAct_9fa48("4297") ? true : (stryCov_9fa48("4297", "4298", "4299"), Platform.OS === (stryMutAct_9fa48("4300") ? "" : (stryCov_9fa48("4300"), 'web')))) ? stryMutAct_9fa48("4301") ? "" : (stryCov_9fa48("4301"), 'omit') : undefined
      }));
      if (stryMutAct_9fa48("4304") ? res.status !== 401 : stryMutAct_9fa48("4303") ? false : stryMutAct_9fa48("4302") ? true : (stryCov_9fa48("4302", "4303", "4304"), res.status === 401)) {
        if (stryMutAct_9fa48("4305")) {
          {}
        } else {
          stryCov_9fa48("4305");
          if (stryMutAct_9fa48("4308") ? on401 !== 'returnNull' : stryMutAct_9fa48("4307") ? false : stryMutAct_9fa48("4306") ? true : (stryCov_9fa48("4306", "4307", "4308"), on401 === (stryMutAct_9fa48("4309") ? "" : (stryCov_9fa48("4309"), 'returnNull')))) return null as any;
          if (stryMutAct_9fa48("4312") ? on401 !== 'redirect' : stryMutAct_9fa48("4311") ? false : stryMutAct_9fa48("4310") ? true : (stryCov_9fa48("4310", "4311", "4312"), on401 === (stryMutAct_9fa48("4313") ? "" : (stryCov_9fa48("4313"), 'redirect')))) {
            if (stryMutAct_9fa48("4314")) {
              {}
            } else {
              stryCov_9fa48("4314");
              router.replace(stryMutAct_9fa48("4315") ? "" : (stryCov_9fa48("4315"), '/(onboarding)/login'));
              return null as any;
            }
          }
        }
      }
      await throwIfResNotOk(res);
      return res.json();
    }
  };
  return getQueryFn;
})());

/**
 * No retry on 4xx — only retry transient network/server errors.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (stryMutAct_9fa48("4316")) {
    {}
  } else {
    stryCov_9fa48("4316");
    if (stryMutAct_9fa48("4320") ? failureCount < 3 : stryMutAct_9fa48("4319") ? failureCount > 3 : stryMutAct_9fa48("4318") ? false : stryMutAct_9fa48("4317") ? true : (stryCov_9fa48("4317", "4318", "4319", "4320"), failureCount >= 3)) return stryMutAct_9fa48("4321") ? true : (stryCov_9fa48("4321"), false);
    if (stryMutAct_9fa48("4323") ? false : stryMutAct_9fa48("4322") ? true : (stryCov_9fa48("4322", "4323"), error instanceof Error)) {
      if (stryMutAct_9fa48("4324")) {
        {}
      } else {
        stryCov_9fa48("4324");
        const match = error.message.match(stryMutAct_9fa48("4327") ? /^(\D{3}):/ : stryMutAct_9fa48("4326") ? /^(\d):/ : stryMutAct_9fa48("4325") ? /(\d{3}):/ : (stryCov_9fa48("4325", "4326", "4327"), /^(\d{3}):/));
        if (stryMutAct_9fa48("4330") ? match && parseInt(match[1]) >= 400 || parseInt(match[1]) < 500 : stryMutAct_9fa48("4329") ? false : stryMutAct_9fa48("4328") ? true : (stryCov_9fa48("4328", "4329", "4330"), (stryMutAct_9fa48("4332") ? match || parseInt(match[1]) >= 400 : stryMutAct_9fa48("4331") ? true : (stryCov_9fa48("4331", "4332"), match && (stryMutAct_9fa48("4335") ? parseInt(match[1]) < 400 : stryMutAct_9fa48("4334") ? parseInt(match[1]) > 400 : stryMutAct_9fa48("4333") ? true : (stryCov_9fa48("4333", "4334", "4335"), parseInt(match[1]) >= 400)))) && (stryMutAct_9fa48("4338") ? parseInt(match[1]) >= 500 : stryMutAct_9fa48("4337") ? parseInt(match[1]) <= 500 : stryMutAct_9fa48("4336") ? true : (stryCov_9fa48("4336", "4337", "4338"), parseInt(match[1]) < 500)))) {
          if (stryMutAct_9fa48("4339")) {
            {}
          } else {
            stryCov_9fa48("4339");
            return stryMutAct_9fa48("4340") ? true : (stryCov_9fa48("4340"), false);
          }
        }
      }
    }
    return stryMutAct_9fa48("4341") ? false : (stryCov_9fa48("4341"), true);
  }
}
export const queryClient = new QueryClient(stryMutAct_9fa48("4342") ? {} : (stryCov_9fa48("4342"), {
  defaultOptions: stryMutAct_9fa48("4343") ? {} : (stryCov_9fa48("4343"), {
    queries: stryMutAct_9fa48("4344") ? {} : (stryCov_9fa48("4344"), {
      queryFn: getQueryFn(stryMutAct_9fa48("4345") ? {} : (stryCov_9fa48("4345"), {
        on401: stryMutAct_9fa48("4346") ? "" : (stryCov_9fa48("4346"), 'throw')
      })),
      staleTime: stryMutAct_9fa48("4347") ? 5 * 60 / 1000 : (stryCov_9fa48("4347"), (stryMutAct_9fa48("4348") ? 5 / 60 : (stryCov_9fa48("4348"), 5 * 60)) * 1000),
      gcTime: stryMutAct_9fa48("4349") ? 15 * 60 / 1000 : (stryCov_9fa48("4349"), (stryMutAct_9fa48("4350") ? 15 / 60 : (stryCov_9fa48("4350"), 15 * 60)) * 1000),
      retry: shouldRetry,
      refetchOnWindowFocus: stryMutAct_9fa48("4353") ? Platform.OS !== 'web' : stryMutAct_9fa48("4352") ? false : stryMutAct_9fa48("4351") ? true : (stryCov_9fa48("4351", "4352", "4353"), Platform.OS === (stryMutAct_9fa48("4354") ? "" : (stryCov_9fa48("4354"), 'web'))),
      refetchInterval: stryMutAct_9fa48("4355") ? true : (stryCov_9fa48("4355"), false),
      networkMode: stryMutAct_9fa48("4356") ? "" : (stryCov_9fa48("4356"), 'online')
    }),
    mutations: stryMutAct_9fa48("4357") ? {} : (stryCov_9fa48("4357"), {
      retry: 2,
      onMutate: async () => {
        if (stryMutAct_9fa48("4358")) {
          {}
        } else {
          stryCov_9fa48("4358");
          if (stryMutAct_9fa48("4361") ? Platform.OS === 'web' : stryMutAct_9fa48("4360") ? false : stryMutAct_9fa48("4359") ? true : (stryCov_9fa48("4359", "4360", "4361"), Platform.OS !== (stryMutAct_9fa48("4362") ? "" : (stryCov_9fa48("4362"), 'web')))) {
            if (stryMutAct_9fa48("4363")) {
              {}
            } else {
              stryCov_9fa48("4363");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }
      }
    })
  })
}));
export const queryPersister = createAsyncStoragePersister(stryMutAct_9fa48("4364") ? {} : (stryCov_9fa48("4364"), {
  storage: AsyncStorage,
  // Use a custom key to avoid colliding with other AsyncStorage items
  key: stryMutAct_9fa48("4365") ? "" : (stryCov_9fa48("4365"), 'CULTUREPASS_QUERY_CACHE_V1'),
  // Limit cached data to avoid blowing up storage limits (10MB limit in AsyncStorage usually, we go 5MB)
  throttleTime: 1000
}));
export function invalidateSydneyQueries() {
  if (stryMutAct_9fa48("4366")) {
    {}
  } else {
    stryCov_9fa48("4366");
    queryClient.invalidateQueries(stryMutAct_9fa48("4367") ? {} : (stryCov_9fa48("4367"), {
      predicate: stryMutAct_9fa48("4368") ? () => undefined : (stryCov_9fa48("4368"), query => stryMutAct_9fa48("4369") ? query.queryKey.every(key => String(key).toLowerCase().includes('sydney') || String(key).toLowerCase().includes('event')) : (stryCov_9fa48("4369"), query.queryKey.some(stryMutAct_9fa48("4370") ? () => undefined : (stryCov_9fa48("4370"), key => stryMutAct_9fa48("4373") ? String(key).toLowerCase().includes('sydney') && String(key).toLowerCase().includes('event') : stryMutAct_9fa48("4372") ? false : stryMutAct_9fa48("4371") ? true : (stryCov_9fa48("4371", "4372", "4373"), (stryMutAct_9fa48("4374") ? String(key).toUpperCase().includes('sydney') : (stryCov_9fa48("4374"), String(key).toLowerCase().includes(stryMutAct_9fa48("4375") ? "" : (stryCov_9fa48("4375"), 'sydney')))) || (stryMutAct_9fa48("4376") ? String(key).toUpperCase().includes('event') : (stryCov_9fa48("4376"), String(key).toLowerCase().includes(stryMutAct_9fa48("4377") ? "" : (stryCov_9fa48("4377"), 'event')))))))))
    }));
  }
}
export function invalidateUserQueries(userId: string) {
  if (stryMutAct_9fa48("4378")) {
    {}
  } else {
    stryCov_9fa48("4378");
    queryClient.invalidateQueries(stryMutAct_9fa48("4379") ? {} : (stryCov_9fa48("4379"), {
      queryKey: stryMutAct_9fa48("4380") ? [] : (stryCov_9fa48("4380"), [stryMutAct_9fa48("4381") ? "" : (stryCov_9fa48("4381"), 'user'), userId])
    }));
    queryClient.invalidateQueries(stryMutAct_9fa48("4382") ? {} : (stryCov_9fa48("4382"), {
      queryKey: stryMutAct_9fa48("4383") ? [] : (stryCov_9fa48("4383"), [stryMutAct_9fa48("4384") ? "" : (stryCov_9fa48("4384"), 'profile'), userId])
    }));
  }
}
export function preheatSydneyData() {
  if (stryMutAct_9fa48("4385")) {
    {}
  } else {
    stryCov_9fa48("4385");
    queryClient.prefetchQuery(stryMutAct_9fa48("4386") ? {} : (stryCov_9fa48("4386"), {
      queryKey: stryMutAct_9fa48("4387") ? [] : (stryCov_9fa48("4387"), [stryMutAct_9fa48("4388") ? "" : (stryCov_9fa48("4388"), 'sydneyEvents')]),
      queryFn: stryMutAct_9fa48("4389") ? () => undefined : (stryCov_9fa48("4389"), () => apiRequestCached(stryMutAct_9fa48("4390") ? "" : (stryCov_9fa48("4390"), 'GET'), stryMutAct_9fa48("4391") ? "" : (stryCov_9fa48("4391"), 'api/events?city=sydney')))
    }));
  }
}
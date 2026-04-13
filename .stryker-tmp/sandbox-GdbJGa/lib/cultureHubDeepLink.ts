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
import type { CultureHubNearRadiusKm, CultureHubScope } from '@/lib/cultureDestinationScope';
import { clampCultureHubNearRadiusKm } from '@/lib/cultureDestinationScope';
function firstParam(v: string | string[] | undefined): string | undefined {
  if (stryMutAct_9fa48("2237")) {
    {}
  } else {
    stryCov_9fa48("2237");
    if (stryMutAct_9fa48("2240") ? v !== undefined : stryMutAct_9fa48("2239") ? false : stryMutAct_9fa48("2238") ? true : (stryCov_9fa48("2238", "2239", "2240"), v === undefined)) return undefined;
    const s = Array.isArray(v) ? v[0] : v;
    const t = (stryMutAct_9fa48("2243") ? typeof s !== 'string' : stryMutAct_9fa48("2242") ? false : stryMutAct_9fa48("2241") ? true : (stryCov_9fa48("2241", "2242", "2243"), typeof s === (stryMutAct_9fa48("2244") ? "" : (stryCov_9fa48("2244"), 'string')))) ? stryMutAct_9fa48("2245") ? decodeURIComponent(s) : (stryCov_9fa48("2245"), decodeURIComponent(s).trim()) : stryMutAct_9fa48("2246") ? "Stryker was here!" : (stryCov_9fa48("2246"), '');
    return stryMutAct_9fa48("2249") ? t && undefined : stryMutAct_9fa48("2248") ? false : stryMutAct_9fa48("2247") ? true : (stryCov_9fa48("2247", "2248", "2249"), t || undefined);
  }
}
export function mapScopeString(raw: string | undefined): CultureHubScope | undefined {
  if (stryMutAct_9fa48("2250")) {
    {}
  } else {
    stryCov_9fa48("2250");
    if (stryMutAct_9fa48("2253") ? false : stryMutAct_9fa48("2252") ? true : stryMutAct_9fa48("2251") ? raw : (stryCov_9fa48("2251", "2252", "2253"), !raw)) return undefined;
    const x = stryMutAct_9fa48("2255") ? raw.toUpperCase().trim() : stryMutAct_9fa48("2254") ? raw.toLowerCase() : (stryCov_9fa48("2254", "2255"), raw.toLowerCase().trim());
    if (stryMutAct_9fa48("2257") ? false : stryMutAct_9fa48("2256") ? true : (stryCov_9fa48("2256", "2257"), (stryMutAct_9fa48("2258") ? [] : (stryCov_9fa48("2258"), [stryMutAct_9fa48("2259") ? "" : (stryCov_9fa48("2259"), 'single'), stryMutAct_9fa48("2260") ? "" : (stryCov_9fa48("2260"), 'country'), stryMutAct_9fa48("2261") ? "" : (stryCov_9fa48("2261"), 'local'), stryMutAct_9fa48("2262") ? "" : (stryCov_9fa48("2262"), 'singlecountry')])).includes(x))) return stryMutAct_9fa48("2263") ? "" : (stryCov_9fa48("2263"), 'singleCountry');
    if (stryMutAct_9fa48("2265") ? false : stryMutAct_9fa48("2264") ? true : (stryCov_9fa48("2264", "2265"), (stryMutAct_9fa48("2266") ? [] : (stryCov_9fa48("2266"), [stryMutAct_9fa48("2267") ? "" : (stryCov_9fa48("2267"), 'diaspora'), stryMutAct_9fa48("2268") ? "" : (stryCov_9fa48("2268"), 'world'), stryMutAct_9fa48("2269") ? "" : (stryCov_9fa48("2269"), 'worldwide'), stryMutAct_9fa48("2270") ? "" : (stryCov_9fa48("2270"), 'global'), stryMutAct_9fa48("2271") ? "" : (stryCov_9fa48("2271"), 'hub')])).includes(x))) return stryMutAct_9fa48("2272") ? "" : (stryCov_9fa48("2272"), 'diaspora');
    if (stryMutAct_9fa48("2274") ? false : stryMutAct_9fa48("2273") ? true : (stryCov_9fa48("2273", "2274"), (stryMutAct_9fa48("2275") ? [] : (stryCov_9fa48("2275"), [stryMutAct_9fa48("2276") ? "" : (stryCov_9fa48("2276"), 'near'), stryMutAct_9fa48("2277") ? "" : (stryCov_9fa48("2277"), 'nearyou'), stryMutAct_9fa48("2278") ? "" : (stryCov_9fa48("2278"), 'nearme'), stryMutAct_9fa48("2279") ? "" : (stryCov_9fa48("2279"), 'nearby'), stryMutAct_9fa48("2280") ? "" : (stryCov_9fa48("2280"), 'localradius'), stryMutAct_9fa48("2281") ? "" : (stryCov_9fa48("2281"), 'gps')])).includes(x))) return stryMutAct_9fa48("2282") ? "" : (stryCov_9fa48("2282"), 'nearYou');
    return undefined;
  }
}

/**
 * Stable key for effects when only culture-hub query keys matter.
 * `state` segment: undefined key → `\x00`; key with no value → empty string marker.
 */
export function cultureHubRouteKey(raw?: Record<string, string | string[] | undefined>): string {
  if (stryMutAct_9fa48("2283")) {
    {}
  } else {
    stryCov_9fa48("2283");
    if (stryMutAct_9fa48("2286") ? false : stryMutAct_9fa48("2285") ? true : stryMutAct_9fa48("2284") ? raw : (stryCov_9fa48("2284", "2285", "2286"), !raw)) return stryMutAct_9fa48("2287") ? "Stryker was here!" : (stryCov_9fa48("2287"), '');
    const c = (stryMutAct_9fa48("2290") ? raw.country === undefined : stryMutAct_9fa48("2289") ? false : stryMutAct_9fa48("2288") ? true : (stryCov_9fa48("2288", "2289", "2290"), raw.country !== undefined)) ? stryMutAct_9fa48("2291") ? firstParam(raw.country) && '' : (stryCov_9fa48("2291"), firstParam(raw.country) ?? (stryMutAct_9fa48("2292") ? "Stryker was here!" : (stryCov_9fa48("2292"), ''))) : stryMutAct_9fa48("2293") ? "" : (stryCov_9fa48("2293"), '\x00');
    const s = (stryMutAct_9fa48("2296") ? raw.scope === undefined : stryMutAct_9fa48("2295") ? false : stryMutAct_9fa48("2294") ? true : (stryCov_9fa48("2294", "2295", "2296"), raw.scope !== undefined)) ? stryMutAct_9fa48("2297") ? firstParam(raw.scope) && '' : (stryCov_9fa48("2297"), firstParam(raw.scope) ?? (stryMutAct_9fa48("2298") ? "Stryker was here!" : (stryCov_9fa48("2298"), ''))) : stryMutAct_9fa48("2299") ? "" : (stryCov_9fa48("2299"), '\x00');
    let st: string;
    if (stryMutAct_9fa48("2302") ? raw.state !== undefined : stryMutAct_9fa48("2301") ? false : stryMutAct_9fa48("2300") ? true : (stryCov_9fa48("2300", "2301", "2302"), raw.state === undefined)) st = stryMutAct_9fa48("2303") ? "" : (stryCov_9fa48("2303"), '\x00');else st = stryMutAct_9fa48("2304") ? firstParam(raw.state) && '' : (stryCov_9fa48("2304"), firstParam(raw.state) ?? (stryMutAct_9fa48("2305") ? "Stryker was here!" : (stryCov_9fa48("2305"), '')));
    const r = (stryMutAct_9fa48("2308") ? raw.radius === undefined : stryMutAct_9fa48("2307") ? false : stryMutAct_9fa48("2306") ? true : (stryCov_9fa48("2306", "2307", "2308"), raw.radius !== undefined)) ? stryMutAct_9fa48("2309") ? firstParam(raw.radius) && '' : (stryCov_9fa48("2309"), firstParam(raw.radius) ?? (stryMutAct_9fa48("2310") ? "Stryker was here!" : (stryCov_9fa48("2310"), ''))) : stryMutAct_9fa48("2311") ? "" : (stryCov_9fa48("2311"), '\x00');
    return stryMutAct_9fa48("2312") ? `` : (stryCov_9fa48("2312"), `${c}\n${s}\n${st}\n${r}`);
  }
}

/**
 * Apply when any of `country`, `scope`, or `state` appear in the URL (Expo / web).
 */
export function cultureHubHasUrlOverrides(raw?: Record<string, string | string[] | undefined>): boolean {
  if (stryMutAct_9fa48("2313")) {
    {}
  } else {
    stryCov_9fa48("2313");
    if (stryMutAct_9fa48("2316") ? false : stryMutAct_9fa48("2315") ? true : stryMutAct_9fa48("2314") ? raw : (stryCov_9fa48("2314", "2315", "2316"), !raw)) return stryMutAct_9fa48("2317") ? true : (stryCov_9fa48("2317"), false);
    return stryMutAct_9fa48("2320") ? (raw.country !== undefined || raw.scope !== undefined || raw.state !== undefined) && raw.radius !== undefined : stryMutAct_9fa48("2319") ? false : stryMutAct_9fa48("2318") ? true : (stryCov_9fa48("2318", "2319", "2320"), (stryMutAct_9fa48("2322") ? (raw.country !== undefined || raw.scope !== undefined) && raw.state !== undefined : stryMutAct_9fa48("2321") ? false : (stryCov_9fa48("2321", "2322"), (stryMutAct_9fa48("2324") ? raw.country !== undefined && raw.scope !== undefined : stryMutAct_9fa48("2323") ? false : (stryCov_9fa48("2323", "2324"), (stryMutAct_9fa48("2326") ? raw.country === undefined : stryMutAct_9fa48("2325") ? false : (stryCov_9fa48("2325", "2326"), raw.country !== undefined)) || (stryMutAct_9fa48("2328") ? raw.scope === undefined : stryMutAct_9fa48("2327") ? false : (stryCov_9fa48("2327", "2328"), raw.scope !== undefined)))) || (stryMutAct_9fa48("2330") ? raw.state === undefined : stryMutAct_9fa48("2329") ? false : (stryCov_9fa48("2329", "2330"), raw.state !== undefined)))) || (stryMutAct_9fa48("2332") ? raw.radius === undefined : stryMutAct_9fa48("2331") ? false : (stryCov_9fa48("2331", "2332"), raw.radius !== undefined)));
  }
}
export type CultureHubUrlApply = {
  country?: string;
  scope?: CultureHubScope;
  /** When true, caller should set `focusStateCode` to `stateCode` (possibly undefined). */
  applyState: boolean;
  stateCode?: string;
  /** `?radius=` for Near me (km), snapped to a preset. */
  nearRadiusKm?: CultureHubNearRadiusKm;
};

/** Parse query keys when `cultureHubHasUrlOverrides` is true. */
export function parseCultureHubUrlApply(raw?: Record<string, string | string[] | undefined>): CultureHubUrlApply {
  if (stryMutAct_9fa48("2333")) {
    {}
  } else {
    stryCov_9fa48("2333");
    const out: CultureHubUrlApply = stryMutAct_9fa48("2334") ? {} : (stryCov_9fa48("2334"), {
      applyState: stryMutAct_9fa48("2335") ? true : (stryCov_9fa48("2335"), false)
    });
    if (stryMutAct_9fa48("2338") ? false : stryMutAct_9fa48("2337") ? true : stryMutAct_9fa48("2336") ? raw : (stryCov_9fa48("2336", "2337", "2338"), !raw)) return out;
    if (stryMutAct_9fa48("2341") ? raw.country === undefined : stryMutAct_9fa48("2340") ? false : stryMutAct_9fa48("2339") ? true : (stryCov_9fa48("2339", "2340", "2341"), raw.country !== undefined)) {
      if (stryMutAct_9fa48("2342")) {
        {}
      } else {
        stryCov_9fa48("2342");
        const v = firstParam(raw.country);
        if (stryMutAct_9fa48("2344") ? false : stryMutAct_9fa48("2343") ? true : (stryCov_9fa48("2343", "2344"), v)) out.country = v;
      }
    }
    if (stryMutAct_9fa48("2347") ? raw.scope === undefined : stryMutAct_9fa48("2346") ? false : stryMutAct_9fa48("2345") ? true : (stryCov_9fa48("2345", "2346", "2347"), raw.scope !== undefined)) {
      if (stryMutAct_9fa48("2348")) {
        {}
      } else {
        stryCov_9fa48("2348");
        const v = firstParam(raw.scope);
        const mapped = mapScopeString(stryMutAct_9fa48("2349") ? v && '' : (stryCov_9fa48("2349"), v ?? (stryMutAct_9fa48("2350") ? "Stryker was here!" : (stryCov_9fa48("2350"), ''))));
        if (stryMutAct_9fa48("2352") ? false : stryMutAct_9fa48("2351") ? true : (stryCov_9fa48("2351", "2352"), mapped)) out.scope = mapped;
      }
    }
    if (stryMutAct_9fa48("2355") ? raw.state === undefined : stryMutAct_9fa48("2354") ? false : stryMutAct_9fa48("2353") ? true : (stryCov_9fa48("2353", "2354", "2355"), raw.state !== undefined)) {
      if (stryMutAct_9fa48("2356")) {
        {}
      } else {
        stryCov_9fa48("2356");
        out.applyState = stryMutAct_9fa48("2357") ? false : (stryCov_9fa48("2357"), true);
        const v = firstParam(raw.state);
        if (stryMutAct_9fa48("2360") ? (!v || v === '*') && v.toLowerCase() === 'all' : stryMutAct_9fa48("2359") ? false : stryMutAct_9fa48("2358") ? true : (stryCov_9fa48("2358", "2359", "2360"), (stryMutAct_9fa48("2362") ? !v && v === '*' : stryMutAct_9fa48("2361") ? false : (stryCov_9fa48("2361", "2362"), (stryMutAct_9fa48("2363") ? v : (stryCov_9fa48("2363"), !v)) || (stryMutAct_9fa48("2365") ? v !== '*' : stryMutAct_9fa48("2364") ? false : (stryCov_9fa48("2364", "2365"), v === (stryMutAct_9fa48("2366") ? "" : (stryCov_9fa48("2366"), '*')))))) || (stryMutAct_9fa48("2368") ? v.toLowerCase() !== 'all' : stryMutAct_9fa48("2367") ? false : (stryCov_9fa48("2367", "2368"), (stryMutAct_9fa48("2369") ? v.toUpperCase() : (stryCov_9fa48("2369"), v.toLowerCase())) === (stryMutAct_9fa48("2370") ? "" : (stryCov_9fa48("2370"), 'all')))))) {
          if (stryMutAct_9fa48("2371")) {
            {}
          } else {
            stryCov_9fa48("2371");
            out.stateCode = undefined;
          }
        } else {
          if (stryMutAct_9fa48("2372")) {
            {}
          } else {
            stryCov_9fa48("2372");
            out.stateCode = (stryMutAct_9fa48("2376") ? v.length > 4 : stryMutAct_9fa48("2375") ? v.length < 4 : stryMutAct_9fa48("2374") ? false : stryMutAct_9fa48("2373") ? true : (stryCov_9fa48("2373", "2374", "2375", "2376"), v.length <= 4)) ? stryMutAct_9fa48("2377") ? v.toLowerCase() : (stryCov_9fa48("2377"), v.toUpperCase()) : v;
          }
        }
      }
    }
    if (stryMutAct_9fa48("2380") ? raw.radius === undefined : stryMutAct_9fa48("2379") ? false : stryMutAct_9fa48("2378") ? true : (stryCov_9fa48("2378", "2379", "2380"), raw.radius !== undefined)) {
      if (stryMutAct_9fa48("2381")) {
        {}
      } else {
        stryCov_9fa48("2381");
        const v = firstParam(raw.radius);
        if (stryMutAct_9fa48("2383") ? false : stryMutAct_9fa48("2382") ? true : (stryCov_9fa48("2382", "2383"), v)) {
          if (stryMutAct_9fa48("2384")) {
            {}
          } else {
            stryCov_9fa48("2384");
            const parsed = Number.parseInt(v, 10);
            if (stryMutAct_9fa48("2387") ? Number.isFinite(parsed) || parsed > 0 : stryMutAct_9fa48("2386") ? false : stryMutAct_9fa48("2385") ? true : (stryCov_9fa48("2385", "2386", "2387"), Number.isFinite(parsed) && (stryMutAct_9fa48("2390") ? parsed <= 0 : stryMutAct_9fa48("2389") ? parsed >= 0 : stryMutAct_9fa48("2388") ? true : (stryCov_9fa48("2388", "2389", "2390"), parsed > 0)))) {
              if (stryMutAct_9fa48("2391")) {
                {}
              } else {
                stryCov_9fa48("2391");
                out.nearRadiusKm = clampCultureHubNearRadiusKm(parsed);
              }
            }
          }
        }
      }
    }
    return out;
  }
}

/** Returns `?country=…&scope=…&state=…` (leading ?) or empty string if nothing to add. */
export function appendCultureHubQuerySuffix(params: {
  country: string;
  scope: CultureHubScope;
  stateCode?: string;
  /** Included when scope is Near me so shared links preserve search distance. */
  nearRadiusKm?: number;
}): string {
  if (stryMutAct_9fa48("2392")) {
    {}
  } else {
    stryCov_9fa48("2392");
    const q = new URLSearchParams();
    if (stryMutAct_9fa48("2395") ? params.country : stryMutAct_9fa48("2394") ? false : stryMutAct_9fa48("2393") ? true : (stryCov_9fa48("2393", "2394", "2395"), params.country.trim())) q.set(stryMutAct_9fa48("2396") ? "" : (stryCov_9fa48("2396"), 'country'), stryMutAct_9fa48("2397") ? params.country : (stryCov_9fa48("2397"), params.country.trim()));
    const scopeQ = (stryMutAct_9fa48("2400") ? params.scope !== 'singleCountry' : stryMutAct_9fa48("2399") ? false : stryMutAct_9fa48("2398") ? true : (stryCov_9fa48("2398", "2399", "2400"), params.scope === (stryMutAct_9fa48("2401") ? "" : (stryCov_9fa48("2401"), 'singleCountry')))) ? stryMutAct_9fa48("2402") ? "" : (stryCov_9fa48("2402"), 'single') : (stryMutAct_9fa48("2405") ? params.scope !== 'nearYou' : stryMutAct_9fa48("2404") ? false : stryMutAct_9fa48("2403") ? true : (stryCov_9fa48("2403", "2404", "2405"), params.scope === (stryMutAct_9fa48("2406") ? "" : (stryCov_9fa48("2406"), 'nearYou')))) ? stryMutAct_9fa48("2407") ? "" : (stryCov_9fa48("2407"), 'near') : stryMutAct_9fa48("2408") ? "" : (stryCov_9fa48("2408"), 'diaspora');
    q.set(stryMutAct_9fa48("2409") ? "" : (stryCov_9fa48("2409"), 'scope'), scopeQ);
    if (stryMutAct_9fa48("2413") ? params.stateCode.trim() : stryMutAct_9fa48("2412") ? params.stateCode : stryMutAct_9fa48("2411") ? false : stryMutAct_9fa48("2410") ? true : (stryCov_9fa48("2410", "2411", "2412", "2413"), params.stateCode?.trim())) q.set(stryMutAct_9fa48("2414") ? "" : (stryCov_9fa48("2414"), 'state'), stryMutAct_9fa48("2415") ? params.stateCode : (stryCov_9fa48("2415"), params.stateCode.trim()));
    if (stryMutAct_9fa48("2418") ? params.scope === 'nearYou' || params.nearRadiusKm != null : stryMutAct_9fa48("2417") ? false : stryMutAct_9fa48("2416") ? true : (stryCov_9fa48("2416", "2417", "2418"), (stryMutAct_9fa48("2420") ? params.scope !== 'nearYou' : stryMutAct_9fa48("2419") ? true : (stryCov_9fa48("2419", "2420"), params.scope === (stryMutAct_9fa48("2421") ? "" : (stryCov_9fa48("2421"), 'nearYou')))) && (stryMutAct_9fa48("2423") ? params.nearRadiusKm == null : stryMutAct_9fa48("2422") ? true : (stryCov_9fa48("2422", "2423"), params.nearRadiusKm != null)))) {
      if (stryMutAct_9fa48("2424")) {
        {}
      } else {
        stryCov_9fa48("2424");
        q.set(stryMutAct_9fa48("2425") ? "" : (stryCov_9fa48("2425"), 'radius'), String(params.nearRadiusKm));
      }
    }
    const s = q.toString();
    return s ? stryMutAct_9fa48("2426") ? `` : (stryCov_9fa48("2426"), `?${s}`) : stryMutAct_9fa48("2427") ? "Stryker was here!" : (stryCov_9fa48("2427"), '');
  }
}
export function buildCultureHubShareUrl(origin: string, publicPath: string, params: {
  country: string;
  scope: CultureHubScope;
  stateCode?: string;
  nearRadiusKm?: number;
}): string {
  if (stryMutAct_9fa48("2428")) {
    {}
  } else {
    stryCov_9fa48("2428");
    const path = (stryMutAct_9fa48("2429") ? publicPath.endsWith('/') : (stryCov_9fa48("2429"), publicPath.startsWith(stryMutAct_9fa48("2430") ? "" : (stryCov_9fa48("2430"), '/')))) ? publicPath : stryMutAct_9fa48("2431") ? `` : (stryCov_9fa48("2431"), `/${publicPath}`);
    const cleanOrigin = origin.replace(stryMutAct_9fa48("2432") ? /\// : (stryCov_9fa48("2432"), /\/$/), stryMutAct_9fa48("2433") ? "Stryker was here!" : (stryCov_9fa48("2433"), ''));
    return stryMutAct_9fa48("2434") ? `` : (stryCov_9fa48("2434"), `${cleanOrigin}${path}${appendCultureHubQuerySuffix(params)}`);
  }
}

/** Link from hub index / menus with optional onboarding defaults. */
export function cultureHubIndexLinkPath(publicPath: string, prefs: {
  country?: string;
  stateCode?: string;
  scope?: CultureHubScope;
  nearRadiusKm?: number;
}): string {
  if (stryMutAct_9fa48("2435")) {
    {}
  } else {
    stryCov_9fa48("2435");
    const path = (stryMutAct_9fa48("2436") ? publicPath.endsWith('/') : (stryCov_9fa48("2436"), publicPath.startsWith(stryMutAct_9fa48("2437") ? "" : (stryCov_9fa48("2437"), '/')))) ? publicPath : stryMutAct_9fa48("2438") ? `` : (stryCov_9fa48("2438"), `/${publicPath}`);
    return stryMutAct_9fa48("2439") ? `` : (stryCov_9fa48("2439"), `${path}${appendCultureHubQuerySuffix(stryMutAct_9fa48("2440") ? {} : (stryCov_9fa48("2440"), {
      country: stryMutAct_9fa48("2443") ? prefs.country?.trim() && 'Australia' : stryMutAct_9fa48("2442") ? false : stryMutAct_9fa48("2441") ? true : (stryCov_9fa48("2441", "2442", "2443"), (stryMutAct_9fa48("2445") ? prefs.country.trim() : stryMutAct_9fa48("2444") ? prefs.country : (stryCov_9fa48("2444", "2445"), prefs.country?.trim())) || (stryMutAct_9fa48("2446") ? "" : (stryCov_9fa48("2446"), 'Australia'))),
      scope: stryMutAct_9fa48("2447") ? prefs.scope && 'singleCountry' : (stryCov_9fa48("2447"), prefs.scope ?? (stryMutAct_9fa48("2448") ? "" : (stryCov_9fa48("2448"), 'singleCountry'))),
      stateCode: prefs.stateCode,
      nearRadiusKm: prefs.nearRadiusKm
    }))}`);
  }
}
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
import type { EventData } from '@/shared/schema';
import { getStateForCity } from '@/constants/locations';

/** Default countries to scan for diaspora culture hubs (merged with viewer’s country). */
export const CULTURE_HUB_DEFAULT_COUNTRIES = ['Australia', 'New Zealand', 'United Arab Emirates', 'United Kingdom', 'Canada', 'India', 'United States', 'Singapore', 'Philippines', 'Vietnam', 'South Korea', 'Japan', 'China', 'Mexico', 'Nigeria', 'South Africa', 'Kenya', 'Ethiopia', 'Somalia', 'Iran', 'Lebanon', 'Greece', 'Italy', 'Ukraine', 'Pakistan', 'Sri Lanka', 'Bangladesh', 'Nepal', 'Indonesia', 'Malaysia', 'Thailand', 'France', 'Germany', 'Netherlands', 'Ireland'] as const;
export function normalizeCultureText(value?: string | null): string {
  if (stryMutAct_9fa48("2114")) {
    {}
  } else {
    stryCov_9fa48("2114");
    return stryMutAct_9fa48("2116") ? (value ?? '').toUpperCase().trim() : stryMutAct_9fa48("2115") ? (value ?? '').toLowerCase() : (stryCov_9fa48("2115", "2116"), (stryMutAct_9fa48("2117") ? value && '' : (stryCov_9fa48("2117"), value ?? (stryMutAct_9fa48("2118") ? "Stryker was here!" : (stryCov_9fa48("2118"), '')))).toLowerCase().trim());
  }
}

/** Build one searchable string from an event for culture / language matching. */
export function eventCultureHaystack(event: EventData): string {
  if (stryMutAct_9fa48("2119")) {
    {}
  } else {
    stryCov_9fa48("2119");
    return normalizeCultureText((stryMutAct_9fa48("2120") ? [] : (stryCov_9fa48("2120"), [event.title, event.description, event.category, event.city, event.state, event.country, event.venue, ...(stryMutAct_9fa48("2121") ? event.tags && [] : (stryCov_9fa48("2121"), event.tags ?? (stryMutAct_9fa48("2122") ? ["Stryker was here"] : (stryCov_9fa48("2122"), [])))), ...(stryMutAct_9fa48("2123") ? event.cultureTag && [] : (stryCov_9fa48("2123"), event.cultureTag ?? (stryMutAct_9fa48("2124") ? ["Stryker was here"] : (stryCov_9fa48("2124"), [])))), ...(stryMutAct_9fa48("2125") ? event.cultureTags && [] : (stryCov_9fa48("2125"), event.cultureTags ?? (stryMutAct_9fa48("2126") ? ["Stryker was here"] : (stryCov_9fa48("2126"), [])))), ...(stryMutAct_9fa48("2127") ? event.languageTags && [] : (stryCov_9fa48("2127"), event.languageTags ?? (stryMutAct_9fa48("2128") ? ["Stryker was here"] : (stryCov_9fa48("2128"), []))))])).join(stryMutAct_9fa48("2129") ? "" : (stryCov_9fa48("2129"), ' ')));
  }
}
export function eventMatchesCultureTerms(event: EventData, terms: string[]): boolean {
  if (stryMutAct_9fa48("2130")) {
    {}
  } else {
    stryCov_9fa48("2130");
    if (stryMutAct_9fa48("2133") ? terms.length !== 0 : stryMutAct_9fa48("2132") ? false : stryMutAct_9fa48("2131") ? true : (stryCov_9fa48("2131", "2132", "2133"), terms.length === 0)) return stryMutAct_9fa48("2134") ? false : (stryCov_9fa48("2134"), true);
    const hay = eventCultureHaystack(event);
    return stryMutAct_9fa48("2135") ? terms.every(t => hay.includes(normalizeCultureText(t))) : (stryCov_9fa48("2135"), terms.some(stryMutAct_9fa48("2136") ? () => undefined : (stryCov_9fa48("2136"), t => hay.includes(normalizeCultureText(t)))));
  }
}

/** True if the event is in the viewer’s selected region (state / territory code). */
export function eventMatchesViewerRegion(event: EventData, stateCode: string): boolean {
  if (stryMutAct_9fa48("2137")) {
    {}
  } else {
    stryCov_9fa48("2137");
    const sc = normalizeCultureText(stateCode);
    if (stryMutAct_9fa48("2140") ? false : stryMutAct_9fa48("2139") ? true : stryMutAct_9fa48("2138") ? sc : (stryCov_9fa48("2138", "2139", "2140"), !sc)) return stryMutAct_9fa48("2141") ? true : (stryCov_9fa48("2141"), false);
    if (stryMutAct_9fa48("2144") ? normalizeCultureText(event.state) !== sc : stryMutAct_9fa48("2143") ? false : stryMutAct_9fa48("2142") ? true : (stryCov_9fa48("2142", "2143", "2144"), normalizeCultureText(event.state) === sc)) return stryMutAct_9fa48("2145") ? false : (stryCov_9fa48("2145"), true);
    const mapped = event.city ? getStateForCity(event.city) : undefined;
    return stryMutAct_9fa48("2148") ? normalizeCultureText(mapped) !== sc : stryMutAct_9fa48("2147") ? false : stryMutAct_9fa48("2146") ? true : (stryCov_9fa48("2146", "2147", "2148"), normalizeCultureText(mapped) === sc);
  }
}

/**
 * Higher score = show first. Prioritises viewer’s country, then state/region, then stable country order.
 */
export function cultureDestinationPriorityScore(event: EventData, viewerCountry: string, viewerStateCode: string | undefined, options?: {
  originCountryHint?: string;
  originKeywords?: string[];
}): number {
  if (stryMutAct_9fa48("2149")) {
    {}
  } else {
    stryCov_9fa48("2149");
    const vc = normalizeCultureText(viewerCountry);
    const ec = normalizeCultureText(event.country);
    let score = 0;
    if (stryMutAct_9fa48("2152") ? ec && vc || ec === vc : stryMutAct_9fa48("2151") ? false : stryMutAct_9fa48("2150") ? true : (stryCov_9fa48("2150", "2151", "2152"), (stryMutAct_9fa48("2154") ? ec || vc : stryMutAct_9fa48("2153") ? true : (stryCov_9fa48("2153", "2154"), ec && vc)) && (stryMutAct_9fa48("2156") ? ec !== vc : stryMutAct_9fa48("2155") ? true : (stryCov_9fa48("2155", "2156"), ec === vc)))) stryMutAct_9fa48("2157") ? score -= 1_000_000 : (stryCov_9fa48("2157"), score += 1_000_000);
    if (stryMutAct_9fa48("2160") ? viewerStateCode || eventMatchesViewerRegion(event, viewerStateCode) : stryMutAct_9fa48("2159") ? false : stryMutAct_9fa48("2158") ? true : (stryCov_9fa48("2158", "2159", "2160"), viewerStateCode && eventMatchesViewerRegion(event, viewerStateCode))) {
      if (stryMutAct_9fa48("2161")) {
        {}
      } else {
        stryCov_9fa48("2161");
        stryMutAct_9fa48("2162") ? score -= 500_000 : (stryCov_9fa48("2162"), score += 500_000);
      }
    }
    const hint = (stryMutAct_9fa48("2163") ? options.originCountryHint : (stryCov_9fa48("2163"), options?.originCountryHint)) ? normalizeCultureText(options.originCountryHint) : stryMutAct_9fa48("2164") ? "Stryker was here!" : (stryCov_9fa48("2164"), '');
    if (stryMutAct_9fa48("2167") ? hint && ec === hint || options?.originKeywords?.length : stryMutAct_9fa48("2166") ? false : stryMutAct_9fa48("2165") ? true : (stryCov_9fa48("2165", "2166", "2167"), (stryMutAct_9fa48("2169") ? hint || ec === hint : stryMutAct_9fa48("2168") ? true : (stryCov_9fa48("2168", "2169"), hint && (stryMutAct_9fa48("2171") ? ec !== hint : stryMutAct_9fa48("2170") ? true : (stryCov_9fa48("2170", "2171"), ec === hint)))) && (stryMutAct_9fa48("2173") ? options.originKeywords?.length : stryMutAct_9fa48("2172") ? options?.originKeywords.length : (stryCov_9fa48("2172", "2173"), options?.originKeywords?.length)))) {
      if (stryMutAct_9fa48("2174")) {
        {}
      } else {
        stryCov_9fa48("2174");
        const hay = eventCultureHaystack(event);
        if (stryMutAct_9fa48("2177") ? options.originKeywords.every(k => hay.includes(normalizeCultureText(k))) : stryMutAct_9fa48("2176") ? false : stryMutAct_9fa48("2175") ? true : (stryCov_9fa48("2175", "2176", "2177"), options.originKeywords.some(stryMutAct_9fa48("2178") ? () => undefined : (stryCov_9fa48("2178"), k => hay.includes(normalizeCultureText(k)))))) {
          if (stryMutAct_9fa48("2179")) {
            {}
          } else {
            stryCov_9fa48("2179");
            stryMutAct_9fa48("2180") ? score -= 250_000 : (stryCov_9fa48("2180"), score += 250_000);
          }
        }
      }
    }
    const order = CULTURE_HUB_DEFAULT_COUNTRIES as unknown as string[];
    const idx = order.findIndex(stryMutAct_9fa48("2181") ? () => undefined : (stryCov_9fa48("2181"), c => stryMutAct_9fa48("2184") ? normalizeCultureText(c) !== ec : stryMutAct_9fa48("2183") ? false : stryMutAct_9fa48("2182") ? true : (stryCov_9fa48("2182", "2183", "2184"), normalizeCultureText(c) === ec)));
    stryMutAct_9fa48("2185") ? score -= Math.max(0, 50 - (idx >= 0 ? idx : 50)) : (stryCov_9fa48("2185"), score += stryMutAct_9fa48("2186") ? Math.min(0, 50 - (idx >= 0 ? idx : 50)) : (stryCov_9fa48("2186"), Math.max(0, stryMutAct_9fa48("2187") ? 50 + (idx >= 0 ? idx : 50) : (stryCov_9fa48("2187"), 50 - ((stryMutAct_9fa48("2191") ? idx < 0 : stryMutAct_9fa48("2190") ? idx > 0 : stryMutAct_9fa48("2189") ? false : stryMutAct_9fa48("2188") ? true : (stryCov_9fa48("2188", "2189", "2190", "2191"), idx >= 0)) ? idx : 50)))));
    return score;
  }
}
export function sortEventsForCultureDestination(events: EventData[], viewerCountry: string, viewerStateCode: string | undefined, options?: {
  originCountryHint?: string;
  originKeywords?: string[];
}): EventData[] {
  if (stryMutAct_9fa48("2192")) {
    {}
  } else {
    stryCov_9fa48("2192");
    return stryMutAct_9fa48("2193") ? [...events] : (stryCov_9fa48("2193"), (stryMutAct_9fa48("2194") ? [] : (stryCov_9fa48("2194"), [...events])).sort((a, b) => {
      if (stryMutAct_9fa48("2195")) {
        {}
      } else {
        stryCov_9fa48("2195");
        const sb = stryMutAct_9fa48("2196") ? cultureDestinationPriorityScore(b, viewerCountry, viewerStateCode, options) + cultureDestinationPriorityScore(a, viewerCountry, viewerStateCode, options) : (stryCov_9fa48("2196"), cultureDestinationPriorityScore(b, viewerCountry, viewerStateCode, options) - cultureDestinationPriorityScore(a, viewerCountry, viewerStateCode, options));
        if (stryMutAct_9fa48("2199") ? sb === 0 : stryMutAct_9fa48("2198") ? false : stryMutAct_9fa48("2197") ? true : (stryCov_9fa48("2197", "2198", "2199"), sb !== 0)) return sb;
        return (stryMutAct_9fa48("2200") ? a.date && '' : (stryCov_9fa48("2200"), a.date ?? (stryMutAct_9fa48("2201") ? "Stryker was here!" : (stryCov_9fa48("2201"), '')))).localeCompare(stryMutAct_9fa48("2202") ? b.date && '' : (stryCov_9fa48("2202"), b.date ?? (stryMutAct_9fa48("2203") ? "Stryker was here!" : (stryCov_9fa48("2203"), ''))));
      }
    }));
  }
}
export function uniqueCountriesForHub(viewerCountry: string): string[] {
  if (stryMutAct_9fa48("2204")) {
    {}
  } else {
    stryCov_9fa48("2204");
    const set = new Set<string>();
    set.add(viewerCountry);
    for (const c of CULTURE_HUB_DEFAULT_COUNTRIES) set.add(c);
    return Array.from(set);
  }
}

/** Preset radii for culture hub “Near me” (dating-style distance steps). */
export const CULTURE_HUB_NEAR_RADIUS_PRESETS = [5, 15, 25, 50, 100] as const;
export type CultureHubNearRadiusKm = (typeof CULTURE_HUB_NEAR_RADIUS_PRESETS)[number];

/** Default radius when opening Near me. */
export const CULTURE_HUB_NEAR_RADIUS_KM: CultureHubNearRadiusKm = 25;

/** Snap an arbitrary km value to the nearest preset (for URL `radius=`). */
export function clampCultureHubNearRadiusKm(n: number): CultureHubNearRadiusKm {
  if (stryMutAct_9fa48("2205")) {
    {}
  } else {
    stryCov_9fa48("2205");
    let best: CultureHubNearRadiusKm = CULTURE_HUB_NEAR_RADIUS_PRESETS[0];
    let bestDist = Math.abs(stryMutAct_9fa48("2206") ? n + best : (stryCov_9fa48("2206"), n - best));
    for (const p of CULTURE_HUB_NEAR_RADIUS_PRESETS) {
      if (stryMutAct_9fa48("2207")) {
        {}
      } else {
        stryCov_9fa48("2207");
        const d = Math.abs(stryMutAct_9fa48("2208") ? n + p : (stryCov_9fa48("2208"), n - p));
        if (stryMutAct_9fa48("2212") ? d >= bestDist : stryMutAct_9fa48("2211") ? d <= bestDist : stryMutAct_9fa48("2210") ? false : stryMutAct_9fa48("2209") ? true : (stryCov_9fa48("2209", "2210", "2211", "2212"), d < bestDist)) {
          if (stryMutAct_9fa48("2213")) {
            {}
          } else {
            stryCov_9fa48("2213");
            best = p;
            bestDist = d;
          }
        }
      }
    }
    return best;
  }
}

/** How far we scan for diaspora-style hubs vs one-country listings vs device radius. */
export type CultureHubScope = 'singleCountry' | 'diaspora' | 'nearYou';
export function countriesForCultureHubQueries(focusCountry: string, scope: CultureHubScope): string[] {
  if (stryMutAct_9fa48("2214")) {
    {}
  } else {
    stryCov_9fa48("2214");
    if (stryMutAct_9fa48("2217") ? scope !== 'nearYou' : stryMutAct_9fa48("2216") ? false : stryMutAct_9fa48("2215") ? true : (stryCov_9fa48("2215", "2216", "2217"), scope === (stryMutAct_9fa48("2218") ? "" : (stryCov_9fa48("2218"), 'nearYou')))) {
      if (stryMutAct_9fa48("2219")) {
        {}
      } else {
        stryCov_9fa48("2219");
        return stryMutAct_9fa48("2220") ? ["Stryker was here"] : (stryCov_9fa48("2220"), []);
      }
    }
    if (stryMutAct_9fa48("2223") ? scope !== 'singleCountry' : stryMutAct_9fa48("2222") ? false : stryMutAct_9fa48("2221") ? true : (stryCov_9fa48("2221", "2222", "2223"), scope === (stryMutAct_9fa48("2224") ? "" : (stryCov_9fa48("2224"), 'singleCountry')))) {
      if (stryMutAct_9fa48("2225")) {
        {}
      } else {
        stryCov_9fa48("2225");
        return stryMutAct_9fa48("2226") ? [] : (stryCov_9fa48("2226"), [focusCountry]);
      }
    }
    return uniqueCountriesForHub(focusCountry);
  }
}

/** Countries to query for venue cards when scope is “near you” (events use GPS). */
export function venueCountriesForCultureHub(focusCountry: string, scope: CultureHubScope): string[] {
  if (stryMutAct_9fa48("2227")) {
    {}
  } else {
    stryCov_9fa48("2227");
    if (stryMutAct_9fa48("2230") ? scope !== 'nearYou' : stryMutAct_9fa48("2229") ? false : stryMutAct_9fa48("2228") ? true : (stryCov_9fa48("2228", "2229", "2230"), scope === (stryMutAct_9fa48("2231") ? "" : (stryCov_9fa48("2231"), 'nearYou')))) {
      if (stryMutAct_9fa48("2232")) {
        {}
      } else {
        stryCov_9fa48("2232");
        return (stryMutAct_9fa48("2233") ? focusCountry : (stryCov_9fa48("2233"), focusCountry.trim())) ? stryMutAct_9fa48("2234") ? [] : (stryCov_9fa48("2234"), [focusCountry]) : stryMutAct_9fa48("2235") ? [] : (stryCov_9fa48("2235"), [stryMutAct_9fa48("2236") ? "" : (stryCov_9fa48("2236"), 'Australia')]);
      }
    }
    return countriesForCultureHubQueries(focusCountry, scope);
  }
}
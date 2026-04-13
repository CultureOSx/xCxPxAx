/**
 * Marketplace countries and region/city hierarchy for CulturePass
 * (AU, NZ, UAE, UK, CA, US, SG). AU state/city lists prefer the live API via useLocations;
 * other countries use static data from constants/locations.
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
import { GLOBAL_REGIONS, CITIES_BY_STATE, getStateForCity, type StateCode } from '@/constants/locations';
import type { AustralianState } from '@/lib/api';
const COUNTRY_FLAGS: Record<string, string> = stryMutAct_9fa48("3754") ? {} : (stryCov_9fa48("3754"), {
  'United States': stryMutAct_9fa48("3755") ? "" : (stryCov_9fa48("3755"), '🇺🇸'),
  USA: stryMutAct_9fa48("3756") ? "" : (stryCov_9fa48("3756"), '🇺🇸'),
  US: stryMutAct_9fa48("3757") ? "" : (stryCov_9fa48("3757"), '🇺🇸'),
  Canada: stryMutAct_9fa48("3758") ? "" : (stryCov_9fa48("3758"), '🇨🇦'),
  'United Arab Emirates': stryMutAct_9fa48("3759") ? "" : (stryCov_9fa48("3759"), '🇦🇪'),
  UAE: stryMutAct_9fa48("3760") ? "" : (stryCov_9fa48("3760"), '🇦🇪'),
  'United Kingdom': stryMutAct_9fa48("3761") ? "" : (stryCov_9fa48("3761"), '🇬🇧'),
  UK: stryMutAct_9fa48("3762") ? "" : (stryCov_9fa48("3762"), '🇬🇧'),
  Australia: stryMutAct_9fa48("3763") ? "" : (stryCov_9fa48("3763"), '🇦🇺'),
  Singapore: stryMutAct_9fa48("3764") ? "" : (stryCov_9fa48("3764"), '🇸🇬'),
  'New Zealand': stryMutAct_9fa48("3765") ? "" : (stryCov_9fa48("3765"), '🇳🇿'),
  India: stryMutAct_9fa48("3766") ? "" : (stryCov_9fa48("3766"), '🇮🇳'),
  'South Korea': stryMutAct_9fa48("3767") ? "" : (stryCov_9fa48("3767"), '🇰🇷'),
  Korea: stryMutAct_9fa48("3768") ? "" : (stryCov_9fa48("3768"), '🇰🇷'),
  Vietnam: stryMutAct_9fa48("3769") ? "" : (stryCov_9fa48("3769"), '🇻🇳'),
  Philippines: stryMutAct_9fa48("3770") ? "" : (stryCov_9fa48("3770"), '🇵🇭'),
  Mexico: stryMutAct_9fa48("3771") ? "" : (stryCov_9fa48("3771"), '🇲🇽'),
  Nigeria: stryMutAct_9fa48("3772") ? "" : (stryCov_9fa48("3772"), '🇳🇬'),
  Ethiopia: stryMutAct_9fa48("3773") ? "" : (stryCov_9fa48("3773"), '🇪🇹'),
  Somalia: stryMutAct_9fa48("3774") ? "" : (stryCov_9fa48("3774"), '🇸🇴'),
  Iran: stryMutAct_9fa48("3775") ? "" : (stryCov_9fa48("3775"), '🇮🇷'),
  Lebanon: stryMutAct_9fa48("3776") ? "" : (stryCov_9fa48("3776"), '🇱🇧'),
  Ukraine: stryMutAct_9fa48("3777") ? "" : (stryCov_9fa48("3777"), '🇺🇦')
});
export function getCountryFlag(country: string): string {
  if (stryMutAct_9fa48("3778")) {
    {}
  } else {
    stryCov_9fa48("3778");
    return stryMutAct_9fa48("3779") ? COUNTRY_FLAGS[country] && '🌍' : (stryCov_9fa48("3779"), COUNTRY_FLAGS[country] ?? (stryMutAct_9fa48("3780") ? "" : (stryCov_9fa48("3780"), '🌍')));
  }
}

/** Launch-priority order; only countries present in GLOBAL_REGIONS are returned. */
export const MARKETPLACE_COUNTRY_ORDER = ['United States', 'Canada', 'United Arab Emirates', 'United Kingdom', 'Australia', 'Singapore', 'New Zealand'] as const;

/** Row shown in country pickers (modal, onboarding, settings). */
export interface MarketplaceCountryItem {
  name: string;
  flag: string;
  /** Short line under the country name (scope / next step). */
  hint: string;
}
const COUNTRY_ROW_HINTS: Record<string, string> = stryMutAct_9fa48("3781") ? {} : (stryCov_9fa48("3781"), {
  'United States': stryMutAct_9fa48("3782") ? "" : (stryCov_9fa48("3782"), 'Major metros — city next'),
  Canada: stryMutAct_9fa48("3783") ? "" : (stryCov_9fa48("3783"), 'Provinces & cities — city next'),
  'United Arab Emirates': stryMutAct_9fa48("3784") ? "" : (stryCov_9fa48("3784"), 'Emirates — city next'),
  'United Kingdom': stryMutAct_9fa48("3785") ? "" : (stryCov_9fa48("3785"), 'UK hubs — city next'),
  Australia: stryMutAct_9fa48("3786") ? "" : (stryCov_9fa48("3786"), 'States & territories — GPS in AU'),
  Singapore: stryMutAct_9fa48("3787") ? "" : (stryCov_9fa48("3787"), 'City-state — area next'),
  'New Zealand': stryMutAct_9fa48("3788") ? "" : (stryCov_9fa48("3788"), 'Key centres — city next')
});
export function listMarketplaceCountries(): MarketplaceCountryItem[] {
  if (stryMutAct_9fa48("3789")) {
    {}
  } else {
    stryCov_9fa48("3789");
    const present = new Set(GLOBAL_REGIONS.map(stryMutAct_9fa48("3790") ? () => undefined : (stryCov_9fa48("3790"), r => r.country)));
    return stryMutAct_9fa48("3791") ? MARKETPLACE_COUNTRY_ORDER.map(name => ({
      name,
      flag: getCountryFlag(name),
      hint: COUNTRY_ROW_HINTS[name] ?? 'City next'
    })) : (stryCov_9fa48("3791"), MARKETPLACE_COUNTRY_ORDER.filter(stryMutAct_9fa48("3792") ? () => undefined : (stryCov_9fa48("3792"), n => present.has(n))).map(stryMutAct_9fa48("3793") ? () => undefined : (stryCov_9fa48("3793"), name => stryMutAct_9fa48("3794") ? {} : (stryCov_9fa48("3794"), {
      name,
      flag: getCountryFlag(name),
      hint: stryMutAct_9fa48("3795") ? COUNTRY_ROW_HINTS[name] && 'City next' : (stryCov_9fa48("3795"), COUNTRY_ROW_HINTS[name] ?? (stryMutAct_9fa48("3796") ? "" : (stryCov_9fa48("3796"), 'City next')))
    }))));
  }
}

/** Countries for culture-hub scope (marketplace + India for homeland + diaspora origin). */
export function listCultureHubFocusCountries(): MarketplaceCountryItem[] {
  if (stryMutAct_9fa48("3797")) {
    {}
  } else {
    stryCov_9fa48("3797");
    const base = listMarketplaceCountries();
    const india = (stryMutAct_9fa48("3798") ? {} : (stryCov_9fa48("3798"), {
      name: stryMutAct_9fa48("3799") ? "" : (stryCov_9fa48("3799"), 'India'),
      flag: stryMutAct_9fa48("3800") ? "" : (stryCov_9fa48("3800"), '🇮🇳'),
      hint: stryMutAct_9fa48("3801") ? "" : (stryCov_9fa48("3801"), 'Events across India')
    })) satisfies MarketplaceCountryItem;
    if (stryMutAct_9fa48("3804") ? base.every(b => b.name === 'India') : stryMutAct_9fa48("3803") ? false : stryMutAct_9fa48("3802") ? true : (stryCov_9fa48("3802", "3803", "3804"), base.some(stryMutAct_9fa48("3805") ? () => undefined : (stryCov_9fa48("3805"), b => stryMutAct_9fa48("3808") ? b.name !== 'India' : stryMutAct_9fa48("3807") ? false : stryMutAct_9fa48("3806") ? true : (stryCov_9fa48("3806", "3807", "3808"), b.name === (stryMutAct_9fa48("3809") ? "" : (stryCov_9fa48("3809"), 'India'))))))) return base;
    const auIdx = base.findIndex(stryMutAct_9fa48("3810") ? () => undefined : (stryCov_9fa48("3810"), b => stryMutAct_9fa48("3813") ? b.name !== 'Australia' : stryMutAct_9fa48("3812") ? false : stryMutAct_9fa48("3811") ? true : (stryCov_9fa48("3811", "3812", "3813"), b.name === (stryMutAct_9fa48("3814") ? "" : (stryCov_9fa48("3814"), 'Australia')))));
    if (stryMutAct_9fa48("3818") ? auIdx < 0 : stryMutAct_9fa48("3817") ? auIdx > 0 : stryMutAct_9fa48("3816") ? false : stryMutAct_9fa48("3815") ? true : (stryCov_9fa48("3815", "3816", "3817", "3818"), auIdx >= 0)) {
      if (stryMutAct_9fa48("3819")) {
        {}
      } else {
        stryCov_9fa48("3819");
        return stryMutAct_9fa48("3820") ? [] : (stryCov_9fa48("3820"), [...(stryMutAct_9fa48("3821") ? base : (stryCov_9fa48("3821"), base.slice(0, stryMutAct_9fa48("3822") ? auIdx - 1 : (stryCov_9fa48("3822"), auIdx + 1)))), india, ...(stryMutAct_9fa48("3823") ? base : (stryCov_9fa48("3823"), base.slice(stryMutAct_9fa48("3824") ? auIdx - 1 : (stryCov_9fa48("3824"), auIdx + 1))))]);
      }
    }
    return stryMutAct_9fa48("3825") ? [] : (stryCov_9fa48("3825"), [india, ...base]);
  }
}
export type MarketplacePickerRegion = {
  code: string;
  name: string;
  emoji: string;
  cities: string[];
};
export function getRegionsForCountry(countryName: string, auStates: AustralianState[]): MarketplacePickerRegion[] {
  if (stryMutAct_9fa48("3826")) {
    {}
  } else {
    stryCov_9fa48("3826");
    if (stryMutAct_9fa48("3829") ? countryName !== 'Australia' : stryMutAct_9fa48("3828") ? false : stryMutAct_9fa48("3827") ? true : (stryCov_9fa48("3827", "3828", "3829"), countryName === (stryMutAct_9fa48("3830") ? "" : (stryCov_9fa48("3830"), 'Australia')))) {
      if (stryMutAct_9fa48("3831")) {
        {}
      } else {
        stryCov_9fa48("3831");
        return auStates.map(stryMutAct_9fa48("3832") ? () => undefined : (stryCov_9fa48("3832"), s => stryMutAct_9fa48("3833") ? {} : (stryCov_9fa48("3833"), {
          code: s.code,
          name: s.name,
          emoji: s.emoji,
          cities: s.cities
        })));
      }
    }
    if (stryMutAct_9fa48("3836") ? countryName !== 'India' : stryMutAct_9fa48("3835") ? false : stryMutAct_9fa48("3834") ? true : (stryCov_9fa48("3834", "3835", "3836"), countryName === (stryMutAct_9fa48("3837") ? "" : (stryCov_9fa48("3837"), 'India')))) {
      if (stryMutAct_9fa48("3838")) {
        {}
      } else {
        stryCov_9fa48("3838");
        return stryMutAct_9fa48("3839") ? ["Stryker was here"] : (stryCov_9fa48("3839"), []);
      }
    }
    return stryMutAct_9fa48("3840") ? GLOBAL_REGIONS.map(r => ({
      code: r.value,
      name: r.label,
      emoji: r.emoji,
      cities: [...(CITIES_BY_STATE[r.value as StateCode] ?? [])]
    })) : (stryCov_9fa48("3840"), GLOBAL_REGIONS.filter(stryMutAct_9fa48("3841") ? () => undefined : (stryCov_9fa48("3841"), r => stryMutAct_9fa48("3844") ? r.country !== countryName : stryMutAct_9fa48("3843") ? false : stryMutAct_9fa48("3842") ? true : (stryCov_9fa48("3842", "3843", "3844"), r.country === countryName))).map(stryMutAct_9fa48("3845") ? () => undefined : (stryCov_9fa48("3845"), r => stryMutAct_9fa48("3846") ? {} : (stryCov_9fa48("3846"), {
      code: r.value,
      name: r.label,
      emoji: r.emoji,
      cities: stryMutAct_9fa48("3847") ? [] : (stryCov_9fa48("3847"), [...(stryMutAct_9fa48("3848") ? CITIES_BY_STATE[r.value as StateCode] && [] : (stryCov_9fa48("3848"), CITIES_BY_STATE[r.value as StateCode] ?? (stryMutAct_9fa48("3849") ? ["Stryker was here"] : (stryCov_9fa48("3849"), []))))])
    }))));
  }
}

/** Resolve country display name from a known city (static + AU curated lists). */
export function getCountryForCity(city: string): string | undefined {
  if (stryMutAct_9fa48("3850")) {
    {}
  } else {
    stryCov_9fa48("3850");
    const code = getStateForCity(city);
    if (stryMutAct_9fa48("3853") ? false : stryMutAct_9fa48("3852") ? true : stryMutAct_9fa48("3851") ? code : (stryCov_9fa48("3851", "3852", "3853"), !code)) return undefined;
    const row = GLOBAL_REGIONS.find(stryMutAct_9fa48("3854") ? () => undefined : (stryCov_9fa48("3854"), x => stryMutAct_9fa48("3857") ? x.value !== code : stryMutAct_9fa48("3856") ? false : stryMutAct_9fa48("3855") ? true : (stryCov_9fa48("3855", "3856", "3857"), x.value === code)));
    return stryMutAct_9fa48("3858") ? row.country : (stryCov_9fa48("3858"), row?.country);
  }
}
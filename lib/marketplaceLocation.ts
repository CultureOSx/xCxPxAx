/**
 * Marketplace countries and region/city hierarchy for CulturePass
 * (AU, NZ, UAE, UK, CA, US, SG). AU state/city lists prefer the live API via useLocations;
 * other countries use static data from constants/locations.
 */

import { GLOBAL_REGIONS, CITIES_BY_STATE, getStateForCity, type StateCode } from '@/constants/locations';
import type { AustralianState } from '@/lib/api';

const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  USA: '🇺🇸',
  US: '🇺🇸',
  Canada: '🇨🇦',
  'United Arab Emirates': '🇦🇪',
  UAE: '🇦🇪',
  'United Kingdom': '🇬🇧',
  UK: '🇬🇧',
  Australia: '🇦🇺',
  Singapore: '🇸🇬',
  'New Zealand': '🇳🇿',
  India: '🇮🇳',
  'South Korea': '🇰🇷',
  Korea: '🇰🇷',
  Vietnam: '🇻🇳',
  Philippines: '🇵🇭',
  Mexico: '🇲🇽',
  Nigeria: '🇳🇬',
  Ethiopia: '🇪🇹',
  Somalia: '🇸🇴',
  Iran: '🇮🇷',
  Lebanon: '🇱🇧',
  Ukraine: '🇺🇦',
};

export function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? '🌍';
}

/** Launch-priority order; only countries present in GLOBAL_REGIONS are returned. */
export const MARKETPLACE_COUNTRY_ORDER = [
  'United States',
  'Canada',
  'United Arab Emirates',
  'United Kingdom',
  'Australia',
  'Singapore',
  'New Zealand',
] as const;

/** Row shown in country pickers (modal, onboarding, settings). */
export interface MarketplaceCountryItem {
  name: string;
  flag: string;
  /** Short line under the country name (scope / next step). */
  hint: string;
}

const COUNTRY_ROW_HINTS: Record<string, string> = {
  'United States': 'Major metros — city next',
  Canada: 'Provinces & cities — city next',
  'United Arab Emirates': 'Emirates — city next',
  'United Kingdom': 'UK hubs — city next',
  Australia: 'States & territories — GPS in AU',
  Singapore: 'City-state — area next',
  'New Zealand': 'Key centres — city next',
};

export function listMarketplaceCountries(): MarketplaceCountryItem[] {
  const present = new Set(GLOBAL_REGIONS.map((r) => r.country));
  return MARKETPLACE_COUNTRY_ORDER.filter((n) => present.has(n)).map((name) => ({
    name,
    flag: getCountryFlag(name),
    hint: COUNTRY_ROW_HINTS[name] ?? 'City next',
  }));
}

/** Countries for culture-hub scope (marketplace + India for homeland + diaspora origin). */
export function listCultureHubFocusCountries(): MarketplaceCountryItem[] {
  const base = listMarketplaceCountries();
  const india = { name: 'India', flag: '🇮🇳', hint: 'Events across India' } satisfies MarketplaceCountryItem;
  if (base.some((b) => b.name === 'India')) return base;
  const auIdx = base.findIndex((b) => b.name === 'Australia');
  if (auIdx >= 0) {
    return [...base.slice(0, auIdx + 1), india, ...base.slice(auIdx + 1)];
  }
  return [india, ...base];
}

export type MarketplacePickerRegion = {
  code: string;
  name: string;
  emoji: string;
  cities: string[];
};

export function getRegionsForCountry(
  countryName: string,
  auStates: AustralianState[],
): MarketplacePickerRegion[] {
  if (countryName === 'Australia') {
    return auStates.map((s) => ({
      code: s.code,
      name: s.name,
      emoji: s.emoji,
      cities: s.cities,
    }));
  }
  if (countryName === 'India') {
    return [];
  }
  return GLOBAL_REGIONS.filter((r) => r.country === countryName).map((r) => ({
    code: r.value,
    name: r.label,
    emoji: r.emoji,
    cities: [...(CITIES_BY_STATE[r.value as StateCode] ?? [])],
  }));
}

/** Resolve country display name from a known city (static + AU curated lists). */
export function getCountryForCity(city: string): string | undefined {
  const code = getStateForCity(city);
  if (!code) return undefined;
  const row = GLOBAL_REGIONS.find((x) => x.value === code);
  return row?.country;
}

import type { CultureHubNearRadiusKm, CultureHubScope } from '@/lib/cultureDestinationScope';
import { clampCultureHubNearRadiusKm } from '@/lib/cultureDestinationScope';

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = typeof s === 'string' ? decodeURIComponent(s).trim() : '';
  return t || undefined;
}

export function mapScopeString(raw: string | undefined): CultureHubScope | undefined {
  if (!raw) return undefined;
  const x = raw.toLowerCase().trim();
  if (['single', 'country', 'local', 'singlecountry'].includes(x)) return 'singleCountry';
  if (['diaspora', 'world', 'worldwide', 'global', 'hub'].includes(x)) return 'diaspora';
  if (['near', 'nearyou', 'nearme', 'nearby', 'localradius', 'gps'].includes(x)) return 'nearYou';
  return undefined;
}

/**
 * Stable key for effects when only culture-hub query keys matter.
 * `state` segment: undefined key → `\x00`; key with no value → empty string marker.
 */
export function cultureHubRouteKey(raw?: Record<string, string | string[] | undefined>): string {
  if (!raw) return '';
  const c = raw.country !== undefined ? (firstParam(raw.country) ?? '') : '\x00';
  const s = raw.scope !== undefined ? (firstParam(raw.scope) ?? '') : '\x00';
  let st: string;
  if (raw.state === undefined) st = '\x00';
  else st = firstParam(raw.state) ?? '';
  const r = raw.radius !== undefined ? (firstParam(raw.radius) ?? '') : '\x00';
  return `${c}\n${s}\n${st}\n${r}`;
}

/**
 * Apply when any of `country`, `scope`, or `state` appear in the URL (Expo / web).
 */
export function cultureHubHasUrlOverrides(raw?: Record<string, string | string[] | undefined>): boolean {
  if (!raw) return false;
  return (
    raw.country !== undefined ||
    raw.scope !== undefined ||
    raw.state !== undefined ||
    raw.radius !== undefined
  );
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
  const out: CultureHubUrlApply = { applyState: false };
  if (!raw) return out;

  if (raw.country !== undefined) {
    const v = firstParam(raw.country);
    if (v) out.country = v;
  }

  if (raw.scope !== undefined) {
    const v = firstParam(raw.scope);
    const mapped = mapScopeString(v ?? '');
    if (mapped) out.scope = mapped;
  }

  if (raw.state !== undefined) {
    out.applyState = true;
    const v = firstParam(raw.state);
    if (!v || v === '*' || v.toLowerCase() === 'all') {
      out.stateCode = undefined;
    } else {
      out.stateCode = v.length <= 4 ? v.toUpperCase() : v;
    }
  }

  if (raw.radius !== undefined) {
    const v = firstParam(raw.radius);
    if (v) {
      const parsed = Number.parseInt(v, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        out.nearRadiusKm = clampCultureHubNearRadiusKm(parsed);
      }
    }
  }

  return out;
}

/** Returns `?country=…&scope=…&state=…` (leading ?) or empty string if nothing to add. */
export function appendCultureHubQuerySuffix(params: {
  country: string;
  scope: CultureHubScope;
  stateCode?: string;
  /** Included when scope is Near me so shared links preserve search distance. */
  nearRadiusKm?: number;
}): string {
  const q = new URLSearchParams();
  if (params.country.trim()) q.set('country', params.country.trim());
  const scopeQ =
    params.scope === 'singleCountry' ? 'single' : params.scope === 'nearYou' ? 'near' : 'diaspora';
  q.set('scope', scopeQ);
  if (params.stateCode?.trim()) q.set('state', params.stateCode.trim());
  if (params.scope === 'nearYou' && params.nearRadiusKm != null) {
    q.set('radius', String(params.nearRadiusKm));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function buildCultureHubShareUrl(
  origin: string,
  publicPath: string,
  params: { country: string; scope: CultureHubScope; stateCode?: string; nearRadiusKm?: number },
): string {
  const path = publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
  const cleanOrigin = origin.replace(/\/$/, '');
  return `${cleanOrigin}${path}${appendCultureHubQuerySuffix(params)}`;
}

/** Link from hub index / menus with optional onboarding defaults. */
export function cultureHubIndexLinkPath(
  publicPath: string,
  prefs: { country?: string; stateCode?: string; scope?: CultureHubScope; nearRadiusKm?: number },
): string {
  const path = publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
  return `${path}${appendCultureHubQuerySuffix({
    country: prefs.country?.trim() || 'Australia',
    scope: prefs.scope ?? 'singleCountry',
    stateCode: prefs.stateCode,
    nearRadiusKm: prefs.nearRadiusKm,
  })}`;
}

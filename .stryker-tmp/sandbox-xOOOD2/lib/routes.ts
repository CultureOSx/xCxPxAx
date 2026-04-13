// @ts-nocheck
export const LEGACY_ROUTE_REMAPS = [
  ['/events/', '/event/'],
  ['/artists/', '/artist/'],
  ['/communities/', '/community/'],
  ['/profiles/', '/profile/'],
  ['/tickets/', '/tickets/'],
  ['/users/', '/user/'],
  ['/businesses/', '/business/'],
] as const;

type RedirectValue = string | string[] | null | undefined;

export function remapLegacyPath(path: string): string {
  if (!path) return '/';

  const [rawPath, rawQuery] = path.split('?');
  const cleanPath = rawPath || '/';
  const querySuffix = rawQuery ? `?${rawQuery}` : '';

  for (const [from, to] of LEGACY_ROUTE_REMAPS) {
    if (cleanPath.startsWith(from)) {
      return `${cleanPath.replace(from, to)}${querySuffix}`;
    }
  }

  return `${cleanPath}${querySuffix}`;
}

export function normalizeSystemPath(path: string, initial = false): string {
  if (!path) return '/';

  const remapped = remapLegacyPath(path);
  const [rawPath, rawQuery] = remapped.split('?');
  const cleanPath = rawPath || '/';
  const querySuffix = rawQuery ? `?${rawQuery}` : '';

  if (initial && cleanPath === '/home') {
    return `/(tabs)${querySuffix}`;
  }

  return `${cleanPath}${querySuffix}`;
}

export function sanitizeInternalRedirect(value: RedirectValue): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return null;
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('://')) {
    return null;
  }

  const normalized = remapLegacyPath(candidate);
  const cleanPath = normalized.split('?')[0] || '/';

  // Redirects should always leave the auth/onboarding shell.
  if (cleanPath.startsWith('/(onboarding)') || cleanPath === '/landing') {
    return null;
  }

  return normalized;
}

export function routeWithRedirect(pathname: string, redirectTo: RedirectValue) {
  const safeRedirect = sanitizeInternalRedirect(redirectTo);
  if (!safeRedirect) return pathname;
  return { pathname, params: { redirectTo: safeRedirect } };
}

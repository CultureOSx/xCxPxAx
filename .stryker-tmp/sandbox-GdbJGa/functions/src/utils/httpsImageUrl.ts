/**
 * HTTPS-only image URL rules for ATS-safe clients + SSRF-safe server fetches.
 */
// @ts-nocheck


import { z } from 'zod';

export const MAX_IMAGE_URL_LENGTH = 2048;

function ipv4ToUint(ip: string): number {
  const p = ip.split('.').map((x) => Number(x));
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return 0xffffffff;
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

function isBlockedIpv4Literal(ip: string): boolean {
  const n = ipv4ToUint(ip);
  if (n === 0xffffffff) return true;
  const a = n >>> 24;
  const b = (n >>> 16) & 0xff;
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 192 && b === 0 && (n & 0xff) === 0) return true;
  if (a >= 224) return true;
  return false;
}

/**
 * Hostnames and resolved literals that must never be fetched (SSRF) or stored as loadable image pointers.
 */
export function isPrivateOrBlockedHostname(hostname: string): boolean {
  const h = hostname.trim().replace(/^\[|\]$/g, '').toLowerCase();
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === 'metadata.google.internal' || h.endsWith('.internal')) return true;
  if (h.includes(':')) {
    if (h === '::1') return true;
    if (h.startsWith('fe80:') || h.startsWith('fec0:') || h.startsWith('fd')) return true;
    if (h.startsWith('fc')) return true;
    if (h.startsWith('ff')) return true;
    const v4mapped = h.replace(/^::ffff:/i, '');
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v4mapped)) return isBlockedIpv4Literal(v4mapped);
    return false;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return isBlockedIpv4Literal(h);
  return false;
}

export function isAllowedHttpsImageUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  if (url.length > MAX_IMAGE_URL_LENGTH) return false;
  if (isPrivateOrBlockedHostname(u.hostname)) return false;
  return true;
}

/**
 * For API responses: drop http / private / malformed so legacy Firestore rows do not break iOS ATS.
 */
export function sanitizeStoredImagePointer(url: string | null | undefined): string | undefined {
  if (url == null || typeof url !== 'string') return undefined;
  const t = url.trim();
  if (!t) return undefined;
  if (isAllowedHttpsImageUrl(t)) return t;
  if (t.startsWith('http://')) {
    const upgraded = `https://${t.slice(7)}`;
    if (isAllowedHttpsImageUrl(upgraded)) return upgraded;
  }
  return undefined;
}

/** Importer: keep only pointers clients can load; try safe http→https upgrade. */
export function sanitizeImportImageUrl(url: string | null | undefined): string | undefined {
  return sanitizeStoredImagePointer(url ?? undefined);
}

export function emptyToUndefined(v: unknown): unknown {
  return v === '' || v === null || v === undefined ? undefined : v;
}

/** Optional event/profile-style image field (empty → undefined). */
export const zOptionalHttpsImageUrl = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .url()
    .max(MAX_IMAGE_URL_LENGTH)
    .refine(isAllowedHttpsImageUrl, { message: 'Image URL must be a public https:// URL' })
    .optional(),
) as z.ZodType<string | undefined>;

/** Required hero / playlist style. */
export const zHttpsImageUrlRequired = z
  .string()
  .url()
  .max(MAX_IMAGE_URL_LENGTH)
  .refine(isAllowedHttpsImageUrl, { message: 'Image URL must be a public https:// URL' });

/** Social posts: optional, explicit null, or https image URL. */
export const zOptionalNullableHttpsImageUrl = z.preprocess(
  (v) => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    if (v === '') return undefined;
    return v;
  },
  z
    .union([
      z.null(),
      z
        .string()
        .url()
        .max(MAX_IMAGE_URL_LENGTH)
        .refine(isAllowedHttpsImageUrl, { message: 'Image URL must be a public https:// URL' }),
    ])
    .optional(),
) as z.ZodType<string | null | undefined>;

const ingestUrlInner = z
  .string()
  .url()
  .max(MAX_IMAGE_URL_LENGTH)
  .refine(
    (s) => {
      try {
        const u = new URL(s.trim());
        return u.protocol === 'https:' && !isPrivateOrBlockedHostname(u.hostname);
      } catch {
        return false;
      }
    },
    { message: 'url must be https and must not target private or internal hosts' },
  );

export const zIngestImageUrlBody = z.object({
  url: ingestUrlInner,
});

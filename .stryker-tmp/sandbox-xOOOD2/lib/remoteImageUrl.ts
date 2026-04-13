// @ts-nocheck
import { Platform } from 'react-native';

/**
 * Avoid passing plain http:// URIs to native image loaders (iOS ATS blocks them).
 * Prefer https, Firebase token URLs, or same-origin assets.
 */
export function sanitizeRemoteImageUri(uri: string | null | undefined): string | undefined {
  if (uri == null || typeof uri !== 'string') return undefined;
  const t = uri.trim();
  if (!t) return undefined;
  if (t.startsWith('https://')) return t;
  if (t.startsWith('file://') || t.startsWith('content://') || t.startsWith('asset://') || t.startsWith('ph://')) {
    return t;
  }
  if (t.startsWith('http://')) {
    if (Platform.OS === 'web') return t;
    return undefined;
  }
  return t;
}

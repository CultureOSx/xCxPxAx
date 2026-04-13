// @ts-nocheck
import { api } from '@/lib/api';

/** Persist country + city to the signed-in user profile (best-effort). */
export async function syncUserMarketplaceLocation(
  userId: string | null | undefined,
  country: string,
  city: string,
): Promise<void> {
  if (!userId || !country.trim() || !city.trim()) return;
  try {
    await api.users.update(userId, { country: country.trim(), city: city.trim() });
  } catch (e) {
    if (__DEV__) {
      console.warn('[syncUserMarketplaceLocation] failed', e);
    }
  }
}

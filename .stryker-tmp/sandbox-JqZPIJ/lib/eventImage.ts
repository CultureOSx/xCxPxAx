// @ts-nocheck
import type { EventData } from '@/shared/schema';

/**
 * Card/list hero: prefer `imageUrl`, fall back to `heroImageUrl` (wizard / legacy docs).
 * Server GET /api/events also coalesces these; this keeps older cached payloads and embeds working.
 */
export function eventListImageUrl(event: Pick<EventData, 'imageUrl' | 'heroImageUrl'>): string | undefined {
  const primary = event.imageUrl?.trim();
  if (primary) return primary;
  const hero = event.heroImageUrl?.trim();
  if (hero) return hero;
  return undefined;
}

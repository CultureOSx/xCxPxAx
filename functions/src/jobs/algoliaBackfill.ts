/**
 * Algolia Backfill Job
 *
 * Indexes all existing published events and profiles from Firestore into Algolia.
 * Safe to re-run: checks algoliaIndexedAt timestamp to skip already-indexed docs
 * unless force=true is passed.
 *
 * Exposed as POST /api/admin/algolia-backfill (admin-only).
 */

import { db } from '../admin';
import { algoliaEventsIndex, algoliaProfilesIndex, searchClient } from '../services/algolia';
import type { FirestoreEvent } from '../services/firestore';

export interface BackfillResult {
  events: { indexed: number; skipped: number; failed: number };
  profiles: { indexed: number; skipped: number; failed: number };
  durationMs: number;
}

/**
 * Backfill all published events.
 * @param force — re-index even if algoliaIndexedAt is already set
 */
async function backfillEvents(force: boolean): Promise<BackfillResult['events']> {
  const snap = await db
    .collection('events')
    .where('status', '==', 'published')
    .get();

  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  // Process in batches of 50 to stay within Cloud Functions memory
  const BATCH = 50;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);

    await Promise.allSettled(batch.map(async (doc) => {
      const data = doc.data() as FirestoreEvent & { algoliaIndexedAt?: number; deletedAt?: string };

      // Skip soft-deleted events
      if (data.deletedAt) { skipped++; return; }

      // Skip already-indexed unless forced
      if (!force && data.algoliaIndexedAt) { skipped++; return; }

      const result = await algoliaEventsIndex.indexEvent({ ...data, id: doc.id });
      if (result) {
        // Write algoliaIndexedAt back so future runs can skip this doc
        await doc.ref.update({ algoliaIndexedAt: Date.now() });
        indexed++;
      } else {
        failed++;
      }
    }));
  }

  return { indexed, skipped, failed };
}

/**
 * Backfill all published profiles.
 */
async function backfillProfiles(force: boolean): Promise<BackfillResult['profiles']> {
  const snap = await db
    .collection('profiles')
    .where('status', '==', 'published')
    .get();

  let indexed = 0;
  let skipped = 0;
  let failed = 0;

  const BATCH = 50;
  const docs = snap.docs;

  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);

    await Promise.allSettled(batch.map(async (doc) => {
      const data = doc.data() as {
        algoliaIndexedAt?: number;
        name?: string;
        entityType?: string;
        city?: string;
        country?: string;
        isVerified?: boolean;
        imageUrl?: string;
        description?: string;
        cultureTags?: string[];
        lgaCode?: string;
      };

      if (!force && data.algoliaIndexedAt) { skipped++; return; }

      const result = await algoliaProfilesIndex.indexProfile({
        id: doc.id,
        name: data.name ?? '',
        entityType: data.entityType ?? '',
        city: data.city,
        country: data.country,
        isVerified: data.isVerified,
        imageUrl: data.imageUrl,
        description: data.description,
        cultureTags: data.cultureTags,
        lgaCode: data.lgaCode,
      });

      if (result) {
        await doc.ref.update({ algoliaIndexedAt: Date.now() });
        indexed++;
      } else {
        failed++;
      }
    }));
  }

  return { indexed, skipped, failed };
}

export async function runAlgoliaBackfill(force = false): Promise<BackfillResult> {
  if (!searchClient) {
    throw new Error('Algolia credentials not configured. Set ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY.');
  }

  const start = Date.now();

  const results = await Promise.allSettled([
    backfillEvents(force),
    backfillProfiles(force),
  ]);

  const events = results[0].status === 'fulfilled' ? results[0].value : { indexed: 0, skipped: 0, failed: 0 };
  const profiles = results[1].status === 'fulfilled' ? results[1].value : { indexed: 0, skipped: 0, failed: 0 };

  return { events, profiles, durationMs: Date.now() - start };
}

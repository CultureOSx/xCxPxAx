#!/usr/bin/env tsx
/**
 * De-duplicate featuredCities docs in Firestore.
 *
 * Duplicate key: `${slugOrName}::${countryCode}` (case-insensitive)
 *
 * Default mode is DRY RUN:
 *   npx tsx scripts/dedupe-featured-cities.ts
 *
 * Apply changes permanently:
 *   npx tsx scripts/dedupe-featured-cities.ts --apply
 *
 * Optional env:
 *   GOOGLE_CLOUD_PROJECT / FIREBASE_PROJECT_ID
 */

import * as admin from 'firebase-admin';

type FeaturedCityDoc = {
  id: string;
  name?: string;
  slug?: string;
  countryCode?: string;
  countryName?: string;
  countryEmoji?: string;
  stateCode?: string | null;
  imageUrl?: string | null;
  featured?: boolean;
  order?: number;
  lat?: number | null;
  lng?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

const APPLY = process.argv.includes('--apply');
const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ??
  process.env.FIREBASE_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  'culturepass-4f264';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

function safeSlug(value: string | undefined): string {
  const v = (value ?? '').trim().toLowerCase();
  if (!v) return '';
  return v.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function duplicateKey(doc: FeaturedCityDoc): string {
  const slug = safeSlug(doc.slug) || safeSlug(doc.name);
  const country = (doc.countryCode ?? '').trim().toLowerCase();
  return `${slug}::${country}`;
}

function parseIso(value: string | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const n = Date.parse(value);
  return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
}

function sortForCanonical(a: FeaturedCityDoc, b: FeaturedCityDoc): number {
  const aOrder = Number.isFinite(a.order) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
  const bOrder = Number.isFinite(b.order) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
  if (aOrder !== bOrder) return aOrder - bOrder;
  const aCreated = parseIso(a.createdAt);
  const bCreated = parseIso(b.createdAt);
  if (aCreated !== bCreated) return aCreated - bCreated;
  return a.id.localeCompare(b.id);
}

function mergeCanonical(canonical: FeaturedCityDoc, group: FeaturedCityDoc[]): Record<string, unknown> {
  const firstString = (...values: Array<string | null | undefined>): string | null => {
    for (const value of values) {
      const v = (value ?? '').trim();
      if (v.length > 0) return v;
    }
    return null;
  };
  const firstNumber = (...values: Array<number | null | undefined>): number | null => {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
    }
    return null;
  };
  const byOrder = [...group].sort(sortForCanonical);

  const mergedName = firstString(...byOrder.map((d) => d.name), canonical.name);
  const mergedSlug = safeSlug(firstString(...byOrder.map((d) => d.slug), canonical.slug, canonical.name) ?? canonical.id);
  const mergedCountryCode = firstString(...byOrder.map((d) => d.countryCode), canonical.countryCode) ?? '';
  const mergedCountryName = firstString(...byOrder.map((d) => d.countryName), canonical.countryName) ?? '';
  const mergedCountryEmoji = firstString(...byOrder.map((d) => d.countryEmoji), canonical.countryEmoji) ?? '';
  const mergedStateCode = firstString(...byOrder.map((d) => d.stateCode ?? undefined), canonical.stateCode ?? undefined);
  const mergedImageUrl = firstString(...byOrder.map((d) => d.imageUrl ?? undefined), canonical.imageUrl ?? undefined);
  const mergedLat = firstNumber(...byOrder.map((d) => d.lat), canonical.lat);
  const mergedLng = firstNumber(...byOrder.map((d) => d.lng), canonical.lng);

  const minOrder = Math.min(
    ...byOrder.map((d) => (typeof d.order === 'number' && Number.isFinite(d.order) ? d.order : Number.MAX_SAFE_INTEGER)),
  );

  const merged: Record<string, unknown> = {
    name: mergedName,
    slug: mergedSlug,
    countryCode: mergedCountryCode.toUpperCase(),
    countryName: mergedCountryName,
    countryEmoji: mergedCountryEmoji,
    stateCode: mergedStateCode ?? null,
    imageUrl: mergedImageUrl ?? null,
    featured: byOrder.some((d) => d.featured === true) || canonical.featured === true,
    order: Number.isFinite(minOrder) ? minOrder : canonical.order ?? 999,
    lat: mergedLat ?? null,
    lng: mergedLng ?? null,
    updatedAt: new Date().toISOString(),
  };

  return merged;
}

async function run(): Promise<void> {
  console.log(`[dedupe-featured-cities] project=${PROJECT_ID} mode=${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  const snap = await db.collection('featuredCities').get();
  const docs: FeaturedCityDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
  if (docs.length === 0) {
    console.log('[dedupe-featured-cities] no docs found.');
    return;
  }

  const groups = new Map<string, FeaturedCityDoc[]>();
  for (const doc of docs) {
    const key = duplicateKey(doc);
    if (!key || key.startsWith('::')) continue;
    const list = groups.get(key) ?? [];
    list.push(doc);
    groups.set(key, list);
  }

  const duplicates = [...groups.entries()].filter(([, list]) => list.length > 1);
  if (duplicates.length === 0) {
    console.log('[dedupe-featured-cities] no duplicates found.');
    return;
  }

  let deleteCount = 0;
  console.log(`[dedupe-featured-cities] duplicate groups: ${duplicates.length}`);
  for (const [key, list] of duplicates) {
    const ordered = [...list].sort(sortForCanonical);
    const keep = ordered[0]!;
    const remove = ordered.slice(1);
    deleteCount += remove.length;
    console.log(`  - ${key}: keep=${keep.id} remove=[${remove.map((d) => d.id).join(', ')}]`);
  }
  console.log(`[dedupe-featured-cities] docs to delete: ${deleteCount}`);

  if (!APPLY) {
    console.log('[dedupe-featured-cities] dry-run complete. Re-run with --apply to persist.');
    return;
  }

  let opCount = 0;
  let batch = db.batch();
  const flush = async () => {
    if (opCount === 0) return;
    await batch.commit();
    batch = db.batch();
    opCount = 0;
  };

  for (const [, list] of duplicates) {
    const ordered = [...list].sort(sortForCanonical);
    const keep = ordered[0]!;
    const remove = ordered.slice(1);
    const merged = mergeCanonical(keep, ordered);

    batch.set(db.collection('featuredCities').doc(keep.id), merged, { merge: true });
    opCount += 1;
    if (opCount >= 450) await flush();

    for (const doc of remove) {
      batch.delete(db.collection('featuredCities').doc(doc.id));
      opCount += 1;
      if (opCount >= 450) await flush();
    }
  }

  await flush();
  console.log('[dedupe-featured-cities] apply complete.');
}

run().catch((err) => {
  console.error('[dedupe-featured-cities] failed:', err);
  process.exit(1);
});


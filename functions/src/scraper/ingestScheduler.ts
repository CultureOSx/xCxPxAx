/**
 * Scheduled ingestion — runs every hour and triggers any saved ingestSources
 * whose scheduleInterval indicates they are due for a sync.
 *
 * Schedule interval → minimum hours between runs:
 *   hourly    → 1h
 *   every6h   → 6h
 *   every12h  → 12h
 *   daily     → 24h
 *   weekly    → 168h
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue } from 'firebase-admin/firestore';
import { db, isFirestoreConfigured } from '../admin';
import { importFromUrl } from '../services/importer';
import * as logger from 'firebase-functions/logger';

const INTERVAL_HOURS: Record<string, number> = {
  hourly:    1,
  every6h:   6,
  every12h:  12,
  daily:     24,
  weekly:    168,
};

export const runScheduledIngestion = onSchedule('every 60 minutes', async () => {
  if (!isFirestoreConfigured) {
    logger.warn('Firestore not configured — skipping scheduled ingestion');
    return;
  }

  const now = new Date();
  logger.info(`Scheduled ingestion check at ${now.toISOString()}`);

  const snap = await db.collection('ingestSources')
    .where('enabled', '==', true)
    .where('scheduleInterval', '!=', null)
    .get();

  if (snap.empty) {
    logger.info('No enabled scheduled sources found');
    return;
  }

  const due = snap.docs.filter(doc => {
    const data = doc.data() as { scheduleInterval: string; lastRunAt: string | null };
    const minHours = INTERVAL_HOURS[data.scheduleInterval] ?? 24;
    if (!data.lastRunAt) return true;
    const lastRun = new Date(data.lastRunAt);
    const elapsedHours = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
    return elapsedHours >= minHours;
  });

  logger.info(`${due.length} source(s) due for sync out of ${snap.size} scheduled`);

  for (const doc of due) {
    const source = doc.data() as {
      name: string; url: string; city: string; country: string;
    };

    const jobRef = db.collection('ingestionJobs').doc();
    const startedAt = new Date().toISOString();

    await jobRef.set({
      id: jobRef.id,
      sourceId: doc.id,
      sourceUrl: source.url,
      city: source.city ?? '',
      country: source.country ?? '',
      status: 'running',
      triggeredBy: 'scheduler',
      triggeredByUserId: null,
      startedAt,
      completedAt: null,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorMessages: [],
      retryCount: 0,
      parentJobId: null,
      createdAt: startedAt,
    });

    try {
      logger.info(`Running scheduled import for "${source.name}" (${source.url})`);
      const result = await importFromUrl(source.url, { city: source.city, country: source.country });
      const completedAt = new Date().toISOString();
      const hasErrors = result.errors.length > 0 && result.imported === 0 && result.updated === 0;

      await jobRef.update({
        status: hasErrors ? 'error' : 'success',
        completedAt,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors.length,
        errorMessages: result.errors.slice(0, 20),
      });

      await doc.ref.update({
        lastRunAt: completedAt,
        lastJobId: jobRef.id,
        lastStatus: hasErrors ? 'error' : 'success',
        totalImported: FieldValue.increment(result.imported + result.updated),
        updatedAt: completedAt,
        ...(hasErrors ? { errorCount: FieldValue.increment(1) } : { errorCount: 0 }),
      });

      logger.info(`"${source.name}": imported=${result.imported} updated=${result.updated} errors=${result.errors.length}`);
    } catch (err) {
      const completedAt = new Date().toISOString();
      logger.error(`Failed scheduled import for "${source.name}":`, err);

      await jobRef.update({
        status: 'error',
        completedAt,
        errorMessages: [String(err)],
      });

      await doc.ref.update({
        lastRunAt: completedAt,
        lastJobId: jobRef.id,
        lastStatus: 'error',
        updatedAt: completedAt,
        errorCount: FieldValue.increment(1),
      });
    }
  }
});

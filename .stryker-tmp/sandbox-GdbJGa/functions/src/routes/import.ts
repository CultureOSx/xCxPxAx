/**
 * Data Import & Ingestion Routes — /api/admin/import/*, /api/admin/ingest/*
 *
 * Protected by admin auth. Allows importing events from:
 *   - Raw JSON array (POST /admin/import/json)
 *   - External URL with job tracking (POST /admin/import/url)
 *   - Clearing imported data (DELETE /admin/import/clear)
 *   - Import stats by source (GET /admin/import/sources)
 *
 * Saved source management (persisted ingestSources collection):
 *   - GET    /admin/ingest/sources
 *   - POST   /admin/ingest/sources
 *   - PUT    /admin/ingest/sources/:id
 *   - DELETE /admin/ingest/sources/:id
 *   - POST   /admin/ingest/sources/:id/run
 *
 * Job history:
 *   - GET  /admin/ingest/jobs
 *   - POST /admin/ingest/jobs/:id/retry
 */
// @ts-nocheck


import { Router, type Request, type Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { captureRouteError, qparam } from './utils';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  importEvents,
  importFromUrl,
  clearImportedEvents,
  type ImportSource,
} from '../services/importer';
import { db, isFirestoreConfigured } from '../admin';

export const importRouter = Router();

const authGuard = [requireAuth, requireRole('admin', 'platformAdmin')];

// ---------------------------------------------------------------------------
// SSRF helper — returns error string or null
// ---------------------------------------------------------------------------

function getUrlSsrfError(urlString: string): string | null {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Only http:// and https:// URLs are allowed';
    }
    const host = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/, /^127\./, /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
      /^0\.0\.0\.0$/, /^::1$/,
    ];
    if (privatePatterns.some(p => p.test(host))) return 'Private/local URLs are not allowed';
    return null;
  } catch {
    return 'Invalid URL';
  }
}

// ---------------------------------------------------------------------------
// Job tracking helper — wraps importFromUrl with Firestore job records
// ---------------------------------------------------------------------------

async function runTrackedImport(opts: {
  url: string;
  city?: string;
  country?: string;
  sourceId?: string | null;
  triggeredBy: 'admin' | 'scheduler';
  triggeredByUserId?: string | null;
  retryCount?: number;
  parentJobId?: string | null;
}) {
  if (!isFirestoreConfigured) {
    return importFromUrl(opts.url, { city: opts.city, country: opts.country });
  }

  const now = new Date().toISOString();
  const jobRef = db.collection('ingestionJobs').doc();

  await jobRef.set({
    id: jobRef.id,
    sourceId: opts.sourceId ?? null,
    sourceUrl: opts.url,
    city: opts.city ?? '',
    country: opts.country ?? '',
    status: 'running',
    triggeredBy: opts.triggeredBy,
    triggeredByUserId: opts.triggeredByUserId ?? null,
    startedAt: now,
    completedAt: null,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorMessages: [],
    retryCount: opts.retryCount ?? 0,
    parentJobId: opts.parentJobId ?? null,
    createdAt: now,
  });

  try {
    const result = await importFromUrl(opts.url, { city: opts.city, country: opts.country });
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

    if (opts.sourceId) {
      await db.collection('ingestSources').doc(opts.sourceId).update({
        lastRunAt: completedAt,
        lastJobId: jobRef.id,
        lastStatus: hasErrors ? 'error' : 'success',
        totalImported: FieldValue.increment(result.imported + result.updated),
        updatedAt: completedAt,
        ...(hasErrors ? { errorCount: FieldValue.increment(1) } : { errorCount: 0 }),
      });
    }

    return { ...result, jobId: jobRef.id };
  } catch (err) {
    const completedAt = new Date().toISOString();
    await jobRef.update({
      status: 'error',
      completedAt,
      errorMessages: [String(err)],
    });
    if (opts.sourceId) {
      await db.collection('ingestSources').doc(opts.sourceId).update({
        lastRunAt: completedAt,
        lastJobId: jobRef.id,
        lastStatus: 'error',
        updatedAt: completedAt,
        errorCount: FieldValue.increment(1),
      });
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/import/json — import from raw JSON array
// ---------------------------------------------------------------------------

const importJsonSchema = z.object({
  events: z.array(z.record(z.unknown())).min(1).max(500),
  source: z.enum(['manual', 'json-api']).optional().default('manual'),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

importRouter.post('/admin/import/json', authGuard, async (req: Request, res: Response) => {
  const parsed = importJsonSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });
  }

  const { events, source, city, country } = parsed.data;

  try {
    const result = await importEvents(events, source as ImportSource, { city, country });
    return res.json({
      ok: true,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.slice(0, 20),
      source: result.source,
    });
  } catch (err) {
    captureRouteError(err, 'POST /admin/import/json');
    return res.status(500).json({ error: 'Import failed', detail: String(err) });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/import/url — scrape or fetch from an external URL
// ---------------------------------------------------------------------------

const importUrlSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

importRouter.post('/admin/import/url', authGuard, async (req: Request, res: Response) => {
  const parsed = importUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });
  }

  const { url, city, country } = parsed.data;
  const ssrfErr = getUrlSsrfError(url);
  if (ssrfErr) return res.status(400).json({ error: ssrfErr });

  const userId = (req as Request & { user?: { uid: string } }).user?.uid ?? null;

  try {
    const result = await runTrackedImport({ url, city, country, triggeredBy: 'admin', triggeredByUserId: userId });
    return res.json({
      ok: true,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.slice(0, 20),
      source: result.source,
      jobId: (result as typeof result & { jobId?: string }).jobId,
    });
  } catch (err) {
    captureRouteError(err, 'POST /admin/import/url');
    return res.status(500).json({ error: 'URL import failed', detail: String(err) });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/admin/import/clear — clear imported events by source or all
// ---------------------------------------------------------------------------

const clearSchema = z.object({
  source: z.enum(['manual', 'url-scrape', 'cityofsydney', 'json-api', 'all']).optional().default('all'),
  confirm: z.literal(true, { errorMap: () => ({ message: 'confirm must be true' }) }),
});

importRouter.delete('/admin/import/clear', authGuard, async (req: Request, res: Response) => {
  const parsed = clearSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });
  }

  const { source } = parsed.data;

  try {
    const result = await clearImportedEvents(source === 'all' ? undefined : source as ImportSource);
    return res.json({ ok: true, deleted: result.deleted, source });
  } catch (err) {
    captureRouteError(err, 'DELETE /admin/import/clear');
    return res.status(500).json({ error: 'Clear failed', detail: String(err) });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/import/sources — import stats by source (legacy)
// ---------------------------------------------------------------------------

importRouter.get('/admin/import/sources', authGuard, async (_req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.json({ sources: [], total: 0 });

  try {
    const snap = await db.collection('events')
      .where('importSource', '!=', null)
      .select('importSource', 'createdAt')
      .get();

    const counts: Record<string, { count: number; latest: string }> = {};
    snap.docs.forEach(doc => {
      const src = doc.data().importSource ?? 'unknown';
      const ts = doc.data().createdAt ?? '';
      if (!counts[src]) counts[src] = { count: 0, latest: '' };
      counts[src].count++;
      if (ts > counts[src].latest) counts[src].latest = ts;
    });

    return res.json({
      sources: Object.entries(counts).map(([source, v]) => ({ source, ...v })),
      total: snap.size,
    });
  } catch (err) {
    captureRouteError(err, 'GET /admin/import/sources');
    return res.status(500).json({ error: 'Failed to fetch import sources' });
  }
});

// ===========================================================================
// Ingest Source Management — /api/admin/ingest/sources
// ===========================================================================

const sourceCreateSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  city: z.string().max(100).optional().default(''),
  country: z.string().max(100).optional().default(''),
  enabled: z.boolean().optional().default(true),
  scheduleInterval: z.enum(['hourly', 'every6h', 'every12h', 'daily', 'weekly']).nullable().optional().default(null),
});

const sourceUpdateSchema = sourceCreateSchema.partial();

// GET /api/admin/ingest/sources
importRouter.get('/admin/ingest/sources', authGuard, async (_req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.json({ sources: [] });
  try {
    const snap = await db.collection('ingestSources').orderBy('createdAt', 'desc').limit(100).get();
    const sources = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ sources });
  } catch (err) {
    captureRouteError(err, 'GET /admin/ingest/sources');
    return res.status(500).json({ error: 'Failed to list ingest sources' });
  }
});

// POST /api/admin/ingest/sources
importRouter.post('/admin/ingest/sources', authGuard, async (req: Request, res: Response) => {
  const parsed = sourceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });
  }

  const ssrfErr = getUrlSsrfError(parsed.data.url);
  if (ssrfErr) return res.status(400).json({ error: ssrfErr });

  const userId = (req as Request & { user?: { uid: string } }).user?.uid ?? 'unknown';
  const now = new Date().toISOString();

  try {
    const ref = db.collection('ingestSources').doc();
    const doc = {
      id: ref.id,
      ...parsed.data,
      lastRunAt: null,
      lastJobId: null,
      lastStatus: null,
      errorCount: 0,
      totalImported: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };
    await ref.set(doc);
    return res.status(201).json({ ok: true, source: doc });
  } catch (err) {
    captureRouteError(err, 'POST /admin/ingest/sources');
    return res.status(500).json({ error: 'Failed to create ingest source' });
  }
});

// PUT /api/admin/ingest/sources/:id
importRouter.put('/admin/ingest/sources/:id', authGuard, async (req: Request, res: Response) => {
  const id = qparam(req.params.id);
  const parsed = sourceUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });
  }

  if (parsed.data.url) {
    const ssrfErr = getUrlSsrfError(parsed.data.url);
    if (ssrfErr) return res.status(400).json({ error: ssrfErr });
  }

  try {
    await db.collection('ingestSources').doc(id).update({
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    });
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'PUT /admin/ingest/sources/:id');
    return res.status(500).json({ error: 'Failed to update ingest source' });
  }
});

// DELETE /api/admin/ingest/sources/:id
importRouter.delete('/admin/ingest/sources/:id', authGuard, async (req: Request, res: Response) => {
  const id = qparam(req.params.id);
  try {
    await db.collection('ingestSources').doc(id).delete();
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /admin/ingest/sources/:id');
    return res.status(500).json({ error: 'Failed to delete ingest source' });
  }
});

// POST /api/admin/ingest/sources/:id/run — trigger a run for a saved source
importRouter.post('/admin/ingest/sources/:id/run', authGuard, async (req: Request, res: Response) => {
  const id = qparam(req.params.id);
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore not configured' });

  const docSnap = await db.collection('ingestSources').doc(id).get();
  if (!docSnap.exists) return res.status(404).json({ error: 'Source not found' });

  const source = docSnap.data() as { url: string; city: string; country: string; enabled: boolean };
  if (!source.enabled) return res.status(400).json({ error: 'Source is disabled' });

  const ssrfErr = getUrlSsrfError(source.url);
  if (ssrfErr) return res.status(400).json({ error: ssrfErr });

  const userId = (req as Request & { user?: { uid: string } }).user?.uid ?? null;

  try {
    const result = await runTrackedImport({
      url: source.url,
      city: source.city,
      country: source.country,
      sourceId: id,
      triggeredBy: 'admin',
      triggeredByUserId: userId,
    });
    return res.json({
      ok: true,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.slice(0, 20),
      source: result.source,
      jobId: (result as typeof result & { jobId?: string }).jobId,
    });
  } catch (err) {
    captureRouteError(err, 'POST /admin/ingest/sources/:id/run');
    return res.status(500).json({ error: 'Run failed', detail: String(err) });
  }
});

// ===========================================================================
// Job History — /api/admin/ingest/jobs
// ===========================================================================

// GET /api/admin/ingest/jobs?limit=20&sourceId=xxx&status=error
importRouter.get('/admin/ingest/jobs', authGuard, async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) return res.json({ jobs: [] });

  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const sourceId = typeof req.query.sourceId === 'string' ? req.query.sourceId : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  try {
    let query: FirebaseFirestore.Query = db.collection('ingestionJobs').orderBy('createdAt', 'desc');
    if (sourceId) query = query.where('sourceId', '==', sourceId);
    if (status) query = query.where('status', '==', status);
    query = query.limit(limit);

    const snap = await query.get();
    const jobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ jobs });
  } catch (err) {
    captureRouteError(err, 'GET /admin/ingest/jobs');
    return res.status(500).json({ error: 'Failed to list jobs' });
  }
});

// POST /api/admin/ingest/jobs/:id/retry
importRouter.post('/admin/ingest/jobs/:id/retry', authGuard, async (req: Request, res: Response) => {
  const id = qparam(req.params.id);
  if (!isFirestoreConfigured) return res.status(503).json({ error: 'Firestore not configured' });

  const jobSnap = await db.collection('ingestionJobs').doc(id).get();
  if (!jobSnap.exists) return res.status(404).json({ error: 'Job not found' });

  const job = jobSnap.data() as {
    sourceUrl: string; city: string; country: string;
    sourceId: string | null; retryCount: number; status: string;
  };

  if (job.status === 'running') return res.status(409).json({ error: 'Job is already running' });
  if (job.retryCount >= 3) return res.status(400).json({ error: 'Max retries (3) reached' });

  const ssrfErr = getUrlSsrfError(job.sourceUrl);
  if (ssrfErr) return res.status(400).json({ error: ssrfErr });

  const userId = (req as Request & { user?: { uid: string } }).user?.uid ?? null;

  try {
    const result = await runTrackedImport({
      url: job.sourceUrl,
      city: job.city,
      country: job.country,
      sourceId: job.sourceId,
      triggeredBy: 'admin',
      triggeredByUserId: userId,
      retryCount: job.retryCount + 1,
      parentJobId: id,
    });
    return res.json({
      ok: true,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      jobId: (result as typeof result & { jobId?: string }).jobId,
    });
  } catch (err) {
    captureRouteError(err, 'POST /admin/ingest/jobs/:id/retry');
    return res.status(500).json({ error: 'Retry failed', detail: String(err) });
  }
});

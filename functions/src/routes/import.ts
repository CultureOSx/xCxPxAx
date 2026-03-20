/**
 * Data Import Routes — /api/admin/import/*
 *
 * Protected by admin auth. Allows importing events from:
 *   - Raw JSON array (POST /admin/import/json)
 *   - External URL (POST /admin/import/url)
 *   - Clearing imported data (DELETE /admin/import/clear)
 *   - Listing import sources (GET /admin/import/sources)
 */

import { Router, Request, Response } from 'express';
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
    console.error('[POST /admin/import/json]:', err);
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

  // SSRF protection — only allow http/https, block private IP ranges
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only http:// and https:// URLs are allowed' });
    }
    const host = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^0\.0\.0\.0$/,
      /^::1$/,
    ];
    if (privatePatterns.some(p => p.test(host))) {
      return res.status(400).json({ error: 'Private/local URLs are not allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const result = await importFromUrl(url, { city, country });
    return res.json({
      ok: true,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.slice(0, 20),
      source: result.source,
    });
  } catch (err) {
    console.error('[POST /admin/import/url]:', err);
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
    console.error('[DELETE /admin/import/clear]:', err);
    return res.status(500).json({ error: 'Clear failed', detail: String(err) });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/import/sources — import stats by source
// ---------------------------------------------------------------------------

importRouter.get('/admin/import/sources', authGuard, async (_req: Request, res: Response) => {
  if (!isFirestoreConfigured) {
    return res.json({ sources: [], total: 0 });
  }

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
    console.error('[GET /admin/import/sources]:', err);
    return res.status(500).json({ error: 'Failed to fetch import sources' });
  }
});

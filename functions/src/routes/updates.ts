
import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import { requireRole } from '../middleware/auth';
import { updatesService } from '../services/updates';

export const updatesRouter = Router();

// ---------------------------------------------------------------------------
// Public — list published updates
// ---------------------------------------------------------------------------
updatesRouter.get('/updates', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 20;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const result = await updatesService.list({
      status: 'published',
      category: category as any,
      limit,
      offset,
    });

    return res.json({ updates: result.items, total: result.total });
  } catch (err) {
    captureRouteError(err, 'GET /updates');
    return res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

// ---------------------------------------------------------------------------
// Public — get single update by ID or slug
// ---------------------------------------------------------------------------
updatesRouter.get('/updates/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    let update = await updatesService.getById(id);
    if (!update) update = await updatesService.getBySlug(id);
    if (!update || update.status !== 'published') {
      return res.status(404).json({ error: 'Update not found' });
    }
    return res.json(update);
  } catch (err) {
    captureRouteError(err, 'GET /updates/:id');
    return res.status(500).json({ error: 'Failed to fetch update' });
  }
});

// ---------------------------------------------------------------------------
// Admin — create update
// ---------------------------------------------------------------------------
updatesRouter.post('/updates', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const { title, slug, body, version, category, status } = req.body as Record<string, string>;

    if (!title || !slug || !body || !category) {
      return res.status(400).json({ error: 'title, slug, body, and category are required' });
    }

    // Slug uniqueness
    const existing = await updatesService.getBySlug(slug);
    if (existing) {
      return res.status(409).json({ error: 'A post with this slug already exists' });
    }

    const user = (req as any).user;
    const update = await updatesService.create({
      title,
      slug,
      body,
      version,
      category: category as any,
      authorId: user.uid,
      authorName: user.displayName ?? user.email ?? 'Admin',
      status: (status as any) ?? 'draft',
      publishedAt: status === 'published' ? new Date().toISOString() : undefined,
    });

    return res.status(201).json(update);
  } catch (err) {
    captureRouteError(err, 'POST /updates');
    return res.status(500).json({ error: 'Failed to create update' });
  }
});

// ---------------------------------------------------------------------------
// Admin — update post
// ---------------------------------------------------------------------------
updatesRouter.put('/updates/:id', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const updated = await updatesService.update(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Update not found' });
    return res.json(updated);
  } catch (err) {
    captureRouteError(err, 'PUT /updates/:id');
    return res.status(500).json({ error: 'Failed to update post' });
  }
});

// ---------------------------------------------------------------------------
// Admin — publish
// ---------------------------------------------------------------------------
updatesRouter.post('/updates/:id/publish', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const updated = await updatesService.publish(id);
    if (!updated) return res.status(404).json({ error: 'Update not found' });
    return res.json(updated);
  } catch (err) {
    captureRouteError(err, 'POST /updates/:id/publish');
    return res.status(500).json({ error: 'Failed to publish update' });
  }
});

// ---------------------------------------------------------------------------
// Admin — delete
// ---------------------------------------------------------------------------
updatesRouter.delete('/updates/:id', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const existing = await updatesService.getById(id);
    if (!existing) return res.status(404).json({ error: 'Update not found' });
    await updatesService.delete(id);
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /updates/:id');
    return res.status(500).json({ error: 'Failed to delete update' });
  }
});

// ---------------------------------------------------------------------------
// Admin — list ALL updates (including drafts)
// ---------------------------------------------------------------------------
updatesRouter.get('/admin/updates', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const result = await updatesService.list({ category: category as any, limit, offset });
    return res.json({ updates: result.items, total: result.total });
  } catch (err) {
    captureRouteError(err, 'GET /admin/updates');
    return res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

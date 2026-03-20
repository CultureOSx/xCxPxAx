import { Router, Request, Response } from 'express';
import { db } from '../admin';
import { requireRole } from '../middleware/auth';
import { usersService } from '../services/users';

export const adminRouter = Router();

// ---------------------------------------------------------------------------
// Handle Approvals — list pending +handles
// ---------------------------------------------------------------------------
adminRouter.get('/admin/handles/pending', requireRole('admin', 'moderator', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const usersSnap = await db.collection('users').where('handleStatus', '==', 'pending').get();
    const profilesSnap = await db.collection('profiles').where('handleStatus', '==', 'pending').get();

    const handles = [
      ...usersSnap.docs.map(d => ({
        id: d.id,
        type: 'user' as const,
        handle: d.data().handle ?? d.data().username,
        name: d.data().displayName ?? d.data().username ?? 'Unknown',
        createdAt: d.data().createdAt,
      })),
      ...profilesSnap.docs.map(d => ({
        id: d.id,
        type: 'profile' as const,
        handle: d.data().handle ?? d.data().slug ?? d.data().name,
        name: d.data().name ?? 'Unknown',
        entityType: d.data().entityType,
        createdAt: d.data().createdAt,
      })),
    ].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));

    return res.json({ handles, count: handles.length });
  } catch (err) {
    console.error('[GET /admin/handles/pending]:', err);
    return res.status(500).json({ error: 'Failed to fetch pending handles' });
  }
});

// ---------------------------------------------------------------------------
// Handle Approvals — approve a handle
// ---------------------------------------------------------------------------
adminRouter.post('/admin/handles/:type/:id/approve', requireRole('admin', 'moderator', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const type = req.params['type'] as string;
    const id = req.params['id'] as string;
    const now = new Date().toISOString();

    if (type === 'user') {
      await usersService.update(id, { handleStatus: 'approved' });
    } else if (type === 'profile') {
      await db.collection('profiles').doc(id).update({ handleStatus: 'approved', updatedAt: now });
    } else {
      return res.status(400).json({ error: 'type must be user or profile' });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[POST /admin/handles/:type/:id/approve]:', err);
    return res.status(500).json({ error: 'Failed to approve handle' });
  }
});

// ---------------------------------------------------------------------------
// Handle Approvals — reject a handle
// ---------------------------------------------------------------------------
adminRouter.post('/admin/handles/:type/:id/reject', requireRole('admin', 'moderator', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const type = req.params['type'] as string;
    const id = req.params['id'] as string;
    const now = new Date().toISOString();
    const reason: string | undefined = req.body?.reason;

    if (type === 'user') {
      await usersService.update(id, { handleStatus: 'rejected' });
    } else if (type === 'profile') {
      await db.collection('profiles').doc(id).update({ handleStatus: 'rejected', updatedAt: now });
    } else {
      return res.status(400).json({ error: 'type must be user or profile' });
    }

    if (process.env.NODE_ENV !== 'production') console.log(`[handle rejected] ${type}/${id} — reason: ${reason}`);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[POST /admin/handles/:type/:id/reject]:', err);
    return res.status(500).json({ error: 'Failed to reject handle' });
  }
});

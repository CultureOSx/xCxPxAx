import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, isFirestoreConfigured, authAdmin } from '../admin';
import { requireAuth, requireRole } from '../middleware/auth';
import { parseBody, nowIso,
  captureRouteError,
} from './utils';
import { randomUUID } from 'node:crypto';

export const socialRouter = Router();

/** GET /api/notifications — list notifications for current user */
socialRouter.get('/notifications', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  if (isFirestoreConfigured) {
    const snap = await db.collection('notifications').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(50).get();
    return res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  // Fallback to devStore logic if needed, but simplified for now
  return res.json([]);
});

/** GET /api/notifications/unread-count — unread notification count for current user */
socialRouter.get('/notifications/unread-count', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  if (!isFirestoreConfigured) {
    return res.json({ count: 0 });
  }
  try {
    const snap = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();
    return res.json({ count: snap.size });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch unread notification count' });
  }
});

/** POST /api/notifications/mark-all-read — mark all as read */
socialRouter.post('/notifications/mark-all-read', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  if (isFirestoreConfigured) {
    const snap = await db.collection('notifications').where('userId', '==', userId).where('isRead', '==', false).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { isRead: true }));
    await batch.commit();
  }
  return res.json({ ok: true });
});

/** POST /api/social/follow/:targetType/:targetId — follow a profile/user */
socialRouter.post('/social/follow/:targetType/:targetId', requireAuth, async (req, res) => {
  const { targetType, targetId } = req.params;
  const userId = req.user!.id;
  
  if (isFirestoreConfigured) {
    const followId = `${userId}_${targetId}`;
    await db.collection('follows').doc(followId).set({
      userId,
      targetType,
      targetId,
      createdAt: nowIso()
    });
  }
  return res.json({ ok: true });
});

/** DELETE /api/social/follow/:targetType/:targetId — unfollow */
socialRouter.delete('/social/follow/:targetType/:targetId', requireAuth, async (req, res) => {
  const { targetId } = req.params;
  const userId = req.user!.id;
  
  if (isFirestoreConfigured) {
    await db.collection('follows').doc(`${userId}_${targetId}`).delete();
  }
  return res.json({ ok: true });
});

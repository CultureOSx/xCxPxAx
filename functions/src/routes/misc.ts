import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, authAdmin } from '../admin';
import { requireAuth, isOwnerOrAdmin } from '../middleware/auth';
import { moderationCheck } from '../middleware/moderation';
import { parseBody, nowIso,
  captureRouteError,
} from './utils';
import { getRolloutConfig, isFeatureEnabledForUser } from '../services/rollout';

export const miscRouter = Router();

const mediaAttachSchema = z.object({
  targetType: z.enum(['user', 'profile', 'event', 'business', 'post']),
  targetId: z.string().min(1),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

const reportCreateSchema = z.object({
  targetType: z.enum(['event', 'community', 'profile', 'post', 'user']),
  targetId: z.string().min(1),
  reason: z.string().min(1),
  details: z.string().optional(),
});

/** POST /api/media/attach — attach media to an entity */
miscRouter.post('/media/attach', requireAuth, async (req: Request, res: Response) => {
  try {
    const payload = parseBody(mediaAttachSchema, req.body);
    const ref = db.collection('media').doc();
    const thumbnailUrl = payload.thumbnailUrl ?? payload.imageUrl;
    const media = { ...payload, thumbnailUrl, id: ref.id, uploadedBy: req.user!.id, createdAt: nowIso() };
    await ref.set(media);
    return res.status(201).json(media);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to attach media' });
  }
});

/** GET /api/media/:targetType/:targetId — list media for target */
miscRouter.get('/media/:targetType/:targetId', async (req: Request, res: Response) => {
  const targetType = String(req.params.targetType ?? '');
  const targetId = String(req.params.targetId ?? '');
  try {
    const snap = await db.collection('media')
      .where('targetType', '==', targetType)
      .where('targetId', '==', targetId)
      .get();
    return res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
});

/** POST /api/reports — submit a content report */
miscRouter.post('/reports', requireAuth, moderationCheck, async (req: Request, res: Response) => {
  try {
    const payload = parseBody(reportCreateSchema, req.body);
    const ref = db.collection('reports').doc();
    const report = { ...payload, id: ref.id, reporterUserId: req.user!.id, status: 'pending', createdAt: nowIso() };
    await ref.set(report);
    return res.status(201).json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit report' });
  }
});

/** GET /api/privacy/settings/:userId — get privacy settings */
miscRouter.get('/privacy/settings/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const snap = await db.collection('privacySettings').doc(userId).get();
    if (!snap.exists) return res.json({ profileVisible: true, searchable: true });
    return res.json(snap.data());
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch privacy settings' });
  }
});

/** PUT /api/privacy/settings/:userId — update privacy settings */
miscRouter.put('/privacy/settings/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const updates = req.body ?? {};
    await db.collection('privacySettings').doc(userId).set(updates, { merge: true });
    const snap = await db.collection('privacySettings').doc(userId).get();
    return res.json(snap.data());
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

/** DELETE /api/account/:userId — delete account and all data */
miscRouter.delete('/account/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });
  
  try {
    // 1. Delete from Firebase Auth
    await authAdmin.deleteUser(userId);
    
    // 2. Recursive delete from Firestore
    await db.recursiveDelete(db.collection('users').doc(userId));
    
    return res.json({ ok: true, userId });
  } catch (err) {
    captureRouteError(err, 'DELETE /api/account/:userId');
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

/** GET /api/rollout/config — get rollout phase configuration for a user */
miscRouter.get('/rollout/config', (req: Request, res: Response) => {
  const userId = String(req.query.userId ?? 'guest');
  const config = getRolloutConfig();
  const features: Record<string, boolean> = {};
  for (const key of ['discovery', 'perks', 'council', 'calendar', 'scanner']) {
    features[key] = isFeatureEnabledForUser(key, userId);
  }
  return res.json({ ...config, userId, features });
});

/** GET /api/cpid/lookup/:cpid — lookup entity by CulturePass ID */
miscRouter.get('/cpid/lookup/:cpid', async (req: Request, res: Response) => {
  const cpid = String(req.params.cpid ?? '').toUpperCase();
  try {
    const userSnap = await db.collection('users').where('culturePassId', '==', cpid).limit(1).get();
    if (!userSnap.empty) return res.json({ entityType: 'user', targetId: userSnap.docs[0].id });
    
    const profileSnap = await db.collection('profiles').where('cpid', '==', cpid).limit(1).get();
    if (!profileSnap.empty) return res.json({ entityType: 'profile', targetId: profileSnap.docs[0].id });
    
    return res.status(404).json({ error: 'CPID not found' });
  } catch (err) {
    return res.status(500).json({ error: 'Lookup failed' });
  }
});

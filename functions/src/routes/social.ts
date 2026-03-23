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

// ---------------------------------------------------------------------------
// Community Posts
// ---------------------------------------------------------------------------

const VALID_COLLECTIONS = ['events', 'communityPosts'] as const;
type PostCollection = typeof VALID_COLLECTIONS[number];

function isValidCollection(c: string): c is PostCollection {
  return (VALID_COLLECTIONS as readonly string[]).includes(c);
}

/** POST /api/posts — create a community post */
socialRouter.post('/posts', requireAuth, async (req: Request, res: Response) => {
  const schema = z.object({
    communityId:   z.string().min(1),
    communityName: z.string().min(1),
    body:          z.string().min(1).max(500),
    imageUrl:      z.string().url().optional().nullable(),
  });
  try {
    const { communityId, communityName, body, imageUrl } = parseBody(schema, req.body);
    const authorId   = req.user!.id;
    const authorName = req.user!.username || req.user!.email || 'User';
    const postId     = randomUUID();
    const doc = {
      authorId,
      authorName,
      communityId,
      communityName,
      body,
      imageUrl: imageUrl ?? null,
      likeCount:    0,
      commentCount: 0,
      createdAt: nowIso(),
    };
    if (isFirestoreConfigured) {
      await db.collection('communityPosts').doc(postId).set(doc);
    }
    return res.status(201).json({ id: postId, ...doc });
  } catch (err) {
    captureRouteError(err, 'POST /api/posts');
    return res.status(err instanceof Error && err.message.includes('Invalid') ? 400 : 500)
      .json({ error: err instanceof Error ? err.message : 'Failed to create post' });
  }
});

/**
 * GET /api/posts/:collection/:postId/reactions
 * Public — returns likeCount, commentCount, and (if authenticated) whether the user liked.
 */
socialRouter.get('/posts/:collection/:postId/reactions', async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const userId = req.user?.id ?? null;
  try {
    if (!isFirestoreConfigured) {
      return res.json({ likeCount: 0, liked: false, commentCount: 0 });
    }
    const [reactionsSnap, commentsSnap] = await Promise.all([
      db.collection(collection).doc(postId).collection('reactions').get(),
      db.collection(collection).doc(postId).collection('comments').get(),
    ]);
    return res.json({
      likeCount:    reactionsSnap.size,
      liked:        userId ? reactionsSnap.docs.some((d) => d.id === userId) : false,
      commentCount: commentsSnap.size,
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/posts/:collection/:postId/reactions');
    return res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

/** POST /api/posts/:collection/:postId/like — toggle like */
socialRouter.post('/posts/:collection/:postId/like', requireAuth, async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const userId = req.user!.id;
  try {
    let liked = false;
    if (isFirestoreConfigured) {
      const ref      = db.collection(collection).doc(postId).collection('reactions').doc(userId);
      const existing = await ref.get();
      if (existing.exists) {
        await ref.delete();
        liked = false;
      } else {
        await ref.set({ userId, createdAt: nowIso() });
        liked = true;
      }
    }
    return res.json({ liked });
  } catch (err) {
    captureRouteError(err, 'POST /api/posts/:collection/:postId/like');
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
});

/** GET /api/posts/:collection/:postId/comments */
socialRouter.get('/posts/:collection/:postId/comments', async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  try {
    if (!isFirestoreConfigured) {
      return res.json([]);
    }
    const snap = await db
      .collection(collection).doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .limit(50)
      .get();
    return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    captureRouteError(err, 'GET /api/posts/:collection/:postId/comments');
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/** POST /api/posts/:collection/:postId/comments */
socialRouter.post('/posts/:collection/:postId/comments', requireAuth, async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const schema = z.object({ body: z.string().min(1).max(300) });
  try {
    const { body } = parseBody(schema, req.body);
    const authorId   = req.user!.id;
    const authorName = req.user!.username || req.user!.email || 'User';
    const commentId  = randomUUID();
    const doc = { authorId, authorName, body, createdAt: nowIso() };
    if (isFirestoreConfigured) {
      await db.collection(collection).doc(postId).collection('comments').doc(commentId).set(doc);
    }
    return res.status(201).json({ id: commentId, ...doc });
  } catch (err) {
    captureRouteError(err, 'POST /api/posts/:collection/:postId/comments');
    return res.status(err instanceof Error && err.message.includes('Invalid') ? 400 : 500)
      .json({ error: err instanceof Error ? err.message : 'Failed to add comment' });
  }
});

/** POST /api/posts/:collection/:postId/report */
socialRouter.post('/posts/:collection/:postId/report', requireAuth, async (req: Request, res: Response) => {
  const collection = String(req.params.collection);
  const postId     = String(req.params.postId);
  if (!isValidCollection(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const schema = z.object({ reason: z.string().min(1) });
  try {
    const { reason } = parseBody(schema, req.body);
    const reporterId = req.user!.id;
    if (isFirestoreConfigured) {
      await db.collection('reports').add({
        reporterId,
        postId,
        collection,
        reason,
        createdAt: nowIso(),
      });
    }
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'POST /api/posts/:collection/:postId/report');
    return res.status(500).json({ error: 'Failed to report post' });
  }
});

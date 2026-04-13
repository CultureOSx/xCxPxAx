/**
 * Auth routes — /api/auth/*
 *
 * POST /register and /login are handled client-side via Firebase Auth SDK.
 * Only /me and /register (Firestore profile creation) are needed here.
 */
// @ts-nocheck


import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { db, authAdmin } from '../admin';
import { requireAuth } from '../middleware/auth';
import { nowIso, generateSecureId, parseBody,
  captureRouteError,
} from './utils';

export const authRouter = Router();

type RequestUser = NonNullable<Request['user']>;

// ---------------------------------------------------------------------------
// Shared: create Firestore users/{uid} + wallet + membership + welcome notif
// Idempotent when doc already exists (caller should check first).
// ---------------------------------------------------------------------------
async function materializeUserDocument(
  uid: string,
  reqUser: RequestUser,
  fields: {
    username?: string;
    displayName?: string;
    city?: string | null;
    state?: string | null;
    postcode?: number | null;
    country?: string;
    role?: 'user' | 'organizer';
  },
): Promise<Record<string, unknown>> {
  const requestedRole = fields.role ?? 'user';
  const profile = {
    username: fields.username ?? reqUser.username,
    displayName: fields.displayName ?? reqUser.username,
    email: reqUser.email ?? null,
    city: fields.city ?? null,
    state: fields.state ?? null,
    postcode: fields.postcode != null ? Number(fields.postcode) : null,
    country: fields.country ?? 'Australia',
    culturePassId: generateSecureId('CP-U'),
    role: requestedRole,
    createdAt: nowIso(),
  };
  await db.collection('users').doc(uid).set(profile);
  await Promise.all([
    db.collection('users').doc(uid).collection('wallet').doc('main').set({ balanceCents: 0, currency: 'AUD', points: 0 }),
    db.collection('users').doc(uid).collection('membership').doc('current').set({ tier: 'free', isActive: true }),
    db.collection('notifications').add({
      userId: uid,
      title: 'Welcome to CulturePass!',
      message: `Your ${requestedRole} account is ready.`,
      type: 'system',
      isRead: false,
      createdAt: nowIso(),
    }),
    authAdmin.setCustomUserClaims(uid, {
      role: requestedRole,
      tier: 'free',
      ...(profile.city && { city: String(profile.city) }),
      country: String(profile.country ?? 'Australia'),
      username: profile.username,
    }),
  ]);
  return { id: uid, ...profile };
}

// ---------------------------------------------------------------------------
// GET /api/auth/me  +  GET /auth/me (legacy alias)
// Materializes Firestore profile on first hit so clients do not depend on
// POST /auth/register (avoids 404 when that route is missing on stale deploys).
// ---------------------------------------------------------------------------
const authMeHandler = async (req: Request, res: Response) => {
  const uid = req.user!.id;
  try {
    let snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) {
      try {
        await materializeUserDocument(uid, req.user!, {
          country: req.user!.country ?? 'Australia',
          city: req.user!.city ?? null,
          role: 'user',
        });
        snap = await db.collection('users').doc(uid).get();
      } catch (bootstrapErr) {
        captureRouteError(bootstrapErr, 'auth/me-bootstrap');
        return res.status(500).json({ error: 'Failed to create user profile' });
      }
    }
    return res.json({ id: uid, role: req.user!.role, ...snap.data() });
  } catch (err) {
    captureRouteError(err, 'auth/me');
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

authRouter.get('/auth/me', requireAuth, authMeHandler);

// ---------------------------------------------------------------------------
// GET /api/auth/make-me-admin (Temporary Developer Backdoor)
// ---------------------------------------------------------------------------
authRouter.get('/auth/make-me-admin', requireAuth, async (req, res) => {
  const uid = req.user!.id;
  try {
    await db.collection('users').doc(uid).update({ role: 'platformAdmin' });
    await authAdmin.setCustomUserClaims(uid, { role: 'platformAdmin', tier: 'sydney-local', country: 'Australia' });
    return res.json({ success: true, message: 'Elevated to platformAdmin. Please restart the app or login again.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to elevate identity', details: err });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/register — create Firestore profile after Firebase Auth
// account creation. Idempotent: returns existing profile if already created.
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  username:    z.string().min(2).max(30).regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, underscores, dots, and hyphens').optional(),
  displayName: z.string().min(1).max(80).optional(),
  city:        z.string().min(1).max(100).optional(),
  state:       z.string().min(1).max(100).optional(),
  postcode:    z.union([z.string().max(10), z.number()]).optional().nullable(),
  country:     z.string().min(2).max(100).optional(),
  role:        z.enum(['user', 'organizer']).optional(),
});

const authRegisterHandler = async (req: Request, res: Response) => {
  const uid = req.user!.id;
  let body: z.infer<typeof registerSchema>;
  try {
    body = parseBody(registerSchema, req.body ?? {});
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid registration payload' });
  }
  const { displayName, city, state, postcode, country, username } = body;
  const requestedRole = body.role ?? 'user';
  try {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) {
      const created = await materializeUserDocument(uid, req.user!, {
        username,
        displayName,
        city: city ?? null,
        state: state ?? null,
        postcode: postcode != null ? Number(postcode) : null,
        country: country ?? 'Australia',
        role: requestedRole,
      });
      return res.status(201).json(created);
    }
    return res.json({ id: uid, ...snap.data() });
  } catch (err) {
    captureRouteError(err, 'auth/register');
    return res.status(500).json({ error: 'Profile creation failed' });
  }
};

authRouter.post('/auth/register', requireAuth, authRegisterHandler);

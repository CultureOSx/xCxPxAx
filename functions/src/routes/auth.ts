/**
 * Auth routes — /api/auth/*
 *
 * POST /register and /login are handled client-side via Firebase Auth SDK.
 * Only /me and /register (Firestore profile creation) are needed here.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { db, authAdmin } from '../admin';
import { requireAuth } from '../middleware/auth';
import { nowIso, generateSecureId, parseBody,
  captureRouteError,
} from './utils';

export const authRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/auth/me  +  GET /auth/me (legacy alias)
// ---------------------------------------------------------------------------
const authMeHandler = async (req: Request, res: Response) => {
  const uid = req.user!.id;
  try {
    const snap = await db.collection('users').doc(uid).get();
    if (snap.exists) {
      return res.json({ id: uid, role: req.user!.role, ...snap.data() });
    }
    // Fallback: return minimal profile from token claims
    return res.json({
      id: uid,
      role: req.user!.role,
      username: req.user!.username,
      email: req.user!.email,
      city: req.user!.city,
      country: req.user!.country,
    });
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
      const profile = {
        username: username ?? req.user!.username,
        displayName: displayName ?? req.user!.username,
        email: req.user!.email ?? null,
        city: city ?? null,
        state: state ?? null,
        postcode: postcode != null ? Number(postcode) : null,
        country: country ?? 'Australia',
        culturePassId: generateSecureId('CP-U'),
        role: requestedRole,
        createdAt: nowIso(),
      };
      await db.collection('users').doc(uid).set(profile);
      // Bootstrap wallet, membership, welcome notification, and custom claims
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
          ...(city && { city: String(city) }),
          country: String(country ?? 'Australia'),
          username: profile.username,
        }),
      ]);
      return res.status(201).json({ id: uid, ...profile });
    }
    return res.json({ id: uid, ...snap.data() });
  } catch (err) {
    captureRouteError(err, 'auth/register');
    return res.status(500).json({ error: 'Profile creation failed' });
  }
};

authRouter.post('/auth/register', requireAuth, authRegisterHandler);

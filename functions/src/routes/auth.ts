/**
 * Auth routes — /api/auth/*
 *
 * POST /register and /login are handled client-side via Firebase Auth SDK.
 * Only /me and /register (Firestore profile creation) are needed here.
 */

import { Router, type Request, type Response } from 'express';
import { db, authAdmin } from '../admin';
import { requireAuth } from '../middleware/auth';
import { nowIso, generateSecureId } from './utils';

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
    console.error('[auth/me]:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

authRouter.get('/auth/me', requireAuth, authMeHandler);
authRouter.get('/auth/me', requireAuth, authMeHandler);

// ---------------------------------------------------------------------------
// POST /api/auth/register — create Firestore profile after Firebase Auth
// account creation. Idempotent: returns existing profile if already created.
// ---------------------------------------------------------------------------
const authRegisterHandler = async (req: Request, res: Response) => {
  const uid = req.user!.id;
  const { displayName, city, state, postcode, country, username } = req.body ?? {};
  const requestedRole = ['user', 'organizer'].includes(req.body?.role) ? req.body.role : 'user';
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
    console.error('[auth/register]:', err);
    return res.status(500).json({ error: 'Profile creation failed' });
  }
};

authRouter.post('/auth/register', requireAuth, authRegisterHandler);
authRouter.post('/auth/register', requireAuth, authRegisterHandler);

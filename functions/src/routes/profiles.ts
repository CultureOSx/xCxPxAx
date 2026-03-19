import { Router, Request, Response } from 'express';
import { db, isFirestoreConfigured } from '../admin';
import { profilesService } from '../services/firestore';
import { requireAuth } from '../middleware/auth';
import { moderationCheck } from '../middleware/moderation';
import { parseBody } from './utils';
import { z } from 'zod';
import seedCommunitiesRaw from '../data/seed-communities.json';

type SeedProfile = {
  name: string;
  entityType: string;
  category?: string;
  city?: string;
  country?: string;
  description?: string;
  members?: number;
  verified?: boolean;
  ownerId?: string;
  rating?: number;
  cpid?: string;
};

const seedProfiles = (seedCommunitiesRaw as SeedProfile[]).map((c, i) => ({
  ...c,
  id: c.cpid ?? `seed-${i}`,
  isVerified: c.verified,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}));

export const profilesRouter = Router();

const createProfileSchema = z.object({
  name: z.string().min(1),
  entityType: z.enum(['community', 'business', 'venue', 'artist', 'organisation', 'council', 'government', 'charity']),
  city: z.string().optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
});

/** GET /api/communities — list communities */
profilesRouter.get('/communities', async (req, res) => {
  if (!isFirestoreConfigured) {
    const communities = seedProfiles.filter(p => p.entityType === 'community');
    return res.json({ communities });
  }
  try {
    const communities = await profilesService.list({ entityType: 'community' });
    return res.json({ communities });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

/** GET /api/communities/nearby — list nearby communities */
profilesRouter.get('/communities/nearby', async (req, res) => {
  const city = String(req.query.city ?? '').trim();
  if (!isFirestoreConfigured) {
    const communities = seedProfiles.filter(
      p => p.entityType === 'community' && (!city || p.city?.toLowerCase() === city.toLowerCase())
    );
    return res.json({ communities });
  }
  try {
    const communities = await profilesService.list({ entityType: 'community', city });
    return res.json({ communities });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch nearby communities' });
  }
});

/** GET /api/communities/:id — community detail */
profilesRouter.get('/communities/:id', async (req, res) => {
  const id = String(req.params.id ?? '');
  if (!isFirestoreConfigured) {
    const community = seedProfiles.find(p => p.id === id && p.entityType === 'community');
    if (!community) return res.status(404).json({ error: 'Community not found' });
    return res.json(community);
  }
  try {
    const community = await profilesService.getById(id);
    if (!community || community.entityType !== 'community') return res.status(404).json({ error: 'Community not found' });
    return res.json(community);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch community' });
  }
});

/** GET /api/communities/:id/recommended-events — events associated with a community */
profilesRouter.get('/communities/:id/recommended-events', async (req, res) => {
  const communityId = String(req.params.id ?? '');
  if (!isFirestoreConfigured) return res.json([]);
  try {
    const snap = await db.collection('events')
      .where('communityId', '==', communityId)
      .where('status', '==', 'published')
      .limit(20)
      .get();
    const events = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch recommended events' });
  }
});

/** GET /api/profiles — list all profiles */
profilesRouter.get('/profiles', async (req, res) => {
  if (!isFirestoreConfigured) return res.json({ profiles: seedProfiles });
  try {
    const profiles = await profilesService.list({});
    return res.json({ profiles });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

/** GET /api/profiles/:id — profile detail */
profilesRouter.get('/profiles/:id', async (req, res) => {
  const id = String(req.params.id ?? '');
  if (!isFirestoreConfigured) {
    const profile = seedProfiles.find(p => p.id === id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    return res.json(profile);
  }
  try {
    const profile = await profilesService.getById(id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/** POST /api/profiles — create profile */
profilesRouter.post('/profiles', requireAuth, moderationCheck, async (req: Request, res: Response) => {
  try {
    const data = parseBody(createProfileSchema, req.body);
    const ownerId = req.user!.id;
    
    // profilesService.create returns the FirestoreProfile object
    const fresh = await profilesService.create({ ...data, ownerId });
    return res.status(201).json(fresh);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create profile' });
  }
});

/** PUT /api/profiles/:id — update profile */
profilesRouter.put('/profiles/:id', requireAuth, moderationCheck, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '');
    const updates = parseBody(createProfileSchema.partial(), req.body);
    
    const existing = await profilesService.getById(id);
    if (!existing) return res.status(404).json({ error: 'Profile not found' });
    if (existing.ownerId !== req.user!.id && req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    const updated = await profilesService.update(id, updates);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

/** DELETE /api/profiles/:id — delete profile */
profilesRouter.delete('/profiles/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '');
    const existing = await profilesService.getById(id);
    if (!existing) return res.status(404).json({ error: 'Profile not found' });
    if (existing.ownerId !== req.user!.id && req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    
    await profilesService.delete(id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete profile' });
  }
});

/** GET /api/businesses — list businesses */
profilesRouter.get('/businesses', async (req, res) => {
  try {
    const businesses = await profilesService.list({ entityType: 'business' });
    return res.json({ businesses });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

/** GET /api/businesses/:id — business detail */
profilesRouter.get('/businesses/:id', async (req, res) => {
  const id = String(req.params.id ?? '');
  try {
    const business = await profilesService.getById(id);
    if (!business || business.entityType !== 'business') return res.status(404).json({ error: 'Business not found' });
    return res.json(business);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch business' });
  }
});

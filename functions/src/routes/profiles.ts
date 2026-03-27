import { Router, Request, Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { db, isFirestoreConfigured } from '../admin';
import { profilesService } from '../services/firestore';
import { requireAuth } from '../middleware/auth';
import { moderationCheck } from '../middleware/moderation';
import { parseBody,
  captureRouteError,
  nowIso,
} from './utils';
import { z } from 'zod';

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
  // Cultural Identity Layer
  nationalityId: z.string().optional(),
  cultureIds: z.array(z.string()).optional(),
  languageIds: z.array(z.string()).optional(),
  diasporaGroupIds: z.array(z.string()).optional(),
  cultureTags: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  countryOfOrigin: z.string().optional(),
  isIndigenous: z.boolean().optional(),
});

/** GET /api/communities — list communities */
profilesRouter.get('/communities', async (req, res) => {
  if (!isFirestoreConfigured) return res.json({ communities: [] });
  try {
    const nationalityId = req.query.nationalityId ? String(req.query.nationalityId) : undefined;
    const cultureId     = req.query.cultureId     ? String(req.query.cultureId)     : undefined;
    let communities = await profilesService.list({ entityType: 'community' });
    if (nationalityId) {
      communities = communities.filter((c: any) =>
        c.nationalityId === nationalityId ||
        (Array.isArray(c.diasporaGroupIds) && c.diasporaGroupIds.includes(nationalityId))
      );
    }
    if (cultureId) {
      communities = communities.filter((c: any) =>
        Array.isArray(c.cultureIds) && c.cultureIds.includes(cultureId)
      );
    }
    return res.json({ communities });
  } catch (err) {
    captureRouteError(err, 'GET /api/communities');
    return res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

/** POST /api/communities — create a new community */
profilesRouter.post('/communities', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      name, description, communityCategory, city, country, imageUrl,
      nationalityId, cultureIds, languageIds, diasporaGroupIds,
      website, instagram, facebook, twitter, telegram, joinMode,
    } = req.body as {
      name?: string;
      description?: string;
      communityCategory?: string;
      city?: string;
      country?: string;
      imageUrl?: string;
      nationalityId?: string;
      cultureIds?: string[];
      languageIds?: string[];
      diasporaGroupIds?: string[];
      website?: string;
      instagram?: string;
      facebook?: string;
      twitter?: string;
      telegram?: string;
      joinMode?: 'open' | 'request' | 'invite';
    };

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await profilesService.create({
      entityType: 'community',
      name: name.trim(),
      description,
      category: communityCategory,
      city,
      country,
      imageUrl,
      nationalityId,
      cultureIds,
      languageIds,
      diasporaGroupIds,
      website,
      instagram,
      facebook,
      twitter,
      telegram,
      joinMode: joinMode || 'open',
      ownerId: req.user!.id,
      isVerified: false,
      status: 'published', // default for user-created communities
      handleStatus: 'pending',
    });

    return res.status(201).json({ community: result });
  } catch (err) {
    captureRouteError(err, 'POST /api/communities');
    return res.status(500).json({ error: 'Failed to create community' });
  }
});

/** GET /api/communities/nearby — list nearby communities */
profilesRouter.get('/communities/nearby', async (req, res) => {
  const city = String(req.query.city ?? '').trim();
  if (!isFirestoreConfigured) return res.json({ communities: [] });
  try {
    const communities = await profilesService.list({ entityType: 'community', city });
    return res.json({ communities });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch nearby communities' });
  }
});

/** GET /api/communities/joined — IDs of communities the current user has joined */
// IMPORTANT: This MUST be registered before /communities/:id or Express will match
// the literal string "joined" as the :id param, causing 404s on this endpoint.
profilesRouter.get('/communities/joined', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    if (!isFirestoreConfigured) return res.json({ communityIds: [] });
    const snap = await db.collection('communityMembers')
      .where('userId', '==', userId)
      .get();
    return res.json({ communityIds: snap.docs.map((d) => d.data().communityId as string) });
  } catch (err) {
    captureRouteError(err, 'GET /api/communities/joined');
    return res.status(500).json({ error: 'Failed to fetch joined communities' });
  }
});

/** GET /api/communities/:id — community detail */
profilesRouter.get('/communities/:id', async (req, res) => {
  const id = String(req.params.id ?? '');
  if (!isFirestoreConfigured) return res.status(404).json({ error: 'Community not found' });
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
  if (!isFirestoreConfigured) return res.json({ profiles: [] });
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
  if (!isFirestoreConfigured) return res.status(404).json({ error: 'Profile not found' });
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

// ---------------------------------------------------------------------------
// Community membership — join / leave / list joined
// ---------------------------------------------------------------------------

/** POST /api/communities/:id/join */
profilesRouter.post('/communities/:id/join', requireAuth, async (req: Request, res: Response) => {
  const communityId = String(req.params.id ?? '');
  const userId      = req.user!.id;
  try {
    if (isFirestoreConfigured) {
      const memberRef = db.collection('communityMembers').doc(`${userId}_${communityId}`);
      const existing  = await memberRef.get();
      if (!existing.exists) {
        await memberRef.set({ userId, communityId, joinedAt: nowIso() });
        await db.collection('profiles').doc(communityId)
          .update({ membersCount: FieldValue.increment(1) })
          .catch(() => {}); // non-fatal if profile doc doesn't exist yet
      }
    }
    return res.json({ success: true, communityId });
  } catch (err) {
    captureRouteError(err, 'POST /api/communities/:id/join');
    return res.status(500).json({ error: 'Failed to join community' });
  }
});

/** DELETE /api/communities/:id/leave */
profilesRouter.delete('/communities/:id/leave', requireAuth, async (req: Request, res: Response) => {
  const communityId = String(req.params.id ?? '');
  const userId      = req.user!.id;
  try {
    if (isFirestoreConfigured) {
      const memberRef = db.collection('communityMembers').doc(`${userId}_${communityId}`);
      const existing  = await memberRef.get();
      if (existing.exists) {
        await memberRef.delete();
        await db.collection('profiles').doc(communityId)
          .update({ membersCount: FieldValue.increment(-1) })
          .catch(() => {});
      }
    }
    return res.json({ success: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /api/communities/:id/leave');
    return res.status(500).json({ error: 'Failed to leave community' });
  }
});

// NOTE: /communities/joined was moved above /communities/:id to prevent route shadowing.

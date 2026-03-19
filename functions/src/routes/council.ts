import { Router, Request, Response } from 'express';
import { db } from '../admin';
import { requireAuth } from '../middleware/auth';
import { nowIso } from './utils';

export const councilRouter = Router();

/** GET /api/council/list — list councils */
councilRouter.get('/council/list', async (req: Request, res: Response) => {
  try {
    const snap = await db.collection('councils').get();
    return res.json({ councils: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch councils' });
  }
});

/** GET /api/council/selected — get user's selected council */
councilRouter.get('/council/selected', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const snap = await db.collection('userCouncilLinks').where('userId', '==', userId).where('isPrimary', '==', true).limit(1).get();
    if (snap.empty) return res.json({ council: null });
    
    const councilId = snap.docs[0].data().councilId;
    const councilDoc = await db.collection('councils').doc(councilId).get();
    if (!councilDoc.exists) return res.json({ council: null });
    
    return res.json({ council: { id: councilDoc.id, ...councilDoc.data() } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch selected council' });
  }
});

/** GET /api/council/my — compatibility endpoint for dashboard lookups */
councilRouter.get('/council/my', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const city = String(req.query.city ?? '').trim().toLowerCase();
  const state = String(req.query.state ?? '').trim().toLowerCase();

  try {
    // 1) Prefer explicitly selected council.
    const selectedSnap = await db
      .collection('userCouncilLinks')
      .where('userId', '==', userId)
      .where('isPrimary', '==', true)
      .limit(1)
      .get();

    if (!selectedSnap.empty) {
      const councilId = selectedSnap.docs[0].data().councilId as string | undefined;
      if (councilId) {
        const councilDoc = await db.collection('councils').doc(councilId).get();
        if (councilDoc.exists) {
          return res.json({
            council: { id: councilDoc.id, ...councilDoc.data() },
            events: [],
            preferences: [],
            alerts: [],
            waste: [],
            facilities: [],
            grants: [],
            links: [],
            reminder: null,
            following: [],
          });
        }
      }
    }

    // 2) Fallback: best-effort city/state match.
    const allCouncils = await db.collection('councils').limit(500).get();
    const matched = allCouncils.docs.find((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const dataCity = String(data.city ?? data.suburb ?? '').toLowerCase();
      const dataState = String(data.state ?? data.region ?? '').toLowerCase();
      if (city && state) return dataCity === city && dataState === state;
      if (city) return dataCity === city;
      if (state) return dataState === state;
      return false;
    });

    if (!matched) {
      return res.json({
        council: null,
        events: [],
        preferences: [],
        alerts: [],
        waste: [],
        facilities: [],
        grants: [],
        links: [],
        reminder: null,
        following: [],
      });
    }

    return res.json({
      council: { id: matched.id, ...matched.data() },
      events: [],
      preferences: [],
      alerts: [],
      waste: [],
      facilities: [],
      grants: [],
      links: [],
      reminder: null,
      following: [],
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resolve council' });
  }
});

/** POST /api/council/select — select user's primary council */
councilRouter.post('/council/select', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { councilId } = req.body;
  if (!councilId) return res.status(400).json({ error: 'councilId is required' });
  
  try {
    const batch = db.batch();
    const existing = await db.collection('userCouncilLinks').where('userId', '==', userId).get();
    existing.docs.forEach(d => batch.delete(d.ref));
    
    const newRef = db.collection('userCouncilLinks').doc();
    batch.set(newRef, { userId, councilId, isPrimary: true, updatedAt: nowIso() });
    await batch.commit();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to select council' });
  }
});

/** GET /api/council/:id — council detail */
councilRouter.get('/council/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id ?? '');
  try {
    const doc = await db.collection('councils').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Council not found' });
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch council' });
  }
});

/** GET /api/council/:id/waste — waste schedule */
councilRouter.get('/council/:id/waste', async (req: Request, res: Response) => {
  const id = String(req.params.id ?? '');
  try {
    const snap = await db.collection('wasteSchedules').where('institutionId', '==', id).limit(1).get();
    if (snap.empty) return res.json({ schedule: null });
    return res.json({ schedule: { id: snap.docs[0].id, ...snap.docs[0].data() } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch waste schedule' });
  }
});

/** GET /api/council/:id/alerts — council alerts */
councilRouter.get('/council/:id/alerts', async (req: Request, res: Response) => {
  const id = String(req.params.id ?? '');
  try {
    const snap = await db.collection('councilAlerts').where('councilId', '==', id).orderBy('createdAt', 'desc').limit(20).get();
    return res.json({ alerts: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/** GET /api/council/:id/grants — council grants */
councilRouter.get('/council/:id/grants', async (req: Request, res: Response) => {
  const id = String(req.params.id ?? '');
  try {
    const snap = await db.collection('councilGrants').where('councilId', '==', id).get();
    return res.json({ grants: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch grants' });
  }
});

/** POST /api/council/:id/claim — claim a council (staff tool) */
councilRouter.post('/council/:id/claim', requireAuth, async (req: Request, res: Response) => {
  const id = String(req.params.id ?? '');
  const { workEmail, roleTitle } = req.body;
  
  if (!workEmail || !roleTitle) return res.status(400).json({ error: 'Email and role required' });
  
  try {
    const claim = {
      councilId: id,
      userId: req.user!.id,
      workEmail,
      roleTitle,
      status: 'pending_admin_review',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.collection('councilClaims').add(claim);
    return res.status(201).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit claim' });
  }
});

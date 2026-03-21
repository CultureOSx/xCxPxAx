import { Router, Request, Response } from 'express';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth } from '../middleware/auth';
import { parseBody, nowIso,
  captureRouteError,
} from './utils';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

export const perksRouter = Router();

/** GET /api/perks — list all available perks */
perksRouter.get('/perks', async (req, res) => {
  if (isFirestoreConfigured) {
    const snap = await db.collection('perks').where('status', '==', 'active').get();
    return res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }
  // Mock perks
  return res.json([
    { id: 'p1', title: '20% Off Partner Cafes', description: 'Save on selected Sydney partner cafes.', perkType: 'discount_percent', discountPercent: 20, status: 'active' }
  ]);
});

/** POST /api/perks/:id/redeem — redeem a perk */
perksRouter.post('/perks/:id/redeem', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  if (isFirestoreConfigured) {
    const ref = db.collection('redemptions').doc();
    await ref.set({
      perkId: id,
      userId,
      redeemedAt: nowIso()
    });
    return res.json({ ok: true, redemptionId: ref.id });
  }

  return res.json({ ok: true, redemptionId: randomUUID() });
});

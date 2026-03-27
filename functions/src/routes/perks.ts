import { Router, Request, Response } from 'express';
import { db, isFirestoreConfigured } from '../admin';
import { requireAuth } from '../middleware/auth';
import { parseBody, nowIso,
  captureRouteError,
} from './utils';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Perk } from '../../../shared/schema/perk';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const RedeemSchema = z.object({
  userLat: z.number().optional(),
  userLng: z.number().optional(),
  userLgaCode: z.string().optional(),
});

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
    try {
      const { userLat, userLng, userLgaCode } = parseBody(RedeemSchema, req.body);
      const perkDoc = await db.collection('perks').doc(id as string).get();
      if (!perkDoc.exists) return res.status(404).json({ error: 'Perk not found' });
      
      const perk = perkDoc.data() as Perk;

      // 1. Council validation
      if (perk.lgaCode && perk.lgaCode !== userLgaCode) {
        return res.status(403).json({ error: `This perk is exclusively available in ${perk.lgaCode}.` });
      }

      // 2. Geofence Distance validation
      if (perk.lat && perk.lng && perk.radiusKm) {
        if (!userLat || !userLng) {
          return res.status(400).json({ error: 'Location coordinates must be provided to unlock this local perk.' });
        }
        const distKm = getDistanceKm(perk.lat, perk.lng, userLat, userLng);
        if (distKm > perk.radiusKm) {
          return res.status(403).json({ error: `You are too far! Must be within ${perk.radiusKm}km to redeem.` });
        }
      }

      const ref = db.collection('redemptions').doc();
      await ref.set({
        perkId: id,
        userId,
        redeemedAt: nowIso()
      });
      return res.json({ ok: true, redemptionId: ref.id });
    } catch (err) {
      captureRouteError(err, `POST /api/perks/${id}/redeem`);
      return res.status(500).json({ error: 'Failed to redeem perk' });
    }
  }

  return res.json({ ok: true, redemptionId: randomUUID() });
});

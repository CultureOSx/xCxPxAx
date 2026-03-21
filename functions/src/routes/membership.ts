/**
 * Membership routes — /api/membership/*
 *
 * CulturePass+ subscription management via Stripe.
 * Endpoints: member-count, get by userId, subscribe, cancel-subscription.
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, isOwnerOrAdmin } from '../middleware/auth';
import { usersService } from '../services/firestore';
import { db, stripeClient, authAdmin } from '../admin';
import { buildMembershipResponse, qparam,
  captureRouteError,
} from './utils';

export const membershipRouter = Router();

// ── GET /api/membership/member-count ─────────────────────────────────────────
// Public — used on the upgrade screen to show social proof ("X members")
membershipRouter.get('/membership/member-count', async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('users')
      .where('membership.isActive', '==', true)
      .select() // fetch only document IDs to minimise read cost
      .get();
    return res.json({ count: snap.size });
  } catch (err) {
    captureRouteError(err, 'membership/member-count');
    return res.status(500).json({ error: 'Failed to count members' });
  }
});

// ── GET /api/membership/:userId ───────────────────────────────────────────────
// Owner or admin only
membershipRouter.get('/membership/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = qparam(req.params['userId']);
  if (!isOwnerOrAdmin(req.user!, userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const user = await usersService.getById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const m = user.membership;
  return res.json(buildMembershipResponse({
    tier:     m?.tier ?? 'free',
    isActive: m?.isActive ?? false,
    expiresAt: m?.expiresAt ?? null,
  }));
});

// ── POST /api/membership/subscribe ───────────────────────────────────────────
const subscribeSchema = z.object({
  billingPeriod: z.enum(['monthly', 'yearly']),
});

membershipRouter.post('/membership/subscribe', requireAuth, async (req: Request, res: Response) => {
  let parsed: z.infer<typeof subscribeSchema>;
  try {
    parsed = subscribeSchema.parse(req.body);
  } catch {
    return res.status(400).json({ error: 'billingPeriod must be "monthly" or "yearly"' });
  }

  const userId = req.user!.id;
  const user = await usersService.getById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const m = user.membership;
  const alreadyActive = m?.isActive === true && (m?.tier ?? 'free') !== 'free';
  if (alreadyActive) {
    return res.json({
      checkoutUrl: null,
      alreadyActive: true,
      membership: buildMembershipResponse({ tier: m?.tier, isActive: m?.isActive, expiresAt: m?.expiresAt }),
    });
  }

  if (!stripeClient) {
    return res.status(503).json({ error: 'Payment service unavailable', code: 'STRIPE_NOT_CONFIGURED' });
  }

  const priceId = parsed.billingPeriod === 'yearly'
    ? process.env.STRIPE_PRICE_YEARLY_ID
    : process.env.STRIPE_PRICE_MONTHLY_ID;

  if (!priceId) {
    return res.status(503).json({ error: 'Subscription price not configured', code: 'PRICE_NOT_CONFIGURED' });
  }

  // Get or create Stripe customer
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripeClient.customers.create({
      email: user.email,
      name: user.displayName ?? user.username ?? undefined,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;
    await usersService.upsert(userId, { stripeCustomerId });
  }

  const appUrl = process.env.APP_URL ?? 'https://culturepass.app';

  try {
    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: userId,
      metadata: { userId },
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId },
      },
      success_url: `${appUrl}/membership/upgrade?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url:  `${appUrl}/membership/upgrade?status=cancelled`,
    });

    return res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (err) {
    captureRouteError(err, 'membership/subscribe');
    return res.status(500).json({ error: 'Failed to create subscription checkout' });
  }
});

// ── POST /api/membership/cancel-subscription ─────────────────────────────────
membershipRouter.post('/membership/cancel-subscription', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await usersService.getById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.stripeSubscriptionId) {
    return res.status(400).json({ error: 'No active subscription found' });
  }

  if (!stripeClient) {
    return res.status(503).json({ error: 'Payment service unavailable', code: 'STRIPE_NOT_CONFIGURED' });
  }

  try {
    // Cancel at period end — user retains access until their paid period expires
    await stripeClient.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const m = user.membership;
    return res.json({
      success: true,
      membership: buildMembershipResponse({ tier: m?.tier, isActive: m?.isActive, expiresAt: m?.expiresAt }),
    });
  } catch (err) {
    captureRouteError(err, 'membership/cancel-subscription');
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

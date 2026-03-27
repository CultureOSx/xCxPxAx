/**
 * Ticket routes — /api/tickets/*  +  /api/ticket/:id
 */

import { Router, type Request, type Response } from 'express';
import { firestore } from 'firebase-admin';
import { requireAuth, requireRole, isOwnerOrAdmin } from '../middleware/auth';
import { slidingWindowRateLimit } from '../middleware/rateLimit';
import {
  ticketsService,
  scanEventsService,
  type FirestoreEvent,
} from '../services/firestore';
import { db, isFirestoreConfigured } from '../admin';
import { nowIso, qparam, generateSecureId, awardRewardsPoints,
  captureRouteError,
} from './utils';

export const ticketsRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/tickets/:userId — list tickets for a user
// ---------------------------------------------------------------------------
ticketsRouter.get('/tickets/:userId', requireAuth, async (req: Request, res: Response) => {
  if (!isOwnerOrAdmin(req.user!, qparam(req.params.userId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const userTickets = await ticketsService.listForUser(qparam(req.params.userId));
    return res.json(userTickets);
  } catch (err) {
    captureRouteError(err, 'GET /api/tickets/:userId');
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/tickets/:userId/count — confirmed ticket count for a user
// ---------------------------------------------------------------------------
ticketsRouter.get('/tickets/:userId/count', requireAuth, async (req: Request, res: Response) => {
  if (!isOwnerOrAdmin(req.user!, qparam(req.params.userId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const userTickets = await ticketsService.listForUser(qparam(req.params.userId));
    const count = userTickets.filter((t) => t.status === 'confirmed').length;
    return res.json({ count });
  } catch (err) {
    captureRouteError(err, 'GET /api/tickets/:userId/count');
    return res.status(500).json({ error: 'Failed to count tickets' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/ticket/:id (singular) — fetch a single ticket by ID
// ---------------------------------------------------------------------------
ticketsRouter.get('/ticket/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticket = await ticketsService.getById(qparam(req.params.id));
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json(ticket);
  } catch (err) {
    captureRouteError(err, 'GET /api/ticket/:id');
    return res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/tickets/:id/cancel
// ---------------------------------------------------------------------------
ticketsRouter.put('/tickets/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticket = await ticketsService.getById(qparam(req.params.id));
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (ticket.status === 'used') {
      return res.status(400).json({ error: 'Used tickets cannot be cancelled' });
    }
    const updated = await ticketsService.updateStatus(qparam(req.params.id), 'cancelled', req.user!.id);
    return res.json(updated);
  } catch (err) {
    captureRouteError(err, 'PUT /api/tickets/:id/cancel');
    return res.status(500).json({ error: 'Failed to cancel ticket' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tickets/scan — staff QR scan
// ---------------------------------------------------------------------------
ticketsRouter.post(
  '/tickets/scan',
  requireAuth,
  requireRole('organizer', 'moderator', 'admin'),
  async (req: Request, res: Response) => {
    const qrCode = String(req.body?.ticketCode ?? '').trim();
    if (!qrCode) return res.status(400).json({ valid: false, error: 'ticketCode is required' });

    try {
      const ticket = await ticketsService.getByQrCode(qrCode);
      if (!ticket) {
        return res.status(404).json({ valid: false, error: 'Invalid ticket code' });
      }
      if (ticket.status !== 'confirmed') {
        return res.status(400).json({ valid: false, error: `Ticket is ${ticket.status}`, ticket });
      }
      const updated = await ticketsService.updateStatus(ticket.id, 'used', req.user!.id);
      await scanEventsService.record({
        ticketId: ticket.id,
        eventId: ticket.eventId,
        scannedBy: req.user!.id,
        outcome: 'accepted',
      });
      return res.json({ valid: true, message: 'Ticket scanned successfully', ticket: updated });
    } catch (err) {
      captureRouteError(err, 'POST /api/tickets/scan');
      return res.status(500).json({ valid: false, error: 'Scan failed' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/tickets/:id/history
// ---------------------------------------------------------------------------
ticketsRouter.get('/tickets/:id/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const ticket = await ticketsService.getById(qparam(req.params.id));
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json({ history: ticket.history });
  } catch (err) {
    captureRouteError(err, 'GET /api/tickets/:id/history');
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/tickets/admin/scan-events
// ---------------------------------------------------------------------------
ticketsRouter.get(
  '/tickets/admin/scan-events',
  requireAuth,
  requireRole('moderator', 'admin'),
  (_req: Request, res: Response) => {
    res.json([]); // Not yet implemented
  }
);

// ---------------------------------------------------------------------------
// Wallet pass URLs
// ---------------------------------------------------------------------------
ticketsRouter.get('/tickets/:id/wallet/apple', requireAuth, async (req: Request, res: Response) => {
  const ticket = await ticketsService.getById(qparam(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.status(501).json({ error: 'Apple Wallet passes are not yet available', code: 'WALLET_NOT_IMPLEMENTED' });
});

ticketsRouter.get('/tickets/:id/wallet/google', requireAuth, async (req: Request, res: Response) => {
  const ticket = await ticketsService.getById(qparam(req.params.id));
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (!isOwnerOrAdmin(req.user!, ticket.userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return res.status(501).json({ error: 'Google Wallet passes are not yet available', code: 'WALLET_NOT_IMPLEMENTED' });
});

// ---------------------------------------------------------------------------
// POST /api/tickets — purchase a ticket (Firestore atomic transaction)
// ---------------------------------------------------------------------------
ticketsRouter.post('/tickets', requireAuth, slidingWindowRateLimit(60000, 20), async (req: Request, res: Response) => {
  if (!isFirestoreConfigured) {
    return res.status(503).json({ error: 'Ticket purchase requires a Firestore project — use the emulator or deploy to Firebase.' });
  }

  const userId  = req.user!.id;
  const eventId = String(req.body?.eventId ?? '');
  if (!eventId) return res.status(400).json({ error: 'eventId is required' });

  try {
    const quantity = Number(req.body?.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Ticket quantity must be a positive integer' });
    }

    const eventRef  = db.collection('events').doc(eventId);
    const ticketRef = db.collection('tickets').doc();

    const ticket = await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists) throw new Error('EVENT_NOT_FOUND');

      const event = eventDoc.data() as FirestoreEvent;
      if (event.capacity != null && (event.attending ?? 0) + quantity > event.capacity) {
        throw new Error('NOT_ENOUGH_CAPACITY');
      }

      const priceCents = Number(req.body?.priceCents ?? event.priceCents ?? 0);
      const qrCode = generateSecureId('CP-T-');

      const newTicketPayload = {
        id:              ticketRef.id,
        eventId,
        userId,
        tierName:        String(req.body?.tierName ?? 'General'),
        quantity,
        priceCents,
        totalPriceCents: priceCents * quantity,
        status:          'confirmed' as const,
        paymentStatus:   'paid'      as const,
        qrCode,
        cpTicketId:      qrCode,
        history:         [{ action: 'ticket_created', timestamp: nowIso(), actorId: 'system' }],
        createdAt:       nowIso(),
        updatedAt:       nowIso(),
        // Denormalized for performance
        eventTitle: event.title,
        eventDate:  event.date,
        eventVenue: event.venue,
        imageColor: event.imageColor,
      };

      transaction.set(ticketRef, newTicketPayload);
      transaction.update(eventRef, { attending: firestore.FieldValue.increment(quantity) });

      return newTicketPayload;
    });

    const totalPriceCents = Number(ticket.totalPriceCents ?? ticket.priceCents ?? 0);
    const rewardPoints = await awardRewardsPoints(userId, totalPriceCents, {
      ticketId: ticket.id ?? ticketRef.id,
      source: 'ticket purchase',
    });
    if (rewardPoints > 0) {
      await ticketsService.update(ticketRef.id, {
        rewardPointsEarned:    rewardPoints,
        rewardPointsAwardedAt: nowIso(),
      });
    }

    return res.status(201).json(ticket);
  } catch (err) {
    captureRouteError(err, 'POST /api/tickets');
    if (err instanceof Error) {
      if (err.message === 'EVENT_NOT_FOUND') return res.status(404).json({ error: 'Event not found' });
      if (err.message === 'NOT_ENOUGH_CAPACITY') return res.status(400).json({ error: 'Not enough tickets available for this quantity' });
    }
    return res.status(500).json({ error: 'Failed to purchase ticket' });
  }
});

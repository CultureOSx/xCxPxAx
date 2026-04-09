/**
 * Events routes — /api/events/*
 *
 * Uses a factory function so that in-memory dev fallbacks (events, councils,
 * feedback store) defined in app.ts can be injected without creating a
 * circular import.
 */

import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, isOwnerOrAdmin } from '../middleware/auth';
import { slidingWindowRateLimit } from '../middleware/rateLimit';
import { moderationCheck } from '../middleware/moderation';
import {
  eventsService,
  eventFeedbackService,
  type FirestoreEvent,
  normalizeEventImageForClient,
  normalizeEventListForClient,
} from '../services/firestore';
import { nowIso, qparam, qstr, generateSecureId, resolveAustralianLocation, type ResolvedLocation,
  captureRouteError,
} from './utils';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../admin';
import { validatePublisherProfileLink, validateVenueProfileLink } from '../services/eventProfileLinks';

// ---------------------------------------------------------------------------
// Shared types (inlined to avoid circular import with app.ts)
// ---------------------------------------------------------------------------

type DevAppEvent = {
  id: string;
  title: string;
  description: string;
  communityId: string;
  venue: string;
  date: string;
  time: string;
  city: string;
  state?: string;
  postcode?: number;
  latitude?: number;
  longitude?: number;
  country: string;
  imageColor?: string;
  imageUrl?: string;
  category?: string;
  priceCents?: number;
  organizerId?: string;
  organizer?: string;
  isFree?: boolean;
  isFeatured?: boolean;
  cultureTag?: string[];
  tags?: string[];
  indigenousTags?: string[];
  languageTags?: string[];
  eventType?: string;
  capacity?: number;
  attending?: number;
  deletedAt?: string | null;
  tiers?: { name: string; priceCents: number; available: number }[];
  createdAt?: string;
  updatedAt?: string;
};

type DevCouncil = {
  id: string;
  name: string;
  state: string;
  servicePostcodes: number[];
  serviceSuburbs: string[];
  serviceCities: string[];
};

type DevFeedbackEntry = {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
};



// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const eventFeedbackSchema = z.object({
  rating:  z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),
});

const eventTierSchema = z.object({
  name:       z.string().min(1),
  priceCents: z.coerce.number().int().min(0),
  available:  z.coerce.number().int().min(0),
});

const createEventSchema = z.object({
  title:       z.string().min(1, 'title is required').max(200),
  description: z.string().max(5000).optional(),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  time:        z.string().max(20).optional(),
  venue:       z.string().max(200).optional(),
  address:     z.string().max(500).optional(),
  city:        z.string().max(100).optional(),
  state:       z.string().max(10).optional(),
  postcode:    z.coerce.number().int().min(200).max(9999).optional(),
  country:     z.string().max(100).optional(),
  latitude:    z.coerce.number().optional(),
  longitude:   z.coerce.number().optional(),
  communityId: z.string().max(100).optional(),
  imageUrl:    z.string().url('imageUrl must be a valid URL').optional().or(z.literal('')),
  imageColor:  z.string().max(20).optional(),
  priceCents:  z.coerce.number().int().min(0).optional(),
  priceLabel:  z.string().max(50).optional(),
  category:    z.string().max(100).optional(),
  eventType:   z.enum(['festival', 'concert', 'workshop', 'puja', 'sports', 'food', 'cultural', 'community', 'exhibition', 'conference', 'other']).optional(),
  ageSuitability: z.string().max(20).optional(),
  priceTier:   z.string().max(20).optional(),
  capacity:    z.coerce.number().int().min(1).optional(),
  isFree:      z.coerce.boolean().optional(),
  isFeatured:  z.coerce.boolean().optional(),
  /** Listing form — stored for moderator / organiser contact */
  contactEmail: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().email().optional(),
  ),
  tiers:       z.array(eventTierSchema).max(10).optional(),
  tags:        z.array(z.string().max(50)).max(20).optional(),
  cultureTag:  z.array(z.string().max(50)).max(20).optional(),
  indigenousTags: z.array(z.string().max(50)).max(10).optional(),
  languageTags:   z.array(z.string().max(50)).max(10).optional(),
  organizer:   z.string().max(200).optional(),
  externalTicketUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
  geoHash:     z.string().max(20).optional(),
  organizerReputationScore: z.coerce.number().int().min(0).max(100).optional(),
  hostName:    z.string().max(200).optional().or(z.null()),
  hostEmail:   z.string().email().optional().or(z.literal('')).or(z.null()),
  hostPhone:   z.string().max(30).optional().or(z.null()),
  sponsors:    z.string().max(500).optional().or(z.null()),
  // Enhanced creation fields
  entryType:   z.enum(['ticketed', 'free_open']).optional(),
  endDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  endTime:     z.string().max(20).optional(),
  heroImageUrl: z.string().url().optional().or(z.literal('')),
  artists: z.array(z.object({
    profileId: z.string().optional(),
    name:      z.string().min(1).max(200),
    role:      z.string().max(50).optional(),
    imageUrl:  z.string().url().optional().or(z.literal('')),
  })).max(20).optional(),
  eventSponsors: z.array(z.object({
    profileId:  z.string().optional(),
    name:       z.string().min(1).max(200),
    tier:       z.enum(['title', 'gold', 'silver', 'bronze']),
    logoUrl:    z.string().url().optional().or(z.literal('')),
    websiteUrl: z.string().url().optional().or(z.literal('')),
  })).max(20).optional(),
  hostInfo: z.object({
    profileId:    z.string().optional(),
    name:         z.string().min(1).max(200),
    contactEmail: z.string().email().optional().or(z.literal('')),
    contactPhone: z.string().max(30).optional(),
    websiteUrl:   z.string().url().optional().or(z.literal('')),
  }).nullable().optional(),
  /** Directory profile that owns this listing (see docs/PROFILE_PUBLISHING_AND_MARKETPLACE_GAPS.md) */
  publisherProfileId: z.string().min(1).max(128).optional(),
  /** Linked venue-style profile (entityType venue | business | restaurant) */
  venueProfileId: z.string().min(1).max(128).optional(),
});

const updateEventSchema = createEventSchema.partial().extend({
  publisherProfileId: z.union([z.string().min(1).max(128), z.literal('')]).optional(),
  venueProfileId: z.union([z.string().min(1).max(128), z.literal('')]).optional(),
});

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new Error(result.error.errors.map((e) => e.message).join(', '));
  return result.data;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createEventsRouter() {

  const router = Router();

  // ── GET /api/events ────────────────────────────────────────────────────────
  router.get('/events', slidingWindowRateLimit(60000, 100), async (req: Request, res: Response) => {
    try {
      const city        = qstr(req.query.city).trim()        || undefined;
      const country     = qstr(req.query.country).trim()     || undefined;
      const category    = qstr(req.query.category).trim()    || undefined;
      const eventType   = qstr(req.query.eventType).trim()   || undefined;
      const dateFrom    = qstr(req.query.dateFrom).trim()    || undefined;
      const dateTo      = qstr(req.query.dateTo).trim()      || undefined;
      const organizerId = qstr(req.query.organizerId).trim() || undefined;
      const communityId = qstr(req.query.communityId).trim() || undefined;
      const isFeatured  = qstr(req.query.isFeatured) === 'true' ? true : undefined;
      const isFreeStr   = qstr(req.query.isFree).trim();
      const isFree      = isFreeStr === 'true' ? true : isFreeStr === 'false' ? false : undefined;
      const venue       = qstr(req.query.venue).trim() || undefined;
      const time        = qstr(req.query.time).trim() || undefined;
      const publisherProfileId = qstr(req.query.publisherProfileId).trim() || undefined;
      const venueProfileId = qstr(req.query.venueProfileId).trim() || undefined;

      const centerLatStr  = qstr(req.query.centerLat).trim();
      const centerLngStr  = qstr(req.query.centerLng).trim();
      const radiusInKmStr = qstr(req.query.radiusInKm).trim();
      const centerLat   = centerLatStr  ? parseFloat(centerLatStr)  : undefined;
      const centerLng   = centerLngStr  ? parseFloat(centerLngStr)  : undefined;
      const radiusInKm  = radiusInKmStr ? parseFloat(radiusInKmStr) : undefined;

      const page     = Math.max(1, parseInt(qstr(req.query.page)     || '1',  10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(qstr(req.query.pageSize) || '20', 10) || 20));

      const result = await eventsService.list(
        {
          city,
          country,
          category,
          eventType,
          dateFrom,
          dateTo,
          isFeatured,
          organizerId,
          communityId,
          centerLat,
          centerLng,
          radiusInKm,
          isFree,
          venue,
          time,
          publisherProfileId,
          venueProfileId,
        },
        { page, pageSize },
      );

      return res.json({
        events:      normalizeEventListForClient(result.items),
        total:       result.total,
        page:        result.page,
        pageSize:    result.pageSize,
        hasNextPage: result.hasNextPage,
      });
    } catch (err) {
      captureRouteError(err, 'GET /api/events');
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // ── GET /api/events/cross-community ───────────────────────────────────────
  router.get('/events/cross-community', async (_req: Request, res: Response) => {
    try {
      const result = await eventsService.list({ status: 'published' }, { page: 1, pageSize: 50 });
      const cross = result.items.filter((e) => (e.cultureTag?.length ?? 0) >= 2);
      return res.json(normalizeEventListForClient(cross));
    } catch (err) {
      captureRouteError(err, 'GET /api/events/cross-community');
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // ── GET /api/events/nearby ─────────────────────────────────────────────────
  // Required: lat, lng. Optional: radius (km, default 10), pageSize (default 20)
  router.get('/events/nearby', slidingWindowRateLimit(60000, 100), async (req: Request, res: Response) => {
    const lat = parseFloat(qstr(req.query.lat));
    const lng = parseFloat(qstr(req.query.lng));
    const radius = parseFloat(qstr(req.query.radius) || '10');
    const pageSize = Math.min(50, Math.max(1, parseInt(qstr(req.query.pageSize) || '20', 10) || 20));

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng query params are required' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'lat/lng out of range' });
    }

    try {
      const result = await eventsService.list(
        { centerLat: lat, centerLng: lng, radiusInKm: radius },
        { page: 1, pageSize },
      );
      return res.json({
        events: normalizeEventListForClient(result.items),
        total: result.total,
        radiusKm: radius,
      });
    } catch (err) {
      captureRouteError(err, 'GET /api/events/nearby');
      return res.status(500).json({ error: 'Failed to fetch nearby events' });
    }
  });

  // ── GET /api/events/:id ────────────────────────────────────────────────────
  router.get('/events/:id', async (req: Request, res: Response) => {
    try {
      const event = await eventsService.getById(qparam(req.params.id));
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.json(normalizeEventImageForClient(event));
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id');
      return res.status(500).json({ error: 'Failed to fetch event' });
    }
  });

  // ── POST /api/events ───────────────────────────────────────────────────────
  router.post(
    '/events',
    requireAuth,
    requireRole('organizer', 'admin'),
    moderationCheck,
    async (req: Request, res: Response) => {
      const parseResult = createEventSchema.safeParse(req.body ?? {});
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(', ') });
      }
      const b = parseResult.data;

      const resolvedResult = resolveAustralianLocation(b as Record<string, unknown>, true);
      if (resolvedResult.error || !resolvedResult.location) {
        return res.status(400).json({ error: resolvedResult.error ?? 'invalid location payload' });
      }
      const loc = resolvedResult.location;

      if (b.endDate && b.endDate < b.date) {
        return res.status(400).json({ error: 'endDate cannot be before start date' });
      }

      if (b.publisherProfileId) {
        const pv = await validatePublisherProfileLink(req.user!, b.publisherProfileId);
        if (!pv.ok) return res.status(pv.status).json({ error: pv.error });
      }
      if (b.venueProfileId) {
        const vv = await validateVenueProfileLink(req.user!, b.venueProfileId);
        if (!vv.ok) return res.status(vv.status).json({ error: vv.error });
      }

      // Resolve council LGA from location (best-effort, non-blocking)
      let lgaCode: string | null = null;
      let councilId: string | null = null;
      try {
        const q = db.collection('councils').where('state', '==', loc.state).limit(100);
        const councilSnap = await q.get();
        if (!councilSnap.empty) {
          type CouncilDoc = { lgaCode?: string; suburb?: string; name?: string };
          const lowerCity = loc.city.toLowerCase();
          const match = councilSnap.docs.find((d) => {
            const data = d.data() as CouncilDoc;
            return (data.suburb ?? '').toLowerCase() === lowerCity ||
                   (data.name ?? '').toLowerCase().includes(lowerCity);
          });
          if (match) {
            lgaCode = (match.data() as CouncilDoc).lgaCode ?? null;
            councilId = match.id;
          }
        }
      } catch {
        // Non-critical: event creation proceeds without LGA
      }

      try {
        const event = await eventsService.create({
          title:       String(b.title),
          description: String(b.description ?? ''),
          communityId: String(b.communityId ?? (Array.isArray(b.cultureTag) ? b.cultureTag[0] : '') ?? ''),
          venue:    String(b.venue ?? ''),
          address:  b.address  ? String(b.address)  : undefined,
          date:     String(b.date),
          time:     String(b.time ?? ''),
          city:     loc.city,
          state:    loc.state,
          postcode: loc.postcode,
          suburb:   loc.city,
          latitude: loc.latitude,
          longitude: loc.longitude,
          country:  loc.country,
          imageUrl:  b.imageUrl  ? String(b.imageUrl)  : undefined,
          imageColor: b.imageColor ? String(b.imageColor) : undefined,
          organizer:   b.organizer   ? String(b.organizer)   : undefined,
          organizerId: req.user!.id,
          priceCents:  b.priceCents  != null ? Number(b.priceCents)  : undefined,
          priceLabel:  b.priceLabel  ? String(b.priceLabel)  : undefined,
          category:    b.category    ? String(b.category)    : undefined,
          capacity:    b.capacity    != null ? Number(b.capacity)    : undefined,
          attending:   0,
          isFree:    b.isFree    != null ? Boolean(b.isFree)    : true,
          isFeatured: b.isFeatured != null ? Boolean(b.isFeatured) : false,
          contactEmail: b.contactEmail ? String(b.contactEmail) : undefined,
          tiers:     Array.isArray(b.tiers)        ? b.tiers        : undefined,
          tags:      Array.isArray(b.tags)         ? b.tags         : undefined,
          indigenousTags: Array.isArray(b.indigenousTags) ? b.indigenousTags : undefined,
          languageTags:   Array.isArray(b.languageTags)   ? b.languageTags   : undefined,
          cultureTag: Array.isArray(b.cultureTag)  ? b.cultureTag  : undefined,
          geoHash:   b.geoHash   ? String(b.geoHash)   : undefined,
          eventType: b.eventType ? String(b.eventType) : undefined,
          ageSuitability: b.ageSuitability ? String(b.ageSuitability) : undefined,
          priceTier: b.priceTier ? String(b.priceTier) : undefined,
          organizerReputationScore: b.organizerReputationScore != null ? Number(b.organizerReputationScore) : 50,
          externalTicketUrl: b.externalTicketUrl ? String(b.externalTicketUrl) : null,
          hostName:  b.hostName  ? String(b.hostName)  : null,
          hostEmail: b.hostEmail ? String(b.hostEmail) : null,
          hostPhone: b.hostPhone ? String(b.hostPhone) : null,
          sponsors:  b.sponsors  ? String(b.sponsors)  : null,
          // Enhanced fields
          entryType:    b.entryType ?? (b.isFree ? 'free_open' : 'ticketed'),
          endDate:      b.endDate  ? String(b.endDate)  : undefined,
          endTime:      b.endTime  ? String(b.endTime)  : undefined,
          heroImageUrl: b.heroImageUrl ? String(b.heroImageUrl) : undefined,
          artists:       Array.isArray(b.artists)       ? b.artists       : undefined,
          eventSponsors: Array.isArray(b.eventSponsors) ? b.eventSponsors : undefined,
          hostInfo:      b.hostInfo ?? null,
          cpid: generateSecureId('CP-E-'),
          lgaCode,
          councilId,
          status: 'draft',
          ...(b.publisherProfileId ? { publisherProfileId: String(b.publisherProfileId) } : {}),
          ...(b.venueProfileId ? { venueProfileId: String(b.venueProfileId) } : {}),
        });
        return res.status(201).json(normalizeEventImageForClient(event));
      } catch (err) {
        captureRouteError(err, 'POST /api/events');
        return res.status(500).json({ error: 'Failed to create event' });
      }
    },
  );

  // ── PUT /api/events/:id ────────────────────────────────────────────────────
  router.put('/events/:id', requireAuth, moderationCheck, async (req: Request, res: Response) => {
    const parseResult = updateEventSchema.safeParse(req.body ?? {});
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(', ') });
    }
    try {
      const existing = await eventsService.getById(qparam(req.params.id));
      if (!existing) return res.status(404).json({ error: 'Event not found' });
      if (!isOwnerOrAdmin(req.user!, existing.organizerId)) {
        return res.status(403).json({ error: 'Forbidden: you do not own this event' });
      }

      const b = parseResult.data;

      if (b.publisherProfileId !== undefined && b.publisherProfileId !== '') {
        const pv = await validatePublisherProfileLink(req.user!, b.publisherProfileId);
        if (!pv.ok) return res.status(pv.status).json({ error: pv.error });
      }
      if (b.venueProfileId !== undefined && b.venueProfileId !== '') {
        const vv = await validateVenueProfileLink(req.user!, b.venueProfileId);
        if (!vv.ok) return res.status(vv.status).json({ error: vv.error });
      }
      const hasLocationFields =
        b.city != null || b.state != null || b.postcode != null ||
        b.country != null || b.latitude != null || b.longitude != null;

      let loc: ResolvedLocation | undefined;
      if (hasLocationFields) {
        const resolvedResult = resolveAustralianLocation(
          {
            city:      b.city      ?? existing.city,
            state:     b.state     ?? existing.state,
            postcode:  b.postcode  ?? existing.postcode,
            country:   b.country   ?? existing.country,
            latitude:  b.latitude  ?? existing.latitude,
            longitude: b.longitude ?? existing.longitude,
          },
          false,
        );
        if (resolvedResult.error || !resolvedResult.location) {
          return res.status(400).json({ error: resolvedResult.error ?? 'invalid location payload' });
        }
        loc = resolvedResult.location;
      }

      const updated = await eventsService.update(qparam(req.params.id), {
        ...(b.title        != null && { title:       String(b.title) }),
        ...(b.description  != null && { description: String(b.description) }),
        ...(b.date         != null && { date:        String(b.date) }),
        ...(b.time         != null && { time:        String(b.time) }),
        ...(b.venue        != null && { venue:       String(b.venue) }),
        ...(b.address      != null && { address:     String(b.address) }),
        ...(loc && { city:      loc.city }),
        ...(loc && { state:     loc.state }),
        ...(loc && { postcode:  loc.postcode }),
        ...(loc && { suburb:    loc.city }),
        ...(loc && { latitude:  loc.latitude }),
        ...(loc && { longitude: loc.longitude }),
        ...(loc && { country:   loc.country }),
        ...(b.imageUrl     != null && { imageUrl:    String(b.imageUrl) }),
        ...(b.priceCents   != null && { priceCents:  Number(b.priceCents) }),
        ...(b.priceLabel   != null && { priceLabel:  String(b.priceLabel) }),
        ...(b.capacity     != null && { capacity:    Number(b.capacity) }),
        ...(b.isFree       != null && { isFree:      Boolean(b.isFree) }),
        ...(b.isFeatured   != null && { isFeatured:  Boolean(b.isFeatured) }),
        ...(Array.isArray(b.tiers)      && { tiers:      b.tiers }),
        ...(Array.isArray(b.tags)       && { tags:       b.tags }),
        ...(Array.isArray(b.cultureTag) && { cultureTag: b.cultureTag }),
        ...(b.category  != null && { category:  String(b.category) }),
        ...(b.eventType != null && { eventType: String(b.eventType) }),
        ...(b.publisherProfileId !== undefined && {
          publisherProfileId:
            b.publisherProfileId === '' ? FieldValue.delete() : String(b.publisherProfileId),
        }),
        ...(b.venueProfileId !== undefined && {
          venueProfileId: b.venueProfileId === '' ? FieldValue.delete() : String(b.venueProfileId),
        }),
      });
      if (!updated) return res.status(500).json({ error: 'Failed to update event' });
      return res.json(normalizeEventImageForClient(updated));
    } catch (err) {
      captureRouteError(err, 'PUT /api/events/:id');
      return res.status(500).json({ error: 'Failed to update event' });
    }
  });

  // ── DELETE /api/events/:id ─────────────────────────────────────────────────
  router.delete('/events/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const existing = await eventsService.getById(qparam(req.params.id));
      if (!existing) return res.status(404).json({ error: 'Event not found' });
      if (!isOwnerOrAdmin(req.user!, existing.organizerId)) {
        return res.status(403).json({ error: 'Forbidden: you do not own this event' });
      }
      await eventsService.softDelete(qparam(req.params.id));
      return res.json({ success: true });
    } catch (err) {
      captureRouteError(err, 'DELETE /api/events/:id');
      return res.status(500).json({ error: 'Failed to delete event' });
    }
  });

  // ── POST /api/events/:id/publish ───────────────────────────────────────────
  router.post(
    '/events/:id/publish',
    requireAuth,
    requireRole('organizer', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const existing = await eventsService.getById(qparam(req.params.id));
        if (!existing) return res.status(404).json({ error: 'Event not found' });
        if (!isOwnerOrAdmin(req.user!, existing.organizerId)) {
          return res.status(403).json({ error: 'Forbidden: you do not own this event' });
        }
        const published = await eventsService.publish(qparam(req.params.id));
        if (!published) return res.status(500).json({ error: 'Failed to publish event' });
        return res.json(normalizeEventImageForClient(published));
      } catch (err) {
        captureRouteError(err, 'POST /api/events/:id/publish');
        return res.status(500).json({ error: 'Failed to publish event' });
      }
    },
  );

  // ── GET /api/events/:id/feedback ───────────────────────────────────────────
  router.get('/events/:id/feedback', async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    try {
      const feedback = await eventFeedbackService.listForEvent(eventId);
      const avg = feedback.length > 0 ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : null;
      return res.json({ feedback, averageRating: avg ? Math.round(avg * 10) / 10 : null, count: feedback.length });
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id/feedback');
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });

  // ── POST /api/events/:id/ticket-click ──────────────────────────────────────
  // No auth required — tracking only, fire-and-forget
  router.post('/events/:id/ticket-click', async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    try {
      const { db } = await import('../admin');
      await db.collection('events').doc(eventId).update({
        ticketClickCount: (await import('firebase-admin/firestore')).FieldValue.increment(1),
      });
      return res.json({ ok: true });
    } catch {
      // best-effort — don't fail the client
      return res.json({ ok: false });
    }
  });

  // ── GET /api/events/:id/rsvp/me ────────────────────────────────────────────
  router.get('/events/:id/rsvp/me', requireAuth, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    const userId = req.user!.id;
    try {
      const { db } = await import('../admin');
      const snap = await db.collection('rsvps').doc(`${eventId}_${userId}`).get();
      if (!snap.exists) return res.json({ status: null });
      return res.json({ status: (snap.data() as any).status ?? null });
    } catch (err) {
      captureRouteError(err, 'GET /api/events/:id/rsvp/me');
      return res.status(500).json({ error: 'Failed to get RSVP' });
    }
  });

  // ── POST /api/events/:id/rsvp ──────────────────────────────────────────────
  router.post('/events/:id/rsvp', requireAuth, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    const userId = req.user!.id;
    const status = req.body?.status as string | undefined;

    if (!['going', 'maybe', 'not_going'].includes(status ?? '')) {
      return res.status(400).json({ error: 'status must be going | maybe | not_going' });
    }

    try {
      const { db } = await import('../admin');
      const { FieldValue } = await import('firebase-admin/firestore');
      const rsvpRef  = db.collection('rsvps').doc(`${eventId}_${userId}`);
      const eventRef = db.collection('events').doc(eventId);
      const counterKey: Record<string, string> = { going: 'rsvpGoing', maybe: 'rsvpMaybe', not_going: 'rsvpNotGoing' };
      const now = nowIso();

      // Transaction prevents race conditions where concurrent requests both read
      // prevStatus = null and double-increment the same counter.
      await db.runTransaction(async (txn) => {
        const prevSnap = await txn.get(rsvpRef);
        const prevStatus = prevSnap.exists ? (prevSnap.data() as any).status as string : null;

        txn.set(rsvpRef, {
          eventId,
          userId,
          status,
          updatedAt: now,
          createdAt: prevSnap.exists ? (prevSnap.data() as any).createdAt : now,
        });

        const counterUpdate: Record<string, unknown> = {};
        if (prevStatus && prevStatus !== status) {
          counterUpdate[counterKey[prevStatus]] = FieldValue.increment(-1);
        }
        if (!prevStatus || prevStatus !== status) {
          counterUpdate[counterKey[status!]] = FieldValue.increment(1);
        }
        if (Object.keys(counterUpdate).length > 0) {
          txn.update(eventRef, counterUpdate);
        }
      });

      return res.json({ status });
    } catch (err) {
      captureRouteError(err, 'POST /api/events/:id/rsvp');
      return res.status(500).json({ error: 'Failed to save RSVP' });
    }
  });

  // ── POST /api/events/:id/feedback ──────────────────────────────────────────
  router.post('/events/:id/feedback', requireAuth, async (req: Request, res: Response) => {
    const eventId = qparam(req.params.id);
    let payload: z.infer<typeof eventFeedbackSchema>;
    try {
      payload = parseBody(eventFeedbackSchema, req.body);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid feedback payload' });
    }

    const userId = req.user!.id;

    try {
      const existingEvent = await eventsService.getById(eventId);
      if (!existingEvent) return res.status(404).json({ error: 'Event not found' });
      const feedback = await eventFeedbackService.upsert({
        eventId,
        userId,
        rating:  payload.rating,
        comment: payload.comment,
      });
      return res.json(feedback);
    } catch (err) {
      captureRouteError(err, 'POST /api/events/:id/feedback');
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  return router;
}


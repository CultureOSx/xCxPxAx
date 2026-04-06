import { Router, Request, Response } from 'express';
import { captureRouteError } from './utils';
import type * as FirebaseFirestore from 'firebase-admin/firestore';
import { db } from '../admin';
import { requireRole } from '../middleware/auth';
import { usersService } from '../services/users';
import type { UserRole, DiscoverCurationConfig } from '../../../shared/schema';
import { DISCOVER_FOCUS_OPTIONS, HERITAGE_PLAYLIST_TYPES } from '../../../shared/schema';
import { updateDiscoverCurationConfig, getDiscoverCurationConfig } from '../services/discoverCuration';
import { systemConfigService } from '../services/systemConfig';
import { taxonomyService } from '../services/taxonomy';
import { z } from 'zod';

export const adminRouter = Router();

const featuredArtistSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  subtitle: z.string().min(1).optional(),
  meta: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  accentColor: z.string().min(1).optional(),
  focus: z.enum(DISCOVER_FOCUS_OPTIONS).optional(),
  ctaLabel: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

const heritagePlaylistSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  culture: z.string().min(1),
  imageUrl: z.string().url(),
  typeLabel: z.enum(HERITAGE_PLAYLIST_TYPES),
  accentColor: z.string().min(1),
  focus: z.enum(DISCOVER_FOCUS_OPTIONS),
  externalUrl: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().url().optional(),
  ),
  city: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  isLive: z.boolean().optional(),
  active: z.boolean().optional(),
  matchKeys: z.array(z.string().min(1)).optional(),
});

const discoverCurationSchema = z.object({
  featuredArtists: z.array(featuredArtistSchema),
  heritagePlaylists: z.array(heritagePlaylistSchema),
});

// ---------------------------------------------------------------------------
// Platform Stats
// ---------------------------------------------------------------------------
adminRouter.get('/admin/stats', requireRole('admin', 'moderator', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoIso = oneWeekAgo.toISOString();

    const [
      usersCount,
      eventsCount,
      ticketsCount,
      councilsCount,
      pendingHandlesUsers,
      pendingHandlesProfiles,
      newUsersCount,
      organizersCount,
      reportsCount,
    ] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('events').where('status', '==', 'published').count().get(),
      db.collection('tickets').count().get(),
      db.collection('councils').where('verificationStatus', '==', 'verified').count().get(),
      db.collection('users').where('handleStatus', '==', 'pending').count().get(),
      db.collection('profiles').where('handleStatus', '==', 'pending').count().get(),
      db.collection('users').where('createdAt', '>=', oneWeekAgoIso).count().get(),
      db.collection('users').where('role', 'in', ['organizer', 'admin', 'cityAdmin', 'platformAdmin']).count().get(),
      db.collection('reports').where('status', '==', 'pending').count().get(),
    ]);

    return res.json({
      totalUsers: usersCount.data().count,
      totalEvents: eventsCount.data().count,
      totalTicketsSold: ticketsCount.data().count,
      activeCouncils: councilsCount.data().count,
      pendingHandlesCount: pendingHandlesUsers.data().count + pendingHandlesProfiles.data().count,
      newUsersThisWeek: newUsersCount.data().count,
      activeOrganizers: organizersCount.data().count,
      pendingModerationCount: reportsCount.data().count,
    });
  } catch (err) {
    captureRouteError(err, 'GET /admin/stats');
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ---------------------------------------------------------------------------
// Handle Approvals — list pending +handles
// ---------------------------------------------------------------------------
adminRouter.get('/admin/handles/pending', requireRole('admin', 'moderator', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const usersSnap = await db.collection('users').where('handleStatus', '==', 'pending').get();
    const profilesSnap = await db.collection('profiles').where('handleStatus', '==', 'pending').get();

    const handles = [
      ...usersSnap.docs.map(d => ({
        id: d.id,
        type: 'user' as const,
        handle: d.data().handle ?? d.data().username,
        name: d.data().displayName ?? d.data().username ?? 'Unknown',
        createdAt: d.data().createdAt,
      })),
      ...profilesSnap.docs.map(d => ({
        id: d.id,
        type: 'profile' as const,
        handle: d.data().handle ?? d.data().slug ?? d.data().name,
        name: d.data().name ?? 'Unknown',
        entityType: d.data().entityType,
        createdAt: d.data().createdAt,
      })),
    ].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));

    return res.json({ handles, count: handles.length });
  } catch (err) {
    captureRouteError(err, 'GET /admin/handles/pending');
    return res.status(500).json({ error: 'Failed to fetch pending handles' });
  }
});

// ---------------------------------------------------------------------------
// Handle Approvals — approve a handle
// ---------------------------------------------------------------------------
adminRouter.post('/admin/handles/:type/:id/approve', requireRole('admin', 'moderator', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const type = req.params['type'] as string;
    const id = req.params['id'] as string;
    const now = new Date().toISOString();

    if (type === 'user') {
      await usersService.update(id, { handleStatus: 'approved' });
    } else if (type === 'profile') {
      await db.collection('profiles').doc(id).update({ handleStatus: 'approved', updatedAt: now });
    } else {
      return res.status(400).json({ error: 'type must be user or profile' });
    }

    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'POST /admin/handles/:type/:id/approve');
    return res.status(500).json({ error: 'Failed to approve handle' });
  }
});

// ---------------------------------------------------------------------------
// Handle Approvals — reject a handle
// ---------------------------------------------------------------------------
adminRouter.post('/admin/handles/:type/:id/reject', requireRole('admin', 'moderator', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const type = req.params['type'] as string;
    const id = req.params['id'] as string;
    const now = new Date().toISOString();
    const reason: string | undefined = req.body?.reason;

    if (type === 'user') {
      await usersService.update(id, { handleStatus: 'rejected' });
    } else if (type === 'profile') {
      await db.collection('profiles').doc(id).update({ handleStatus: 'rejected', updatedAt: now });
    } else {
      return res.status(400).json({ error: 'type must be user or profile' });
    }

    if (process.env.NODE_ENV !== 'production') console.log(`[handle rejected] ${type}/${id} — reason: ${reason}`);
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'POST /admin/handles/:type/:id/reject');
    return res.status(500).json({ error: 'Failed to reject handle' });
  }
});

// ---------------------------------------------------------------------------
// Admin User Management — list with pagination + search + role filter
// ---------------------------------------------------------------------------
adminRouter.get('/admin/users', requireRole('admin', 'moderator', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit  ?? '50'), 10) || 50));
    const page   = Math.max(0, parseInt(String(req.query.page   ?? '0'),  10) || 0);
    const search = String(req.query.search ?? '').trim().toLowerCase();
    const roleFilter = String(req.query.role ?? '').trim();

    let query: FirebaseFirestore.Query = db.collection('users').orderBy('createdAt', 'desc');
    if (roleFilter) query = query.where('role', '==', roleFilter);

    const snap = await query.get();
    let users = snap.docs.map(d => {
      const data = d.data();
      return {
        id:               d.id,
        username:         data.username       as string | undefined,
        displayName:      data.displayName    as string | undefined,
        email:            data.email          as string | undefined,
        role:             (data.role ?? 'user') as UserRole,
        avatarUrl:        data.avatarUrl      as string | undefined,
        city:             data.city           as string | undefined,
        country:          data.country        as string | undefined,
        handle:           data.handle         as string | undefined,
        handleStatus:     data.handleStatus   as string | undefined,
        isSydneyVerified: data.isSydneyVerified as boolean | undefined,
        membershipTier:   data.membership?.tier as string | undefined,
        createdAt:        data.createdAt      as string | undefined,
        lastActiveAt:     data.lastActiveAt   as string | undefined,
      };
    });

    if (search) {
      users = users.filter(u =>
        (u.displayName ?? '').toLowerCase().includes(search) ||
        (u.username    ?? '').toLowerCase().includes(search) ||
        (u.email       ?? '').toLowerCase().includes(search) ||
        (u.handle      ?? '').toLowerCase().includes(search),
      );
    }

    const total = users.length;
    const paged = users.slice(page * limit, (page + 1) * limit);
    return res.json({ users: paged, total, page, limit });
  } catch (err) {
    captureRouteError(err, 'GET /admin/users');
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ---------------------------------------------------------------------------
// Admin User Management — assign role
// ---------------------------------------------------------------------------
const VALID_ROLES: UserRole[] = ['user', 'organizer', 'business', 'sponsor', 'cityAdmin', 'moderator', 'admin', 'platformAdmin'];

adminRouter.put('/admin/users/:id/role', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const id   = String(req.params['id'] ?? '');
    const role = req.body?.role as string;
    if (!VALID_ROLES.includes(role as UserRole)) return res.status(400).json({ error: 'Invalid role' });

    // Only platformAdmin can assign admin or platformAdmin
    if (req.user!.role !== 'platformAdmin' && (['admin', 'platformAdmin'] as string[]).includes(role)) {
      return res.status(403).json({ error: 'Insufficient privileges for this role' });
    }

    await usersService.update(id, { role: role as UserRole });
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'PUT /admin/users/:id/role');
    return res.status(500).json({ error: 'Failed to update role' });
  }
});

// ---------------------------------------------------------------------------
// Admin User Management — toggle Sydney verification
// ---------------------------------------------------------------------------
adminRouter.put('/admin/users/:id/verify', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const id       = String(req.params['id'] ?? '');
    const verified = !!req.body?.verified;
    await usersService.update(id, { isSydneyVerified: verified });
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'PUT /admin/users/:id/verify');
    return res.status(500).json({ error: 'Failed to update verification' });
  }
});

// ---------------------------------------------------------------------------
// Moderation — list content reports
// ---------------------------------------------------------------------------
adminRouter.get('/admin/reports', requireRole('admin', 'moderator', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const status    = String(req.query.status ?? 'pending');
    const limit     = Math.min(100, parseInt(String(req.query.limit ?? '50'), 10) || 50);
    let query: FirebaseFirestore.Query = db.collection('reports').orderBy('createdAt', 'desc').limit(limit);
    if (status !== 'all') query = db.collection('reports').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit);
    const snap = await query.get();
    const reports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json({ reports, total: reports.length });
  } catch (err) {
    captureRouteError(err, 'GET /admin/reports');
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

adminRouter.patch('/admin/reports/:id/status', requireRole('admin', 'moderator', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const id     = String(req.params['id'] ?? '');
    const status = req.body?.status as string;
    if (!['resolved', 'dismissed', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await db.collection('reports').doc(id).update({ status, resolvedAt: new Date().toISOString(), resolvedBy: req.user!.id });
    return res.json({ ok: true });
  } catch (err) {
    captureRouteError(err, 'PATCH /admin/reports/:id/status');
    return res.status(500).json({ error: 'Failed to update report' });
  }
});

// ---------------------------------------------------------------------------
// Moderation — pending event approvals (draft events by non-admin users)
// ---------------------------------------------------------------------------
adminRouter.get('/admin/events/pending', requireRole('admin', 'moderator', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, parseInt(String(req.query.limit ?? '50'), 10) || 50);
    const snap  = await db.collection('events').where('status', '==', 'draft').orderBy('createdAt', 'desc').limit(limit).get();
    const events = snap.docs.map(d => {
      const data = d.data();
      return {
        id:          d.id,
        title:       data.title       as string | undefined,
        category:    data.category    as string | undefined,
        city:        data.city        as string | undefined,
        country:     data.country     as string | undefined,
        date:        data.date        as string | undefined,
        imageUrl:    data.imageUrl    as string | undefined,
        organizerId: data.organizerId as string | undefined,
        createdAt:   data.createdAt   as string | undefined,
        isFree:      data.isFree      as boolean | undefined,
        priceCents:  data.priceCents  as number | undefined,
      };
    });
    return res.json({ events, total: events.length });
  } catch (err) {
    captureRouteError(err, 'GET /admin/events/pending');
    return res.status(500).json({ error: 'Failed to fetch pending events' });
  }
});

// ---------------------------------------------------------------------------
// GeoHash / Coordinates backfill (AU postcode-based best-effort)
// ---------------------------------------------------------------------------
adminRouter.post('/admin/geohash-backfill', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const { runGeohashBackfill } = await import('../jobs/geohashBackfill');
    const forceGeoHash = req.body?.forceGeoHash === true;
    const overwriteCoordinates = req.body?.overwriteCoordinates === true;
    const limit = typeof req.body?.limit === 'number' ? req.body.limit : undefined;
    const result = await runGeohashBackfill({ forceGeoHash, overwriteCoordinates, limit });
    return res.json({ ok: true, ...result });
  } catch (err: any) {
    captureRouteError(err, 'POST /admin/geohash-backfill');
    return res.status(500).json({ error: err?.message ?? 'Geo backfill failed' });
  }
});

// ---------------------------------------------------------------------------
// Discover curation
// ---------------------------------------------------------------------------
adminRouter.get('/admin/discover-curation', requireRole('admin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const { config, source } = await getDiscoverCurationConfig();
    return res.json({ config, source });
  } catch (err) {
    captureRouteError(err, 'GET /admin/discover-curation');
    return res.status(500).json({ error: 'Failed to fetch discover curation config' });
  }
});

adminRouter.put('/admin/discover-curation', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const parsed = discoverCurationSchema.parse(req.body) as DiscoverCurationConfig;
    const config = await updateDiscoverCurationConfig(parsed, req.user!.id);
    return res.json({ ok: true, config });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message ?? 'Invalid discover curation payload' });
    }
    captureRouteError(err, 'PUT /admin/discover-curation');
    return res.status(500).json({ error: 'Failed to update discover curation config' });
  }
});

// ---------------------------------------------------------------------------
// Finance summary
// ---------------------------------------------------------------------------
adminRouter.get('/admin/finance/summary', requireRole('admin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const [activeSubsSnap, ticketsSnap] = await Promise.all([
      db.collection('users').where('membership.isActive', '==', true).count().get(),
      db.collection('tickets').where('paymentStatus', '==', 'paid').count().get(),
    ]);

    // Revenue: sum ticket priceCents where paymentStatus=paid (sample first 500 for estimate)
    const ticketSample = await db.collection('tickets').where('paymentStatus', '==', 'paid').limit(500).get();
    const sampleRevenue = ticketSample.docs.reduce((sum, d) => sum + ((d.data().priceCents as number) ?? 0), 0);

    return res.json({
      activeSubscriptions: activeSubsSnap.data().count,
      paidTickets: ticketsSnap.data().count,
      sampleRevenueCents: sampleRevenue,
      sampleSize: ticketSample.size,
    });
  } catch (err) {
    captureRouteError(err, 'GET /admin/finance/summary');
    return res.status(500).json({ error: 'Failed to fetch finance summary' });
  }
});

// ---------------------------------------------------------------------------
// System Config (Maintenance Mode, etc.)
// ---------------------------------------------------------------------------
adminRouter.get('/admin/config', requireRole('admin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getConfig();
    return res.json({ config });
  } catch (err) {
    captureRouteError(err, 'GET /admin/config');
    return res.status(500).json({ error: 'Failed to fetch system config' });
  }
});

adminRouter.put('/admin/config', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.updateConfig(req.body, req.user!.id);
    return res.json({ ok: true, config });
  } catch (err) {
    captureRouteError(err, 'PUT /admin/config');
    return res.status(500).json({ error: 'Failed to update system config' });
  }
});

// ---------------------------------------------------------------------------
// Taxonomy Manager
// ---------------------------------------------------------------------------
adminRouter.get('/admin/taxonomy', requireRole('admin', 'platformAdmin'), async (_req: Request, res: Response) => {
  try {
    const categories = await taxonomyService.getCategories();
    return res.json({ categories });
  } catch (err) {
    captureRouteError(err, 'GET /admin/taxonomy');
    return res.status(500).json({ error: 'Failed to fetch taxonomy' });
  }
});

adminRouter.put('/admin/taxonomy/:categoryId', requireRole('admin', 'platformAdmin'), async (req: Request, res: Response) => {
  try {
    const categoryId = req.params['categoryId'] as string;
    const { tags } = req.body;
    if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags must be an array' });
    
    const category = await taxonomyService.updateCategory(categoryId, tags, req.user!.id);
    return res.json({ ok: true, category });
  } catch (err) {
    captureRouteError(err, 'PUT /admin/taxonomy/:categoryId');
    return res.status(500).json({ error: 'Failed to update taxonomy category' });
  }
});

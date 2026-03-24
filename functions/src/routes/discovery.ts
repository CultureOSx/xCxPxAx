
import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import { isFirestoreConfigured } from '../admin';
import { requireAuth, isOwnerOrAdmin } from '../middleware/auth';
import { searchService } from '../services/firestore';
import { resolveDiscoverCuration } from '../services/discoverCuration';

export const discoveryRouter = Router();

/** GET /api/discover/trending — trending events */
discoveryRouter.get('/discover/trending', async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.json([]);
    const trending = await searchService.getTrending(10);
    return res.json(trending);
  } catch (err) {
    captureRouteError(err, 'GET /api/discover/trending');
    return res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

/** GET /api/discover — personalized discovery feed for current user */
discoveryRouter.get('/discover', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!isFirestoreConfigured) return res.json({ trendingEvents: [], rankedEvents: [], suggestedCommunities: [] });
    const dateFrom = String(req.query.dateFrom || new Date().toISOString().split('T')[0]);
    const result = await searchService.getTrending(20);
    const filtered = result.filter(e => e.date >= dateFrom);
    return res.json({
      trendingEvents: filtered,
      rankedEvents: [],
      suggestedCommunities: []
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/discover');
    return res.status(500).json({ error: 'Failed to fetch discovery feed' });
  }
});

/** GET /api/discover/:userId — personalized discovery feed
 *  - userId === 'guest' → public, no auth required
 *  - any other userId  → requires auth + must be owner or admin
 */
discoveryRouter.get('/discover/curation', async (req: Request, res: Response) => {
  try {
    const cultureIds = String(req.query.cultureIds ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await resolveDiscoverCuration({
      city: req.query.city ? String(req.query.city) : undefined,
      country: req.query.country ? String(req.query.country) : undefined,
      cultureIds,
    });

    return res.json(response);
  } catch (err) {
    captureRouteError(err, 'GET /api/discover/curation');
    return res.status(500).json({ error: 'Failed to fetch discover curation' });
  }
});

discoveryRouter.get('/discover/:userId', async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');

  if (userId !== 'guest') {
    // Non-guest: enforce authentication
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!isOwnerOrAdmin(req.user, userId)) return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Real implementation would use machine learning or complex queries
  // For now, returning trending events as placeholder
  try {
    if (!isFirestoreConfigured) return res.json({ trendingEvents: [], rankedEvents: [], suggestedCommunities: [] });
    const dateFrom = String(req.query.dateFrom || new Date().toISOString().split('T')[0]);
    const result = await searchService.getTrending(20);
    // filter trending to today only
    const filtered = result.filter(e => e.date >= dateFrom);
    
    return res.json({
      trendingEvents: filtered,
      rankedEvents: [],
      suggestedCommunities: []
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/discover/:userId');
    return res.status(500).json({ error: 'Failed to fetch discovery feed' });
  }
});

/** POST /api/discover/feedback — provide feedback on discovery items */
discoveryRouter.post('/discover/feedback', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.body?.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });
  return res.json({ ok: true });
});

/** GET /api/cultural-intelligence/:userId — get cultural intelligence data for user */
discoveryRouter.get('/cultural-intelligence/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? '');
  if (!isOwnerOrAdmin(req.user!, userId)) return res.status(403).json({ error: 'Forbidden' });
  
  return res.json({
    userId,
    score: 85,
    badges: ['CultureSeeker', 'CommunityBuilder'],
    lastUpdated: new Date().toISOString()
  });
});

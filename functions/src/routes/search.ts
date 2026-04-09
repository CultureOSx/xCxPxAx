import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import { searchService } from '../services/firestore';
import { isFirestoreConfigured } from '../admin';

export const searchRouter = Router();

/** GET /api/search
 *
 * Query params:
 *   q          — search query (optional if publisherProfileId / venueProfileId / other event filters set)
 *   city       — filter
 *   country    — filter
 *   category   — filter (Music, Food, Art, etc.)
 *   cultureTag — filter (Tamil, Ghanaian, Filipino, etc.)
 *   entryType  — "free" | "ticketed"
 *   eventType  — matches event.eventType or event.category
 *   publisherProfileId — canonical organiser profile
 *   venueProfileId     — linked venue profile
 *   pageSize   — max 50, default 20
 */
searchRouter.get('/search', async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim();
  const city = String(req.query.city ?? '').trim();
  const country = String(req.query.country ?? '').trim();
  const category = String(req.query.category ?? '').trim();
  const cultureTag = String(req.query.cultureTag ?? '').trim();
  const entryType = String(req.query.entryType ?? '').trim();
  const eventType = String(req.query.eventType ?? '').trim();
  const publisherProfileId = String(req.query.publisherProfileId ?? '').trim();
  const venueProfileId = String(req.query.venueProfileId ?? '').trim();
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));

  const hasStructuredEventFilter = Boolean(
    publisherProfileId ||
      venueProfileId ||
      category ||
      cultureTag ||
      entryType ||
      eventType,
  );

  if (!query && !hasStructuredEventFilter) {
    return res.json({ events: [], profiles: [], movies: [], users: [] });
  }
  if (!isFirestoreConfigured) {
    return res.json({ events: [], profiles: [], movies: [], users: [] });
  }

  try {
    const result = await searchService.globalSearch(
      query,
      {
        city: city || undefined,
        country: country || undefined,
        category: category || undefined,
        cultureTag: cultureTag || undefined,
        entryType: entryType || undefined,
        eventType: eventType || undefined,
        publisherProfileId: publisherProfileId || undefined,
        venueProfileId: venueProfileId || undefined,
      },
      pageSize,
    );
    return res.json(result);
  } catch (err) {
    captureRouteError(err, 'GET /api/search');
    return res.status(500).json({ error: 'Search failed' });
  }
});

/** GET /api/discover/trending */
searchRouter.get('/discover/trending', async (_req: Request, res: Response) => {
  try {
    const trending = await searchService.getTrending(10);
    return res.json(trending);
  } catch (err) {
    captureRouteError(err, 'GET /api/discover/trending');
    return res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

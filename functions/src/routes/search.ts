import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import { searchService } from '../services/firestore';
import { isFirestoreConfigured } from '../admin';

export const searchRouter = Router();

/** GET /api/search
 *
 * Query params:
 *   q          — search query (required)
 *   city       — filter
 *   country    — filter
 *   category   — filter (Music, Food, Art, etc.)
 *   cultureTag — filter (Tamil, Ghanaian, Filipino, etc.)
 *   entryType  — "free" | "ticketed"
 *   pageSize   — max 50, default 20
 */
searchRouter.get('/search', async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim();
  const city = String(req.query.city ?? '').trim();
  const country = String(req.query.country ?? '').trim();
  const category = String(req.query.category ?? '').trim();
  const cultureTag = String(req.query.cultureTag ?? '').trim();
  const entryType = String(req.query.entryType ?? '').trim();
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));

  if (!query) {
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

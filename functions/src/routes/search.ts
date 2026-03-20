import { Router, Request, Response } from 'express';
import { searchService } from '../services/firestore';
import { searchClient } from '../services/algolia';

export const searchRouter = Router();

const EVENTS_INDEX = 'culturepass_events';

/** GET /api/search — general search across events and profiles */
searchRouter.get('/search', async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim().toLowerCase();
  const city = String(req.query.city ?? '').trim().toLowerCase();
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));

  if (!query) return res.json({ events: [], profiles: [] });

  // Use Algolia for fast full-text search when credentials are available
  if (searchClient) {
    try {
      const filters = city ? `city:${city}` : undefined;
      const algoliaResult = await (searchClient as any).search({
        requests: [{
          indexName: EVENTS_INDEX,
          query,
          hitsPerPage: pageSize,
          ...(filters ? { filters } : {}),
        }],
      });
      const hits = algoliaResult?.results?.[0]?.hits ?? [];
      return res.json({ events: hits, profiles: [] });
    } catch (err) {
      console.error('[GET /api/search] Algolia error, falling back to Firestore:', err);
      // Fall through to Firestore fallback
    }
  }

  try {
    const result = await searchService.globalSearch(query, city);
    return res.json(result);
  } catch (err) {
    console.error('[GET /api/search]:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
});

/** GET /api/discover/trending — trending/featured items */
searchRouter.get('/discover/trending', async (req: Request, res: Response) => {
  try {
    const trending = await searchService.getTrending(10);
    return res.json(trending);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

import { Router, type Request, type Response } from 'express';
import { captureRouteError } from './utils';
import { searchService } from '../services/firestore';
import { isFirestoreConfigured } from '../admin';
import { searchClient, EVENTS_INDEX, PROFILES_INDEX } from '../services/algolia';

export const searchRouter = Router();

/** GET /api/search
 *
 * Query params:
 *   q          — search query (required)
 *   city       — facet filter
 *   country    — facet filter
 *   category   — facet filter (Music, Food, Art, etc.)
 *   cultureTag — facet filter (Tamil, Ghanaian, Filipino, etc.)
 *   entryType  — "free" | "ticketed"
 *   pageSize   — max 50, default 20
 */
searchRouter.get('/search', async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim();
  const city = String(req.query.city ?? '').trim();
  const country = String(req.query.country ?? '').trim();
  const category = String(req.query.category ?? '').trim();
  const cultureTag = String(req.query.cultureTag ?? '').trim();
  const entryType = String(req.query.entryType ?? '').trim(); // "free" | "ticketed"
  const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));

  if (!query) return res.json({ events: [], profiles: [] });
  if (!isFirestoreConfigured && !searchClient) return res.json({ events: [], profiles: [] });

  if (searchClient) {
    try {
      // Build facet filter groups — items within a group are OR'd, groups are AND'd
      const facetFilters: string[][] = [];
      if (city) facetFilters.push([`city:${city}`]);
      if (country) facetFilters.push([`country:${country}`]);
      if (category) facetFilters.push([`category:${category}`]);
      if (cultureTag) facetFilters.push([`cultureTag:${cultureTag}`]);
      if (entryType === 'free') facetFilters.push([`entryType:free`]);
      if (entryType === 'ticketed') facetFilters.push([`entryType:ticketed`]);

      const [eventsResult, profilesResult] = await Promise.all([
        searchClient.search({
          requests: [{
            indexName: EVENTS_INDEX,
            query,
            hitsPerPage: pageSize,
            ...(facetFilters.length ? { facetFilters } : {}),
          }],
        }),
        searchClient.search({
          requests: [{
            indexName: PROFILES_INDEX,
            query,
            hitsPerPage: Math.min(pageSize, 10),
            ...(city ? { facetFilters: [[`city:${city}`]] } : {}),
          }],
        }),
      ]);

      const events = (eventsResult?.results?.[0] as any)?.hits ?? [];
      const profiles = (profilesResult?.results?.[0] as any)?.hits ?? [];
      return res.json({ events, profiles });
    } catch (err) {
      console.error('[GET /api/search] Algolia error, falling back to Firestore:', err);
      // Fall through to Firestore fallback
    }
  }

  try {
    const result = await searchService.globalSearch(query, city);
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

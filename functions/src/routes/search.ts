import { Router, Request, Response } from 'express';
import { searchService } from '../services/firestore';
import { isFirestoreConfigured } from '../admin';
import seedCommunitiesRaw from '../data/seed-communities.json';
import seedEventsRaw from '../data/seed-events.json';

export const searchRouter = Router();

/** GET /api/search — general search across events and profiles */
searchRouter.get('/search', async (req: Request, res: Response) => {
  const query = String(req.query.q ?? '').trim().toLowerCase();
  const city = String(req.query.city ?? '').trim().toLowerCase();

  if (!query) return res.json({ events: [], profiles: [] });

  if (!isFirestoreConfigured) {
    const profiles = (seedCommunitiesRaw as { name: string; description?: string; cpid?: string }[])
      .filter(p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query))
      .map((p, i) => ({ ...p, id: p.cpid ?? `seed-${i}` }));
    const events = (seedEventsRaw as { title: string; description?: string }[])
      .filter(e => e.title.toLowerCase().includes(query) || e.description?.toLowerCase().includes(query))
      .map((e, i) => ({ ...e, id: `seed-evt-${i}` }));
    return res.json({ events, profiles });
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

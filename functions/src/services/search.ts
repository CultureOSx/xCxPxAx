import { db } from '../admin';
import { eventsService } from './events';
import { profilesService } from './profiles';

export interface GlobalSearchResult {
  events: any[];
  profiles: any[];
  movies: any[];
}

export const searchService = {
  async globalSearch(query: string, city?: string): Promise<GlobalSearchResult> {
    const q = query.toLowerCase();
    
    // In a production app, this would use Algolia or specialized indexes.
    // For now, we fetch recent items and filter in memory to provide a "live" feel.
    
    const [eventSnap, profileSnap, movieSnap] = await Promise.all([
      db.collection('events').where('status', '==', 'published').limit(200).get(),
      db.collection('profiles').limit(200).get(),
      db.collection('movies').limit(100).get()
    ]);

    const events = eventSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(e => {
        const matchesQuery = e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
        const matchesCity = !city || e.city?.toLowerCase() === city.toLowerCase();
        return matchesQuery && matchesCity;
      });

    const profiles = profileSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
        const matchesCity = !city || p.city?.toLowerCase() === city.toLowerCase();
        return matchesQuery && matchesCity;
      });

    const movies = movieSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(m => {
        const matchesQuery = m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
        return matchesQuery;
      });

    return {
      events: events.slice(0, 50),
      profiles: profiles.slice(0, 50),
      movies: movies.slice(0, 50)
    };
  },

  async getTrending(limit = 10): Promise<any[]> {
    const snap = await db.collection('events')
      .where('status', '==', 'published')
      .where('isFeatured', '==', true)
      .limit(limit)
      .get();
    
    // Fallback if not enough featured items
    if (snap.size < limit) {
      const more = await db.collection('events')
        .where('status', '==', 'published')
        .limit(limit)
        .get();
      return [...snap.docs, ...more.docs.filter(d => !snap.docs.some(sd => sd.id === d.id))]
        .slice(0, limit)
        .map(d => ({ id: d.id, ...d.data() }));
    }

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};

// ---------------------------------------------------------------------------
// Utility functions for unit tests (search, suggest, cache key)
// ---------------------------------------------------------------------------

export type SearchableItem = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  city?: string;
  country?: string;
  tags?: string[];
};

/**
 * Simple in‑memory search used by unit tests.
 * Filters by query string (title/description/subtitle), type (or "all"), optional city, and optional tags.
 * Returns paginated results.
 */
export const runSearch = (
  items: SearchableItem[],
  opts: {
    q: string;
    type: string;
    page: number;
    pageSize: number;
    city?: string;
    tags?: string[];
  }
) => {
  const lowerQ = opts.q.toLowerCase();
  const filtered = items.filter(item => {
    // type filter
    if (opts.type !== 'all' && item.type !== opts.type) return false;
    // query match in title, subtitle or description
    const haystack = `${item.title || ''} ${item.subtitle || ''} ${item.description || ''}`.toLowerCase();
    if (!haystack.includes(lowerQ)) return false;
    // city filter
    if (opts.city && item.city?.toLowerCase() !== opts.city.toLowerCase()) return false;
    // tags filter – require at least one matching tag if tags supplied
    if (opts.tags && opts.tags.length > 0) {
      const itemTags = item.tags?.map(t => t.toLowerCase()) || [];
      const hasTag = opts.tags.some(t => itemTags.includes(t.toLowerCase()));
      if (!hasTag) return false;
    }
    return true;
  });

  const start = (opts.page - 1) * opts.pageSize;
  const end = start + opts.pageSize;
  const pageItems = filtered.slice(start, end);

  return {
    results: pageItems,
    page: opts.page,
    total: filtered.length
  };
};

/**
 * Suggest titles based on a prefix.
 * - Empty or whitespace‑only prefix returns []
 * - Duplicate titles are deduped (case‑sensitive keep first occurrence)
 * - Items that start with the prefix are ordered first, then those that contain it elsewhere.
 * - Optional limit (default 10).
 */
export const runSuggest = (items: SearchableItem[], prefix: string, limit = 10): string[] => {
  const trimmed = prefix.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();

  // Preserve insertion order while deduping
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const it of items) {
    if (!it.title) continue;
    if (seen.has(it.title)) continue;
    seen.add(it.title);
    titles.push(it.title);
  }

  const starts: string[] = [];
  const contains: string[] = [];
  for (const t of titles) {
    const low = t.toLowerCase();
    if (low.startsWith(lower)) {
      starts.push(t);
    } else if (low.includes(lower)) {
      contains.push(t);
    }
  }

  const result = [...starts, ...contains].slice(0, limit);
  return result;
};

/**
 * Build a deterministic cache key for search parameters.
 * Tags are sorted alphabetically to ensure order‑independence.
 */
export const buildSearchCacheKey = (params: Record<string, any>) => {
  const clone: Record<string, any> = { ...params };
  if (Array.isArray(clone.tags)) {
    clone.tags = [...clone.tags].sort();
  }
  return JSON.stringify(clone);
};


import { searchService } from './firestore';
import { InMemoryTtlCache } from './cache';
import { rankEventsForDiscover, type RankedEventResult, type RecommendationSignalSet } from './ranking';
import type { FirestoreEvent } from './firestore';

export interface DiscoverFeedContract {
  meta: {
    userId: string;
    generatedAt: string;
    source: 'cache' | 'live';
  };
  rankedEvents: RankedEventResult[];
  trendingEvents: FirestoreEvent[];
  suggestedCommunities: string[];
}

const discoverCache = new InMemoryTtlCache(60_000);

function discoverCacheKey(userId: string, city?: string, country?: string): string {
  return `discover:${userId}:${city ?? 'any'}:${country ?? 'any'}`;
}

export async function getDiscoverFeedWithContracts(
  userId: string,
  signals: RecommendationSignalSet,
): Promise<DiscoverFeedContract> {
  const key = discoverCacheKey(userId, signals.city, signals.country);
  const cached = discoverCache.get<DiscoverFeedContract>(key);
  if (cached) {
    return {
      ...cached,
      meta: { ...cached.meta, source: 'cache', generatedAt: new Date().toISOString() },
    };
  }

  const trendingEvents = await searchService.getTrending(30);
  const rankedEvents = rankEventsForDiscover(trendingEvents, signals).slice(0, 20);

  const response: DiscoverFeedContract = {
    meta: {
      userId,
      generatedAt: new Date().toISOString(),
      source: 'live',
    },
    rankedEvents,
    trendingEvents: trendingEvents.slice(0, 12),
    suggestedCommunities: [],
  };

  discoverCache.set(key, response, 60_000);
  return response;
}

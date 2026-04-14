import { api } from '@/lib/api';
import type { DiscoverFeedContract } from '@/shared/schema';

export interface DiscoverFeatureInput {
  userId: string;
  city?: string;
  country?: string;
}

export async function getDiscoverFeatureFeed(input: DiscoverFeatureInput): Promise<DiscoverFeedContract> {
  const raw = await api.discover.feed(input.userId, {
    city: input.city,
    country: input.country,
  }) as unknown as Partial<DiscoverFeedContract> & {
    trendingEvents?: DiscoverFeedContract['trendingEvents'];
    rankedEvents?: DiscoverFeedContract['rankedEvents'];
    suggestedCommunities?: string[];
    meta?: DiscoverFeedContract['meta'];
  };

  return {
    meta: raw.meta ?? {
      userId: input.userId,
      generatedAt: new Date().toISOString(),
      source: 'live',
    },
    trendingEvents: raw.trendingEvents ?? [],
    rankedEvents: raw.rankedEvents ?? [],
    suggestedCommunities: raw.suggestedCommunities ?? [],
  };
}

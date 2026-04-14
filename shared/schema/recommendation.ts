import type { EventData } from './event';

export interface EventQualityScore {
  eventId: string;
  qualityScore: number;
  organizerReputationScore: number;
  culturalRelevanceScore: number;
  popularityScore: number;
}

export interface RecommendationSignalSet {
  userId: string;
  city?: string;
  country?: string;
  cultureIds?: string[];
  savedEventIds?: string[];
  joinedCommunityIds?: string[];
  viewedEventIds?: string[];
}

export interface RankedEventResult {
  event: EventData;
  rankScore: number;
  quality: EventQualityScore;
  matchReasons: string[];
}

export interface DiscoverFeedContract {
  meta: {
    userId: string;
    generatedAt: string;
    source: 'cache' | 'live';
  };
  rankedEvents: RankedEventResult[];
  trendingEvents: EventData[];
  suggestedCommunities: string[];
}

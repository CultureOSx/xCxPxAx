import { algoliasearch, type SearchClient } from 'algoliasearch';
import { FirestoreEvent } from './firestore';

const APP_ID = process.env.ALGOLIA_APP_ID || '';
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || '';

// Singleton — null when credentials are absent (graceful degradation to Firestore)
export const searchClient: SearchClient | null = (APP_ID && ADMIN_KEY)
  ? algoliasearch(APP_ID, ADMIN_KEY)
  : null;

export const EVENTS_INDEX = 'culturepass_events';
export const PROFILES_INDEX = 'culturepass_profiles';

// ─── Events ──────────────────────────────────────────────────────────────────

export const algoliaEventsIndex = {
  async indexEvent(eventData: FirestoreEvent) {
    if (!searchClient) return null;

    try {
      const _geoloc = (eventData.latitude != null && eventData.longitude != null)
        ? { lat: eventData.latitude, lng: eventData.longitude }
        : undefined;

      const record: Record<string, unknown> = {
        objectID: eventData.id,
        title: eventData.title,
        description: eventData.description,

        // Facet fields — must be declared as attributesForFaceting in Algolia dashboard
        category: eventData.category ?? '',
        cultureTag: eventData.cultureTag ?? [],
        city: eventData.city,
        country: eventData.country,
        council: eventData.council ?? '',
        suburb: eventData.suburb ?? '',
        isFree: eventData.isFree ?? false,
        entryType: eventData.isFree ? 'free' : 'ticketed',
        isFeatured: eventData.isFeatured ?? false,
        ageSuitability: eventData.ageSuitability ?? 'all',

        // Geo
        _geoloc,

        // Display fields
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue ?? '',
        imageUrl: eventData.imageUrl ?? '',
        communityId: eventData.communityId ?? '',
        organizerId: eventData.organizerId ?? '',
        attending: eventData.attending ?? 0,

        // Ranking signal — higher score surfaces better results
        score: Math.round(
          (eventData.viewCount ?? 0) + 
          ((eventData.attending ?? 0) * 10) +
          ((eventData.ticketsSold ?? 0) * 20) +
          ((eventData.ticketClickCount ?? 0) * 2) +
          ((eventData.popularityScore ?? 0) * 15) +
          (eventData.isFeatured ? 500 : 0)
        ),

        // Idempotency marker — checked by backfill to skip already-indexed docs
        algoliaIndexedAt: Date.now(),
      };

      return await searchClient.saveObject({ indexName: EVENTS_INDEX, body: record });
    } catch (err) {
      console.error('[Algolia] indexEvent error:', err);
      return null;
    }
  },

  async deleteEvent(eventId: string) {
    if (!searchClient) return null;

    try {
      return await searchClient.deleteObject({ indexName: EVENTS_INDEX, objectID: eventId });
    } catch (err) {
      console.error('[Algolia] deleteEvent error:', err);
      return null;
    }
  },
};

// ─── Profiles ─────────────────────────────────────────────────────────────────

interface AlgoliaProfile {
  id: string;
  name: string;
  entityType: string;
  city?: string;
  country?: string;
  isVerified?: boolean;
  imageUrl?: string;
  description?: string;
  cultureTags?: string[];
  lgaCode?: string;
}

export const algoliaProfilesIndex = {
  async indexProfile(profile: AlgoliaProfile) {
    if (!searchClient) return null;

    try {
      const record: Record<string, unknown> = {
        objectID: profile.id,
        name: profile.name,
        entityType: profile.entityType,
        city: profile.city ?? '',
        country: profile.country ?? '',
        isVerified: profile.isVerified ?? false,
        imageUrl: profile.imageUrl ?? '',
        description: profile.description ?? '',
        cultureTags: profile.cultureTags ?? [],
        lgaCode: profile.lgaCode ?? '',
        algoliaIndexedAt: Date.now(),
      };

      return await searchClient.saveObject({ indexName: PROFILES_INDEX, body: record });
    } catch (err) {
      console.error('[Algolia] indexProfile error:', err);
      return null;
    }
  },

  async deleteProfile(profileId: string) {
    if (!searchClient) return null;

    try {
      return await searchClient.deleteObject({ indexName: PROFILES_INDEX, objectID: profileId });
    } catch (err) {
      console.error('[Algolia] deleteProfile error:', err);
      return null;
    }
  },
};

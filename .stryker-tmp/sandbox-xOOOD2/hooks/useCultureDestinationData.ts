// @ts-nocheck
import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { calculateDistance } from '@shared/location/australian-postcodes';
import { api } from '@/lib/api';
import type { EventData, Profile } from '@/shared/schema';
import type { CultureDestinationDefinition } from '@/constants/cultureDestinations';
import type { CultureHubScope } from '@/lib/cultureDestinationScope';
import {
  CULTURE_HUB_NEAR_RADIUS_KM,
  countriesForCultureHubQueries,
  venueCountriesForCultureHub,
  eventMatchesCultureTerms,
  sortEventsForCultureDestination,
} from '@/lib/cultureDestinationScope';

function profileMatchesTerms(p: Profile, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const c = p as Profile & {
    cultureTags?: string[];
    cultures?: string[];
    languageIds?: string[];
    languages?: string[];
    description?: string;
  };
  const hay = [
    p.name,
    c.description,
    p.category,
    p.city,
    p.country,
    ...(c.cultureTags ?? []),
    ...(c.cultures ?? []),
    ...(c.languageIds ?? []),
    ...(c.languages ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return terms.some((t) => hay.includes(t.toLowerCase().trim()));
}

function sortProfilesForHub(
  profiles: Profile[],
  viewerCountry: string,
  viewerStateCode: string | undefined,
): Profile[] {
  const vc = viewerCountry.toLowerCase().trim();
  const vs = viewerStateCode?.toLowerCase().trim();
  return [...profiles].sort((a, b) => {
    const ac = (a.country ?? '').toLowerCase().trim() === vc ? 1 : 0;
    const bc = (b.country ?? '').toLowerCase().trim() === vc ? 1 : 0;
    if (bc !== ac) return bc - ac;
    if (vs) {
      const as = (a as { state?: string }).state?.toLowerCase().trim() === vs ? 1 : 0;
      const bs = (b as { state?: string }).state?.toLowerCase().trim() === vs ? 1 : 0;
      if (bs !== as) return bs - as;
    }
    return (a.name ?? '').localeCompare(b.name ?? '');
  });
}

export type CultureDestinationQueryOptions = {
  focusCountry: string;
  focusStateCode?: string;
  scope: CultureHubScope;
  /** When scope is `nearYou`, used with `GET /events/nearby` */
  nearYouCoords?: { lat: number; lng: number } | null;
  nearYouRadiusKm?: number;
};

export function useCultureDestinationData(def: CultureDestinationDefinition, options: CultureDestinationQueryOptions) {
  const {
    focusCountry,
    focusStateCode,
    scope,
    nearYouCoords,
    nearYouRadiusKm = CULTURE_HUB_NEAR_RADIUS_KM,
  } = options;
  const isNearYou = scope === 'nearYou';
  const countries = useMemo(
    () => countriesForCultureHubQueries(focusCountry, scope),
    [focusCountry, scope],
  );
  const venueCountries = useMemo(
    () => venueCountriesForCultureHub(focusCountry, scope),
    [focusCountry, scope],
  );
  const terms = def.matchTerms;

  const nearbyQuery = useQuery({
    queryKey: [
      'culture-destination',
      'nearby',
      def.slug,
      nearYouCoords?.lat,
      nearYouCoords?.lng,
      nearYouRadiusKm,
    ],
    queryFn: () =>
      api.events.nearby({
        lat: nearYouCoords!.lat,
        lng: nearYouCoords!.lng,
        radius: nearYouRadiusKm,
        pageSize: 100,
      }),
    enabled: isNearYou && nearYouCoords != null,
    staleTime: 90_000,
  });

  const eventQueries = useQueries({
    queries: isNearYou
      ? []
      : countries.map((country) => ({
          queryKey: ['culture-destination', 'events', def.slug, country, scope],
          queryFn: () => api.events.list({ country, pageSize: scope === 'singleCountry' ? 120 : 80 }),
          staleTime: 120_000,
        })),
  });

  const venueQueries = useQueries({
    queries: venueCountries.map((country) => ({
      queryKey: ['culture-destination', 'venues', def.slug, country, scope],
      queryFn: () => api.businesses.list({ country }),
      staleTime: 300_000,
    })),
  });

  const rawEvents = useMemo(() => {
    if (isNearYou) {
      const evs = nearbyQuery.data?.events ?? [];
      const map = new Map<string, EventData>();
      for (const e of evs) {
        if (eventMatchesCultureTerms(e, terms)) map.set(e.id, e);
      }
      const list = Array.from(map.values());
      if (!nearYouCoords) return list;
      return [...list].sort((a, b) => {
        const da =
          a.lat != null && a.lng != null
            ? calculateDistance(nearYouCoords.lat, nearYouCoords.lng, a.lat, a.lng)
            : 99999;
        const db =
          b.lat != null && b.lng != null
            ? calculateDistance(nearYouCoords.lat, nearYouCoords.lng, b.lat, b.lng)
            : 99999;
        if (Math.abs(da - db) > 0.05) return da - db;
        return (a.date ?? '').localeCompare(b.date ?? '');
      });
    }
    const map = new Map<string, EventData>();
    for (const q of eventQueries) {
      for (const e of q.data?.events ?? []) {
        if (eventMatchesCultureTerms(e, terms)) map.set(e.id, e);
      }
    }
    return Array.from(map.values());
  }, [isNearYou, nearbyQuery.data?.events, nearYouCoords, terms, eventQueries]);

  const allEvents = useMemo(() => {
    if (isNearYou) return rawEvents;
    return sortEventsForCultureDestination(rawEvents, focusCountry, focusStateCode, {
      originCountryHint: def.originCountryHint,
      originKeywords: def.originKeywords,
    });
  }, [isNearYou, rawEvents, focusCountry, focusStateCode, def.originCountryHint, def.originKeywords]);

  const venues = useMemo(() => {
    const map = new Map<string, Profile>();
    for (const q of venueQueries) {
      for (const p of q.data ?? []) {
        if (profileMatchesTerms(p, terms)) map.set(p.id, p);
      }
    }
    return sortProfilesForHub(Array.from(map.values()), focusCountry, focusStateCode).slice(0, 8);
  }, [venueQueries, terms, focusCountry, focusStateCode]);

  const isLoading =
    (isNearYou ? nearYouCoords != null && nearbyQuery.isPending : eventQueries.some((q) => q.isPending)) ||
    venueQueries.some((q) => q.isPending);

  const refetch = () => {
    if (isNearYou) {
      void nearbyQuery.refetch();
    } else {
      void Promise.all(eventQueries.map((q) => q.refetch()));
    }
    void Promise.all(venueQueries.map((q) => q.refetch()));
  };

  return { allEvents, venues, isLoading, refetch, countriesQueried: countries };
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { api, type ActivityData, type IndigenousOrganisation, type IndigenousTraditionalLand } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useCouncil } from '@/hooks/useCouncil';
import { useNearbyEvents } from '@/hooks/useNearbyEvents';
import { calculateDistance, getPostcodesByPlace } from '@shared/location/australian-postcodes';
import type { DiscoverCurationResponse, EventData, Community, RestaurantData, ShopData, MovieData, PerkData } from '@/shared/schema';
import type { PreviewItem } from '@/components/Discover/PreviewRail';
import { CultureTokens } from '@/constants/theme';
import { parseEventRangeMs, parseEventStartMs } from '@/lib/dateUtils';

export interface DiscoverFeed {
  trendingEvents?: EventData[];
  rankedEvents?: EventData[];
  suggestedCommunities?: Community[];
  meta?: {
    userId: string;
    city: string;
    country: string;
    generatedAt: string;
    totalItems: number;
    signalsUsed?: unknown;
  };
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'Sydney': { lat: -33.8688, lon: 151.2093 },
  'Melbourne': { lat: -37.8136, lon: 144.9631 },
  'Brisbane': { lat: -27.4698, lon: 153.0251 },
  'Perth': { lat: -31.9505, lon: 115.8605 },
  'Adelaide': { lat: -34.9285, lon: 138.6007 },
  'Gold Coast': { lat: -28.0167, lon: 153.4000 },
  'Canberra': { lat: -35.2809, lon: 149.1300 },
  'Hobart': { lat: -42.8821, lon: 147.3272 },
};

function cityToCoordinates(city?: string): { latitude: number; longitude: number } | null {
  if (!city) return null;
  const match = getPostcodesByPlace(city)[0];
  if (!match) return null;
  return { latitude: match.latitude, longitude: match.longitude };
}

async function fetchWeather(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { current_weather?: { temperature: number; weathercode: number } };
    return data.current_weather ?? null;
  } catch {
    return null;
  }
}

export function useDiscoverData() {
  const { state } = useOnboarding();
  const { isAuthenticated, userId } = useAuth();
  
  // --- Time and Weather State ---
  const [currentTime, setCurrentTime] = useState('');
  const [weatherSummary, setWeatherSummary] = useState('');
  const city = state.city || 'Sydney';
  const coords = CITY_COORDS[city] || CITY_COORDS['Sydney'];

  useEffect(() => {
    function updateTime() {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchWeather(coords.lat, coords.lon)
      .then(w => {
        if (cancelled || !w) return;
        const condition =
          w.weathercode === 0 ? 'Clear' :
          w.weathercode <= 3  ? 'Partly Cloudy' :
          w.weathercode <= 49 ? 'Foggy' :
          w.weathercode <= 67 ? 'Rainy' :
          w.weathercode <= 77 ? 'Snowy' :
          w.weathercode <= 82 ? 'Showers' :
          'Stormy';
        setWeatherSummary(`${Math.round(w.temperature)}°C ${condition}`);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [coords.lat, coords.lon]);

  const [refreshing, setRefreshing] = useState(false);

  // --- Data Fetching ---
  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const { data: allEvents = [], isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useQuery<EventData[]>({
    queryKey: ['/api/events', state.country, state.city, today],
    queryFn: async () => {
      const result = await api.events.list({
        country: state.country || undefined,
        city: state.city || undefined,
        pageSize: 50,
        dateFrom: today,
        includeOngoing: true,
      });
      return Array.isArray(result.events) ? result.events : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allCommunities = [], isLoading: communitiesLoading, isError: communitiesError, refetch: refetchCommunities } = useQuery<Community[]>({
    queryKey: ['/api/communities', state.city, state.country],
    queryFn: () => api.communities.list({ city: state.city || undefined, country: state.country || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allActivities = [], isLoading: activitiesLoading, isError: activitiesError, refetch: refetchActivities } = useQuery<ActivityData[]>({
    queryKey: ['/api/activities', state.country, state.city],
    queryFn: () => api.activities.list({ country: state.country || undefined, city: state.city || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: discoverCuration, isLoading: curationLoading, isError: curationError, refetch: refetchCuration } = useQuery<DiscoverCurationResponse>({
    queryKey: ['/api/discover/curation', state.city, state.country, state.cultureIds ?? []],
    queryFn: () => api.discover.curation({
      city: state.city || undefined,
      country: state.country || undefined,
      cultureIds: state.cultureIds,
    }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: discoverFeed, isLoading: discoverLoading, refetch } = useQuery<DiscoverFeed>({
    queryKey: ['/api/discover', userId ?? 'guest', state.city, state.country, today],
    queryFn: () => api.discover.feed(userId ?? 'guest', {
      city: state.city || undefined,
      country: state.country || undefined,
    }) as Promise<DiscoverFeed>,
    staleTime: 5 * 60 * 1000,
  });

  const { data: traditionalLandsRaw } = useQuery<IndigenousTraditionalLand[]>({
    queryKey: ['/api/indigenous/traditional-lands'],
    queryFn: () => api.culture.indigenousTraditionalLands(),
    staleTime: Infinity,
  });

  const { data: indigenousOrganisations = [] } = useQuery<IndigenousOrganisation[]>({
    queryKey: ['/api/indigenous/organisations', state.country],
    queryFn: () => api.culture.indigenousOrganisations({
      country: state.country || 'Australia',
      featured: true,
      limit: 6,
    }),
    staleTime: 10 * 60 * 1000,
  });

  // --- Directory section queries ---
  const { data: restaurantsRaw = [], isLoading: restaurantsLoading } = useQuery<RestaurantData[]>({
    queryKey: ['/api/restaurants', state.city, state.country],
    queryFn: () => api.restaurants.list({ city: state.city || undefined, country: state.country || undefined }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: moviesRaw = [], isLoading: moviesLoading } = useQuery<MovieData[]>({
    queryKey: ['/api/movies', state.city, state.country],
    queryFn: () => (api.movies as any).list({ city: state.city || undefined, country: state.country || undefined, pageSize: 8 }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: shoppingRaw = [], isLoading: shoppingLoading } = useQuery<ShopData[]>({
    queryKey: ['/api/shopping', state.city, state.country],
    queryFn: () => api.shopping.list({ city: state.city || undefined, country: state.country || undefined }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: perksRaw = [], isLoading: perksLoading } = useQuery<PerkData[]>({
    queryKey: ['/api/perks', state.city, state.country],
    queryFn: () => api.perks.list(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: councilData } = useCouncil();
  const council = councilData?.council;

  const { events: gpsEvents, isLoading: gpsLoading, trigger: triggerGps, status: nearbyStatus, error: nearbyProbeError } = useNearbyEvents({ radiusKm: 15, pageSize: 20 });
  
  useEffect(() => {
    triggerGps();
  }, [triggerGps]);

  // --- Computed Values ---
  const councilEvents = useMemo(() => {
    if (!council || !allEvents.length) return [];
    return allEvents.filter((e) =>
      (e.lgaCode && council.lgaCode && e.lgaCode === council.lgaCode) ||
      (e.councilId && council.id && e.councilId === council.id)
    );
  }, [council, allEvents]);

  const nearbyEvents = useMemo(() => {
    if (gpsEvents.length > 0) return gpsEvents.slice(0, 10);
    return councilEvents.slice(0, 10);
  }, [gpsEvents, councilEvents]);

  const trendingEvents = useMemo(() => discoverFeed?.trendingEvents ?? [], [discoverFeed]);

  const selectedCityCoordinates = useMemo(() => cityToCoordinates(state.city), [state.city]);

  const distanceSortedEvents = useMemo(() => {
    if (!selectedCityCoordinates || allEvents.length === 0) return [];
    return allEvents
      .reduce((acc: (EventData & { distanceKm: number })[], event) => {
        if (!event.venue || !event.city) return acc;
        const coords = cityToCoordinates(event.city);
        if (!coords) return acc;
        const dist = calculateDistance(
          selectedCityCoordinates.latitude, selectedCityCoordinates.longitude,
          coords.latitude, coords.longitude,
        );
        acc.push({ ...event, distanceKm: dist });
        return acc;
      }, [])
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 12);
  }, [allEvents, selectedCityCoordinates]);

  const popularEvents = useMemo(() => {
    if (trendingEvents.length > 0) return trendingEvents;
    if (distanceSortedEvents.length > 0) return distanceSortedEvents;
    return allEvents.filter(e => e.venue).sort((a, b) => (b.attending || 0) - (a.attending || 0)).slice(0, 12);
  }, [trendingEvents, allEvents, distanceSortedEvents]);

  const forYouEvents = useMemo(() => {
    const { nationalityId, cultureIds } = state;
    if (!nationalityId && (!cultureIds || cultureIds.length === 0)) return [];
    return allEvents.filter((e) => {
      const tags: string[] = Array.isArray(e.cultureTag) ? (e.cultureTag as string[]) : [];
      if (nationalityId && tags.some((t) => t.toLowerCase().includes(nationalityId.toLowerCase()))) return true;
      if (cultureIds?.length) return cultureIds.some((id: string) => tags.some((t) => t.toLowerCase().includes(id.toLowerCase())));
      return false;
    }).slice(0, 10);
  }, [allEvents, state]);

  const nowBuckets = useMemo(() => {
    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const nowTotalMinutes = nowHours * 60 + nowMinutes;

    const happeningNow: EventData[] = [];
    const startingSoon: EventData[] = [];
    const laterTonight: EventData[] = [];

    allEvents.forEach((event) => {
      const range = parseEventRangeMs(event);
      if (!range) return;

      const startsInMs = range.startMs - now.getTime();
      const isActive = range.startMs <= now.getTime() && now.getTime() <= range.endMs;

      if (isActive) {
        happeningNow.push(event);
        return;
      }

      if (startsInMs > 0 && startsInMs <= 120 * 60 * 1000) {
        startingSoon.push(event);
        return;
      }

      const eventMinutes = (() => {
        const start = parseEventStartMs(event.date, event.time);
        if (start == null) return null;
        const startDate = new Date(start);
        return startDate.getHours() * 60 + startDate.getMinutes();
      })();

      if (eventMinutes != null && eventMinutes > nowTotalMinutes + 120) {
        laterTonight.push(event);
      }
    });

    return { happeningNow, startingSoon, laterTonight };
  }, [allEvents, currentTime]);

  /** Happening-now + starting-soon buckets merged, deduped; LIVE rows first, then by start time. */
  const startingSoonRailData = useMemo(() => {
    const seen = new Set<string>();
    const merged: EventData[] = [];
    for (const e of nowBuckets.happeningNow) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      merged.push(e);
    }
    for (const e of nowBuckets.startingSoon) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      merged.push(e);
    }
    const now = Date.now();
    merged.sort((a, b) => {
      const ta = parseEventStartMs(a.date, a.time);
      const tb = parseEventStartMs(b.date, b.time);
      if (ta == null && tb == null) return 0;
      if (ta == null) return 1;
      if (tb == null) return -1;
      const aRange = parseEventRangeMs(a);
      const bRange = parseEventRangeMs(b);
      const aLive = Boolean(aRange && aRange.startMs <= now && now <= aRange.endMs);
      const bLive = Boolean(bRange && bRange.startMs <= now && now <= bRange.endMs);
      if (aLive !== bLive) return aLive ? -1 : 1;
      return ta - tb;
    });
    return merged;
  }, [nowBuckets, currentTime]);

  const featuredEvents = useMemo(() => {
    const featured = allEvents.filter(e => e.isFeatured);
    if (featured.length >= 3) return featured.slice(0, 5);
    return [...featured, ...allEvents.filter(e => !e.isFeatured)].slice(0, 5);
  }, [allEvents]);

  const featuredArtists = useMemo(
    () => discoverCuration?.featuredArtists ?? [],
    [discoverCuration],
  );

  const heritagePlaylist = useMemo(
    () => discoverCuration?.heritagePlaylist ?? [],
    [discoverCuration],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/events'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/discover/curation'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/cities/featured'] }),
      refetch(),
      refetchCuration(),
    ]);
    setRefreshing(false);
  }, [refetch, refetchCuration]);

  const land = useMemo(() => 
    Array.isArray(traditionalLandsRaw) ? traditionalLandsRaw.find((l) => l.city === state.city) : undefined,
    [traditionalLandsRaw, state.city]
  );

  const nearbyLoading = gpsLoading || eventsLoading;

  // --- Preview rail mapped data ---
  const restaurantPreviewItems = useMemo((): (PreviewItem | 'skeleton')[] => {
    if (restaurantsLoading) return ['skeleton', 'skeleton', 'skeleton', 'skeleton'];
    return restaurantsRaw.slice(0, 8).map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl,
      title: r.name,
      subtitle: `${r.cuisine} · ${r.priceRange}`,
      badge: r.isOpen ? 'Open' : undefined,
      badgeColor: r.isOpen ? '#34C759' : undefined,
      route: `/restaurants/${r.id}`,
    }));
  }, [restaurantsRaw, restaurantsLoading]);

  const moviePreviewItems = useMemo((): (PreviewItem | 'skeleton')[] => {
    if (moviesLoading) return ['skeleton', 'skeleton', 'skeleton', 'skeleton'];
    return moviesRaw.slice(0, 8).map((m) => ({
      id: m.id,
      imageUrl: m.posterUrl,
      title: m.title,
      subtitle: Array.isArray(m.genre) ? m.genre[0] : m.genre,
      badge: m.rating,
      badgeColor: '#1C1C1E',
      route: `/movies/${m.id}`,
    }));
  }, [moviesRaw, moviesLoading]);

  const shoppingPreviewItems = useMemo((): (PreviewItem | 'skeleton')[] => {
    if (shoppingLoading) return ['skeleton', 'skeleton', 'skeleton', 'skeleton'];
    return shoppingRaw.slice(0, 8).map((s) => ({
      id: s.id,
      imageUrl: s.imageUrl,
      title: s.name,
      subtitle: s.category,
      badge: s.deliveryAvailable ? 'Delivery' : s.isOpen ? 'Open' : undefined,
      badgeColor: s.deliveryAvailable ? CultureTokens.teal : '#34C759',
      route: `/shopping/${s.id}`,
    }));
  }, [shoppingRaw, shoppingLoading]);

  const perksPreviewItems = useMemo((): (PreviewItem | 'skeleton')[] => {
    if (perksLoading) return ['skeleton', 'skeleton', 'skeleton', 'skeleton'];
    return perksRaw.slice(0, 8).map((p) => ({
      id: p.id,
      imageUrl: p.coverUrl,
      title: p.title,
      subtitle: p.partnerName ?? p.categories?.[0],
      badge: p.discountPercent ? `${p.discountPercent}% off` : p.perkType,
      badgeColor: CultureTokens.indigo,
      route: `/perks/${p.id}`,
    }));
  }, [perksRaw, perksLoading]);

  const popularRailData = useMemo((): (EventData | string)[] =>
    eventsLoading || discoverLoading ? ['s1', 's2', 's3', 's4'] : popularEvents,
    [eventsLoading, discoverLoading, popularEvents]
  );

  const communityRailData = useMemo((): (Community | string)[] =>
    communitiesLoading ? ['s1', 's2', 's3', 's4'] : allCommunities,
    [communitiesLoading, allCommunities]
  );

  const nearbyRailData = useMemo((): (EventData | string)[] =>
    nearbyLoading ? ['s1', 's2', 's3', 's4'] : nearbyEvents,
    [nearbyLoading, nearbyEvents]
  );

  const activityRailData = useMemo((): (ActivityData | string)[] =>
    activitiesLoading ? ['s1', 's2', 's3', 's4'] : allActivities,
    [activitiesLoading, allActivities]
  );

  const eventsRailError = useMemo(
    () => (eventsError ? 'Could not load events. Check your connection and try again.' : null),
    [eventsError],
  );

  const communitiesRailError = useMemo(
    () => (communitiesError ? 'Could not load communities. Pull to refresh or try again.' : null),
    [communitiesError],
  );

  const activitiesRailError = useMemo(
    () => (activitiesError ? 'Could not load activities. Try again in a moment.' : null),
    [activitiesError],
  );

  const nearbyRailError = useMemo(() => {
    if (nearbyLoading || nearbyEvents.length > 0) return null;
    if (eventsError) return 'Could not load local events.';
    if (nearbyProbeError) return nearbyProbeError;
    if (nearbyStatus === 'error') return 'Could not determine your location. Try again.';
    return null;
  }, [nearbyLoading, nearbyEvents.length, eventsError, nearbyProbeError, nearbyStatus]);

  const curationRailError = useMemo(
    () => (curationError ? 'Could not load featured artists. Try again.' : null),
    [curationError],
  );

  return {
    currentTime,
    weatherSummary,
    refreshing,
    handleRefresh,
    allEvents,
    eventsLoading,
    allCommunities,
    communitiesLoading,
    allActivities,
    activitiesLoading,
    nearbyEvents,
    nearbyLoading,
    popularEvents,
    forYouEvents,
    featuredEvents,
    land,
    indigenousOrganisations,
    nowBuckets,
    startingSoonRailData,
    popularRailData,
    communityRailData,
    nearbyRailData,
    activityRailData,
    featuredArtists,
    heritagePlaylist,
    discoverLoading,
    council,
    state,
    isAuthenticated,
    userId,
    // Directory preview rails
    restaurantPreviewItems,
    restaurantsLoading,
    moviePreviewItems,
    moviesLoading,
    shoppingPreviewItems,
    shoppingLoading,
    perksPreviewItems,
    perksLoading,
    eventsError,
    communitiesError,
    activitiesError,
    curationError,
    curationLoading,
    refetchEvents,
    refetchCommunities,
    refetchActivities,
    refetchCuration,
    retryNearbyProbe: triggerGps,
    eventsRailError,
    communitiesRailError,
    activitiesRailError,
    nearbyRailError,
    curationRailError,
  };
}

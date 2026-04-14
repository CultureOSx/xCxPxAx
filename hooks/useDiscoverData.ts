import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { api, type ActivityData, type IndigenousOrganisation, type IndigenousTraditionalLand } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useCouncil } from '@/hooks/useCouncil';
import { useNearbyEvents } from '@/hooks/useNearbyEvents';
import { calculateDistance, getPostcodesByPlace } from '@shared/location/australian-postcodes';
import type {
  AdaptiveCultureRail,
  CultureCardModel,
  DiscoverCurationResponse,
  EventData,
  Community,
  RestaurantData,
  ShopData,
  MovieData,
  PerkData,
} from '@/shared/schema';
import type { PreviewItem } from '@/components/Discover/PreviewRail';
import { CultureTokens } from '@/constants/theme';
import { formatEventDateTimeBadge, isEventInDiscoverLiveWindow, parseEventStartMs } from '@/lib/dateUtils';
import { captureDiscoverView, captureReturn } from '@/lib/analytics-funnel';

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

function isWeekendDate(dateStr?: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isTonightEvent(event: EventData): boolean {
  const date = new Date(event.date);
  const now = new Date();
  if (date.toDateString() !== now.toDateString()) return false;
  if (!event.time) return true;
  const [hours] = event.time.split(':').map(Number);
  return Number.isFinite(hours) && hours >= 17;
}

function eventLooksFamilyFriendly(event: EventData): boolean {
  const haystack = [
    event.title,
    event.description,
    event.category,
    ...(event.tags ?? []),
    ...(event.cultureTag ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /family|kids|child|all ages|community day|workshop|festival/.test(haystack);
}

function eventIsPremium(event: EventData): boolean {
  if (typeof event.priceCents === 'number') return event.priceCents >= 5000;
  const numeric = Number.parseFloat((event.priceLabel ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) && numeric >= 50;
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
  const discoverViewedRef = useRef(false);

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
    }) as unknown as Promise<DiscoverFeed>,
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
      if (!event.time) return;
      const [h, m] = event.time.split(':').map(Number);
      const eventMinutes = h * 60 + m;

      // Happening Now: Started in the last 2 hours OR starting in the next 30 mins
      if (eventMinutes <= nowTotalMinutes + 30 && eventMinutes >= nowTotalMinutes - 120) {
        happeningNow.push(event);
      }
      // Starting Soon: Starting in 30-120 mins
      else if (eventMinutes > nowTotalMinutes + 30 && eventMinutes <= nowTotalMinutes + 120) {
        startingSoon.push(event);
      }
      // Later Tonight: Starting after 120 mins but before midnight
      else if (eventMinutes > nowTotalMinutes + 120) {
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
      const aLive = isEventInDiscoverLiveWindow(ta, now);
      const bLive = isEventInDiscoverLiveWindow(tb, now);
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

  useEffect(() => {
    if (discoverViewedRef.current || allEvents.length === 0) return;
    captureDiscoverView(userId ?? 'guest', 'discover_home');
    captureReturn(userId ?? 'guest', 'discover_home_session');
    discoverViewedRef.current = true;
  }, [allEvents.length, userId]);

  const featuredArtists = useMemo(
    () => discoverCuration?.featuredArtists ?? [],
    [discoverCuration],
  );

  const heritagePlaylist = useMemo(
    () => discoverCuration?.heritagePlaylist ?? [],
    [discoverCuration],
  );

  const unifiedCultureCards = useMemo((): CultureCardModel[] => {
    const eventCards: CultureCardModel[] = allEvents.slice(0, 12).map((event) => ({
      id: `event-${event.id}`,
      entityType: 'event',
      title: event.title,
      subtitle: event.venue ?? event.city,
      imageUrl: event.imageUrl,
      meta: formatEventDateTimeBadge(event.date, event.time),
      trust: {
        isVerified: (event.organizerReputationScore ?? 0) >= 80,
        socialProof: typeof event.attending === 'number' ? `${event.attending} attending` : undefined,
        qualityRank: Math.min(100, Math.max(1, (event.attending ?? 0) + (event.isFeatured ? 25 : 0))),
      },
      primaryAction: {
        kind: 'book',
        label: event.entryType === 'free_open' || event.priceLabel?.toLowerCase() === 'free' ? 'Join Free' : 'Get Ticket',
        route: `/event/${event.id}`,
      },
    }));

    const businessCards: CultureCardModel[] = restaurantsRaw.slice(0, 6).map((biz) => ({
      id: `business-${biz.id}`,
      entityType: 'business',
      title: biz.name,
      subtitle: `${biz.cuisine} · ${biz.priceRange}`,
      imageUrl: biz.imageUrl,
      meta: biz.city,
      trust: {
        isVerified: biz.rating >= 4.6,
        socialProof: `${biz.reviewsCount} reviews`,
        qualityRank: Math.round((biz.rating ?? 0) * 20),
      },
      primaryAction: {
        kind: 'directions',
        label: 'Directions',
        route: `/restaurants/${biz.id}`,
      },
    }));

    const artistCards: CultureCardModel[] = featuredArtists.slice(0, 6).map((artist) => ({
      id: `artist-${artist.id}`,
      entityType: 'artist',
      title: artist.name,
      subtitle: artist.subtitle,
      imageUrl: artist.imageUrl,
      meta: artist.meta,
      trust: {
        isVerified: artist.source === 'profile',
        socialProof: artist.source === 'profile' ? 'Featured profile' : 'Curated highlight',
        qualityRank: artist.source === 'profile' ? 90 : 75,
      },
      primaryAction: {
        kind: 'follow',
        label: 'Follow Artist',
        route: artist.route.type === 'artist' ? `/artist/${artist.route.id}` : '/(tabs)/explore',
      },
    }));

    const communityCards: CultureCardModel[] = allCommunities.slice(0, 8).map((community) => {
      const members = typeof community.membersCount === 'number' ? community.membersCount : community.memberCount;
      const upcoming = community.communityHealth?.upcomingEventsCount;
      return {
        id: `community-${community.id}`,
        entityType: 'community',
        title: community.name,
        subtitle: community.headline ?? community.city,
        imageUrl: community.imageUrl,
        meta: community.city,
        trust: {
          isVerified: Boolean(community.isVerified),
          socialProof: typeof members === 'number' ? `${members} members` : undefined,
          qualityRank: Math.min(100, Math.max(1, (upcoming ?? 0) * 10 + (community.isVerified ? 20 : 0))),
        },
        primaryAction: {
          kind: 'message',
          label: 'Join Community',
          route: `/community/${community.slug || community.id}`,
        },
      };
    });

    const seen = new Set<string>();
    return [...eventCards, ...businessCards, ...artistCards, ...communityCards].filter((card) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    });
  }, [allEvents, restaurantsRaw, featuredArtists, allCommunities]);

  const adaptiveCultureRails = useMemo((): AdaptiveCultureRail[] => {
    const eventCards = allEvents.map((event) => ({
      card: unifiedCultureCards.find((item) => item.id === `event-${event.id}`),
      event,
    }));

    const tonight = eventCards
      .filter(({ event, card }) => card && isTonightEvent(event))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);
    const weekend = eventCards
      .filter(({ event, card }) => card && isWeekendDate(event.date))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);
    const family = eventCards
      .filter(({ event, card }) => card && eventLooksFamilyFriendly(event))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);
    const free = eventCards
      .filter(({ event, card }) => card && (event.entryType === 'free_open' || event.priceLabel?.toLowerCase() === 'free'))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);
    const premium = eventCards
      .filter(({ event, card }) => card && eventIsPremium(event))
      .slice(0, 10)
      .map(({ card }) => card as CultureCardModel);

    const rails: AdaptiveCultureRail[] = [
      { id: 'tonight', title: 'Tonight', subtitle: 'Right now and later this evening', items: tonight },
      { id: 'weekend', title: 'This Weekend', subtitle: 'Plan your cultural weekend', items: weekend },
      { id: 'family', title: 'Family-friendly', subtitle: 'Designed for all ages', items: family },
      { id: 'free', title: 'Free', subtitle: 'No-cost culture nearby', items: free },
      { id: 'premium', title: 'Premium', subtitle: 'High-demand signature experiences', items: premium },
    ];
    return rails.filter((rail) => rail.items.length > 0);
  }, [allEvents, unifiedCultureCards]);

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
    unifiedCultureCards,
    adaptiveCultureRails,
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

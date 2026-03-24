import { useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { api, type ActivityData, type IndigenousOrganisation, type IndigenousFestival, type IndigenousBusiness } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useCouncil } from '@/hooks/useCouncil';
import { useNearbyEvents } from '@/hooks/useNearbyEvents';
import { calculateDistance, getPostcodesByPlace } from '@shared/location/australian-postcodes';
import type { DiscoverCurationResponse, EventData, Community } from '@/shared/schema';

const isWeb = Platform.OS === 'web';

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
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  const data = await res.json();
  return data.current_weather;
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
        if (!cancelled) setWeatherSummary(`${Math.round(w.temperature)}°C ${w.weathercode === 0 ? 'Clear' : ''}`);
      })
      .catch(() => { if (!cancelled) setWeatherSummary(''); });
    return () => { cancelled = true; };
  }, [coords.lat, coords.lon]);

  const [refreshing, setRefreshing] = useState(false);

  // --- Data Fetching ---
  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const { data: allEvents = [], isLoading: eventsLoading } = useQuery<EventData[]>({
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

  const { data: allCommunities = [], isLoading: communitiesLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities', state.city, state.country],
    queryFn: () => api.communities.list({ city: state.city || undefined, country: state.country || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allActivities = [], isLoading: activitiesLoading } = useQuery<ActivityData[]>({
    queryKey: ['/api/activities', state.country, state.city],
    queryFn: () => api.activities.list({ country: state.country || undefined, city: state.city || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: discoverCuration } = useQuery<DiscoverCurationResponse>({
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

  const { data: traditionalLandsRaw } = useQuery<{ city: string, landName: string, traditionalCustodians: string }[]>({
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

  const { data: councilData } = useCouncil();
  const council = councilData?.council;

  const { events: gpsEvents, isLoading: gpsLoading, trigger: triggerGps } = useNearbyEvents({ radiusKm: 15, pageSize: 20 });
  
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
      refetch()
    ]);
    setRefreshing(false);
  }, [refetch]);

  const land = useMemo(() => 
    Array.isArray(traditionalLandsRaw) ? traditionalLandsRaw.find((l) => l.city === state.city) : undefined,
    [traditionalLandsRaw, state.city]
  );

  const nearbyLoading = gpsLoading || eventsLoading;

  const popularRailData = useMemo(() => 
    eventsLoading || discoverLoading ? ['s1', 's2', 's3', 's4'] : popularEvents,
    [eventsLoading, discoverLoading, popularEvents]
  );

  const communityRailData = useMemo(() => 
    communitiesLoading ? ['s1', 's2', 's3', 's4'] : allCommunities,
    [communitiesLoading, allCommunities]
  );

  const nearbyRailData = useMemo(() => 
    nearbyLoading ? ['s1', 's2', 's3', 's4'] : nearbyEvents,
    [nearbyLoading, nearbyEvents]
  );

  const activityRailData = useMemo(() => 
    activitiesLoading ? ['s1', 's2', 's3', 's4'] : allActivities,
    [activitiesLoading, allActivities]
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
  };
}

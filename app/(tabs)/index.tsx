import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { TextStyles } from '@/constants/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import type { EventData, Community } from '@/shared/schema';
import { useMemo, useCallback, useState, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LocationPicker } from '@/components/LocationPicker';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  api,
  type ActivityData,
  type IndigenousOrganisation,
  type IndigenousFestival,
  type IndigenousBusiness,
} from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useColors } from '@/hooks/useColors';
import EventCard from '@/components/Discover/EventCard';
import CategoryCard from '@/components/Discover/CategoryCard';
import CommunityCard from '@/components/Discover/CommunityCard';
import CityCard from '@/components/Discover/CityCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { CommunityCardSkeleton } from '@/components/CommunityCardSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatEventDateTime } from '@/lib/dateUtils';
import { CategoryColors, CultureTokens } from '@/constants/theme';
import { FilterChipRow } from '@/components/FilterChip';

import { Card } from '@/components/ui/Card';
import SectionHeader from '@/components/Discover/SectionHeader';
import { calculateDistance, getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { useCouncil } from '@/hooks/useCouncil';
import { useNearbyEvents } from '@/hooks/useNearbyEvents';
import { useLayout } from '@/hooks/useLayout';
import { routeWithRedirect } from '@/lib/routes';

const isWeb = Platform.OS === 'web';

const superAppSections = [
  { id: 'indigenous', label: '🪃 Indigenous', icon: 'leaf', color: CultureTokens.gold, route: '/(tabs)/explore?focus=indigenous' },
  { id: 'movies', label: 'Movies', icon: 'film', color: CultureTokens.error, route: '/movies' },
  { id: 'restaurants', label: 'Dining', icon: 'restaurant', color: CultureTokens.saffron, route: '/restaurants' },
  { id: 'activities', label: 'Activities', icon: 'compass', color: CultureTokens.success, route: '/activities' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle', color: CategoryColors.shopping, route: '/shopping' },
  { id: 'search', label: 'Search', icon: 'search', color: CultureTokens.indigo, route: '/search/index' },
  { id: 'events', label: 'All Events', icon: 'calendar', color: CultureTokens.saffron, route: '/events' },
  { id: 'directory', label: 'Directory', icon: 'storefront', color: CultureTokens.teal, route: '/(tabs)/directory' },
] as const;

const browseCategories = [
  { id: 'c1', label: 'Music', icon: 'musical-notes', color: CategoryColors.music },
  { id: 'c2', label: 'Dance', icon: 'body', color: CategoryColors.dance },
  { id: 'c3', label: 'Food', icon: 'restaurant', color: CategoryColors.food },
  { id: 'c4', label: 'Art', icon: 'color-palette', color: CategoryColors.art },
  { id: 'c5', label: 'Wellness', icon: 'heart', color: CategoryColors.wellness },
  { id: 'c6', label: 'Movies', icon: 'film', color: CategoryColors.movies },
  { id: 'c7', label: 'Workshop', icon: 'construct', color: CategoryColors.workshop },
  { id: 'c8', label: 'Heritage', icon: 'library', color: CategoryColors.heritage },
  { id: 'c9', label: 'Activities & Play', icon: 'game-controller', color: CategoryColors.activities },
  { id: 'c10', label: 'Nightlife', icon: 'moon', color: CategoryColors.nightlife },
  { id: 'c14', label: 'Featured Artists', icon: 'star', color: CategoryColors.artists },
] as const;

const FEATURED_CITIES = [
  { name: 'Sydney', country: 'Australia' },
  { name: 'Melbourne', country: 'Australia' },
  { name: 'Brisbane', country: 'Australia' },
  { name: 'Perth', country: 'Australia' },
  { name: 'Adelaide', country: 'Australia' },
  { name: 'Gold Coast', country: 'Australia' },
  { name: 'Canberra', country: 'Australia' },
  { name: 'Hobart', country: 'Australia' },
] as const;

const POPULAR_RAIL_SNAP_INTERVAL = 254;
const COMMUNITY_RAIL_SNAP_INTERVAL = 196;
const CATEGORY_RAIL_SNAP_INTERVAL = 122;
const HERO_CARD_DESKTOP_WIDTH = 800;

function pushSafe(route?: string) {
  if (!route) return;
  router.push(route as never);
}

interface DiscoverFeed {
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

function cityToCoordinates(city?: string): { latitude: number; longitude: number } | null {
  if (!city) return null;
  const match = getPostcodesByPlace(city)[0];
  if (!match) return null;
  return { latitude: match.latitude, longitude: match.longitude };
}


export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const colors = useColors();
  const styles = getStyles(colors);
  const { width, isDesktop, isTablet } = useLayout();
  const { state } = useOnboarding();
  const { isAuthenticated, userId: authUserId, user: authUser } = useAuth();


  // Weather API helper (Open-Meteo, no API key needed)
  async function fetchWeather(lat: number, lon: number) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    return data.current_weather;
  }

  // --- Time and Weather State ---
  const [currentTime, setCurrentTime] = useState('');
  const [weatherSummary, setWeatherSummary] = useState('');

  // Get city coordinates (fallback to Sydney)
  const cityCoords: Record<string, { lat: number; lon: number }> = {
    'Sydney': { lat: -33.8688, lon: 151.2093 },
    'Melbourne': { lat: -37.8136, lon: 144.9631 },
    'Brisbane': { lat: -27.4698, lon: 153.0251 },
    'Perth': { lat: -31.9505, lon: 115.8605 },
    'Adelaide': { lat: -34.9285, lon: 138.6007 },
    'Gold Coast': { lat: -28.0167, lon: 153.4000 },
    'Canberra': { lat: -35.2809, lon: 149.1300 },
    'Hobart': { lat: -42.8821, lon: 147.3272 },
  };
  const city = state.city || 'Sydney';
  const coords = cityCoords[city] || cityCoords['Sydney'];

  // Update time every minute
  useEffect(() => {
    function updateTime() {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather on mount and when city changes
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

  // 1. Data Fetching with strict Error State capturing
  const today = new Date().toLocaleDateString('en-CA');
  const { data: allEvents = [], isLoading: eventsLoading, isError: eventsError } = useQuery<EventData[]>({
    queryKey: ['/api/events', state.country, state.city, today],
    queryFn: async () => {
      // Use local date (YYYY-MM-DD) instead of UTC
      const result = await api.events.list({
        country: state.country || undefined,
        city: state.city || undefined,
        pageSize: 50,
        dateFrom: today,
      });
      const raw = result.events;
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allCommunities = [], isLoading: communitiesLoading, isError: communitiesError } = useQuery<Community[]>({
    queryKey: ['/api/communities', state.city, state.country],
    queryFn: () => api.communities.list({ city: state.city || undefined, country: state.country || undefined }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: allActivities = [], isLoading: activitiesLoading, isError: activitiesError } = useQuery<ActivityData[]>({
    queryKey: ['/api/activities', state.country, state.city],
    queryFn: () => api.activities.list({ country: state.country || undefined, city: state.city || undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: discoverFeed, isLoading: discoverLoading, refetch } = useQuery<DiscoverFeed>({
    queryKey: ['/api/discover', authUserId ?? 'guest', state.city, state.country, today],
    queryFn: async () => {
      return api.discover.feed(authUserId ?? 'guest', {
        city: state.city || undefined,
        country: state.country || undefined,
      }) as Promise<DiscoverFeed>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: traditionalLandsRaw } = useQuery<{ city: string, landName: string, traditionalCustodians: string }[]>({
    queryKey: ['/api/indigenous/traditional-lands'],
    queryFn: () => api.culture.indigenousTraditionalLands(),
    staleTime: Infinity, // This data rarely changes
  });
  const traditionalLandsData = Array.isArray(traditionalLandsRaw) ? traditionalLandsRaw : [];
  const { data: indigenousOrganisationsData } = useQuery<IndigenousOrganisation[]>({
    queryKey: ['/api/indigenous/organisations', state.country],
    queryFn: () => api.culture.indigenousOrganisations({
      country: state.country || 'Australia',
      featured: true,
      limit: 6,
    }),
    staleTime: 10 * 60 * 1000,
  });
  const indigenousOrganisations = Array.isArray(indigenousOrganisationsData) ? indigenousOrganisationsData : [];
  const { data: indigenousFestivalsData } = useQuery<IndigenousFestival[]>({
    queryKey: ['/api/indigenous/festivals', state.country],
    queryFn: () => api.culture.indigenousFestivals({
      region: 'australia',
      indigenousOnly: true,
      limit: 8,
    }),
    staleTime: 10 * 60 * 1000,
  });
  const indigenousFestivals = Array.isArray(indigenousFestivalsData) ? indigenousFestivalsData : [];
  const { data: indigenousBusinessesData } = useQuery<IndigenousBusiness[]>({
    queryKey: ['/api/indigenous/businesses', state.country],
    queryFn: () => api.culture.indigenousBusinesses({
      country: state.country || 'Australia',
      featured: true,
      limit: 8,
    }),
    staleTime: 10 * 60 * 1000,
  });
  const indigenousBusinesses = Array.isArray(indigenousBusinessesData) ? indigenousBusinessesData : [];

  const { data: councilData } = useCouncil();
  const council = councilData?.council;

  // GPS proximity — trigger once on mount, auto-silently (no blocking UI)
  const { events: gpsEvents, isLoading: gpsLoading, trigger: triggerGps } = useNearbyEvents({ radiusKm: 15, pageSize: 20 });
  useEffect(() => {
    triggerGps();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Computed Values
  const councilEvents = useMemo(() => {
    if (!council || !Array.isArray(allEvents) || !allEvents.length) return [];
    return allEvents.filter((e) =>
      (e.lgaCode && council.lgaCode && e.lgaCode === council.lgaCode) ||
      (e.councilId && council.id && e.councilId === council.id)
    );
  }, [council, allEvents]);

  // Prefer live GPS results; fall back to LGA matching
  const nearbyEvents = useMemo(() => {
    if (gpsEvents.length > 0) return gpsEvents.slice(0, 10);
    return councilEvents.slice(0, 10);
  }, [gpsEvents, councilEvents]);

  const nearbyLoading = gpsLoading || eventsLoading;
  const nearbySubtitle = gpsEvents.length > 0
    ? 'Events within 15 km of you'
    : council?.name
      ? `Happening in ${council.name}`
      : 'Events near your local area';

  const councilRailData = useMemo<(EventData | string)[]>(
    () => nearbyLoading
      ? Array.from({ length: 4 }, (_, i) => `sk-cou-${i}`)
      : nearbyEvents,
    [nearbyLoading, nearbyEvents],
  );

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }, []);

  const firstName = useMemo(() => {
    if (!isAuthenticated) return 'Guest';
    const name = authUser?.displayName ?? authUser?.username ?? '';
    return name.split(' ')[0] || 'Member';
  }, [isAuthenticated, authUser]);

  const trendingEvents = useMemo(() => discoverFeed?.trendingEvents ?? [], [discoverFeed?.trendingEvents]);

  const openInternalMap = () => {
    router.push('/map');
  };


  const selectedCityCoordinates = useMemo(() => cityToCoordinates(state.city), [state.city]);

  // Optimized distance calculation
  const distanceSortedEvents = useMemo(() => {
    if (!selectedCityCoordinates || !Array.isArray(allEvents) || allEvents.length === 0) return [];

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
    return (Array.isArray(allEvents) ? allEvents : []).filter(e => e.venue).sort((a, b) => (b.attending || 0) - (a.attending || 0)).slice(0, 12);
  }, [trendingEvents, allEvents, distanceSortedEvents]);

  const popularRailData = useMemo<(EventData | string)[]>(
    () => (discoverLoading || eventsLoading)
      ? Array.from({ length: 4 }, (_, i) => `sk-pop-${i}`)
      : popularEvents,
    [discoverLoading, eventsLoading, popularEvents],
  );

  const featuredEvents = useMemo(() => {
    const safeEvents = Array.isArray(allEvents) ? allEvents : [];
    const featured = safeEvents.filter(e => e.isFeatured);
    if (featured.length >= 3) return featured.slice(0, 5);
    return [...featured, ...safeEvents.filter(e => !e.isFeatured)].slice(0, 5);
  }, [allEvents]);

  // --- TIME CATEGORIZATION ---
  const nowBuckets = useMemo(() => {
    const safeEvents = Array.isArray(allEvents) ? allEvents : [];
    const current = new Date();
    
    const parseTime = (dateStr: string, timeStr?: string) => {
      const base = new Date(dateStr);
      if (isNaN(base.getTime())) return null;
      if (!timeStr) return base;
      
      const t = timeStr.toLowerCase().trim();
      const firstPart = t.split(/to|-|–/)[0].trim();
      const match = firstPart.match(/(\d+)(?::(\d+))?\s*(am|pm)?/);
      if (!match) return base;
      
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3];
      
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      base.setHours(hours, minutes, 0, 0);
      return base;
    };

    const buckets = {
      happeningNow: [] as EventData[],
      startingSoon: [] as EventData[],
      laterTonight: [] as EventData[]
    };

    const todayStr = current.toLocaleDateString('en-CA');
    const todayEvents = safeEvents.filter(e => e.date === todayStr);

    todayEvents.forEach(e => {
      const start = parseTime(e.date, e.time);
      if (!start) return;

      const diffMs = start.getTime() - current.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);

      if (diffHrs < 0 && diffHrs > -3) {
        // Started recently (within 3 hours)
        buckets.happeningNow.push(e);
      } else if (diffHrs >= 0 && diffHrs <= 3) {
        // Starting in next 3 hours
        buckets.startingSoon.push(e);
      } else if (diffHrs > 3) {
        buckets.laterTonight.push(e);
      }
    });

    // Sort buckets by time
    buckets.happeningNow.sort((a,b) => (a.time || '').localeCompare(b.time || ''));
    buckets.startingSoon.sort((a,b) => (a.time || '').localeCompare(b.time || ''));
    buckets.laterTonight.sort((a,b) => (a.time || '').localeCompare(b.time || ''));

    return buckets;
  }, [allEvents]);

  const cultureCards = useMemo(() => (Array.isArray(allCommunities) ? allCommunities : []).slice(0, 10), [allCommunities]);
  const communityRailData = useMemo<(Community | string)[]>(
    () => communitiesLoading
      ? Array.from({ length: 4 }, (_, i) => `sk-com-${i}`)
      : cultureCards,
    [communitiesLoading, cultureCards],
  );
  const browseCategoryRailData = useMemo(() => browseCategories, []);
  const activityRailData = useMemo<(ActivityData | string)[]>(
    () => activitiesLoading
      ? Array.from({ length: 4 }, (_, i) => `sk-act-${i}`)
      : (Array.isArray(allActivities) ? allActivities : []).slice(0, 10),
    [activitiesLoading, allActivities],
  );

  // Layout metrics
  const cityColumns = isWeb ? 3 : 2; // 2 cols on mobile apps, 3 cols on web
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 800 : width;
  const cityGridWidth = isDesktop ? Math.min(width, contentMaxWidth) : width;
  const cityCardWidth = Math.max(140, (cityGridWidth - 40 - (12 * (cityColumns - 1))) / cityColumns);
  const heroCardWidth = isDesktop ? HERO_CARD_DESKTOP_WIDTH : width;
  const heroSnapInterval = isDesktop ? HERO_CARD_DESKTOP_WIDTH + 16 : width;

  // Animations
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => { scrollY.value = event.contentOffset.y; });
  const headerBlurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP),
  }));

  const openNotifications = useCallback(() => {
    if (isAuthenticated) { pushSafe('/notifications'); return; }
    router.push(routeWithRedirect('/(onboarding)/login', '/notifications') as any);
  }, [isAuthenticated]);

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

  const land = Array.isArray(traditionalLandsData) ? traditionalLandsData.find((l) => l.city === state.city) : undefined;

  const renderFeaturedEvent = useCallback(({ item, index }: { item: EventData; index: number }) => (
    <View
      style={{
        width: heroCardWidth,
        paddingHorizontal: isDesktop ? 0 : 20,
        marginRight: isDesktop && index < featuredEvents.length - 1 ? 20 : 0,
      }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.heroCard,
          pressed && !isWeb && { transform: [{ scale: 0.98 }] },
          pressed && isWeb && { opacity: 0.9 },
        ]}
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(11,11,20,0.3)', 'rgba(11,11,20,0.9)']}
          style={StyleSheet.absoluteFillObject}
          locations={[0, 0.5, 1]}
        />

        <View style={styles.heroCardBadge}>
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
          <Text style={styles.heroCardBadgeText}>FEATURED</Text>
        </View>

        <View style={styles.heroCardContent}>
          <View style={styles.heroCardMetaTop}>
            <View style={[styles.heroCardPrice, { backgroundColor: (item.priceCents === 0 || item.isFree) ? CultureTokens.saffron : CultureTokens.indigo }]}>
              <Text style={styles.heroCardPriceText}>
                {(item.priceCents === 0 || item.isFree) ? 'FREE' : item.priceLabel || 'TICKETS'}
              </Text>
            </View>
            <View style={styles.heroCardDateBox}>
              <Text style={styles.heroCardDateText}>{formatEventDateTime(item.date, item.time)}</Text>
            </View>
          </View>

          <Text style={styles.heroCardTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.heroCardLocationRow}>
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroCardLocation} numberOfLines={1}>{item.venue || item.city}</Text>
          </View>
        </View>
      </Pressable>
    </View>
  ), [featuredEvents.length, heroCardWidth, isDesktop, styles]);

  return (
    <ErrorBoundary>
      <View style={[styles.container]}>

        {/* Background Atmospheric Gradient */}
        <LinearGradient
          colors={[CultureTokens.indigo + '80', CultureTokens.saffron + '10', 'transparent']}
          locations={[0, 0.6, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 600, opacity: 0.8 }}
        />
        {isWeb && (
          <>
            <View style={[styles.orb, { top: -100, right: -50, backgroundColor: CultureTokens.indigo, opacity: 0.4, filter: 'blur(100px)' } as any]} />
            <View style={[styles.orb, { top: 200, left: -100, backgroundColor: CultureTokens.saffron, opacity: 0.25, filter: 'blur(120px)' } as any]} />
          </>
        )}

        {!(isWeb && isDesktop) && (
          <Animated.View
            style={[styles.topBarGradient, { paddingTop: topInset, zIndex: 100 }]}
          >
            <Animated.View style={[StyleSheet.absoluteFill, headerBlurStyle]}>
              <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            </Animated.View>
            <View style={styles.topBar}>
              <Animated.View style={[styles.topBarBorder, headerBlurStyle, { pointerEvents: 'none' }]} />

              {/* Logo + Name + Tagline */}
              <Pressable
                onPress={() => router.push('/(tabs)')}
                style={({ pressed }) => [styles.brandBlock, pressed && { opacity: 0.9 }]}
                accessibilityLabel="CulturePass home"
                accessibilityRole="button"
              >
                <View style={styles.logoCircle}>
                  <Image
                    source={require('../../assets/images/culturepass-logo.png')}
                    style={styles.logoImg}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.brandTextBlock}>
                  <Text style={styles.brandAppName}>CulturePass.App</Text>
                  <Text style={styles.brandTagline}>Belong Anywhere</Text>
                </View>
              </Pressable>

              {/* Spacer */}
              <View style={styles.topBarSpacer} />

              {/* Action icons: Location, Search, Notifications */}
              <View style={styles.topBarActions}>
                <LocationPicker
                  variant="icon"
                  iconColor="#FFFFFF"
                  buttonStyle={styles.headerIconBtn}
                />
                <Pressable
                  onPress={openInternalMap}
                  style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.8 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Map View"
                >
                  <Ionicons name="map-outline" size={22} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  onPress={openNotifications}
                  style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.8 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                >
                  <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                  {isAuthenticated && <View style={styles.notifDot} />}
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={isWeb ? (e: any) => { scrollY.value = e.nativeEvent.contentOffset.y; } : scrollHandler}
          scrollEventThrottle={16}
          removeClippedSubviews
          contentContainerStyle={[
            { paddingBottom: 120 },
            isDesktop && { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={CultureTokens.indigo} />}
        >

          {/* Mobile hero section */}
          {!isDesktop && (
            <View style={styles.mobileHeroSection}>
              <View style={styles.heroGreetingBlock}>
                <Text style={styles.heroGreetingMain}>{timeGreeting}, {firstName} 👋</Text>
              </View>
              <LinearGradient
                colors={[CultureTokens.indigo, '#4834D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroBanner}
              >
                <View style={styles.heroBannerOrb} />
                <View style={styles.heroBannerContent}>
                  <View style={styles.heroBannerIconWrap}>
                    <Ionicons name="flash" size={20} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroBannerTitle}>Discover Local Culture.</Text>
                    <Text style={styles.heroBannerSub}>
                      Events, communities, and experiences
                      {state.city ? ` in ${state.city}` : ' across Australia'}
                      {/* Show time and weather here */}
                      {`  |  ${currentTime}  |  ${weatherSummary}`}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Desktop hero section — with greeting like mobile */}
          {isDesktop && (
            <View style={styles.heroSectionDesktop}>
              <View style={styles.heroDesktopLeft}>
                <Text style={styles.heroGreetingDesktop}>{timeGreeting}, {firstName} 👋</Text>
                <Text style={styles.heroTitleDesktop}>Discover Local Culture.</Text>
                <Text style={styles.heroSubtitleDesktop}>
                  Events, communities, and experiences
                  {state.city ? ` in ${state.city}` : ' across Australia'}
                  {/* Show time and weather here */}
                  {`  |  ${currentTime}  |  ${weatherSummary}`}
                </Text>
              </View>
              {Platform.OS === 'web' && (
                <View style={styles.desktopActionsRight}>
                  <LocationPicker
                    variant="icon"
                    iconColor={colors.text}
                    buttonStyle={styles.desktopHeaderIconBtn}
                  />
                  <Pressable
                    onPress={openInternalMap}
                    style={({ pressed }) => [styles.desktopHeaderIconBtn, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Map View"
                  >
                    <Ionicons name="map-outline" size={22} color={colors.text} />
                  </Pressable>
                  <Pressable
                    onPress={openNotifications}
                    style={({ pressed }) => [styles.desktopHeaderIconBtn, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Notifications"
                  >
                    <Ionicons name="notifications-outline" size={22} color={colors.text} />
                    {isAuthenticated && <View style={styles.notifDot} />}
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* SuperApp Quick Links */}
          <View style={styles.quickChipRow}>
            <FilterChipRow
              items={superAppSections.map(s => ({ id: s.id, label: s.label, icon: s.icon, color: s.color }))}
              selectedId=""
              onSelect={(id) => {
                const section = superAppSections.find(s => s.id === id);
                if (section) pushSafe(section.route);
              }}
            />
          </View>

          {/* Dynamic Hero Carousel */}
          {featuredEvents.length > 0 && (
            <View style={styles.carouselContainer}>
              <FlatList
                horizontal
                data={featuredEvents}
                keyExtractor={(item) => item.id}
                renderItem={renderFeaturedEvent}
                pagingEnabled={!isDesktop}
                showsHorizontalScrollIndicator={false}
                snapToInterval={heroSnapInterval}
                decelerationRate="fast"
                snapToAlignment="start"
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
                removeClippedSubviews
                getItemLayout={(_, index) => ({
                  length: heroSnapInterval,
                  offset: heroSnapInterval * index,
                  index,
                })}
              />
            </View>
          )}

          {/* First Nations Spotlight */}
          {land && (
            <View style={[styles.landBanner, isDesktop && { marginHorizontal: 0 }]}>
              {Platform.OS === 'ios' || isWeb ? (
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              ) : null}
              <LinearGradient colors={['rgba(212,165,116,0.15)', 'rgba(212,165,116,0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject} />
              <View style={styles.landBannerContent}>
                <Ionicons name="leaf" size={16} color={CultureTokens.gold} />
                <Text style={styles.landBannerTitle}>You are on {land.landName}</Text>
              </View>
              <Text style={styles.landBannerSub}>Traditional Custodians: {land.traditionalCustodians}</Text>
            </View>
          )}

          {/* First Nations & Indigenous Organisations */}
          {indigenousOrganisations.length > 0 && (
            <View style={[styles.orgSection, isDesktop && { marginHorizontal: 0 }]}>
              <View style={styles.orgSectionHeader}>
                <View style={[styles.orgSectionIconWrap, { backgroundColor: colors.primaryGlow }]}>
                  <Text style={styles.boomerangIcon}>🪃</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orgSectionTitle}>First Nations & Indigenous Organisations</Text>
                  <Text style={styles.orgSectionSub}>
                    Recognising organisations preserving language, culture, arts, and community leadership.
                  </Text>
                </View>
              </View>
              <FlatList
                horizontal
                data={indigenousOrganisations}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.orgRail}
                renderItem={({ item }) => (
                  <Card padding={18} radius={16} style={[styles.orgCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                    <View style={styles.orgCardTop}>
                      <Text style={styles.orgName} numberOfLines={2}>{item.name}</Text>
                      {item.featured ? (
                        <View style={styles.orgFeaturedBadge}>
                          <Text style={styles.orgFeaturedText}>Featured</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.orgMeta}>
                      {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                    </Text>
                    {!!item.nationOrPeople && (
                      <Text style={styles.orgNation} numberOfLines={1}>
                        {item.nationOrPeople}
                      </Text>
                    )}
                    <View style={styles.orgFocusRow}>
                      {item.focusAreas.slice(0, 2).map((focus) => (
                        <View key={`${item.id}-${focus}`} style={[styles.orgFocusPill, { borderColor: colors.borderLight }]}>
                          <Text style={styles.orgFocusText}>{focus}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                )}
              />
            </View>
          )}

          {/* Indigenous Events & Festivals */}
          {indigenousFestivals.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
                <SectionHeader
                  title="Indigenous Events & Festivals"
                  subtitle="Celebrate living culture and Country-led stories"
                  onSeeAll={() => router.push('/(tabs)/explore')}
                />
              </View>
              <FlatList
                horizontal
                data={indigenousFestivals}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
                renderItem={({ item }) => (
                  <Card padding={16} radius={16} style={[styles.indigenousCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <View style={styles.indigenousCardHeader}>
                      <View style={styles.indigenousTagPill}>
                        <Text style={styles.indigenousTagText}>🪃 Festival</Text>
                      </View>
                      {!!item.monthHint && (
                        <Text style={styles.indigenousMonth}>{item.monthHint}</Text>
                      )}
                    </View>
                    <Text style={styles.indigenousTitle} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.indigenousMeta} numberOfLines={1}>
                      {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                    </Text>
                    <Text style={styles.indigenousDesc} numberOfLines={3}>{item.significance}</Text>
                  </Card>
                )}
              />
            </View>
          )}

          {/* Indigenous Business */}
          {indigenousBusinesses.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
                <SectionHeader
                  title="Indigenous Business"
                  subtitle="Support First Nations-owned local businesses"
                  onSeeAll={() => router.push('/(tabs)/directory')}
                />
              </View>
              <FlatList
                horizontal
                data={indigenousBusinesses}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
                renderItem={({ item }) => (
                  <Card padding={16} radius={16} style={[styles.indigenousCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <View style={styles.indigenousCardHeader}>
                      <View style={styles.indigenousTagPill}>
                        <Text style={styles.indigenousTagText}>🪃 Business</Text>
                      </View>
                      <Text style={styles.indigenousMonth}>{item.category}</Text>
                    </View>
                    <Text style={styles.indigenousTitle} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.indigenousMeta} numberOfLines={1}>
                      {[item.city, item.state, item.country].filter(Boolean).join(', ')}
                    </Text>
                    <Text style={styles.indigenousDesc} numberOfLines={3}>{item.description}</Text>
                  </Card>
                )}
              />
            </View>
          )}


          {/* Empty Fallback */}
          {!discoverLoading && featuredEvents.length === 0 && popularEvents.length === 0 && (Array.isArray(allActivities) ? allActivities.length === 0 : true) && (Array.isArray(allCommunities) ? allCommunities.length === 0 : true) && (
            <Card padding={36} radius={24} style={[styles.emptyStateCard, isDesktop && { marginHorizontal: 0 }]}>
              <View style={styles.emptyStateIconCircle}>
                <Ionicons name="compass-outline" size={38} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyStateTitle}>No events right now</Text>
              <Text style={styles.emptyStateSub}>Try changing your city or pull to refresh.</Text>
            </Card>
          )}

          {/* NOW BUCKETS */}
          {!eventsLoading && nowBuckets.happeningNow.length > 0 && (
            <View style={{ marginBottom: 32 }}>
              <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
                <SectionHeader title="Happening Right Now" subtitle="Don't miss out - happening today!" onSeeAll={() => router.push('/events')} />
              </View>
              <FlatList
                horizontal
                data={nowBuckets.happeningNow}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <EventCard event={item} index={index} isLive />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
                snapToInterval={POPULAR_RAIL_SNAP_INTERVAL}
                snapToAlignment="start"
                decelerationRate="fast"
              />
            </View>
          )}

          {!eventsLoading && nowBuckets.startingSoon.length > 0 && (
            <View style={{ marginBottom: 32 }}>
              <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
                <SectionHeader title="Starting Soon" subtitle="Grab your spot before they start" onSeeAll={() => router.push('/events')} />
              </View>
              <FlatList
                horizontal
                data={nowBuckets.startingSoon}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <EventCard event={item} index={index} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
                snapToInterval={POPULAR_RAIL_SNAP_INTERVAL}
                snapToAlignment="start"
                decelerationRate="fast"
              />
            </View>
          )}

          {/* Popular Near You (With Error State) */}
          {(discoverLoading || eventsLoading || popularEvents.length > 0 || eventsError) && (
            <View style={{ marginBottom: 32 }}>
              <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
                <SectionHeader title="Popular Near You" subtitle="Trending in your area" onSeeAll={() => router.push('/events')} />
              </View>
              {eventsError ? (
                <View style={styles.errorStateBlock}>
                  <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>Failed to load local events.</Text>
                </View>
              ) : (
                <FlatList
                  horizontal
                  data={popularRailData}
                  keyExtractor={(item) => typeof item === 'string' ? item : item.id}
                  renderItem={({ item, index }) => (
                    typeof item === 'string'
                      ? <EventCardSkeleton />
                      : <EventCard event={item} index={index} />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
                  decelerationRate="fast"
                  snapToInterval={POPULAR_RAIL_SNAP_INTERVAL}
                  snapToAlignment="start"
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={5}
                  removeClippedSubviews
                  getItemLayout={(_, index) => ({
                    length: POPULAR_RAIL_SNAP_INTERVAL,
                    offset: POPULAR_RAIL_SNAP_INTERVAL * index,
                    index,
                  })}
                />
              )}
            </View>
          )}

          {/* Explore Culture */}
          {(communitiesLoading || cultureCards.length > 0 || communitiesError) && (
            <View style={{ marginBottom: 32 }}>
              <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
                <SectionHeader title="Communities" subtitle="Connect with your culture" onSeeAll={() => router.push('/(tabs)/community')} />
              </View>
              {communitiesError ? (
                <View style={styles.errorStateBlock}>
                  <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>Failed to load communities.</Text>
                </View>
              ) : (
                <FlatList
                  horizontal
                  data={communityRailData}
                  keyExtractor={(item) => typeof item === 'string' ? item : item.id}
                  renderItem={({ item, index }) => (
                    typeof item === 'string'
                      ? <CommunityCardSkeleton />
                      : <CommunityCard community={item} index={index} />
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.scrollRail, { gap: 12 }, isDesktop && { paddingHorizontal: 0 }]}
                  decelerationRate="fast"
                  snapToInterval={COMMUNITY_RAIL_SNAP_INTERVAL}
                  snapToAlignment="start"
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={5}
                  removeClippedSubviews
                  getItemLayout={(_, index) => ({
                    length: COMMUNITY_RAIL_SNAP_INTERVAL,
                    offset: COMMUNITY_RAIL_SNAP_INTERVAL * index,
                    index,
                  })}
                />
              )}
            </View>
          )}


          {/* Local Council Area Events */}
          {(nearbyLoading || nearbyEvents.length > 0) && !eventsError && (
            <View style={{ marginBottom: 32 }}>
              <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
                <SectionHeader
                  title="Events in Your Area"
                  subtitle={nearbySubtitle}
                  onSeeAll={() => router.push('/events')}
                />
              </View>
              <FlatList
                horizontal
                data={councilRailData}
                keyExtractor={(item) => typeof item === 'string' ? item : item.id}
                renderItem={({ item, index }) => (
                  typeof item === 'string'
                    ? <EventCardSkeleton />
                    : <EventCard event={item} index={index} />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
                decelerationRate="fast"
                snapToInterval={POPULAR_RAIL_SNAP_INTERVAL}
                snapToAlignment="start"
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={5}
                removeClippedSubviews
                getItemLayout={(_, index) => ({
                  length: POPULAR_RAIL_SNAP_INTERVAL,
                  offset: POPULAR_RAIL_SNAP_INTERVAL * index,
                  index,
                })}
              />
            </View>
          )}

          {/* Core Activities */}
          {(activitiesLoading || (Array.isArray(allActivities) ? allActivities.length > 0 : false) || activitiesError) && (
            <View style={{ marginBottom: 32 }}>
              <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
                <SectionHeader title="Activities" subtitle="Workshops and experiences" onSeeAll={() => router.push('/activities')} />
              </View>
              {activitiesError ? (
                <View style={styles.errorStateBlock}>
                  <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>Failed to load activities.</Text>
                </View>
              ) : (
                <FlatList
                  horizontal
                  data={activityRailData}
                  keyExtractor={(item) => typeof item === 'string' ? item : item.id}
                  renderItem={({ item }) => (
                    typeof item === 'string' ? (
                      <View style={[styles.activityTile]}>
                        <Skeleton width={80} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                        <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                        <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
                        <Skeleton width="50%" height={12} borderRadius={4} />
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => router.push({ pathname: '/activities/[id]', params: { id: item.id } })}
                        style={({ pressed }) => [
                          styles.activityTile,
                          { borderColor: CultureTokens.teal + '35' },
                          pressed && { backgroundColor: colors.backgroundSecondary }
                        ]}
                      >
                        <View style={[styles.accentStrip, { backgroundColor: CultureTokens.teal }]} />
                        <Text style={styles.activityCategory}>{item.category}</Text>
                        <Text numberOfLines={1} style={styles.activityName}>{item.name}</Text>
                        <Text numberOfLines={2} style={styles.activityDescription}>{item.description}</Text>
                        <View style={styles.activityMetaRow}>
                          <View style={[styles.metaPill, { borderColor: CultureTokens.teal + '50' }]}>
                            <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
                            <Text style={styles.activityMetaText}>{item.city}</Text>
                          </View>
                          <View style={[styles.metaPill, { borderColor: CultureTokens.saffron + '50' }]}>
                            <Ionicons name="pricetag-outline" size={11} color={colors.textTertiary} />
                            <Text style={styles.activityMetaText}>{item.priceLabel || 'Free'}</Text>
                          </View>
                        </View>
                      </Pressable>
                    )
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
                  initialNumToRender={4}
                  maxToRenderPerBatch={4}
                  windowSize={5}
                  removeClippedSubviews
                />
              )}
            </View>
          )}

          {/* Browse Categories */}
          <View style={{ marginBottom: 32 }}>
            <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
              <SectionHeader title="Browse Categories" onSeeAll={() => router.push('/events')} />
            </View>
            <FlatList
              horizontal
              data={browseCategoryRailData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CategoryCard item={item} onPress={() => pushSafe('/(tabs)/explore')} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.scrollRail, { gap: 12 }, isDesktop && { paddingHorizontal: 0 }]}
              decelerationRate="fast"
              snapToInterval={CATEGORY_RAIL_SNAP_INTERVAL}
              snapToAlignment="start"
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={5}
              removeClippedSubviews
              getItemLayout={(_, index) => ({
                length: CATEGORY_RAIL_SNAP_INTERVAL,
                offset: CATEGORY_RAIL_SNAP_INTERVAL * index,
                index,
              })}
            />
          </View>

          {/* City Discovery */}
          <View style={{ marginBottom: 50 }}>
            <View style={[styles.sectionPad, isDesktop && { paddingHorizontal: 0 }]}>
              <SectionHeader title="Explore Cities" subtitle="Discover culture nationwide" />
            </View>
            <View style={[styles.cityGridRow, isDesktop && { paddingHorizontal: 0 }]}>
              {(() => {
                const rows = [];
                for (let i = 0; i < FEATURED_CITIES.length; i += cityColumns) {
                  rows.push(
                    <View key={i} style={{ flexDirection: 'row', width: '100%', marginBottom: 16 }}>
                      {FEATURED_CITIES.slice(i, i + cityColumns).map((city) => (
                        <View key={city.name} style={{ width: cityCardWidth, marginRight: 12 }}>
                          <CityCard
                            city={city}
                            width={cityCardWidth}
                            height={Math.round(cityCardWidth * (140 / 170))}
                            onPress={() => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); pushSafe('/(tabs)/explore'); }}
                          />
                        </View>
                      ))}
                    </View>
                  );
                }
                return rows;
              })()}
            </View>
          </View>

          {/* Virtual Infinite Feed removed */}

        </Animated.ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200 },
  shellHorizontal: { paddingHorizontal: 20 },

  topBarGradient: { zIndex: 100, elevation: 100 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
    backgroundColor: 'transparent',
  },
  topBarBorder: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 28, height: 28, borderRadius: 14 },
  brandTextBlock: { gap: 0 },
  brandAppName: { ...TextStyles.headline, color: '#FFFFFF', lineHeight: 20 },
  brandTagline: { ...TextStyles.caption, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  topBarSpacer: { flex: 1, minWidth: 8 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CultureTokens.coral,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  locationPickerRow: { paddingHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroGreetingMobile: { ...TextStyles.callout, color: colors.textSecondary },

  heroSectionDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 40, marginBottom: 32 },
  heroDesktopLeft: { flex: 1 },
  heroGreetingDesktop: { ...TextStyles.headline, color: colors.textSecondary, marginBottom: 6 },
  heroTitleDesktop: { ...TextStyles.display, color: colors.text, letterSpacing: -1 },
  heroSubtitleDesktop: { ...TextStyles.bodyMedium, color: colors.textSecondary },
  desktopActionsRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 20 },
  desktopHeaderIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mobileHeroSection: { paddingHorizontal: 20, marginBottom: 28 },
  heroGreetingBlock: { marginBottom: 20 },
  heroGreetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  heroGreetingMain: { ...TextStyles.title2, color: colors.text, marginBottom: 4 },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLocationFlag: { fontSize: 16 },
  heroLocationText: { ...TextStyles.callout },
  heroDesktopSubRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  heroLocationChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  heroLocationChipFlag: { fontSize: 16 },
  heroLocationChipText: { ...TextStyles.labelSemibold },

  heroBanner: { borderRadius: 24, padding: 24, overflow: 'hidden', position: 'relative', minHeight: 120 },
  heroBannerOrb: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 16, zIndex: 1 },
  heroBannerIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroBannerTitle: { ...TextStyles.title2, color: '#fff' },
  heroBannerSub: { ...TextStyles.caption, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },

  quickChipRow: { marginBottom: 12 },
  quickChipScroll: { paddingHorizontal: 20, gap: 8 },

  carouselContainer: { marginBottom: 32 },
  heroCard: { height: 420, borderRadius: 32, overflow: 'hidden', backgroundColor: colors.surface, boxShadow: '0 20px 20px rgba(0,0,0,0.25)', elevation: 10 },
  heroCardBadge: { position: 'absolute', top: 20, right: 20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden', zIndex: 2 },
  heroCardBadgeText: { ...TextStyles.badgeCaps, color: '#fff', letterSpacing: 1 },
  heroCardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, gap: 12 },
  heroCardMetaTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroCardPrice: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heroCardPriceText: { ...TextStyles.badge, color: '#fff' },
  heroCardDateBox: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' },
  heroCardDateText: { ...TextStyles.badge, color: '#fff' },
  heroCardTitle: { ...TextStyles.title, color: '#fff', lineHeight: 32 },
  heroCardLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroCardLocation: { ...TextStyles.cardTitle, color: 'rgba(255,255,255,0.7)' },

  landBanner: { marginHorizontal: 20, marginBottom: 32, padding: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(212,165,116,0.2)' },
  landBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  landBannerTitle: { ...TextStyles.headline, color: CultureTokens.gold },
  landBannerSub: { ...TextStyles.caption, color: colors.textSecondary, lineHeight: 18 },

  orgSection: { marginBottom: 32, marginHorizontal: 20 },
  orgSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  orgSectionIconWrap: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  boomerangIcon: { fontSize: 24 },
  orgSectionTitle: { ...TextStyles.title3, color: colors.text },
  orgSectionSub: { ...TextStyles.caption, color: colors.textTertiary, lineHeight: 18, marginTop: 2 },
  orgRail: { paddingRight: 20, gap: 16 },
  orgCard: { width: 260, borderWidth: 1 },
  orgCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orgName: { ...TextStyles.cardTitle, color: colors.text, flex: 1 },
  orgFeaturedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: CultureTokens.gold + '20' },
  orgFeaturedText: { ...TextStyles.badgeCaps, color: CultureTokens.gold },
  orgMeta: { ...TextStyles.caption, color: colors.textSecondary, marginBottom: 4 },
  orgNation: { ...TextStyles.captionSemibold, color: CultureTokens.gold, marginBottom: 12 },
  orgFocusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  orgFocusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  orgFocusText: { ...TextStyles.badge, color: colors.textSecondary },

  sectionPad: { paddingHorizontal: 20 },
  scrollRail: { paddingHorizontal: 20, gap: 16, paddingRight: 40 },
  indigenousCard: { width: 280, borderRadius: 20, borderWidth: 1, padding: 16 },
  indigenousCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  indigenousTagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: CultureTokens.gold + '15' },
  indigenousTagText: { ...TextStyles.badgeCaps, color: CultureTokens.gold },
  indigenousMonth: { ...TextStyles.badge, color: colors.textTertiary },
  indigenousTitle: { ...TextStyles.title3, color: colors.text, marginBottom: 6 },
  indigenousMeta: { ...TextStyles.callout, color: colors.textSecondary, marginBottom: 8 },
  indigenousDesc: { ...TextStyles.bodyMedium, color: colors.textTertiary, lineHeight: 18 },


  emptyStateCard: { marginHorizontal: 20, padding: 40, borderRadius: 24, alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderLight },
  emptyStateIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyStateTitle: { ...TextStyles.title2, color: colors.text, marginBottom: 8 },
  emptyStateSub: { ...TextStyles.bodyMedium, color: colors.textSecondary, textAlign: 'center' },

  errorStateBlock: { padding: 40, alignItems: 'center' },

  // Skeletons
  loadingWrap: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 16, color: colors.textSecondary },
  cityGridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 20 },
  activityTile: { width: 200, padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  activityCategory: { fontSize: 10, color: colors.textTertiary },
  activityName: { ...TextStyles.cardTitle },
  activityDescription: { fontSize: 12, color: colors.textSecondary },
  activityMetaRow: { flexDirection: 'row', gap: 8 },
  metaPill: { padding: 4, borderRadius: 4 },
  activityMetaText: { fontSize: 11, color: colors.textSecondary },
  accentStrip: { width: 4, borderRadius: 2 },
  feedGrid: { paddingHorizontal: 20 },
});

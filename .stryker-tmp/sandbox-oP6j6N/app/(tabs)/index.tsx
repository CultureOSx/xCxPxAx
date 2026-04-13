/**
 * Home — Discover Screen
 *
 * Section order (user-driven hierarchy):
 *  1. Header          — greeting + time/weather
 *  2. Search bar      — primary entry point
 *  3. QuickLinks      — 8 app destinations
 *  4. Hero Carousel   — featured events
 *  5. Starting Soon   — urgency / live rail
 *  6. Near You        — GPS proximity
 *  7. Popular         — trending / attending
 *  8. For Your Culture— personalised
 *  9. Featured Artists— curated talent
 * 10. Heritage Playlist— culture content
 * 11. Indigenous Spotlight — always-on acknowledgement
 * 12. Communities     — connection
 * 13. Activities      — workshops & experiences
 * 14. Browse Categories— explore by interest
 * 15. Explore Cities  — geography
 * 16. Restaurants     — dining
 * 17. Movies          — entertainment
 * 18. Shopping        — goods & markets
 * 19. Perks           — rewards preview
 */
// @ts-nocheck


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { calculateDistance, getPostcodesByPlace } from '@shared/location/australian-postcodes';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { useDiscoverData } from '@/hooks/useDiscoverData';
import { CategoryColors, CultureTokens, FontFamily } from '@/constants/theme';
import { isCultureKeralaHost } from '@/lib/domainHost';
import { parseEventStartMs } from '@/lib/dateUtils';
import {
  getLayoverPlannerPreferences,
  getTravelModeEnabled,
} from '@/lib/storage';
import type { EventData, Community } from '@/shared/schema';

import { DiscoverScrollShell } from '@/components/Discover/DiscoverScrollShell';
import { DiscoverHeader } from '@/components/Discover/DiscoverHeader';
import { SuperAppLinks } from '@/components/Discover/SuperAppLinks';
import { HeroCarousel } from '@/components/Discover/HeroCarousel';
import { EventRail } from '@/components/Discover/EventRail';
import { CommunityRail } from '@/components/Discover/CommunityRail';
import { ActivityRail } from '@/components/Discover/ActivityRail';
import { FeaturedArtistRail } from '@/components/Discover/FeaturedArtistRail';
import { HeritagePlaylistRail } from '@/components/Discover/HeritagePlaylistRail';
import { IndigenousSpotlight } from '@/components/Discover/IndigenousSpotlight';
import { CategoryRail } from '@/components/Discover/CategoryRail';
import { CityRail } from '@/components/Discover/CityRail';
import { PreviewRail } from '@/components/Discover/PreviewRail';

const LAYOVER_WINDOWS = [
  { id: '2_4', label: '2-4h', maxMinutes: 240, leadMinutes: 20 },
  { id: '4_8', label: '4-8h', maxMinutes: 480, leadMinutes: 30 },
  { id: '8_16', label: '8-16h', maxMinutes: 960, leadMinutes: 45 },
] as const;
const TRANSIT_ANCHORS = [
  { id: 'city', label: 'City' },
  { id: 'airport', label: 'Airport' },
  { id: 'port', label: 'Port' },
] as const;
const ROUTE_PROFILES = [
  { id: 'fast', label: 'Fast', kmPerMinute: 0.8, bufferMultiplier: 0.9 },
  { id: 'balanced', label: 'Balanced', kmPerMinute: 0.62, bufferMultiplier: 1 },
  { id: 'safe', label: 'Safe', kmPerMinute: 0.45, bufferMultiplier: 1.2 },
] as const;
const LAYOVER_RADIUS_KM: Record<(typeof LAYOVER_WINDOWS)[number]['id'], number> = {
  '2_4': 8,
  '4_8': 20,
  '8_16': 35,
};
const CITY_TRANSIT_ANCHORS: Record<string, { airport?: { lat: number; lon: number }; port?: { lat: number; lon: number } }> = {
  sydney: {
    airport: { lat: -33.9399, lon: 151.1753 },
    port: { lat: -33.8708, lon: 151.2048 },
  },
  melbourne: {
    airport: { lat: -37.6690, lon: 144.8410 },
    port: { lat: -37.8267, lon: 144.9494 },
  },
  brisbane: {
    airport: { lat: -27.3842, lon: 153.1175 },
    port: { lat: -27.4462, lon: 153.0435 },
  },
  perth: {
    airport: { lat: -31.9403, lon: 115.9672 },
    port: { lat: -32.0500, lon: 115.7400 },
  },
  adelaide: {
    airport: { lat: -34.9450, lon: 138.5306 },
    port: { lat: -34.7820, lon: 138.4940 },
  },
};

// ─── Kerala Domain Scoping ─────────────────────────────────────────────────────

function useKeralaScoping(keralaDomain: boolean, data: ReturnType<typeof useDiscoverData>) {
  const isKeralaEvent = (event: EventData) => {
    const haystack = [
      event.title, event.description, event.category, event.city,
      ...(event.tags ?? []), ...(event.cultureTag ?? []),
      ...(event.cultureTags ?? []), ...(event.languageTags ?? []),
    ].filter(Boolean).join(' ').toLowerCase();
    return /kerala|malayali|malayalee|malayalam/.test(haystack);
  };

  const isKeralaCommunity = (community: Community) => {
    const c = community as Community & {
      cultureTags?: string[]; cultureIds?: string[];
      languageIds?: string[]; languages?: string[]; description?: string;
    };
    const haystack = [
      c.name, c.description,
      ...(c.cultureTags ?? []), ...(c.cultureIds ?? []),
      ...(c.languageIds ?? []), ...(c.languages ?? []),
    ].filter(Boolean).join(' ').toLowerCase();
    return /kerala|malayali|malayalee|malayalam/.test(haystack);
  };

  const scope = <T extends EventData | string>(arr: T[]): T[] =>
    keralaDomain
      ? arr.filter((i) => typeof i === 'string' || isKeralaEvent(i as EventData))
      : arr;

  return {
    featured:    keralaDomain ? data.featuredEvents.filter(isKeralaEvent)    : data.featuredEvents,
    soon:        scope(data.startingSoonRailData),
    nearby:      scope(data.nearbyRailData),
    popular:     scope(data.popularRailData),
    forYou:      keralaDomain ? data.forYouEvents.filter(isKeralaEvent)      : data.forYouEvents,
    communities: keralaDomain ? data.allCommunities.filter(isKeralaCommunity): data.allCommunities,
    restaurants: keralaDomain
      ? data.restaurantPreviewItems.filter(
          (i) => i === 'skeleton' || /kerala|malayali|malayalee|malayalam/i.test(`${(i as {title:string}).title} ${(i as {subtitle?:string}).subtitle ?? ''}`),
        )
      : data.restaurantPreviewItems,
    movies: keralaDomain
      ? data.moviePreviewItems.filter(
          (i) => i === 'skeleton' || /kerala|malayali|malayalee|malayalam/i.test(`${(i as {title:string}).title} ${(i as {subtitle?:string}).subtitle ?? ''}`),
        )
      : data.moviePreviewItems,
  };
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const colors = useColors();
  const { isDesktop, contentWidth } = useLayout();
  const scrollBottomPad = useTabScrollBottomPadding(28);
  const [keralaDomain, setKeralaDomain] = useState(false);
  const [travelModeEnabled, setTravelModeEnabled] = useState(false);
  const [layoverWindowId, setLayoverWindowId] = useState<(typeof LAYOVER_WINDOWS)[number]['id']>('4_8');
  const [anchorId, setAnchorId] = useState<(typeof TRANSIT_ANCHORS)[number]['id']>('city');
  const [routeProfileId, setRouteProfileId] = useState<(typeof ROUTE_PROFILES)[number]['id']>('balanced');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [crewFriendlyOnly, setCrewFriendlyOnly] = useState(false);

  useEffect(() => { setKeralaDomain(isCultureKeralaHost()); }, []);

  const d = useDiscoverData();
  const s = useKeralaScoping(keralaDomain, d);
  const startNowFallback = s.popular.filter((item) => typeof item !== 'string').slice(0, 6);
  const startNowData = s.soon.length > 0 ? s.soon : startNowFallback;
  const selectedLayoverWindow = LAYOVER_WINDOWS.find((window) => window.id === layoverWindowId) ?? LAYOVER_WINDOWS[1];
  const selectedRouteProfile = ROUTE_PROFILES.find((profile) => profile.id === routeProfileId) ?? ROUTE_PROFILES[1];
  const layoverRadiusKm = LAYOVER_RADIUS_KM[selectedLayoverWindow.id];
  const cityName = (d.state.city || '').toLowerCase();
  const cityCoords = getPostcodesByPlace(d.state.city || '')[0];
  const cityAnchor = cityCoords ? { lat: cityCoords.latitude, lon: cityCoords.longitude } : null;
  const mappedAnchors = CITY_TRANSIT_ANCHORS[cityName];
  const activeAnchorCoords =
    anchorId === 'airport'
      ? mappedAnchors?.airport ?? cityAnchor
      : anchorId === 'port'
        ? mappedAnchors?.port ?? cityAnchor
        : cityAnchor;
  const activeAnchorLabel =
    anchorId === 'airport' ? 'Airport anchor' : anchorId === 'port' ? 'Port anchor' : 'City anchor';

  const hydrateTravelPreferences = useCallback(async (cancelledRef: { current: boolean }) => {
      const [saved, travelMode] = await Promise.all([
        getLayoverPlannerPreferences(d.userId),
        getTravelModeEnabled(d.userId),
      ]);
      if (cancelledRef.current) return;
      setTravelModeEnabled(travelMode);
      if (saved) {
        if (saved.layoverWindowId === '2_4' || saved.layoverWindowId === '4_8' || saved.layoverWindowId === '8_16') {
          setLayoverWindowId(saved.layoverWindowId);
        }
        if (saved.anchorId === 'city' || saved.anchorId === 'airport' || saved.anchorId === 'port') {
          setAnchorId(saved.anchorId);
        }
        if (saved.routeProfileId === 'fast' || saved.routeProfileId === 'balanced' || saved.routeProfileId === 'safe') {
          setRouteProfileId(saved.routeProfileId);
        }
        setOpenNowOnly(saved.openNowOnly);
        setQuietOnly(saved.quietOnly);
        setCrewFriendlyOnly(saved.crewFriendlyOnly);
      }
  }, [d.userId]);

  useEffect(() => {
    const cancelledRef = { current: false };
    void hydrateTravelPreferences(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
  }, [hydrateTravelPreferences]);

  useFocusEffect(
    useCallback(() => {
      const cancelledRef = { current: false };
      void hydrateTravelPreferences(cancelledRef);
      return () => {
        cancelledRef.current = true;
      };
    }, [hydrateTravelPreferences]),
  );

  const layoverSource = useMemo(() => {
    const nearbyEvents = s.nearby.filter((item): item is EventData => typeof item !== 'string');
    if (nearbyEvents.length > 0) return nearbyEvents;
    const soonEvents = s.soon.filter((item): item is EventData => typeof item !== 'string');
    if (soonEvents.length > 0) return soonEvents;
    return s.popular.filter((item): item is EventData => typeof item !== 'string');
  }, [s.nearby, s.popular, s.soon]);

  const layoverScored = useMemo(() => {
    const now = Date.now();
    return layoverSource
      .map((event) => {
        const startMs = parseEventStartMs(event.date, event.time);
        if (!startMs) return null;
        const minutesUntilStart = Math.round((startMs - now) / 60000);
        const eventCoords = typeof event.lat === 'number' && typeof event.lng === 'number'
          ? { lat: event.lat, lon: event.lng }
          : getPostcodesByPlace(event.city || '')[0]
            ? {
                lat: getPostcodesByPlace(event.city || '')[0].latitude,
                lon: getPostcodesByPlace(event.city || '')[0].longitude,
              }
            : null;
        const distanceKm =
          activeAnchorCoords && eventCoords
            ? calculateDistance(activeAnchorCoords.lat, activeAnchorCoords.lon, eventCoords.lat, eventCoords.lon)
            : event.distanceKm ?? 6;
        const travelMinutesOneWay = Math.max(
          8,
          Math.round((distanceKm / selectedRouteProfile.kmPerMinute) * selectedRouteProfile.bufferMultiplier),
        );
        const isOpenNow = minutesUntilStart <= 30 && minutesUntilStart >= -120;
        const tags = [
          ...(event.tags ?? []),
          ...(event.cultureTag ?? []),
          ...(event.cultureTags ?? []),
          event.category ?? '',
        ]
          .join(' ')
          .toLowerCase();
        const isQuiet = /quiet|museum|gallery|wellness|mindful|acoustic|exhibition/.test(tags);
        const isCrewFriendly = /crew|airport|harbour|port|walkable|quick|express|transit/.test(tags);

        const fitsRadius = distanceKm <= layoverRadiusKm;
        const fitsTimeWindow =
          minutesUntilStart >= -30 &&
          minutesUntilStart <= selectedLayoverWindow.maxMinutes - selectedLayoverWindow.leadMinutes;

        if (!fitsRadius || !fitsTimeWindow) return null;
        if (openNowOnly && !isOpenNow) return null;
        if (quietOnly && !isQuiet) return null;
        if (crewFriendlyOnly && !isCrewFriendly) return null;

        const minExperienceMinutes = 75;
        const totalPlanMinutes = travelMinutesOneWay * 2 + minExperienceMinutes + selectedLayoverWindow.leadMinutes;
        const bufferLeft = selectedLayoverWindow.maxMinutes - totalPlanMinutes;
        const bufferSafe = bufferLeft >= 25;

        const timingScore = Math.max(0, 150 - Math.abs(minutesUntilStart));
        const popularityScore = Math.min(120, event.attending ?? 0);
        const bufferScore = Math.max(0, bufferLeft);
        const trustBoost = (isCrewFriendly ? 25 : 0) + (isQuiet ? 12 : 0) + (bufferSafe ? 18 : 0);
        const score = timingScore + popularityScore + bufferScore + trustBoost;

        return {
          event,
          score,
          distanceKm,
          travelMinutesOneWay,
          minutesUntilStart,
          isOpenNow,
          isQuiet,
          isCrewFriendly,
          bufferLeft,
          bufferSafe,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          event: EventData;
          score: number;
          distanceKm: number;
          travelMinutesOneWay: number;
          minutesUntilStart: number;
          isOpenNow: boolean;
          isQuiet: boolean;
          isCrewFriendly: boolean;
          bufferLeft: number;
          bufferSafe: boolean;
        } => Boolean(entry),
      )
      .sort((a, b) => b.score - a.score);
  }, [
    activeAnchorCoords,
    crewFriendlyOnly,
    layoverRadiusKm,
    layoverSource,
    openNowOnly,
    quietOnly,
    selectedRouteProfile.bufferMultiplier,
    selectedRouteProfile.kmPerMinute,
    selectedLayoverWindow.leadMinutes,
    selectedLayoverWindow.maxMinutes,
  ]);

  const layoverRailData = useMemo<(EventData | string)[]>(() => {
    if (d.eventsLoading) return ['layover-sk1', 'layover-sk2', 'layover-sk3'];
    const scored = layoverScored.slice(0, 10).map((entry) => entry.event);
    if (scored.length > 0) return scored;
    return layoverSource.slice(0, 8);
  }, [d.eventsLoading, layoverScored, layoverSource]);
  const bestLayoverPlan = layoverScored[0];

  // Primary nearby rail: GPS first, fall back to starting-soon
  const nearbyRailResolved = s.nearby.filter((i) => typeof i !== 'string');
  const hasNearby = nearbyRailResolved.length > 0;

  return (
    <DiscoverScrollShell
      scrollBottomPad={scrollBottomPad}
      stickyHeaderIndices={[1]}
      contentContainerStyle={
        isDesktop ? { width: contentWidth, alignSelf: 'center' } : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={d.refreshing}
          onRefresh={d.handleRefresh}
          tintColor={colors.primary}
        />
      }
    >

      {/* ① Greeting */}
      <DiscoverHeader
        currentTime={d.currentTime}
        weatherSummary={d.weatherSummary}
        city={d.state.city || 'Sydney'}
        country={d.state.country || 'Australia'}
        isAuthenticated={d.isAuthenticated}
        onRefresh={d.handleRefresh}
      />

      {/* ② Sticky search bar — stays pinned as user scrolls */}
      <View style={[discoverStyles.searchSticky, { backgroundColor: colors.background }]}>
        <Pressable
          style={[
            discoverStyles.searchBar,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
          ]}
          onPress={() => router.push('/search')}
          accessibilityRole="search"
          accessibilityLabel="Search events, communities, places"
          accessibilityHint="Opens the search screen"
        >
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <Text style={[discoverStyles.searchPlaceholder, { color: colors.textTertiary }]} numberOfLines={1}>
            Search events, communities, places…
          </Text>
        </Pressable>
      </View>

      {/* ② Search (removed) */}

      {/* ②b Layover planner (Phase 1) */}
      <View style={discoverStyles.layoverSection}>
        <View
          style={[
            discoverStyles.travelModeBanner,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
          ]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[discoverStyles.travelModeTitle, { color: colors.text }]}>Travel Mode</Text>
            <Text style={[discoverStyles.travelModeSub, { color: colors.textSecondary }]}>
              Reorganize Discover for workers constantly on the move.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings/travel-mode')}
            style={[
              discoverStyles.travelModeToggle,
              {
                backgroundColor: travelModeEnabled ? colors.primarySoft : colors.surface,
                borderColor: travelModeEnabled ? colors.primary : colors.borderLight,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open Travel Mode settings"
          >
            <Text
              style={[
                discoverStyles.travelModeToggleText,
                { color: travelModeEnabled ? colors.primary : colors.textSecondary },
              ]}
            >
              {travelModeEnabled ? 'On' : 'Off'}
            </Text>
          </Pressable>
        </View>

        <Text style={[discoverStyles.layoverTitle, { color: colors.text }]}>Layover Planner</Text>
        <Text style={[discoverStyles.layoverSubtitle, { color: colors.textSecondary }]}>
          Defaults are managed in Account Settings, Tinder-style.
        </Text>
        <Pressable
          onPress={() => router.push('/settings/travel-mode')}
          style={[
            discoverStyles.layoverChip,
            {
              alignSelf: 'flex-start',
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderLight,
              marginTop: 8,
              marginBottom: 6,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open Layover Planner settings"
        >
          <Text style={[discoverStyles.layoverChipText, { color: colors.textSecondary }]}>
            Configure window, anchor, route, and filters
          </Text>
        </Pressable>
        {bestLayoverPlan ? (
          <Pressable
            onPress={() => router.push(`/event/${bestLayoverPlan.event.id}`)}
            style={[
              discoverStyles.itineraryCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open best layover itinerary"
          >
            <View style={discoverStyles.itineraryHead}>
              <Text style={[discoverStyles.itineraryTitle, { color: colors.text }]}>Best quick itinerary</Text>
              <Text
                style={[
                  discoverStyles.itinerarySafety,
                  { color: bestLayoverPlan.bufferSafe ? CultureTokens.teal : CultureTokens.coral },
                ]}
              >
                {bestLayoverPlan.bufferSafe ? 'Safe return buffer' : 'Tight return window'}
              </Text>
            </View>
            <Text style={[discoverStyles.itineraryEvent, { color: colors.text }]} numberOfLines={1}>
              {bestLayoverPlan.event.title}
            </Text>
            <Text style={[discoverStyles.itineraryMeta, { color: colors.textSecondary }]}>
              {bestLayoverPlan.travelMinutesOneWay} min one-way • {bestLayoverPlan.distanceKm.toFixed(1)} km • {Math.max(0, bestLayoverPlan.bufferLeft)} min buffer
            </Text>
            <Text style={[discoverStyles.itineraryMeta, { color: colors.textSecondary }]}>
              {activeAnchorLabel} • {selectedRouteProfile.label} route profile
            </Text>
          </Pressable>
        ) : null}
      </View>

      <EventRail
        title={`Layover Picks (${selectedLayoverWindow.label})`}
        subtitle="Best options that fit your available work break."
        data={layoverRailData}
        isLoading={d.eventsLoading}
        schedulingMode="live_and_countdown"
        onSeeAll={() => router.push('/events')}
        errorMessage={d.eventsRailError}
        onRetry={() => void d.refetchEvents()}
      />

      {travelModeEnabled ? (
        <>
          <EventRail
            title="Travel Events"
            subtitle="Best-fit events for your work travel schedule."
            data={layoverRailData}
            isLoading={d.eventsLoading}
            schedulingMode="live_and_countdown"
            onSeeAll={() => router.push('/events')}
            errorMessage={d.eventsRailError}
            onRetry={() => void d.refetchEvents()}
          />

          <CommunityRail
            title="Travel Communities"
            subtitle="Find familiar circles quickly in each city."
            data={d.communitiesLoading ? ['s1', 's2', 's3', 's4'] : s.communities}
            isLoading={d.communitiesLoading}
            onSeeAll={() => router.push('/communities')}
            errorMessage={d.communitiesRailError}
            onRetry={() => void d.refetchCommunities()}
          />

          <CityRail
            title="Travel Hubs"
            subtitle="Tap into trusted city hubs for repeat routes."
          />

          <PreviewRail
            title="Travel Movies"
            subtitle="Quick entertainment windows near your stop."
            accentColor={CultureTokens.coral}
            items={s.movies}
            isLoading={d.moviesLoading}
            seeAllRoute="/movies"
            cardStyle="portrait"
          />

          <PreviewRail
            title="Travel Dining"
            subtitle="Reliable local dining between shifts."
            accentColor={CategoryColors.food}
            items={s.restaurants}
            isLoading={d.restaurantsLoading}
            seeAllRoute="/restaurants"
          />

          <ActivityRail
            title="Travel Activities"
            subtitle="Low-friction activities that fit short windows."
            data={d.activityRailData}
            isLoading={d.activitiesLoading}
            onSeeAll={() => router.push('/activities')}
            errorMessage={d.activitiesRailError}
            onRetry={() => void d.refetchActivities()}
          />

          <PreviewRail
            title="Travel Shopping"
            subtitle="Quick shopping stops near your anchor."
            accentColor={CultureTokens.teal}
            items={d.shoppingPreviewItems}
            isLoading={d.shoppingLoading}
            seeAllRoute="/shopping"
            cardStyle="landscape"
          />

          <PreviewRail
            title="Travel Offers"
            subtitle="Member perks and fast offers for crew schedules."
            accentColor={CultureTokens.indigo}
            items={d.perksPreviewItems}
            isLoading={d.perksLoading}
            seeAllRoute="/(tabs)/perks"
          />
        </>
      ) : null}


      {/* ③ Start Now — always visible */}
      {!travelModeEnabled && (
      <EventRail
        title="Start Now"
        subtitle={s.soon.length > 0 ? 'Grab your spot before they start' : 'Popular events you can join today'}
        data={
          d.eventsLoading && startNowData.length === 0
            ? ['sk1', 'sk2', 'sk3']
            : startNowData
        }
        isLoading={d.eventsLoading}
        schedulingMode="live_and_countdown"
        onSeeAll={() => router.push('/events')}
        errorMessage={d.eventsRailError}
        onRetry={() => void d.refetchEvents()}
      />
      )}

      {/* ④ Quick-access links */}
      {!travelModeEnabled && (
      <SuperAppLinks />
      )}

      {/* ⑤ Hero Carousel — featured events */}
      {!travelModeEnabled && (
      <HeroCarousel events={s.featured} />
      )}

      {/* ⑥ Near You — only if distinct from primary */}
      {!travelModeEnabled && hasNearby && (
        <EventRail
          title="Popular Near You"
          subtitle="Trending in your area"
          data={
            (d.eventsLoading || d.discoverLoading) && s.popular.length === 0
              ? ['sk1', 'sk2', 'sk3', 'sk4']
              : s.popular
          }
          isLoading={d.eventsLoading || d.discoverLoading}
          onSeeAll={() => router.push('/events')}
          errorMessage={d.eventsRailError}
          onRetry={() => void d.refetchEvents()}
        />
      )}

      {/* ⑦ For Your Culture — personalised */}
      {!travelModeEnabled && (s.forYou.length > 0 || d.eventsLoading) && (
        <EventRail
          title="For Your Culture"
          subtitle="Personalised to your heritage"
          data={
            d.eventsLoading && s.forYou.length === 0
              ? ['s1', 's2', 's3']
              : s.forYou
          }
          isLoading={d.eventsLoading}
          onSeeAll={() => router.push('/events')}
          errorMessage={d.eventsRailError}
          onRetry={() => void d.refetchEvents()}
        />
      )}

      {/* ⑧ Featured Artists */}
      {!travelModeEnabled && (
      <FeaturedArtistRail
        data={d.featuredArtists}
        isLoading={d.curationLoading}
        errorMessage={d.curationRailError}
        onRetry={() => void d.refetchCuration()}
      />
      )}

      {/* ⑨ Heritage Playlists */}
      {!travelModeEnabled && (
      <HeritagePlaylistRail
        data={d.heritagePlaylist}
        isLoading={d.curationLoading}
      />
      )}

      {/* ⑩ Indigenous Spotlight */}
      {!travelModeEnabled && (
      <IndigenousSpotlight
        land={d.land}
        organisations={d.indigenousOrganisations}
        festivals={[]}
        businesses={[]}
      />
      )}

      {/* ⑪ Communities */}
      {!travelModeEnabled && (
      <CommunityRail
        title="Communities"
        subtitle={
          keralaDomain
            ? 'Malayalee groups & cultural circles'
            : 'Connect with your culture'
        }
        data={
          d.communitiesLoading
            ? ['s1', 's2', 's3', 's4']
            : s.communities
        }
        isLoading={d.communitiesLoading}
        errorMessage={d.communitiesRailError}
        onRetry={() => void d.refetchCommunities()}
      />
      )}

      {/* ⑫ Activities — workshops & experiences */}
      {!travelModeEnabled && (
      <ActivityRail
        title="Activities"
        subtitle="Workshops, classes & experiences"
        data={d.activityRailData}
        isLoading={d.activitiesLoading}
        onSeeAll={() => router.push('/activities')}
        errorMessage={d.activitiesRailError}
        onRetry={() => void d.refetchActivities()}
      />
      )}

      {/* ⑬ Browse Categories */}
      {!travelModeEnabled && (
      <CategoryRail />
      )}

      {/* ⑭ Explore Cities */}
      {!travelModeEnabled && (
      <CityRail />
      )}

      {/* ⑮ Restaurants */}
      {!travelModeEnabled && (
      <PreviewRail
        title="Restaurants Near You"
        subtitle="Cultural dining in your neighbourhood"
        accentColor={CategoryColors.food}
        items={s.restaurants}
        isLoading={d.restaurantsLoading}
        seeAllRoute="/restaurants"
      />
      )}

      {/* ⑯ Movies & Entertainment */}
      {!travelModeEnabled && (
      <PreviewRail
        title="Movies & Entertainment"
        subtitle="Cultural films, screenings & shows"
        accentColor={CultureTokens.coral}
        items={s.movies}
        isLoading={d.moviesLoading}
        seeAllRoute="/movies"
        cardStyle="portrait"
      />
      )}

      {/* ⑰ Shopping & Markets */}
      {!travelModeEnabled && (
      <PreviewRail
        title="Shopping & Markets"
        subtitle="Cultural goods, fashion & artisans"
        accentColor={CultureTokens.teal}
        items={d.shoppingPreviewItems}
        isLoading={d.shoppingLoading}
        seeAllRoute="/shopping"
        cardStyle="landscape"
      />
      )}

      {/* ⑱ Perks Preview */}
      {!travelModeEnabled && (
      <PreviewRail
        title="Perks Near You"
        subtitle="Exclusive rewards at cultural venues"
        accentColor={CultureTokens.indigo}
        items={d.perksPreviewItems}
        isLoading={d.perksLoading}
        seeAllRoute="/(tabs)/perks"
      />
      )}

    </DiscoverScrollShell>
  );
}

const discoverStyles = StyleSheet.create({
  searchSticky: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  layoverSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  travelModeBanner: {
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  travelModeTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  travelModeSub: {
    marginTop: 1,
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  travelModeToggle: {
    minWidth: 54,
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  travelModeToggleText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  layoverTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
  },
  layoverSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  layoverChipRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  layoverChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoverChipText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  itineraryCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  itineraryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itineraryTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  itinerarySafety: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
  itineraryEvent: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  itineraryMeta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
});

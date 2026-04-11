/**
 * Home — Discover Screen
 *
 * Section order (user-driven hierarchy):
 *  1. Header          — greeting + time/weather
 *  2. QuickLinks      — 8 app destinations
 *  3. Hero Carousel   — featured events
 *  4. Starting Soon   — urgency / live rail
 *  5. Near You        — GPS proximity
 *  6. Popular         — trending / attending
 *  7. For Your Culture— personalised
 *  8. Featured Artists— curated talent
 *  9. Heritage Playlist— culture content
 * 10. Indigenous Spotlight — always-on acknowledgement
 * 11. Communities     — connection
 * 12. Activities      — workshops & experiences
 * 13. Browse Categories— explore by interest
 * 14. Explore Cities  — geography
 * 15. Restaurants     — dining
 * 16. Movies          — entertainment
 * 17. Shopping        — goods & markets
 * 18. Perks           — rewards preview
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { router } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { useDiscoverData } from '@/hooks/useDiscoverData';
import { CategoryColors, CultureTokens } from '@/constants/theme';
import { isCultureKeralaHost } from '@/lib/domainHost';
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

  useEffect(() => { setKeralaDomain(isCultureKeralaHost()); }, []);

  const d = useDiscoverData();
  const s = useKeralaScoping(keralaDomain, d);
  const startNowFallback = s.popular.filter((item) => typeof item !== 'string').slice(0, 6);
  const startNowData = s.soon.length > 0 ? s.soon : startNowFallback;

  // Primary nearby rail: GPS first, fall back to starting-soon
  const nearbyRailResolved = s.nearby.filter((i) => typeof i !== 'string');
  const hasNearby = nearbyRailResolved.length > 0;

  return (
    <DiscoverScrollShell
      scrollBottomPad={scrollBottomPad}
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

      {/* ② Quick-access links */}
      <SuperAppLinks />

      {/* ③ Hero Carousel — featured events */}
      <HeroCarousel events={s.featured} />

      {/* ④ Start Now — always visible */}
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

      {/* ⑤ Near You — only if distinct from primary */}
      {hasNearby && (
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

      {/* ⑥ For Your Culture — personalised */}
      {(s.forYou.length > 0 || d.eventsLoading) && (
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

      {/* ⑦ Featured Artists */}
      <FeaturedArtistRail
        data={d.featuredArtists}
        isLoading={d.curationLoading}
        errorMessage={d.curationRailError}
        onRetry={() => void d.refetchCuration()}
      />

      {/* ⑧ Heritage Playlists */}
      <HeritagePlaylistRail
        data={d.heritagePlaylist}
        isLoading={d.curationLoading}
      />

      {/* ⑨ Indigenous Spotlight */}
      <IndigenousSpotlight
        land={d.land}
        organisations={d.indigenousOrganisations}
        festivals={[]}
        businesses={[]}
      />

      {/* ⑩ Communities */}
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

      {/* ⑪ Activities — workshops & experiences */}
      <ActivityRail
        title="Activities"
        subtitle="Workshops, classes & experiences"
        data={d.activityRailData}
        isLoading={d.activitiesLoading}
        onSeeAll={() => router.push('/activities')}
        errorMessage={d.activitiesRailError}
        onRetry={() => void d.refetchActivities()}
      />

      {/* ⑫ Browse Categories */}
      <CategoryRail />

      {/* ⑬ Explore Cities */}
      <CityRail />

      {/* ⑭ Restaurants */}
      <PreviewRail
        title="Restaurants Near You"
        subtitle="Cultural dining in your neighbourhood"
        accentColor={CategoryColors.food}
        items={s.restaurants}
        isLoading={d.restaurantsLoading}
        seeAllRoute="/restaurants"
      />

      {/* ⑮ Movies & Entertainment */}
      <PreviewRail
        title="Movies & Entertainment"
        subtitle="Cultural films, screenings & shows"
        accentColor={CultureTokens.coral}
        items={s.movies}
        isLoading={d.moviesLoading}
        seeAllRoute="/movies"
        cardStyle="portrait"
      />

      {/* ⑯ Shopping & Markets */}
      <PreviewRail
        title="Shopping & Markets"
        subtitle="Cultural goods, fashion & artisans"
        accentColor={CultureTokens.teal}
        items={d.shoppingPreviewItems}
        isLoading={d.shoppingLoading}
        seeAllRoute="/shopping"
        cardStyle="landscape"
      />

      {/* ⑰ Perks Preview */}
      <PreviewRail
        title="Perks Near You"
        subtitle="Exclusive rewards at cultural venues"
        accentColor={CultureTokens.indigo}
        items={d.perksPreviewItems}
        isLoading={d.perksLoading}
        seeAllRoute="/(tabs)/perks"
      />

    </DiscoverScrollShell>
  );
}

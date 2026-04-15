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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { useDiscoverData } from '@/hooks/useDiscoverData';
import { discoverFeature } from '@/features';
import { CategoryColors, CultureTokens, Vitrine } from '@/constants/theme';
import { isCultureKeralaHost } from '@/lib/domainHost';
import type { EventData, Community } from '@/shared/schema';

import { DiscoverScrollShell } from '@/components/Discover/DiscoverScrollShell';
import { DiscoverVitrineProvider } from '@/components/Discover/DiscoverVitrineContext';
import { DiscoverHeader } from '@/components/Discover/DiscoverHeader';
import { DiscoverCultureTodayCard } from '@/components/Discover/DiscoverCultureTodayCard';
import { SuperAppLinks } from '@/components/Discover/SuperAppLinks';
import { HeroCarousel } from '@/components/Discover/HeroCarousel';
import { EventRail } from '@/components/Discover/EventRail';
import { CultureCardRail } from '@/components/Discover/CultureCardRail';
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
  const { isDesktop, contentWidth } = useLayout();
  const scrollBottomPad = useTabScrollBottomPadding(28);
  const [keralaDomain, setKeralaDomain] = useState(false);

  useEffect(() => { setKeralaDomain(isCultureKeralaHost()); }, []);

  const d = useDiscoverData();
  const s = useKeralaScoping(keralaDomain, d);
  const { data: discoverFeatureFeed } = useQuery({
    queryKey: ['feature-discover-feed', d.userId ?? 'guest', d.state.city, d.state.country],
    queryFn: () =>
      discoverFeature.getDiscoverFeatureFeed({
        userId: d.userId ?? 'guest',
        city: d.state.city || undefined,
        country: d.state.country || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });
  const recommendedFromFeature = useMemo(
    () => discoverFeatureFeed?.rankedEvents.map((entry) => entry.event).slice(0, 8) ?? [],
    [discoverFeatureFeed],
  );

  const goEvents = useCallback(() => router.push('/events'), []);
  const goActivities = useCallback(() => router.push('/activities'), []);

  // Primary nearby rail: GPS first, fall back to starting-soon
  const nearbyRailResolved = s.nearby.filter((i) => typeof i !== 'string');
  const hasNearby = nearbyRailResolved.length > 0;

  return (
    <DiscoverVitrineProvider>
    <DiscoverScrollShell
      scrollBottomPad={scrollBottomPad}
      contentContainerStyle={
        isDesktop ? { width: contentWidth, alignSelf: 'center' } : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={d.refreshing}
          onRefresh={d.handleRefresh}
          tintColor={Vitrine.primary}
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

      <DiscoverCultureTodayCard />

      {/* ② Search (removed) */}


      {/* ③ Starting Soon — always visible */}
      {recommendedFromFeature.length > 0 && (
        <EventRail
          title="Recommended For You"
          subtitle="Ranked by quality, trust, and cultural fit"
          data={recommendedFromFeature}
          onSeeAll={goEvents}
          isLoading={d.discoverLoading}
        />
      )}

      {d.adaptiveCultureRails.map((rail) => (
        <CultureCardRail
          key={rail.id}
          title={rail.title}
          subtitle={rail.subtitle}
          items={rail.items}
        />
      ))}

      {/* ③ Starting Soon — always visible */}
      <EventRail
        title="Starting Soon"
        subtitle="Grab your spot before they start"
        data={
          d.eventsLoading && s.soon.length === 0
            ? ['sk1', 'sk2', 'sk3']
            : s.soon
        }
        isLoading={d.eventsLoading}
        schedulingMode="live_and_countdown"
        onSeeAll={goEvents}
        errorMessage={d.eventsRailError}
        onRetry={() => void d.refetchEvents()}
      />

      {/* ④ Quick-access links */}
      <SuperAppLinks />

      {/* ⑤ Hero Carousel — featured events */}
      <HeroCarousel events={s.featured} />

      {/* ⑥ Near You — only if distinct from primary */}
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
          onSeeAll={goEvents}
          errorMessage={d.eventsRailError}
          onRetry={() => void d.refetchEvents()}
        />
      )}

      {/* ⑦ For Your Culture — personalised */}
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
          onSeeAll={goEvents}
          errorMessage={d.eventsRailError}
          onRetry={() => void d.refetchEvents()}
        />
      )}

      {/* ⑧ Featured Artists */}
      <FeaturedArtistRail
        data={d.featuredArtists}
        isLoading={d.curationLoading}
        errorMessage={d.curationRailError}
        onRetry={() => void d.refetchCuration()}
      />

      {/* ⑨ Heritage Playlists */}
      <HeritagePlaylistRail
        data={d.heritagePlaylist}
        isLoading={d.curationLoading}
      />

      {/* ⑩ Indigenous Spotlight */}
      <IndigenousSpotlight
        land={d.land}
        organisations={d.indigenousOrganisations}
        festivals={[]}
        businesses={[]}
      />

      {/* ⑪ Communities */}
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

      {/* ⑫ Activities — workshops & experiences */}
      <ActivityRail
        title="Activities"
        subtitle="Workshops, classes & experiences"
        data={d.activityRailData}
        isLoading={d.activitiesLoading}
        onSeeAll={goActivities}
        errorMessage={d.activitiesRailError}
        onRetry={() => void d.refetchActivities()}
      />

      {/* ⑬ Browse Categories */}
      <CategoryRail />

      {/* ⑭ Explore Cities */}
      <CityRail />

      {/* ⑮ Restaurants */}
      <PreviewRail
        title="Restaurants Near You"
        subtitle="Cultural dining in your neighbourhood"
        accentColor={CategoryColors.food}
        items={s.restaurants}
        isLoading={d.restaurantsLoading}
        seeAllRoute="/restaurants"
      />

      {/* ⑯ Movies & Entertainment */}
      <PreviewRail
        title="Movies & Entertainment"
        subtitle="Cultural films, screenings & shows"
        accentColor={CultureTokens.coral}
        items={s.movies}
        isLoading={d.moviesLoading}
        seeAllRoute="/movies"
        cardStyle="portrait"
      />

      {/* ⑰ Shopping & Markets */}
      <PreviewRail
        title="Shopping & Markets"
        subtitle="Cultural goods, fashion & artisans"
        accentColor={CultureTokens.teal}
        items={d.shoppingPreviewItems}
        isLoading={d.shoppingLoading}
        seeAllRoute="/shopping"
        cardStyle="landscape"
      />

      {/* ⑱ Perks Preview */}
      <PreviewRail
        title="Perks Near You"
        subtitle="Exclusive rewards at cultural venues"
        accentColor={CultureTokens.indigo}
        items={d.perksPreviewItems}
        isLoading={d.perksLoading}
        seeAllRoute="/(tabs)/perks"
      />

    </DiscoverScrollShell>
    </DiscoverVitrineProvider>
  );
}

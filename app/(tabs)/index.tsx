import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { useDiscoverData } from '@/hooks/useDiscoverData';
import { CategoryColors, CultureTokens, gradients, LiquidGlassTokens } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import type { EventData, Community } from '@/shared/schema';

// Modular Components
import { DiscoverHeader } from '@/components/Discover/DiscoverHeader';
import { SuperAppLinks } from '@/components/Discover/SuperAppLinks';
import { HeroCarousel } from '@/components/Discover/HeroCarousel';
import { FeaturedArtistRail } from '@/components/Discover/FeaturedArtistRail';
import { HeritagePlaylistRail } from '@/components/Discover/HeritagePlaylistRail';
import { IndigenousSpotlight } from '@/components/Discover/IndigenousSpotlight';
import { EventRail } from '@/components/Discover/EventRail';
import { CommunityRail } from '@/components/Discover/CommunityRail';
import { ActivityRail } from '@/components/Discover/ActivityRail';
import { CategoryRail } from '@/components/Discover/CategoryRail';
import { CityRail } from '@/components/Discover/CityRail';
import { PreviewRail } from '@/components/Discover/PreviewRail';
import { isCultureKeralaHost } from '@/lib/domainHost';

export default function DiscoverScreen() {
  const colors = useColors();
  const { isDesktop, contentWidth, hPad } = useLayout();
  const scrollBottomPad = useTabScrollBottomPadding(28);
  const [keralaDomain, setKeralaDomain] = useState(false);

  useEffect(() => {
    setKeralaDomain(isCultureKeralaHost());
  }, []);

  const {
    currentTime,
    weatherSummary,
    refreshing,
    handleRefresh,
    featuredEvents,
    featuredArtists,
    heritagePlaylist,
    land,
    indigenousOrganisations,
    startingSoonRailData,
    popularRailData,
    nearbyRailData,
    activityRailData,
    forYouEvents,
    eventsLoading,
    allEvents,
    allCommunities,
    communitiesLoading,
    activitiesLoading,
    nearbyLoading,
    discoverLoading,
    state,
    isAuthenticated,
    // Directory preview rails
    restaurantPreviewItems,
    restaurantsLoading,
    moviePreviewItems,
    moviesLoading,
    shoppingPreviewItems,
    shoppingLoading,
    perksPreviewItems,
    perksLoading,
    eventsRailError,
    communitiesRailError,
    activitiesRailError,
    nearbyRailError,
    curationRailError,
    curationLoading,
    refetchEvents,
    refetchCommunities,
    refetchActivities,
    refetchCuration,
    retryNearbyProbe,
  } = useDiscoverData();

  const isKeralaEvent = (event: EventData) => {
    const haystack = [
      event.title,
      event.description,
      event.category,
      event.city,
      ...(event.tags ?? []),
      ...(event.cultureTag ?? []),
      ...(event.cultureTags ?? []),
      ...(event.languageTags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return /kerala|malayali|malayalee|malayalam/.test(haystack);
  };

  const isKeralaCommunity = (community: Community) => {
    const c = community as Community & {
      cultureTags?: string[];
      cultureIds?: string[];
      languageIds?: string[];
      languages?: string[];
      description?: string;
    };
    const haystack = [
      c.name,
      c.description,
      ...(c.cultureTags ?? []),
      ...(c.cultureIds ?? []),
      ...(c.languageIds ?? []),
      ...(c.languages ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return /kerala|malayali|malayalee|malayalam/.test(haystack);
  };

  const scopedEvents = keralaDomain ? allEvents.filter(isKeralaEvent) : allEvents;
  const scopedCommunities = keralaDomain ? allCommunities.filter(isKeralaCommunity) : allCommunities;
  const scopedFeaturedEvents = keralaDomain ? featuredEvents.filter(isKeralaEvent) : featuredEvents;
  const scopedNearbyEvents = keralaDomain ? nearbyRailData.filter((item) => typeof item === 'string' || isKeralaEvent(item)) : nearbyRailData;
  const scopedPopularEvents = keralaDomain ? popularRailData.filter((item) => typeof item === 'string' || isKeralaEvent(item)) : popularRailData;
  const scopedForYouEvents = keralaDomain ? forYouEvents.filter(isKeralaEvent) : forYouEvents;
  const scopedStartingSoon = keralaDomain ? startingSoonRailData.filter((item) => typeof item === 'string' || isKeralaEvent(item)) : startingSoonRailData;
  const scopedRestaurants = keralaDomain
    ? restaurantPreviewItems.filter((item) =>
        item === 'skeleton' ||
        /kerala|malayali|malayalee|malayalam/i.test(`${item.title} ${item.subtitle ?? ''}`),
      )
    : restaurantPreviewItems;

  const scopedMovies = keralaDomain
    ? moviePreviewItems.filter((item) =>
        item === 'skeleton' ||
        /kerala|malayali|malayalee|malayalam/i.test(`${item.title} ${item.subtitle ?? ''}`),
      )
    : moviePreviewItems;

  const keralaCtaPress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ambientMesh}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scrollTransparent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: scrollBottomPad },
          isDesktop && { width: contentWidth, alignSelf: 'center' as const },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header: greeting + top bar ── */}
        <DiscoverHeader
          currentTime={currentTime}
          weatherSummary={weatherSummary}
          city={state.city || 'Sydney'}
          country={state.country || 'Australia'}
          isAuthenticated={isAuthenticated}
          onRefresh={handleRefresh}
        />

        {/* ── Quick access links ── */}
        <SuperAppLinks />

        {keralaDomain ? (
          <LiquidGlassPanel
            borderRadius={LiquidGlassTokens.corner.innerRow + 4}
            style={{ marginHorizontal: hPad, marginBottom: 16 }}
            contentStyle={{ padding: 14, gap: 6 }}
          >
            <Text style={[styles.keralaEyebrow, { color: CultureTokens.gold }]}>CultureKerala</Text>
            <Text style={[styles.keralaTitle, { color: colors.text }]}>Kerala & Malayalee Communities Worldwide</Text>
            <Text style={[styles.keralaSub, { color: colors.textSecondary }]}>
              Discover Malayali events, organisations, businesses, and community stories in one place.
            </Text>
            <View style={styles.keralaStatsRow}>
              <View style={[styles.keralaStatChip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.keralaStatValue, { color: colors.text }]}>{scopedCommunities.length}</Text>
                <Text style={[styles.keralaStatLabel, { color: colors.textSecondary }]}>communities</Text>
              </View>
              <View style={[styles.keralaStatChip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.keralaStatValue, { color: colors.text }]}>{scopedEvents.length}</Text>
                <Text style={[styles.keralaStatLabel, { color: colors.textSecondary }]}>events</Text>
              </View>
              <View style={[styles.keralaStatChip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.keralaStatValue, { color: colors.text }]}>
                  {scopedRestaurants.filter((item) => item !== 'skeleton').length}
                </Text>
                <Text style={[styles.keralaStatLabel, { color: colors.textSecondary }]}>places</Text>
              </View>
            </View>
            <View style={styles.keralaCtaRow}>
              <Pressable
                style={[styles.keralaCta, { backgroundColor: CultureTokens.indigo }]}
                onPress={() => {
                  keralaCtaPress();
                  router.push('/communities');
                }}
                accessibilityRole="button"
                accessibilityLabel="Explore Communities"
              >
                <Text style={[styles.keralaCtaText, { color: colors.textOnBrandGradient }]}>Explore Communities</Text>
              </Pressable>
              <Pressable
                style={[styles.keralaGhostCta, { borderColor: colors.primary }]}
                onPress={() => {
                  keralaCtaPress();
                  router.push('/events');
                }}
                accessibilityRole="button"
                accessibilityLabel="View Events"
              >
                <Text style={[styles.keralaGhostCtaText, { color: colors.primary }]}>View Events</Text>
              </Pressable>
            </View>
          </LiquidGlassPanel>
        ) : null}

        {/* ── Hero carousel: featured events ── */}
        <HeroCarousel events={scopedFeaturedEvents} />

        {/* ── Featured artists ── */}
        <FeaturedArtistRail
          data={featuredArtists}
          isLoading={curationLoading}
          errorMessage={curationRailError}
          onRetry={() => void refetchCuration()}
        />

        {/* ── Heritage playlists ── */}
        <HeritagePlaylistRail data={heritagePlaylist} isLoading={curationLoading} />

        {/* ── Indigenous spotlight ── */}
        <IndigenousSpotlight
          land={land}
          organisations={indigenousOrganisations}
          festivals={[]}
          businesses={[]}
        />

        {/* ── Starting soon (LIVE within window + countdown until start) ── */}
        <EventRail
          title="Starting Soon"
          subtitle="Grab your spot before they start"
          data={
            (eventsLoading || discoverLoading) && scopedStartingSoon.length === 0
              ? ['ss1', 'ss2', 'ss3']
              : scopedStartingSoon
          }
          isLoading={(eventsLoading || discoverLoading) && scopedStartingSoon.length === 0}
          schedulingMode="live_and_countdown"
          errorMessage={eventsRailError}
          onRetry={() => void refetchEvents()}
        />

        {/* ── Popular & nearby events ── */}
        <EventRail
          title="Popular Near You"
          subtitle="Trending in your area"
          data={scopedPopularEvents}
          isLoading={eventsLoading || discoverLoading}
          onSeeAll={() => router.push('/events')}
          errorMessage={eventsRailError}
          onRetry={() => void refetchEvents()}
        />

        <EventRail
          title="Events in Your Area"
          subtitle="Happening in your local community"
          data={scopedNearbyEvents}
          isLoading={nearbyLoading}
          onSeeAll={() => router.push('/events')}
          errorMessage={nearbyRailError}
          onRetry={() => {
            void refetchEvents();
            void retryNearbyProbe();
          }}
        />

        {/* ── Communities ── */}
        <CommunityRail
          title="Communities"
          subtitle={keralaDomain ? 'Malayalee groups and cultural circles' : 'Connect with your culture'}
          data={communitiesLoading ? ['s1', 's2', 's3', 's4'] : scopedCommunities}
          isLoading={communitiesLoading}
          errorMessage={communitiesRailError}
          onRetry={() => void refetchCommunities()}
        />

        {/* ── Activities ── */}
        <ActivityRail
          title="Activities"
          subtitle="Workshops and experiences"
          data={activityRailData}
          isLoading={activitiesLoading}
          errorMessage={activitiesRailError}
          onRetry={() => void refetchActivities()}
        />

        {/* ── Category & city browsing ── */}
        <CategoryRail />
        <CityRail />

        {/* ── For You (personalised) ── */}
        <EventRail
          title="For Your Culture"
          subtitle="Personalised events matching your heritage"
          data={eventsLoading && scopedForYouEvents.length === 0 ? ['s1', 's2', 's3'] : scopedForYouEvents}
          isLoading={eventsLoading}
          onSeeAll={() => router.push('/events')}
          errorMessage={eventsRailError}
          onRetry={() => void refetchEvents()}
        />

        {/* ── Restaurants ── */}
        <PreviewRail
          title="Restaurants Near You"
          subtitle="Cultural dining in your neighbourhood"
          accentColor={CategoryColors.food}
          items={scopedRestaurants}
          isLoading={restaurantsLoading}
          seeAllRoute="/restaurants"
        />

        {/* ── Movies ── */}
        <PreviewRail
          title="Movies & Entertainment"
          subtitle="Cultural films, screenings and shows"
          accentColor={CultureTokens.coral}
          items={scopedMovies}
          isLoading={moviesLoading}
          seeAllRoute="/movies"
          cardStyle="portrait"
        />

        {/* ── Shopping ── */}
        <PreviewRail
          title="Shopping & Markets"
          subtitle="Cultural goods, fashion and artisans"
          accentColor={CultureTokens.teal}
          items={shoppingPreviewItems}
          isLoading={shoppingLoading}
          seeAllRoute="/shopping"
          cardStyle="landscape"
        />

        {/* ── Perks ── */}
        <PreviewRail
          title="Perks Near You"
          subtitle="Exclusive rewards at cultural venues"
          accentColor={CultureTokens.indigo}
          items={perksPreviewItems}
          isLoading={perksLoading}
          seeAllRoute="/(tabs)/perks"
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
  },
  scrollTransparent: { flex: 1, backgroundColor: 'transparent' },
  keralaEyebrow: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  keralaTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Poppins_700Bold',
  },
  keralaSub: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins_400Regular',
  },
  keralaStatsRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keralaStatChip: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  keralaStatValue: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins_700Bold',
  },
  keralaStatLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  keralaCtaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keralaCta: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  keralaCtaText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  keralaGhostCta: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  keralaGhostCtaText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
});

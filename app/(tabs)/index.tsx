import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useDiscoverData } from '@/hooks/useDiscoverData';
import { CultureTokens } from '@/constants/theme';

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

export default function DiscoverScreen() {
  const colors = useColors();
  const { isDesktop, contentWidth } = useLayout();

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
    communityRailData,
    nearbyRailData,
    activityRailData,
    forYouEvents,
    eventsLoading,
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && { width: contentWidth, alignSelf: 'center' as const }
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

        {/* ── Hero carousel: featured events ── */}
        <HeroCarousel events={featuredEvents} />

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
            (eventsLoading || discoverLoading) && startingSoonRailData.length === 0
              ? ['ss1', 'ss2', 'ss3']
              : startingSoonRailData
          }
          isLoading={(eventsLoading || discoverLoading) && startingSoonRailData.length === 0}
          schedulingMode="live_and_countdown"
          errorMessage={eventsRailError}
          onRetry={() => void refetchEvents()}
        />

        {/* ── Popular & nearby events ── */}
        <EventRail
          title="Popular Near You"
          subtitle="Trending in your area"
          data={popularRailData}
          isLoading={eventsLoading || discoverLoading}
          onSeeAll={() => router.push('/events')}
          errorMessage={eventsRailError}
          onRetry={() => void refetchEvents()}
        />

        <EventRail
          title="Events in Your Area"
          subtitle="Happening in your local community"
          data={nearbyRailData}
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
          subtitle="Connect with your culture"
          data={communityRailData}
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
          data={eventsLoading && forYouEvents.length === 0 ? ['s1', 's2', 's3'] : forYouEvents}
          isLoading={eventsLoading}
          onSeeAll={() => router.push('/events')}
          errorMessage={eventsRailError}
          onRetry={() => void refetchEvents()}
        />

        {/* ── Restaurants ── */}
        <PreviewRail
          title="Restaurants Near You"
          subtitle="Cultural dining in your neighbourhood"
          accentColor="#FF9500"
          items={restaurantPreviewItems}
          isLoading={restaurantsLoading}
          seeAllRoute="/restaurants"
        />

        {/* ── Movies ── */}
        <PreviewRail
          title="Movies & Entertainment"
          subtitle="Cultural films, screenings and shows"
          accentColor={CultureTokens.coral}
          items={moviePreviewItems}
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

        <View style={styles.footerSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  footerSpacer: { height: 40 },
});

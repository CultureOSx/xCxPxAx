import React from 'react';
import { 
  View, 
  ScrollView, 
  RefreshControl, 
  StyleSheet
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useDiscoverData } from '@/hooks/useDiscoverData';

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
import { ComingSoonRail } from '@/components/Discover/ComingSoonRail';
import { CultureTokens } from '@/constants/theme';

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
    nowBuckets,
    popularRailData,
    communityRailData,
    nearbyRailData,
    activityRailData,
    eventsLoading,
    communitiesLoading,
    activitiesLoading,
    nearbyLoading,
    discoverLoading,
    state,
    isAuthenticated,
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
        <DiscoverHeader 
          currentTime={currentTime}
          weatherSummary={weatherSummary}
          city={state.city || 'Sydney'}
          country={state.country || 'Australia'}
          isAuthenticated={isAuthenticated}
          onRefresh={handleRefresh}
        />

        <SuperAppLinks />

        <HeroCarousel events={featuredEvents} />

        <FeaturedArtistRail data={featuredArtists} />

        <HeritagePlaylistRail data={heritagePlaylist} />

        <IndigenousSpotlight 
          land={land}
          organisations={indigenousOrganisations}
          festivals={[]} // Add indigenous festivals when available
          businesses={[]} // Add indigenous businesses when available
        />

        <EventRail 
          title="Happening Now" 
          subtitle="Events occurring right now or starting shortly" 
          data={nowBuckets.happeningNow} 
          isLive
        />

        <EventRail 
          title="Starting Soon" 
          subtitle="Events starting in the next few hours" 
          data={nowBuckets.startingSoon} 
        />

        <EventRail
          title="Popular Near You"
          subtitle={`Trending events around ${state.city}`}
          data={popularRailData}
          isLoading={eventsLoading || discoverLoading}
        />

        <EventRail
          title="Events in Your Area"
          subtitle="Happening in your local community"
          data={nearbyRailData}
          isLoading={nearbyLoading}
        />

        <CommunityRail
          title="Diaspora Communities"
          subtitle="Connect with your heritage"
          data={communityRailData}
          isLoading={communitiesLoading}
        />

        <ActivityRail
          title="Culture & Exploration"
          subtitle="Workshops, tours, and cultural sites"
          data={activityRailData}
          isLoading={activitiesLoading}
        />

        <CategoryRail />

        <CityRail />

        <ComingSoonRail
          title="For Your Culture"
          subtitle="Personalised events matching your heritage"
          icon="heart"
          accentColor={CultureTokens.coral}
        />

        <ComingSoonRail
          title="Restaurants Near You"
          subtitle="Cultural dining in your neighbourhood"
          icon="restaurant"
          accentColor={CultureTokens.gold}
        />

        <ComingSoonRail
          title="Movies & Entertainment"
          subtitle="Cultural films, screenings and shows"
          icon="film"
          accentColor={CultureTokens.gold}
        />

        <ComingSoonRail
          title="Shopping & Markets"
          subtitle="Cultural goods, fashion and artisans"
          icon="bag"
          accentColor={CultureTokens.teal}
        />

        <ComingSoonRail
          title="Perks Near You"
          subtitle="Exclusive rewards at cultural venues"
          icon="gift"
          accentColor={CultureTokens.indigo}
        />

        <ComingSoonRail
          title="Trending Artists"
          subtitle="Rising cultural artists in your city"
          icon="musical-notes"
          accentColor="#A855F7"
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

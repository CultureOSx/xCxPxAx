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
import { IndigenousSpotlight } from '@/components/Discover/IndigenousSpotlight';
import { EventRail } from '@/components/Discover/EventRail';
import { CommunityRail } from '@/components/Discover/CommunityRail';
import { ActivityRail } from '@/components/Discover/ActivityRail';
import { CategoryRail } from '@/components/Discover/CategoryRail';
import { CityRail } from '@/components/Discover/CityRail';

export default function DiscoverScreen() {
  const colors = useColors();
  const { isDesktop, contentWidth } = useLayout();
  
  const {
    currentTime,
    weatherSummary,
    refreshing,
    handleRefresh,
    featuredEvents,
    land,
    indigenousOrganisations,
    nowBuckets,
    popularRailData,
    communityRailData,
    nearbyRailData,
    activityRailData,
    nearbyLoading,
    state,
    isAuthenticated,
  } = useDiscoverData();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && { width: contentWidth, alignSelf: 'center' as any }
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
        />

        <ActivityRail 
          title="Culture & Exploration" 
          subtitle="Workshops, tours, and cultural sites" 
          data={activityRailData} 
        />

        <CategoryRail />

        <CityRail />

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

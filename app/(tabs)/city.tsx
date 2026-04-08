/**
 * My City — “Everything in your city” hub.
 *
 * Design goals:
 * - iOS/Android: fast, scrollable, high-signal rails with glass chrome.
 * - Web: desktop-safe max width and sidebar parity (topInset = 0).
 * - Architecture: reuse `useDiscoverData()` (already aggregates city-scoped content).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { useDiscoverData } from '@/hooks/useDiscoverData';
import { CultureTokens } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { DiscoverScrollShell } from '@/components/Discover/DiscoverScrollShell';
import { SuperAppLinks } from '@/components/Discover/SuperAppLinks';
import { EventRail } from '@/components/Discover/EventRail';
import { CommunityRail } from '@/components/Discover/CommunityRail';
import { ActivityRail } from '@/components/Discover/ActivityRail';
import { CategoryRail } from '@/components/Discover/CategoryRail';
import { PreviewRail } from '@/components/Discover/PreviewRail';
import { IndigenousSpotlight } from '@/components/Discover/IndigenousSpotlight';

function CityHero({
  city,
  country,
  time,
  weather,
  hPad,
  isDesktop,
}: {
  city: string;
  country: string;
  time: string;
  weather: string;
  hPad: number;
  isDesktop: boolean;
}) {
  const colors = useColors();
  const meta = [time, weather].filter(Boolean).join(' · ');

  return (
    <View style={{ paddingHorizontal: hPad, paddingTop: 12 }}>
      <LiquidGlassPanel
        borderRadius={22}
        style={{ overflow: 'hidden' }}
        contentStyle={[hero.card, { borderColor: colors.borderLight }]}
      >
        <View style={hero.left}>
          <View style={[hero.badge, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '35' }]}>
            <Ionicons name="location" size={14} color={CultureTokens.indigo} />
            <Text style={[hero.badgeText, { color: CultureTokens.indigo }]} numberOfLines={1}>
              {city}{country ? `, ${country}` : ''}
            </Text>
          </View>

          <Text style={[hero.title, { color: colors.text }]} numberOfLines={2}>
            Everything happening in {city}
          </Text>

          {meta ? (
            <Text style={[hero.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>

        <View style={hero.right}>
          <Pressable
            onPress={() => router.push('/events')}
            style={({ pressed }) => [
              hero.primaryBtn,
              { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open events"
          >
            <Ionicons name="calendar" size={16} color="#fff" />
            <Text style={hero.primaryBtnText}>Events</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: '/city/[name]' as never, params: { name: city, country } })}
            style={({ pressed }) => [
              hero.secondaryBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open city guide"
          >
            <Ionicons name="sparkles-outline" size={16} color={colors.text} />
            <Text style={[hero.secondaryBtnText, { color: colors.text }]}>
              {isDesktop ? 'Open City Guide' : 'City Guide'}
            </Text>
          </Pressable>
        </View>
      </LiquidGlassPanel>
    </View>
  );
}

const hero = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 14,
  },
  left: { gap: 8 },
  right: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-start' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  badgeText: { fontFamily: 'Poppins_700Bold', fontSize: 12 },
  title: { fontFamily: 'Poppins_800ExtraBold', fontSize: 20, letterSpacing: -0.3, lineHeight: 26 },
  meta: { fontFamily: 'Poppins_400Regular', fontSize: 12, opacity: 0.85 },
  primaryBtn: { height: 40, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtnText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 13 },
  secondaryBtn: { height: 40, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1 },
  secondaryBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 13 },
});

export default function MyCityTabScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDesktop, contentWidth, hPad } = useLayout();
  const scrollBottomPad = useTabScrollBottomPadding(24);
  const d = useDiscoverData();

  const isWeb = Platform.OS === 'web';
  const topInset = isWeb ? 0 : insets.top;

  const city = d.state.city || 'Sydney';
  const country = d.state.country || 'Australia';
  const locationLabel = city && country ? `${city}, ${country}` : city || country;

  const refresh = useMemo(
    () => (
      <RefreshControl
        refreshing={d.refreshing}
        onRefresh={d.handleRefresh}
        tintColor={colors.primary}
        colors={[CultureTokens.indigo]}
      />
    ),
    [d.refreshing, d.handleRefresh, colors.primary],
  );

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TabPrimaryHeader
          title="My City"
          subtitle="Your local culture hub"
          locationLabel={locationLabel}
          hPad={hPad}
          topInset={topInset}
          rightActions={
            <Pressable
              onPress={() => {
                if (!isWeb) Haptics.selectionAsync().catch(() => {});
                d.handleRefresh();
              }}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: colors.primarySoft, borderColor: colors.borderLight, opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Refresh city content"
            >
              <Ionicons name="refresh" size={18} color={colors.text} />
            </Pressable>
          }
        />

        <DiscoverScrollShell
          scrollBottomPad={scrollBottomPad}
          contentContainerStyle={isDesktop ? { width: contentWidth, alignSelf: 'center' } : undefined}
          refreshControl={refresh}
        >
          <CityHero
            city={city}
            country={country}
            time={d.currentTime}
            weather={d.weatherSummary}
            hPad={hPad}
            isDesktop={isDesktop}
          />

          <SuperAppLinks />

          <EventRail
            title="Starting Soon"
            subtitle="Grab your spot before they start"
            data={d.eventsLoading ? ['sk1', 'sk2', 'sk3'] : d.startingSoonRailData}
            isLoading={d.eventsLoading}
            schedulingMode="live_and_countdown"
            onSeeAll={() => router.push('/events')}
            errorMessage={d.eventsRailError}
            onRetry={() => void d.refetchEvents()}
          />

          <EventRail
            title="Near You"
            subtitle="Local events in your area"
            data={d.nearbyRailData}
            isLoading={d.nearbyLoading}
            onSeeAll={() => router.push('/events')}
            errorMessage={d.nearbyRailError}
            onRetry={() => void d.retryNearbyProbe()}
          />

          <CommunityRail
            title="Communities"
            subtitle="Local circles and diaspora groups"
            data={d.communityRailData}
            isLoading={d.communitiesLoading}
            errorMessage={d.communitiesRailError}
            onRetry={() => void d.refetchCommunities()}
            onSeeAll={() => router.push('/(tabs)/community')}
          />

          <ActivityRail
            title="Activities"
            subtitle="Workshops, classes & experiences"
            data={d.activityRailData}
            isLoading={d.activitiesLoading}
            onSeeAll={() => router.push('/activities')}
            errorMessage={d.activitiesRailError}
            onRetry={() => void d.refetchActivities()}
          />

          <CategoryRail />

          <PreviewRail
            title="Dining"
            subtitle={`Restaurants in ${city}`}
            accentColor={CultureTokens.gold}
            items={d.restaurantPreviewItems}
            isLoading={d.restaurantsLoading}
            seeAllRoute="/restaurants"
            cardStyle="landscape"
          />

          <PreviewRail
            title="Movies"
            subtitle="Cultural films & screenings"
            accentColor={CultureTokens.coral}
            items={d.moviePreviewItems}
            isLoading={d.moviesLoading}
            seeAllRoute="/movies"
            cardStyle="portrait"
          />

          <PreviewRail
            title="Shopping"
            subtitle="Markets and cultural goods"
            accentColor={CultureTokens.teal}
            items={d.shoppingPreviewItems}
            isLoading={d.shoppingLoading}
            seeAllRoute="/shopping"
            cardStyle="landscape"
          />

          <PreviewRail
            title="Perks"
            subtitle="Rewards and member offers"
            accentColor={CultureTokens.indigo}
            items={d.perksPreviewItems}
            isLoading={d.perksLoading}
            seeAllRoute="/(tabs)/perks"
            cardStyle="landscape"
          />

          <IndigenousSpotlight
            land={d.land}
            organisations={d.indigenousOrganisations}
            festivals={[]}
            businesses={[]}
          />
        </DiscoverScrollShell>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});


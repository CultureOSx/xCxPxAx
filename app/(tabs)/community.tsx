import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { CultureEngagementHero } from '@/components/tabs/CultureEngagementHero';
import { ConnectTeaser } from '@/components/connect/ConnectTeaser';
import { AnimatedFilterChip } from '@/components/ui/AnimatedFilterChip';
import { CommunityGridCard } from '@/components/community/CommunityGridCard';
import { CommunityPreviewDrawer } from '@/components/community/CommunityPreviewDrawer';
import { useCommunities } from '@/hooks/queries/useCommunities';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { CultureTokens, FontFamily } from '@/constants/theme';
import { MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';
import type { Community } from '@/shared/schema';

const IS_WEB = Platform.OS === 'web';

const CATEGORIES = [
  { id: 'All', label: 'All', icon: 'apps-outline' },
  { id: 'association', label: 'Associations', icon: 'business-outline' },
  { id: 'student', label: 'Student', icon: 'school-outline' },
  { id: 'professional', label: 'Professional', icon: 'briefcase-outline' },
  { id: 'festival', label: 'Festivals', icon: 'sparkles-outline' },
  { id: 'diaspora', label: 'Diaspora', icon: 'earth-outline' },
] as const;

const FALLBACK_CULTURES = ['Indian', 'Chinese', 'Korean', 'Nigerian', 'Greek', 'Italian'];

function matchesCategory(item: Community, selected: string): boolean {
  if (selected === 'All') return true;
  const cat = item.communityCategory?.toLowerCase();
  const type = item.communityType?.toLowerCase();
  const legacy = item.category?.toLowerCase();
  return cat === selected.toLowerCase() || type === selected.toLowerCase() || legacy === selected.toLowerCase();
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { hPad, isDesktop, isTablet, columnWidth } = useLayout();
  const { state: onboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();

  const topInset = IS_WEB ? 0 : insets.top;
  const bottomInset = IS_WEB ? 0 : insets.bottom;

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCulture, setSelectedCulture] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<Community | null>(null);

  const {
    data: communitiesRaw = [],
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useCommunities({
    city: onboarding?.city,
    country: onboarding?.country,
    nationalityId: onboarding?.nationalityId,
  });

  const cultureChips = useMemo(() => {
    const set = new Set<string>();
    const chips: string[] = [];
    for (const community of communitiesRaw) {
      const candidate = community.countryOfOrigin || community.primaryLanguageLabel || community.nationalityId;
      if (candidate && !set.has(candidate)) {
        set.add(candidate);
        chips.push(candidate);
      }
    }
    if (chips.length === 0) return FALLBACK_CULTURES;
    return chips.slice(0, 10);
  }, [communitiesRaw]);

  const filteredCommunities = useMemo(() => {
    return communitiesRaw.filter((community) => {
      if (!matchesCategory(community, selectedCategory)) return false;
      if (selectedCulture) {
        const cultureText = [
          community.countryOfOrigin,
          community.primaryLanguageLabel,
          community.nationalityId,
          ...(community.cultures ?? []),
          ...(community.cultureIds ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!cultureText.includes(selectedCulture.toLowerCase())) return false;
      }
      return true;
    });
  }, [communitiesRaw, selectedCategory, selectedCulture]);

  const numCols = isDesktop ? 3 : isTablet ? 3 : 2;
  const gap = isDesktop ? 18 : 12;
  const cardW = Math.floor(columnWidth(numCols));

  const locationLabel = onboarding?.city
    ? `${onboarding.city}${onboarding.country ? `, ${onboarding.country}` : ''}`
    : onboarding?.country || 'your region';

  const filtersActive = selectedCategory !== 'All' || selectedCulture !== null;

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setSelectedCulture(null);
  }, []);

  const openPreview = useCallback((community: Community) => {
    if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedPreview(community);
  }, []);

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[CultureTokens.indigo + '26', CultureTokens.teal + '14', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ambient}
          pointerEvents="none"
        />

        <TabPrimaryHeader
          title="Community"
          subtitle="Find local circles, diaspora groups, and trusted cultural spaces."
          locationLabel={locationLabel}
          hPad={hPad}
          topInset={topInset}
          useSolidWebSurface
        />

        <FlatList
          data={filteredCommunities}
          key={`community-${numCols}`}
          keyExtractor={(item) => item.id}
          numColumns={numCols}
          columnWrapperStyle={numCols > 1 ? { gap } : undefined}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: hPad,
            paddingTop: 8,
            paddingBottom: bottomInset + MAIN_TAB_UI.scrollBottomPad,
            gap,
          }}
          refreshControl={
            !IS_WEB ? (
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={CultureTokens.indigo}
                colors={[CultureTokens.indigo]}
              />
            ) : undefined
          }
          ListHeaderComponent={
            <View style={{ marginBottom: 10 }}>
              <CultureEngagementHero
                title="Build your local circle and global community."
                subtitle="Join trusted groups, discover local meetups, and create a stronger sense of belonging."
                stat={`${filteredCommunities.length} communities available`}
                badge="Community Hub"
                ctaLabel="Create a Hub"
                ctaRoute="/create?type=community"
                icon="people"
              />

              <ConnectTeaser />

              <View
                style={[
                  styles.filtersCard,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: colors.surface,
                  }
                ]}
              >
                <View style={styles.filtersHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.filtersTitle, { color: colors.text }]}>Filter communities</Text>
                    <Text style={[styles.filtersSubtitle, { color: colors.textSecondary }]}>
                      Refine by category and culture
                    </Text>
                  </View>
                  <View style={[styles.resultsBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <Text style={[styles.resultsBadgeText, { color: colors.textSecondary }]}>
                      {filteredCommunities.length} shown
                    </Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                  {CATEGORIES.map((cat) => (
                    <AnimatedFilterChip
                      key={cat.id}
                      label={cat.label}
                      active={selectedCategory === cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      icon={cat.icon}
                    />
                  ))}
                  {filtersActive ? (
                    <Pressable
                      onPress={clearFilters}
                      style={[styles.clearBtn, { borderColor: colors.borderLight }]}
                      accessibilityRole="button"
                      accessibilityLabel="Clear all filters"
                    >
                      <Ionicons name="close" size={12} color={colors.textTertiary} />
                      <Text style={[styles.clearBtnText, { color: colors.textTertiary }]}>Clear</Text>
                    </Pressable>
                  ) : null}
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                  {cultureChips.map((chip) => {
                    const active = selectedCulture === chip;
                    return (
                      <Pressable
                        key={chip}
                        onPress={() => setSelectedCulture(active ? null : chip)}
                        style={({ pressed }) => [
                          styles.cultureChip,
                          {
                            backgroundColor: active ? CultureTokens.indigo + '18' : colors.surface,
                            borderColor: active ? CultureTokens.indigo : colors.borderLight,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Filter by ${chip}`}
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.cultureChipText, { color: active ? CultureTokens.indigo : colors.text }]}>
                          {chip}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={[styles.summaryRow, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>Communities near you</Text>
                  <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                    {filteredCommunities.length} communities in {locationLabel}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/create?type=community')}
                  style={({ pressed }) => [
                    styles.summaryCta,
                    {
                      backgroundColor: CultureTokens.indigo,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Create community"
                >
                  <Ionicons name="add" size={14} color={colors.surface} />
                  <Text style={[styles.summaryCtaText, { color: colors.surface }]}>Create</Text>
                </Pressable>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(Math.min(index * 40, 320)).springify().damping(18)}
              style={{ flex: 1 }}
            >
              <CommunityGridCard item={item} width={cardW} onPress={openPreview} />
            </Animated.View>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={CultureTokens.indigo} />
              </View>
            ) : isError ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="alert-circle-outline" size={28} color={colors.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn&apos;t load communities</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Check your connection and try again.
                </Text>
                <Pressable
                  onPress={() => void refetch()}
                  style={({ pressed }) => [
                    styles.emptyCta,
                    { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading communities"
                >
                  <Ionicons name="refresh" size={15} color={colors.surface} />
                  <Text style={[styles.emptyCtaText, { color: colors.surface }]}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="globe-outline" size={28} color={colors.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No communities found</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  Try changing your filters or start a new community in your region.
                </Text>
                <Pressable
                  onPress={() => router.push('/create?type=community')}
                  style={({ pressed }) => [
                    styles.emptyCta,
                    { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.9 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Create a community"
                >
                  <Ionicons name="add" size={15} color={colors.surface} />
                  <Text style={[styles.emptyCtaText, { color: colors.surface }]}>Create Community</Text>
                </Pressable>
              </View>
            )
          }
        />
      </View>

      <CommunityPreviewDrawer profile={selectedPreview} onClose={() => setSelectedPreview(null)} />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  ambient: { ...StyleSheet.absoluteFillObject, opacity: 0.18 },

  row: { gap: 7, alignItems: 'center' },
  filtersCard: {
    marginTop: 8,
    marginBottom: 10,
    borderRadius: MAIN_TAB_UI.cardRadius,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 10,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filtersTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: FontFamily.bold,
  },
  filtersSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.medium,
  },
  resultsBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resultsBadgeText: { fontSize: 11, fontFamily: FontFamily.semibold },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearBtnText: { fontSize: 12, fontFamily: FontFamily.semibold },

  cultureChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cultureChipText: { fontSize: 12, fontFamily: FontFamily.semibold },

  summaryRow: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryTitle: { fontSize: 13, lineHeight: 17, fontFamily: FontFamily.bold },
  summaryText: { fontSize: 12, fontFamily: FontFamily.medium },
  summaryCta: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 76,
    justifyContent: 'center',
  },
  summaryCtaText: { fontSize: 12, fontFamily: FontFamily.bold, letterSpacing: 0.2 },

  loadingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 70, paddingHorizontal: 30, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, lineHeight: 24, fontFamily: FontFamily.bold },
  emptySub: { fontSize: 14, lineHeight: 20, fontFamily: FontFamily.regular, textAlign: 'center' },
  emptyCta: {
    marginTop: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  emptyCtaText: { fontSize: 13, fontFamily: FontFamily.bold },
});


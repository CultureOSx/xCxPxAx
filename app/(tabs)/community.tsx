// app/(tabs)/community.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { CultureTokens, gradients, LiquidGlassTokens, FontFamily, FontSize, shadows } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnimatedFilterChip } from '@/components/ui/AnimatedFilterChip';
import { CommunityGridCard } from '@/components/community/CommunityGridCard';
import { CommunityPreviewDrawer } from '@/components/community/CommunityPreviewDrawer';
import { useCommunities } from '@/hooks/queries/useCommunities';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';
import { CultureEngagementHero } from '@/components/tabs/CultureEngagementHero';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { ConnectTeaser } from '@/components/connect/ConnectTeaser';
import { NATIONALITIES } from '@/constants/cultures';
import type { Community } from '@/shared/schema';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'All',          label: 'All',           icon: 'apps-outline'       },
  { id: 'association',  label: 'Associations',  icon: 'business-outline'   },
  { id: 'student',      label: 'Student',       icon: 'school-outline'     },
  { id: 'professional', label: 'Professional',  icon: 'briefcase-outline'  },
  { id: 'festival',     label: 'Festivals',     icon: 'sparkles-outline'   },
  { id: 'diaspora',     label: 'Diaspora',      icon: 'earth-outline'      },
];

const FALLBACK_CULTURE_IDS = ['indian', 'chinese', 'korean', 'nigerian', 'greek', 'italian'];

const isWeb = Platform.OS === 'web';

// FilterChip imported from @/components/ui/AnimatedFilterChip

function FilterDivider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={{ width: 1, height: 18, backgroundColor: colors.borderLight, marginHorizontal: 4, alignSelf: 'center' }} />;
}

// ─── Community Skeleton Card ──────────────────────────────────────────────────

function CommunityCardSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[sk.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[sk.image, { backgroundColor: colors.surfaceElevated }]} />
      <View style={sk.body}>
        <View style={[sk.line, { width: '75%', backgroundColor: colors.surfaceElevated }]} />
        <View style={[sk.line, { width: '50%', backgroundColor: colors.surfaceElevated, marginTop: 6 }]} />
        <View style={[sk.pill, { backgroundColor: colors.surfaceElevated, marginTop: 8 }]} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card:  { borderRadius: 16, overflow: 'hidden', borderWidth: 1, marginBottom: 0 },
  image: { height: 110, borderRadius: 0 },
  body:  { padding: 12 },
  line:  { height: 12, borderRadius: 6 },
  pill:  { height: 20, width: 80, borderRadius: 10 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CommunitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad, columnWidth, isDesktop } = useLayout();
  const { state: onboardingState } = useOnboarding();
  const reducedMotion = useReducedMotion();

  const topInset = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 0 : insets.bottom;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCulture, setSelectedCulture] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<Community | null>(null);

  const numCols = isDesktop ? 3 : 2;
  const colGap  = isDesktop ? 20 : 12;

  const { data: communitiesRaw = [], isLoading, refetch, isRefetching } = useCommunities({
    city: onboardingState?.city,
    country: onboardingState?.country,
    nationalityId: onboardingState?.nationalityId,
  });

  const cultureChips = useMemo(() => {
    const seen = new Set<string>();
    const chips: { id: string; emoji: string; label: string }[] = [];
    const nats = NATIONALITIES as Record<string, { emoji: string; label: string } | undefined>;

    for (const c of communitiesRaw) {
      const natId = c.nationalityId;
      if (natId && !seen.has(natId)) {
        const nat = nats[natId];
        if (nat) {
          seen.add(natId);
          chips.push({ id: natId, emoji: nat.emoji, label: nat.label });
        }
      }
    }

    if (chips.length === 0) {
      for (const id of FALLBACK_CULTURE_IDS) {
        const nat = nats[id];
        if (nat) chips.push({ id, emoji: nat.emoji, label: nat.label });
      }
    }

    return chips.slice(0, 12);
  }, [communitiesRaw]);

  const filteredCommunities = useMemo(() => {
    let list = communitiesRaw;

    if (selectedCategory !== 'All') {
      const normalized = selectedCategory.toLowerCase();
      list = list.filter((c) => {
        const cat = c.communityCategory?.toLowerCase();
        const type = c.communityType?.toLowerCase();
        const legacy = c.category?.toLowerCase();
        return cat === normalized || type === normalized || legacy === normalized;
      });
    }

    if (selectedCulture) {
      list = list.filter(
        (c) =>
          c.nationalityId === selectedCulture ||
          (c.cultures ?? []).includes(selectedCulture),
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        const haystack = [
          c.name,
          c.description,
          c.headline,
          c.countryOfOrigin,
          c.primaryLanguageLabel,
          ...(c.cultures ?? []),
          ...(c.cultureIds ?? []),
          ...(c.chapterCities ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return list;
  }, [communitiesRaw, search, selectedCategory, selectedCulture]);

  const filtersActive = selectedCategory !== 'All' || selectedCulture !== null || search.trim().length > 0;

  const locationLabel = onboardingState?.city
    ? `${onboardingState.city}${onboardingState.country ? `, ${onboardingState.country}` : ''}`
    : onboardingState?.country || 'your region';

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setSelectedCulture(null);
    setSearch('');
  }, []);

  const cardW = Math.floor(columnWidth());

  const handleCardPress = useCallback((item: Community) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPreview(item);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Community; index: number }) => (
      <Animated.View
        entering={
          reducedMotion
            ? undefined
            : FadeInDown.delay(Math.min(index * 60, 400)).springify().damping(18)
        }
        style={{ flex: 1 }}
      >
        <CommunityGridCard item={item} width={cardW} onPress={handleCardPress} />
      </Animated.View>
    ),
    [cardW, handleCardPress, reducedMotion],
  );

  return (
    <ErrorBoundary>
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.ambientMesh}
          pointerEvents="none"
        />

        {/* ── Header (liquid glass) ── */}
        <TabPrimaryHeader
          title="Community"
          subtitle="Find local circles, diaspora groups, and cultural forums."
          locationLabel={
            `${locationLabel}${!isLoading && filteredCommunities.length > 0 ? ` · ${filteredCommunities.length.toLocaleString()} shown` : ''}`
          }
          hPad={hPad}
          topInset={topInset}
        >
          <View style={s.headerControlsRow}>
            <View style={s.searchActionsRow}>
                <View style={[s.searchBar, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
                  <Ionicons name="search" size={MAIN_TAB_UI.iconSize.sm} color={colors.textTertiary} />
                  <TextInput
                    style={[s.searchInput, { color: colors.text }]}
                    placeholder="Search..."
                    placeholderTextColor={colors.textTertiary}
                    value={search}
                    onChangeText={setSearch}
                    returnKeyType="search"
                    accessibilityLabel="Search communities"
                  />
                  {search.length > 0 ? (
                    <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search" accessibilityRole="button">
                      <Ionicons name="close-circle" size={MAIN_TAB_UI.iconSize.sm} color={colors.textTertiary} />
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  onPress={() => refetch()}
                  style={[s.iconBtn, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh communities"
                >
                  {isRefetching ? (
                    <ActivityIndicator size="small" color={CultureTokens.indigo} />
                  ) : (
                    <Ionicons name="refresh" size={18} color={colors.text} />
                  )}
                </Pressable>
              </View>
            </View>
          </TabPrimaryHeader>

        {/* ── Shell ── */}
        <View style={[s.shell, isDesktop && s.shellDesktop]}>
          <View style={{ paddingHorizontal: hPad, paddingTop: 10 }}>
            <CultureEngagementHero
              title="Build your local circle and global community."
              subtitle="Join trusted groups, discover meetups, and become visible in your cultural network."
              stat={`${filteredCommunities.length} communities available`}
              badge="Global Nomad"
              ctaLabel="Create a Community"
              ctaRoute="/submit?type=organisation"
              icon="people"
            />
          </View>

          {/* ── Connect & Social (coming soon teaser) ── */}
          <ConnectTeaser />

          {/* ── Filter rows (glass rail) ── */}
          <LiquidGlassPanel
            borderRadius={MAIN_TAB_UI.cardRadius}
            style={{ marginHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapSmall, marginBottom: 8 }}
            contentStyle={s.filterGlassInner}
          >
            {/* Row 1: Category filters */}
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterRow}
              accessibilityRole="tablist"
              accessibilityLabel="Category filters"
            >
              {CATEGORIES.map(cat => (
                <AnimatedFilterChip
                  key={cat.id}
                  label={cat.label}
                  active={selectedCategory === cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  icon={cat.icon}
                />
              ))}

              {filtersActive && (
                <>
                  <FilterDivider colors={colors} />
                  <Pressable
                    onPress={clearFilters}
                    style={[s.clearBtn, { borderColor: colors.borderLight }]}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all filters"
                  >
                    <Ionicons name="close" size={MAIN_TAB_UI.iconSize.sm} color={colors.textTertiary} />
                    <Text style={[s.clearBtnText, { color: colors.textTertiary }]}>Clear</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>

            {/* Row 2: Culture / nationality filters */}
            {cultureChips.length > 0 ? (
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[s.filterRow, s.filterRowSecondary]}
                accessibilityRole="tablist"
                accessibilityLabel="Culture filters"
              >
                {cultureChips.map((chip) => {
                  const active = selectedCulture === chip.id;
                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => {
                        if (!isWeb) Haptics.selectionAsync();
                        setSelectedCulture(active ? null : chip.id);
                      }}
                      style={({ pressed }) => [
                        s.cultureChip,
                        {
                          backgroundColor: active ? CultureTokens.indigo + '20' : colors.surface,
                          borderColor: active ? CultureTokens.indigo : colors.borderLight,
                          opacity: pressed ? 0.82 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${chip.label}`}
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={s.cultureEmoji}>{chip.emoji}</Text>
                      <Text
                        style={[s.cultureLabel, { color: active ? CultureTokens.indigo : colors.text }]}
                        numberOfLines={1}
                      >
                        {chip.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </LiquidGlassPanel>

          {/* ── Grid ── */}
          {isLoading ? (
            <FlatList
              key={`skeleton-${numCols}`}
              data={Array.from({ length: 8 })}
              renderItem={() => <View style={{ flex: 1 }}><CommunityCardSkeleton colors={colors} /></View>}
              keyExtractor={(_, i) => `sk-${i}`}
              numColumns={numCols}
              columnWrapperStyle={numCols > 1 ? { gap: colGap } : undefined}
              contentContainerStyle={[s.list, { paddingHorizontal: hPad, gap: colGap }]}
              scrollEnabled={false}
            />
          ) : (
            <FlatList
              key={`communities-${numCols}`}
              data={filteredCommunities}
              renderItem={renderItem}
              keyExtractor={(item: Community) => item.id}
              numColumns={numCols}
              columnWrapperStyle={numCols > 1 ? { gap: colGap } : undefined}
              contentContainerStyle={[s.list, { paddingHorizontal: hPad, gap: colGap, paddingBottom: bottomInset + 80 }]}
              showsVerticalScrollIndicator={false}
              refreshing={isRefetching}
              onRefresh={refetch}
              ListFooterComponent={() => {
                if (!isLoading && filteredCommunities.length > 0) return (
                  <View style={s.listFooter}>
                    <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                    <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
                      {filteredCommunities.length} {filteredCommunities.length !== 1 ? 'communities' : 'community'} shown
                    </Text>
                    <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                  </View>
                );
                return null;
              }}
              ListEmptyComponent={
                <View style={s.emptyState}>
                  <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <Ionicons name="globe-outline" size={28} color={colors.textTertiary} />
                  </View>
                  <Text style={[s.emptyTitle, { color: colors.text }]}>No communities found</Text>
                  <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
                    {filtersActive
                      ? 'Try adjusting your filters or clearing the search.'
                      : `No communities yet in ${locationLabel}.`}
                  </Text>
                  {filtersActive && (
                    <Pressable
                      style={[s.resetBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
                      onPress={clearFilters}
                      accessibilityRole="button"
                    >
                      <Ionicons name="refresh-outline" size={MAIN_TAB_UI.iconSize.sm} color={CultureTokens.indigo} />
                      <Text style={[s.resetBtnText, { color: CultureTokens.indigo }]}>Reset filters</Text>
                    </Pressable>
                  )}
                </View>
              }
              ListFooterComponentStyle={s.footerWrap}
            />
          )}
        </View>

        {/* ── Create CTA (bottom-right corner) ── */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.delay(300).springify()}
          style={[
            s.fab,
            {
              backgroundColor: CultureTokens.indigo,
              bottom: bottomInset + 96,
              ...Platform.select({
                ios: shadows.large,
                android: { elevation: 8 },
                web: shadows.medium,
              }),
            },
          ]}
        >
          <Pressable
            onPress={() => {
              if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/submit?type=organisation');
            }}
            accessibilityRole="button"
            accessibilityLabel="Create a community"
            style={s.fabInner}
          >
            <Ionicons name="add" size={22} color={colors.textOnBrandGradient} />
          </Pressable>
        </Animated.View>
      </View>

      <CommunityPreviewDrawer
        profile={selectedPreview}
        onClose={() => setSelectedPreview(null)}
      />
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },

  headerControlsRow: { gap: 8 },
  searchActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 10,
    borderRadius: LiquidGlassTokens.corner.valueRibbon,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: 6,
    minWidth: 0,
  },
  searchInput: { flex: 1, fontSize: FontSize.chip, fontFamily: FontFamily.regular, height: 36, padding: 0 },

  shell: { flex: 1 },
  shellDesktop: { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  filterGlassInner: { paddingVertical: 10, paddingHorizontal: 8, gap: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterRowSecondary: { paddingBottom: 2 },
  clearBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  clearBtnText:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold', lineHeight: 17 },

  cultureChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1.5 },
  cultureEmoji:   { fontSize: 14, lineHeight: 18 },
  cultureLabel:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  list:           { paddingTop: MAIN_TAB_UI.sectionGap, gap: MAIN_TAB_UI.sectionGap },
  listFooter:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 20, justifyContent: 'center' },
  listFooterText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, lineHeight: 20 },
  endLine:        { flex: 1, height: 1, opacity: 0.5 },
  footerWrap:     {},

  emptyState:     { alignItems: 'center', paddingVertical: 100, paddingHorizontal: 40, gap: 14 },
  emptyIcon:      { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  emptyTitle:     { fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  emptyDesc:      { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  resetBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 12 },
  resetBtnText:   { fontSize: 14, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 19 },

  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  fabInner:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

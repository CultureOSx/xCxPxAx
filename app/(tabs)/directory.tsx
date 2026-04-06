import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CultureTokens,
  gradients,
  LiquidGlassTokens,
  FontFamily,
  FontSize,
  LineHeight,
} from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import * as Haptics from 'expo-haptics';
import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { profileKeys, eventKeys, councilKeys } from '@/hooks/queries/keys';
import { queryClient } from '@/lib/query-client';
import type { Profile, EventData } from '@/shared/schema';
import { api, type CouncilData } from '@/lib/api';
import type { FilterItem } from '@/components/FilterChip';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnimatedFilterChip } from '@/components/ui/AnimatedFilterChip';
import { isIndigenousProfile } from '@/lib/indigenous';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { useLocations } from '@/hooks/useLocations';
import {
  FilterDivider,
  DirectoryEventCard,
  DirectoryCard,
  DirectoryEmptyState,
  FeaturedRail,
  ENTITY_FILTERS,
  getDirectoryListingType,
  isWeb,
  s,
  getTags,
} from '@/components/directory/DirectoryComponents';

// ─── DirectoryScreen ──────────────────────────────────────────────────────────

export default function DirectoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { width, isDesktop, isTablet, hPad } = useLayout();
  const { state: onboardingState } = useOnboarding();
  const { acknowledgement } = useLocations();
  const reducedMotion = useReducedMotion();

  const showAcknowledgement = ['Australia', 'New Zealand', 'Canada', 'AU', 'NZ', 'CA'].includes(onboardingState.country || 'Australia');

  const isDesktopWeb = isWeb && isDesktop;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const shellMaxWidth = isDesktopWeb ? 1120 : isTablet ? 840 : width;

  const useWebTwoColumnResults = isWeb && shellMaxWidth >= 900;

  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  const { data: allProfilesRaw, isLoading } = useQuery<Profile[] | { profiles?: Profile[] }>({
    queryKey: profileKeys.lists(),
    queryFn: () => api.profiles.list(),
  });

  const { data: eventsData } = useQuery({
    queryKey: eventKeys.list({ city: onboardingState.city ?? undefined, country: onboardingState.country ?? undefined, pageSize: 50 }),
    queryFn: () => api.events.list({ city: onboardingState.city ?? undefined, country: onboardingState.country ?? undefined, pageSize: 50 }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const allEvents = useMemo<EventData[]>(
    () => (eventsData && 'events' in eventsData ? eventsData.events : []),
    [eventsData],
  );

  const allProfiles = useMemo<Profile[]>(
    () => (Array.isArray(allProfilesRaw)
      ? allProfilesRaw
      : (allProfilesRaw?.profiles ?? [])),
    [allProfilesRaw],
  );

  const { data: councilListData } = useQuery({
    queryKey: councilKeys.list({ pageSize: 2000, sortBy: 'name', sortDir: 'asc' }),
    queryFn: () => api.council.list({ pageSize: 2000, sortBy: 'name', sortDir: 'asc' }),
  });

  // Merge council source-of-truth entries into directory profiles.
  const nonCommunityProfiles = useMemo(() => {
    const base = allProfiles.filter(
      p => p.entityType !== 'community' && (p.category ?? '').toLowerCase() !== 'council'
    );
    const councils = (councilListData?.councils ?? []).map((council: CouncilData) => ({
      id: council.id,
      name: council.name,
      description: council.description ?? `${council.suburb}, ${council.state}`,
      entityType: 'organizer',
      category: 'Council',
      city: council.suburb || '',
      country: council.country || 'Australia',
      ownerId: 'system-council',
      isVerified: council.verificationStatus === 'verified',
      followersCount: 0,
      tags: [council.state, 'Council'].filter(Boolean),
      website: council.websiteUrl,
      phone: council.phone,
      address: council.addressLine1,
      culturePassId: council.id.toUpperCase(),
    })) as unknown as Profile[];
    return [...base, ...councils];
  }, [allProfiles, councilListData?.councils]);

  type DirectoryItem =
    | { _type: 'profile'; data: Profile }
    | { _type: 'event'; data: EventData };

  const allItems = useMemo<DirectoryItem[]>(() => {
    const profileItems: DirectoryItem[] = nonCommunityProfiles.map((p) => ({ _type: 'profile', data: p }));
    const eventItems: DirectoryItem[] = allEvents.map((e) => ({ _type: 'event', data: e }));
    return [...eventItems, ...profileItems];
  }, [nonCommunityProfiles, allEvents]);

  const filtered = useMemo<DirectoryItem[]>(() => {
    let results = allItems;

    if (selectedType !== 'All') {
      if (selectedType === 'event') {
        results = results.filter((item) => item._type === 'event');
      } else if (selectedType === 'indigenous') {
        results = results.filter((item) => item._type === 'profile' && isIndigenousProfile(item.data));
      } else {
        results = results.filter((item) => item._type === 'profile' && getDirectoryListingType(item.data) === selectedType);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((item) => {
        if (item._type === 'event') {
          const e = item.data;
          return (
            e.title.toLowerCase().includes(q) ||
            (e.description ?? '').toLowerCase().includes(q) ||
            (e.city ?? '').toLowerCase().includes(q) ||
            (e.category ?? '').toLowerCase().includes(q)
          );
        }
        const p = item.data;
        const tags = getTags(p);
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q) ||
          tags.some(t => t.toLowerCase().includes(q))
        );
      });
    }

    return results;
  }, [selectedType, search, allItems]);

  const featuredProfiles = useMemo(
    () => nonCommunityProfiles.filter(p => p.isVerified).slice(0, 8),
    [nonCommunityProfiles],
  );

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allItems.length, event: allEvents.length };
    counts.indigenous = nonCommunityProfiles.filter((p) => isIndigenousProfile(p)).length;
    for (const p of nonCommunityProfiles) {
      const listingType = getDirectoryListingType(p);
      counts[listingType] = (counts[listingType] ?? 0) + 1;
    }
    return counts;
  }, [allItems, allEvents, nonCommunityProfiles]);

  const handleSaveEvent = useCallback((id: string) => {
    setSavedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    setTimeout(() => {
      if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleFilterSelect = useCallback((id: string) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(id);
  }, []);

  const filterItems = useMemo<FilterItem[]>(() => {
    return ENTITY_FILTERS.map(filter => ({
      id: filter.label,
      label: filter.display,
      icon: filter.icon,
      color: filter.color,
      count: typeCounts[filter.label],
    }));
  }, [typeCounts]);

  const hasActiveFilters = selectedType !== 'All' || search.trim().length > 0;

  return (
    <ErrorBoundary>
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={dirStyles.ambientMesh}
          pointerEvents="none"
        />

        {/* ── Header (liquid glass) ── */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(320).springify()}
          style={{ zIndex: 10 }}
        >
          <LiquidGlassPanel
            borderRadius={0}
            bordered={false}
            style={{
              borderBottomWidth: StyleSheet.hairlineWidth * 2,
              borderBottomColor: colors.borderLight,
            }}
            contentStyle={[dirStyles.headerGlassInner, { paddingHorizontal: hPad, maxWidth: shellMaxWidth, alignSelf: 'center', width: '100%' }]}
          >
            <View style={dirStyles.headerTitleBlock}>
              <Text style={[dirStyles.headerTitle, { color: colors.text }]} maxFontSizeMultiplier={1.5}>
                Directory
              </Text>
              <View style={dirStyles.headerMetaRow}>
                <Ionicons name="location" size={10} color={CultureTokens.indigo} />
                <Text style={[dirStyles.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {onboardingState.city
                    ? `${onboardingState.city}${onboardingState.country ? `, ${onboardingState.country}` : ''}`
                    : onboardingState.country || 'your region'}
                  {!isLoading && filtered.length > 0
                    ? ` · ${filtered.length.toLocaleString()} shown`
                    : ''}
                </Text>
              </View>
            </View>

            <View
              style={[
                dirStyles.searchBar,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: searchFocused ? CultureTokens.indigo : colors.borderLight,
                },
              ]}
            >
              <Ionicons name="search" size={15} color={searchFocused ? CultureTokens.indigo : colors.textTertiary} />
              <TextInput
                style={[dirStyles.searchInput, { color: colors.text }]}
                placeholder="Search…"
                placeholderTextColor={colors.textTertiary}
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                returnKeyType="search"
                accessibilityLabel="Search directory"
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={14} accessibilityRole="button" accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={15} color={colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={handleRefresh}
              style={[dirStyles.iconBtn, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
              accessibilityRole="button"
              accessibilityLabel="Refresh directory"
            >
              {refreshing
                ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
                : <Ionicons name="refresh" size={18} color={colors.text} />}
            </Pressable>
          </LiquidGlassPanel>
        </Animated.View>

        {/* ── Filter rail (glass) ── */}
        <LiquidGlassPanel
          borderRadius={LiquidGlassTokens.corner.mainCard}
          style={{ marginHorizontal: hPad, marginTop: 10, marginBottom: 8, maxWidth: shellMaxWidth, alignSelf: 'center', width: '100%' }}
          contentStyle={dirStyles.filterGlassInner}
        >
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
            accessibilityRole="tablist"
            accessibilityLabel="Entity type filters"
          >
            {filterItems.map(filter => (
              <AnimatedFilterChip
                key={filter.id}
                label={typeof filter.label === 'string' ? filter.label : filter.id}
                active={selectedType === filter.id}
                onPress={() => handleFilterSelect(filter.id)}
                icon={typeof filter.icon === 'string' ? filter.icon : undefined}
              />
            ))}
            {hasActiveFilters && (
              <>
                <FilterDivider colors={colors} />
                <Pressable
                  onPress={() => { setSelectedType('All'); setSearch(''); }}
                  style={[s.clearBtn, { borderColor: colors.borderLight }]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all filters"
                >
                  <Ionicons name="close" size={12} color={colors.textTertiary} />
                  <Text style={[s.clearBtnText, { color: colors.textTertiary }]}>Clear</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </LiquidGlassPanel>

        {/* ── Content ── */}
        {isLoading ? (
          <View style={[s.list, { paddingHorizontal: hPad, paddingBottom: isWeb ? 40 : 100 }]}>
            <View style={{ flexDirection: useWebTwoColumnResults ? 'row' : 'column', flexWrap: 'wrap' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={useWebTwoColumnResults ? [s.resultsGridItemWeb, { width: '50%', paddingRight: i % 2 === 0 ? 14 : 0 }] : { marginBottom: 14 }}>
                  <EventCardSkeleton />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, width: '100%', maxWidth: shellMaxWidth, alignSelf: 'center' }}>
            <FlashList<any>
              data={filtered}
              keyExtractor={(item) => (item._type === 'event' ? `event-${item.data.id}` : `profile-${item.data.id}`)}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={
                    reducedMotion || Platform.OS === 'web'
                      ? undefined
                      : FadeInDown.delay(Math.min(index * 40, 400)).springify().damping(18)
                  }
                  style={useWebTwoColumnResults ? [s.resultsGridItemWeb, { paddingRight: index % 2 === 0 ? 14 : 0 }] : undefined}
                >
                  {item._type === 'event' ? (
                    <DirectoryEventCard event={item.data} isSaved={savedEventIds.has(item.data.id)} onSave={handleSaveEvent} colors={colors} />
                  ) : (
                    <DirectoryCard profile={item.data} colors={colors} />
                  )}
                </Animated.View>
              )}
              ListHeaderComponent={
                featuredProfiles.length > 0 ? (
                  <FeaturedRail profiles={featuredProfiles} colors={colors} />
                ) : null
              }
              ListEmptyComponent={
                <DirectoryEmptyState
                  selectedType={selectedType}
                  city={onboardingState.city}
                  hasActiveFilters={hasActiveFilters}
                  colors={colors}
                  onReset={() => { setSelectedType('All'); setSearch(''); }}
                />
              }
              ListFooterComponent={
                showAcknowledgement && !isLoading && filtered.length > 0 ? (
                  <View style={s.acknowledgementWrap}>
                    <Ionicons name="leaf-outline" size={20} color={CultureTokens.gold} />
                    <Text style={[s.acknowledgementText, { color: colors.textSecondary }]}>
                      {acknowledgement}
                    </Text>
                  </View>
                ) : null
              }
              {...({ estimatedItemSize: 100 } as any)}
              numColumns={useWebTwoColumnResults ? 2 : 1}
              contentContainerStyle={[s.list, { paddingHorizontal: hPad, paddingBottom: isWeb ? 40 : 100 }]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={CultureTokens.indigo}
                  colors={[CultureTokens.indigo]}
                />
              }
            />
          </View>
        )}
      </View>
    </ErrorBoundary>
  );
}

const dirStyles = StyleSheet.create({
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  headerGlassInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  headerTitleBlock: { flex: 1, minWidth: 0 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: {
    fontSize: FontSize.title2,
    fontFamily: FontFamily.bold,
    lineHeight: LineHeight.title2,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: FontSize.chip,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.chip,
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
  searchInput: {
    flex: 1,
    fontSize: FontSize.chip,
    fontFamily: FontFamily.regular,
    height: 36,
    padding: 0,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  filterGlassInner: { paddingVertical: 10, paddingHorizontal: 8 },
});


import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CultureTokens, EntityTypeColors, shadows, gradients } from '@/constants/theme';
import { useState, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { profileKeys, eventKeys, councilKeys } from '@/hooks/queries/keys';
import { queryClient } from '@/lib/query-client';
import type { Profile, EventData } from '@/shared/schema';
import { api, type CouncilData } from '@/lib/api';
import { FilterChipRow, FilterItem } from '@/components/FilterChip';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { isIndigenousProfile } from '@/lib/indigenous';
import { formatEventDateTimeBadge, formatPrice } from '@/lib/dateUtils';
import { useOnboarding } from '@/contexts/OnboardingContext';

const isWeb = Platform.OS === 'web';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  business:     'storefront',
  venue:        'location',
  organisation: 'business',
  council:      'shield-checkmark',
  government:   'flag',
  charity:      'heart',
};

const ENTITY_FILTERS = [
  { label: 'All',          icon: 'grid',             color: CultureTokens.indigo,          display: 'All' },
  { label: 'event',        icon: 'calendar',          color: CultureTokens.saffron,          display: 'Events' },
  { label: 'indigenous',   icon: 'leaf',              color: CultureTokens.gold,             display: '🪃 Indigenous' },
  { label: 'business',     icon: 'storefront',        color: EntityTypeColors.business,      display: 'Businesses' },
  { label: 'venue',        icon: 'location',          color: EntityTypeColors.venue,         display: 'Venues' },
  { label: 'organisation', icon: 'business',          color: EntityTypeColors.organisation,  display: 'Organisations' },
  { label: 'council',      icon: 'shield-checkmark',  color: EntityTypeColors.council,       display: 'Councils' },
  { label: 'government',   icon: 'flag',              color: EntityTypeColors.government,    display: 'Government' },
  { label: 'charity',      icon: 'heart',             color: EntityTypeColors.charity,       display: 'Charities' },
] as const;

function getOptionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
}

function getTags(profile: Profile): string[] {
  return Array.isArray(profile.tags) ? (profile.tags as string[]) : [];
}

function getDirectoryListingType(profile: Profile): string {
  const category = (profile.category ?? '').toLowerCase();
  if (category === 'council') return 'council';
  return profile.entityType;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonBlock({ width, height, radius = 8, colors }: { width: number | `${number}%`; height: number; radius?: number; colors: ReturnType<typeof useColors> }) {
  return <View style={{ width, height, borderRadius: radius, backgroundColor: colors.borderLight, marginBottom: 4 }} />;
}

function DirectoryCardSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: colors.borderLight }]}>
      <View style={{ flexDirection: 'row', padding: 14, gap: 12, alignItems: 'center' }}>
        <View style={{ width: 70, height: 70, borderRadius: 14, backgroundColor: colors.borderLight }} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBlock width="70%" height={14} colors={colors} />
          <SkeletonBlock width="45%" height={11} colors={colors} />
          <SkeletonBlock width="55%" height={11} colors={colors} />
        </View>
      </View>
    </View>
  );
}

// ─── Event Card for Directory ──────────────────────────────────────────────────

function DirectoryEventCard({ event, isSaved, onSave, colors }: {
  event: EventData;
  isSaved: boolean;
  onSave: (id: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const heartScale = useSharedValue(1);
  const animatedHeart = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const handleSave = () => {
    heartScale.value = withSpring(1.4, { damping: 8 });
    setTimeout(() => { heartScale.value = withSpring(1, { damping: 10 }); }, 200);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave(event.id);
  };

  const dateLabel = formatEventDateTimeBadge(event.date, event.time, event.country);
  const priceLabel = event.isFree ? 'Free' : event.priceCents ? formatPrice(event.priceCents, event.country) : null;
  const categoryColor = CultureTokens.saffron;

  // Split date for the left date block
  const dateParts = dateLabel ? dateLabel.split(' ') : [];
  const dayNum = dateParts[0] ?? '';
  const monthStr = dateParts[1] ?? '';

  return (
    <View style={{ marginBottom: 12, position: 'relative' }}>
      <Pressable
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        style={({ pressed }) => [
          s.directoryCard,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
          pressed && { opacity: 0.93 },
        ]}
        accessibilityRole="link"
        accessibilityLabel={`View event: ${event.title}`}
      >
        {/* Horizontal layout: date block left + content right */}
        <View style={s.eventCardInner}>
          {/* Date block */}
          <LinearGradient
            colors={[categoryColor + 'EE', categoryColor + 'AA']}
            style={s.eventDateBlock}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={s.eventDateDay}>{dayNum}</Text>
            <Text style={s.eventDateMonth}>{monthStr.toUpperCase().slice(0, 3)}</Text>
          </LinearGradient>

          {/* Content */}
          <View style={s.eventCardContent}>
            <Text style={[s.eventCardTitle, { color: colors.text }]} numberOfLines={2}>
              {event.title}
            </Text>
            {event.city ? (
              <View style={s.eventLocationRow}>
                <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                <Text style={[s.eventLocationText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {event.city}
                </Text>
              </View>
            ) : null}
            <View style={s.eventCardFooter}>
              {priceLabel ? (
                <View style={[s.eventPriceBadge, { backgroundColor: categoryColor + '20' }]}>
                  <Text style={[s.eventPriceText, { color: categoryColor }]}>{priceLabel}</Text>
                </View>
              ) : null}
              <Text style={[s.viewLink, { color: categoryColor }]}>View Event →</Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Save button */}
      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [
          s.saveBtn,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Unsave event' : 'Save event'}
        hitSlop={15}
      >
        <Animated.View style={animatedHeart}>
          <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={18} color={isSaved ? CultureTokens.coral : colors.textTertiary} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─── DirectoryCard ────────────────────────────────────────────────────────────

function DirectoryCard({ profile, colors }: { profile: Profile; colors: ReturnType<typeof useColors> }) {
  const color = (EntityTypeColors as Record<string, string>)[profile.entityType] ?? CultureTokens.indigo;
  const icon = TYPE_ICONS[profile.entityType] ?? 'business';
  const tags = getTags(profile);
  const profileRecord = profile as unknown as Record<string, unknown>;
  const address = getOptionalString(profileRecord, 'address');
  const isCouncil = (profile.category ?? '').toLowerCase() === 'council';

  const handlePress = () => {
    router.push({ pathname: '/profile/[id]', params: { id: profile.id } });
  };

  // Stars renderer
  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= Math.round(rating) ? 'star' : 'star-outline'}
        size={11}
        color={CultureTokens.gold}
      />
    ));
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.directoryCard,
        { backgroundColor: colors.surface, borderColor: isCouncil ? CultureTokens.indigo + '40' : colors.borderLight },
        isCouncil && { borderWidth: 1.5 },
        pressed && { opacity: 0.92 },
      ]}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      accessibilityLabel={`View ${profile.name} profile`}
    >
      {isCouncil && (
        <LinearGradient
          colors={[CultureTokens.indigo + '0A', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      <View style={s.profileCardInner}>
        {/* Avatar / Icon */}
        {profile.imageUrl ? (
          <Image
            source={{ uri: profile.imageUrl }}
            style={s.profileAvatar}
            contentFit="cover"
            accessibilityLabel={`${profile.name} logo`}
          />
        ) : (
          <View style={[s.profileIconBox, { backgroundColor: color + '18' }]}>
            <Ionicons name={isCouncil ? 'shield-checkmark' : (icon as never)} size={26} color={color} />
          </View>
        )}

        {/* Content */}
        <View style={s.profileCardContent}>
          {/* Name row */}
          <View style={s.profileNameRow}>
            <Text style={[s.profileName, { color: colors.text }]} numberOfLines={1}>
              {profile.name}
            </Text>
            {profile.isVerified && (
              <Ionicons name="checkmark-circle" size={15} color={CultureTokens.indigo} />
            )}
          </View>

          {/* Category badge */}
          <View style={[s.categoryBadge, { backgroundColor: color + '18' }]}>
            <Text style={[s.categoryBadgeText, { color }]} numberOfLines={1}>
              {profile.category ?? profile.entityType}
            </Text>
          </View>

          {/* Address / city */}
          {(address || profile.city) ? (
            <View style={s.profileLocationRow}>
              <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
              <Text style={[s.profileLocationText, { color: colors.textTertiary }]} numberOfLines={1}>
                {address ?? `${profile.city}${profile.country ? `, ${profile.country}` : ''}`}
              </Text>
            </View>
          ) : null}

          {/* Rating + tags row */}
          <View style={s.profileMetaRow}>
            {profile.rating != null ? (
              <View style={s.starsRow}>
                {renderStars(profile.rating)}
                {(profile.reviewsCount ?? 0) > 0 ? (
                  <Text style={[s.reviewCountText, { color: colors.textTertiary }]}>
                    ({profile.reviewsCount})
                  </Text>
                ) : null}
              </View>
            ) : tags.length > 0 ? (
              <View style={s.tagsRow}>
                {tags.slice(0, 2).map(tag => (
                  <View key={tag} style={[s.tagPill, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[s.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                  </View>
                ))}
                {tags.length > 2 ? (
                  <Text style={[s.moreTagsText, { color: color }]}>+{tags.length - 2}</Text>
                ) : null}
              </View>
            ) : null}

            <Text style={[s.viewLink, { color }]}>View →</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function DirectoryEmptyState({
  selectedType,
  city,
  hasActiveFilters,
  colors,
  onReset,
}: {
  selectedType: string;
  city: string | null | undefined;
  hasActiveFilters: boolean;
  colors: ReturnType<typeof useColors>;
  onReset: () => void;
}) {
  const filter = ENTITY_FILTERS.find(f => f.label === selectedType);
  const entityLabel = filter?.display ?? 'listings';
  const icon = filter?.icon ?? 'storefront-outline';
  const cityLabel = city ? ` in ${city}` : '';

  return (
    <View style={s.emptyState}>
      <View style={[s.emptyIconBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Ionicons name={icon as never} size={40} color={colors.textTertiary} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.text }]}>
        No {entityLabel.replace('🪃 ', '')} found{cityLabel}
      </Text>
      <Text style={[s.emptySubtext, { color: colors.textSecondary }]}>
        {hasActiveFilters
          ? 'Try a different filter or search term'
          : 'Check back soon — new listings are added regularly'}
      </Text>
      {hasActiveFilters && (
        <View style={{ marginTop: 12 }}>
          <Button variant="secondary" size="md" onPress={onReset}>
            Reset Filters
          </Button>
        </View>
      )}
    </View>
  );
}

// ─── DirectoryScreen ──────────────────────────────────────────────────────────

export default function DirectoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { width, isDesktop, isTablet, hPad } = useLayout();
  const { state: onboardingState } = useOnboarding();

  const isDesktopWeb = isWeb && isDesktop;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const shellMaxWidth = isDesktopWeb ? 1120 : isTablet ? 840 : width;

  const shellStyle = isWeb || isTablet
    ? { maxWidth: shellMaxWidth, width: '100%' as const, alignSelf: 'center' as const }
    : undefined;
  const useWebTwoColumnResults = isWeb && shellMaxWidth >= 900;

  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  const { data: allProfilesRaw, isLoading } = useQuery<Profile[] | { profiles?: Profile[] }>({
    queryKey: profileKeys.lists(),
    queryFn: () => api.profiles.list(),
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
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

  const directoryStats = useMemo(
    () => [
      { id: 'listings', label: 'Listings', value: typeCounts.All ?? 0, icon: 'grid-outline', color: CultureTokens.indigo },
      { id: 'events', label: 'Events', value: typeCounts.event ?? 0, icon: 'calendar-outline', color: CultureTokens.saffron },
      { id: 'verified', label: 'Verified', value: nonCommunityProfiles.filter((p) => p.isVerified).length, icon: 'checkmark-circle-outline', color: CultureTokens.teal },
    ],
    [typeCounts, nonCommunityProfiles]
  );

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

  const resultContext = useMemo(() => {
    const filters: string[] = [];
    if (selectedType !== 'All') {
      const selectedFilter = ENTITY_FILTERS.find((filter) => filter.label === selectedType);
      filters.push(selectedFilter?.display ?? selectedType);
    }
    if (search.trim()) filters.push(`"${search.trim()}"`);
    return filters.length > 0 ? `Filtered by ${filters.join(' • ')}` : 'Showing all listings';
  }, [selectedType, search]);

  return (
    <ErrorBoundary>
      <View style={[s.container, { backgroundColor: colors.background }]}>

        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: topInset + 16, backgroundColor: colors.background }]}>
          <View style={shellStyle}>
            <View style={[s.headerTopRow, { paddingHorizontal: hPad }]}>
              {/* Title block */}
              <View style={s.headerTitleWrap}>
                <Text style={[s.title, { color: colors.text }]}>Directory</Text>
                <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                  Find businesses, venues & organisations
                </Text>
              </View>
            </View>

            {/* Search bar */}
            <View style={[s.searchRow, { paddingHorizontal: hPad, paddingTop: 14 }]}>
              <View style={[
                s.searchContainer,
                { backgroundColor: colors.surface, borderColor: searchFocused ? CultureTokens.indigo : colors.borderLight },
              ]}>
                <Ionicons name="search" size={20} color={searchFocused ? CultureTokens.indigo : colors.textTertiary} />
                <TextInput
                  style={[s.searchInput, { color: colors.text }]}
                  placeholder="Search businesses, venues, events…"
                  placeholderTextColor={colors.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  returnKeyType="search"
                />
                {search.length > 0 ? (
                  <Pressable onPress={() => setSearch('')} hitSlop={14} accessibilityRole="button" accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                  </Pressable>
                ) : (
                  <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
                )}
              </View>
            </View>

            {/* Stats bar */}
            <View style={[s.statsBar, { paddingHorizontal: hPad, paddingTop: 12, paddingBottom: 8 }]}>
              <Text style={[s.statsText, { color: colors.textSecondary }]}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}{onboardingState.city ? ` in ${onboardingState.city}` : ''}
              </Text>
              <View style={s.statsRight}>
                {directoryStats.map((stat, i) => (
                  <View key={stat.id} style={s.statPill}>
                    {i > 0 ? <View style={[s.statDivider, { backgroundColor: colors.borderLight }]} /> : null}
                    <Text style={[s.statValue, { color: colors.text }]}>{formatNumber(stat.value)}</Text>
                    <Text style={[s.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Filter chips */}
            <View style={s.chipsSection}>
              <FilterChipRow items={filterItems} selectedId={selectedType} onSelect={handleFilterSelect} />
            </View>

            {/* Filter meta row */}
            {hasActiveFilters && (
              <View style={[s.filterMetaRow, { paddingHorizontal: hPad, marginBottom: 4 }]}>
                <Text style={[s.filterMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {resultContext}
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  pill
                  onPress={() => { setSelectedType('All'); setSearch(''); }}
                  disabled={!hasActiveFilters}
                >
                  Clear
                </Button>
              </View>
            )}
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={[s.divider, { backgroundColor: colors.borderLight }]} />

        {/* ── Content ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.list, { paddingHorizontal: hPad, paddingBottom: isWeb ? 40 : 100 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={CultureTokens.indigo}
              colors={[CultureTokens.indigo]}
            />
          }
        >
          <View style={shellStyle}>
            {(isLoading || eventsLoading) ? (
              <View style={useWebTwoColumnResults ? s.resultsGridWeb : undefined}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Animated.View
                    key={i}
                    entering={Platform.OS !== 'web' ? FadeInDown.delay(i * 60).springify().damping(18) : undefined}
                    style={useWebTwoColumnResults ? s.resultsGridItemWeb : undefined}
                  >
                    <DirectoryCardSkeleton colors={colors} />
                  </Animated.View>
                ))}
              </View>
            ) : filtered.length === 0 ? (
              <DirectoryEmptyState
                selectedType={selectedType}
                city={onboardingState.city}
                hasActiveFilters={hasActiveFilters}
                colors={colors}
                onReset={() => { setSelectedType('All'); setSearch(''); }}
              />
            ) : useWebTwoColumnResults ? (
              <View style={s.resultsGridWeb}>
                {filtered.map((item, i) => (
                  <Animated.View
                    key={item._type === 'event' ? item.data.id : item.data.id}
                    entering={Platform.OS !== 'web' ? FadeInDown.delay(i * 40).springify().damping(18) : undefined}
                    style={s.resultsGridItemWeb}
                  >
                    {item._type === 'event' ? (
                      <DirectoryEventCard event={item.data} isSaved={savedEventIds.has(item.data.id)} onSave={handleSaveEvent} colors={colors} />
                    ) : (
                      <DirectoryCard profile={item.data} colors={colors} />
                    )}
                  </Animated.View>
                ))}
              </View>
            ) : (
              filtered.map((item, i) => (
                <Animated.View
                  key={item._type === 'event' ? item.data.id : item.data.id}
                  entering={Platform.OS !== 'web' ? FadeInDown.delay(i * 40).springify().damping(18) : undefined}
                >
                  {item._type === 'event' ? (
                    <DirectoryEventCard event={item.data} isSaved={savedEventIds.has(item.data.id)} onSave={handleSaveEvent} colors={colors} />
                  ) : (
                    <DirectoryCard profile={item.data} colors={colors} />
                  )}
                </Animated.View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingBottom: 0,
    ...shadows.small,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  headerTitleWrap: { flex: 1 },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },

  // Search
  searchRow: {},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    padding: 0,
    minWidth: 0,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statsText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  statDivider: {
    width: 1,
    height: 12,
    marginRight: 8,
  },
  statValue: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },

  // Filter chips
  chipsSection: {
    paddingTop: 8,
    paddingBottom: 6,
  },

  // Filter meta
  filterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 8,
  },
  filterMetaText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
  },

  // List
  list: { paddingTop: 14 },

  // Results grid (web 2-col)
  resultsGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultsGridItemWeb: {
    width: '48.8%',
  },

  // ── Directory card (shared base) ──
  directoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadows.small,
  },

  // ── Event card ──
  eventCardInner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 88,
  },
  eventDateBlock: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  eventDateDay: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    lineHeight: 24,
  },
  eventDateMonth: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  eventCardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    justifyContent: 'center',
  },
  eventCardTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 20,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocationText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  eventPriceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  eventPriceText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  saveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    zIndex: 10,
  },

  // ── Profile card ──
  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
  profileIconBox: {
    width: 70,
    height: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardContent: {
    flex: 1,
    gap: 4,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  profileName: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    flexShrink: 1,
    lineHeight: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'capitalize',
  },
  profileLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileLocationText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewCountText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    marginLeft: 3,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    flexWrap: 'nowrap',
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
  },
  moreTagsText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  viewLink: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    marginLeft: 'auto',
  },

  // ── Empty state ──
  emptyState: { alignItems: 'center', paddingVertical: 72, gap: 12 },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

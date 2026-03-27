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
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle, withSpring,
  interpolateColor, withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CultureTokens, EntityTypeColors, shadows } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { profileKeys, eventKeys, councilKeys } from '@/hooks/queries/keys';
import { queryClient } from '@/lib/query-client';
import type { Profile, EventData } from '@/shared/schema';
import { api, type CouncilData } from '@/lib/api';
import type { FilterItem } from '@/components/FilterChip';
import { Button } from '@/components/ui/Button';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
// import { Typography } from '@/constants/typography'; // REMOVED: Typography consolidated into theme import above
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { isIndigenousProfile } from '@/lib/indigenous';
import { formatPrice } from '@/lib/dateUtils';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { useLocations } from '@/hooks/useLocations';

const isWeb = Platform.OS === 'web';

// ─── Inline animated FilterChip ───────────────────────────────────────────────

function FilterChip({
  label, active, onPress, icon,
}: {
  label: string; active: boolean; onPress: () => void; icon?: string;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const bg = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      bg.value, [0, 1],
      active
        ? [CultureTokens.indigo, CultureTokens.indigo + 'CC']
        : [colors.surface, colors.surfaceElevated],
    ),
  }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.92); bg.value = withTiming(1, { duration: 100 }); }}
      onPressOut={() => { scale.value = withSpring(1);   bg.value = withTiming(0, { duration: 100 }); }}
      onPress={() => { if (!isWeb) Haptics.selectionAsync(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[dirfc.chip, { borderColor: active ? CultureTokens.indigo : colors.borderLight }, animStyle]}>
        {icon ? <Ionicons name={icon as never} size={13} color={active ? '#fff' : colors.textTertiary} /> : null}
        <Text style={[dirfc.text, { color: active ? '#fff' : colors.textSecondary }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const dirfc = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  text: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', lineHeight: 17 },
});

function FilterDivider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={{ width: 1, height: 18, backgroundColor: colors.borderLight, marginHorizontal: 4, alignSelf: 'center' }} />;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  business:     'storefront',
  venue:        'location',
  organisation: 'business',
  council:      'shield-checkmark',
  government:   'flag',
  charity:      'heart',
  artist:       'brush',
  brand:        'ribbon',
};

const ENTITY_FILTERS = [
  { label: 'All',          icon: 'grid',             color: CultureTokens.indigo,          display: 'All' },
  { label: 'event',        icon: 'calendar',          color: CultureTokens.gold,            display: 'Events' },
  { label: 'indigenous',   icon: 'leaf',              color: CultureTokens.teal,            display: '🪃 Indigenous' },
  { label: 'business',     icon: 'storefront',        color: EntityTypeColors.business,      display: 'Businesses' },
  { label: 'venue',        icon: 'location',          color: EntityTypeColors.venue,         display: 'Venues' },
  { label: 'organisation', icon: 'business',          color: EntityTypeColors.organisation,  display: 'Organisations' },
  { label: 'council',      icon: 'shield-checkmark',  color: EntityTypeColors.council,       display: 'Councils' },
  { label: 'government',   icon: 'flag',              color: EntityTypeColors.government,    display: 'Government' },
  { label: 'charity',      icon: 'heart',             color: EntityTypeColors.charity,       display: 'Charities' },
  { label: 'artist',       icon: 'mic',               color: CultureTokens.coral,           display: 'Artists' },
  { label: 'creator',      icon: 'sparkles',          color: CultureTokens.gold,            display: 'Creators' },
] as const;

function getOptionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTags(profile: Profile): string[] {
  return Array.isArray(profile.tags) ? (profile.tags as string[]) : [];
}

function getDirectoryListingType(profile: Profile): string {
  const category = (profile.category ?? '').toLowerCase();
  if (category === 'council') return 'council';
  return profile.entityType;
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

  const priceLabel = event.isFree ? 'Free' : event.priceCents ? formatPrice(event.priceCents, event.country) : null;
  const categoryColor = CultureTokens.gold;
  const priceAccent = priceLabel === 'Free' ? CultureTokens.teal : categoryColor;

  // Robust day/month extraction
  let dayNum = '', monthStr = '';
  const dateObj = new Date(event.date);
  if (!isNaN(dateObj.getTime())) {
    dayNum = dateObj.toLocaleString(undefined, { day: 'numeric' });
    monthStr = dateObj.toLocaleString(undefined, { month: 'short' });
  }

  return (
    <View style={{ marginBottom: 12, position: 'relative' }}>
      <Pressable
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        style={({ pressed }) => [
          s.directoryCard,
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.borderLight,
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
              android: { elevation: 2 },
              web: { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' } as any,
            }),
          },
          pressed && { opacity: 0.93 },
        ]}
        accessibilityRole="link"
        accessibilityLabel={`View event: ${event.title}`}
      >
        {/* Horizontal layout: date block left + content right */}
        <View style={s.eventCardInner}>
          {/* Date block */}
          <BlurView intensity={Platform.OS === 'ios' ? 30 : 60} tint="dark" style={[s.eventDateBlock, { backgroundColor: categoryColor + 'AA' }]}>
            <Text style={s.eventDateDay}>{dayNum}</Text>
            <Text style={s.eventDateMonth}>{monthStr.toUpperCase().slice(0, 3)}</Text>
          </BlurView>

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
                <View style={[s.eventPriceBadge, { backgroundColor: priceAccent + '20' }]}>
                  <Text style={[s.eventPriceText, { color: priceAccent }]}>{priceLabel}</Text>
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

  const isProfessional = ['artist', 'creator', 'brand'].includes(profile.entityType);
  const accent = isProfessional ? CultureTokens.gold : color;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.directoryCard,
        { 
          backgroundColor: colors.surface, 
          borderColor: isProfessional ? CultureTokens.gold + '60' : isCouncil ? CultureTokens.indigo + '60' : colors.borderLight,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
            android: { elevation: 4 },
            web: { boxShadow: isProfessional ? '0 8px 24px rgba(255,200,87,0.12)' : '0 8px 20px rgba(0,0,0,0.08)' } as any,
          }),
        },
        (isCouncil || isProfessional) && { borderWidth: 1.5 },
        pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
      ]}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      accessibilityLabel={`View ${profile.name} profile`}
    >
      {(isCouncil || isProfessional) && (
        <LinearGradient
          colors={isProfessional ? [`${CultureTokens.gold}08`, 'transparent'] : [CultureTokens.indigo + '0A', 'transparent']}
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
            {(profile.isVerified || isProfessional) && (
              <Ionicons name="shield-checkmark" size={15} color={isProfessional ? CultureTokens.gold : CultureTokens.indigo} />
            )}
          </View>

          {/* Category badge */}
          <View style={[s.categoryBadge, { backgroundColor: accent + '18' }]}>
            <Text style={[s.categoryBadgeText, { color: accent }]} numberOfLines={1}>
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
  const isDark = useIsDark();
  const { width, isDesktop, isTablet, hPad } = useLayout();
  const { state: onboardingState } = useOnboarding();
  const { acknowledgement } = useLocations();
  
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
      <View style={[s.container, { backgroundColor: colors.background }]}>

        {/* ── Header ── */}
        <Animated.View
          entering={FadeInUp.duration(320).springify()}
          style={[s.header, { paddingTop: topInset, paddingHorizontal: hPad, borderBottomColor: colors.divider, backgroundColor: colors.background }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.text }]}>Directory</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location" size={10} color={CultureTokens.indigo} />
              <Text style={[s.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {onboardingState.city
                  ? `${onboardingState.city}${onboardingState.country ? `, ${onboardingState.country}` : ''}`
                  : onboardingState.country || 'your region'}
                {!isLoading && filtered.length > 0
                  ? ` · ${filtered.length.toLocaleString()} shown`
                  : ''}
              </Text>
            </View>
          </View>

          {/* Search input */}
          <View style={[
            s.searchContainer,
            { backgroundColor: colors.surface, borderColor: searchFocused ? CultureTokens.indigo : colors.borderLight },
          ]}>
            <Ionicons name="search" size={15} color={searchFocused ? CultureTokens.indigo : colors.textTertiary} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              placeholder="Search…"
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} hitSlop={14} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={15} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          {/* Refresh button */}
          <Pressable
            onPress={handleRefresh}
            style={[s.iconBtn, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh directory"
          >
            {refreshing
              ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
              : <Ionicons name="refresh" size={18} color={colors.text} />}
          </Pressable>
        </Animated.View>

        {/* ── Filter rows ── */}
        <View style={[s.filterBlock, { borderBottomColor: colors.divider }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.filterRow, { paddingHorizontal: hPad }]}
            accessibilityRole="tablist"
            accessibilityLabel="Entity type filters"
          >
            {filterItems.map(filter => (
              <FilterChip
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
        </View>

        {/* ── Divider ── */}
        <View style={[s.divider, { backgroundColor: colors.borderLight }]} />

        {/* ── Content ── */}
        {isLoading ? (
          <View style={[s.list, { paddingHorizontal: hPad, paddingBottom: isWeb ? 40 : 100 }]}>
            <View style={{ flexDirection: useWebTwoColumnResults ? 'row' : 'column', flexWrap: 'wrap', marginHorizontal: useWebTwoColumnResults ? -7 : 0 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={useWebTwoColumnResults ? s.resultsGridItemWeb : { marginBottom: 14 }}>
                  <EventCardSkeleton />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <FlashList<any>
            data={filtered}
          keyExtractor={(item) => (item._type === 'event' ? `event-${item.data.id}` : `profile-${item.data.id}`)}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={Platform.OS !== 'web' ? FadeInDown.delay(index * 40).springify().damping(18) : undefined}
              style={useWebTwoColumnResults ? s.resultsGridItemWeb : undefined}
            >
              {item._type === 'event' ? (
                <DirectoryEventCard event={item.data} isSaved={savedEventIds.has(item.data.id)} onSave={handleSaveEvent} colors={colors} />
              ) : (
                <DirectoryCard profile={item.data} colors={colors} />
              )}
            </Animated.View>
          )}
          ListHeaderComponent={null}
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
        )}
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 18,
  },

  // Search
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    height: 36,
    padding: 0,
    minWidth: 0,
  },

  // Filter block
  filterBlock: { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingBottom: 4 },
  filterRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  clearBtnText:{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', lineHeight: 17 },

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
    width: '49%',
  },

  // ── Directory card (shared base) ──
  directoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
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

  featuredContainer: { marginTop: 24, marginBottom: 8 },
  featuredHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  featuredHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featuredScroll: { gap: 12 },
  featuredCard: { width: 140, height: 180, borderRadius: 20, overflow: 'hidden', ...shadows.medium },
  featuredImage: { width: '100%', height: '100%' },
  featuredGradient: { ...StyleSheet.absoluteFillObject },
  featuredInfo: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  featuredName: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  featuredTitle: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.8)' },

  acknowledgementWrap: {
    padding: 24,
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(150,150,150,0.15)',
    gap: 12,
  },
  acknowledgementText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
  },
});

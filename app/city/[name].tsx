import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/constants/typography';
import { CultureTokens, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FilterChips from '@/components/ui/FilterChips';
import EventCard from '@/components/Discover/EventCard';
import { getStateForCity, GLOBAL_REGIONS } from '@/constants/locations';
import type { EventData, PaginatedEventsResponse, Profile } from '@/shared/schema';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { cityAmbient, StatPill, getCityDestinationStyles } from '@/components/city/CityDestinationStyles';

// ─── City hero images ─────────────────────────────────────────────────────────

const CITY_IMAGES: Record<string, string> = {
  sydney:    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=2000&q=90',
  melbourne: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=2000&q=90',
  brisbane:  'https://images.unsplash.com/photo-1549008880-927376046f4e?auto=format&fit=crop&w=2000&q=90',
  perth:     'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=2000&q=90',
  adelaide:  'https://images.unsplash.com/photo-1550747528-cdb869422707?auto=format&fit=crop&w=2000&q=90',
  uae:       'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=90',
  dubai:     'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=90',
  london:    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2000&q=90',
  toronto:   'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?auto=format&fit=crop&w=2000&q=90',
  auckland:  'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=2000&q=90',
};

const DEFAULT_CITY_IMAGE =
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2000&q=90';

// ─── Per-city metadata ────────────────────────────────────────────────────────

interface CityMeta {
  tagline: string;
  emoji: string;
  cultureCommunities: string[];
  languages: string[];
}

const CITY_META: Record<string, CityMeta> = {
  sydney: {
    tagline: 'Where 200+ cultures call home',
    emoji: '🌉',
    cultureCommunities: ['Indian', 'Chinese', 'Lebanese', 'Greek', 'Filipino', 'Vietnamese', 'Korean', 'Sri Lankan', 'Nepalese'],
    languages: ['Tamil', 'Mandarin', 'Hindi', 'Arabic', 'Cantonese', 'Filipino', 'Malayalam', 'Telugu', 'Sinhalese'],
  },
  melbourne: {
    tagline: 'Cultural capital of the Southern Hemisphere',
    emoji: '🎭',
    cultureCommunities: ['Italian', 'Greek', 'Vietnamese', 'Indian', 'Chinese', 'Lebanese', 'Sri Lankan'],
    languages: ['Greek', 'Mandarin', 'Hindi', 'Vietnamese', 'Italian', 'Arabic', 'Punjabi'],
  },
  brisbane: {
    tagline: 'Sunshine and culture year-round',
    emoji: '🌞',
    cultureCommunities: ['Chinese', 'Indian', 'Filipino', 'Vietnamese', 'Korean', 'South African'],
    languages: ['Mandarin', 'Hindi', 'Filipino', 'Vietnamese', 'Korean'],
  },
  perth: {
    tagline: 'Western gateway to the world',
    emoji: '🌊',
    cultureCommunities: ['Indian', 'Chinese', 'Filipino', 'South African', 'Sri Lankan', 'Malaysian'],
    languages: ['Mandarin', 'Hindi', 'Filipino', 'Tamil', 'Malay'],
  },
  adelaide: {
    tagline: 'Festival city with deep cultural roots',
    emoji: '🍷',
    cultureCommunities: ['Italian', 'Greek', 'Chinese', 'Vietnamese', 'Indian', 'Filipino'],
    languages: ['Mandarin', 'Greek', 'Italian', 'Hindi', 'Vietnamese', 'Filipino'],
  },
  london: {
    tagline: "The world's culture crossroads",
    emoji: '🎡',
    cultureCommunities: ['South Asian', 'Caribbean', 'West African', 'East African', 'Chinese', 'Bengali'],
    languages: ['Hindi', 'Punjabi', 'Arabic', 'Mandarin', 'Bengali', 'Urdu', 'Somali'],
  },
  dubai: {
    tagline: 'Where East meets West',
    emoji: '🏙️',
    cultureCommunities: ['South Asian', 'Filipino', 'Arab', 'East African', 'Pakistani'],
    languages: ['Hindi', 'Arabic', 'Filipino', 'Urdu', 'Malayalam', 'Tamil'],
  },
  toronto: {
    tagline: 'The most multicultural city on Earth',
    emoji: '🍁',
    cultureCommunities: ['South Asian', 'Chinese', 'Filipino', 'Caribbean', 'South American'],
    languages: ['Hindi', 'Mandarin', 'Filipino', 'Punjabi', 'Portuguese', 'Urdu'],
  },
  auckland: {
    tagline: 'Pacific cultures meet Māori heritage',
    emoji: '🌿',
    cultureCommunities: ['Māori', 'Pacific Islander', 'Indian', 'Chinese', 'Filipino', 'Samoan'],
    languages: ['Māori', 'Samoan', 'Hindi', 'Mandarin', 'Tongan', 'Filipino'],
  },
};

const DEFAULT_CITY_META: CityMeta = {
  tagline: 'Explore the vibrant heartbeat of culture',
  emoji: '🌍',
  cultureCommunities: [],
  languages: [],
};

// ─── State helpers ────────────────────────────────────────────────────────────

function getStateName(stateCode: string | undefined): string | undefined {
  if (!stateCode) return undefined;
  return GLOBAL_REGIONS.find((r) => r.value === stateCode)?.label;
}

// ─── Component ────────────────────────────────────────────────────────────────

type FilterMode = 'category' | 'culture' | 'language';

const CATEGORY_FILTERS = ['Music', 'Food', 'Arts', 'Nightlife', 'Indigenous', 'Sports', 'Workshop'];

export default function CityScreen() {
  const { name, country } = useLocalSearchParams<{ name: string; country?: string }>();
  const colors = useColors();
  const { isDesktop, contentWidth, width } = useLayout();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { state: onboarding } = useOnboarding();

  const cityName    = Array.isArray(name)    ? name[0]    : name    ?? onboarding?.city ?? 'Sydney';
  const cityCountry = Array.isArray(country) ? country[0] : country ?? onboarding?.country ?? 'Australia';
  const heroImage   = CITY_IMAGES[cityName.toLowerCase()] ?? DEFAULT_CITY_IMAGE;
  const cityMeta    = CITY_META[cityName.toLowerCase()] ?? DEFAULT_CITY_META;

  // State
  const stateCode = getStateForCity(cityName);
  const stateName = getStateName(stateCode);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCultures, setSelectedCultures] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const colAnim = useSharedValue(2);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: eventsData, isLoading, refetch } = useQuery<PaginatedEventsResponse>({
    queryKey: ['/api/events', 'city', cityName, selectedCategories],
    queryFn: () =>
      api.events.list({
        city: cityName,
        country: cityCountry,
        pageSize: 60,
        category: selectedCategories.length === 1 ? selectedCategories[0].toLowerCase() : undefined,
      }),
    staleTime: 120_000,
  });

  const { data: venuesData } = useQuery<Profile[]>({
    queryKey: ['/api/businesses', 'city', cityName],
    queryFn: () => api.businesses.list({ city: cityName, country: cityCountry }),
    staleTime: 300_000,
  });

  const allEvents = useMemo<EventData[]>(
    () => eventsData?.events ?? [],
    [eventsData],
  );

  const venues = useMemo<Profile[]>(
    () => (venuesData ?? []).slice(0, 6),
    [venuesData],
  );

  // ── Derive unique culture tags + language tags from event data ─────────────

  const uniqueCultureTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    allEvents.forEach((e) => {
      (e.cultureTag ?? e.cultureTags ?? []).forEach((t: string) => set.add(t));
    });
    // Merge with CITY_META so chips are always populated even before events load
    cityMeta.cultureCommunities.forEach((c) => set.add(c));
    return Array.from(set).slice(0, 16);
  }, [allEvents, cityMeta.cultureCommunities]);

  const uniqueLanguageTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    allEvents.forEach((e) => {
      (e.languageTags ?? []).forEach((t: string) => set.add(t));
    });
    cityMeta.languages.forEach((l) => set.add(l));
    return Array.from(set).slice(0, 14);
  }, [allEvents, cityMeta.languages]);

  // ── Client-side culture + language filtering ───────────────────────────────

  const events = useMemo(() => {
    let list = allEvents;

    // Category filter: if multiple selected, show union
    if (selectedCategories.length > 1) {
      const lower = selectedCategories.map((c) => c.toLowerCase());
      list = list.filter((e) => lower.includes((e.category ?? '').toLowerCase()));
    }

    // Culture filter
    if (selectedCultures.length > 0) {
      list = list.filter((e) => {
        const tags: string[] = [...(e.cultureTag ?? []), ...(e.cultureTags ?? [])];
        return selectedCultures.some((sel) =>
          tags.some((t) => t.toLowerCase().includes(sel.toLowerCase())),
        );
      });
    }

    // Language filter
    if (selectedLanguages.length > 0) {
      list = list.filter((e) => {
        const langs: string[] = e.languageTags ?? [];
        return selectedLanguages.some((sel) =>
          langs.some((l) => l.toLowerCase().includes(sel.toLowerCase())),
        );
      });
    }

    return list;
  }, [allEvents, selectedCategories, selectedCultures, selectedLanguages]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleShare = useCallback(async () => {
    haptic();
    const shareUrl = `https://culturepass.app/city/${encodeURIComponent(cityName)}?country=${encodeURIComponent(cityCountry)}`;
    const message = `Explore My City: ${cityName} on CulturePass — local events, communities and experiences.\n${shareUrl}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: `${cityName} · My City`, text: message, url: shareUrl });
      } else {
        await Share.share({ title: `${cityName} · My City`, message, url: shareUrl });
      }
    } catch {}
  }, [haptic, cityName, cityCountry]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const clearAllFilters = useCallback(() => {
    haptic();
    setSelectedCategories([]);
    setSelectedCultures([]);
    setSelectedLanguages([]);
  }, [haptic]);

  const totalActiveFilters = selectedCategories.length + selectedCultures.length + selectedLanguages.length;

  const gridGap   = 16;
  const gridWidth = isDesktop ? contentWidth : width - 40;
  const cardWidth = Math.floor((gridWidth - gridGap) / 2) - 1;

  const animatedCardStyle = useAnimatedStyle(() => ({
    width: interpolate(colAnim.value, [2, 3], [cardWidth, cardWidth], Extrapolation.CLAMP),
    opacity: 1,
  }));

  const goToMap = useCallback(() => {
    haptic();
    router.push({ pathname: '/map', params: { city: cityName } });
  }, [cityName, haptic]);

  const styles = getCityDestinationStyles(colors, insets, isDesktop, gridGap);

  // ── Active filter chips for current mode ───────────────────────────────────

  const activeFilters = filterMode === 'category'
    ? selectedCategories
    : filterMode === 'culture'
    ? selectedCultures
    : selectedLanguages;

  const filterOptions = filterMode === 'category'
    ? CATEGORY_FILTERS
    : filterMode === 'culture'
    ? uniqueCultureTags
    : uniqueLanguageTags;

  const onToggleFilter = useCallback((f: string) => {
    haptic();
    const setter = filterMode === 'category'
      ? setSelectedCategories
      : filterMode === 'culture'
      ? setSelectedCultures
      : setSelectedLanguages;
    setter((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  }, [filterMode, haptic]);

  const onClearMode = useCallback(() => {
    haptic();
    if (filterMode === 'category') setSelectedCategories([]);
    else if (filterMode === 'culture') setSelectedCultures([]);
    else setSelectedLanguages([]);
  }, [filterMode, haptic]);

  // ── Section title ──────────────────────────────────────────────────────────

  const sectionTitle = useMemo(() => {
    const parts: string[] = [];
    if (selectedCategories.length) parts.push(selectedCategories.join(', '));
    if (selectedCultures.length) parts.push(selectedCultures.join(', '));
    if (selectedLanguages.length) parts.push(selectedLanguages.join(', '));
    return parts.length ? `${parts.join(' · ')} Events` : 'My City Highlights';
  }, [selectedCategories, selectedCultures, selectedLanguages]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cityAmbient.mesh}
          pointerEvents="none"
        />
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            isDesktop && { width: contentWidth, alignSelf: 'center' },
          ]}
          stickyHeaderIndices={[2]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* ══════════════════════════════════════════════════════════════════
              HERO
          ══════════════════════════════════════════════════════════════════ */}
          <View style={styles.hero}>
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              contentFit="cover"
              transition={600}
            />

            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.90)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Top bar */}
            <View style={[styles.heroTopBar, { paddingTop: Platform.OS === 'web' ? 16 : insets.top + 16 }]}>
              <LiquidGlassPanel
                borderRadius={22}
                bordered={false}
                style={{ width: 44, height: 44 }}
                contentStyle={styles.heroGlassCircleInner}
              >
                <Pressable
                  onPress={() => { haptic(); router.back(); }}
                  style={styles.heroIconHit}
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                >
                  <Ionicons name="chevron-back" size={24} color={colors.textOnBrandGradient} />
                </Pressable>
              </LiquidGlassPanel>

              {/* State + Country chip */}
              <LiquidGlassPanel
                borderRadius={20}
                bordered={false}
                style={styles.heroGlassChipShell}
                contentStyle={styles.heroGlassChipInner}
              >
                <Ionicons name="location" size={13} color={CultureTokens.gold} />
                <Text style={[styles.chipText, { color: colors.textOnBrandGradient }]} numberOfLines={1}>
                  {stateCode ? `${stateCode} · ${cityCountry}` : cityCountry}
                </Text>
              </LiquidGlassPanel>

              <LiquidGlassPanel
                borderRadius={22}
                bordered={false}
                style={{ width: 44, height: 44 }}
                contentStyle={styles.heroGlassCircleInner}
              >
                <Pressable
                  onPress={() => { void handleShare(); }}
                  style={styles.heroIconHit}
                  accessibilityLabel="Share city guide"
                  accessibilityRole="button"
                >
                  <Ionicons name="share-social-outline" size={22} color={colors.textOnBrandGradient} />
                </Pressable>
              </LiquidGlassPanel>
            </View>

            {/* Hero content */}
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={[styles.heroBadgeText, { color: colors.text }]}>MY CITY</Text>
              </View>

              <Text style={[styles.heroCity, { color: colors.textOnBrandGradient }]}>{cityName}</Text>

              {stateName && (
                <View style={styles.stateRow}>
                  <Ionicons name="map-outline" size={13} color={colors.textOnBrandGradient} style={{ opacity: 0.72 }} />
                  <Text style={styles.stateText}>{stateName}</Text>
                </View>
              )}

              <Text style={styles.heroSubtitle}>{cityMeta.tagline}</Text>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              CITY STATS STRIP
          ══════════════════════════════════════════════════════════════════ */}
          <View style={[styles.statsStrip, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
            <StatPill icon="calendar" value={String(allEvents.length)} label="Events" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <StatPill icon="business" value={String(venues.length || '—')} label="Venues" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <StatPill icon="people" value={String(uniqueCultureTags.length)} label="Cultures" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <StatPill icon="chatbubble-ellipses" value={String(uniqueLanguageTags.length)} label="Languages" colors={colors} />
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              FILTER BAR (sticky)
          ══════════════════════════════════════════════════════════════════ */}
          <View style={styles.filterBar}>
            <LiquidGlassPanel
              borderRadius={0}
              bordered={false}
              style={{
                borderBottomWidth: StyleSheet.hairlineWidth * 2,
                borderBottomColor: colors.borderLight,
              }}
              contentStyle={styles.filterBarGlassInner}
            >
            {/* Mode tabs */}
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modeTabs}
            >
              {(['category', 'culture', 'language'] as FilterMode[]).map((mode) => {
                const active = filterMode === mode;
                const badge = mode === 'category'
                  ? selectedCategories.length
                  : mode === 'culture'
                  ? selectedCultures.length
                  : selectedLanguages.length;
                const labels: Record<FilterMode, string> = {
                  category: 'Category',
                  culture: 'Culture',
                  language: 'Language',
                };
                const icons: Record<FilterMode, keyof typeof Ionicons.glyphMap> = {
                  category: 'grid-outline',
                  culture: 'globe-outline',
                  language: 'chatbubble-outline',
                };
                return (
                  <Pressable
                    key={mode}
                    onPress={() => { haptic(); setFilterMode(mode); }}
                    style={[styles.modeTab, active && { borderBottomColor: CultureTokens.indigo, borderBottomWidth: 2 }]}
                  >
                    <Ionicons
                      name={icons[mode]}
                      size={15}
                      color={active ? CultureTokens.indigo : colors.textTertiary}
                    />
                    <Text style={[styles.modeTabText, { color: active ? CultureTokens.indigo : colors.textTertiary }]}>
                      {labels[mode]}
                    </Text>
                    {badge > 0 && (
                      <View style={styles.modeBadge}>
                        <Text style={styles.modeBadgeText}>{badge}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}

              {totalActiveFilters > 0 && (
                <Pressable onPress={clearAllFilters} style={styles.clearAllTab}>
                  <Ionicons name="close-circle" size={15} color={colors.textTertiary} />
                  <Text style={[styles.modeTabText, { color: colors.textTertiary }]}>Clear all</Text>
                </Pressable>
              )}
            </ScrollView>

            {/* Filter chips for active mode */}
            {filterOptions.length > 0 && (
              <FilterChips
                filters={filterOptions}
                selectedFilters={activeFilters}
                onToggle={onToggleFilter}
                onClearAll={onClearMode}
              />
            )}
            </LiquidGlassPanel>
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              TRENDING NOW
          ══════════════════════════════════════════════════════════════════ */}
          {allEvents.length > 5 && totalActiveFilters === 0 && (
            <View style={styles.section}>
              <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>
                Happening Now in {cityName}
              </Text>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              >
                {allEvents.slice(0, 6).map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => router.push(`/event/${e.id}`)}
                    style={styles.trendingCard}
                  >
                    <Image
                      source={{ uri: e.heroImageUrl || e.imageUrl }}
                      style={styles.trendingImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.82)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.trendingInfo}>
                      {e.category && (
                        <View style={styles.trendingCategoryPill}>
                          <Text style={styles.trendingCategoryText}>{e.category}</Text>
                        </View>
                      )}
                      <Text style={styles.trendingTitle} numberOfLines={2}>{e.title}</Text>
                      {e.date && (
                        <Text style={styles.trendingDate} numberOfLines={1}>
                          {new Date(e.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MAIN CONTENT (events + venue sidebar on desktop)
          ══════════════════════════════════════════════════════════════════ */}
          <View
            style={
              isDesktop
                ? { flexDirection: 'row', gap: gridGap * 2, paddingHorizontal: 20 }
                : undefined
            }
          >
            {/* Events grid */}
            <View style={{ flex: isDesktop ? 2.8 : 1 }}>
              <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={[TextStyles.title3, { color: colors.text }]}>{sectionTitle}</Text>
                    <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                      {events.length} result{events.length !== 1 ? 's' : ''} in {cityName}
                    </Text>
                  </View>
                  {totalActiveFilters > 0 && (
                    <Pressable onPress={clearAllFilters} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </Pressable>
                  )}
                </View>

                {isLoading ? (
                  <View style={styles.skeletonGrid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <View key={i} style={[styles.skeletonCard, { width: cardWidth, height: 240 }]} />
                    ))}
                  </View>
                ) : events.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-clear-outline" size={64} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No events found</Text>
                    <Text style={styles.emptySubtitle}>
                      Try adjusting the filters or check back soon
                    </Text>
                    <Pressable style={styles.retryButton} onPress={clearAllFilters}>
                      <Text style={styles.retryText}>Show All Events</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Animated.View style={[styles.grid, { gap: gridGap }]}>
                    {events.map((event) => {
                      const w = isDesktop
                        ? (gridWidth * 0.72 - gridGap) / 2
                        : cardWidth;
                      return (
                        <Animated.View
                          key={event.id}
                          style={[isDesktop ? { width: w } : animatedCardStyle, { marginBottom: gridGap }]}
                        >
                          <EventCard
                            event={event}
                            containerWidth={w}
                            containerHeight={Platform.OS === 'web' ? 320 : 260}
                            layout={Platform.OS === 'web' ? 'stacked' : 'overlay'}
                            schedulingMode={Platform.OS === 'web' ? 'live_and_countdown' : 'default'}
                          />
                        </Animated.View>
                      );
                    })}
                  </Animated.View>
                )}
              </View>
            </View>

            {/* Sidebar — venues + map (desktop) or stacked section (mobile) */}
            <View style={{ flex: 1, paddingTop: isDesktop ? 28 : 0 }}>
              {venues.length > 0 && (
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0, paddingTop: 0 }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 16 }]}>
                    Local Places & Partners
                  </Text>
                  <View style={isDesktop ? { gap: 12 } : styles.venueGrid}>
                    {venues.map((v) => (
                      <Pressable
                        key={v.id}
                        onPress={() => router.push(`/business/${v.id}`)}
                        style={[styles.venueCard, isDesktop && { width: '100%' }]}
                      >
                        <View style={styles.venueIcon}>
                          <Ionicons name="business" size={22} color={CultureTokens.indigo} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.venueName} numberOfLines={1}>{v.name}</Text>
                          <Text style={styles.venueCategory}>{v.category || 'Culture Host'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                      </Pressable>
                    ))}
                  </View>

                  {isDesktop && (
                    <Pressable
                      style={[styles.mapCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                      onPress={goToMap}
                    >
                      <Ionicons name="map-outline" size={22} color={CultureTokens.indigo} />
                      <Text style={[styles.mapCardText, { color: colors.text }]}>View All on Map</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Culture communities section (sidebar on desktop, bottom on mobile) */}
              {uniqueCultureTags.length > 0 && (
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>
                    Cultural Communities
                  </Text>
                  <View style={styles.tagCloud}>
                    {uniqueCultureTags.map((tag) => {
                      const active = selectedCultures.includes(tag);
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => {
                            haptic();
                            setFilterMode('culture');
                            setSelectedCultures((prev) =>
                              prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
                            );
                          }}
                          style={[
                            styles.tagPill,
                            {
                              backgroundColor: active ? CultureTokens.indigo : colors.backgroundSecondary,
                              borderColor: active ? CultureTokens.indigo : colors.borderLight,
                            },
                          ]}
                        >
                          <Text style={[styles.tagPillText, { color: active ? colors.textOnBrandGradient : colors.text }]}>
                            {tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Languages section */}
              {uniqueLanguageTags.length > 0 && (
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>
                    Languages
                  </Text>
                  <View style={styles.tagCloud}>
                    {uniqueLanguageTags.map((lang) => {
                      const active = selectedLanguages.includes(lang);
                      return (
                        <Pressable
                          key={lang}
                          onPress={() => {
                            haptic();
                            setFilterMode('language');
                            setSelectedLanguages((prev) =>
                              prev.includes(lang) ? prev.filter((x) => x !== lang) : [...prev, lang],
                            );
                          }}
                          style={[
                            styles.tagPill,
                            {
                              backgroundColor: active ? CultureTokens.gold + 'EE' : colors.backgroundSecondary,
                              borderColor: active ? CultureTokens.gold : colors.borderLight,
                            },
                          ]}
                        >
                          <Text style={[styles.tagPillText, { color: colors.text }]}>
                            {lang}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* FAB — mobile only */}
        {!isDesktop && (
          <Pressable style={styles.fab} onPress={goToMap} accessibilityLabel="Open map for this city" accessibilityRole="button">
            <Ionicons name="map" size={22} color={colors.textOnBrandGradient} />
            <Text style={[styles.fabText, { color: colors.textOnBrandGradient }]}>Map</Text>
          </Pressable>
        )}
      </View>
    </ErrorBoundary>
  );
}

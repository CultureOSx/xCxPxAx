import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffectiveMainTabTopInset } from '@/hooks/useEffectiveMainTabTopInset';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLocations } from '@/hooks/useLocations';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useEventsList } from '@/hooks/queries/useEvents';
import { CultureTokens, CategoryColors, gradients, TextStyles, FontFamily } from '@/constants/theme';
import { captureEvent } from '@/lib/analytics';
import { isIndigenousEvent } from '@/lib/indigenous';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { formatEventDateTime } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { CityRail } from '@/components/Discover/CityRail';
import { calculateDistance, getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { CardGrammar } from '@/components/ui/CardGrammar';

// ─── Category data ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',        label: 'All',        icon: 'apps',          color: CultureTokens.indigo   },
  { id: 'indigenous', label: '🪃 Indigenous', icon: 'leaf',        color: CultureTokens.gold     },
  { id: 'music',      label: 'Music',      icon: 'musical-notes', color: CategoryColors.music   },
  { id: 'dance',      label: 'Dance',      icon: 'body',          color: CategoryColors.dance   },
  { id: 'food',       label: 'Food',       icon: 'restaurant',    color: CategoryColors.food    },
  { id: 'art',        label: 'Art',        icon: 'color-palette', color: CategoryColors.art     },
  { id: 'wellness',   label: 'Wellness',   icon: 'heart',         color: CategoryColors.wellness},
  { id: 'film',       label: 'Film',       icon: 'film',          color: CategoryColors.movies  },
  { id: 'workshop',   label: 'Workshop',   icon: 'construct',     color: CategoryColors.workshop},
  { id: 'heritage',   label: 'Heritage',   icon: 'library',       color: CategoryColors.heritage},
  { id: 'nightlife',  label: 'Nightlife',  icon: 'moon',          color: CategoryColors.nightlife},
] as const;

const CAT_ALIAS: Record<string, string> = {
  concert: 'music', concerts: 'music', 'live music': 'music',
  cuisine: 'food', 'food and drink': 'food',
  arts: 'art', artist: 'art', artists: 'art',
  wellbeing: 'wellness', 'well being': 'wellness',
  movie: 'film', movies: 'film', cinema: 'film',
  workshops: 'workshop',
  cultural: 'heritage', culture: 'heritage',
};

function normalizeCategory(raw?: string | null): string {
  if (!raw) return 'heritage';
  const key = raw.trim().toLowerCase().replace(/[_-]+/g, ' ');
  return CAT_ALIAS[key] ?? key;
}

function eventMatchesCategory(event: EventData, catId: string): boolean {
  if (catId === 'all') return true;
  if (catId === 'indigenous') return isIndigenousEvent(event);
  const norm = normalizeCategory(event.category);
  if (norm === catId) return true;
  const tags = [...(event.tags ?? []), ...(event.cultureTag ?? [])];
  return tags.some((t) => normalizeCategory(String(t)) === catId);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExploreEventCard({ event }: { event: EventData }) {
  const isIndigenous = isIndigenousEvent(event);
  const trustChips = [
    isIndigenous ? 'Indigenous' : null,
    event.isFeatured ? 'Featured' : null,
    typeof event.attending === 'number' && event.attending > 0 ? `${event.attending} attending` : null,
  ].filter((chip): chip is string => Boolean(chip));
  const ctaLabel =
    event.entryType === 'free_open' || event.isFree || (event.priceCents ?? 0) === 0 ? 'Join Free' : 'Get Ticket';

  return (
    <View
      style={{
        borderWidth: isIndigenous ? 2 : 0,
        borderColor: isIndigenous ? CultureTokens.gold : 'transparent',
        borderRadius: 18,
      }}
    >
      <CardGrammar
        title={event.title}
        subtitle={formatEventDateTime(event.date, event.time)}
        meta={event.venue || event.city}
        imageUrl={event.imageUrl}
        trustChips={trustChips}
        ctaLabel={ctaLabel}
        iconName="calendar-outline"
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        accessibilityLabel={`${event.title}, ${ctaLabel}`}
      />
    </View>
  );
}

// ─── Category pill ────────────────────────────────────────────────────────────

function CategoryPill({
  cat,
  isActive,
  onPress,
}: {
  cat: typeof CATEGORIES[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${cat.label}`}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        cpill.base,
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}
    >
      {isActive ? (
        <LinearGradient
          colors={[cat.color, cat.color + 'E6'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cpill.inner}
        >
          <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={15} color="#fff" />
          <Text style={[cpill.label, { color: '#fff', fontFamily: 'Poppins_600SemiBold' }]}>
            {cat.label}
          </Text>
        </LinearGradient>
      ) : (
        <View style={[cpill.innerInactive, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
          <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={15} color={cat.color} />
          <Text style={[cpill.label, { color: colors.textSecondary }]}>{cat.label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const cpill = StyleSheet.create({
  base: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  innerInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
});

export default function ExploreScreen() {
  const { state } = useOnboarding();
  const colors = useColors();
  const params = useLocalSearchParams<{ focus?: string; source?: string; playlistId?: string; featuredArtistId?: string }>();
  const topInset = useEffectiveMainTabTopInset();
  const { hPad, isDesktop, isTablet } = useLayout();

  const requestedFocus = params.focus ? params.focus : 'all';

  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(requestedFocus);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [distanceFilterKm, setDistanceFilterKm] = useState<number | null>(25);
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'budget' | 'premium'>('all');
  const [vibeFilter, setVibeFilter] = useState<'all' | 'chill' | 'energetic'>('all');
  const [accessibilityOnly, setAccessibilityOnly] = useState(false);
  const [cultureTagFilter, setCultureTagFilter] = useState<string>('all');

  // Responsive columns config
  const gridCols = isDesktop ? 4 : isTablet ? 3 : 2;
  const colGap = 12;

  useEffect(() => {
    setActiveId(requestedFocus);
  }, [requestedFocus]);

  const { data: eventsPage, isLoading } = useEventsList({
    city: state.city,
    country: state.country,
    pageSize: 80,
  });
  const events = useMemo(() => eventsPage?.events ?? [], [eventsPage]);

  const filtered = useMemo(() => {
    let list = events.filter((e) => eventMatchesCategory(e, activeId));
    const userCoords = state.city ? getPostcodesByPlace(state.city)[0] : undefined;

    if (distanceFilterKm != null && userCoords) {
      list = list.filter((event) => {
        if (typeof event.distanceKm === 'number') return event.distanceKm <= distanceFilterKm;
        if (typeof event.lat !== 'number' || typeof event.lng !== 'number') return true;
        const distance = calculateDistance(userCoords.latitude, userCoords.longitude, event.lat, event.lng);
        return distance <= distanceFilterKm;
      });
    }

    if (priceFilter !== 'all') {
      list = list.filter((event) => {
        if (priceFilter === 'free') return event.entryType === 'free_open' || event.isFree || (event.priceCents ?? 0) === 0;
        if (priceFilter === 'budget') return (event.priceCents ?? 0) > 0 && (event.priceCents ?? 0) <= 3000;
        return (event.priceCents ?? 0) >= 5000 || event.priceTier === 'premium';
      });
    }

    if (vibeFilter !== 'all') {
      list = list.filter((event) => {
        const haystack = [event.category, ...(event.tags ?? [])].join(' ').toLowerCase();
        if (vibeFilter === 'chill') return /wellness|art|heritage|workshop|acoustic/.test(haystack);
        return /nightlife|dance|festival|concert|party/.test(haystack);
      });
    }

    if (accessibilityOnly) {
      list = list.filter((event) => (event.accessibility?.length ?? 0) > 0);
    }

    if (cultureTagFilter !== 'all') {
      list = list.filter((event) => {
        const tags = [...(event.cultureTag ?? []), ...(event.cultureTags ?? [])].map((tag) => tag.toLowerCase());
        return tags.some((tag) => tag.includes(cultureTagFilter.toLowerCase()));
      });
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.venue ?? '').toLowerCase().includes(q) ||
          (e.city  ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [events, activeId, query, state.city, distanceFilterKm, priceFilter, vibeFilter, accessibilityOnly, cultureTagFilter]);

  const featured = useMemo(() => events.filter((e) => e.isFeatured).slice(0, 6), [events]);
  const cultureTagOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const event of events) {
      for (const tag of [...(event.cultureTag ?? []), ...(event.cultureTags ?? [])]) {
        if (tag && tags.size < 8) tags.add(tag);
      }
    }
    return ['all', ...Array.from(tags)];
  }, [events]);

  const handleCatPress = useCallback((id: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setActiveId(id);
  }, []);

  useEffect(() => {
    if (!params.source) return;
    captureEvent('discover_curated_destination_view', {
      source: params.source,
      focus: requestedFocus,
      playlistId: params.playlistId,
      featuredArtistId: params.featuredArtistId,
    });
  }, [params.featuredArtistId, params.playlistId, params.source, requestedFocus]);

  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'Australia';

  const activeCat = CATEGORIES.find((c) => c.id === activeId);
  const { acknowledgement } = useLocations();
  const showAcknowledgement = ['Australia', 'New Zealand', 'Canada', 'AU', 'NZ', 'CA'].includes(state.country || 'Australia');

  return (
    <ErrorBoundary>
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.06 }]}
          pointerEvents="none"
        />

        <View style={{ paddingTop: topInset }}>
          <View
            style={[
              {
                backgroundColor: colors.surface,
                borderBottomWidth: StyleSheet.hairlineWidth * 2,
                borderBottomColor: colors.borderLight,
                paddingHorizontal: hPad,
                paddingTop: 16,
                paddingBottom: 16,
                gap: 14,
              },
            ]}
          >
            <View style={s.header}>
              <View style={s.headerTitles}>
                <Text style={[s.headerTitle, { color: colors.text }]}>
                  {activeId === 'indigenous' ? '🪃 Indigenous' : 'Explore'}
                </Text>
                <Text style={[s.headerSub, { color: colors.textSecondary }]}>
                  {activeId === 'indigenous'
                    ? 'First Nations culture and events in '
                    : 'Discover what\u2019s happening in '}
                  <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>
                    {locationLabel}
                  </Text>
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/search')}
                style={[s.searchIconBtn, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Ionicons name="search" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={[s.searchBar, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
              <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
              <TextInput
                style={[s.searchInput, { color: colors.text }]}
                placeholder="Search events, venues…"
                placeholderTextColor={colors.textTertiary}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                accessibilityLabel="Search events"
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Event Grid & Content ── */}
        <View style={{ flex: 1 }}>
          <FlashList<EventData>
            key={`grid-${gridCols}`}
            data={filtered}
            extraData={gridCols}
            keyExtractor={(item: EventData) => item.id}
            numColumns={gridCols}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: hPad }}
            ListHeaderComponent={
              <View style={{ marginBottom: 16 }}>
                {/* ── Category pills ── */}
                <View style={s.catsWrap}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.catsScroll}
                  >
                    {CATEGORIES.map((cat) => (
                      <CategoryPill
                        key={cat.id}
                        cat={cat}
                        isActive={activeId === cat.id}
                        onPress={() => handleCatPress(cat.id)}
                      />
                    ))}
                  </ScrollView>
                </View>

                <View style={[s.hybridBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <View style={s.hybridToggle}>
                    {(['list', 'map'] as const).map((mode) => (
                      <Pressable
                        key={mode}
                        onPress={() => setViewMode(mode)}
                        style={[
                          s.hybridToggleBtn,
                          {
                            backgroundColor: viewMode === mode ? CultureTokens.indigo : 'transparent',
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Switch to ${mode} view`}
                      >
                        <Ionicons
                          name={mode === 'list' ? 'list-outline' : 'map-outline'}
                          size={14}
                          color={viewMode === mode ? '#fff' : colors.textSecondary}
                        />
                        <Text style={[s.hybridToggleText, { color: viewMode === mode ? '#fff' : colors.textSecondary }]}>
                          {mode === 'list' ? 'List' : 'Map'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hybridFilters}>
                    <Pressable
                      style={[s.filterPill, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
                      onPress={() => setDistanceFilterKm((prev) => (prev === 10 ? 25 : prev === 25 ? 50 : 10))}
                    >
                      <Text style={[s.filterPillText, { color: colors.text }]}>
                        {distanceFilterKm ?? 25}km
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[s.filterPill, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
                      onPress={() => setPriceFilter((prev) => (prev === 'all' ? 'free' : prev === 'free' ? 'budget' : prev === 'budget' ? 'premium' : 'all'))}
                    >
                      <Text style={[s.filterPillText, { color: colors.text }]}>
                        Price: {priceFilter}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[s.filterPill, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
                      onPress={() => setVibeFilter((prev) => (prev === 'all' ? 'chill' : prev === 'chill' ? 'energetic' : 'all'))}
                    >
                      <Text style={[s.filterPillText, { color: colors.text }]}>
                        Vibe: {vibeFilter}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[s.filterPill, { borderColor: colors.borderLight, backgroundColor: accessibilityOnly ? CultureTokens.indigo + '22' : colors.surfaceElevated }]}
                      onPress={() => setAccessibilityOnly((prev) => !prev)}
                    >
                      <Text style={[s.filterPillText, { color: accessibilityOnly ? CultureTokens.indigo : colors.text }]}>
                        Accessible
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[s.filterPill, { borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated }]}
                      onPress={() => {
                        const idx = cultureTagOptions.indexOf(cultureTagFilter);
                        const next = cultureTagOptions[(idx + 1) % cultureTagOptions.length] ?? 'all';
                        setCultureTagFilter(next);
                      }}
                    >
                      <Text style={[s.filterPillText, { color: colors.text }]}>
                        Culture: {cultureTagFilter}
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>

                {viewMode === 'map' && (
                  <View style={[s.mapPanel, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <View style={s.mapPanelHeader}>
                      <Ionicons name="navigate-outline" size={16} color={CultureTokens.indigo} />
                      <Text style={[s.mapPanelTitle, { color: colors.text }]}>Geo-smart map preview</Text>
                    </View>
                    <Text style={[s.mapPanelSub, { color: colors.textSecondary }]}>
                      Showing {Math.min(filtered.length, 8)} nearby results by location and filters.
                    </Text>
                    <View style={s.mapPinWrap}>
                      {filtered.slice(0, 8).map((event) => (
                        <View key={event.id} style={[s.mapPin, { backgroundColor: CultureTokens.indigo + '16', borderColor: CultureTokens.indigo + '45' }]}>
                          <Ionicons name="location" size={12} color={CultureTokens.indigo} />
                          <Text style={[s.mapPinText, { color: colors.text }]} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* ── Indigenous banner ── */}
                {activeId === 'indigenous' && (
                  <LinearGradient
                    colors={[CultureTokens.gold + '28', CultureTokens.gold + '08']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.indigenousBanner}
                  >
                    <View style={s.indigenousBannerRow}>
                      <View style={[s.indigenousBannerAccent, { backgroundColor: CultureTokens.gold }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.indigenousBannerTitle, { color: colors.text }]}>
                          Celebrating First Nations Culture
                        </Text>
                        <Text style={[s.indigenousBannerSub, { color: colors.textSecondary }]}>
                          Indigenous events, art and experiences in {locationLabel}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                )}


                {/* ── City Rail ── */}
                {activeId === 'all' && query === '' && (
                  <View style={{ marginBottom: 8 }}>
                    <CityRail />
                  </View>
                )}

                {/* Featured horizontal rail */}
                {activeId === 'all' && query === '' && featured.length > 0 && (
                  <View style={s.section}>
                    <View style={s.sectionHeader}>
                      <LinearGradient
                        colors={[CultureTokens.indigo, CultureTokens.gold]}
                        style={s.sectionDot}
                      />
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Featured</Text>
                      <View style={{ flex: 1 }} />
                      <Pressable onPress={() => router.push('/events')} accessibilityRole="link">
                        <Text style={[s.seeAll, { color: CultureTokens.indigo }]}>See all</Text>
                      </Pressable>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
                      style={{ marginHorizontal: -hPad, paddingHorizontal: hPad }}
                    >
                      {featured.map((ev, index) => (
                        <View key={ev.id} style={{ width: 280 }}>
                          <ExploreEventCard event={ev} />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Results header row */}
                <View
                  style={[
                    s.sectionHeader,
                    {
                      marginTop: activeId === 'all' && query === '' && featured.length > 0 ? 28 : 8,
                    },
                  ]}
                >
                  <View style={[s.sectionDot, {
                    backgroundColor: activeId === 'indigenous' ? CultureTokens.gold : CultureTokens.indigo,
                  }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sectionTitle, { color: colors.text }]}>
                      {activeId === 'all' && query === ''
                        ? `Events in ${locationLabel}`
                        : query
                        ? `"${query}"`
                        : activeCat?.label ?? 'Events'}
                    </Text>
                  </View>

                  {!isLoading && (
                    <View style={{ backgroundColor: colors.surfaceElevated, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                      <Text style={[s.resultCount, { color: colors.textSecondary }]}>
                        {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Loading state */}
                {isLoading && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -hPad, paddingHorizontal: hPad }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View key={i} style={{ width: `${100 / gridCols}%`, padding: 7 }}>
                        <EventCardSkeleton />
                      </View>
                    ))}
                  </View>
                )}

                {/* Empty state */}
                {!isLoading && filtered.length === 0 && (
                  <View style={s.emptyWrap}>
                    <LinearGradient
                      colors={[
                        (activeId === 'indigenous' ? CultureTokens.gold : CultureTokens.indigo) + '20',
                        (activeId === 'indigenous' ? CultureTokens.gold : CultureTokens.indigo) + '08',
                      ] as [string, string]}
                      style={s.emptyIconCircle}
                    >
                      <Ionicons
                        name={activeId === 'indigenous' ? 'leaf-outline' : 'search-outline'}
                        size={32}
                        color={activeId === 'indigenous' ? CultureTokens.gold : CultureTokens.indigo}
                      />
                    </LinearGradient>
                    <Text style={[s.emptyTitle, { color: colors.text }]}>
                      {activeId === 'indigenous'
                        ? 'No Indigenous events found'
                        : activeCat && activeId !== 'all'
                        ? `No ${activeCat.label} events`
                        : 'No events found'}
                    </Text>
                    <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                      {activeId === 'indigenous'
                        ? 'Check back soon — new First Nations events are added regularly'
                        : query
                        ? 'Try a different search'
                        : 'Try a different category'}
                    </Text>
                    {(activeId !== 'all' || query !== '') && (
                      <View style={{ marginTop: 20 }}>
                        <Button
                          variant="outline"
                          pill
                          onPress={() => {
                            setActiveId('all');
                            setQuery('');
                          }}
                        >
                          Reset filters
                        </Button>
                      </View>
                    )}
                  </View>
                )}
              </View>
            }
            renderItem={({ item }: { item: EventData }) => (
              <View style={{ padding: colGap / 2, paddingHorizontal: hPad * 0.2 }}>
                 <ExploreEventCard event={item} />
              </View>
            )}
            ListFooterComponent={
              showAcknowledgement && !isLoading && filtered.length > 0 ? (
                <View style={[s.acknowledgementWrap, { borderColor: colors.borderLight }]}>
                  <Ionicons name="leaf-outline" size={20} color={CultureTokens.gold} />
                  <Text style={[s.acknowledgementText, { color: colors.textSecondary }]}>
                    {acknowledgement}
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      </View>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    gap: 18,
  },
  headerTitles: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    ...TextStyles.hero,
    letterSpacing: -0.5,
  },
  headerSub: {
    ...TextStyles.cardBody,
  },
  searchIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    ...TextStyles.callout,
    padding: 0,
  },
  catsWrap: {
    paddingVertical: 16,
  },
  hybridBar: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 10,
    marginBottom: 16,
  },
  hybridToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  hybridToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  hybridToggleText: {
    ...TextStyles.captionSemibold,
  },
  hybridFilters: {
    gap: 8,
    paddingRight: 8,
  },
  filterPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterPillText: {
    ...TextStyles.captionSemibold,
  },
  mapPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  mapPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapPanelTitle: {
    ...TextStyles.callout,
  },
  mapPanelSub: {
    ...TextStyles.caption,
  },
  mapPinWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  mapPin: {
    maxWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  mapPinText: {
    ...TextStyles.badge,
    flexShrink: 1,
  },
  catsScroll: {
    gap: 12,
    paddingHorizontal: 4,
  },
  section: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionDot: {
    width: 6,
    height: 18,
    borderRadius: 3,
  },
  sectionTitle: {
    ...TextStyles.title2,
    letterSpacing: -0.3,
  },
  seeAll: { ...TextStyles.chip, fontFamily: FontFamily.semibold },
  resultCount: {
    ...TextStyles.captionSemibold,
  },
  loadingWrap: {
    marginTop: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...TextStyles.label,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...TextStyles.title3,
    marginBottom: 8,
  },
  emptySub: {
    ...TextStyles.cardBody,
    textAlign: 'center',
  },

  // Indigenous banner
  indigenousBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 4,
  },
  indigenousBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indigenousBannerAccent: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  indigenousBannerTitle: {
    ...TextStyles.callout,
    fontFamily: FontFamily.bold,
    marginBottom: 3,
  },
  indigenousBannerSub: {
    ...TextStyles.chip,
    fontFamily: FontFamily.regular,
  },
  acknowledgementWrap: {
    padding: 24,
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    gap: 12,
  },
  acknowledgementText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
  },
});

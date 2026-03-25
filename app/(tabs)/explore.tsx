import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, Platform, ActivityIndicator, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useEventsList } from '@/hooks/queries/useEvents';
import { CultureTokens, CategoryColors } from '@/constants/theme';
import { captureEvent } from '@/lib/analytics';
import { isIndigenousEvent } from '@/lib/indigenous';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { formatEventDateTime } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';

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

function ExploreEventCard({ event, wide }: { event: EventData; wide?: boolean }) {
  const colors = useColors();
  const { columnWidth, isDesktop } = useLayout();
  // Responsive card width
  const cardWidth = wide ? '100%' : columnWidth(isDesktop ? 3 : 2);
  // Indigenous highlight
  const isIndigenous = isIndigenousEvent(event);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      accessibilityRole="button"
      accessibilityLabel={event.title}
      style={({ pressed }) => [
        ec.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight, width: cardWidth },
        wide && ec.cardWide,
        pressed && { opacity: 0.85 },
        isIndigenous && { borderWidth: 2, borderColor: CultureTokens.gold },
      ]}
    >
      {/* Image + gradient overlay */}
      <View style={[ec.imgWrap, wide && ec.imgWrapWide]}>
        <Image
          source={{ uri: event.imageUrl ?? undefined }}
          style={ec.fill}
          contentFit="cover"
          transition={150}
        />
        <LinearGradient
          colors={['transparent', colors.background + 'C0']}
          style={ec.fill}
        />
        {/* Price badge */}
        {(event.priceCents === 0 || event.isFree) ? (
          <View style={ec.freeBadge}>
            <Text style={ec.freeBadgeText}>FREE</Text>
          </View>
        ) : event.priceLabel ? (
          <View style={[ec.freeBadge, { backgroundColor: CultureTokens.indigo }]}> 
            <Text style={ec.freeBadgeText}>{event.priceLabel}</Text>
          </View>
        ) : null}
        {/* Indigenous badge */}
        {isIndigenous && (
          <View style={ec.indigenousBadge}>
            <Text style={ec.indigenousBadgeText}>🪃 Indigenous</Text>
          </View>
        )}
        {/* Featured star */}
        {event.isFeatured ? (
          <View style={ec.featuredDot}>
            <Ionicons name="star" size={10} color={CultureTokens.gold} />
          </View>
        ) : null}
        {/* Title overlay at bottom of image */}
        <View style={ec.imgOverlay}>
          <Text style={ec.imgTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={ec.imgDate} numberOfLines={1}>
            {formatEventDateTime(event.date, event.time)}
          </Text>
        </View>
      </View>

      {/* Bottom info */}
      <View style={ec.body}>
        {(event.venue || event.city) ? (
          <View style={ec.metaRow}>
            <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
            <Text style={[ec.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.venue || event.city}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const ec = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  cardWide: { width: '100%' },
  imgWrap: {
    height: 150,
    position: 'relative',
    backgroundColor: '#1a1a2e',
  },
  imgWrapWide: { height: 150 },
  freeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: CultureTokens.saffron,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  freeBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#0B0B14',
  },
  indigenousBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: CultureTokens.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 2,
  },
  indigenousBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#0B0B14',
  },
  featuredDot: {
    position: 'absolute',
    top: 8,
    left: 38,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    gap: 2,
  },
  imgTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
  imgDate: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  body: {
    padding: 10,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
});

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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${cat.label}`}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [
        cpill.base,
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
      ]}
    >
      {isActive ? (
        <LinearGradient
          colors={[cat.color, cat.color + 'CC'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cpill.inner}
        >
          <Ionicons name={cat.icon as any} size={14} color="#fff" />
          <Text style={[cpill.label, { color: '#fff', fontFamily: 'Poppins_600SemiBold' }]}>
            {cat.label}
          </Text>
        </LinearGradient>
      ) : (
        <View style={[cpill.innerInactive]}>
          <Ionicons name={cat.icon as any} size={14} color={cat.color} />
          <Text style={[cpill.label, { color: '#999' }]}>{cat.label}</Text>
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
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 100,
  },
  innerInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const params = useLocalSearchParams<{
    focus?: string;
    source?: string;
    playlistId?: string;
    featuredArtistId?: string;
  }>();
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { isDesktop, hPad } = useLayout();
  const { state } = useOnboarding();

  const requestedFocus =
    typeof params.focus === 'string' &&
    CATEGORIES.some((category) => category.id === params.focus)
      ? params.focus
      : 'all';

  const [query,    setQuery]    = useState('');
  const [activeId, setActiveId] = useState<string>(requestedFocus);

  useEffect(() => {
    setActiveId(requestedFocus);
  }, [requestedFocus]);

  const { data: eventsPage, isLoading } = useEventsList({
    city: state.city,
    country: state.country,
    pageSize: 80,
  });
  const events = useMemo(
    () => eventsPage?.events ?? [],
    [eventsPage],
  );

  const filtered = useMemo(() => {
    let list = events.filter((e) => eventMatchesCategory(e, activeId));
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
  }, [events, activeId, query]);

  const featured  = useMemo(() => events.filter((e) => e.isFeatured).slice(0, 6), [events]);
  const [cols, setCols] = useState<2 | 3>(2);
  const gridCols  = isDesktop ? 6 : cols;
  const colGap    = 12;

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

  return (
    <ErrorBoundary>
      <View style={[s.root, { backgroundColor: colors.background }]}>

        {/* ── Header ── */}
        <View
          style={[
            s.header,
            {
              paddingTop: topInset + 16,
              paddingHorizontal: hPad,
              backgroundColor: colors.background,
              borderBottomColor: colors.borderLight,
            },
          ]}
        >
          <View style={s.headerTitles}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Explore</Text>
            <Text style={[s.headerSub, { color: colors.textSecondary }]}>
              Discover what's happening in {locationLabel}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/search')}
            style={[s.searchIconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* ── Search bar ── */}
        <View style={[s.searchBarWrap, { paddingHorizontal: hPad }]}>
          <View style={[s.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={16} color={colors.textTertiary} />
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
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ── Category pills ── */}
        <View style={[s.catsWrap, { backgroundColor: colors.background }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.catsScroll, { paddingHorizontal: hPad }]}
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

        {/* ── Event grid ── */}
        <View style={{ flex: 1, paddingHorizontal: hPad }}>
          <FlatList
            key={gridCols}
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={gridCols}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListHeaderComponent={
              <>
                {/* Featured horizontal rail */}
                {activeId === 'all' && query === '' && featured.length > 0 && (
                  <View style={s.section}>
                    <View style={s.sectionHeader}>
                      <View style={s.sectionDot} />
                      <Text style={[s.sectionTitle, { color: colors.text }]}>Featured</Text>
                      <View style={{ flex: 1 }} />
                      <Pressable onPress={() => router.push('/events')} accessibilityRole="link">
                        <Text style={[s.seeAll, { color: CultureTokens.indigo }]}>See all</Text>
                      </Pressable>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12 }}
                    >
                      {featured.map((ev) => (
                        <ExploreEventCard key={ev.id} event={ev} />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Results header row */}
                <View
                  style={[
                    s.sectionHeader,
                    {
                      marginTop:
                        activeId === 'all' && query === '' && featured.length > 0 ? 28 : 12,
                    },
                  ]}
                >
                  <View style={s.sectionDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sectionTitle, { color: colors.text }]}>
                      {activeId === 'all' && query === ''
                        ? `Discover ${locationLabel}`
                        : query
                        ? `"${query}"`
                        : activeCat?.label ?? 'Events'}
                    </Text>
                  </View>

                  {!isDesktop && (
                    <View style={[s.colToggle, { backgroundColor: colors.backgroundSecondary }]}>
                      <Pressable
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync();
                          setCols(2);
                        }}
                        style={[s.toggleBtn, cols === 2 && s.toggleActive]}
                        accessibilityRole="button"
                        accessibilityLabel="2-column grid"
                      >
                        <Ionicons name="grid" size={12} color={cols === 2 ? '#FFFFFF' : colors.textTertiary} />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync();
                          setCols(3);
                        }}
                        style={[s.toggleBtn, cols === 3 && s.toggleActive]}
                        accessibilityRole="button"
                        accessibilityLabel="3-column grid"
                      >
                        <Ionicons name="apps" size={12} color={cols === 3 ? '#FFFFFF' : colors.textTertiary} />
                      </Pressable>
                    </View>
                  )}

                  {!isLoading && (
                    <Text style={[s.resultCount, { color: colors.textTertiary, marginLeft: 8 }]}>
                      {filtered.length}
                    </Text>
                  )}
                </View>

                {/* Loading state */}
                {isLoading && (
                  <View style={s.loadingWrap}>
                    <ActivityIndicator size="small" color={CultureTokens.indigo} />
                    <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading events…</Text>
                  </View>
                )}

                {/* Empty state */}
                {!isLoading && filtered.length === 0 && (
                  <View style={s.emptyWrap}>
                    <LinearGradient
                      colors={[CultureTokens.indigo + '20', CultureTokens.indigo + '08'] as [string, string]}
                      style={s.emptyIconCircle}
                    >
                      <Ionicons name="search-outline" size={28} color={CultureTokens.indigo} />
                    </LinearGradient>
                    <Text style={[s.emptyTitle, { color: colors.text }]}>
                      {activeCat && activeId !== 'all'
                        ? `No ${activeCat.label} events`
                        : 'No events found'}
                    </Text>
                    <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                      {query ? 'Try a different search' : 'Try a different category'}
                    </Text>
                    {(activeId !== 'all' || query !== '') && (
                      <View style={{ marginTop: 12 }}>
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
              </>
            }
            renderItem={({ item }) => (
              <View style={{ padding: colGap / 2 }}>
                <ExploreEventCard event={item} wide />
              </View>
            )}
          />
        </View>
      </View>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  searchIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // Search bar
  searchBarWrap: {
    marginTop: 12,
    marginBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    padding: 0,
  },

  // Category chips
  catsWrap: {
    paddingVertical: 10,
  },
  catsScroll: {
    gap: 8,
    paddingVertical: 2,
  },

  // Sections
  section:       { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionDot:    { width: 4, height: 18, borderRadius: 2, backgroundColor: CultureTokens.indigo },
  sectionTitle:  { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  seeAll:        { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  resultCount:   { fontSize: 12, fontFamily: 'Poppins_500Medium' },

  // Loading
  loadingWrap:  { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadingText:  { fontSize: 14, fontFamily: 'Poppins_500Medium' },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Column toggle
  colToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    gap: 2,
  },
  toggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: CultureTokens.indigo,
  },

});

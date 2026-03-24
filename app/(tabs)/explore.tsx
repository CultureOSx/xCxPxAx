import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, Platform, ActivityIndicator, FlatList
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, CategoryColors, gradients } from '@/constants/theme';
import { captureEvent } from '@/lib/analytics';
import { api } from '@/lib/api';
import { isIndigenousEvent } from '@/lib/indigenous';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FilterChip } from '@/components/FilterChip';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatEventDateTime } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';

// ─── Category data ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',       label: 'All',       icon: 'apps',            color: CultureTokens.indigo   },
  { id: 'indigenous',label: '🪃 Indigenous', icon: 'leaf',         color: CultureTokens.gold     },
  { id: 'music',     label: 'Music',     icon: 'musical-notes',   color: CategoryColors.music   },
  { id: 'dance',     label: 'Dance',     icon: 'body',            color: CategoryColors.dance   },
  { id: 'food',      label: 'Food',      icon: 'restaurant',      color: CategoryColors.food    },
  { id: 'art',       label: 'Art',       icon: 'color-palette',   color: CategoryColors.art     },
  { id: 'wellness',  label: 'Wellness',  icon: 'heart',           color: CategoryColors.wellness},
  { id: 'film',      label: 'Film',      icon: 'film',            color: CategoryColors.movies  },
  { id: 'workshop',  label: 'Workshop',  icon: 'construct',       color: CategoryColors.workshop},
  { id: 'heritage',  label: 'Heritage',  icon: 'library',         color: CategoryColors.heritage},
  { id: 'nightlife', label: 'Nightlife', icon: 'moon',            color: CategoryColors.nightlife},
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
  const key = raw.trim().toLowerCase().replace(/[_-]+/g,' ');
  return CAT_ALIAS[key] ?? key;
}

function eventMatchesCategory(event: EventData, catId: string): boolean {
  if (catId === 'all') return true;
  if (catId === 'indigenous') return isIndigenousEvent(event);
  const norm = normalizeCategory(event.category);
  if (norm === catId) return true;
  const tags = [...(event.tags ?? []), ...(event.cultureTag ?? [])];
  return tags.some(t => normalizeCategory(String(t)) === catId);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExploreEventCard({ event, wide }: { event: EventData; wide?: boolean }) {
  const colors = useColors();
  return (
    <Card
      padding={0}
      radius={14}
      style={[ec.card, wide && ec.cardWide]}
      onPress={() => {
        router.push({ pathname: '/event/[id]', params: { id: event.id } });
      }}
      accessibilityLabel={event.title}
    >
      <View style={[ec.imgWrap, wide && ec.imgWrapWide]}>
        <Image
          source={{ uri: event.imageUrl ?? undefined }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={150}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFillObject}
        />
        {(event.priceCents === 0 || event.isFree) ? (
          <View style={ec.freeBadge}>
            <Text style={ec.freeBadgeText}>FREE</Text>
          </View>
        ) : event.priceLabel ? (
          <View style={[ec.freeBadge, { backgroundColor: CultureTokens.indigo }]}>
            <Text style={ec.freeBadgeText}>{event.priceLabel}</Text>
          </View>
        ) : null}
        {event.isFeatured ? (
          <View style={ec.featuredDot}>
            <Ionicons name="star" size={10} color={CultureTokens.gold} />
          </View>
        ) : null}
      </View>
      <View style={ec.body}>
        <Text style={[ec.title, { color: colors.text }]} numberOfLines={2}>{event.title}</Text>
        <View style={ec.metaRow}>
          <Ionicons name="calendar-outline" size={11} color={CultureTokens.indigo} />
          <Text style={[ec.meta, { color: CultureTokens.indigo }]} numberOfLines={1}>
            {formatEventDateTime(event.date, event.time)}
          </Text>
        </View>
        {(event.venue || event.city) ? (
          <View style={ec.metaRow}>
            <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
            <Text style={[ec.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.venue || event.city}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const ec = StyleSheet.create({
  card:         { width: 200 },
  cardWide:     { width: '100%' },
  imgWrap:      { height: 120, position: 'relative', backgroundColor: '#1a1a2e' },
  imgWrapWide:  { height: 160 },
  freeBadge:    { position: 'absolute', top: 8, left: 8, backgroundColor: CultureTokens.saffron, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  freeBadgeText:{ fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#0B0B14' },
  featuredDot:  { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  body:         { padding: 10, gap: 4 },
  title:        { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta:         { fontSize: 11, fontFamily: 'Poppins_500Medium', flex: 1 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ focus?: string; source?: string; playlistId?: string; featuredArtistId?: string }>();
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { isDesktop, hPad } = useLayout();
  const { state } = useOnboarding();

  const requestedFocus = typeof params.focus === 'string' && CATEGORIES.some((category) => category.id === params.focus)
    ? params.focus
    : 'all';

  const [query,    setQuery]    = useState('');
  const [activeId, setActiveId] = useState<string>(requestedFocus);

  useEffect(() => {
    setActiveId(requestedFocus);
  }, [requestedFocus]);

  const { data: eventsData, isLoading } = useQuery<EventData[]>({
    queryKey: ['/api/events', state.country, state.city],
    queryFn: async () => {
      const res = await api.events.list({ city: state.city, country: state.country, pageSize: 80 });
      return res.events ?? [];
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
  const events = useMemo(
    () => (Array.isArray(eventsData) ? eventsData : []),
    [eventsData],
  );

  const filtered = useMemo(() => {
    let list = events.filter(e => eventMatchesCategory(e, activeId));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.venue ?? '').toLowerCase().includes(q) ||
        (e.city  ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [events, activeId, query]);

  const featured  = useMemo(() => events.filter(e => e.isFeatured).slice(0, 6), [events]);
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

  return (
    <ErrorBoundary>
      <View style={[s.root, { backgroundColor: colors.background }]}>
        {/* ── Gradient top bar ── */}
        <LinearGradient
          colors={gradients.culturepassBrand as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: topInset }}
        >
          <View style={[s.header, { paddingHorizontal: hPad }]}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
              style={[s.backBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[s.headerTitle, { color: '#fff' }]}>Explore</Text>
              <Text style={[s.headerSub, { color: 'rgba(255,255,255,0.85)' }]}>{locationLabel}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/search')}
              style={[s.iconBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search" size={18} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Search bar ── */}
        <View style={[s.searchBar, { paddingHorizontal: hPad, marginBottom: 12 }]}>
          <View style={[s.searchWrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
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
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>
        </View>

          {/* ── Fixed category pills ── */}
          <View style={[s.catsWrap, { backgroundColor: colors.background, paddingVertical: 10, paddingBottom: 6 }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[s.catsScroll, { paddingHorizontal: hPad }]}
            >
              {CATEGORIES.map(cat => (
                <FilterChip
                  key={cat.id}
                  item={cat}
                  isActive={activeId === cat.id}
                  onPress={() => handleCatPress(cat.id)}
                  size="small"
                />
              ))}
            </ScrollView>
          </View>

          {/* ── High-Performance Native FlatList Grid ── */}
          <View style={{ flex: 1, paddingHorizontal: hPad }}>
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              numColumns={gridCols}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListHeaderComponent={
                <>
                  {/* ── Featured section (only when query/category = all) ── */}
                  {activeId === 'all' && query === '' && featured.length > 0 && (
                    <View style={s.section}>
                      <View style={s.sectionHeader}>
                        <View style={s.sectionDot} />
                        <Text style={[s.sectionTitle, { color: colors.text }]}>Featured</Text>
                        <View style={s.sectionFlex} />
                        <Pressable onPress={() => router.push('/events')}>
                          <Text style={[s.seeAll, { color: CultureTokens.indigo }]}>See all</Text>
                        </Pressable>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12 }}
                      >
                        {featured.map(ev => (
                          <ExploreEventCard key={ev.id} event={ev} />
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* ── Results Header ── */}
                  <View style={[s.sectionHeader, { marginTop: activeId === 'all' && query === '' && featured.length > 0 ? 28 : 12 }]}>
                    <View style={s.sectionDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>
                        {activeId === 'all' && query === '' ? 'Discover Sydney' :
                         query ? `"${query}"` :
                         CATEGORIES.find(c => c.id === activeId)?.label ?? 'Events'}
                      </Text>
                    </View>

                    {!isDesktop && (
                      <View style={[s.colToggle, { backgroundColor: colors.backgroundSecondary }]}>
                        <Pressable onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(); setCols(2); }} style={[s.toggleBtn, cols === 2 && s.toggleActive]}>
                          <Ionicons name="grid" size={12} color={cols === 2 ? '#FFFFFF' : colors.textTertiary} />
                        </Pressable>
                        <Pressable onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(); setCols(3); }} style={[s.toggleBtn, cols === 3 && s.toggleActive]}>
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

                  {/* ── Loading / Empty States ── */}
                  {isLoading && (
                    <View style={s.loadingWrap}>
                      <ActivityIndicator size="small" color={CultureTokens.indigo} />
                      <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading events…</Text>
                    </View>
                  )}
                  {!isLoading && filtered.length === 0 && (
                    <View style={s.emptyWrap}>
                      <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                        <Ionicons name="search-outline" size={28} color={colors.textTertiary} />
                      </View>
                      <Text style={[s.emptyTitle, { color: colors.text }]}>No events found</Text>
                      <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                        {query ? 'Try a different search' : 'Try a different category or location'}
                      </Text>
                      {(activeId !== 'all' || query !== '') && (
                        <View style={{ marginTop: 12 }}>
                          <Button variant="outline" pill onPress={() => { setActiveId('all'); setQuery(''); }}>Reset filters</Button>
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
  root:         { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  headerSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  searchBar:  {},
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', padding: 0 },

  catsWrap:   { paddingVertical: 10 },
  catsScroll: { gap: 8, paddingVertical: 2 },

  section:       { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionDot:    { width: 4, height: 18, borderRadius: 2, backgroundColor: CultureTokens.indigo },
  sectionTitle:  { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  sectionFlex:   { flex: 1 },
  seeAll:        { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  resultCount:   { fontSize: 12, fontFamily: 'Poppins_500Medium' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  loadingWrap:  { alignItems: 'center', paddingVertical: 48, gap: 10 },
  loadingText:  { fontSize: 14, fontFamily: 'Poppins_500Medium' },

  emptyWrap:   { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon:   { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 4 },
  emptyTitle:  { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  emptySub:    { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingHorizontal: 24 },
  resetBtn:    { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  resetBtnText:{ fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

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

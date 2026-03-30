import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, Platform
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLocations } from '@/hooks/useLocations';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useEventsList } from '@/hooks/queries/useEvents';
import { CultureTokens, CategoryColors } from '@/constants/theme';
import { captureEvent } from '@/lib/analytics';
import { isIndigenousEvent } from '@/lib/indigenous';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { formatEventDateTime } from '@/lib/dateUtils';
import type { EventData } from '@/shared/schema';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';

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

function ExploreEventCard({ event, index }: { event: EventData, index: number }) {
  const colors = useColors();
  const isIndigenous = isIndigenousEvent(event);
  
  // Height variation for masonry effect
  const imgHeights = [240, 180, 210, 260, 200];
  const imgHeight = imgHeights[index % imgHeights.length];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      accessibilityRole="button"
      accessibilityLabel={event.title}
      style={({ pressed }) => [
        ec.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        isIndigenous && { borderWidth: 2, borderColor: CultureTokens.gold },
      ]}
    >
      {/* Image */}
      <View style={[ec.imgWrap, { height: imgHeight, backgroundColor: colors.surfaceElevated }]}>
        <Image
          source={{ uri: event.imageUrl ?? undefined }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={150}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFillObject}
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
      </View>

      {/* Details below, centered */}
      <View style={ec.detailsWrap}>
        <Text style={[ec.imgTitle, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={[ec.imgDate, { color: CultureTokens.indigo }]} numberOfLines={1}>
          {formatEventDateTime(event.date, event.time)}
        </Text>
        {(event.venue || event.city) ? (
          <View style={ec.metaRowCentered}>
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
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
      web: { 
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)' 
      } as any,
    }),
  },
  imgWrap: {
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  detailsWrap: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 14,
    gap: 4,
  },
  freeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: CultureTokens.teal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  indigenousBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
    borderWidth: 1,
    borderColor: CultureTokens.gold + '60',
  },
  indigenousBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.gold,
  },
  featuredDot: {
    position: 'absolute',
    top: 8,
    left: 42,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  imgTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'left',
  },
  imgDate: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  metaRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-start',
  },
  meta: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'left',
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
  const isDark = useIsDark();
  const params = useLocalSearchParams<{ focus?: string; source?: string; playlistId?: string; featuredArtistId?: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { hPad, isDesktop, isTablet } = useLayout();

  const requestedFocus = params.focus ? params.focus : 'all';

  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(requestedFocus);

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

  const featured = useMemo(() => events.filter((e) => e.isFeatured).slice(0, 6), [events]);

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

        {/* ── Premium Glassmorphic Header ── */}
        <View style={{ paddingTop: topInset }}>
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '80' }]}
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background }]} />
          )}

          <View style={[s.header, { paddingHorizontal: hPad }]}>
            <View style={s.headerTitles}>
              <Text style={[s.headerTitle, { color: colors.text }]}>
                {activeId === 'indigenous' ? '🪃 Indigenous' : 'Explore'}
              </Text>
              <Text style={[s.headerSub, { color: colors.textSecondary }]}>
                {activeId === 'indigenous'
                  ? 'First Nations culture and events in '
                  : 'Discover what\u2019s happening in '}
                <Text style={{ color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }}>
                  {locationLabel}
                </Text>
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/search')}
              style={[s.searchIconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* ── Search bar ── */}
          <View style={[s.searchBarWrap, { paddingHorizontal: hPad }]}>
            <View style={[s.searchBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
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
          
          <View style={s.bottomBorder} />
        </View>

        {/* ── Event Grid & Content ── */}
        <View style={{ flex: 1 }}>
          <FlashList<EventData>
            key={`grid-${gridCols}`}
            data={filtered}
            extraData={gridCols}
            keyExtractor={(item: EventData) => item.id}
            numColumns={gridCols}
            {...({ estimatedItemSize: 280 } as any)}
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
                          <ExploreEventCard event={ev} index={index} />
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
            renderItem={({ item, index }: { item: EventData, index: number }) => (
              <View style={{ padding: colGap / 2, paddingHorizontal: hPad * 0.2 }}>
                 <ExploreEventCard event={item} index={index} />
              </View>
            )}
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  searchIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrap: {
    paddingBottom: 16,
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
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    padding: 0,
  },
  bottomBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(150,150,150,0.15)',
    width: '100%',
  },
  catsWrap: {
    paddingVertical: 16,
    marginHorizontal: -16, 
  },
  catsScroll: {
    gap: 12,
    paddingHorizontal: 16,
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  resultCount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  loadingWrap: {
    marginTop: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
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
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    marginBottom: 3,
  },
  indigenousBannerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
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

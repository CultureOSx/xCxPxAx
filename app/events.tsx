import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform,
  ActivityIndicator, FlatList, ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring,
  interpolateColor, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import EventCard from '@/components/EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { EventData, PaginatedEventsResponse } from '@/shared/schema';
import { CultureTokens } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { BackButton } from '@/components/ui/BackButton';

const isWeb = Platform.OS === 'web';

// ─── Types & constants ────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

type DateFilter = 'all' | 'today' | 'this_weekend' | 'past';
type PriceFilter = 'all' | 'free' | 'paid';

const PRICE_OPTIONS: { id: PriceFilter; label: string; icon: string }[] = [
  { id: 'all',  label: 'Any Price', icon: 'ticket-outline' },
  { id: 'free', label: 'Free',      icon: 'gift-outline' },
  { id: 'paid', label: 'Paid',      icon: 'cash-outline' },
];

const DATE_OPTIONS: { id: DateFilter; label: string; icon: string }[] = [
  { id: 'all',          label: 'Upcoming',    icon: 'calendar-outline'  },
  { id: 'today',        label: 'Today',       icon: 'today-outline'     },
  { id: 'this_weekend', label: 'Weekend',     icon: 'sunny-outline'     },
  { id: 'past',         label: 'Past',        icon: 'time-outline'      },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekendRange(now: Date) {
  const sat = new Date(now);
  sat.setHours(0, 0, 0, 0);
  sat.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return {
    start: sat.toLocaleDateString('en-CA'),
    end: sun.toLocaleDateString('en-CA'),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={[sl.text, { color: colors.textTertiary }]}>{children}</Text>
  );
}
const sl = StyleSheet.create({
  text: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
});

// ─── Animated chip ────────────────────────────────────────────────────────────
function AnimatedChip({
  label, active, onPress, icon,
}: {
  label: string; active: boolean; onPress: () => void; icon?: string;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(pressed.value, [0, 1],
      active ? [CultureTokens.indigo, CultureTokens.indigo + 'cc'] : [colors.surface, colors.surfaceElevated]),
  }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.93); pressed.value = withTiming(1, { duration: 120 }); }}
      onPressOut={() => { scale.value = withSpring(1); pressed.value = withTiming(0, { duration: 120 }); }}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[cc.chip, { borderColor: active ? CultureTokens.indigo : colors.borderLight }, animStyle]}>
        {icon ? <Ionicons name={icon as never} size={14} color={active ? '#FFFFFF' : colors.textSecondary} /> : null}
        <Text style={[cc.text, { color: active ? '#FFFFFF' : colors.textSecondary }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// Category chips — horizontal scroll
function CategoryChips({
  categories, selected, onSelect,
}: {
  categories: string[]; selected: string; onSelect: (c: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingRight: 20 }}
    >
      {categories.map(cat => (
        <AnimatedChip
          key={cat}
          label={cat}
          active={selected === cat}
          onPress={() => onSelect(cat)}
          icon={cat === 'All' ? 'apps' : undefined}
        />
      ))}
    </ScrollView>
  );
}
const cc = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});

// Date segmented control — fixed 3 options, no scroll needed
function DateSegment({
  selected, onSelect,
}: {
  selected: DateFilter; onSelect: (d: DateFilter) => void;
}) {
  const colors = useColors();
  return (
    <View style={[ds.wrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      {DATE_OPTIONS.map((opt, i) => {
        const active = selected === opt.id;
        return (
          <Pressable
            key={opt.id}
            style={[
              ds.seg,
              active && { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '30' },
              active && Platform.OS !== 'web' && { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              onSelect(opt.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
          >
            <Ionicons
              name={(active ? opt.icon.replace('-outline', '') : opt.icon) as never}
              size={14}
              color={active ? CultureTokens.indigo : colors.textTertiary}
            />
            <Text style={[ds.text, { color: active ? CultureTokens.indigo : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
function PriceSegment({
  selected, onSelect,
}: {
  selected: PriceFilter; onSelect: (p: PriceFilter) => void;
}) {
  const colors = useColors();
  return (
    <View style={[ds.wrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      {PRICE_OPTIONS.map((opt) => {
        const active = selected === opt.id;
        return (
          <Pressable
            key={opt.id}
            style={[
              ds.seg,
              active && { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '30' },
              active && Platform.OS !== 'web' && { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
            ]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync();
              onSelect(opt.id);
            }}
          >
            <Ionicons name={active ? opt.icon.replace('-outline', '') as never : opt.icon as never} size={14} color={active ? CultureTokens.indigo : colors.textTertiary} />
            <Text style={[ds.text, { color: active ? CultureTokens.indigo : colors.textSecondary }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const ds = StyleSheet.create({
  wrap:     { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 3 },
  seg:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 9 },
  segFirst: {},
  segLast:  {},
  text:     { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});

// Active filter summary pill
function ActiveFilterBadge({ count: _count, label, onClear }: { count: number; label: string; onClear: () => void }) {
  return (
    <Pressable
      style={[af.wrap, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
      onPress={onClear}
      accessibilityRole="button"
      accessibilityLabel={`Clear filter: ${label}`}
    >
      <Text style={[af.label, { color: CultureTokens.indigo }]}>{label}</Text>
      <Ionicons name="close-circle" size={14} color={CultureTokens.indigo} />
    </Pressable>
  );
}
const af = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  label: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AllEventsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const colors  = useColors();
  const { state } = useOnboarding();
  const { isDesktop, hPad } = useLayout();

  // Force minimum 2 columns on mobile, 3 on desktop
  const numCols   = isDesktop ? 3 : 2;
  const colGap    = isDesktop ? 20 : 12;

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFilter, setDateFilter]             = useState<DateFilter>('all');
  const [priceFilter, setPriceFilter]           = useState<PriceFilter>('all');
  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const queryKey = useMemo(() => [
    '/api/events/paginated', state.country, state.city, selectedCategory, dateFilter, priceFilter, today
  ], [state.country, state.city, selectedCategory, dateFilter, priceFilter, today]);

  const {
    data, isLoading, isFetchingNextPage,
    fetchNextPage, hasNextPage, refetch, isRefetching,
  } = useInfiniteQuery<PaginatedEventsResponse>({
    queryKey,
    queryFn: ({ pageParam }) => {
      let dateFrom: string | undefined = new Date().toLocaleDateString('en-CA');
      let dateTo: string | undefined;

      if (dateFilter === 'today') {
        dateTo = dateFrom;
      } else if (dateFilter === 'this_weekend') {
        const weekend = getWeekendRange(new Date());
        dateFrom = weekend.start;
        dateTo = weekend.end;
      } else if (dateFilter === 'past') {
        dateTo = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
        dateFrom = undefined; // No lower bound for past
      } else if (dateFilter === 'all') {
        // Default is already 'today' as starting point for upcoming
      }

      return api.events.list({
        country:  state.country  || undefined,
        city:     state.city     || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        isFree:   priceFilter === 'free' ? true : priceFilter === 'paid' ? false : undefined,
        page:     (pageParam as number) ?? 1,
        pageSize: PAGE_SIZE,
        dateFrom: dateFrom,
        dateTo: dateTo,
      })
    },
    initialPageParam: 1,
    getNextPageParam: last => last.hasNextPage ? last.page + 1 : undefined,
  });

  const allEvents: EventData[] = useMemo(
    () => {
      if (!data?.pages) return [];
      return data.pages.flatMap(p => Array.isArray(p?.events) ? p.events : []) ?? [];
    },
    [data],
  );

  const visibleEvents = allEvents;


  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of allEvents) {
      if (!e.category) continue;
      const key = e.category.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, e.category.trim());
    }
    return ['All', ...Array.from(seen.values())];
  }, [allEvents]);

  const filtersActive = selectedCategory !== 'All' || dateFilter !== 'all' || priceFilter !== 'all';

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item, index }: { item: EventData; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 60, 400)).springify().damping(18)}
      style={{ flex: 1 }}
    >
      <EventCard event={item} />
    </Animated.View>
  ), []);

  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'your region';

  return (
    <ErrorBoundary>
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset }]}>

        {/* ── Header ── */}
        <Animated.View entering={FadeInUp.duration(320).springify()} style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.divider, backgroundColor: colors.background }]}>
          <BackButton fallback="/(tabs)" style={[s.backBtn, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]} />

          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Events</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location" size={10} color={CultureTokens.indigo} />
              <Text style={[s.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationLabel}
                {!isLoading && visibleEvents.length > 0
                  ? ` · ${visibleEvents.length.toLocaleString()} matches`
                  : ''}
              </Text>
            </View>
          </View>

          {/* Refresh button */}
          <Pressable
            onPress={() => refetch()}
            style={[s.iconBtn, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh events"
          >
            {isRefetching
              ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
              : <Ionicons name="refresh" size={18} color={colors.text} />}
              {!isWeb && <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />}
          </Pressable>
        </Animated.View>

        {/* ── Centred content shell ── */}
        <View style={[s.shell, isDesktop && s.shellDesktop]}>

          {/* ── Filter panel ── */}
          <View style={[s.filterPanel, { paddingHorizontal: hPad, borderBottomColor: colors.divider }]}>

            {/* Category row */}
            <View style={s.filterSection}>
              <SectionLabel>Category</SectionLabel>
              <CategoryChips
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </View>

            {/* Date row */}
            <View style={s.filterSection}>
              <SectionLabel>Date</SectionLabel>
              <DateSegment selected={dateFilter} onSelect={setDateFilter} />
            </View>

            {/* Price row */}
            <View style={s.filterSection}>
              <SectionLabel>Price</SectionLabel>
              <PriceSegment selected={priceFilter} onSelect={setPriceFilter} />
            </View>

            {/* Active filter summary */}
            {filtersActive ? (
              <View style={s.activeRow}>
                {selectedCategory !== 'All' ? (
                  <ActiveFilterBadge
                    count={0}
                    label={selectedCategory}
                    onClear={() => setSelectedCategory('All')}
                  />
                ) : null}
                {dateFilter !== 'all' ? (
                  <ActiveFilterBadge
                    count={0}
                    label={DATE_OPTIONS.find(d => d.id === dateFilter)!.label}
                    onClear={() => setDateFilter('all')}
                  />
                ) : null}
                {priceFilter !== 'all' ? (
                  <ActiveFilterBadge
                    count={0}
                    label={PRICE_OPTIONS.find(p => p.id === priceFilter)!.label}
                    onClear={() => setPriceFilter('all')}
                  />
                ) : null}
                <Pressable
                  onPress={() => { setSelectedCategory('All'); setDateFilter('all'); setPriceFilter('all'); }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all filters"
                >
                  <Text style={[s.clearAll, { color: colors.textTertiary }]}>Clear all</Text>
                </Pressable>
              </View>
            ) : null}

          </View>

          {/* ── Event grid ── */}
          {isLoading ? (
            <FlatList
              key={`skeleton-${numCols}`}
              data={Array.from({ length: 9 })}
              renderItem={() => <View style={{ flex: 1 }}><EventCardSkeleton /></View>}
              keyExtractor={(_, i) => `sk-${i}`}
              numColumns={numCols}
              columnWrapperStyle={numCols > 1 ? { gap: colGap } : undefined}
              contentContainerStyle={[s.list, { paddingHorizontal: hPad, gap: colGap }]}
              scrollEnabled={false}
            />
          ) : (
            <FlatList
              key={`events-${numCols}`}
              data={visibleEvents}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              numColumns={numCols}
              columnWrapperStyle={numCols > 1 ? { gap: colGap } : undefined}
              contentContainerStyle={[s.list, { paddingHorizontal: hPad, gap: colGap, paddingBottom: bottomInset + 80 }]}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              refreshing={isRefetching}
              onRefresh={refetch}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={() => {
                if (isFetchingNextPage) return (
                  <View style={s.listFooter}>
                    <ActivityIndicator size="small" color={CultureTokens.indigo} />
                    <Text style={[s.listFooterText, { color: colors.textTertiary }]}>Loading more…</Text>
                  </View>
                );
                if (!hasNextPage && allEvents.length > 0) return (
                  <View style={s.listFooter}>
                    <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                    <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
                      {visibleEvents.length} event{visibleEvents.length !== 1 ? 's' : ''} shown
                    </Text>
                    <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                  </View>
                );
                return null;
              }}
              ListEmptyComponent={
                <View style={s.emptyState}>
                  <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <Ionicons name="search-outline" size={28} color={colors.textTertiary} />
                  </View>
                  <Text style={[s.emptyTitle, { color: colors.text }]}>No events found</Text>
                  <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
                    {filtersActive
                      ? 'Try adjusting your category or date filters.'
                      : `No events yet in ${locationLabel}.`}
                  </Text>
                  {filtersActive ? (
                    <Pressable
                      style={[s.resetBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
                      onPress={() => { setSelectedCategory('All'); setDateFilter('all'); }}
                      accessibilityRole="button"
                    >
                      <Ionicons name="refresh-outline" size={14} color={CultureTokens.indigo} />
                      <Text style={[s.resetBtnText, { color: CultureTokens.indigo }]}>Reset filters</Text>
                    </Pressable>
                  ) : null}
                </View>
              }
            />
          )}

        </View>
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:      { flex: 1 },

  // Header
  header:         {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:        { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  iconBtn:        { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  headerTitle:    { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  headerSub:      { fontSize: 13, fontFamily: 'Poppins_500Medium' },

  // Shell
  shell:          { flex: 1 },
  shellDesktop:   { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  // Filter panel
  filterPanel:    { paddingTop: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 18 },
  filterSection:  { gap: 4 },
  activeRow:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  clearAll:       { fontSize: 13, fontFamily: 'Poppins_600SemiBold', paddingVertical: 5, textDecorationLine: 'underline' },

  // Grid
  list:           { paddingTop: 20, gap: 20 },

  // Footer
  listFooter:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 20, justifyContent: 'center' },
  listFooterText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1 },
  endLine:        { flex: 1, height: 1, opacity: 0.5 },

  // Empty
  emptyState:     { alignItems: 'center', paddingVertical: 100, paddingHorizontal: 40, gap: 14 },
  emptyIcon:      { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8, backgroundColor: 'rgba(44,42,114,0.05)' },
  emptyTitle:     { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  emptyDesc:      { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  resetBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 12 },
  resetBtnText:   { fontSize: 14, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
});

import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform, Alert,
  ActivityIndicator, FlatList, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import EventCard from '@/components/EventCard';
import { useAuth } from '@/lib/auth';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { EventData, PaginatedEventsResponse } from '@/shared/schema';
import { CultureTokens, TextStyles } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { BackButton } from '@/components/ui/BackButton';
import { AnimatedFilterChip } from '@/components/ui/AnimatedFilterChip';
import { EVENT_CATEGORIES } from '@/constants/eventCategories';

const isWeb = Platform.OS === 'web';

// ─── Types & constants ────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

type DateFilter =
  | 'all'
  | 'today'
  | 'this_weekend'
  | 'this_week'
  | 'next_week'
  | 'next_30_days'
  | 'past';

type PriceFilter = 'all' | 'free' | 'paid';

const DATE_OPTIONS: { id: DateFilter; label: string; icon: string }[] = [
  { id: 'all',          label: 'Upcoming',     icon: 'calendar-outline'  },
  { id: 'today',        label: 'Today',        icon: 'today-outline'     },
  { id: 'this_weekend', label: 'This Weekend', icon: 'sunny-outline'     },
  { id: 'this_week',    label: 'This Week',    icon: 'calendar-number-outline' },
  { id: 'next_week',    label: 'Next Week',    icon: 'arrow-forward-outline'   },
  { id: 'next_30_days', label: 'Next 30 Days', icon: 'calendar-clear-outline'  },
  { id: 'past',         label: 'Past',         icon: 'time-outline'      },
];

// ─── Date range helpers ───────────────────────────────────────────────────────

function toYMD(d: Date): string {
  return d.toLocaleDateString('en-CA'); // returns YYYY-MM-DD
}

function getDateRange(filter: DateFilter): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const today = toYMD(now);

  if (filter === 'today') return { dateFrom: today, dateTo: today };

  if (filter === 'this_weekend') {
    // Sat–Sun of the current week
    const day = now.getDay(); // 0=Sun, 6=Sat
    const sat = new Date(now);
    sat.setHours(0, 0, 0, 0);
    sat.setDate(now.getDate() + ((6 - day + 7) % 7));
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);
    return { dateFrom: toYMD(sat), dateTo: toYMD(sun) };
  }

  if (filter === 'this_week') {
    // Mon–Sun of the current calendar week
    const day = now.getDay();
    const mon = new Date(now);
    mon.setHours(0, 0, 0, 0);
    mon.setDate(now.getDate() - ((day + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { dateFrom: toYMD(mon), dateTo: toYMD(sun) };
  }

  if (filter === 'next_week') {
    const day = now.getDay();
    const nextMon = new Date(now);
    nextMon.setHours(0, 0, 0, 0);
    nextMon.setDate(now.getDate() + (8 - ((day + 6) % 7)));
    const nextSun = new Date(nextMon);
    nextSun.setDate(nextMon.getDate() + 6);
    return { dateFrom: toYMD(nextMon), dateTo: toYMD(nextSun) };
  }

  if (filter === 'next_30_days') {
    const end = new Date(now);
    end.setDate(now.getDate() + 30);
    return { dateFrom: today, dateTo: toYMD(end) };
  }

  if (filter === 'past') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return { dateTo: toYMD(yesterday) };
  }

  // 'all' / upcoming — from today onwards, no upper bound
  return { dateFrom: today };
}

function FilterDivider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={{ width: 1, height: 18, backgroundColor: colors.borderLight, marginHorizontal: 4, alignSelf: 'center' }} />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AllEventsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const colors  = useColors();
  const { state } = useOnboarding();
  const { isDesktop, hPad } = useLayout();

  const numCols = isDesktop ? 3 : 2;
  const colGap  = isDesktop ? 20 : 12;

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dateFilter, setDateFilter]             = useState<DateFilter>('all');
  const [priceFilter, setPriceFilter]           = useState<PriceFilter>('all');

  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const queryKey = useMemo(() => [
    '/api/events/paginated', state.country, state.city,
    selectedCategory, dateFilter, priceFilter, today,
  ], [state.country, state.city, selectedCategory, dateFilter, priceFilter, today]);

  const {
    data, isLoading, isFetchingNextPage,
    fetchNextPage, hasNextPage, refetch, isRefetching,
  } = useInfiniteQuery<PaginatedEventsResponse>({
    queryKey,
    queryFn: ({ pageParam }) => {
      const { dateFrom, dateTo } = getDateRange(dateFilter);
      return api.events.list({
        country:  state.country || undefined,
        city:     state.city    || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        isFree:   priceFilter === 'free' ? true : priceFilter === 'paid' ? false : undefined,
        page:     (pageParam as number) ?? 1,
        pageSize: PAGE_SIZE,
        dateFrom,
        dateTo,
      });
    },
    initialPageParam: 1,
    getNextPageParam: last => last.hasNextPage ? last.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });

  const allEvents: EventData[] = useMemo(
    () => data?.pages.flatMap(p => Array.isArray(p?.events) ? p.events : []) ?? [],
    [data],
  );

  const filtersActive = selectedCategory !== 'All' || dateFilter !== 'all' || priceFilter !== 'all';

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);


  const { user, hasRole } = useAuth();

  const handleEditEvent = useCallback((event: EventData) => {
    // Navigate to edit screen
    router.push({ pathname: '/event/[id]', params: { id: event.id, edit: '1' } });
  }, []);

  const handleDeleteEvent = useCallback((event: EventData) => {
    Alert.alert(
      'Delete event',
      `Remove "${event.title}"? This cancels the listing for attendees.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await api.events.remove(event.id);
                await queryClient.invalidateQueries({ queryKey: ['/api/events/paginated'] });
                await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
                await refetch();
              } catch (err) {
                const message =
                  err instanceof ApiError
                    ? err.isUnauthorized
                      ? 'Sign in again to delete this event.'
                      : err.message || 'Could not delete this event.'
                    : err instanceof Error
                      ? err.message
                      : 'Could not delete this event.';
                Alert.alert('Delete failed', message);
              }
            })();
          },
        },
      ],
    );
  }, [refetch]);

  const renderItem = useCallback(({ item, index }: { item: EventData; index: number }) => {
    const canEdit = !!user && (user.id === item.organizerId || hasRole('admin', 'platformAdmin', 'moderator'));
    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 60, 400)).springify().damping(18)}
        style={{ flex: 1 }}
      >
        <EventCard
          event={item}
          canEdit={canEdit}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      </Animated.View>
    );
  }, [user, hasRole, handleEditEvent, handleDeleteEvent]);

  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'your region';

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setDateFilter('all');
    setPriceFilter('all');
  }, []);

  return (
    <ErrorBoundary>
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset }]}>

        {/* ── Header ── */}
        <Animated.View
          entering={FadeInUp.duration(320).springify()}
          style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.divider, backgroundColor: colors.background }]}
        >
          <BackButton
            fallback="/(tabs)"
            style={[s.backBtn, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Events</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location" size={10} color={CultureTokens.indigo} />
              <Text style={[s.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationLabel}
                {!isLoading && allEvents.length > 0
                  ? ` · ${allEvents.length.toLocaleString()} shown`
                  : ''}
              </Text>
            </View>
          </View>
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

          {/* ── Filter rows ── */}
          <View style={[s.filterBlock, { borderBottomColor: colors.divider }]}>

            {/* Row 1: Free + Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[s.filterRow, { paddingHorizontal: hPad }]}
              accessibilityRole="tablist"
              accessibilityLabel="Category filters"
            >
              {/* "All" chip */}
              <AnimatedFilterChip
                label="All"
                active={selectedCategory === 'All' && priceFilter === 'all'}
                onPress={() => { setSelectedCategory('All'); setPriceFilter('all'); }}
                icon="apps"
              />

              {/* Free Events — special chip that sets isFree filter */}
              <AnimatedFilterChip
                label="Free Events"
                active={priceFilter === 'free'}
                onPress={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
                icon="gift-outline"
              />

              <FilterDivider colors={colors} />

              {/* Category chips — static canonical list */}
              {EVENT_CATEGORIES.map(cat => (
                <AnimatedFilterChip
                  key={cat.id}
                  label={cat.id}
                  active={selectedCategory === cat.id}
                  onPress={() => setSelectedCategory(selectedCategory === cat.id ? 'All' : cat.id)}
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
                    <Ionicons name="close" size={12} color={colors.textTertiary} />
                    <Text style={[s.clearBtnText, { color: colors.textTertiary }]}>Clear</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>

            {/* Row 2: Date filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[s.filterRow, s.filterRowDate, { paddingHorizontal: hPad }]}
              accessibilityRole="tablist"
              accessibilityLabel="Date filters"
            >
              {DATE_OPTIONS.map(opt => (
                <AnimatedFilterChip
                  key={opt.id}
                  label={opt.label}
                  active={dateFilter === opt.id}
                  onPress={() => setDateFilter(opt.id)}
                  icon={opt.icon}
                />
              ))}
            </ScrollView>
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
              data={allEvents}
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
                      {allEvents.length} event{allEvents.length !== 1 ? 's' : ''} shown
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
                      ? 'Try adjusting your filters or expanding the date range.'
                      : `No events yet in ${locationLabel}.`}
                  </Text>
                  {filtersActive && (
                    <Pressable
                      style={[s.resetBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
                      onPress={clearFilters}
                      accessibilityRole="button"
                    >
                      <Ionicons name="refresh-outline" size={14} color={CultureTokens.indigo} />
                      <Text style={[s.resetBtnText, { color: CultureTokens.indigo }]}>Reset filters</Text>
                    </Pressable>
                  )}
                </View>
              }
            />
          )}
        </View>
      {/* ── Floating Action Button (FAB) for Create Event ── */}
      <Pressable
        onPress={() => router.push('/event/create')}
        style={({ pressed }) => [
          {
            position: 'absolute',
            right: isDesktop ? hPad + 32 : 24,
            bottom: isDesktop ? 48 : 24,
            zIndex: 100,
            backgroundColor: CultureTokens.indigo,
            borderRadius: 32,
            width: 64,
            height: 64,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Create new event"
      >
        <Ionicons name="add-circle" size={40} color="#fff" />
      </Pressable>
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:     { flex: 1 },

  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:       { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  iconBtn:       { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  headerTitle:   { ...TextStyles.title2, lineHeight: 26 },
  headerSub:     { ...TextStyles.chip, lineHeight: 18 },

  shell:         { flex: 1 },
  shellDesktop:  { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  // Filter block — two rows
  filterBlock:   { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingBottom: 4, gap: 6 },
  filterRow:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterRowDate: { paddingBottom: 4 },
  clearBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  clearBtnText:  { ...TextStyles.captionSemibold, lineHeight: 17 },

  list:          { paddingTop: 20, gap: 20 },
  listFooter:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 20, justifyContent: 'center' },
  listFooterText:{ ...TextStyles.cardTitle, textTransform: 'uppercase', letterSpacing: 1, lineHeight: 20 },
  endLine:       { flex: 1, height: 1, opacity: 0.5 },

  emptyState:    { alignItems: 'center', paddingVertical: 100, paddingHorizontal: 40, gap: 14 },
  emptyIcon:     { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  emptyTitle:    { ...TextStyles.title3, lineHeight: 24 },
  emptyDesc:     { ...TextStyles.callout, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  resetBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 12 },
  resetBtnText:  { ...TextStyles.cardTitle, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 19 },
});

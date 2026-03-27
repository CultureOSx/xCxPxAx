import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCouncil } from '@/hooks/useCouncil';
import { useEventsList } from '@/hooks/queries/useEvents';
import { ticketKeys } from '@/hooks/queries/keys';
import type { EventData, Ticket } from '@/shared/schema';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { FilterChipRow } from '@/components/FilterChip';


const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function formatPrice(cents: number) {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(0)}`;
}

function toSafeDateKey(value: string | undefined | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

// ---------------------------------------------------------------------------
// EventRow sub-component
// ---------------------------------------------------------------------------
function EventRow({
  event,
  colors,
  isAuthenticated,
  isWeb,
}: {
  event: EventData;
  colors: ReturnType<typeof useColors>;
  isAuthenticated: boolean;
  isWeb: boolean;
}) {
  const isDark = useIsDark();
  const safeDate = toSafeDateKey(event.date);
  const dayNum = safeDate ? new Date(`${safeDate}T00:00:00`).getDate() : null;
  const monthAbbr = safeDate ? MONTHS_SHORT[new Date(`${safeDate}T00:00:00`).getMonth()] : 'TBA';

  const isCouncilEvent =
    event.category === 'council' || event.category === 'Council' || event.category === 'civic';
  const isFree = (event.priceCents ?? 0) === 0;

  const accentColor = isCouncilEvent ? CultureTokens.teal : CultureTokens.gold;

  const handlePress = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={event.title}
      style={({ pressed }) => [
        evRow.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
            android: { elevation: 2 },
            web: { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' } as any,
          }),
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* Left date block */}
      <BlurView intensity={isDark ? 30 : 50} tint="dark" style={[evRow.dateBlock, { backgroundColor: accentColor + '22' }]}>
        {dayNum !== null ? (
          <>
            <Text style={[evRow.dateDay, { color: accentColor }]}>{dayNum}</Text>
            <Text style={[evRow.dateMonth, { color: accentColor + 'CC' }]}>{monthAbbr}</Text>
          </>
        ) : (
          <Text style={[evRow.dateTba, { color: accentColor }]}>TBA</Text>
        )}
      </BlurView>

      {/* Content */}
      <View style={evRow.content}>
        <Text style={[evRow.title, { color: colors.text }]} numberOfLines={2}>
          {event.title}
        </Text>
        {(event.venue || event.city) ? (
          <View style={evRow.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
            <Text style={[evRow.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.venue || event.city}
            </Text>
          </View>
        ) : null}
        <View style={evRow.badgeRow}>
          <View
            style={[
              evRow.priceBadge,
              isFree
                ? { backgroundColor: CultureTokens.teal + '18', borderColor: CultureTokens.teal + '40' }
                : { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo + '40' },
            ]}
          >
            <Text
              style={[
                evRow.priceText,
                { color: isFree ? CultureTokens.teal : CultureTokens.indigo },
              ]}
            >
              {formatPrice(event.priceCents ?? 0)}
            </Text>
          </View>
          {event.category ? (
            <View style={[evRow.catChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
              <Text style={[evRow.catText, { color: colors.textTertiary }]} numberOfLines={1}>
                {event.category}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Thumbnail */}
      {event.imageUrl ? (
        <Image
          source={{ uri: event.imageUrl }}
          style={[evRow.thumb, { backgroundColor: colors.backgroundSecondary }]}
          contentFit="cover"
        />
      ) : null}
    </Pressable>
  );
}

const evRow = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
  },
  dateBlock: {
    width: 60,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 2,
  },
  dateDay: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 26,
  },
  dateMonth: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTba: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 5,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  priceText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  catText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    margin: 10,
  },
});

// ---------------------------------------------------------------------------
// Main CalendarScreen
// ---------------------------------------------------------------------------
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();

  const { isDesktop, isTablet, width } = useLayout();
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && isDesktop;

  const topInset = isWeb ? 0 : insets.top;
  const contentMaxWidth = isDesktopWeb ? 1120 : isTablet ? 840 : width;
  const contentHorizontalPadding = isWeb ? (isDesktopWeb ? 32 : 20) : 0;

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: councilData } = useCouncil();
  const council = councilData?.council;
  const councilEvents = useMemo(() => councilData?.events ?? [], [councilData]);

  const { user, isAuthenticated, userId } = useAuth();

  const { data: eventsPage, isLoading } = useEventsList({
    city: user?.city,
    country: user?.country,
    pageSize: 300,
  });
  const allEventsRaw = useMemo(() => eventsPage?.events ?? [], [eventsPage]);

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ticketKeys.forUser(userId ?? ''),
    queryFn: () => api.tickets.forUser(userId!),
    enabled: !!userId,
  });

  // rsvps, likes, and interests are backed by stub endpoints (return []).
  // Kept as typed empty-array queries until real endpoints land.
  const rsvps = useMemo<unknown[]>(() => [], []);
  const likes = useMemo<unknown[]>(() => [], []);
  const interests = useMemo<unknown[]>(() => [], []);

  const allEvents = useMemo(() => {
    const ids = new Set();
    const merged: any[] = [];

    [...allEventsRaw, ...councilEvents].forEach((ev: any) => {
      const eid = ev.id || ev._id || ev.id?.toString();
      if (eid && !ids.has(eid)) {
        merged.push(ev);
        ids.add(eid);
      } else if (!eid) {
        merged.push(ev);
      }
    });

    return merged as EventData[];
  }, [allEventsRaw, councilEvents]);

  const [activeChip, setActiveChip] = useState('All');

  const filteredEvents = useMemo(() => {
    let events = allEvents;
    switch (activeChip) {
      case 'All':
        break;
      case 'Today': {
        const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
        events = events.filter((e) => toSafeDateKey(e.date) === todayStr);
        break;
      }
      case 'My Events':
        if (isAuthenticated) {
          const rsvpIds = new Set((rsvps as any[]).map((r: any) => r.eventId));
          events = events.filter((e) => rsvpIds.has(e.id));
        }
        break;
      case 'Tickets':
        if (isAuthenticated) {
          const ticketIds = new Set((tickets as any[]).map((t: any) => t.eventId));
          events = events.filter((e) => ticketIds.has(e.id));
        }
        break;
      case 'Council':
        events = events.filter((e) => (e as any).councilId);
        break;
      case 'Interests':
        if (isAuthenticated) {
          const likeIds = new Set((likes as any[]).map((l: any) => l.eventId));
          const interestTags = new Set((interests as any[]).map((i: any) => i.interestTag));
          events = events.filter(
            (e) =>
              likeIds.has(e.id) ||
              (e.tags && e.tags.some((tag: string) => interestTags.has(tag))),
          );
        }
        break;
      default:
        events = events.filter((e) => {
          const cat = (e.category || '').toLowerCase();
          const target = activeChip.toLowerCase();
          return cat === target || ((e as any).councilId && activeChip === 'Council');
        });
    }
    return events;
  }, [activeChip, allEvents, tickets, rsvps, likes, interests, isAuthenticated, today]);

  const eventsInMonthCount = useMemo(() => {
    return allEvents.filter((e) => {
      const dk = toSafeDateKey(e.date);
      if (!dk) return false;
      const d = new Date(`${dk}T00:00:00`);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [allEvents, currentMonth, currentYear]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    filteredEvents.forEach((e) => {
      const dateKey = toSafeDateKey(e.date);
      if (dateKey) set.add(dateKey);
    });
    return set;
  }, [filteredEvents]);



  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((e) => toSafeDateKey(e.date) === selectedDate);
  }, [filteredEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return filteredEvents
      .filter((e) => {
        const eventDate = toSafeDateKey(e.date);
        if (!eventDate) return false;
        const dateObj = new Date(`${eventDate}T00:00:00`);
        return (
          dateObj.getTime() >= now.getTime() &&
          dateObj.getTime() <= now.getTime() + sevenDays
        );
      })
      .slice(0, 10);
  }, [filteredEvents]);

  const civicReminders = useMemo(() => {
    return filteredEvents
      .filter((e) => {
        const eventDate = toSafeDateKey(e.date);
        if (!eventDate) return false;
        const dateObj = new Date(`${eventDate}T00:00:00`);
        return (
          (e.category === 'council' ||
            e.category === 'civic' ||
            (e as any).councilId) &&
          dateObj.getMonth() === currentMonth &&
          dateObj.getFullYear() === currentYear
        );
      })
      .map((e) => ({
        id: e.id,
        title: e.title,
        dateKey: toSafeDateKey(e.date),
        note: e.description,
      }));
  }, [filteredEvents, currentMonth, currentYear]);

  const prevMonth = useCallback(() => {
    if (!isWeb) Haptics.selectionAsync();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [currentMonth, isWeb]);

  const nextMonth = useCallback(() => {
    if (!isWeb) Haptics.selectionAsync();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [currentMonth, isWeb]);

  const goToday = useCallback(() => {
    if (!isWeb) Haptics.selectionAsync();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    setSelectedDate(todayStr);
  }, [today, isWeb]);

  const handleChipSelect = useCallback(
    (id: string) => {
      setActiveChip(id);
      if (id === 'Today') {
        goToday();
      }
    },
    [goToday],
  );

  // Formatted "Today" label for the subheading
  const todayLabel = useMemo(() => {
    const dayName = DAYS[today.getDay()];
    return `Today · ${dayName} ${today.getDate()} ${MONTHS[today.getMonth()]}`;
  }, [today]);

  if (isLoading) {
    return (
      <ErrorBoundary>
        <View style={[s.loadingContainer, { backgroundColor: colors.background }]}>
          <View style={[s.loadingCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <ActivityIndicator size="large" color={CultureTokens.indigo} />
            <Text style={[s.loadingText, { color: colors.text }]}>Loading Calendar...</Text>
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[s.root, { backgroundColor: colors.background }]}>

        {/* ── Header with gradient tint ── */}
        <View style={{ paddingTop: topInset, backgroundColor: colors.background }}>
          <LinearGradient
            colors={[colors.background, CultureTokens.indigo + '12', colors.background] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.headerGradient}
          >
            {/* Month navigation */}
            <View style={s.monthNavRow}>
              {/* Left chevron pill */}
              <Pressable
                onPress={prevMonth}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                style={({ pressed }) => [
                  s.navPill,
                  { borderColor: colors.borderLight, backgroundColor: colors.surface },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>

              {/* Month + year */}
              <View style={s.monthCenter}>
                <Text style={[s.monthTitle, { color: colors.text }]}>
                  {MONTHS[currentMonth]} {currentYear}
                </Text>
                <Text style={[s.todaySubline, { color: colors.textSecondary }]}>
                  {todayLabel}
                </Text>
              </View>

              {/* Right chevron pill */}
              <Pressable
                onPress={nextMonth}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Next month"
                style={({ pressed }) => [
                  s.navPill,
                  { borderColor: colors.borderLight, backgroundColor: colors.surface },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* Events count badge */}
            <View style={s.eventsCountRow}>
              <View style={[s.eventsCountBadge, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '30' }]}>
                <Ionicons name="calendar-outline" size={13} color={CultureTokens.indigo} />
                <Text style={[s.eventsCountText, { color: CultureTokens.indigo }]}>
                  {eventsInMonthCount} events this month
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            maxWidth: contentMaxWidth,
            width: '100%',
            alignSelf: 'center',
            paddingHorizontal: contentHorizontalPadding,
          }}
        >
          {/* ── Filter chips ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 4 }}>
            <FilterChipRow
              selectedId={activeChip}
              onSelect={handleChipSelect}
              items={[
                { id: 'All',      label: 'All',      icon: 'apps' },
                { id: 'Today',    label: 'Today',    icon: 'today' },
                { id: 'Festival', label: 'Festival', icon: 'color-palette' },
                { id: 'Movie',    label: 'Movie',    icon: 'film' },
                { id: 'Workshop', label: 'Workshop', icon: 'hammer' },
                { id: 'Concert',  label: 'Concert',  icon: 'musical-notes' },
                { id: 'Food',     label: 'Food',     icon: 'restaurant' },
                { id: 'Civic',    label: 'Civic',    icon: 'business' },
              ]}
              size="small"
            />
          </View>

          <View style={isDesktopWeb ? s.desktopSplit : undefined}>
            <View style={isDesktopWeb ? s.desktopCalendarCol : undefined}>

              {/* ── Calendar card ── */}
              <View
                style={[
                  s.calCard,
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: colors.borderLight,
                    ...Platform.select({
                      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20 },
                      android: { elevation: 6 },
                      web: { boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.08)' } as any,
                    }),
                  },
                  isDesktopWeb && s.calCardCompact,
                ]}
              >
                {/* Day-of-week header row */}
                <View style={s.dayHeaders}>
                  {DAY_LETTERS.map((d, i) => (
                    <Text key={`${d}-${i}`} style={[s.dayHeaderText, { color: colors.textTertiary }]}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Date grid */}
                <View style={s.daysGrid}>
                  {days.map((day, idx) => {
                    if (day === null) {
                      return <View key={`empty-${idx}`} style={s.dayCellEmpty} />;
                    }
                    const dateKey = formatDateKey(currentYear, currentMonth, day);
                    const hasEvent = eventDates.has(dateKey);
                    const isSelected = selectedDate === dateKey;
                    const isToday =
                      day === today.getDate() &&
                      currentMonth === today.getMonth() &&
                      currentYear === today.getFullYear();

                    return (
                      <Pressable
                        key={dateKey}
                        onPress={() => {
                          if (!isWeb) Haptics.selectionAsync();
                          setSelectedDate(isSelected ? null : dateKey);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${day} ${MONTHS[currentMonth]}`}
                        style={({ pressed }) => [
                          s.dayCell,
                          isSelected
                            ? { backgroundColor: CultureTokens.indigo }
                            : isToday
                            ? { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo + '60', borderWidth: 1.5 }
                            : { backgroundColor: 'transparent' },
                          pressed && { opacity: 0.65 },
                        ]}
                      >
                        <Text
                          style={[
                            s.dayText,
                            isSelected
                              ? { color: '#fff' }
                              : isToday
                              ? { color: CultureTokens.indigo }
                              : { color: colors.text },
                          ]}
                        >
                          {day}
                        </Text>
                        {hasEvent && (
                          <View
                            style={[
                              s.eventDot,
                              {
                                backgroundColor: isSelected
                                  ? '#fff'
                                  : CultureTokens.coral,
                              },
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* ── Selected date events ── */}
              {selectedDate && (
                <View style={s.eventsSection}>
                  <View style={s.sectionRow}>
                    <Text style={[s.sectionTitle, { color: colors.text }]}>
                      Events on{' '}
                      {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Text>
                    <Text style={[s.sectionCount, { color: colors.textTertiary }]}>
                      {selectedEvents.length}
                    </Text>
                  </View>
                  {selectedEvents.length === 0 ? (
                    <EmptyState
                      colors={colors}
                      title="No events this day"
                      subtitle="Explore nearby events"
                      onSubtitlePress={() => router.push('/events')}
                    />
                  ) : (
                    selectedEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        colors={colors}
                        isAuthenticated={isAuthenticated}
                        isWeb={isWeb}
                      />
                    ))
                  )}
                </View>
              )}
            </View>

            {/* ── Desktop: upcoming column ── */}
            {isDesktopWeb && (
              <View style={s.desktopUpcomingCol}>
                <View style={s.eventsSection}>
                  <View style={s.sectionRow}>
                    <Text style={[s.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
                    <Pressable onPress={() => router.push('/events')} accessibilityRole="link">
                      <Text style={[s.seeAll, { color: CultureTokens.indigo }]}>See all</Text>
                    </Pressable>
                  </View>
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        colors={colors}
                        isAuthenticated={isAuthenticated}
                        isWeb={isWeb}
                      />
                    ))
                  ) : (
                    <EmptyState
                      colors={colors}
                      title="No upcoming events"
                      subtitle="Check back soon"
                    />
                  )}
                </View>
              </View>
            )}
          </View>

          {/* ── Mobile: upcoming events (no date selected) ── */}
          {!isDesktopWeb && !selectedDate && upcomingEvents.length > 0 && (
            <View style={s.eventsSection}>
              <View style={s.sectionRow}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>All Upcoming</Text>
                <Pressable onPress={() => router.push('/events')} accessibilityRole="link">
                  <Text style={[s.seeAll, { color: CultureTokens.indigo }]}>See all</Text>
                </Pressable>
              </View>
              {upcomingEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  colors={colors}
                  isAuthenticated={isAuthenticated}
                  isWeb={isWeb}
                />
              ))}
            </View>
          )}

          {/* ── Civic reminders ── */}
          {!selectedDate && civicReminders.length > 0 && (
            <View style={s.eventsSection}>
              <View style={s.sectionRow}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>Civic Reminders</Text>
                <Pressable onPress={() => router.push('/events')} accessibilityRole="link">
                  <Text style={[s.seeAll, { color: CultureTokens.indigo }]}>All Events</Text>
                </Pressable>
              </View>
              {civicReminders.map((reminder) => (
                <View
                  key={reminder.id}
                  style={[
                    s.civicRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: CultureTokens.indigo + '30',
                      ...Platform.select({
                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
                        android: { elevation: 1 },
                        web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any,
                      }),
                    },
                  ]}
                >
                  <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[s.civicIcon, { backgroundColor: CultureTokens.indigo + '12' }]}>
                    <Ionicons name="shield-checkmark" size={18} color={CultureTokens.indigo} />
                  </BlurView>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.civicTitle, { color: colors.text }]}>{reminder.title}</Text>
                    <Text style={[s.civicSub, { color: colors.textSecondary }]}>
                      {reminder.dateKey
                        ? new Date(`${reminder.dateKey}T00:00:00`).toLocaleDateString(undefined, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}
                      {reminder.note ? ` · ${reminder.note}` : ''}
                      {council ? ` · ${council.name}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Empty (no upcoming, no date selected) ── */}
          {!isDesktopWeb && !selectedDate && upcomingEvents.length === 0 && (
            <View style={s.eventsSection}>
              <EmptyState
                colors={colors}
                title="No events found"
                subtitle="Try a different filter"
              />
            </View>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// EmptyState sub-component
// ---------------------------------------------------------------------------
function EmptyState({
  colors,
  title,
  subtitle,
  onSubtitlePress,
}: {
  colors: ReturnType<typeof useColors>;
  title: string;
  subtitle: string;
  onSubtitlePress?: () => void;
}) {
  return (
    <View
      style={[
        empty.wrap,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderLight,
        },
      ]}
    >
      <View style={[empty.iconCircle, { backgroundColor: CultureTokens.indigo + '14' }]}>
        <Ionicons name="calendar-outline" size={32} color={CultureTokens.indigo} />
      </View>
      <Text style={[empty.title, { color: colors.text }]}>{title}</Text>
      {onSubtitlePress ? (
        <Pressable onPress={onSubtitlePress} accessibilityRole="link">
          <Text style={[empty.link, { color: CultureTokens.indigo }]}>{subtitle} →</Text>
        </Pressable>
      ) : (
        <Text style={[empty.sub, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const empty = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  sub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  link: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  loadingText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    marginTop: 16,
  },

  // Header
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  navPill: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenter: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  monthTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  todaySubline: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  eventsCountRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  eventsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  eventsCountText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },

  // Calendar card
  calCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginTop: 0,
    elevation: 4,
  },
  calCardCompact: { marginHorizontal: 0 },

  // Day-of-week header
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Days grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    minHeight: 38,
    borderRadius: 10,
  },
  dayCell: {
    width: '14.28%',
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    gap: 2,
    paddingVertical: 4,
  },
  dayText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // Sections
  eventsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    flex: 1,
    flexWrap: 'wrap',
  },
  sectionCount: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    marginLeft: 8,
  },
  seeAll: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Civic reminders
  civicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    elevation: 2,
  },
  civicIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  civicTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  civicSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
    flexShrink: 1,
  },

  // Desktop split layout
  desktopSplit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
    paddingHorizontal: 20,
    width: '100%',
    alignSelf: 'center',
    marginTop: 12,
  },
  desktopCalendarCol: { flex: 1.5 },
  desktopUpcomingCol: { flex: 1 },
});

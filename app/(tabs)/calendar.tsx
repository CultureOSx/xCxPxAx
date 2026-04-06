import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable,
  Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, LiquidGlassTokens, webShadow } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
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
import { EventRow } from '@/components/calendar/EventRow';
import { CalendarEmptyState } from '@/components/calendar/CalendarEmptyState';
import {
  DAYS, DAY_LETTERS, MONTHS, getDaysInMonth,
  getFirstDayOfMonth, formatDateKey, toSafeDateKey,
} from '@/components/calendar/utils';
import { useCalendarSync } from '@/hooks/useCalendarSync';


// ---------------------------------------------------------------------------
// Main CalendarScreen
// ---------------------------------------------------------------------------
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { isDesktop, isTablet, width, hPad } = useLayout();
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && isDesktop;

  const topInset = isWeb ? 0 : insets.top;
  const contentMaxWidth = isDesktopWeb ? 1120 : isTablet ? 840 : width;
  const contentHorizontalPadding = isWeb ? (isDesktopWeb ? 32 : 20) : 0;

   
  const civicRowShadow = Platform.select<any>({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    android: { elevation: 1, shadowColor: '#000' },
    web: webShadow('0 2px 8px rgba(0,0,0,0.04)'),
  });

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: councilData } = useCouncil();
  const council = councilData?.council;
  const councilEvents = useMemo(() => councilData?.events ?? [], [councilData]);

  const { user, isAuthenticated, userId } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.username ?? null;

  // Calendar sync — personal events
  const {
    prefs: calPrefs,
    personalEvents,
    fetchPersonalEvents,
    exportEventToCalendar,
  } = useCalendarSync();

  // Load personal events whenever month changes
  useEffect(() => {
    if (!calPrefs.deviceConnected || !calPrefs.showPersonalEvents) return;
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    fetchPersonalEvents(start, end);
  }, [currentMonth, currentYear, calPrefs.deviceConnected, calPrefs.showPersonalEvents, fetchPersonalEvents]);

  // Build a set of personal-busy dates for the calendar grid
  const personalBusyDates = useMemo(() => {
    const set = new Set<string>();
    personalEvents.forEach((ev) => {
      const dk = formatDateKey(ev.startDate.getFullYear(), ev.startDate.getMonth(), ev.startDate.getDate());
      set.add(dk);
    });
    return set;
  }, [personalEvents]);

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

  const rsvps = useMemo<unknown[]>(() => [], []);
  const likes = useMemo<unknown[]>(() => [], []);
  const interests = useMemo<unknown[]>(() => [], []);

  const allEvents = useMemo(() => {
    const ids = new Set();
    const merged: EventData[] = [];
    [...allEventsRaw, ...councilEvents].forEach((ev: EventData) => {
      const eid = ev.id;
      if (eid && !ids.has(eid)) {
        merged.push(ev);
        ids.add(eid);
      } else if (!eid) {
        merged.push(ev);
      }
    });
    return merged;
  }, [allEventsRaw, councilEvents]);

  // My Events = events the user has tickets for
  const myEvents = useMemo(() => {
    if (!isAuthenticated || !(tickets as Ticket[]).length) return [];
    const ticketedIds = new Set((tickets as Ticket[]).map((t) => t.eventId));
    return allEvents.filter((e) => ticketedIds.has(e.id));
  }, [allEvents, tickets, isAuthenticated]);

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
          const rsvpIds = new Set((rsvps as { eventId: string }[]).map((r) => r.eventId));
          const ticketedIds = new Set((tickets as Ticket[]).map((t) => t.eventId));
          events = events.filter((e) => rsvpIds.has(e.id) || ticketedIds.has(e.id));
        }
        break;
      case 'Tickets':
        if (isAuthenticated) {
          const ticketIds = new Set((tickets as Ticket[]).map((t) => t.eventId));
          events = events.filter((e) => ticketIds.has(e.id));
        }
        break;
      case 'Council':
        events = events.filter((e) => e.councilId);
        break;
      case 'Interests':
        if (isAuthenticated) {
          const likeIds = new Set((likes as { eventId: string }[]).map((l) => l.eventId));
          const interestTags = new Set((interests as { interestTag: string }[]).map((i) => i.interestTag));
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
          return cat === target || (e.councilId && activeChip === 'Council');
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

  // My-events dot dates (tickets) — shown in teal
  const myEventDates = useMemo(() => {
    const set = new Set<string>();
    myEvents.forEach((e) => {
      const dk = toSafeDateKey(e.date);
      if (dk) set.add(dk);
    });
    return set;
  }, [myEvents]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((e) => toSafeDateKey(e.date) === selectedDate);
  }, [filteredEvents, selectedDate]);

  const selectedPersonalEvents = useMemo(() => {
    if (!selectedDate || !calPrefs.showPersonalEvents) return [];
    return personalEvents.filter((ev) => {
      const dk = formatDateKey(ev.startDate.getFullYear(), ev.startDate.getMonth(), ev.startDate.getDate());
      return dk === selectedDate;
    });
  }, [selectedDate, personalEvents, calPrefs.showPersonalEvents]);

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
          (e.category === 'council' || e.category === 'civic' || e.councilId) &&
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
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
    setSelectedDate(null);
  }, [currentMonth, isWeb]);

  const nextMonth = useCallback(() => {
    if (!isWeb) Haptics.selectionAsync();
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
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
      if (id === 'Today') goToday();
    },
    [goToday],
  );

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
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.ambientMesh}
          pointerEvents="none"
        />

        {/* ── Personalised Header (liquid glass) ── */}
        <View style={{ paddingTop: topInset }}>
          <LiquidGlassPanel
            borderRadius={0}
            bordered={false}
            style={{
              borderBottomWidth: StyleSheet.hairlineWidth * 2,
              borderBottomColor: colors.borderLight,
            }}
            contentStyle={[s.headerGlassInner, { paddingHorizontal: hPad }]}
          >
            {/* Row: chevron · month+name · chevron */}
            <View style={s.monthNavRow}>
                <Pressable
                  onPress={prevMonth}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  style={({ pressed }) => [
                  s.navPill,
                  { borderColor: colors.borderLight, backgroundColor: colors.primarySoft },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>

              <View style={s.monthCenter}>
                {/* Personalised calendar name */}
                {firstName ? (
                  <Text style={[s.calendarOwnerLabel, { color: colors.textTertiary }]}>
                    {firstName}&rsquo;s Calendar
                  </Text>
                ) : null}
                <Text style={[s.monthTitle, { color: colors.text }]}>
                  {MONTHS[currentMonth]} {currentYear}
                </Text>
                <Text style={[s.todaySubline, { color: colors.textSecondary }]}>
                  {todayLabel}
                </Text>
              </View>

              <View style={s.headerActions}>
                {/* Calendar Sync shortcut */}
                <Pressable
                  onPress={() => router.push('/settings/calendar-sync')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Calendar sync settings"
                  style={({ pressed }) => [
                    s.navPill,
                    { borderColor: colors.borderLight, backgroundColor: colors.primarySoft },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons
                    name={calPrefs.deviceConnected ? 'calendar' : 'calendar-outline'}
                    size={18}
                    color={calPrefs.deviceConnected ? CultureTokens.indigo : colors.text}
                  />
                </Pressable>

                <Pressable
                  onPress={nextMonth}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  style={({ pressed }) => [
                    s.navPill,
                    { borderColor: colors.borderLight, backgroundColor: colors.primarySoft },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </Pressable>
              </View>
            </View>

            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={[s.statBadge, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '30' }]}>
                <Ionicons name="calendar-outline" size={13} color={CultureTokens.indigo} />
                <Text style={[s.statText, { color: CultureTokens.indigo }]}>
                  {eventsInMonthCount} events
                </Text>
              </View>
              {isAuthenticated && myEvents.length > 0 && (
                <View style={[s.statBadge, { backgroundColor: CultureTokens.teal + '14', borderColor: CultureTokens.teal + '30' }]}>
                  <Ionicons name="ticket-outline" size={13} color={CultureTokens.teal} />
                  <Text style={[s.statText, { color: CultureTokens.teal }]}>
                    {myEvents.length} ticket{myEvents.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {calPrefs.deviceConnected && (
                <View style={[s.statBadge, { backgroundColor: CultureTokens.coral + '14', borderColor: CultureTokens.coral + '30' }]}>
                  <Ionicons name="link-outline" size={13} color={CultureTokens.coral} />
                  <Text style={[s.statText, { color: CultureTokens.coral }]}>Synced</Text>
                </View>
              )}
            </View>
          </LiquidGlassPanel>
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
          {/* ── Filter chips (glass rail) ── */}
          <LiquidGlassPanel
            borderRadius={LiquidGlassTokens.corner.mainCard}
            style={{ marginHorizontal: hPad, marginTop: 16, marginBottom: 8 }}
            contentStyle={{ paddingVertical: 10, paddingHorizontal: 4 }}
          >
            <FilterChipRow
              selectedId={activeChip}
              onSelect={handleChipSelect}
              items={[
                { id: 'All',      label: 'All',      icon: 'apps' },
                { id: 'Today',    label: 'Today',    icon: 'today' },
                ...(isAuthenticated ? [{ id: 'My Events', label: 'My Events', icon: 'ticket' as const }] : []),
                { id: 'Festival', label: 'Festival', icon: 'color-palette' },
                { id: 'Movie',    label: 'Movie',    icon: 'film' },
                { id: 'Workshop', label: 'Workshop', icon: 'hammer' },
                { id: 'Concert',  label: 'Concert',  icon: 'musical-notes' },
                { id: 'Food',     label: 'Food',     icon: 'restaurant' },
                { id: 'Civic',    label: 'Civic',    icon: 'business' },
              ]}
              size="small"
            />
          </LiquidGlassPanel>

          <View style={isDesktopWeb ? [s.desktopSplit, { paddingHorizontal: hPad }] : undefined}>
            <View style={isDesktopWeb ? s.desktopCalendarCol : undefined}>

              {/* ── Calendar card ── */}
              <LiquidGlassPanel
                borderRadius={LiquidGlassTokens.corner.mainCard}
                style={[s.calCardOuter, { marginHorizontal: isDesktopWeb ? 0 : hPad }, isDesktopWeb && s.calCardCompact]}
                contentStyle={s.calCardInner}
              >
                {/* Dot legend when personal events visible */}
                {calPrefs.deviceConnected && calPrefs.showPersonalEvents && (
                  <View style={s.dotLegend}>
                    <View style={s.legendItem}>
                      <View style={[s.legendDot, { backgroundColor: CultureTokens.coral }]} />
                      <Text style={[s.legendText, { color: colors.textTertiary }]}>Cultural events</Text>
                    </View>
                    <View style={s.legendItem}>
                      <View style={[s.legendDot, { backgroundColor: CultureTokens.teal }]} />
                      <Text style={[s.legendText, { color: colors.textTertiary }]}>Your tickets</Text>
                    </View>
                    <View style={s.legendItem}>
                      <View style={[s.legendDot, { backgroundColor: colors.textTertiary + '80' }]} />
                      <Text style={[s.legendText, { color: colors.textTertiary }]}>Personal busy</Text>
                    </View>
                  </View>
                )}

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
                    const hasMyEvent = myEventDates.has(dateKey);
                    const hasPersonal = personalBusyDates.has(dateKey) && calPrefs.showPersonalEvents;
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

                        {/* Event dots row */}
                        {(hasEvent || hasMyEvent || hasPersonal) && (
                          <View style={s.dotsRow}>
                            {hasEvent && (
                              <View style={[s.eventDot, { backgroundColor: isSelected ? '#fff' : CultureTokens.coral }]} />
                            )}
                            {hasMyEvent && (
                              <View style={[s.eventDot, { backgroundColor: isSelected ? '#fff' : CultureTokens.teal }]} />
                            )}
                            {hasPersonal && !isSelected && (
                              <View style={[s.eventDot, { backgroundColor: colors.textTertiary + '80' }]} />
                            )}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </LiquidGlassPanel>

              {/* ── Selected date events ── */}
              {selectedDate && (
                <View style={s.eventsSection}>
                  <View style={s.sectionRow}>
                    <Text style={[s.sectionTitle, { color: colors.text }]}>
                      Events on{' '}
                      {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                    </Text>
                    <Text style={[s.sectionCount, { color: colors.textTertiary }]}>
                      {selectedEvents.length + selectedPersonalEvents.length}
                    </Text>
                  </View>

                  {/* Personal busy blocks first (sorted by time) */}
                  {selectedPersonalEvents.map((pev) => (
                    <View
                      key={pev.id}
                      style={[s.busyBlock, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    >
                      <View style={[s.busyStripe, { backgroundColor: pev.color }]} />
                      <View style={s.busyContent}>
                        <View style={[s.busyBadge, { backgroundColor: colors.textTertiary + '15' }]}>
                          <Ionicons name="lock-closed" size={10} color={colors.textTertiary} />
                          <Text style={[s.busyBadgeText, { color: colors.textTertiary }]}>Personal · Private</Text>
                        </View>
                        <Text style={[s.busyTime, { color: colors.textSecondary }]}>
                          {pev.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {pev.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {pev.calendarName}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {selectedEvents.length === 0 && selectedPersonalEvents.length === 0 ? (
                    <CalendarEmptyState
                      colors={colors}
                      title="No events this day"
                      subtitle="Explore nearby events"
                      onSubtitlePress={() => router.push('/events')}
                    />
                  ) : (
                    selectedEvents.map((event) => (
                      <EventRowWithSync
                        key={event.id}
                        event={event}
                        colors={colors}
                        isAuthenticated={isAuthenticated}
                        isWeb={isWeb}
                        onAddToCalendar={() => exportEventToCalendar(event)}
                      />
                    ))
                  )}
                </View>
              )}
            </View>

            {/* ── Desktop: upcoming column ── */}
            {isDesktopWeb && (
              <View style={s.desktopUpcomingCol}>
                {/* My Events section */}
                {isAuthenticated && myEvents.length > 0 && (
                  <View style={s.eventsSection}>
                    <View style={s.sectionRow}>
                      <Text style={[s.sectionTitle, { color: colors.text }]}>
                        {firstName ? `${firstName}'s Events` : 'My Events'}
                      </Text>
                      <View style={[s.myEventsBadge, { backgroundColor: CultureTokens.teal + '15', borderColor: CultureTokens.teal + '30' }]}>
                        <Text style={[s.myEventsBadgeText, { color: CultureTokens.teal }]}>{myEvents.length}</Text>
                      </View>
                    </View>
                    {myEvents.slice(0, 5).map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        colors={colors}
                        isAuthenticated={isAuthenticated}
                        isWeb={isWeb}
                      />
                    ))}
                    {myEvents.length > 5 && (
                      <Pressable onPress={() => router.push('/tickets')} style={s.seeMoreBtn}>
                        <Text style={[s.seeAll, { color: CultureTokens.indigo }]}>See all {myEvents.length} tickets</Text>
                      </Pressable>
                    )}
                  </View>
                )}

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
                    <CalendarEmptyState colors={colors} title="No upcoming events" subtitle="Check back soon" />
                  )}
                </View>
              </View>
            )}
          </View>

          {/* ── Mobile: My Events (when authenticated + has tickets) ── */}
          {!isDesktopWeb && isAuthenticated && myEvents.length > 0 && !selectedDate && activeChip === 'All' && (
            <View style={s.eventsSection}>
              <View style={s.sectionRow}>
                <View style={s.myEventsTitleRow}>
                  <Ionicons name="ticket" size={16} color={CultureTokens.teal} />
                  <Text style={[s.sectionTitle, { color: colors.text }]}>
                    {firstName ? `${firstName}'s Events` : 'My Events'}
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/tickets')} accessibilityRole="link">
                  <Text style={[s.seeAll, { color: CultureTokens.indigo }]}>All tickets</Text>
                </Pressable>
              </View>
              {myEvents.slice(0, 3).map((event) => (
                <EventRowWithSync
                  key={event.id}
                  event={event}
                  colors={colors}
                  isAuthenticated={isAuthenticated}
                  isWeb={isWeb}
                  onAddToCalendar={() => exportEventToCalendar(event)}
                />
              ))}
              {myEvents.length > 3 && (
                <Pressable onPress={() => router.push('/tickets')} style={s.seeMoreBtn}>
                  <Text style={[s.seeMoreText, { color: CultureTokens.indigo }]}>
                    +{myEvents.length - 3} more tickets
                  </Text>
                </Pressable>
              )}
            </View>
          )}

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
                    { backgroundColor: colors.surface, borderColor: CultureTokens.indigo + '30' },
                    civicRowShadow,
                  ]}
                >
                  <View style={[s.civicIcon, { backgroundColor: CultureTokens.indigo + '12' }]}>
                    <Ionicons name="shield-checkmark" size={18} color={CultureTokens.indigo} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.civicTitle, { color: colors.text }]}>{reminder.title}</Text>
                    <Text style={[s.civicSub, { color: colors.textSecondary }]}>
                      {reminder.dateKey
                        ? new Date(`${reminder.dateKey}T00:00:00`).toLocaleDateString(undefined, {
                            weekday: 'long', day: 'numeric', month: 'short',
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

          {/* ── Empty ── */}
          {!isDesktopWeb && !selectedDate && upcomingEvents.length === 0 && (
            <View style={s.eventsSection}>
              <CalendarEmptyState
                colors={colors}
                title="No events found"
                subtitle="Try a different filter"
              />
            </View>
          )}

          {/* ── Calendar sync CTA (unauthenticated or not connected) ── */}
          {isAuthenticated && !calPrefs.deviceConnected && (
            <Pressable
              onPress={() => router.push('/settings/calendar-sync')}
              style={({ pressed }) => [
                s.syncCta,
                { backgroundColor: colors.surface, borderColor: CultureTokens.indigo + '30' },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[s.syncCtaIcon, { backgroundColor: CultureTokens.indigo + '15' }]}>
                <Ionicons name="calendar-outline" size={20} color={CultureTokens.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.syncCtaTitle, { color: colors.text }]}>Sync your calendar</Text>
                <Text style={[s.syncCtaSub, { color: colors.textSecondary }]}>
                  Connect Apple, Google or Outlook to see all your events in one place
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={CultureTokens.indigo} />
            </Pressable>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// EventRow with "Add to Calendar" action
// ---------------------------------------------------------------------------

function EventRowWithSync({
  event, colors, isAuthenticated, isWeb, onAddToCalendar,
}: {
  event: EventData;
  colors: ReturnType<typeof useColors>;
  isAuthenticated: boolean;
  isWeb: boolean;
  onAddToCalendar: () => void;
}) {
  return (
    <View style={syncStyles.wrapper}>
      <EventRow
        event={event}
        colors={colors}
        isAuthenticated={isAuthenticated}
        isWeb={isWeb}
      />
      <Pressable
        onPress={onAddToCalendar}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Add to calendar"
        style={({ pressed }) => [
          syncStyles.addBtn,
          { borderColor: CultureTokens.indigo + '30', backgroundColor: CultureTokens.indigo + '08' },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons name="calendar-outline" size={13} color={CultureTokens.indigo} />
        <Text style={[syncStyles.addBtnText, { color: CultureTokens.indigo }]}>Add to calendar</Text>
      </Pressable>
    </View>
  );
}

const syncStyles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginTop: -6,
    marginRight: 4,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  addBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1 },
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingCard: {
    borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1,
  },
  loadingText: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 15, marginTop: 16,
  },

  // Header (inside LiquidGlassPanel)
  headerGlassInner: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  monthNavRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  navPill: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  monthCenter: {
    alignItems: 'center', flex: 1, gap: 1,
  },
  calendarOwnerLabel: {
    fontFamily: 'Poppins_500Medium', fontSize: 11, letterSpacing: 0.3,
  },
  monthTitle: {
    fontFamily: 'Poppins_700Bold', fontSize: 22, letterSpacing: -0.3,
  },
  todaySubline: {
    fontFamily: 'Poppins_400Regular', fontSize: 12,
  },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 10,
  },
  statBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  statText: {
    fontFamily: 'Poppins_600SemiBold', fontSize: 11,
  },

  // Calendar card (LiquidGlassPanel shell + inner padding)
  calCardOuter: {
    marginTop: 0,
  },
  calCardCompact: { marginHorizontal: 0 },
  calCardInner: { padding: 16 },

  dotLegend: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 12, paddingHorizontal: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontFamily: 'Poppins_400Regular', fontSize: 10 },

  // Day-of-week header
  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeaderText: {
    flex: 1, textAlign: 'center', fontFamily: 'Poppins_600SemiBold',
    fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Days grid
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellEmpty: { width: '14.28%', minHeight: 38, borderRadius: 10 },
  dayCell: {
    width: '14.28%', minHeight: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginVertical: 2, paddingVertical: 4,
  },
  dayText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  eventDot: { width: 5, height: 5, borderRadius: 3 },

  // Sections
  eventsSection: { paddingHorizontal: 16, paddingTop: 24 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, flex: 1, flexWrap: 'wrap' },
  sectionCount: { fontFamily: 'Poppins_500Medium', fontSize: 13, marginLeft: 8 },
  seeAll: { fontFamily: 'Poppins_700Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },

  myEventsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  myEventsBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  myEventsBadgeText: { fontFamily: 'Poppins_700Bold', fontSize: 11 },

  seeMoreBtn: { alignItems: 'center', paddingVertical: 8 },
  seeMoreText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },

  // Personal busy block
  busyBlock: {
    flexDirection: 'row', borderRadius: 12, marginBottom: 8,
    borderWidth: 1, overflow: 'hidden',
  },
  busyStripe: { width: 4, alignSelf: 'stretch' },
  busyContent: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  busyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
  },
  busyBadgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10 },
  busyTime: { fontFamily: 'Poppins_400Regular', fontSize: 12 },

  // Civic reminders
  civicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, elevation: 2,
  },
  civicIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  civicTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, letterSpacing: -0.1 },
  civicSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 2, flexShrink: 1 },

  // Calendar sync CTA
  syncCta: {
    marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1,
  },
  syncCtaIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  syncCtaTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  syncCtaSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 2, lineHeight: 16 },

  // Desktop split layout
  desktopSplit: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 32,
    width: '100%', alignSelf: 'center', marginTop: 12,
  },
  desktopCalendarCol: { flex: 1.5 },
  desktopUpcomingCol: { flex: 1 },
});

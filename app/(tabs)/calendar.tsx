import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSaved } from '@/contexts/SavedContext';
import { api } from '@/lib/api';
import { useEventsList } from '@/hooks/queries/useEvents';
import { ticketKeys } from '@/hooks/queries/keys';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { EventRow } from '@/components/calendar/EventRow';
import EventCard from '@/components/Discover/EventCard';
import { CalendarEmptyState } from '@/components/calendar/CalendarEmptyState';
import { CultureTokens, gradients, TextStyles } from '@/constants/theme';
import { MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';
import { DAY_LETTERS, MONTHS, formatDateKey, getDaysInMonth, getFirstDayOfMonth, toSafeDateKey } from '@/components/calendar/utils';
import type { EventData, Ticket } from '@/shared/schema';

const IS_WEB = Platform.OS === 'web';

type CalendarFilter = 'All' | 'Today' | 'This Week' | 'My Tickets' | 'Interested' | 'Free' | 'Council';

function toDateFromKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDesktop, isTablet, width, hPad } = useLayout();
  const { user, userId, isAuthenticated } = useAuth();
  const { savedEvents } = useSaved();
  const { state: onboarding } = useOnboarding();
  const bottomInset = IS_WEB ? 0 : insets.bottom;
  const isDesktopWeb = IS_WEB && isDesktop;
  const contentMaxWidth = isDesktopWeb ? 1180 : isTablet ? 900 : width;
  const topInset = IS_WEB ? 0 : insets.top;

  const city = user?.city ?? onboarding?.city;
  const country = user?.country ?? onboarding?.country;

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()));
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>('All');
  const [refreshing, setRefreshing] = useState(false);

  const {
    prefs: calPrefs,
    personalEvents,
    fetchPersonalEvents,
    exportEventToCalendar,
  } = useCalendarSync();

  useEffect(() => {
    if (!calPrefs.deviceConnected || !calPrefs.showPersonalEvents) return;
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    fetchPersonalEvents(start, end);
  }, [calPrefs.deviceConnected, calPrefs.showPersonalEvents, currentMonth, currentYear, fetchPersonalEvents]);

  const { data: eventsPage, isLoading, refetch: refetchEvents } = useEventsList({
    city,
    country,
    pageSize: 300,
  });

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ticketKeys.forUser(userId ?? ''),
    queryFn: () => api.tickets.forUser(userId!),
    enabled: !!userId,
  });

  const allEvents = useMemo(() => eventsPage?.events ?? [], [eventsPage?.events]);

  const ticketedEventIds = useMemo(() => new Set(tickets.map((t) => t.eventId)), [tickets]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    return allEvents.filter((event) => {
      const key = toSafeDateKey(event.date);
      if (!key) return false;
      const dateObj = toDateFromKey(key);
      switch (activeFilter) {
        case 'All':
          return true;
        case 'Today':
          return key === todayKey;
        case 'This Week':
          return dateObj >= toDateFromKey(todayKey) && dateObj <= weekEnd;
        case 'My Tickets':
          return isAuthenticated && ticketedEventIds.has(event.id);
        case 'Free':
          return (event.priceCents ?? 0) === 0;
        case 'Interested':
          return savedEvents.includes(event.id);
        case 'Council':
          return Boolean(event.councilId) || event.category?.toLowerCase() === 'civic' || event.category?.toLowerCase() === 'council';
        default:
          return true;
      }
    });
  }, [allEvents, activeFilter, isAuthenticated, ticketedEventIds, savedEvents]);

  const eventsInCurrentMonth = useMemo(() => {
    return filteredEvents.filter((event) => {
      const key = toSafeDateKey(event.date);
      if (!key) return false;
      const d = toDateFromKey(key);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [filteredEvents, currentMonth, currentYear]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventData[]>();
    for (const event of filteredEvents) {
      const key = toSafeDateKey(event.date);
      if (!key) continue;
      const arr = map.get(key) ?? [];
      arr.push(event);
      map.set(key, arr);
    }
    return map;
  }, [filteredEvents]);

  const personalBusyDates = useMemo(() => {
    const set = new Set<string>();
    for (const event of personalEvents) {
      set.add(formatDateKey(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate()));
    }
    return set;
  }, [personalEvents]);

  const ticketDates = useMemo(() => {
    const set = new Set<string>();
    for (const event of allEvents) {
      const key = toSafeDateKey(event.date);
      if (!key) continue;
      if (ticketedEventIds.has(event.id)) set.add(key);
    }
    return set;
  }, [allEvents, ticketedEventIds]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate.get(selectedDate) ?? [];
  }, [eventsByDate, selectedDate]);

  const selectedPersonalEvents = useMemo(() => {
    if (!selectedDate || !calPrefs.showPersonalEvents) return [];
    return personalEvents.filter((ev) => {
      const key = formatDateKey(ev.startDate.getFullYear(), ev.startDate.getMonth(), ev.startDate.getDate());
      return key === selectedDate;
    });
  }, [selectedDate, personalEvents, calPrefs.showPersonalEvents]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((event) => {
        const key = toSafeDateKey(event.date);
        if (!key) return false;
        return toDateFromKey(key).getTime() >= now.getTime();
      })
      .sort((a, b) => {
        const aKey = toSafeDateKey(a.date);
        const bKey = toSafeDateKey(b.date);
        if (!aKey || !bKey) return 0;
        return toDateFromKey(aKey).getTime() - toDateFromKey(bKey).getTime();
      })
      .slice(0, 10);
  }, [filteredEvents]);

  const reminderEvents = useMemo(() => {
    const now = Date.now();
    const within48h = now + 48 * 60 * 60 * 1000;
    return filteredEvents
      .map((event) => {
        const dateMs = Date.parse(`${event.date}T${event.time ?? '00:00'}:00`);
        return { event, dateMs };
      })
      .filter((item) => Number.isFinite(item.dateMs) && item.dateMs >= now && item.dateMs <= within48h)
      .sort((a, b) => a.dateMs - b.dateMs)
      .slice(0, 5)
      .map((item) => item.event);
  }, [filteredEvents]);

  const conflictEvents = useMemo(() => {
    const keyed = filteredEvents
      .map((event) => ({ event, key: `${event.date}|${event.time ?? '00:00'}` }))
      .filter((entry) => entry.event.date);
    const counts = new Map<string, number>();
    keyed.forEach((entry) => counts.set(entry.key, (counts.get(entry.key) ?? 0) + 1));
    return keyed.filter((entry) => (counts.get(entry.key) ?? 0) > 1).map((entry) => entry.event).slice(0, 4);
  }, [filteredEvents]);

  const monthDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const first = getFirstDayOfMonth(currentYear, currentMonth);
    const grid: (number | null)[] = [];
    for (let i = 0; i < first; i += 1) grid.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) grid.push(d);
    return grid;
  }, [currentYear, currentMonth]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchEvents();
    } finally {
      setRefreshing(false);
    }
  }, [refetchEvents]);

  const prevMonth = useCallback(() => {
    if (!IS_WEB) Haptics.selectionAsync().catch(() => {});
    setSelectedDate(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
      return;
    }
    setCurrentMonth((m) => m - 1);
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    if (!IS_WEB) Haptics.selectionAsync().catch(() => {});
    setSelectedDate(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
      return;
    }
    setCurrentMonth((m) => m + 1);
  }, [currentMonth]);

  const goToday = useCallback(() => {
    if (!IS_WEB) Haptics.selectionAsync().catch(() => {});
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(formatDateKey(now.getFullYear(), now.getMonth(), now.getDate()));
    setActiveFilter('Today');
  }, []);

  const monthTitle = `${MONTHS[currentMonth]} ${currentYear}`;
  const calendarFilterItems = useMemo(
    () =>
      [
        { id: 'All', label: 'All', icon: 'apps-outline' },
        { id: 'Today', label: 'Today', icon: 'today-outline' },
        { id: 'This Week', label: 'Week', icon: 'calendar-number-outline' },
        ...(isAuthenticated ? [{ id: 'My Tickets', label: 'Tickets', icon: 'ticket-outline' }] : []),
        { id: 'Interested', label: 'Interested', icon: 'heart-outline' },
        { id: 'Free', label: 'Free', icon: 'pricetag-outline' },
        { id: 'Council', label: 'Council', icon: 'business-outline' },
      ] as { id: CalendarFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[],
    [isAuthenticated],
  );

  if (isLoading) {
    return (
      <ErrorBoundary>
        <View style={[styles.loadingRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <ActivityIndicator size="large" color={CultureTokens.indigo} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Building your events calendar…</Text>
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ambientMesh}
          pointerEvents="none"
        />

        <TabPrimaryHeader
          title="Events"
          subtitle={undefined}
          locationLabel={undefined}
          hPad={hPad}
          topInset={topInset}
          showChromeHairline={false}
          topHeaderAction={
            <Pressable
              onPress={() => router.push('/settings/calendar-sync')}
              style={[styles.topHeaderSyncBtn, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
              accessibilityRole="button"
              accessibilityLabel="Open calendar sync settings"
            >
              <Ionicons
                name={calPrefs.deviceConnected ? 'calendar' : 'calendar-outline'}
                size={MAIN_TAB_UI.iconSize.md}
                color={calPrefs.deviceConnected ? CultureTokens.indigo : colors.text}
              />
            </Pressable>
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void handleRefresh();
              }}
              tintColor={CultureTokens.indigo}
              colors={[CultureTokens.indigo]}
            />
          }
          contentContainerStyle={{
            maxWidth: contentMaxWidth,
            width: '100%',
            alignSelf: 'center',
            paddingTop: 0,
            paddingBottom: bottomInset + MAIN_TAB_UI.scrollBottomPad,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.compactFilterRail, { paddingHorizontal: hPad }]}
            style={{ marginTop: 10 }}
          >
            <View
              style={[
                styles.compactStatChip,
                { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '36' },
              ]}
            >
              <Text style={[styles.compactStatText, { color: CultureTokens.indigo }]}>
                {eventsInCurrentMonth.length} this month
              </Text>
            </View>
            <View
              style={[
                styles.compactStatChip,
                { backgroundColor: CultureTokens.teal + '14', borderColor: CultureTokens.teal + '36' },
              ]}
            >
              <Text style={[styles.compactStatText, { color: CultureTokens.teal }]}>
                {ticketedEventIds.size} ticketed
              </Text>
            </View>
            {calendarFilterItems.map((item) => {
              const active = activeFilter === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setActiveFilter(item.id)}
                  style={({ pressed }) => [
                    styles.compactChip,
                    {
                      backgroundColor: active ? CultureTokens.indigo : colors.surface,
                      borderColor: active ? CultureTokens.indigo : colors.borderLight,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${item.label}`}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={active ? colors.surface : colors.textSecondary}
                  />
                  <Text style={[styles.compactChipText, { color: active ? colors.surface : colors.text }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={isDesktopWeb ? [styles.desktopSplit, { paddingHorizontal: hPad }] : undefined}>
            <View style={isDesktopWeb ? styles.leftCol : undefined}>
              <View
                style={{
                  marginHorizontal: isDesktopWeb ? 0 : hPad,
                  marginTop: 12,
                  borderRadius: MAIN_TAB_UI.cardRadius,
                  backgroundColor: colors.surface,
                  borderWidth: StyleSheet.hairlineWidth * 2,
                  borderColor: colors.borderLight,
                  padding: 14,
                }}
              >
                <View style={styles.calendarTopBar}>
                  <Text style={[styles.monthYearHeading, { color: colors.text }]}>{monthTitle}</Text>
                  <View style={styles.calendarTopActions}>
                    <Pressable
                      onPress={prevMonth}
                      style={[styles.monthControlBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
                      accessibilityRole="button"
                      accessibilityLabel="Previous month"
                    >
                      <Ionicons name="chevron-back" size={14} color={colors.text} />
                    </Pressable>
                    <Pressable
                      onPress={goToday}
                      style={[styles.todayBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
                      accessibilityRole="button"
                      accessibilityLabel="Jump to today"
                    >
                      <Text style={[styles.todayBtnText, { color: colors.text }]}>Today</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push('/settings/calendar-sync')}
                      style={[styles.monthControlBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
                      accessibilityRole="button"
                      accessibilityLabel="Open calendar sync settings"
                    >
                      <Ionicons
                        name={calPrefs.deviceConnected ? 'calendar' : 'calendar-outline'}
                        size={14}
                        color={calPrefs.deviceConnected ? CultureTokens.indigo : colors.text}
                      />
                    </Pressable>
                    <Pressable
                      onPress={nextMonth}
                      style={[styles.monthControlBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
                      accessibilityRole="button"
                      accessibilityLabel="Next month"
                    >
                      <Ionicons name="chevron-forward" size={14} color={colors.text} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.dayHeaderRow}>
                  {DAY_LETTERS.map((label, index) => (
                    <Text key={`${label}-${index}`} style={[styles.dayHeaderText, { color: colors.textTertiary }]}>
                      {label}
                    </Text>
                  ))}
                </View>

                <View style={styles.daysGrid}>
                  {monthDays.map((day, idx) => {
                    if (day == null) return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
                    const dateKey = formatDateKey(currentYear, currentMonth, day);
                    const isTodayCell =
                      day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                    const isSelected = selectedDate === dateKey;
                    const hasEvents = (eventsByDate.get(dateKey)?.length ?? 0) > 0;
                    const hasTickets = ticketDates.has(dateKey);
                    const hasPersonal = personalBusyDates.has(dateKey) && calPrefs.showPersonalEvents;

                    return (
                      <Pressable
                        key={dateKey}
                        onPress={() => setSelectedDate((prev) => (prev === dateKey ? null : dateKey))}
                        accessibilityRole="button"
                        accessibilityLabel={`${day} ${MONTHS[currentMonth]}`}
                        style={({ pressed }) => [
                          styles.dayCell,
                          isSelected
                            ? { backgroundColor: CultureTokens.indigo }
                            : isTodayCell
                              ? { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo + '55', borderWidth: 1.5 }
                              : { backgroundColor: 'transparent' },
                          pressed && { opacity: 0.75 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected
                              ? { color: colors.surface }
                              : isTodayCell
                                ? { color: CultureTokens.indigo }
                                : { color: colors.text },
                          ]}
                        >
                          {day}
                        </Text>
                        {(hasEvents || hasTickets || hasPersonal) ? (
                          <View style={styles.dotRow}>
                            {hasEvents ? <View style={[styles.dot, { backgroundColor: isSelected ? colors.surface : CultureTokens.coral }]} /> : null}
                            {hasTickets ? <View style={[styles.dot, { backgroundColor: isSelected ? colors.surface : CultureTokens.teal }]} /> : null}
                            {hasPersonal ? <View style={[styles.dot, { backgroundColor: isSelected ? colors.surface : colors.textTertiary }]} /> : null}
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.section, { paddingHorizontal: hPad }]}>
                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {selectedDate
                      ? `Agenda · ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}`
                      : 'Select a day to view your agenda'}
                  </Text>
                  {selectedDate ? (
                    <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
                      {selectedEvents.length + selectedPersonalEvents.length}
                    </Text>
                  ) : null}
                </View>

                {selectedDate ? (
                  <>
                    {selectedPersonalEvents.map((pev) => (
                      <View key={pev.id} style={[styles.personalRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                        <View style={[styles.personalStripe, { backgroundColor: pev.color }]} />
                        <View style={{ flex: 1, padding: 10 }}>
                          <Text style={[styles.personalTitle, { color: colors.textTertiary }]}>Personal calendar</Text>
                          <Text style={[styles.personalTime, { color: colors.textSecondary }]}>
                            {pev.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {pev.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {pev.calendarName}
                          </Text>
                        </View>
                      </View>
                    ))}

                    {selectedEvents.length === 0 && selectedPersonalEvents.length === 0 ? (
                      <CalendarEmptyState
                        colors={colors}
                        title="No events on this day"
                        subtitle="Browse all events"
                        onSubtitlePress={() => router.push('/events')}
                      />
                    ) : (
                      selectedEvents.map((event) => (
                        <View key={event.id}>
                          <EventRow event={event} colors={colors} isAuthenticated={isAuthenticated} isWeb={IS_WEB} />
                          <Pressable
                            onPress={() => exportEventToCalendar(event)}
                            style={({ pressed }) => [
                              styles.addCalendarBtn,
                              { borderColor: CultureTokens.indigo + '35', backgroundColor: CultureTokens.indigo + '10', opacity: pressed ? 0.8 : 1 },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Add this event to calendar"
                          >
                            <Ionicons name="calendar-outline" size={14} color={CultureTokens.indigo} />
                            <Text style={[styles.addCalendarText, { color: CultureTokens.indigo }]}>Add to calendar</Text>
                          </Pressable>
                        </View>
                      ))
                    )}
                  </>
                ) : (
                  <CalendarEmptyState
                    colors={colors}
                    title="Choose a date"
                    subtitle="Tap any day above to open agenda"
                  />
                )}
              </View>
            </View>

            <View style={isDesktopWeb ? styles.rightCol : undefined}>
              <View style={[styles.section, { paddingHorizontal: hPad }]}>
                {(reminderEvents.length > 0 || conflictEvents.length > 0) && (
                  <View style={[styles.agendaInsights, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    {reminderEvents.length > 0 && (
                      <View style={styles.agendaInsightBlock}>
                        <View style={styles.agendaInsightHeader}>
                          <Ionicons name="notifications-outline" size={14} color={CultureTokens.indigo} />
                          <Text style={[styles.agendaInsightTitle, { color: colors.text }]}>Reminders</Text>
                        </View>
                        <Text style={[styles.agendaInsightBody, { color: colors.textSecondary }]} numberOfLines={2}>
                          {reminderEvents[0]?.title}
                          {reminderEvents.length > 1 ? ` +${reminderEvents.length - 1} more in 48h` : ' within 48h'}
                        </Text>
                      </View>
                    )}
                    {conflictEvents.length > 0 && (
                      <View style={styles.agendaInsightBlock}>
                        <View style={styles.agendaInsightHeader}>
                          <Ionicons name="alert-circle-outline" size={14} color={CultureTokens.coral} />
                          <Text style={[styles.agendaInsightTitle, { color: colors.text }]}>Conflicts</Text>
                        </View>
                        <Text style={[styles.agendaInsightBody, { color: colors.textSecondary }]} numberOfLines={2}>
                          {conflictEvents.length} overlapping events detected
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming</Text>
                  <Pressable onPress={() => router.push('/events')} accessibilityRole="link">
                    <Text style={[styles.linkText, { color: CultureTokens.indigo }]}>See all</Text>
                  </Pressable>
                </View>
                {upcomingEvents.length > 0 ? (
                  <View style={styles.upcomingGrid}>
                    {upcomingEvents.slice(0, isDesktopWeb ? 6 : 4).map((event, index) => (
                      <View key={event.id}>
                        <EventCard
                          event={event}
                          index={index}
                          layout="stacked"
                          containerWidth={isDesktopWeb ? 260 : Math.floor((width - hPad * 2 - MAIN_TAB_UI.sectionGapSmall) / 2)}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <CalendarEmptyState colors={colors} title="No upcoming events" subtitle="Try another filter" />
                )}
              </View>

              {isAuthenticated && ticketedEventIds.size > 0 ? (
                <View style={[styles.section, { paddingHorizontal: hPad }]}>
                  <View style={styles.sectionRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>My Tickets</Text>
                    <Pressable onPress={() => router.push('/tickets')} accessibilityRole="link">
                      <Text style={[styles.linkText, { color: CultureTokens.indigo }]}>Open tickets</Text>
                    </Pressable>
                  </View>
                  {allEvents
                    .filter((event) => ticketedEventIds.has(event.id))
                    .slice(0, 4)
                    .map((event) => (
                      <EventRow key={event.id} event={event} colors={colors} isAuthenticated={isAuthenticated} isWeb={IS_WEB} />
                    ))}
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  ambientMesh: { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingCard: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 28, paddingVertical: 24, alignItems: 'center', gap: 12 },
  loadingText: { ...TextStyles.cardTitle },

  topHeaderSyncBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  headerMonthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenter: { alignItems: 'center', flex: 1 },
  monthTitle: { ...TextStyles.title3, lineHeight: 21 },
  monthSub: { ...TextStyles.caption },

  statsRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  statPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statPillText: { ...TextStyles.badge },
  compactFilterRail: { gap: 8, paddingTop: 10, paddingBottom: 2 },
  compactStatChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactStatText: { ...TextStyles.captionSemibold },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  compactChipText: { ...TextStyles.captionSemibold },

  desktopSplit: { flexDirection: 'row', alignItems: 'flex-start', gap: 28, marginTop: 4 },
  leftCol: { flex: 1.4 },
  rightCol: { flex: 1 },

  calendarTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calendarTopActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calendarTopLabel: { ...TextStyles.captionSemibold, textTransform: 'uppercase', letterSpacing: 0.7 },
  monthYearHeading: { ...TextStyles.title, lineHeight: 28, letterSpacing: -0.25 },
  todayBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  monthControlBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  todayBtnText: { ...TextStyles.captionSemibold },

  dayHeaderRow: { flexDirection: 'row', marginBottom: 8 },
  dayHeaderText: { flex: 1, textAlign: 'center', ...TextStyles.badge, textTransform: 'uppercase', letterSpacing: 0.8 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellEmpty: { width: '14.28%', minHeight: 40 },
  dayCell: { width: '14.28%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginVertical: 2 },
  dayText: { ...TextStyles.cardTitle },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  section: { paddingTop: MAIN_TAB_UI.sectionGapLarge },
  agendaInsights: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 10,
    marginBottom: 12,
  },
  agendaInsightBlock: {
    gap: 4,
  },
  agendaInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agendaInsightTitle: {
    ...TextStyles.captionSemibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  agendaInsightBody: {
    ...TextStyles.caption,
    lineHeight: 17,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  sectionTitle: { flex: 1, ...TextStyles.headline, lineHeight: 22 },
  sectionCount: { ...TextStyles.chip },
  linkText: { ...TextStyles.captionSemibold, textTransform: 'uppercase', letterSpacing: 0.5 },

  personalRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  personalStripe: { width: 4 },
  personalTitle: { ...TextStyles.badge, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  personalTime: { ...TextStyles.caption, lineHeight: 16 },

  addCalendarBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: -6,
    marginBottom: 10,
    marginRight: 4,
  },
  addCalendarText: { ...TextStyles.badge },

  upcomingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: MAIN_TAB_UI.sectionGapSmall },
});


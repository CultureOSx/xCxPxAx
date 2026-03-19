import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCouncil } from '@/hooks/useCouncil';
import type { EventData } from '@/shared/schema';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { FilterChipRow } from '@/components/FilterChip';
import { Card } from '@/components/ui/Card';
import { TextStyles } from '@/constants/typography';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = getStyles(colors);
  
  const { isDesktop, isTablet, width } = useLayout();
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && isDesktop;
  
  const webTopInset = isWeb ? (isDesktopWeb ? 32 : 16) : insets.top;
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
  
  const { data: allEventsRaw = [], isLoading } = useQuery<EventData[]>({
    queryKey: ['/api/events', user?.country, user?.city],
    queryFn: async () => {
      // Increase pageSize to 300 to ensure we don't miss events on the calendar
      const data = await api.events.list({ city: user?.city, country: user?.country, pageSize: 300 });
      return data.events ?? [];
    },
    enabled: !!user,
  });

  const { data: ticketsData } = useQuery<any[]>({
    queryKey: ['/api/tickets', userId],
    queryFn: () => userId ? api.tickets.forUser(userId) : Promise.resolve([]),
    enabled: !!userId,
  });
  const tickets = useMemo(() => Array.isArray(ticketsData) ? ticketsData : [], [ticketsData]);

  const { data: rsvpsData } = useQuery<any[]>({
    queryKey: ['/api/user_event_rsvp', userId],
    queryFn: () => userId ? api.rsvps.listForUser(userId) : Promise.resolve([]),
    enabled: !!userId,
  });
  const rsvps = useMemo(() => Array.isArray(rsvpsData) ? rsvpsData : [], [rsvpsData]);

  const { data: likesData } = useQuery<any[]>({
    queryKey: ['/api/user_event_likes', userId],
    queryFn: () => userId ? api.likes.listForUser(userId) : Promise.resolve([]),
    enabled: !!userId,
  });
  const likes = useMemo(() => Array.isArray(likesData) ? likesData : [], [likesData]);

  useQuery<any[]>({
    queryKey: ['/api/user_council_subscriptions', userId],
    enabled: !!userId,
  });

  const { data: interestsData } = useQuery<any[]>({
    queryKey: ['/api/user_interests', userId],
    queryFn: () => userId ? api.interests.listForUser(userId) : Promise.resolve([]),
    enabled: !!userId,
  });
  const interests = useMemo(() => Array.isArray(interestsData) ? interestsData : [], [interestsData]);

  useQuery<any[]>({
    queryKey: ['/api/profiles', 'community'],
    queryFn: () => api.profiles.list({ entityType: 'community' }),
  });

  const allEvents = useMemo(() => {
    const ids = new Set();
    const merged: any[] = [];
    
    [...allEventsRaw, ...councilEvents].forEach((ev: any) => {
      const eid = ev.id || ev._id || ev.id?.toString();
      if (eid && !ids.has(eid)) {
        merged.push(ev);
        ids.add(eid);
      } else if (!eid) {
        // If no ID, still include it but don't deduplicate
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
      case 'Today':
        const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
        events = events.filter(e => toSafeDateKey(e.date) === todayStr);
        break;
      case 'My Events':
        if (isAuthenticated) {
          const rsvpIds = new Set((rsvps as any[]).map((r: any) => r.eventId));
          events = events.filter(e => rsvpIds.has(e.id));
        }
        break;
      case 'Tickets':
        if (isAuthenticated) {
          const ticketIds = new Set((tickets as any[]).map((t: any) => t.eventId));
          events = events.filter(e => ticketIds.has(e.id));
        }
        break;
      case 'Council':
        events = events.filter(e => (e as any).councilId);
        break;
      case 'Interests':
        if (isAuthenticated) {
          const likeIds = new Set((likes as any[]).map((l: any) => l.eventId));
          const interestTags = new Set((interests as any[]).map((i: any) => i.interestTag));
          events = events.filter(e => likeIds.has(e.id) || (e.tags && e.tags.some((tag: string) => interestTags.has(tag))));
        }
        break;
      default:
        events = events.filter(e => {
          const cat = (e.category || '').toLowerCase();
          const target = activeChip.toLowerCase();
          return cat === target || ( (e as any).councilId && activeChip === 'Council' );
        });
    }
    return events;
  }, [activeChip, allEvents, tickets, rsvps, likes, interests, isAuthenticated, today]);

  const eventsInMonthCount = useMemo(() => {
    return allEvents.filter(e => {
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
    filteredEvents.forEach(e => {
      const dateKey = toSafeDateKey(e.date);
      if (dateKey) set.add(dateKey);
    });
    return set;
  }, [filteredEvents]);

  const eventCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEvents.forEach(e => {
      const dateKey = toSafeDateKey(e.date);
      if (dateKey) map[dateKey] = (map[dateKey] || 0) + 1;
    });
    return map;
  }, [filteredEvents]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter(e => toSafeDateKey(e.date) === selectedDate);
  }, [filteredEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return filteredEvents.filter(e => {
      const eventDate = toSafeDateKey(e.date);
      if (!eventDate) return false;
      const dateObj = new Date(`${eventDate}T00:00:00`);
      return dateObj.getTime() >= now.getTime() && dateObj.getTime() <= now.getTime() + sevenDays;
    }).slice(0, 10);
  }, [filteredEvents]);

  const civicReminders = useMemo(() => {
    return filteredEvents.filter(e => {
      const eventDate = toSafeDateKey(e.date);
      if (!eventDate) return false;
      const dateObj = new Date(`${eventDate}T00:00:00`);
      return (e.category === 'council' || e.category === 'civic' || (e as any).councilId) &&
        dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear;
    }).map(e => ({
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

  const handleChipSelect = useCallback((id: string) => {
    setActiveChip(id);
    if (id === 'Today') {
      goToday();
    }
  }, [goToday]);

  if (isLoading) {
    return (
      <ErrorBoundary>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={CultureTokens.indigo} />
            <Text style={styles.loadingText}>Loading Calendar...</Text>
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container]}>
        {/* Brand gradient top bar */}
        <LinearGradient
          colors={gradients.culturepassBrand as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: webTopInset }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar-clear" size={22} color={CultureTokens.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[TextStyles.title2, { color: '#fff', letterSpacing: -0.3 }]}>Culture Calendar</Text>
              <Text style={[TextStyles.caption, { color: 'rgba(255,255,255,0.8)' }]}>{MONTHS[currentMonth]} {currentYear}</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Text style={[TextStyles.labelSemibold, { color: '#fff' }]}>{eventsInMonthCount} events</Text>
            </View>
          </View>
        </LinearGradient>

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
          {/* Category & Community filters relocated below hero */}
          <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 16 }}>
            <FilterChipRow
              selectedId={activeChip}
              onSelect={handleChipSelect}
              items={[
                { id: 'All',        label: 'All',        icon: 'apps' },
                { id: 'Today',      label: 'Today',      icon: 'today' },
                { id: 'Festival',   label: 'Festival',   icon: 'color-palette' },
                { id: 'Movie',      label: 'Movie',      icon: 'film' },
                { id: 'Workshop',   label: 'Workshop',   icon: 'hammer' },
                { id: 'Concert',    label: 'Concert',    icon: 'musical-notes' },
                { id: 'Food',       label: 'Food',       icon: 'restaurant' },
                { id: 'Civic',      label: 'Civic',      icon: 'business' },
              ]}
              size="small"
            />
          </View>

          {/* Redundant Today button merged into filter chips */}

          {/* Summary chips removed as per user request */}

          <View style={isDesktopWeb ? styles.desktopSplit : undefined}>
            <View style={isDesktopWeb ? styles.desktopCalendarCol : undefined}>
              {/* Calendar card */}
              <View style={[styles.calCard, isDesktopWeb && styles.calCardCompact]}> 
                <View style={styles.monthNav}>
                  <Pressable 
                    onPress={prevMonth} 
                    hitSlop={14} 
                    style={({pressed}) => [styles.navBtn, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
                  >
                    <Ionicons name="chevron-back" size={20} color={colors.text} />
                  </Pressable>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.monthText}>{MONTHS[currentMonth]}</Text>
                    <Text style={[styles.yearText, { color: colors.textTertiary }]}>{currentYear}</Text>
                  </View>
                  <Pressable 
                    onPress={nextMonth} 
                    hitSlop={14} 
                    style={({pressed}) => [styles.navBtn, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
                  >
                    <Ionicons name="chevron-forward" size={20} color={colors.text} />
                  </Pressable>
                </View>

                <View style={styles.dayHeaders}>
                  {DAYS.map((d) => <Text key={d} style={styles.dayHeaderText}>{d}</Text>)}
                </View>

                <View style={styles.daysGrid}>
                  {days.map((day, idx) => {
                    if (day === null) return <View key={`e-${idx}`} style={[styles.dayCell, styles.dayCellEmpty]} />;
                    const dateKey  = formatDateKey(currentYear, currentMonth, day);
                    const hasEvent = eventDates.has(dateKey);
                    const count    = eventCountByDate[dateKey] ?? 0;
                    const isSelected = selectedDate === dateKey;
                    const isToday    = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

                    let dayStyle: any = styles.dayCellDefault;
                    let textStyle: any = styles.dayTextDefault;

                    if (isSelected) {
                      dayStyle = styles.dayCellSelected;
                      textStyle = styles.dayTextSelected;
                    } else if (isToday) {
                      dayStyle = styles.dayCellToday;
                      textStyle = styles.dayTextToday;
                    }

                    return (
                      <Pressable
                        key={dateKey}
                        onPress={() => { if(!isWeb) Haptics.selectionAsync(); setSelectedDate(isSelected ? null : dateKey); }}
                        style={({ pressed }) => [styles.dayCell, dayStyle, pressed && { opacity: 0.7 }]}
                      >
                        <Text style={[styles.dayText, textStyle]}>{day}</Text>
                        {hasEvent && (
                          <View style={styles.dotRow}>
                            {Array.from({ length: Math.min(count, 3) }).map((_, di) => (
                              <View key={di} style={[styles.dot, isSelected && styles.dotSelected]} />
                            ))}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {selectedDate && (
                <View style={styles.eventsSection}>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}> 
                      {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                    <Text style={styles.sectionCount}>{selectedEvents.length} events</Text>
                  </View>
                  {selectedEvents.length === 0 ? (
                    <View style={styles.empty}>
                      <View style={styles.emptyIconCircle}>
                        <Ionicons name="calendar-outline" size={36} color={colors.textSecondary} />
                      </View>
                      <Text style={styles.emptyText}>No events on this day.</Text>
                    </View>
                  ) : (
                    selectedEvents.map((event) => <EventRow key={event.id} event={event} colors={colors} styles={styles} isAuthenticated={isAuthenticated} isWeb={isWeb} />)
                  )}
                </View>
              )}
            </View>

            {isDesktopWeb && (
              <View style={styles.desktopUpcomingCol}>
                <View style={styles.eventsSectionSide}>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Upcoming Events</Text>
                    <Pressable onPress={() => router.push('/events')}>
                      <Text style={styles.seeAll}>See all</Text>
                    </Pressable>
                  </View>
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => <EventRow key={event.id} event={event} colors={colors} styles={styles} isAuthenticated={isAuthenticated} isWeb={isWeb} />)
                  ) : (
                    <View style={styles.empty}>
                      <View style={styles.emptyIconCircle}>
                        <Ionicons name="calendar-clear-outline" size={36} color={colors.textSecondary} />
                      </View>
                      <Text style={styles.emptyText}>No upcoming events found.</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          {!isDesktopWeb && !selectedDate && upcomingEvents.length > 0 && (
            <View style={styles.eventsSection}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                <Pressable onPress={() => router.push('/events')}>
                  <Text style={styles.seeAll}>See all</Text>
                </Pressable>
              </View>
              {upcomingEvents.map((event) => <EventRow key={event.id} event={event} colors={colors} styles={styles} isAuthenticated={isAuthenticated} isWeb={isWeb} />)}
            </View>
          )}

          {!selectedDate && civicReminders.length > 0 && (
            <View style={styles.eventsSection}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Civic Reminders</Text>
                <Pressable onPress={() => router.push('/(tabs)/council')}>
                  <Text style={styles.seeAll}>Council</Text>
                </Pressable>
              </View>
              {civicReminders.map((reminder) => (
                <View key={reminder.id} style={styles.civicRow}>
                  <View style={styles.civicIcon}> 
                    <Ionicons name="shield-checkmark" size={18} color={CultureTokens.indigo} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.civicEventTitle}>{reminder.title}</Text>
                    <Text style={styles.civicEventVenue}>
                      {new Date(`${reminder.dateKey}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
                      {' • '}{reminder.note}
                      {council ? ` • ${council.name}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {!isDesktopWeb && !selectedDate && upcomingEvents.length === 0 && (
            <View style={styles.eventsSection}>
              <View style={styles.empty}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="calendar-clear-outline" size={36} color={colors.textSecondary} />
                </View>
                <Text style={styles.emptyText}>No events found.</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Event row component
// ---------------------------------------------------------------------------
function EventRow({ event, colors, styles, isAuthenticated, isWeb }: { event: EventData; colors: ReturnType<typeof useColors>; styles: any; isAuthenticated: boolean; isWeb: boolean }) {
  const safeDate = toSafeDateKey(event.date);
  const eventDateLabel = safeDate
    ? new Date(`${safeDate}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Date TBA';

  const isCouncilEvent = event.category === 'council' || event.category === 'Council' || event.category === 'civic';
  
  const handlePress = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isCouncilEvent && isAuthenticated) {
      router.push('/(tabs)/council');
    } else {
      router.push({ pathname: '/event/[id]', params: { id: event.id } });
    }
  };
  
  const isFree = (event.priceCents ?? 0) === 0;

  const accentColor = isCouncilEvent ? CultureTokens.teal : CultureTokens.saffron;

  return (
    <Card
      onPress={handlePress}
      style={styles.eventRow}
      padding={0}
    >
      {/* Left accent strip */}
      <View style={[styles.eventAccentStrip, { backgroundColor: accentColor }]} />

      <Image source={{ uri: event.imageUrl }} style={styles.eventImg} contentFit="cover" />

      <View style={styles.eventInfo}>
        <Text style={[TextStyles.headline, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="time" size={14} color={CultureTokens.indigo} />
          <Text style={[TextStyles.labelSemibold, { color: CultureTokens.indigo }]}>
            {eventDateLabel} · {event.time || 'Time TBA'}
          </Text>
        </View>
        <View style={styles.eventMeta}>
          <Ionicons name="location" size={14} color={colors.textTertiary} />
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>{event.venue}</Text>
        </View>
      </View>

      <View style={[styles.priceChip, isFree ? styles.priceChipFree : styles.priceChipPaid]}>
        <Text style={[TextStyles.labelSemibold, isFree ? styles.priceTextFree : styles.priceTextPaid]}>
          {formatPrice(event.priceCents ?? 0)}
        </Text>
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Styles Implementation
// ---------------------------------------------------------------------------
const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  loadingText: { color: colors.text, fontFamily: 'Poppins_600SemiBold', fontSize: 15, marginTop: 16 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontFamily: 'Poppins_700Bold', letterSpacing: -0.5, color: colors.text },
  headerSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  todayBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: CultureTokens.indigo + '15', borderWidth: 1, borderColor: CultureTokens.indigo + '30' },
  todayBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: CultureTokens.indigo, letterSpacing: 0.5 },

  filterRow: { flexDirection: 'row', gap: 10, paddingVertical: 12, paddingHorizontal: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface },
  filterChipActive: { backgroundColor: CultureTokens.indigo, borderColor: CultureTokens.indigo },
  filterChipText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.textSecondary },
  filterChipTextActive: { color: '#fff' },

  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 20, flexWrap: 'wrap' },
  chipPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  chipTextPrimary: { fontFamily: 'Poppins_700Bold', fontSize: 13 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  chipText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13 },

  // Hero banner
  heroBanner: { marginHorizontal: 16, marginTop: 4, marginBottom: 12, borderRadius: 20, padding: 16, overflow: 'hidden', shadowColor: CultureTokens.indigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  heroOrb: { position: 'absolute' },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 1 },
  heroIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroRibbon: { 
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff1a', // Fixed transparency for Android (approx 10% white)
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff26', // Approx 15% white
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  heroTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#fff', letterSpacing: -0.2 },
  heroStatsBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroStatsText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#fff',
  },
  heroSub: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  calCard: { marginHorizontal: 16, borderRadius: 28, padding: 24, paddingBottom: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 6 },
  calCardCompact: { marginHorizontal: 0 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  navBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  monthText: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: colors.text },
  yearText: { fontFamily: 'Poppins_400Regular', fontSize: 13 },

  dayHeaders: { flexDirection: 'row', marginBottom: 16 },
  dayHeaderText: { flex: 1, textAlign: 'center', fontFamily: 'Poppins_700Bold', fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginVertical: 4, gap: 4, borderWidth: 1.5 },
  dayCellEmpty: { borderColor: 'transparent' },

  dayCellDefault: { backgroundColor: 'transparent', borderColor: 'transparent' },
  dayTextDefault: { color: colors.text },

  dayCellSelected: { backgroundColor: CultureTokens.indigo, borderColor: CultureTokens.indigo },
  dayTextSelected: { color: '#fff' },

  dayCellToday: { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '40' },
  dayTextToday: { color: CultureTokens.indigo },

  dayText: { fontFamily: 'Poppins_600SemiBold', fontSize: 17 },
  dotRow: { flexDirection: 'row', gap: 3, height: 5, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: CultureTokens.saffron },
  dotSelected: { backgroundColor: '#fff' },

  eventsSection: { paddingHorizontal: 20, paddingTop: 24 },
  eventsSectionSide: { paddingHorizontal: 0, paddingTop: 0 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: colors.text },
  sectionCount: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: colors.textTertiary },
  seeAll: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: CultureTokens.indigo, textTransform: 'uppercase', letterSpacing: 0.5 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 16, borderRadius: 28, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderLight },
  emptyIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: colors.textSecondary },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    marginBottom: 16,
    padding: 20,
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  eventAccentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  eventImg: { width: 72, height: 72, borderRadius: 16, backgroundColor: colors.backgroundSecondary },
  eventInfo: { flex: 1, gap: 6 },
  eventTitle: { fontFamily: 'Poppins_700Bold', fontSize: 17, color: colors.text, letterSpacing: -0.3 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, backgroundColor: 'transparent' },
  eventTime: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: CultureTokens.indigo, textTransform: 'uppercase' },
  eventVenue: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: colors.textSecondary, flexShrink: 1 },

  priceChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  priceChipFree: { backgroundColor: CultureTokens.teal + '12', borderColor: CultureTokens.teal + '30' },
  priceTextFree: { color: CultureTokens.teal },
  priceChipPaid: { backgroundColor: CultureTokens.indigo + '12', borderColor: CultureTokens.indigo + '30' },
  priceTextPaid: { color: CultureTokens.indigo },
  priceText: { fontFamily: 'Poppins_700Bold', fontSize: 13 },

  civicRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: CultureTokens.indigo + '30', borderRadius: 24, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  civicIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: CultureTokens.indigo + '12', alignItems: 'center', justifyContent: 'center' },
  civicEventTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text, letterSpacing: -0.2 },
  civicEventVenue: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textSecondary, flexShrink: 1, marginTop: 2 },

  desktopSplit: { flexDirection: 'row', alignItems: 'flex-start', gap: 32, paddingHorizontal: 20, width: '100%', alignSelf: 'center', marginTop: 12 },
  desktopCalendarCol: { flex: 1.5 },
  desktopUpcomingCol: { flex: 1 },
});
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/query-client';
import { useAuth } from '@/lib/auth';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { CultureTokens, gradients } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { EventData } from '@/shared/schema';
import { useColors } from '@/hooks/useColors';
import { goBackOrReplace } from '@/lib/navigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrganizerStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  totalTicketsSold: number;
  totalRevenueCents: number;
}

interface EventsResponse {
  events: EventData[];
  total?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function statusColor(status?: string, colors?: ReturnType<typeof useColors>): string {
  switch (status) {
    case 'published': return '#34C759';
    case 'draft': return CultureTokens.saffron;
    case 'deleted': return CultureTokens.coral;
    default: return colors ? colors.textSecondary : 'rgba(255,255,255,0.4)';
  }
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'published': return 'Live';
    case 'draft': return 'Draft';
    case 'deleted': return 'Deleted';
    default: return status ?? '—';
  }
}

// ---------------------------------------------------------------------------
// Stat pill — compact inline stat
// ---------------------------------------------------------------------------

function StatPill({
  icon,
  value,
  label,
  accent,
  colors,
}: {
  icon: string;
  value: string;
  label: string;
  accent: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={pillStyles.root}>
      <View style={[pillStyles.iconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon as never} size={14} color={accent} />
      </View>
      <View>
        <Text style={[pillStyles.value, { color: colors.text }]}>{value}</Text>
        <Text style={[pillStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 15, fontFamily: 'Poppins_700Bold', letterSpacing: -0.3 },
  label: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
});

// ---------------------------------------------------------------------------
// Event Row
// ---------------------------------------------------------------------------

function EventRow({
  event,
  onPublish,
  onDelete,
  isPublishing,
  isDeleting,
  colors,
  styles,
}: {
  event: EventData;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  isPublishing: boolean;
  isDeleting: boolean;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof getStyles>;
}) {
  const status = (event as EventData & { status?: string }).status;
  const accent = statusColor(status, colors);
  const attending = event.attending ?? 0;
  const capacity = event.capacity ?? null;
  const pct = capacity ? Math.min((attending / capacity) * 100, 100) : null;

  return (
    <View style={[styles.eventRow, { borderColor: colors.borderLight }]}>
      <View style={[styles.eventAccent, { backgroundColor: accent }]} />

      <Pressable
        style={styles.eventMain}
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        accessibilityRole="button"
        accessibilityLabel={`View ${event.title}`}
      >
        <View style={styles.eventTopRow}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          <View style={[styles.statusPill, { backgroundColor: accent + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: accent }]} />
            <Text style={[styles.statusPillText, { color: accent }]}>{statusLabel(status)}</Text>
          </View>
        </View>

        <Text style={styles.eventMeta} numberOfLines={1}>
          {formatDate(event.date)}{event.venue ? ` · ${event.venue}` : ''}
        </Text>

        <View style={styles.eventBottomRow}>
          <View style={styles.eventAttendRow}>
            <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.eventAttendText}>
              {attending}{capacity ? `/${capacity}` : ''}
            </Text>
            {pct !== null && (
              <View style={styles.capacityTrack}>
                <View style={[styles.capacityFill, {
                  width: `${pct}%` as `${number}%`,
                  backgroundColor: pct >= 90 ? CultureTokens.coral : pct >= 60 ? CultureTokens.saffron : CultureTokens.teal,
                }]} />
              </View>
            )}
          </View>
          <Text style={styles.eventPriceText}>
            {event.isFree ? 'Free' : event.priceLabel ?? formatCurrency(event.priceCents ?? 0)}
          </Text>
        </View>
      </Pressable>

      {status !== 'deleted' && (
        <View style={[styles.eventActions, { borderLeftColor: colors.borderLight }]}>
          {status === 'draft' ? (
            <Pressable
              style={[styles.iconBtn, { backgroundColor: '#34C75914' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPublish(event.id); }}
              disabled={isPublishing}
              accessibilityRole="button"
              accessibilityLabel="Publish"
            >
              {isPublishing
                ? <ActivityIndicator size={13} color="#34C759" />
                : <Ionicons name="cloud-upload-outline" size={16} color="#34C759" />}
            </Pressable>
          ) : (
            <Pressable
              style={[styles.iconBtn, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
              accessibilityRole="button"
              accessibilityLabel="View event"
            >
              <Ionicons name="open-outline" size={15} color={colors.textSecondary} />
            </Pressable>
          )}
          <Pressable
            style={[styles.iconBtn, { backgroundColor: CultureTokens.coral + '12' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDelete(event.id); }}
            disabled={isDeleting}
            accessibilityRole="button"
            accessibilityLabel="Delete"
          >
            {isDeleting
              ? <ActivityIndicator size={13} color={CultureTokens.coral} />
              : <Ionicons name="trash-outline" size={15} color={CultureTokens.coral} />}
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

function OrganizerDashboardContent() {
  const insets = useSafeAreaInsets();
  const { hPad } = useLayout();
  const { userId, user } = useAuth();
  const { isOrganizer, isAdmin, isLoading: roleLoading } = useRole();
  const colors = useColors();
  const styles = getStyles(colors);
  const topPad = Platform.OS === 'web' ? 0 : insets.top;
  const [activeFilter, setActiveFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (!roleLoading && !isOrganizer) router.replace('/(tabs)');
  }, [isOrganizer, roleLoading]);

  const { data: eventsData, isLoading, refetch, isRefetching } = useQuery<EventsResponse>({
    queryKey: ['/api/events', { organizerId: userId }],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/events?organizerId=${userId}&page=1&pageSize=50`);
      return res.json();
    },
    enabled: !!userId,
  });

  const events: EventData[] = eventsData?.events ?? [];

  const stats: OrganizerStats = {
    totalEvents: events.length,
    publishedEvents: events.filter((e) => (e as EventData & { status?: string }).status === 'published').length,
    draftEvents: events.filter((e) => (e as EventData & { status?: string }).status === 'draft').length,
    totalTicketsSold: events.reduce((sum, e) => sum + (e.attending ?? 0), 0),
    totalRevenueCents: events.reduce((sum, e) => sum + (e.priceCents ?? 0) * (e.attending ?? 0), 0),
  };

  const publishMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest('POST', `/api/events/${eventId}/publish`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', { organizerId: userId }] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest('DELETE', `/api/events/${eventId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', { organizerId: userId }] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleDelete(eventId: string) {
    Alert.alert(
      'Delete Event',
      'This will soft-delete the event and hide it from all users.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(eventId) },
      ]
    );
  }

  const sortedEvents = [...events]
    .filter((e) => {
      if (activeFilter === 'all') return true;
      return (e as EventData & { status?: string }).status === activeFilter;
    })
    .sort((a, b) => {
      const order = { draft: 0, published: 1, deleted: 2 };
      const sa = (a as EventData & { status?: string }).status ?? 'published';
      const sb = (b as EventData & { status?: string }).status ?? 'published';
      return (order[sa as keyof typeof order] ?? 1) - (order[sb as keyof typeof order] ?? 1);
    });

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={gradients.primary as unknown as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: topPad }}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={[styles.header, { paddingHorizontal: hPad }]}>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: '#fff' }]}>Organizer Dashboard</Text>
            {user?.displayName && <Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.75)' }]}>{user.displayName}</Text>}
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/submit'); }}
            style={styles.newEventBtn}
            accessibilityRole="button"
            accessibilityLabel="Create new event"
          >
            <Ionicons name="add" size={14} color={CultureTokens.indigo} />
            <Text style={[styles.newEventBtnText, { color: CultureTokens.indigo }]}>New event</Text>
          </Pressable>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={CultureTokens.indigo} />}
      >
        {/* Stats bar */}
        {!isLoading && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statsBar}>
            <StatPill icon="calendar-outline" value={String(stats.totalEvents)} label="Events" accent={CultureTokens.indigo} colors={colors} />
            <View style={styles.statDivider} />
            <StatPill icon="radio-button-on" value={String(stats.publishedEvents)} label="Live" accent="#34C759" colors={colors} />
            <View style={styles.statDivider} />
            <StatPill icon="people-outline" value={String(stats.totalTicketsSold)} label="Attending" accent={CultureTokens.teal} colors={colors} />
            <View style={styles.statDivider} />
            <StatPill icon="wallet-outline" value={formatCurrency(stats.totalRevenueCents)} label="Revenue" accent={CultureTokens.gold} colors={colors} />
          </Animated.View>
        )}

        {/* Quick actions — horizontal scroll so they never wrap */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {[
            { icon: 'qr-code-outline', label: 'Scan Tickets', route: '/scanner', accent: CultureTokens.teal },
            { icon: 'ticket-outline', label: 'All Tickets', route: '/tickets', accent: CultureTokens.coral },
            { icon: 'apps-outline', label: 'Widgets', route: '/dashboard/widgets', accent: CultureTokens.saffron },
            ...(isAdmin ? [{ icon: 'wallet-outline', label: 'Wallet', route: '/dashboard/wallet-readiness', accent: CultureTokens.gold }] : []),
          ].map(({ icon, label, route, accent }) => (
            <Pressable
              key={label}
              style={({ pressed }) => [styles.quickBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(route as never); }}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <View style={[styles.quickBtnIcon, { backgroundColor: accent + '18' }]}>
                <Ionicons name={icon as never} size={16} color={accent} />
              </View>
              <Text style={styles.quickBtnLabel}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Events section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Events</Text>
          <Text style={styles.sectionCount}>
            {isLoading ? '…' : `${sortedEvents.length} total${stats.draftEvents > 0 ? ` · ${stats.draftEvents} draft` : ''}`}
          </Text>
        </View>

        {/* Filter tabs */}
        {!isLoading && sortedEvents.length > 0 && (
          <View style={styles.filterRow}>
            {(['all', 'published', 'draft'] as const).map((f) => {
              const count = f === 'all' ? events.length
                : events.filter((e) => (e as EventData & { status?: string }).status === f).length;
              return (
                <Pressable
                  key={f}
                  style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
                  onPress={() => setActiveFilter(f)}
                  accessibilityRole="tab"
                >
                  <Text style={[styles.filterTabText, activeFilter === f && styles.filterTabTextActive]}>
                    {f === 'all' ? 'All' : f === 'published' ? 'Live' : 'Draft'}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.filterTabBadge, activeFilter === f && styles.filterTabBadgeActive]}>
                      <Text style={[styles.filterTabBadgeText, activeFilter === f && styles.filterTabBadgeTextActive]}>{count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={CultureTokens.indigo} size="small" />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : sortedEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySubtitle}>Create your first event to get started.</Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push('/event/create')}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={styles.emptyBtnText}>Create Event</Text>
            </Pressable>
          </View>
        ) : (
          sortedEvents.map((event, idx) => (
            <Animated.View key={event.id} entering={FadeInRight.delay(idx * 60).springify().damping(18)}>
              <EventRow
                event={event}
                onPublish={(id) => publishMutation.mutate(id)}
                onDelete={handleDelete}
                isPublishing={publishMutation.isPending && publishMutation.variables === event.id}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === event.id}
                colors={colors}
                styles={styles}
              />
            </Animated.View>
          ))
        )}

        <View style={{ height: insets.bottom + 32 }} />
      </ScrollView>
    </View>
  );
}

export default function OrganizerDashboard() {
  return (
    <ErrorBoundary>
      <OrganizerDashboardContent />
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.2 },
  headerSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  newEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  newEventBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  scroll: { paddingTop: 16, gap: 16 },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statDivider: { width: 1, height: 28, backgroundColor: colors.borderLight, marginHorizontal: 8 },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  quickBtnIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  quickBtnLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.text },
  sectionCount: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },

  // Event row
  eventRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: 8,
  },
  eventAccent: { width: 3 },
  eventMain: { flex: 1, padding: 12, gap: 3 },
  eventTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eventTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, flex: 1 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.3 },
  eventMeta: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  eventBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  eventAttendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventAttendText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textTertiary },
  capacityTrack: { width: 40, height: 3, borderRadius: 2, backgroundColor: colors.borderLight, overflow: 'hidden' },
  capacityFill: { height: 3, borderRadius: 2 },
  eventPriceText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo },
  eventActions: {
    borderLeftWidth: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  // Loading / empty
  loadingWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderLight,
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginTop: 6 },
  emptySubtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: CultureTokens.indigo,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#fff' },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    borderColor: CultureTokens.indigo + '60',
    backgroundColor: CultureTokens.indigo + '12',
  },
  filterTabText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  filterTabTextActive: { color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' },
  filterTabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterTabBadgeActive: { backgroundColor: CultureTokens.indigo + '20' },
  filterTabBadgeText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  filterTabBadgeTextActive: { color: CultureTokens.indigo },
});

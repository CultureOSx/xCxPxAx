import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';
import type { EventData } from '@/shared/schema';
import { Skeleton } from '@/components/ui/Skeleton';

// ─── Types ───────────────────────────────────────────────────────────────────
interface VenueProfile {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  capacity?: number;
  imageUrl?: string;
  website?: string;
  phone?: string;
  isVerified?: boolean;
}

interface VenueEvent extends EventData {
  status?: string;
  attending?: number;
  ticketsSold?: number;
  revenueCents?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function capacityPct(attending?: number, capacity?: number) {
  if (!capacity || !attending) return 0;
  return Math.min(100, Math.round((attending / capacity) * 100));
}

// ─── Stat pill ───────────────────────────────────────────────────────────────
function StatPill({ icon, value, label, accent }: { icon: string; value: string | number; label: string; accent: string }) {
  const colors = useColors();
  return (
    <View style={[sp.pill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[sp.icon, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon as never} size={16} color={accent} />
      </View>
      <Text style={[sp.val, { color: colors.text }]}>{value}</Text>
      <Text style={[sp.lbl, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill:  { 
    flex: 1, 
    alignItems: 'center', 
    gap: 4, 
    borderRadius: 12, 
    borderWidth: 1, 
    padding: 12,
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 2 }
    })
  },
  icon:  { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  val:   { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  lbl:   { fontSize: 11, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
});

// ─── Event row ───────────────────────────────────────────────────────────────
function EventRow({ event }: { event: VenueEvent }) {
  const colors = useColors();
  const pct = capacityPct(event.attending, event.capacity);
  return (
    <Pressable
      style={({ pressed }) => [er.row, { backgroundColor: pressed ? colors.backgroundSecondary : colors.surface, borderColor: colors.borderLight }]}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      accessibilityRole="button"
    >
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={er.thumb} contentFit="cover" />
      ) : (
        <View style={[er.thumb, { backgroundColor: CultureTokens.indigo + '20', alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="calendar" size={20} color={CultureTokens.indigo} />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[er.title, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
        <Text style={[er.meta, { color: colors.textSecondary }]}>{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</Text>
        {/* Capacity bar */}
        {event.capacity != null && (
          <View style={{ marginTop: 4 }}>
            <View style={[er.barBg, { backgroundColor: colors.borderLight }]}>
              <View style={[er.barFill, { width: `${pct}%` as any, backgroundColor: pct > 80 ? CultureTokens.coral : CultureTokens.teal }]} />
            </View>
            <Text style={[er.meta, { color: colors.textTertiary, marginTop: 2 }]}>{event.attending ?? 0} / {event.capacity} capacity ({pct}%)</Text>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[er.badge, { backgroundColor: event.status === 'published' ? CultureTokens.teal + '20' : CultureTokens.gold + '20' }]}>
          <Text style={[er.badgeText, { color: event.status === 'published' ? CultureTokens.teal : CultureTokens.gold }]}>
            {event.status === 'published' ? 'Live' : 'Draft'}
          </Text>
        </View>
        {event.ticketsSold != null && (
          <Text style={[er.meta, { color: colors.textTertiary }]}>{event.ticketsSold} tickets</Text>
        )}
      </View>
    </Pressable>
  );
}
const er = StyleSheet.create({
  row:      { flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: 1, alignItems: 'flex-start' },
  thumb:    { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  title:    { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  meta:     { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  barBg:    { height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 2 },
  badge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText:{ fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
});

function VenueDashboardSkeleton() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topInset }}>
      <View style={{ height: 70, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 }}>
        <Skeleton width={34} height={34} borderRadius={9} />
        <View style={{ flex: 1, gap: 4 }}>
          <Skeleton width="40%" height={20} borderRadius={6} />
          <Skeleton width="30%" height={14} borderRadius={4} />
        </View>
        <Skeleton width={34} height={34} borderRadius={9} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20, gap: 16 }}>
          <Skeleton width="100%" height={200} borderRadius={12} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Skeleton width="31%" height={80} borderRadius={12} />
            <Skeleton width="31%" height={80} borderRadius={12} />
            <Skeleton width="31%" height={80} borderRadius={12} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Skeleton width="31%" height={80} borderRadius={12} />
            <Skeleton width="31%" height={80} borderRadius={12} />
            <Skeleton width="31%" height={80} borderRadius={12} />
          </View>
          <View style={{ marginTop: 20, gap: 12 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={80} borderRadius={12} />)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function VenueDashboardContent() {
  const colors   = useColors();
  useLayout();
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { userId, user } = useAuth();

  // Fetch this user's venue profile
  const { data: venueProfile, isLoading: venueLoading } = useQuery<VenueProfile | null>({
    queryKey: ['/api/profiles/my', userId, 'venue'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/profiles/my?entityType=venue');
        return await res.json() as VenueProfile;
      } catch {
        return null;
      }
    },
    enabled: !!userId,
  });

  // Fetch events at this venue
  const { data: eventsData, isLoading: eventsLoading } = useQuery<{ events: VenueEvent[] }>({
    queryKey: ['/api/events', 'venue', userId],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/events?organizerId=${userId}&pageSize=50`);
        return await res.json() as { events: VenueEvent[] };
      } catch {
        return { events: [] };
      }
    },
    enabled: !!userId,
  });

  const events    = eventsData?.events ?? [];
  const upcoming  = events.filter(e => e.status === 'published' && new Date(e.date ?? '') >= new Date());
  const past      = events.filter(e => e.status !== 'draft' && new Date(e.date ?? '') < new Date());
  const totalAttending   = events.reduce((s, e) => s + (e.attending ?? 0), 0);
  const totalTicketsSold = events.reduce((s, e) => s + (e.ticketsSold ?? 0), 0);
  const totalRevenue     = events.reduce((s, e) => s + (e.revenueCents ?? 0), 0);

  return (
    <View style={[vc.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* Header */}
      <View style={[vc.header, { borderBottomColor: colors.borderLight }]}>
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          style={({ pressed }) => [vc.backBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight, opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[vc.headerTitle, { color: colors.text }]}>Venue Dashboard</Text>
          <Text style={[vc.headerSub, { color: colors.textTertiary }]}>{venueProfile?.name ?? user?.city ?? 'Your venue'}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [vc.editBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight, opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push('/profile/edit')}
          accessibilityRole="button"
          accessibilityLabel="Edit venue profile"
        >
          <Ionicons name="pencil" size={15} color={colors.textSecondary} />
        </Pressable>
      </View>

      {venueLoading || eventsLoading ? (
        <VenueDashboardSkeleton />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

          {/* Venue info card */}
          {venueProfile && (
            <Animated.View entering={FadeInDown.delay(80).springify().damping(18)} style={[vc.venueCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {venueProfile.imageUrl && (
                <Image source={{ uri: venueProfile.imageUrl }} style={vc.venueImage} contentFit="cover" />
              )}
              <View style={vc.venueInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[vc.venueName, { color: colors.text }]}>{venueProfile.name}</Text>
                  {venueProfile.isVerified && <Ionicons name="checkmark-circle" size={16} color={CultureTokens.teal} />}
                </View>
                {venueProfile.address && <Text style={[vc.venueMeta, { color: colors.textSecondary }]}>{venueProfile.address}</Text>}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                  {venueProfile.capacity && <Text style={[vc.venueMeta, { color: colors.textTertiary }]}>Capacity: {venueProfile.capacity}</Text>}
                  {venueProfile.phone && <Text style={[vc.venueMeta, { color: colors.textTertiary }]}>{venueProfile.phone}</Text>}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Stats */}
          <Animated.View entering={FadeInDown.delay(140).springify().damping(18)} style={vc.section}>
            <Text style={[vc.sectionHeader, { color: colors.textTertiary }]}>PERFORMANCE</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatPill icon="calendar"    value={events.length}        label="Total Events"   accent={CultureTokens.indigo} />
              <StatPill icon="people"      value={totalAttending}       label="Attendees"      accent={CultureTokens.teal} />
              <StatPill icon="ticket"      value={totalTicketsSold}     label="Tickets Sold"   accent={CultureTokens.gold} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <StatPill icon="cash"        value={`$${(totalRevenue / 100).toFixed(0)}`} label="Revenue"   accent={CultureTokens.gold} />
              <StatPill icon="trending-up" value={`${upcoming.length}`}  label="Upcoming"     accent={CultureTokens.coral} />
              <StatPill icon="time"        value={`${past.length}`}      label="Past Events"  accent={colors.textSecondary as string} />
            </View>
          </Animated.View>

          {/* Quick actions */}
          <Animated.View entering={FadeInDown.delay(200).springify().damping(18)} style={vc.section}>
            <Text style={[vc.sectionHeader, { color: colors.textTertiary }]}>QUICK ACTIONS</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { icon: 'add-circle-outline', label: 'New Event', color: CultureTokens.indigo,  route: '/submit' },
                { icon: 'qr-code-outline',    label: 'Scanner',   color: CultureTokens.teal,    route: '/scanner' },
                { icon: 'analytics-outline',  label: 'Organizer', color: CultureTokens.gold, route: '/dashboard/organizer' },
              ].map(a => (
                <Pressable
                  key={a.label}
                  style={({ pressed }) => [vc.qBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => router.push(a.route as never)}
                  accessibilityRole="button"
                >
                  <Ionicons name={a.icon as never} size={20} color={a.color} />
                  <Text style={[vc.qBtnText, { color: colors.textSecondary }]}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Upcoming events */}
          {upcoming.length > 0 && (
            <Animated.View entering={FadeInDown.delay(260).springify().damping(18)} style={vc.section}>
              <Text style={[vc.sectionHeader, { color: colors.textTertiary }]}>UPCOMING EVENTS ({upcoming.length})</Text>
              <View style={[vc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                {upcoming.map((e, i) => (
                  <View key={e.id} style={i < upcoming.length - 1 ? undefined : { borderBottomWidth: 0 }}>
                    <EventRow event={e} />
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Past events */}
          {past.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).springify().damping(18)} style={vc.section}>
              <Text style={[vc.sectionHeader, { color: colors.textTertiary }]}>PAST EVENTS ({past.length})</Text>
              <View style={[vc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                {past.slice(0, 10).map((e, i) => (
                  <View key={e.id} style={i < Math.min(past.length, 10) - 1 ? undefined : { borderBottomWidth: 0 }}>
                    <EventRow event={e} />
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {events.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
              <Ionicons name="storefront-outline" size={48} color={colors.textTertiary} />
              <Text style={[vc.sectionHeader, { color: colors.text, fontSize: 16, textTransform: 'none', letterSpacing: 0 }]}>No events yet</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 }}>
                Start hosting events at your venue to see attendance and revenue data here.
              </Text>
              <Pressable
                style={[vc.ctaBtn, { backgroundColor: CultureTokens.indigo }]}
                onPress={() => router.push('/submit')}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>Submit an Event</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}

export default function VenueDashboard() {
  return (
    <ErrorBoundary>
      <VenueDashboardContent />
    </ErrorBoundary>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const vc = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:     { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  editBtn:     { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  headerSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  section:     { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1.2, marginBottom: 10 },
  card:        { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },

  venueCard:   { 
    marginHorizontal: 20, 
    marginTop: 20, 
    borderRadius: 12, 
    borderWidth: 1, 
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.15)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 4 }
    })
  },
  venueImage:  { width: '100%', height: 120 },
  venueInfo:   { padding: 14 },
  venueName:   { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  venueMeta:   { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  qBtn:        { 
    flex: 1, 
    alignItems: 'center', 
    gap: 6, 
    padding: 14, 
    borderRadius: 12, 
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 }
    })
  },
  qBtnText:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  ctaBtn:      { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
});

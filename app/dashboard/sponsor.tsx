/**
 * Sponsor / Host / Organisation / Business Dashboard
 *
 * Visible to users with role: sponsor, business, organizer, or admin.
 * Shows:
 *  - Events they have sponsored / hosted
 *  - Attendance and ticket reach per event
 *  - Total brand reach & ROI summary
 *  - Invoice / payment history (placeholder)
 */

import Animated, { FadeInDown } from 'react-native-reanimated';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, TextStyles } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';
import type { EventData } from '@/shared/schema';
import { Skeleton } from '@/components/ui/Skeleton';

// ─── Role label map ───────────────────────────────────────────────────────────
const ROLE_LABEL: Record<string, string> = {
  sponsor:   'Sponsor',
  business:  'Business',
  organizer: 'Host / Organiser',
  admin:     'Admin',
  platformAdmin: 'Platform Admin',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface SponsoredEvent extends EventData {
  ticketsSold?: number;
  revenueCents?: number;
  sponsorTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const TIER_COLOR: Record<string, string> = {
  platinum: '#E5E4E2',
  gold:     CultureTokens.gold,
  silver:   '#C0C0C0',
  bronze:   '#CD7F32',
};

// ─── Stat card ───────────────────────────────────────────────────────────────
function MetricCard({ icon, value, label, accent }: { icon: string; value: string | number; label: string; accent: string }) {
  const colors = useColors();
  return (
    <View style={[mc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[mc.icon, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={accent} />
      </View>
      <Text style={[mc.val, { color: colors.text }]}>{value}</Text>
      <Text style={[mc.lbl, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}
const mc = StyleSheet.create({
  card: { 
    flex: 1, 
    minWidth: 80, 
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
  icon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  val:  { ...TextStyles.title3 },
  lbl:  { ...TextStyles.badge, textAlign: 'center' },
});

// ─── Event card ───────────────────────────────────────────────────────────────
function SponsoredEventCard({ event }: { event: SponsoredEvent }) {
  const colors   = useColors();
  const pct      = event.capacity ? Math.min(100, Math.round(((event.attending ?? 0) / event.capacity) * 100)) : null;
  const tierColor = event.sponsorTier ? TIER_COLOR[event.sponsorTier] : CultureTokens.indigo;

  return (
    <Pressable
      style={({ pressed }) => [evc.card, { backgroundColor: pressed ? colors.backgroundSecondary : colors.surface, borderColor: colors.borderLight }]}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      accessibilityRole="button"
    >
      {/* Left accent bar matching sponsor tier */}
      <View style={[evc.tierBar, { backgroundColor: tierColor }]} />

      <View style={evc.inner}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={evc.thumb} contentFit="cover" />
          ) : (
            <View style={[evc.thumb, { backgroundColor: CultureTokens.indigo + '20', alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="calendar" size={18} color={CultureTokens.indigo} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[evc.title, { color: colors.text }]} numberOfLines={2}>{event.title}</Text>
            <Text style={[evc.meta, { color: colors.textSecondary }]}>{fmt(event.date)}{event.time ? ` · ${event.time}` : ''}</Text>
            {event.venue && <Text style={[evc.meta, { color: colors.textTertiary }]} numberOfLines={1}>{event.venue}</Text>}
          </View>
          {event.sponsorTier && (
            <View style={[evc.tierBadge, { backgroundColor: tierColor + '22', borderColor: tierColor + '55' }]}>
              <Text style={[evc.tierText, { color: tierColor }]}>{event.sponsorTier.charAt(0).toUpperCase() + event.sponsorTier.slice(1)}</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={[evc.statsRow, { borderTopColor: colors.borderLight }]}>
          <View style={evc.statItem}>
            <Ionicons name="people-outline" size={13} color={colors.textTertiary} />
            <Text style={[evc.statText, { color: colors.textSecondary }]}>{event.attending ?? 0} attending</Text>
          </View>
          <View style={evc.statItem}>
            <Ionicons name="ticket-outline" size={13} color={colors.textTertiary} />
            <Text style={[evc.statText, { color: colors.textSecondary }]}>{event.ticketsSold ?? 0} tickets</Text>
          </View>
          {event.revenueCents != null && (
            <View style={evc.statItem}>
              <Ionicons name="cash-outline" size={13} color={colors.textTertiary} />
              <Text style={[evc.statText, { color: colors.textSecondary }]}>${(event.revenueCents / 100).toFixed(0)}</Text>
            </View>
          )}
          {pct != null && (
            <View style={evc.statItem}>
              <Ionicons name="trending-up-outline" size={13} color={colors.textTertiary} />
              <Text style={[evc.statText, { color: colors.textSecondary }]}>{pct}% full</Text>
            </View>
          )}
        </View>

        {/* Capacity bar */}
        {pct != null && (
          <View style={[evc.barBg, { backgroundColor: colors.borderLight }]}>
            <View style={[evc.barFill, { width: `${pct}%` as any, backgroundColor: pct > 80 ? CultureTokens.coral : CultureTokens.teal }]} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const evc = StyleSheet.create({
  card:      { 
    flexDirection: 'row', 
    borderRadius: 12, 
    borderWidth: 1, 
    overflow: 'hidden', 
    marginBottom: 12,
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
  tierBar:   { width: 4 },
  inner:     { flex: 1, padding: 14, gap: 10 },
  thumb:     { width: 52, height: 52, borderRadius: 9, overflow: 'hidden' },
  title:     { ...TextStyles.cardTitle, lineHeight: 20 },
  meta:      { ...TextStyles.caption, marginTop: 2 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  tierText:  { ...TextStyles.badge },
  statsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 8, borderTopWidth: 1 },
  statItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText:  { ...TextStyles.caption },
  barBg:     { height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 2 },
});

// ─── Tier legend ─────────────────────────────────────────────────────────────
function TierLegend() {
  const colors = useColors();
  return (
    <View style={[tl.wrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Text style={[tl.header, { color: colors.textTertiary }]}>SPONSORSHIP TIERS</Text>
      {(['platinum', 'gold', 'silver', 'bronze'] as const).map(t => (
        <View key={t} style={tl.row}>
          <View style={[tl.dot, { backgroundColor: TIER_COLOR[t] }]} />
          <Text style={[tl.label, { color: colors.text }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
        </View>
      ))}
    </View>
  );
}
const tl = StyleSheet.create({
  wrap:   { 
    borderRadius: 12, 
    borderWidth: 1, 
    padding: 14, 
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 1 }
    })
  },
  header: { ...TextStyles.badge, letterSpacing: 1.2, marginBottom: 4 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:    { width: 10, height: 10, borderRadius: 5 },
  label:  { ...TextStyles.chip },
});

function SponsorDashboardSkeleton() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topInset }}>
      <View style={{ height: 70, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 }}>
        <Skeleton width={34} height={34} borderRadius={9} />
        <View style={{ flex: 1, gap: 4 }}>
          <Skeleton width="50%" height={20} borderRadius={6} />
          <Skeleton width="40%" height={14} borderRadius={4} />
        </View>
        <Skeleton width={70} height={24} borderRadius={8} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} width="31%" height={80} borderRadius={12} style={{ marginBottom: 10 }} />)}
          </View>
          <View style={{ marginTop: 20, gap: 12 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={100} borderRadius={12} />)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function SponsorDashboardContent() {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { userId, user } = useAuth();
  const { role }  = useRole();

  const roleLabel = ROLE_LABEL[role ?? ''] ?? 'Sponsor';

  // Fetch events this user organised / sponsored
  const { data: eventsData, isLoading } = useQuery<{ events: SponsoredEvent[] }>({
    queryKey: ['/api/events', 'sponsor', userId],
    queryFn: async () => {
      try {
        const res = await api.events.list({ organizerId: userId ?? undefined, pageSize: 100 });
        return { events: (res.events ?? []) as SponsoredEvent[] };
      } catch {
        return { events: [] };
      }
    },
    enabled: !!userId,
  });

  const events   = eventsData?.events ?? [];
  const upcoming = events.filter(e => e.status === 'published' && new Date(e.date ?? '') >= new Date());
  const past     = events.filter(e => new Date(e.date ?? '') < new Date());

  const totalReach    = events.reduce((s, e) => s + (e.attending ?? 0), 0);
  const totalTickets  = events.reduce((s, e) => s + (e.ticketsSold ?? 0), 0);
  const totalRevenue  = events.reduce((s, e) => s + (e.revenueCents ?? 0), 0);
  const avgAttendance = events.length > 0 ? Math.round(totalReach / events.length) : 0;

  return (
    <View style={[sd.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      {/* Header */}
      <View style={[sd.header, { borderBottomColor: colors.borderLight }]}>
        <Pressable
          onPress={() => goBackOrReplace('/(tabs)')}
          style={({ pressed }) => [sd.backBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight, opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[sd.headerTitle, { color: colors.text }]}>{roleLabel} Dashboard</Text>
          <Text style={[sd.headerSub, { color: colors.textTertiary }]}>{user?.displayName ?? user?.username ?? 'Your brand'}</Text>
        </View>
        <View style={[sd.roleBadge, { backgroundColor: CultureTokens.gold + '20', borderColor: CultureTokens.gold + '55' }]}>
          <Ionicons name="ribbon" size={12} color={CultureTokens.gold} />
          <Text style={[sd.roleBadgeText, { color: CultureTokens.gold }]}>{roleLabel}</Text>
        </View>
      </View>

      {isLoading ? (
        <SponsorDashboardSkeleton />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

          {/* ROI summary */}
          <Animated.View entering={FadeInDown.delay(80).springify().damping(18)} style={sd.section}>
            <Text style={[sd.sectionHeader, { color: colors.textTertiary }]}>BRAND REACH & ROI</Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <MetricCard icon="megaphone"      value={totalReach}   label="Total Reach"     accent={CultureTokens.indigo} />
              <MetricCard icon="ticket"         value={totalTickets} label="Tickets Sold"    accent={CultureTokens.teal} />
              <MetricCard icon="cash"           value={`$${(totalRevenue / 100).toFixed(0)}`} label="Revenue"  accent={CultureTokens.gold} />
              <MetricCard icon="trending-up"    value={avgAttendance} label="Avg Attendance" accent={CultureTokens.gold} />
              <MetricCard icon="calendar"       value={events.length} label="Events Backed"  accent={CultureTokens.coral} />
              <MetricCard icon="flash"          value={upcoming.length} label="Upcoming"    accent='#A78BFA' />
            </View>
          </Animated.View>

          {/* Upcoming events */}
          {upcoming.length > 0 && (
            <Animated.View entering={FadeInDown.delay(140).springify().damping(18)} style={sd.section}>
              <Text style={[sd.sectionHeader, { color: colors.textTertiary }]}>UPCOMING ({upcoming.length})</Text>
              {upcoming.map(e => <SponsoredEventCard key={e.id} event={e} />)}
            </Animated.View>
          )}

          {/* Past events */}
          {past.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).springify().damping(18)} style={sd.section}>
              <Text style={[sd.sectionHeader, { color: colors.textTertiary }]}>PAST EVENTS ({past.length})</Text>
              {past.slice(0, 20).map(e => <SponsoredEventCard key={e.id} event={e} />)}
            </Animated.View>
          )}

          {/* Sponsorship tier legend */}
          <Animated.View entering={FadeInDown.delay(220).springify().damping(18)} style={sd.section}>
            <TierLegend />
          </Animated.View>

          {/* Quick actions */}
          <Animated.View entering={FadeInDown.delay(260).springify().damping(18)} style={sd.section}>
            <Text style={[sd.sectionHeader, { color: colors.textTertiary }]}>QUICK ACTIONS</Text>
            <View style={[sd.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {[
                { icon: 'add-circle-outline',   label: 'Create / Sponsor an Event', sub: 'Create a new event or add sponsorship',     route: '/create' },
                { icon: 'grid-outline',          label: 'Organizer Dashboard',       sub: 'Manage your events end-to-end',           route: '/dashboard/organizer' },
                { icon: 'storefront-outline',    label: 'Venue Dashboard',           sub: 'See events at your venue',                route: '/dashboard/venue' },
                { icon: 'person-circle-outline', label: 'Edit Profile',             sub: 'Update your brand / business details',    route: '/profile/edit' },
                { icon: 'wallet-outline',        label: 'Wallet & Payments',         sub: 'View tickets, cashback & wallet pass',    route: '/payment/wallet' },
              ].map((a, i, arr) => (
                <View key={a.route}>
                  <Pressable
                    style={({ pressed }) => [sd.toolRow, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => router.push(a.route)}
                    accessibilityRole="button"
                  >
                    <Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={18} color={CultureTokens.indigo} style={{ marginRight: 4 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[sd.toolLabel, { color: colors.text }]}>{a.label}</Text>
                      <Text style={[sd.toolSub, { color: colors.textTertiary }]}>{a.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
                  </Pressable>
                  {i < arr.length - 1 && <View style={[sd.divider, { backgroundColor: colors.borderLight }]} />}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Empty state */}
          {events.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12, paddingHorizontal: 40 }}>
              <Ionicons name="ribbon-outline" size={48} color={colors.textTertiary} />
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: colors.text }}>No events yet</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                Create an event or add your brand as a sponsor to track attendance and reach here.
              </Text>
              <Pressable
                style={[{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: CultureTokens.indigo }]}
                onPress={() => router.push('/create')}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>Create an Event</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}

export default function SponsorDashboard() {
  return (
    <ErrorBoundary>
      <SponsorDashboardContent />
    </ErrorBoundary>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const sd = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:      { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle:  { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  headerSub:    { ...TextStyles.caption, marginTop: 1 },
  roleBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  roleBadgeText:{ ...TextStyles.badge },

  section:      { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader:{ ...TextStyles.badge, letterSpacing: 1.2, marginBottom: 12 },
  card:         { 
    borderRadius: 12, 
    borderWidth: 1, 
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.05)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 1 }
    })
  },
  divider:      { height: 1 },
  toolRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  toolLabel:    { ...TextStyles.cardTitle },
  toolSub:      { ...TextStyles.caption, marginTop: 1 },
});

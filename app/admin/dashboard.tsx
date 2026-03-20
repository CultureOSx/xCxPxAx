import { View, Text, ScrollView, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, gradients } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { goBackOrReplace } from '@/lib/navigation';

// ─── Super Admin email ───────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = 'jiobaba369@gmail.com';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PlatformStats {
  totalUsers?: number;
  totalEvents?: number;
  totalTicketsSold?: number;
  activeCouncils?: number;
  totalRevenueCents?: number;
  pendingModerationCount?: number;
  activeOrganizers?: number;
  newUsersThisWeek?: number;
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent, index = 0 }: {
  icon: string; label: string; value: string | number; accent: string; index?: number;
}) {
  const colors = useColors();
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify().damping(16)}
      style={[sc.statCard, { backgroundColor: colors.surface, borderColor: accent + '30' }]}
    >
      <View style={[sc.statIconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon as never} size={20} color={accent} />
      </View>
      <Text style={[sc.statVal, { color: colors.text }]}>{value}</Text>
      <Text style={[sc.statLabel, { color: colors.textTertiary }]}>{label}</Text>
      <View style={[sc.statAccentBar, { backgroundColor: accent }]} />
    </Animated.View>
  );
}

// ─── Tool row ────────────────────────────────────────────────────────────────
function ToolRow({ icon, label, sub, accent, onPress, index = 0 }: {
  icon: string; label: string; sub: string; accent: string; onPress: () => void; index?: number;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)} style={animStyle}>
      <Pressable
        style={({ pressed }) => [sc.toolRow, {
          backgroundColor: pressed ? colors.backgroundSecondary : colors.surface,
          borderColor: colors.borderLight,
        }]}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View style={[sc.toolIcon, { backgroundColor: accent + '18' }]}>
          <Ionicons name={icon as never} size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sc.toolLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[sc.toolSub, { color: colors.textTertiary }]}>{sub}</Text>
        </View>
        <View style={[sc.toolArrow, { backgroundColor: accent + '12' }]}>
          <Ionicons name="chevron-forward" size={14} color={accent} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text style={[sc.sectionHeader, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
function AdminDashboardContent() {
  const colors     = useColors();
  const { isDesktop } = useLayout();
  const insets     = useSafeAreaInsets();
  const topInset   = Platform.OS === 'web' ? 0 : insets.top;
  const { user }   = useAuth();
  const { isAdmin, role } = useRole();

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL || role === 'platformAdmin';

  // Query must be called unconditionally (Rules of Hooks) — enabled guards the network request
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/admin/stats');
        return await res.json() as PlatformStats;
      } catch {
        return {};
      }
    },
    staleTime: 60_000,
    enabled: isAdmin,
  });

  // Gate: must be admin or higher
  if (!isAdmin) {
    return (
      <View style={[sc.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="lock-closed" size={48} color={colors.textTertiary} />
        <Text style={[sc.emptyTitle, { color: colors.text }]}>Admin Access Required</Text>
        <Text style={[sc.emptySub, { color: colors.textSecondary }]}>You need admin privileges to access this area.</Text>
      </View>
    );
  }

  const fmtNum = (n?: number) => n != null ? n.toLocaleString() : '—';
  const fmtCents = (c?: number) => c != null ? `$${(c / 100).toLocaleString('en-AU', { minimumFractionDigits: 0 })}` : '—';

  return (
    <View style={[sc.container, { backgroundColor: colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={isSuperAdmin
          ? [CultureTokens.gold + 'cc', CultureTokens.indigo] as [string, string]
          : gradients.midnight as unknown as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: topInset }}
      >
        <Animated.View entering={FadeInUp.duration(320)} style={sc.header}>
          <Pressable
            onPress={() => goBackOrReplace('/(tabs)')}
            style={({ pressed }) => [sc.backBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[sc.headerTitle, { color: '#fff' }]}>
              {isSuperAdmin ? 'Super Admin Hub' : 'Admin Dashboard'}
            </Text>
            <Text style={[sc.headerSub, { color: 'rgba(255,255,255,0.75)' }]}>
              {isSuperAdmin ? 'Full platform control' : `Signed in as ${role}`}
            </Text>
          </View>
          {isSuperAdmin && (
            <View style={[sc.superBadge, { backgroundColor: 'rgba(255,200,87,0.25)', borderColor: CultureTokens.gold }]}>
              <Ionicons name="star" size={11} color={CultureTokens.gold} />
              <Text style={[sc.superBadgeText, { color: CultureTokens.gold }]}>Super</Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

        {/* Platform stats */}
        <View style={sc.section}>
          <SectionHeader label="Platform Overview" />
          {statsLoading ? (
            <ActivityIndicator color={CultureTokens.indigo} style={{ marginVertical: 16 }} />
          ) : (
            <View style={[sc.statsGrid, isDesktop && { flexWrap: 'wrap' }]}>
              <StatCard index={0} icon="people"           label="Total Users"    value={fmtNum(stats?.totalUsers)}                   accent={CultureTokens.indigo} />
              <StatCard index={1} icon="calendar"         label="Events"         value={fmtNum(stats?.totalEvents)}                  accent={CultureTokens.saffron} />
              <StatCard index={2} icon="ticket"           label="Tickets Sold"   value={fmtNum(stats?.totalTicketsSold)}             accent={CultureTokens.teal} />
              <StatCard index={3} icon="cash"             label="Revenue"        value={fmtCents(stats?.totalRevenueCents)}          accent={CultureTokens.gold} />
              <StatCard index={4} icon="shield-checkmark" label="Councils"       value={fmtNum(stats?.activeCouncils)}              accent={CultureTokens.coral} />
              <StatCard index={5} icon="megaphone"        label="Organizers"     value={fmtNum(stats?.activeOrganizers)}            accent='#A78BFA' />
              <StatCard index={6} icon="person-add"       label="New This Week"  value={fmtNum(stats?.newUsersThisWeek)}            accent={CultureTokens.teal} />
              <StatCard index={7} icon="warning"          label="Pending Review" value={fmtNum(stats?.pendingModerationCount)}      accent={CultureTokens.coral} />
            </View>
          )}
        </View>

        {/* User & access management */}
        <View style={sc.section}>
          <SectionHeader label="Users & Access" />
          <View style={[sc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <ToolRow index={0} icon="people-outline"      label="User Management"     sub="Search, edit roles, ban or verify users"     accent={CultureTokens.indigo}  onPress={() => router.push('/admin/users')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow index={1} icon="shield-checkmark-outline" label="Role Assignment" sub="Promote organisers, sponsors, city admins"   accent='#A78BFA'               onPress={() => router.push('/admin/users')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow index={2} icon="id-card-outline"     label="Identity Verification" sub="Approve Sydney-verified user accounts"       accent={CultureTokens.teal}    onPress={() => router.push('/admin/users')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow index={3} icon="at-outline"          label="Handle Approvals"    sub="Approve or reject pending +handles"          accent={CultureTokens.saffron} onPress={() => router.push('/admin/handles')} />
          </View>
        </View>

        {/* Content moderation */}
        <View style={sc.section}>
          <SectionHeader label="Content & Moderation" />
          <View style={[sc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <ToolRow icon="flag-outline"        label="Flagged Content"      sub="Review reports from users"                        accent={CultureTokens.coral}   onPress={() => router.push('/admin/audit-logs')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow icon="calendar-number-outline" label="Event Approvals"  sub="Review pending events before they go live"       accent={CultureTokens.saffron} onPress={() => router.push('/admin/audit-logs')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow icon="list-outline"        label="Audit Logs"           sub="Full activity trail across the platform"         accent={colors.textSecondary}  onPress={() => router.push('/admin/audit-logs')} />
          </View>
        </View>

        {/* Communications */}
        <View style={sc.section}>
          <SectionHeader label="Communications" />
          <View style={[sc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <ToolRow icon="megaphone-outline"   label="Push Notifications"   sub="Send targeted campaigns to user segments"        accent={CultureTokens.saffron} onPress={() => router.push('/admin/notifications')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow icon="mail-outline"        label="Email Campaigns"      sub="Manage transactional & marketing email"          accent={CultureTokens.teal}    onPress={() => router.push('/admin/notifications')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow icon="newspaper-outline"   label="Release Notes"        sub="Publish changelog posts and announcements"       accent={CultureTokens.indigo}  onPress={() => router.push('/admin/updates')} />
          </View>
        </View>

        {/* Finance */}
        <View style={sc.section}>
          <SectionHeader label="Finance & Payments" />
          <View style={[sc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <ToolRow icon="card-outline"        label="Subscription Overview" sub="Active members, MRR, churn rate"                accent={CultureTokens.gold}    onPress={() => router.push('/admin/users')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow icon="receipt-outline"     label="Payouts & Refunds"    sub="Stripe payouts, disputes, refund requests"       accent={CultureTokens.coral}   onPress={() => router.push('/admin/audit-logs')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow icon="bar-chart-outline"   label="Revenue Reports"      sub="Daily, weekly, monthly revenue breakdown"        accent={CultureTokens.teal}    onPress={() => router.push('/admin/audit-logs')} />
          </View>
        </View>

        {/* Super admin only */}
        {isSuperAdmin && (
          <>
            <View style={sc.section}>
              <SectionHeader label="Platform Configuration (Super Admin)" />
              <View style={[sc.card, { backgroundColor: colors.surface, borderColor: CultureTokens.gold + '40' }]}>
                <ToolRow icon="toggle-outline"      label="Feature Flags"        sub="Enable / disable features by rollout %"         accent={CultureTokens.gold}    onPress={() => router.push('/admin/audit-logs')} />
                <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
                <ToolRow icon="globe-outline"       label="City Management"      sub="Add & configure supported cities"                accent={CultureTokens.teal}    onPress={() => router.push('/admin/users')} />
                <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
                <ToolRow icon="key-outline"         label="API Keys & Webhooks"  sub="Manage Stripe, Firebase, 3rd‑party keys"        accent='#A78BFA'               onPress={() => router.push('/admin/audit-logs')} />
                <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
                <ToolRow icon="construct-outline"   label="Platform Settings"    sub="Global app config, rate limits, branding"       accent={CultureTokens.coral}   onPress={() => router.push('/admin/audit-logs')} />
                <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
                <ToolRow icon="server-outline"      label="Platform Health"      sub="API status, error rates, queue metrics"         accent={CultureTokens.saffron} onPress={() => router.push('/admin/audit-logs')} />
              </View>
            </View>

            <View style={sc.section}>
              <SectionHeader label="Data & Compliance" />
              <View style={[sc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <ToolRow icon="download-outline"    label="Data Export"          sub="Export user, event & transaction data (CSV)"    accent={CultureTokens.teal}    onPress={() => router.push('/admin/audit-logs')} />
                <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
                <ToolRow icon="lock-closed-outline" label="Privacy & GDPR"       sub="Handle deletion requests, consent logs"         accent={CultureTokens.coral}   onPress={() => router.push('/admin/audit-logs')} />
                <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
                <ToolRow icon="document-text-outline" label="Terms & Policies"   sub="Update platform terms, privacy policy"         accent={colors.textSecondary}  onPress={() => router.push('/admin/audit-logs')} />
              </View>
            </View>
          </>
        )}

        {/* Quick links to other dashboards */}
        <View style={sc.section}>
          <SectionHeader label="Other Dashboards" />
          <View style={[sc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <ToolRow icon="grid-outline"        label="Organizer Dashboard"  sub="Event creation & ticket management"              accent={CultureTokens.indigo}  onPress={() => router.push('/dashboard/organizer')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow icon="storefront-outline"  label="Venue Dashboard"      sub="Venue analytics & event hosting"                 accent={CultureTokens.teal}    onPress={() => router.push('/dashboard/venue')} />
            <View style={[sc.divider, { backgroundColor: colors.borderLight }]} />
            <ToolRow icon="ribbon-outline"      label="Sponsor Dashboard"    sub="Sponsored events & reach analytics"              accent={CultureTokens.gold}    onPress={() => router.push('/dashboard/sponsor')} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 18 },
  backBtn:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle:    { fontSize: 20, fontFamily: 'Poppins_700Bold', letterSpacing: -0.3 },
  headerSub:      { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  superBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  superBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },

  section:        { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader:  { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1.4, marginBottom: 12 },
  card:           { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  divider:        { height: StyleSheet.hairlineWidth },

  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:       { flex: 1, minWidth: 130, borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  statIconWrap:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statVal:        { fontSize: 22, fontFamily: 'Poppins_700Bold', letterSpacing: -0.5 },
  statLabel:      { fontSize: 11, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  statAccentBar:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 2 },

  toolRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  toolIcon:       { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toolLabel:      { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  toolSub:        { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  toolArrow:      { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  emptyTitle:     { fontSize: 17, fontFamily: 'Poppins_700Bold', marginTop: 16 },
  emptySub:       { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 6 },
});

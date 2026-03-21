import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
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
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/query-client';
import { goBackOrReplace } from '@/lib/navigation';

const isWeb = Platform.OS === 'web';
const SUPER_ADMIN_EMAIL = 'jiobaba369@gmail.com';

interface PlatformStats {
  totalUsers?: number;
  totalEvents?: number;
  totalTicketsSold?: number;
  activeCouncils?: number;
  pendingHandlesCount?: number;
  newUsersThisWeek?: number;
  activeOrganizers?: number;
  pendingModerationCount?: number;
}

// ─── Pressable Card Shell ─────────────────────────────────────────────────────
function TapCard({ onPress, style, children }: {
  onPress: () => void;
  style?: object | object[];
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[anim, Array.isArray(style) ? style : (style ? [style] : undefined)]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94, { damping: 18 }); }}
        onPressOut={() => { scale.value = withSpring(1,    { damping: 18 }); }}
        onPress={onPress}
        style={{ flex: 1 }}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ icon, label, accent, badge, onPress, width }: {
  icon: string; label: string; accent: string; badge?: number;
  onPress: () => void; width: number;
}) {
  const colors = useColors();
  return (
    <TapCard onPress={onPress} style={{ width }}>
      <View style={[qa.card, { backgroundColor: colors.surface, borderColor: accent + '35' }]}>
        <View style={{ position: 'relative' }}>
          <View style={[qa.iconWrap, { backgroundColor: accent + '18' }]}>
            <Ionicons name={icon as never} size={22} color={accent} />
          </View>
          {badge && badge > 0 ? (
            <View style={qa.badge}>
              <Text style={qa.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[qa.label, { color: colors.text }]} numberOfLines={2}>{label}</Text>
      </View>
    </TapCard>
  );
}
const qa = StyleSheet.create({
  card:     { alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, borderWidth: 1 },
  iconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badge:    { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: CultureTokens.coral, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText:{ fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#fff' },
  label:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', lineHeight: 15 },
});

// ─── Stat Tile ────────────────────────────────────────────────────────────────
function StatTile({ icon, label, value, accent, alert, width, index = 0 }: {
  icon: string; label: string; value: string | number; accent: string;
  alert?: boolean; width: number; index?: number;
}) {
  const colors = useColors();
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify().damping(20)}
      style={{ width }}
    >
      <View style={[st.tile, { backgroundColor: colors.surface, borderColor: alert ? CultureTokens.coral + '50' : accent + '25' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={[st.icon, { backgroundColor: accent + '18' }]}>
            <Ionicons name={icon as never} size={18} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.val, { color: alert ? CultureTokens.coral : colors.text }]}>{value}</Text>
            <Text style={[st.lbl, { color: colors.textTertiary }]} numberOfLines={1}>{label}</Text>
          </View>
          {alert ? <View style={st.dot} /> : null}
        </View>
        <View style={[st.bar, { backgroundColor: accent }]} />
      </View>
    </Animated.View>
  );
}
const st = StyleSheet.create({
  tile: { borderRadius: 14, borderWidth: 1, padding: 12, overflow: 'hidden', position: 'relative' },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  val:  { fontSize: 18, fontFamily: 'Poppins_700Bold', letterSpacing: -0.4 },
  lbl:  { fontSize: 10, fontFamily: 'Poppins_500Medium', marginTop: 1 },
  dot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: CultureTokens.coral, flexShrink: 0 },
  bar:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5 },
});

// ─── Nav Card ─────────────────────────────────────────────────────────────────
function NavCard({ icon, label, sub, accent, badge, onPress, width, index = 0 }: {
  icon: string; label: string; sub?: string; accent: string;
  badge?: number | string; onPress: () => void; width: number; index?: number;
}) {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.delay(index * 45).springify().damping(20)} style={{ width }}>
      <TapCard onPress={onPress}>
        <View style={[nc.card, { backgroundColor: colors.surface, borderColor: accent + '30' }]}>
          {/* Icon + badge row */}
          <View style={nc.iconRow}>
            <View style={[nc.icon, { backgroundColor: accent + '18' }]}>
              <Ionicons name={icon as never} size={20} color={accent} />
            </View>
            {badge != null ? (
              <View style={[nc.badge, { backgroundColor: CultureTokens.coral }]}>
                <Text style={nc.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </View>
          {/* Text */}
          <Text style={[nc.label, { color: colors.text }]} numberOfLines={2}>{label}</Text>
          {sub ? <Text style={[nc.sub, { color: colors.textTertiary }]} numberOfLines={2}>{sub}</Text> : null}
          {/* Accent corner */}
          <View style={[nc.corner, { backgroundColor: accent }]} />
        </View>
      </TapCard>
    </Animated.View>
  );
}
const nc = StyleSheet.create({
  card:    { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8, overflow: 'hidden', position: 'relative', minHeight: 110 },
  iconRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  icon:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge:   { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },
  label:   { fontSize: 13, fontFamily: 'Poppins_700Bold', letterSpacing: -0.1, lineHeight: 18 },
  sub:     { fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 15 },
  corner:  { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderTopLeftRadius: 20, opacity: 0.08 },
});

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ label, count, onAction, actionLabel }: {
  label: string; count?: number; onAction?: () => void; actionLabel?: string;
}) {
  const colors = useColors();
  return (
    <View style={sl.row}>
      <Text style={[sl.text, { color: colors.textTertiary }]}>{label}</Text>
      {count != null ? (
        <View style={[sl.countPill, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[sl.countText, { color: colors.textSecondary }]}>{count}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }} />
      {onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={[sl.action, { color: CultureTokens.indigo }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
const sl = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  text:      { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1.4 },
  countPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  countText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  action:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Grid Row ─────────────────────────────────────────────────────────────────
function NavGrid({ children, gap }: { children: React.ReactNode; gap: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{children}</View>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function AdminDashboardContent() {
  const colors   = useColors();
  const { isDesktop, hPad, columnGap, columnWidth, numColumnsWide } = useLayout();
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { user } = useAuth();
  const { isAdmin, role } = useRole();

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL || role === 'platformAdmin';

  // Card widths
  const navCols   = isDesktop ? 3 : 2;
  const qaCols    = isDesktop ? 6 : 3;   // 3 per row on mobile, 6 on desktop
  const statCols  = isDesktop ? 4 : numColumnsWide;  // 4 on desktop, 2 on mobile
  const cardW     = columnWidth(navCols);
  const qaW       = columnWidth(qaCols);
  const statW     = columnWidth(statCols);

  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try { return await api.admin.stats(); } catch { return {}; }
    },
    staleTime: 60_000,
    enabled: isAdmin,
  });

  const { data: handlesData } = useQuery({
    queryKey: ['admin-pending-handles'],
    queryFn: () => api.admin.pendingHandles({ limit: 3 }),
    staleTime: 30_000,
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <View style={[s.fill, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="lock-closed" size={48} color={colors.textTertiary} />
        <Text style={[s.emptyTitle, { color: colors.text, marginTop: 16 }]}>Admin Access Required</Text>
        <Text style={[s.emptySub, { color: colors.textSecondary, marginTop: 6 }]}>You need admin privileges to view this area.</Text>
      </View>
    );
  }

  const fmtNum = (n?: number) => n != null ? n.toLocaleString() : '—';
  const pending = handlesData?.count ?? 0;

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>
      {/* ── Gradient Header ──────────────────────────────────────────────── */}
      <LinearGradient
        colors={isSuperAdmin
          ? [CultureTokens.gold + 'cc', CultureTokens.indigo] as [string, string]
          : gradients.midnight as unknown as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: topInset }}
      >
        <Animated.View entering={FadeInUp.duration(320)} style={[s.header, { paddingHorizontal: hPad }]}>
          <Pressable
            onPress={() => goBackOrReplace('/(tabs)')}
            style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>{isSuperAdmin ? 'Super Admin Hub' : 'Admin Dashboard'}</Text>
            <Text style={s.headerSub}>{isSuperAdmin ? 'Full platform control' : `Signed in as ${role}`}</Text>
          </View>
          {isSuperAdmin ? (
            <View style={s.superBadge}>
              <Ionicons name="star" size={11} color={CultureTokens.gold} />
              <Text style={[s.superBadgeText, { color: CultureTokens.gold }]}>Super</Text>
            </View>
          ) : null}
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 48 }]}
      >

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionLabel label="QUICK ACTIONS" />
          <NavGrid gap={columnGap}>
            <QuickAction width={qaW} icon="cloud-download-outline" label="Import Data"       accent={CultureTokens.teal}    onPress={() => router.push('/admin/import' as never)} />
            <QuickAction width={qaW} icon="megaphone-outline"      label="Notifications"     accent={CultureTokens.saffron} onPress={() => router.push('/admin/notifications')} />
            <QuickAction width={qaW} icon="people-outline"         label="Manage Users"      accent={CultureTokens.indigo}  onPress={() => router.push('/admin/users')} />
            <QuickAction width={qaW} icon="at-outline"             label="Handles"           accent={pending > 0 ? CultureTokens.coral : CultureTokens.saffron} badge={pending > 0 ? pending : undefined} onPress={() => router.push('/admin/handles')} />
            <QuickAction width={qaW} icon="list-outline"           label="Audit Logs"        accent="#A78BFA"               onPress={() => router.push('/admin/audit-logs')} />
            <QuickAction width={qaW} icon="newspaper-outline"      label="Release Notes"     accent={CultureTokens.gold}    onPress={() => router.push('/admin/updates')} />
          </NavGrid>
        </View>

        {/* ── Platform Overview ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionLabel
            label="PLATFORM OVERVIEW"
            onAction={() => queryClient.invalidateQueries({ queryKey: ['admin-stats'] })}
            actionLabel="Refresh"
          />
          {statsLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={CultureTokens.indigo} />
              <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading stats…</Text>
            </View>
          ) : (
            <NavGrid gap={columnGap}>
              <StatTile index={0} width={statW} icon="people"              label="Total Users"     value={fmtNum(stats?.totalUsers)}            accent={CultureTokens.indigo} />
              <StatTile index={1} width={statW} icon="calendar"            label="Live Events"     value={fmtNum(stats?.totalEvents)}           accent={CultureTokens.saffron} />
              <StatTile index={2} width={statW} icon="ticket-outline"      label="Tickets Sold"    value={fmtNum(stats?.totalTicketsSold)}      accent={CultureTokens.teal} />
              <StatTile index={3} width={statW} icon="person-add"          label="New This Week"   value={fmtNum(stats?.newUsersThisWeek)}      accent="#22C55E" />
              <StatTile index={4} width={statW} icon="megaphone-outline"   label="Organizers"      value={fmtNum(stats?.activeOrganizers)}      accent="#A78BFA" />
              <StatTile index={5} width={statW} icon="shield-checkmark"    label="Councils"        value={fmtNum(stats?.activeCouncils)}        accent={CultureTokens.coral} />
              <StatTile index={6} width={statW} icon="at-outline"          label="Pending Handles" value={fmtNum(stats?.pendingHandlesCount)}   accent={CultureTokens.saffron} alert={(stats?.pendingHandlesCount ?? 0) > 0} />
              <StatTile index={7} width={statW} icon="flag-outline"        label="Reports"         value={fmtNum(stats?.pendingModerationCount)} accent={CultureTokens.coral}  alert={(stats?.pendingModerationCount ?? 0) > 0} />
            </NavGrid>
          )}
        </View>

        {/* ── Needs Attention ───────────────────────────────────────────────── */}
        {pending > 0 ? (
          <Animated.View entering={FadeInDown.duration(300)} style={s.section}>
            <Pressable
              style={[s.attentionCard, { backgroundColor: CultureTokens.coral + '10', borderColor: CultureTokens.coral + '35' }]}
              onPress={() => router.push('/admin/handles')}
              accessibilityRole="button"
              accessibilityLabel="Review pending handles"
            >
              <View style={[s.attentionIcon, { backgroundColor: CultureTokens.coral + '20' }]}>
                <Ionicons name="time-outline" size={22} color={CultureTokens.coral} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.attentionTitle, { color: colors.text }]}>
                  {pending} Handle{pending !== 1 ? 's' : ''} Awaiting Approval
                </Text>
                <Text style={[s.attentionSub, { color: colors.textSecondary }]}>
                  Tap to review pending +handle requests
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={CultureTokens.coral} />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* ── Users & Access ────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionLabel label="USERS & ACCESS" count={4} />
          <NavGrid gap={columnGap}>
            <NavCard index={0} width={cardW} icon="people-outline"           label="User Management"      sub="Search, roles & bans"       accent={CultureTokens.indigo}  onPress={() => router.push('/admin/users')} />
            <NavCard index={1} width={cardW} icon="shield-checkmark-outline" label="Role Assignment"       sub="Promote organisers"         accent="#A78BFA"               onPress={() => router.push('/admin/users')} />
            <NavCard index={2} width={cardW} icon="id-card-outline"          label="Identity Verify"       sub="Sydney-verified accounts"   accent={CultureTokens.teal}    onPress={() => router.push('/admin/users')} />
            <NavCard index={3} width={cardW} icon="at-outline"               label="Handle Approvals"      sub={`${pending > 0 ? `${pending} pending` : 'Approve +handles'}`} accent={CultureTokens.saffron} badge={pending > 0 ? pending : undefined} onPress={() => router.push('/admin/handles')} />
          </NavGrid>
        </View>

        {/* ── Content & Moderation ──────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionLabel label="CONTENT & MODERATION" count={3} />
          <NavGrid gap={columnGap}>
            <NavCard index={0} width={cardW} icon="flag-outline"            label="Flagged Content"       sub="Review user reports"        accent={CultureTokens.coral}   onPress={() => router.push('/admin/moderation' as never)} badge={stats?.pendingModerationCount && stats.pendingModerationCount > 0 ? stats.pendingModerationCount : undefined} />
            <NavCard index={1} width={cardW} icon="calendar-number-outline" label="Event Approvals"        sub="Pending events"             accent={CultureTokens.saffron} onPress={() => router.push('/admin/moderation' as never)} />
            <NavCard index={2} width={cardW} icon="list-outline"            label="Audit Logs"             sub="Platform activity trail"    accent="#A78BFA"               onPress={() => router.push('/admin/audit-logs')} />
          </NavGrid>
        </View>

        {/* ── Communications ────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionLabel label="COMMUNICATIONS" count={3} />
          <NavGrid gap={columnGap}>
            <NavCard index={0} width={cardW} icon="megaphone-outline" label="Push Notifications" sub="Targeted campaigns"       accent={CultureTokens.saffron} onPress={() => router.push('/admin/notifications')} />
            <NavCard index={1} width={cardW} icon="mail-outline"      label="Email Campaigns"    sub="Transactional & marketing" accent={CultureTokens.teal}    onPress={() => router.push('/admin/notifications')} />
            <NavCard index={2} width={cardW} icon="newspaper-outline" label="Release Notes"      sub="Changelog & updates"      accent={CultureTokens.indigo}  onPress={() => router.push('/admin/updates')} />
          </NavGrid>
        </View>

        {/* ── Finance & Payments ────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionLabel label="FINANCE & PAYMENTS" count={3} />
          <NavGrid gap={columnGap}>
            <NavCard index={0} width={cardW} icon="card-outline"      label="Subscriptions"    sub="MRR, active members"      accent={CultureTokens.gold}    onPress={() => router.push('/admin/finance' as never)} />
            <NavCard index={1} width={cardW} icon="receipt-outline"   label="Payouts & Refunds" sub="Stripe payouts & disputes" accent={CultureTokens.coral}   onPress={() => router.push('/admin/finance' as never)} />
            <NavCard index={2} width={cardW} icon="bar-chart-outline" label="Revenue Reports"   sub="Daily/weekly breakdown"   accent={CultureTokens.teal}    onPress={() => router.push('/admin/finance' as never)} />
          </NavGrid>
        </View>

        {/* ── Data Import ───────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionLabel label="DATA IMPORT" />
          <Pressable
            style={[s.importCard, { backgroundColor: colors.surface, borderColor: CultureTokens.teal + '40' }]}
            onPress={() => router.push('/admin/import' as never)}
            accessibilityRole="button"
            accessibilityLabel="Go to data import"
          >
            <View style={[s.importIcon, { backgroundColor: CultureTokens.teal + '18' }]}>
              <Ionicons name="cloud-download-outline" size={24} color={CultureTokens.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.importTitle, { color: colors.text }]}>Import Events</Text>
              <Text style={[s.importSub, { color: colors.textTertiary }]}>
                City of Sydney, JSON:API, JSON-LD, generic event pages
              </Text>
            </View>
            <View style={[s.importArrow, { backgroundColor: CultureTokens.teal + '18' }]}>
              <Ionicons name="arrow-forward" size={16} color={CultureTokens.teal} />
            </View>
          </Pressable>
        </View>

        {/* ── Platform Configuration (Super Admin) ──────────────────────────── */}
        {isSuperAdmin ? (
          <>
            <View style={s.section}>
              <SectionLabel label="PLATFORM CONFIGURATION" count={5} />
              <NavGrid gap={columnGap}>
                <NavCard index={0} width={cardW} icon="toggle-outline"    label="Feature Flags"    sub="Rollout % controls"       accent={CultureTokens.gold}    onPress={() => router.push('/admin/platform' as never)} />
                <NavCard index={1} width={cardW} icon="globe-outline"     label="City Management"  sub="Add supported cities"     accent={CultureTokens.teal}    onPress={() => router.push('/admin/platform' as never)} />
                <NavCard index={2} width={cardW} icon="key-outline"       label="API Keys"         sub="Stripe, Firebase, 3rd-party" accent="#A78BFA"            onPress={() => router.push('/admin/platform' as never)} />
                <NavCard index={3} width={cardW} icon="construct-outline" label="Platform Settings" sub="Config, rate limits"     accent={CultureTokens.coral}   onPress={() => router.push('/admin/platform' as never)} />
                <NavCard index={4} width={cardW} icon="server-outline"    label="Platform Health"  sub="API status & metrics"     accent={CultureTokens.saffron} onPress={() => router.push('/admin/platform' as never)} />
              </NavGrid>
            </View>

            {/* ── Data & Compliance ─────────────────────────────────────────── */}
            <View style={s.section}>
              <SectionLabel label="DATA & COMPLIANCE" count={3} />
              <NavGrid gap={columnGap}>
                <NavCard index={0} width={cardW} icon="download-outline"      label="Data Export"     sub="Users, events, CSV"       accent={CultureTokens.teal}    onPress={() => router.push('/admin/data-compliance' as never)} />
                <NavCard index={1} width={cardW} icon="lock-closed-outline"   label="Privacy & GDPR"  sub="Deletion & consent logs"  accent={CultureTokens.coral}   onPress={() => router.push('/admin/data-compliance' as never)} />
                <NavCard index={2} width={cardW} icon="document-text-outline" label="Terms & Policies" sub="Legal document links"     accent="#A78BFA"               onPress={() => router.push('/admin/data-compliance' as never)} />
              </NavGrid>
            </View>
          </>
        ) : null}

        {/* ── Other Dashboards ──────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionLabel label="OTHER DASHBOARDS" count={3} />
          <NavGrid gap={columnGap}>
            <NavCard index={0} width={cardW} icon="grid-outline"       label="Organizer"    sub="Events & tickets"           accent={CultureTokens.indigo}  onPress={() => router.push('/dashboard/organizer' as never)} />
            <NavCard index={1} width={cardW} icon="storefront-outline" label="Venue"        sub="Analytics & hosting"        accent={CultureTokens.teal}    onPress={() => router.push('/dashboard/venue' as never)} />
            <NavCard index={2} width={cardW} icon="ribbon-outline"     label="Sponsor"      sub="Sponsored events & reach"   accent={CultureTokens.gold}    onPress={() => router.push('/dashboard/sponsor' as never)} />
          </NavGrid>
        </View>

      </ScrollView>
    </View>
  );
}

export default function AdminDashboard() {
  return <ErrorBoundary><AdminDashboardContent /></ErrorBoundary>;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  fill:           { flex: 1 },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  backBtn:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerTitle:    { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.3 },
  headerSub:      { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  superBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, backgroundColor: 'rgba(255,200,87,0.25)', borderColor: CultureTokens.gold },
  superBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },

  // Scroll
  scroll:         { paddingTop: 20 },
  section:        { marginBottom: 24 },

  // Loading
  loadingRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20 },
  loadingText:    { fontSize: 14, fontFamily: 'Poppins_400Regular' },

  // Attention banner
  attentionCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  attentionIcon:  { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  attentionTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  attentionSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },

  // Import CTA
  importCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, borderWidth: 1, padding: 16 },
  importIcon:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  importTitle:    { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  importSub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  importArrow:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Empty state
  emptyTitle:     { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  emptySub:       { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
});

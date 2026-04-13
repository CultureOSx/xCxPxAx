// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { CultureTokens } from '@/constants/theme';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  id: string;
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route?: string;
  change?: string;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

interface AdminTool {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'ingest',
    label: 'Event Ingestion',
    description: 'Import & process events',
    icon: 'cloud-upload-outline',
    color: CultureTokens.indigo,
    route: '/admin/dashboard/event-ingest',
  },
  {
    id: 'import',
    label: 'Bulk Import',
    description: 'CSV / JSON import',
    icon: 'document-text-outline',
    color: CultureTokens.teal,
    route: '/admin/import',
  },
  {
    id: 'geohash',
    label: 'Geo backfill',
    description: 'Align coordinates & geohashes',
    icon: 'earth-outline',
    color: CultureTokens.teal,
    route: '/admin/cockpit',
  },
  {
    id: 'moderation',
    label: 'Moderation',
    description: 'Review flagged content',
    icon: 'eye-outline',
    color: '#F59E0B',
    route: '/admin/moderation',
  },
];

const ADMIN_TOOLS: AdminTool[] = [
  { id: 'events',     label: 'Events',            icon: 'calendar-outline',          route: '/admin/events',          color: CultureTokens.gold },
  { id: 'users',      label: 'Users',             icon: 'people-outline',            route: '/admin/users',           color: CultureTokens.indigo },
  { id: 'profiles',   label: 'Profiles',          icon: 'id-card-outline',           route: '/admin/profiles',        color: CultureTokens.teal },
  { id: 'communities',label: 'Communities',       icon: 'people-circle-outline',     route: '/admin/communities',     color: CultureTokens.indigo },
  { id: 'perks',      label: 'Perks',             icon: 'gift-outline',              route: '/admin/perks',           color: CultureTokens.coral },
  { id: 'tickets',    label: 'Tickets',           icon: 'ticket-outline',            route: '/admin/tickets',         color: CultureTokens.purple },
  { id: 'audit',      label: 'Audit Logs',         icon: 'list-outline',              route: '/admin/audit-logs' },
  { id: 'notify',     label: 'Notifications',      icon: 'megaphone-outline',         route: '/admin/notifications',   color: CultureTokens.coral },
  { id: 'finance',    label: 'Finance',            icon: 'card-outline',              route: '/admin/finance',         color: CultureTokens.teal },
  { id: 'compliance', label: 'Data Compliance',    icon: 'shield-checkmark-outline',  route: '/admin/data-compliance', color: CultureTokens.teal },
  { id: 'discover',   label: 'Discover Curation',  icon: 'sparkles-outline',          route: '/admin/discover',        color: CultureTokens.purple },
  { id: 'handles',    label: 'Handles',            icon: 'at-outline',                route: '/admin/handles' },
  { id: 'platform',   label: 'Platform Settings',  icon: 'settings-outline',          route: '/admin/platform' },
  { id: 'updates',    label: 'Updates',            icon: 'newspaper-outline',         route: '/admin/updates' },
  { id: 'locations',  label: 'Locations',          icon: 'location-outline',          route: '/admin/locations' },
];

// ─── Stat card component ──────────────────────────────────────────────────────
function StatTile({ stat }: { stat: StatCard }) {
  const colors = useColors();
  const content = (
    <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
      <View style={[styles.statIconWrap, { backgroundColor: stat.color + '18' }]}>
        <Ionicons name={stat.icon} size={20} color={stat.color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>{stat.label}</Text>
      {stat.change && (
        <Text style={[styles.statChange, { color: stat.change.startsWith('+') ? colors.success : colors.textTertiary }]}>
          {stat.change}
        </Text>
      )}
    </View>
  );

  if (stat.route) {
    return (
      <Pressable
        onPress={() => router.push(stat.route as any)}
        style={({ pressed }) => [{ flex: 1, minWidth: 120 }, pressed && { opacity: 0.8 }]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={{ flex: 1, minWidth: 120 }}>{content}</View>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const colors = useColors();
  const { isDesktop, contentWidth, hPad } = useLayout();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatCard[]>([
    { id: 'users',   label: 'Total Users',      value: '—', icon: 'people-outline',      color: CultureTokens.indigo, route: '/admin/users' },
    { id: 'events',  label: 'Live Events',       value: '—', icon: 'calendar-outline',    color: CultureTokens.teal,   route: '/events' },
    { id: 'tickets', label: 'Tickets Issued',    value: '—', icon: 'ticket-outline',      color: CultureTokens.coral },
    { id: 'revenue', label: 'Revenue (30d)',     value: '—', icon: 'card-outline',         color: colors.success,         route: '/admin/finance' },
    { id: 'pending', label: 'Pending Review',    value: '—', icon: 'eye-outline',          color: CultureTokens.gold,     route: '/admin/moderation' },
    { id: 'reports', label: 'Open Reports',      value: '—', icon: 'flag-outline',         color: CultureTokens.error },
  ]);

  const loadStats = async () => {
    try {
      // Fetch user count from admin endpoint
      const [usersRes, eventsRes] = await Promise.allSettled([
        api.admin.listUsers({ limit: 1 }),
        api.events.list({ pageSize: 1 }),
      ]);

      setStats((prev) => prev.map((s) => {
        if (s.id === 'users' && usersRes.status === 'fulfilled') {
          const total = (usersRes.value as any)?.total ?? (usersRes.value as any)?.data?.length ?? '—';
          return { ...s, value: typeof total === 'number' ? total.toLocaleString() : '—' };
        }
        if (s.id === 'events' && eventsRes.status === 'fulfilled') {
          const total = (eventsRes.value as any)?.total ?? '—';
          return { ...s, value: typeof total === 'number' ? total.toLocaleString() : '—' };
        }
        return s;
      }));
    } catch {
      // Stats remain as '—' if API unavailable
    }
  };

  useEffect(() => { loadStats(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const now = new Date();
  const greetingHour = now.getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const adminName = user?.displayName?.split(' ')[0] ?? 'Admin';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 48, paddingHorizontal: hPad },
          isDesktop && { width: contentWidth, alignSelf: 'center' as const },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={CultureTokens.indigo} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <LinearGradient
            colors={[CultureTokens.indigo + '18', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.headerAdminBadge, { backgroundColor: CultureTokens.coral + '18', borderColor: CultureTokens.coral + '40' }]}>
            <Ionicons name="shield-checkmark" size={12} color={CultureTokens.coral} />
            <Text style={[styles.headerAdminBadgeText, { color: CultureTokens.coral }]}>Admin Access</Text>
          </View>
          <Text style={[styles.headerGreeting, { color: colors.text }]}>
            {greeting}, {adminName} ✦
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* ── Stats grid ── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PLATFORM OVERVIEW</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <StatTile key={stat.id} stat={stat} />
          ))}
        </View>

        {/* ── Quick Actions ── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUICK ACTIONS</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => router.push(action.route as any)}
              style={({ pressed }) => [
                styles.quickActionCard,
                { backgroundColor: colors.surfaceElevated, borderColor: action.color + '30' },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={[action.color + '14', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
              <Text style={[styles.quickActionDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                {action.description}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={action.color} style={{ marginTop: 8, alignSelf: 'flex-end' }} />
            </Pressable>
          ))}
        </View>

        {/* ── All Admin Tools ── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ALL TOOLS</Text>
        <View style={[styles.toolsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
          {ADMIN_TOOLS.map((tool, idx) => (
            <React.Fragment key={tool.id}>
              <Pressable
                onPress={() => router.push(tool.route as any)}
                style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                  styles.toolRow,
                  (pressed || hovered) && { backgroundColor: colors.primarySoft },
                ]}
              >
                <View style={[styles.toolIcon, { backgroundColor: (tool.color ?? colors.textTertiary) + '18' }]}>
                  <Ionicons name={tool.icon} size={18} color={tool.color ?? colors.textSecondary} />
                </View>
                <Text style={[styles.toolLabel, { color: colors.text }]}>{tool.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
              </Pressable>
              {idx < ADMIN_TOOLS.length - 1 && (
                <View style={[styles.toolDivider, { backgroundColor: colors.divider }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* ── Danger Zone ── */}
        <Text style={[styles.sectionTitle, { color: colors.error + 'AA' }]}>DANGER ZONE</Text>
        <View style={[styles.dangerCard, { borderColor: colors.error + '30', backgroundColor: colors.error + '08' }]}>
          <Pressable
            onPress={() => router.push('/admin/platform' as any)}
            style={({ pressed }) => [styles.dangerRow, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.dangerLabel, { color: colors.error }]}>Platform Settings</Text>
              <Text style={[styles.dangerDesc, { color: colors.textSecondary }]}>Feature flags, maintenance mode, kill switches</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.error + '80'} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: 0 },

  // Header
  header: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    gap: 6,
  },
  headerAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  headerAdminBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  headerGreeting: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  // Section labels
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  statChange: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 2,
  },

  // Quick actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 6,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.2,
  },
  quickActionDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  // All tools list
  toolsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 14,
  },
  toolIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toolLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  toolDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },

  // Danger zone
  dangerCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dangerLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  dangerDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
});

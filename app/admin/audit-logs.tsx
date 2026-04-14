import { useEffect, useMemo, useState } from 'react';
import {
  Alert, ActivityIndicator, FlatList, Platform, Pressable,
  Share, StyleSheet, Text, TextInput, View, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
import { api, type AdminAuditLog } from '@/lib/api';
import {
  CardTokens,
  ChipTokens,
  CultureTokens,
  FontFamily,
  FontSize,
  gradients,
  IconSize,
  Spacing,
  TextStyles,
} from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ─── Action meta ─────────────────────────────────────────────────────────────
const ACTION_META: Record<string, { label: string; color: string; icon: string; category: string }> = {
  'notifications.targeted.dry_run': { label: 'Notif Dry Run',   color: CultureTokens.teal,    icon: 'eye-outline',          category: 'notifications' },
  'notifications.targeted.send':    { label: 'Notif Live Send', color: CultureTokens.indigo,  icon: 'send',                  category: 'notifications' },
  'event.created':                  { label: 'Event Created',   color: CultureTokens.gold, icon: 'calendar-outline',      category: 'events' },
  'event.updated':                  { label: 'Event Updated',   color: CultureTokens.gold, icon: 'create-outline',        category: 'events' },
  'event.deleted':                  { label: 'Event Deleted',   color: CultureTokens.coral,   icon: 'trash-outline',         category: 'events' },
  'event.published':                { label: 'Event Published', color: CultureTokens.success,   icon: 'checkmark-circle-outline', category: 'events' },
  'user.role_changed':              { label: 'Role Changed',    color: CultureTokens.purple,    icon: 'shield-outline',        category: 'users' },
  'user.verified':                  { label: 'User Verified',   color: CultureTokens.teal,    icon: 'checkmark-circle-outline', category: 'users' },
  'user.banned':                    { label: 'User Banned',     color: CultureTokens.coral,   icon: 'ban-outline',           category: 'users' },
  'handle.approved':                { label: 'Handle Approved', color: CultureTokens.success,   icon: 'at-outline',            category: 'handles' },
  'handle.rejected':                { label: 'Handle Rejected', color: CultureTokens.coral,   icon: 'at-outline',            category: 'handles' },
  'import.url':                     { label: 'URL Import',      color: CultureTokens.teal,    icon: 'cloud-download-outline', category: 'data' },
  'import.json':                    { label: 'JSON Import',     color: CultureTokens.indigo,  icon: 'code-slash-outline',    category: 'data' },
  'import.clear':                   { label: 'Import Cleared',  color: CultureTokens.coral,   icon: 'trash-outline',         category: 'data' },
};

const ALL = '__all__';
type FilterTab = typeof ALL | 'notifications' | 'events' | 'users' | 'handles' | 'data';

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: ALL,             label: 'All',           icon: 'list-outline' },
  { key: 'notifications', label: 'Notifications', icon: 'megaphone-outline' },
  { key: 'events',        label: 'Events',        icon: 'calendar-outline' },
  { key: 'users',         label: 'Users',         icon: 'people-outline' },
  { key: 'handles',       label: 'Handles',       icon: 'at-outline' },
  { key: 'data',          label: 'Data',          icon: 'cloud-download-outline' },
];

function getMeta(action: string) {
  return ACTION_META[action] ?? {
    label:    action.split('.').slice(-2).join(' '),
    color:    '#8E8E93',
    icon:     'terminal-outline',
    category: 'other',
  };
}

const AUDIT_UI = {
  listHeaderMaxWidth: 960,
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtFull(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────
function StatChip({ value, label, color, icon }: { value: number | string; label: string; color: string; icon: string }) {
  const colors = useColors();
  return (
    <View style={[sp.chip, { backgroundColor: colors.surface, borderColor: color + '30' }]}>
      <View style={[sp.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={color} />
      </View>
      <View>
        <Text style={[sp.val, { color: colors.text }]}>{value}</Text>
        <Text style={[sp.lbl, { color: colors.textTertiary }]}>{label}</Text>
      </View>
    </View>
  );
}
const sp = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: ChipTokens.paddingH - 4, paddingVertical: Spacing.sm + 2, borderRadius: CardTokens.radius - 2, borderWidth: 1 },
  icon: { width: IconSize.lg + 6, height: IconSize.lg + 6, borderRadius: Spacing.sm + 1, alignItems: 'center', justifyContent: 'center' },
  val:  { fontSize: FontSize.body, fontFamily: FontFamily.bold },
  lbl:  { fontSize: FontSize.tab, fontFamily: FontFamily.medium },
});

// ─── Log Entry Row ────────────────────────────────────────────────────────────
function LogRow({ item, index }: { item: AdminAuditLog; index: number }) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const [expanded, setExpanded] = useState(false);
  const meta = getMeta(item.action);
  const activeFilters = Object.entries(item.filters ?? {})
    .filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => ({ key: k, value: Array.isArray(v) ? v.join(', ') : String(v) }));

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 240)).springify().damping(20)}>
      <Pressable
        style={({ pressed }) => [lr.card, { backgroundColor: colors.surface, borderColor: colors.borderLight },
          pressed && { backgroundColor: colors.surfaceElevated }]}
        onPress={() => setExpanded(e => !e)}
        accessibilityRole="button"
        accessibilityLabel={`Log: ${item.action}`}
      >
        {/* Accent bar */}
        <View style={[lr.accent, { backgroundColor: meta.color }]} />

        <View style={{ flex: 1, gap: 10 }}>
          {/* Top row */}
          <View style={lr.topRow}>
            <View style={[lr.badge, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
              <Ionicons name={meta.icon as keyof typeof Ionicons.glyphMap} size={12} color={meta.color} />
              <Text style={[lr.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            {item.targetedCount > 0 ? (
              <View style={lr.audienceChip}>
                <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                <Text style={[lr.audienceText, { color: colors.textSecondary }]}>
                  {item.targetedCount.toLocaleString()} users
                </Text>
              </View>
            ) : null}
            <View style={{ flex: 1 }} />
            <Text style={[lr.timeText, { color: colors.textTertiary }]}>{timeAgo(item.createdAt)}</Text>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textTertiary} />
          </View>

          {/* Meta blocks */}
          <View style={[lr.metaRow, isDesktop && lr.metaRowDesktop]}>
            <View style={lr.metaBlock}>
              <Text style={[lr.metaKey, { color: colors.textTertiary }]}>Actor</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[lr.rolePill, { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo + '40' }]}>
                  <Text style={[lr.rolePillText, { color: CultureTokens.indigo }]}>{item.actorRole}</Text>
                </View>
                <Text style={[lr.metaVal, { color: colors.text }]} numberOfLines={1}>
                  {item.actorId.length > 16 ? `${item.actorId.slice(0, 8)}…${item.actorId.slice(-5)}` : item.actorId}
                </Text>
              </View>
            </View>
            <View style={lr.metaBlock}>
              <Text style={[lr.metaKey, { color: colors.textTertiary }]}>Endpoint</Text>
              <View style={[lr.codeChip, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[lr.codeText, { color: colors.text }]} numberOfLines={1}>{item.endpoint}</Text>
              </View>
            </View>
            <View style={lr.metaBlock}>
              <Text style={[lr.metaKey, { color: colors.textTertiary }]}>Time</Text>
              <Text style={[lr.metaVal, { color: colors.textSecondary }]}>{fmtFull(item.createdAt)}</Text>
            </View>
          </View>

          {/* Expanded */}
          {expanded ? (
            <View style={[lr.expanded, { borderTopColor: colors.divider }]}>
              <Text style={[lr.expandedTitle, { color: colors.textTertiary }]}>Campaign Filters</Text>
              {activeFilters.length > 0 ? (
                <View style={lr.filterGrid}>
                  {activeFilters.map(f => (
                    <View key={f.key} style={[lr.filterChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                      <Text style={[lr.filterKey, { color: colors.textTertiary }]}>{f.key}</Text>
                      <Text style={[lr.filterVal, { color: colors.text }]} numberOfLines={1}>{f.value}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[lr.noFilters, { color: colors.textTertiary }]}>No targeting filters — broadcast to all.</Text>
              )}
              <View style={[lr.idRow, { borderTopColor: colors.divider }]}>
                <Text style={[lr.metaKey, { color: colors.textTertiary }]}>Log ID</Text>
                <Text style={[lr.codeText, { color: colors.textTertiary, flex: 1 }]} numberOfLines={1}>{item.id}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const lr = StyleSheet.create({
  card:       { flexDirection: 'row', gap: Spacing.md - 2, borderRadius: CardTokens.radius, borderWidth: 1, overflow: 'hidden', padding: Spacing.md - 2 },
  accent:     { width: Spacing.xs - 1, borderRadius: Spacing.xs - 2, alignSelf: 'stretch', flexShrink: 0, marginLeft: -(Spacing.md - 2), marginRight: 0 },
  topRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 3, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: CardTokens.radius - 7, borderWidth: 1 },
  badgeText:  { fontSize: FontSize.micro, fontFamily: FontFamily.bold },
  audienceChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  audienceText: { fontSize: FontSize.caption, fontFamily: FontFamily.medium },
  timeText:   { fontSize: FontSize.caption, fontFamily: FontFamily.regular },
  metaRow:    { gap: Spacing.sm },
  metaRowDesktop: { flexDirection: 'row', gap: CardTokens.paddingLarge },
  metaBlock:  { flex: 1, gap: Spacing.xs },
  metaKey:    { fontSize: FontSize.tab, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  metaVal:    { fontSize: FontSize.chip, fontFamily: FontFamily.medium, flex: 1 },
  rolePill:   { paddingHorizontal: Spacing.sm - 2, paddingVertical: Spacing.xs - 2, borderRadius: Spacing.sm - 2, borderWidth: 1 },
  rolePillText: { fontSize: FontSize.tab, fontFamily: FontFamily.bold },
  codeChip:   { borderRadius: Spacing.sm - 2, paddingHorizontal: Spacing.sm - 1, paddingVertical: Spacing.xs - 1 },
  codeText:   { fontSize: FontSize.caption, fontFamily: FontFamily.regular },
  expanded:   { paddingTop: Spacing.md - 4, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.sm + 2 },
  expandedTitle: { fontSize: FontSize.tab, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterChip: { borderRadius: CardTokens.radius - 6, borderWidth: 1, paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.sm - 1, minWidth: 90, maxWidth: 220 },
  filterKey:  { fontSize: FontSize.tab, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.xs - 2 },
  filterVal:  { fontSize: FontSize.chip, fontFamily: FontFamily.medium },
  noFilters:  { fontSize: FontSize.caption, fontFamily: FontFamily.regular, fontStyle: 'italic' },
  idRow:      { paddingTop: Spacing.sm + 2, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
function AuditLogsContent() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { isDesktop, hPad } = useLayout();
  const { user }  = useAuth();
  const { hasMinRole, isLoading: roleLoading } = useRole();
  const canAccess  = hasMinRole('cityAdmin');
  const isCityAdmin = user?.role === 'cityAdmin';

  const [tab,       setTab]       = useState<FilterTab>(ALL);
  const [limitText, setLimitText] = useState('100');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');

  useEffect(() => {
    if (!roleLoading && !canAccess) router.replace('/(tabs)');
  }, [canAccess, roleLoading]);

  const limit = useMemo(() => {
    const n = parseInt(limitText, 10);
    return Number.isFinite(n) && n >= 1 ? Math.min(n, 500) : 100;
  }, [limitText]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-audit-logs', limit, fromDate, toDate, isCityAdmin, user?.id],
    queryFn:  () => api.admin.auditLogs({
      limit,
      from:    fromDate.trim() || undefined,
      to:      toDate.trim()   || undefined,
      actorId: isCityAdmin ? user?.id : undefined,
    }),
    enabled: canAccess,
    staleTime: 30_000,
  });

  const allLogs = useMemo(() => data?.logs ?? [], [data]);

  const filteredLogs = useMemo(() => {
    if (tab === ALL) return allLogs;
    return allLogs.filter(l => getMeta(l.action).category === tab);
  }, [allLogs, tab]);

  const totalReach  = allLogs.reduce((sum, l) => sum + (l.targetedCount ?? 0), 0);
  const liveCount   = allLogs.filter(l => !l.dryRun).length;
  const dryRunCount = allLogs.filter(l => l.dryRun).length;

  const handleExportCsv = async () => {
    try {
      const csv = await api.admin.auditLogsCsv({ limit, from: fromDate.trim() || undefined, to: toDate.trim() || undefined });
      await Share.share({ title: 'CulturePass Audit Logs', message: csv });
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Failed to export CSV');
    }
  };

  if (roleLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <View style={[s.fill, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={gradients.midnight as unknown as [string, string]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: topInset }}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={[s.header, { paddingHorizontal: hPad }]}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')}
            style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Audit Logs</Text>
            <Text style={s.headerSub}>
              {isLoading ? 'Loading…' : `${data?.count ?? 0} entries${isFetching ? ' · Refreshing…' : ''}`}
            </Text>
          </View>
          <Pressable onPress={() => refetch()} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Refresh">
            <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <Pressable onPress={handleExportCsv} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Export CSV">
            <Ionicons name="download-outline" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <Pressable onPress={() => router.push('/admin/users')} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Users">
            <Ionicons name="people-outline" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <Pressable onPress={() => router.push('/admin/notifications')} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Notifications">
            <Ionicons name="megaphone-outline" size={18} color="rgba(255,255,255,0.9)" />
          </Pressable>
        </Animated.View>
      </LinearGradient>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.listContent, { paddingHorizontal: hPad, paddingBottom: insets.bottom + 40 }]}
        ListHeaderComponent={
          <View style={[s.listHeader, isDesktop && s.listHeaderDesktop]}>

            {/* Stats */}
            {!isLoading && allLogs.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(40)} style={s.statsRow}>
                <StatChip value={data?.count ?? 0}       label="Total"      color={colors.primary}       icon="document-text-outline" />
                <StatChip value={liveCount}               label="Live Sends" color={CultureTokens.indigo} icon="send" />
                <StatChip value={dryRunCount}             label="Dry Runs"   color={CultureTokens.teal}   icon="eye-outline" />
                <StatChip value={totalReach.toLocaleString()} label="Reach"  color={CultureTokens.gold} icon="people-outline" />
              </Animated.View>
            ) : null}

            {/* Category filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              {FILTER_TABS.map(ft => {
                const active = tab === ft.key;
                const count  = ft.key === ALL ? allLogs.length : allLogs.filter(l => getMeta(l.action).category === ft.key).length;
                return (
                  <Pressable
                    key={ft.key}
                    style={[s.chip, {
                      backgroundColor: active ? CultureTokens.indigo : colors.surface,
                      borderColor: active ? CultureTokens.indigo : colors.borderLight,
                    }]}
                    onPress={() => setTab(ft.key)}
                    accessibilityRole="button"
                  >
                    <Ionicons name={ft.icon as keyof typeof Ionicons.glyphMap} size={12} color={active ? '#fff' : colors.textSecondary} />
                    <Text style={[s.chipText, { color: active ? '#fff' : colors.textSecondary }]}>{ft.label}</Text>
                    <View style={[s.chipCount, { backgroundColor: active ? 'rgba(255,255,255,0.22)' : colors.backgroundSecondary }]}>
                      <Text style={[s.chipCountText, { color: active ? '#fff' : colors.textTertiary }]}>{count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Filter bar */}
            <View style={[s.filterCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[s.filterSectionLabel, { color: colors.textTertiary }]}>Date Range & Limit</Text>
              <View style={[s.filterRow, isDesktop && s.filterRowDesktop]}>
                <View style={s.filterField}>
                  <Text style={[s.filterLabel, { color: colors.textTertiary }]}>From</Text>
                  <View style={[s.dateInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                    <TextInput
                      style={[s.dateText, { color: colors.text }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textTertiary}
                      value={fromDate}
                      onChangeText={setFromDate}
                      autoCorrect={false}
                      autoCapitalize="none"
                      accessibilityLabel="From date"
                    />
                  </View>
                </View>
                <View style={s.filterField}>
                  <Text style={[s.filterLabel, { color: colors.textTertiary }]}>To</Text>
                  <View style={[s.dateInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                    <TextInput
                      style={[s.dateText, { color: colors.text }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textTertiary}
                      value={toDate}
                      onChangeText={setToDate}
                      autoCorrect={false}
                      autoCapitalize="none"
                      accessibilityLabel="To date"
                    />
                  </View>
                </View>
                <View style={s.filterField}>
                  <Text style={[s.filterLabel, { color: colors.textTertiary }]}>Limit</Text>
                  <View style={[s.dateInput, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                    <Ionicons name="list-outline" size={14} color={colors.textTertiary} />
                    <TextInput
                      style={[s.dateText, { color: colors.text }]}
                      placeholder="100"
                      placeholderTextColor={colors.textTertiary}
                      value={limitText}
                      onChangeText={setLimitText}
                      keyboardType="numeric"
                      accessibilityLabel="Limit"
                    />
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [s.applyBtn, { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => refetch()}
                  accessibilityRole="button"
                  accessibilityLabel="Apply filters"
                >
                  <Ionicons name="search" size={14} color="#fff" />
                  <Text style={s.applyText}>Apply</Text>
                </Pressable>
              </View>
            </View>

            {/* Row count */}
            {!isLoading && filteredLogs.length > 0 ? (
              <Text style={[s.countLabel, { color: colors.textTertiary }]}>
                {filteredLogs.length} {tab !== ALL ? FILTER_TABS.find(f => f.key === tab)?.label.toLowerCase() : ''} entries
                {fromDate || toDate ? ` · ${[fromDate, toDate].filter(Boolean).join(' → ')}` : ''}
              </Text>
            ) : null}

            {isLoading ? (
              <View style={s.loadingWrap}>
                <ActivityIndicator color={CultureTokens.indigo} size="large" />
                <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading logs…</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => <LogRow item={item} index={index} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={s.emptyWrap}>
              <Ionicons name="document-text-outline" size={44} color={colors.textTertiary} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>No logs found</Text>
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>
                {tab !== ALL
                  ? `No ${FILTER_TABS.find(f => f.key === tab)?.label.toLowerCase()} entries match.`
                  : 'No entries found for the selected date range.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

export default function AdminAuditLogsScreen() {
  return (
    <ErrorBoundary>
      <AuditLogsContent />
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  fill:             { flex: 1 },
  header:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  headerTitle:      { ...TextStyles.title3, color: '#fff', letterSpacing: -0.2 },
  headerSub:        { ...TextStyles.caption, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.xs - 3 },
  backBtn:          { width: IconSize.xl + Spacing.xs, height: IconSize.xl + Spacing.xs, borderRadius: CardTokens.radius - 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  headerBtn:        { width: IconSize.lg + Spacing.sm + 2, height: IconSize.lg + Spacing.sm + 2, borderRadius: CardTokens.radius - 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },

  listContent:      { paddingTop: Spacing.md, paddingBottom: Spacing.xl, gap: 0 },
  listHeader:       { gap: Spacing.md - 4, marginBottom: Spacing.md - 4 },
  listHeaderDesktop:{ maxWidth: AUDIT_UI.listHeaderMaxWidth, width: '100%', alignSelf: 'center' as const },

  statsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

  chips:            { gap: Spacing.sm, paddingVertical: Spacing.xs - 2 },
  chip:             { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 3, paddingHorizontal: ChipTokens.paddingH - 4, paddingVertical: ChipTokens.paddingV - 1, borderRadius: ChipTokens.radius, borderWidth: 1 },
  chipText:         { fontSize: FontSize.caption, fontFamily: FontFamily.semibold },
  chipCount:        { paddingHorizontal: Spacing.sm - 3, paddingVertical: Spacing.xs - 3, borderRadius: Spacing.sm, minWidth: CardTokens.radius + Spacing.xs, alignItems: 'center' },
  chipCountText:    { fontSize: FontSize.tab, fontFamily: FontFamily.bold },

  filterCard:       { borderRadius: CardTokens.radius, borderWidth: 1, padding: CardTokens.padding, gap: Spacing.md - 4 },
  filterSectionLabel: { fontSize: FontSize.micro, fontFamily: FontFamily.bold, letterSpacing: 1.2, textTransform: 'uppercase' },
  filterRow:        { gap: Spacing.sm + 2 },
  filterRowDesktop: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm + 2 },
  filterField:      { flex: 1, gap: Spacing.sm - 2 },
  filterLabel:      { fontSize: FontSize.tab, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  dateInput:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md - 4, paddingVertical: Spacing.sm + 2, borderRadius: CardTokens.radius - 4, borderWidth: 1 },
  dateText:         { flex: 1, fontSize: FontSize.chip, fontFamily: FontFamily.regular, padding: 0 },
  applyBtn:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm - 2, paddingHorizontal: CardTokens.paddingLarge - 2, paddingVertical: Spacing.sm + 3, borderRadius: CardTokens.radius - 4, ...(Platform.OS === 'web' ? { alignSelf: 'flex-end' as const } : {}) },
  applyText:        { fontSize: FontSize.chip, fontFamily: FontFamily.bold, color: '#fff' },

  countLabel:       { fontSize: FontSize.micro, fontFamily: FontFamily.medium },

  loadingWrap:      { alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: Spacing.xxl },
  loadingText:      { fontSize: FontSize.body2, fontFamily: FontFamily.regular },

  emptyWrap:        { alignItems: 'center', gap: Spacing.sm + 2, paddingVertical: 60 },
  emptyTitle:       { fontSize: FontSize.body, fontFamily: FontFamily.bold },
  emptyText:        { fontSize: FontSize.chip, fontFamily: FontFamily.regular, textAlign: 'center' },
});

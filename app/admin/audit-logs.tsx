import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/lib/auth';
import { api, type AdminAuditLog } from '@/lib/api';
import { CultureTokens } from '@/constants/theme';

// ─── Action metadata ─────────────────────────────────────────────────────────

type ActionKey = 'notifications.targeted.dry_run' | 'notifications.targeted.send' | '__all__';

const ACTION_META: Record<Exclude<ActionKey, '__all__'>, { label: string; color: string; icon: string }> = {
  'notifications.targeted.dry_run': { label: 'Dry Run', color: CultureTokens.teal,    icon: 'eye-outline'  },
  'notifications.targeted.send':    { label: 'Live Send', color: CultureTokens.indigo, icon: 'send'         },
};

function actionMeta(action: string) {
  return ACTION_META[action as Exclude<ActionKey, '__all__'>] ?? {
    label: action.split('.').pop() ?? action,
    color: '#8E8E93',
    icon: 'terminal-outline',
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFull(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatFilters(filters: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(filters)
    .filter(([, v]) => {
      if (v === null || v === undefined || v === '' || v === false) return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    })
    .map(([k, v]) => ({
      key: k,
      value: Array.isArray(v) ? v.join(', ') : String(v),
    }));
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, color, icon }: { value: string | number; label: string; color: string; icon: string }) {
  const colors = useColors();
  return (
    <View style={[sc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[sc.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as never} size={15} color={color} />
      </View>
      <Text style={[sc.value, { color: colors.text }]}>{value}</Text>
      <Text style={[sc.label, { color: colors.textSecondary }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 5, alignItems: 'center' },
  icon:  { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  value: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  label: { fontSize: 10, fontFamily: 'Poppins_500Medium', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Audit log row ────────────────────────────────────────────────────────────

function AuditLogRow({ item }: { item: AdminAuditLog }) {
  const colors   = useColors();
  const { isDesktop } = useLayout();
  const [expanded, setExpanded] = useState(false);
  const meta     = actionMeta(item.action);
  const activeFilters = formatFilters(item.filters ?? {});

  return (
    <Pressable
      style={({ pressed }) => [
        lr.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        pressed && { backgroundColor: colors.surfaceElevated },
      ]}
      onPress={() => setExpanded(e => !e)}
      accessibilityRole="button"
      accessibilityLabel={`Audit log: ${item.action}`}
      accessibilityHint="Tap to expand details"
    >
      {/* Left accent bar */}
      <View style={[lr.accentBar, { backgroundColor: meta.color }]} />

      <View style={{ flex: 1, gap: 8 }}>
        {/* Top row */}
        <View style={lr.topRow}>
          {/* Action badge */}
          <View style={[lr.actionBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '55' }]}>
            <Ionicons name={meta.icon as never} size={12} color={meta.color} />
            <Text style={[lr.actionBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>

          {/* Audience count */}
          <View style={lr.audienceChip}>
            <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
            <Text style={[lr.audienceText, { color: colors.textSecondary }]}>
              {item.targetedCount.toLocaleString()} users
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* Timestamp */}
          <Text style={[lr.timeAgo, { color: colors.textTertiary }]}>{timeAgo(item.createdAt)}</Text>

          {/* Expand chevron */}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.textTertiary}
          />
        </View>

        {/* Main content row — desktop shows columns side by side */}
        <View style={[lr.contentRow, isDesktop && lr.contentRowDesktop]}>
          {/* Actor */}
          <View style={lr.metaBlock}>
            <Text style={[lr.metaLabel, { color: colors.textTertiary }]}>Actor</Text>
            <View style={lr.metaValueRow}>
              <View style={[lr.rolePill, { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo + '40' }]}>
                <Text style={[lr.rolePillText, { color: CultureTokens.indigo }]}>{item.actorRole}</Text>
              </View>
              <Text style={[lr.metaValue, { color: colors.text }]} numberOfLines={1}>
                {item.actorId.length > 16 ? `${item.actorId.slice(0, 8)}…${item.actorId.slice(-6)}` : item.actorId}
              </Text>
            </View>
          </View>

          {/* Endpoint */}
          <View style={lr.metaBlock}>
            <Text style={[lr.metaLabel, { color: colors.textTertiary }]}>Endpoint</Text>
            <Text style={[lr.metaValueCode, { color: colors.text, backgroundColor: colors.surfaceElevated }]} numberOfLines={1}>
              {item.endpoint}
            </Text>
          </View>

          {/* Full timestamp */}
          <View style={lr.metaBlock}>
            <Text style={[lr.metaLabel, { color: colors.textTertiary }]}>Time</Text>
            <Text style={[lr.metaValue, { color: colors.textSecondary }]}>{formatFull(item.createdAt)}</Text>
          </View>
        </View>

        {/* Expanded: active filters */}
        {expanded ? (
          <View style={[lr.expandedWrap, { borderTopColor: colors.divider }]}>
            <Text style={[lr.expandedTitle, { color: colors.textTertiary }]}>Campaign Filters</Text>
            {activeFilters.length > 0 ? (
              <View style={lr.filtersGrid}>
                {activeFilters.map(f => (
                  <View key={f.key} style={[lr.filterChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <Text style={[lr.filterKey, { color: colors.textTertiary }]}>{f.key}</Text>
                    <Text style={[lr.filterVal, { color: colors.text }]} numberOfLines={1}>{f.value}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[lr.noFilters, { color: colors.textTertiary }]}>No targeting filters applied — broadcast to all.</Text>
            )}

            {/* Raw endpoint + log ID */}
            <View style={[lr.rawRow, { borderTopColor: colors.divider }]}>
              <Text style={[lr.rawLabel, { color: colors.textTertiary }]}>Log ID</Text>
              <Text style={[lr.rawVal,   { color: colors.textTertiary }]} numberOfLines={1}>{item.id}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const lr = StyleSheet.create({
  card:           { flexDirection: 'row', gap: 14, borderRadius: 14, borderWidth: 1, overflow: 'hidden', padding: 14 },
  accentBar:      { width: 3, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0, marginLeft: -14, marginRight: 0 },
  topRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  actionBadgeText:{ fontSize: 11, fontFamily: 'Poppins_700Bold' },
  audienceChip:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  audienceText:   { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  timeAgo:        { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  contentRow:     { gap: 8 },
  contentRowDesktop: { flexDirection: 'row', gap: 20 },
  metaBlock:      { gap: 3, flex: 1 },
  metaLabel:      { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  metaValueRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaValue:      { fontSize: 13, fontFamily: 'Poppins_500Medium', flex: 1 },
  metaValueCode:  { fontSize: 12, fontFamily: 'Poppins_400Regular', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  rolePill:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  rolePillText:   { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  expandedWrap:   { paddingTop: 12, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  expandedTitle:  { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1 },
  filtersGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip:     { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, minWidth: 100, maxWidth: 220 },
  filterKey:      { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  filterVal:      { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  noFilters:      { fontSize: 12, fontFamily: 'Poppins_400Regular', fontStyle: 'italic' },
  rawRow:         { paddingTop: 10, marginTop: 2, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rawLabel:       { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6 },
  rawVal:         { flex: 1, fontSize: 11, fontFamily: 'Poppins_400Regular' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AdminAuditLogsScreen() {
  const insets   = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors   = useColors();
  const { isDesktop, hPad } = useLayout();
  const { user } = useAuth();
  const { hasMinRole, isLoading: roleLoading } = useRole();
  const canAccess  = hasMinRole('cityAdmin');
  const isCityAdmin = user?.role === 'cityAdmin';

  const [actionFilter, setActionFilter] = useState<ActionKey>('__all__');
  const [limitText,    setLimitText]    = useState('50');
  const [fromDate,     setFromDate]     = useState('');
  const [toDate,       setToDate]       = useState('');

  useEffect(() => {
    if (!roleLoading && !canAccess) router.replace('/(tabs)');
  }, [canAccess, roleLoading]);

  const limit = useMemo(() => {
    const p = Number(limitText);
    return Number.isFinite(p) && p >= 1 ? Math.min(p, 200) : 50;
  }, [limitText]);

  const logsQuery = useQuery({
    queryKey: ['admin-audit-logs', actionFilter, limit, fromDate, toDate, user?.id, isCityAdmin],
    queryFn: () => api.admin.auditLogs({
      action:  actionFilter === '__all__' ? undefined : actionFilter,
      limit,
      from:    fromDate.trim() || undefined,
      to:      toDate.trim()   || undefined,
      actorId: isCityAdmin ? user?.id : undefined,
    }),
    enabled: canAccess,
  });

  if (roleLoading || (!canAccess && !roleLoading)) {
    return <View style={[s.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  const logs       = logsQuery.data?.logs ?? [];
  const totalCount = logsQuery.data?.count ?? 0;
  const dryRunCount = logs.filter(l => l.dryRun).length;
  const liveCount   = logs.filter(l => !l.dryRun).length;
  const totalReach  = logs.reduce((sum, l) => sum + (l.targetedCount ?? 0), 0);

  const handleExportCsv = async () => {
    try {
      const csv = await api.admin.auditLogsCsv({
        action:  actionFilter === '__all__' ? undefined : actionFilter,
        limit,
        from:    fromDate.trim() || undefined,
        to:      toDate.trim()   || undefined,
        actorId: isCityAdmin ? user?.id : undefined,
      });
      await Share.share({ title: 'CulturePass Audit Logs', message: csv });
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Failed to export CSV');
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset }]}>

      {/* Header */}
      <View style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.divider }]}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={[s.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Audit Logs</Text>
          <Text style={[s.headerSub, { color: colors.textSecondary }]}>
            {totalCount > 0 ? `${totalCount} entries` : 'Campaign dry-runs & sends'}
            {logsQuery.isFetching ? ' · Refreshing…' : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => logsQuery.refetch()}
          style={[s.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="Refresh"
        >
          <Ionicons name="refresh" size={17} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={handleExportCsv}
          style={[s.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="Export CSV"
        >
          <Ionicons name="download-outline" size={17} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/admin/users' as never)}
          style={[s.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="User management"
        >
          <Ionicons name="people-outline" size={17} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/admin/notifications' as never)}
          style={[s.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
          accessibilityRole="button" accessibilityLabel="Campaign manager"
        >
          <Ionicons name="megaphone-outline" size={17} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 0 : insets.bottom) }}
        ListHeaderComponent={
          <View style={[s.contentCol, isDesktop && s.contentColDesktop]}>

            {/* Stats row */}
            {!logsQuery.isLoading && logs.length > 0 ? (
              <View style={s.statsRow}>
                <StatCard value={totalCount}  label="Total Logs"    color={colors.primary}       icon="document-text-outline" />
                <StatCard value={dryRunCount}  label="Dry Runs"     color={CultureTokens.teal}   icon="eye-outline"           />
                <StatCard value={liveCount}    label="Live Sends"   color={CultureTokens.indigo}  icon="send"                  />
                <StatCard value={totalReach.toLocaleString()} label="Total Reach" color={CultureTokens.saffron} icon="people-outline" />
              </View>
            ) : null}

            {/* Filter bar */}
            <View style={[s.filterCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {/* Action type tabs */}
              <Text style={[s.filterLabel, { color: colors.textTertiary }]}>Action Type</Text>
              <View style={s.actionTabs}>
                {(['__all__', 'notifications.targeted.dry_run', 'notifications.targeted.send'] as ActionKey[]).map(key => {
                  const active = actionFilter === key;
                  const meta   = key === '__all__' ? null : ACTION_META[key];
                  const accentColor = meta?.color ?? colors.primary;
                  return (
                    <Pressable
                      key={key}
                      style={[
                        s.actionTab,
                        {
                          backgroundColor: active ? accentColor : colors.surfaceElevated,
                          borderColor:     active ? accentColor : colors.borderLight,
                        },
                      ]}
                      onPress={() => setActionFilter(key)}
                      accessibilityRole="button"
                    >
                      {meta ? <Ionicons name={meta.icon as never} size={13} color={active ? '#FFFFFF' : colors.textSecondary} /> : null}
                      <Text style={[s.actionTabText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                        {key === '__all__' ? 'All Actions' : meta!.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Date range + limit row */}
              <View style={[s.filterRow, isDesktop && s.filterRowDesktop]}>
                <View style={s.filterField}>
                  <Text style={[s.filterLabel, { color: colors.textTertiary }]}>From</Text>
                  <View style={[s.dateInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                    <TextInput
                      style={[s.dateInputText, { color: colors.text }]}
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
                  <View style={[s.dateInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                    <TextInput
                      style={[s.dateInputText, { color: colors.text }]}
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
                  <View style={[s.dateInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <Ionicons name="list-outline" size={14} color={colors.textTertiary} />
                    <TextInput
                      style={[s.dateInputText, { color: colors.text }]}
                      placeholder="50"
                      placeholderTextColor={colors.textTertiary}
                      value={limitText}
                      onChangeText={setLimitText}
                      keyboardType="numeric"
                      accessibilityLabel="Result limit"
                    />
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    s.applyBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.82 },
                  ]}
                  onPress={() => logsQuery.refetch()}
                  accessibilityRole="button"
                  accessibilityLabel="Apply filters"
                >
                  <Ionicons name="search" size={14} color="#FFFFFF" />
                  <Text style={s.applyBtnText}>Apply</Text>
                </Pressable>
              </View>
            </View>

            {/* Section label */}
            {!logsQuery.isLoading && logs.length > 0 ? (
              <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>
                Showing {logs.length} {actionFilter !== '__all__' ? ACTION_META[actionFilter]?.label.toLowerCase() : ''} entries
                {fromDate || toDate ? ` · ${[fromDate, toDate].filter(Boolean).join(' → ')}` : ''}
              </Text>
            ) : null}

            {logsQuery.isLoading ? (
              <View style={[s.center, { paddingVertical: 60 }]}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading logs…</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 300)).springify()} style={[s.contentCol, isDesktop && s.contentColDesktop, { paddingTop: 0 }]}>
            <AuditLogRow item={item} />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          logsQuery.isLoading ? null : (
            <View style={[s.contentCol, isDesktop && s.contentColDesktop]}>
              <View style={[s.empty, { borderColor: colors.borderLight }]}>
                <Ionicons name="document-text-outline" size={40} color={colors.textTertiary} />
                <Text style={[s.emptyTitle, { color: colors.text }]}>No logs found</Text>
                <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                  {actionFilter !== '__all__'
                    ? `No ${ACTION_META[actionFilter]?.label.toLowerCase()} entries match your filters.`
                    : 'No audit log entries found for the selected date range.'}
                </Text>
              </View>
            </View>
          )
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CONTENT_MAX = 960;

const s = StyleSheet.create({
  container:        { flex: 1 },
  center:           { alignItems: 'center', justifyContent: 'center', gap: 12 },

  header:           {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:          { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconBtn:          { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle:      { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  headerSub:        { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  contentCol:       { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  contentColDesktop:{ maxWidth: CONTENT_MAX, width: '100%', alignSelf: 'center' as const, paddingHorizontal: 0 },

  statsRow:         { flexDirection: 'row', gap: 10 },

  filterCard:       { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  filterLabel:      { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },

  actionTabs:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionTab:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  actionTabText:    { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

  filterRow:        { gap: 10 },
  filterRowDesktop: { flexDirection: 'row', alignItems: 'flex-end' },
  filterField:      { flex: 1, gap: 0 },

  dateInput:        {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1,
  },
  dateInputText:    { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', padding: 0 },

  applyBtn:         {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10,
    ...(Platform.OS === 'web' ? { alignSelf: 'flex-end' as const } : {}),
  },
  applyBtnText:     { fontSize: 13, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },

  sectionLabel:     { fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#8E8E93' },

  empty:            {
    alignItems: 'center', gap: 8, paddingVertical: 60, paddingHorizontal: 20,
    borderRadius: 16, borderWidth: 1, borderStyle: 'dashed',
  },
  emptyTitle:       { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  emptySub:         { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  loadingText:      { fontSize: 14, fontFamily: 'Poppins_400Regular' },
});

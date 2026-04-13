// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { notificationKeys } from '@/hooks/queries/keys';
import { api, type Notification as AppNotification } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/lib/auth';
import { CultureTokens } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { useColors, useIsDark } from '@/hooks/useColors';
import { goBackOrReplace } from '@/lib/navigation';

const isWeb = Platform.OS === 'web';

// ─── Type config ──────────────────────────────────────────────────────────────

const NOTIF_TYPE_INFO: Record<string, { icon: string; color: string; label: string }> = {
  system:    { icon: 'settings',      color: CultureTokens.teal,    label: 'System'    },
  event:     { icon: 'calendar',      color: CultureTokens.coral,   label: 'Events'    },
  perk:      { icon: 'gift',          color: CultureTokens.gold, label: 'Perks'     },
  community: { icon: 'people',        color: '#22C55E',             label: 'Community' },
  payment:   { icon: 'wallet',        color: '#22C55E',             label: 'Wallet'    },
  follow:    { icon: 'person-add',    color: CultureTokens.gold,    label: 'Social'    },
  review:    { icon: 'star',          color: CultureTokens.indigo,  label: 'Reviews'   },
};

const FILTER_TABS = [
  { id: 'all',       label: 'All'       },
  { id: 'event',     label: 'Events'    },
  { id: 'perk',      label: 'Perks'     },
  { id: 'community', label: 'Community' },
  { id: 'system',    label: 'System'    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days  = Math.floor(hours / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function groupByDate(notifications: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const now   = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  const groups: Record<string, AppNotification[]> = {};
  for (const n of notifications) {
    const d = new Date(n.createdAt ?? Date.now()).toDateString();
    const key = d === today ? 'Today' : d === yesterday ? 'Yesterday' : 'Earlier';
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }

  return ['Today', 'Yesterday', 'Earlier']
    .filter((k) => groups[k]?.length)
    .map((k) => ({ label: k, items: groups[k] }));
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  notif,
  onPress,
  colors,
  s,
}: {
  notif: AppNotification;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}) {
  const typeInfo = NOTIF_TYPE_INFO[notif.type] ?? NOTIF_TYPE_INFO.system;

  return (
    <Animated.View entering={Platform.OS !== 'web' ? FadeInDown.duration(300).springify() : undefined}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          s.notifCard,
          !notif.read && s.notifCardUnread,
          pressed && { opacity: 0.88 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={notif.title}
      >
        {!notif.read && (
          <View style={[s.accentStrip, { backgroundColor: typeInfo.color }]} />
        )}

        {/* Icon */}
        <View style={[s.iconWrap, { backgroundColor: typeInfo.color + '18' }]}>
          <Ionicons name={typeInfo.icon as keyof typeof Ionicons.glyphMap} size={22} color={typeInfo.color} />
        </View>

        {/* Content */}
        <View style={s.notifBody}>
          <View style={s.notifTopRow}>
            <Text
              style={[s.notifTitle, !notif.read && { color: colors.text, fontFamily: 'Poppins_700Bold' }]}
              numberOfLines={1}
            >
              {notif.title}
            </Text>
            {!notif.read && <View style={[s.unreadDot, { backgroundColor: typeInfo.color }]} />}
          </View>
          <Text style={[s.notifMsg, { color: colors.textSecondary }]} numberOfLines={2}>
            {notif.message}
          </Text>
          <View style={s.metaRow}>
            <View style={[s.typePill, { backgroundColor: typeInfo.color + '15' }]}>
              <Text style={[s.typePillText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
            </View>
            {notif.createdAt && (
              <Text style={[s.timeText, { color: colors.textTertiary }]}>{timeAgo(notif.createdAt)}</Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets   = useSafeAreaInsets();
  const { userId } = useAuth();
  const colors   = useColors();
  const isDark   = useIsDark();
  const s        = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [activeFilter, setActiveFilter] = useState('all');

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: notificationKeys.forUser(userId ?? ''),
    queryFn:  () => api.notifications.list(),
    enabled:  !!userId,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: notificationKeys.forUser(userId ?? '') }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: notificationKeys.forUser(userId ?? '') }),
  });

  const haptic = () => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const topPad = Platform.OS === 'web' ? 0 : insets.top;

  // Flattened data for FlashList
  const flatData = useMemo(() => {
    const list: (AppNotification | { id: string; isHeader: boolean; label: string })[] = [];
    groups.forEach(g => {
      list.push({ id: `header-${g.label}`, isHeader: true, label: g.label });
      g.items.forEach(item => list.push(item));
    });
    return list;
  }, [groups]);

  return (
    <View style={[s.screen, { paddingTop: topPad }]}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => { haptic(); goBackOrReplace('/(tabs)'); }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <Pressable
            style={({ pressed }) => [s.markAllBtn, pressed && { opacity: 0.7 }]}
            onPress={() => { 
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              markAllReadMutation.mutate(); 
            }}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
          >
            <Ionicons name="checkmark-done" size={15} color={CultureTokens.indigo} />
            <Text style={s.markAllText}>All read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* ── Filter tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersRow}
        style={s.filtersWrap}
      >
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.id;
          const tabCount = tab.id === 'all'
            ? notifications.length
            : notifications.filter((n) => n.type === tab.id).length;
          return (
            <Pressable
              key={tab.id}
              onPress={() => { haptic(); setActiveFilter(tab.id); }}
              style={[
                s.filterTab,
                { backgroundColor: active ? CultureTokens.indigo : colors.surface },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.filterTabText, { color: active ? '#fff' : colors.textSecondary }]}>
                {tab.label}
              </Text>
              {tabCount > 0 && (
                <View style={[s.filterCount, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.background }]}>
                  <Text style={[s.filterCountText, { color: active ? '#fff' : colors.textTertiary }]}>
                    {tabCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <View style={[s.emptyIcon, { borderColor: colors.borderLight }]}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>
            {activeFilter === 'all' ? 'No notifications yet' : `No ${activeFilter} notifications`}
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            We&apos;ll let you know when something happens
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlashList
            data={flatData}
            keyExtractor={(item) => item.id}
            //  - estimatedItemSize is required but may have type issues with complex unions
            estimatedItemSize={120}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 100 }}
            getItemType={(item) => ('isHeader' in item ? 'header' : 'notif')}
            renderItem={({ item }) => {
              if ('isHeader' in item) {
                return <Text style={[s.groupLabel, { color: colors.textTertiary }]}>{item.label}</Text>;
              }
              const notif = item as AppNotification;
              return (
                <NotifRow
                  notif={notif}
                  colors={colors}
                  s={s}
                  onPress={() => {
                    haptic();
                    if (!notif.read) markReadMutation.mutate(notif.id);
                  }}
                />
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: ReturnType<typeof useColors>, isDark: boolean) => StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface + '80',
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle:   { ...TextStyles.title3, color: colors.text },
  unreadBadge:   {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: CultureTokens.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_700Bold' },
  markAllBtn: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  markAllText: { ...TextStyles.captionSemibold, color: CultureTokens.indigo },

  // Filter tabs
  filtersWrap: { maxHeight: 52 },
  filtersRow:  { paddingHorizontal: 20, gap: 8, paddingVertical: 8, alignItems: 'center' },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    boxShadow: isDark ? '0px 2px 6px rgba(0,0,0,0.3)' : '0px 2px 6px rgba(0,0,0,0.05)',
  },
  filterTabText:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  filterCount:    { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterCountText:{ fontSize: 10, fontFamily: 'Poppins_700Bold' },

  // Grouped list
  list:       { paddingHorizontal: 20, paddingTop: 4 },
  groupLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },

  // Notification card
  notifCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 18,
    padding: 16,
    paddingLeft: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    marginBottom: 10,
    overflow: 'hidden',
    boxShadow: isDark ? '0px 4px 10px rgba(0,0,0,0.3)' : '0px 4px 10px rgba(0,0,0,0.04)',
  },
  notifCardUnread: {
    borderColor: CultureTokens.indigo + '30',
    backgroundColor: CultureTokens.indigo + '08',
  },
  accentStrip: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifBody:   { flex: 1, justifyContent: 'center' },
  notifTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 3 },
  notifTitle:  { ...TextStyles.callout, color: colors.textSecondary, flex: 1 },
  unreadDot:   { width: 9, height: 9, borderRadius: 5, marginLeft: 8, marginTop: 3 },
  notifMsg:    { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19, marginBottom: 8 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typePillText:{ fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.4 },
  timeText:    { fontSize: 11, fontFamily: 'Poppins_500Medium' },

  // Empty / loading
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, paddingHorizontal: 40 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { ...TextStyles.title2, marginBottom: 6, textAlign: 'center' },
  emptySub:   { ...TextStyles.bodyMedium, color: colors.textSecondary, textAlign: 'center' },
});

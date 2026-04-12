import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery } from '@tanstack/react-query';
import { notificationKeys } from '@/hooks/queries/keys';
import { api, type Notification as AppNotification } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/lib/auth';
import { CultureTokens } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { useColors, useIsDark } from '@/hooks/useColors';
import { goBackOrReplace } from '@/lib/navigation';
import { useLayout } from '@/hooks/useLayout';
import { routeWithRedirect } from '@/lib/routes';

const isWeb = Platform.OS === 'web';

const NOTIF_TYPE_INFO: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  system: { icon: 'settings', color: CultureTokens.teal, label: 'System' },
  event: { icon: 'calendar', color: CultureTokens.coral, label: 'Events' },
  perk: { icon: 'gift', color: CultureTokens.gold, label: 'Perks' },
  community: { icon: 'people', color: '#22C55E', label: 'Community' },
  payment: { icon: 'wallet', color: '#22C55E', label: 'Wallet' },
  ticket: { icon: 'ticket', color: CultureTokens.teal, label: 'Tickets' },
  membership: { icon: 'diamond', color: CultureTokens.gold, label: 'Membership' },
  recommendation: { icon: 'sparkles', color: CultureTokens.indigo, label: 'For You' },
  follow: { icon: 'person-add', color: CultureTokens.gold, label: 'Social' },
  review: { icon: 'star', color: CultureTokens.indigo, label: 'Reviews' },
};

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'event', label: 'Events' },
  { id: 'perk', label: 'Perks' },
  { id: 'community', label: 'Community' },
  { id: 'ticket', label: 'Tickets' },
  { id: 'payment', label: 'Wallet' },
  { id: 'system', label: 'System' },
] as const;

type UINotification = AppNotification & {
  read: boolean;
  metadata?: Record<string, unknown> | null;
};

type HeaderItem = { id: string; isHeader: true; label: string };
type ListItem = UINotification | HeaderItem;

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function normalizeNotifications(rows: unknown[]): UINotification[] {
  const normalized: UINotification[] = [];
  for (const item of rows) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    const id = String(raw.id ?? '');
    if (!id) continue;
    normalized.push({
      id,
      userId: String(raw.userId ?? ''),
      type: String(raw.type ?? 'system'),
      title: String(raw.title ?? 'Notification'),
      message: String(raw.message ?? ''),
      entityType: typeof raw.entityType === 'string' ? raw.entityType : undefined,
      entityId: typeof raw.entityId === 'string' ? raw.entityId : undefined,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
      metadata: (raw.metadata as Record<string, unknown> | null | undefined) ?? null,
      read: Boolean(
        (raw.read as boolean | undefined) ??
        (raw.isRead as boolean | undefined) ??
        false,
      ),
    });
  }
  return normalized.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function groupByDate(notifications: UINotification[]): { label: string; items: UINotification[] }[] {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const groups: Record<string, UINotification[]> = {};
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

function toNotificationRoute(notif: UINotification): string | null {
  const entityType = (notif.entityType ?? notif.type ?? '').toLowerCase();
  const entityId = notif.entityId ?? (typeof notif.metadata?.entityId === 'string' ? notif.metadata.entityId : undefined);
  if (!entityId) return null;
  if (entityType === 'event') return `/event/${entityId}`;
  if (entityType === 'community') return `/community/${entityId}`;
  if (entityType === 'perk') return `/perks/${entityId}`;
  if (entityType === 'ticket') return `/tickets/${entityId}`;
  if (entityType === 'profile') return `/profile/${entityId}`;
  if (entityType === 'user' || entityType === 'follow') return `/user/${entityId}`;
  return null;
}

function SwipeActions({
  canMarkRead,
  onMarkRead,
  onDelete,
  s,
}: {
  canMarkRead: boolean;
  onMarkRead: () => void;
  onDelete: () => void;
  s: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={s.swipeActionWrap}>
      {canMarkRead ? (
        <Pressable style={[s.swipeActionBtn, s.swipeActionRead]} onPress={onMarkRead} accessibilityRole="button" accessibilityLabel="Mark notification as read">
          <Ionicons name="checkmark-done" size={16} color="#fff" />
          <Text style={s.swipeActionText}>Read</Text>
        </Pressable>
      ) : null}
      <Pressable style={[s.swipeActionBtn, s.swipeActionDelete]} onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete notification">
        <Ionicons name="trash-outline" size={16} color="#fff" />
        <Text style={s.swipeActionText}>Delete</Text>
      </Pressable>
    </View>
  );
}

function NotifRow({
  notif,
  onPress,
  onMarkRead,
  onDelete,
  selected,
  colors,
  s,
}: {
  notif: UINotification;
  onPress: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
  selected: boolean;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}) {
  const typeInfo = NOTIF_TYPE_INFO[notif.type] ?? NOTIF_TYPE_INFO.system;

  const content = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.notifCard,
        !notif.read && s.notifCardUnread,
        selected && s.notifCardSelected,
        pressed && { opacity: 0.88 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={notif.title}
    >
      {!notif.read ? <View style={[s.accentStrip, { backgroundColor: typeInfo.color }]} /> : null}
      <View style={[s.iconWrap, { backgroundColor: typeInfo.color + '18' }]}>
        <Ionicons name={typeInfo.icon} size={22} color={typeInfo.color} />
      </View>
      <View style={s.notifBody}>
        <View style={s.notifTopRow}>
          <Text style={[s.notifTitle, !notif.read && { color: colors.text, fontFamily: 'Poppins_700Bold' }]} numberOfLines={1}>
            {notif.title}
          </Text>
          {!notif.read ? <View style={[s.unreadDot, { backgroundColor: typeInfo.color }]} /> : null}
        </View>
        <Text style={[s.notifMsg, { color: colors.textSecondary }]} numberOfLines={2}>
          {notif.message}
        </Text>
        <View style={s.metaRow}>
          <View style={[s.typePill, { backgroundColor: typeInfo.color + '15' }]}>
            <Text style={[s.typePillText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
          </View>
          <Text style={[s.timeText, { color: colors.textTertiary }]}>{timeAgo(notif.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );

  if (isWeb) {
    return <Animated.View entering={FadeInDown.duration(220)}>{content}</Animated.View>;
  }

  return (
    <Animated.View entering={FadeInDown.duration(220)}>
      <Swipeable
        overshootRight={false}
        friction={2}
        rightThreshold={44}
        renderRightActions={() => (
          <SwipeActions canMarkRead={!notif.read} onMarkRead={onMarkRead} onDelete={onDelete} s={s} />
        )}
      >
        {content}
      </Swipeable>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { hPad, isDesktop, contentWidth } = useLayout();
  const colors = useColors();
  const isDark = useIsDark();
  const s = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_TABS)[number]['id']>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isDesktopWeb = isWeb && isDesktop;
  const topPad = isWeb ? 0 : insets.top;

  const { data: notifications = [], isLoading } = useQuery<UINotification[]>({
    queryKey: notificationKeys.forUser(userId ?? ''),
    queryFn: async () => normalizeNotifications(await api.notifications.list() as unknown[]),
    enabled: !!userId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => api.notifications.markRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.forUser(userId ?? '') });
      const prev = queryClient.getQueryData<UINotification[]>(notificationKeys.forUser(userId ?? '')) ?? [];
      queryClient.setQueryData<UINotification[]>(
        notificationKeys.forUser(userId ?? ''),
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(notificationKeys.forUser(userId ?? ''), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.forUser(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => api.notifications.remove(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.forUser(userId ?? '') });
      const prev = queryClient.getQueryData<UINotification[]>(notificationKeys.forUser(userId ?? '')) ?? [];
      queryClient.setQueryData<UINotification[]>(
        notificationKeys.forUser(userId ?? ''),
        prev.filter((n) => n.id !== id),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(notificationKeys.forUser(userId ?? ''), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.forUser(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.forUser(userId ?? '') });
      const prev = queryClient.getQueryData<UINotification[]>(notificationKeys.forUser(userId ?? '')) ?? [];
      queryClient.setQueryData<UINotification[]>(
        notificationKeys.forUser(userId ?? ''),
        prev.map((n) => ({ ...n, read: true })),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(notificationKeys.forUser(userId ?? ''), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.forUser(userId ?? '') });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', userId] });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const haptic = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }
    const exists = selectedId && filtered.some((n) => n.id === selectedId);
    if (!exists) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const selectedNotification = useMemo(
    () => filtered.find((n) => n.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  const flatData = useMemo<ListItem[]>(() => {
    const list: ListItem[] = [];
    groups.forEach((g) => {
      list.push({ id: `header-${g.label}`, isHeader: true, label: g.label });
      g.items.forEach((item) => list.push(item));
    });
    return list;
  }, [groups]);

  const handleNotificationPress = (notif: UINotification) => {
    haptic();
    if (!notif.read) markReadMutation.mutate(notif.id);
    if (isDesktopWeb) {
      setSelectedId(notif.id);
      return;
    }
    const nextRoute = toNotificationRoute(notif);
    if (nextRoute) router.push(nextRoute as any);
  };

  if (!userId) {
    return (
      <View style={[s.screen, { paddingTop: topPad }]}>
        <View style={[s.unauthWrap, isDesktop && { width: contentWidth, alignSelf: 'center' as const }]}>
          <Ionicons name="notifications-outline" size={42} color={colors.textTertiary} />
          <Text style={[s.emptyTitle, { color: colors.text }]}>Sign in to view notifications</Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            Alerts for events, perks, and your community appear here.
          </Text>
          <Pressable
            onPress={() => router.push(routeWithRedirect('/(onboarding)/login', '/notifications') as any)}
            style={({ pressed }) => [s.signInBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={s.signInBtnText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.screen, { paddingTop: topPad }]}>
      <View style={[s.header, { paddingHorizontal: hPad }, isDesktop && { width: contentWidth, alignSelf: 'center' as const }]}>
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
          {unreadCount > 0 ? (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>

        {unreadCount > 0 ? (
          <Pressable
            style={({ pressed }) => [s.markAllBtn, pressed && { opacity: 0.7 }]}
            onPress={() => markAllReadMutation.mutate()}
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.filtersRow, { paddingHorizontal: hPad }]}
        style={s.filtersWrap}
      >
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.id;
          const tabCount = tab.id === 'all'
            ? notifications.length
            : tab.id === 'unread'
              ? notifications.filter((n) => !n.read).length
              : notifications.filter((n) => n.type === tab.id).length;
          return (
            <Pressable
              key={tab.id}
              onPress={() => { haptic(); setActiveFilter(tab.id); }}
              style={[s.filterTab, { backgroundColor: active ? CultureTokens.indigo : colors.surface }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.filterTabText, { color: active ? '#fff' : colors.textSecondary }]}>{tab.label}</Text>
              {tabCount > 0 ? (
                <View style={[s.filterCount, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.background }]}>
                  <Text style={[s.filterCountText, { color: active ? '#fff' : colors.textTertiary }]}>{tabCount}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

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
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>We&apos;ll let you know when something happens</Text>
        </View>
      ) : isDesktopWeb ? (
        <View style={[s.splitWrap, { width: contentWidth, alignSelf: 'center' as const }]}>
          <View style={[s.listPane, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
            <FlashList
              data={flatData}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 26 }}
              getItemType={(item) => ('isHeader' in item ? 'header' : 'notif')}
              renderItem={({ item }) => {
                if ('isHeader' in item) {
                  return <Text style={[s.groupLabel, { color: colors.textTertiary }]}>{item.label}</Text>;
                }
                const notif = item;
                return (
                  <NotifRow
                    notif={notif}
                    selected={selectedId === notif.id}
                    colors={colors}
                    s={s}
                    onPress={() => handleNotificationPress(notif)}
                    onMarkRead={() => !notif.read && markReadMutation.mutate(notif.id)}
                    onDelete={() => removeMutation.mutate(notif.id)}
                  />
                );
              }}
            />
          </View>

          <View style={[s.previewPane, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
            {selectedNotification ? (
              <>
                <View style={s.previewHead}>
                  <View style={[s.previewIcon, { backgroundColor: (NOTIF_TYPE_INFO[selectedNotification.type]?.color ?? colors.primary) + '20' }]}>
                    <Ionicons
                      name={NOTIF_TYPE_INFO[selectedNotification.type]?.icon ?? 'notifications-outline'}
                      size={18}
                      color={NOTIF_TYPE_INFO[selectedNotification.type]?.color ?? colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.previewTitle, { color: colors.text }]}>{selectedNotification.title}</Text>
                    <Text style={[s.previewMeta, { color: colors.textTertiary }]}>
                      {timeAgo(selectedNotification.createdAt)} · {(NOTIF_TYPE_INFO[selectedNotification.type]?.label ?? 'System')}
                    </Text>
                  </View>
                </View>
                <Text style={[s.previewMessage, { color: colors.textSecondary }]}>{selectedNotification.message}</Text>
                <View style={s.previewActions}>
                  {!selectedNotification.read ? (
                    <Pressable
                      style={({ pressed }) => [s.previewBtn, { backgroundColor: CultureTokens.indigo, opacity: pressed ? 0.86 : 1 }]}
                      onPress={() => markReadMutation.mutate(selectedNotification.id)}
                    >
                      <Text style={s.previewBtnText}>Mark Read</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [s.previewBtnGhost, { borderColor: colors.borderLight, opacity: pressed ? 0.86 : 1 }]}
                    onPress={() => {
                      const route = toNotificationRoute(selectedNotification);
                      if (route) router.push(route as any);
                    }}
                  >
                    <Text style={[s.previewBtnGhostText, { color: colors.text }]}>Open</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [s.previewBtnDelete, { opacity: pressed ? 0.86 : 1 }]}
                    onPress={() => removeMutation.mutate(selectedNotification.id)}
                  >
                    <Text style={s.previewBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={s.center}>
                <Text style={[s.emptySub, { color: colors.textSecondary }]}>Select a notification to preview</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlashList
            data={flatData}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: hPad, paddingTop: 4, paddingBottom: insets.bottom + 100 }}
            getItemType={(item) => ('isHeader' in item ? 'header' : 'notif')}
            renderItem={({ item }) => {
              if ('isHeader' in item) {
                return <Text style={[s.groupLabel, { color: colors.textTertiary }]}>{item.label}</Text>;
              }
              const notif = item;
              return (
                <NotifRow
                  notif={notif}
                  selected={false}
                  colors={colors}
                  s={s}
                  onPress={() => handleNotificationPress(notif)}
                  onMarkRead={() => !notif.read && markReadMutation.mutate(notif.id)}
                  onDelete={() => removeMutation.mutate(notif.id)}
                />
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
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
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerTitle: { ...TextStyles.title3, color: colors.text },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: CultureTokens.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_700Bold' },
  markAllBtn: { width: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  markAllText: { ...TextStyles.captionSemibold, color: CultureTokens.indigo },

  filtersWrap: { maxHeight: 52 },
  filtersRow: { gap: 8, paddingVertical: 8, alignItems: 'center' },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  filterTabText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  filterCount: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterCountText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },

  groupLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
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
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 8 },
      android: { elevation: 1 },
      default: {},
    }),
  },
  notifCardUnread: { borderColor: CultureTokens.indigo + '30', backgroundColor: CultureTokens.indigo + '08' },
  notifCardSelected: { borderColor: CultureTokens.indigo, backgroundColor: CultureTokens.indigo + '12' },
  accentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody: { flex: 1, justifyContent: 'center' },
  notifTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 3 },
  notifTitle: { ...TextStyles.callout, color: colors.textSecondary, flex: 1 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, marginLeft: 8, marginTop: 3 },
  notifMsg: { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typePillText: { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.4 },
  timeText: { fontSize: 11, fontFamily: 'Poppins_500Medium' },

  swipeActionWrap: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 10, marginLeft: 8 },
  swipeActionBtn: { width: 82, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4, marginLeft: 8 },
  swipeActionRead: { backgroundColor: CultureTokens.indigo },
  swipeActionDelete: { backgroundColor: CultureTokens.coral },
  swipeActionText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },

  splitWrap: { flex: 1, flexDirection: 'row', gap: 12, paddingBottom: 16, minHeight: 0 },
  listPane: { width: 430, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  previewPane: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 18 },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  previewIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  previewMeta: { fontSize: 12, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  previewMessage: { fontSize: 14, lineHeight: 22, fontFamily: 'Poppins_400Regular', marginTop: 8 },
  previewActions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  previewBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CultureTokens.indigo,
  },
  previewBtnDelete: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CultureTokens.coral,
  },
  previewBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_700Bold' },
  previewBtnGhost: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: colors.surfaceElevated,
  },
  previewBtnGhostText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, paddingHorizontal: 40 },
  unauthWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, gap: 10 },
  signInBtn: {
    marginTop: 10,
    height: 44,
    minWidth: 140,
    borderRadius: 12,
    backgroundColor: CultureTokens.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  signInBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { ...TextStyles.title2, marginBottom: 6, textAlign: 'center' },
  emptySub: { ...TextStyles.bodyMedium, color: colors.textSecondary, textAlign: 'center' },
});

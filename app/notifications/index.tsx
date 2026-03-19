import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, type Notification as AppNotification } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/lib/auth';
import { CultureTokens } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { goBackOrReplace } from '@/lib/navigation';

const isWeb = Platform.OS === 'web';

const NOTIF_TYPE_INFO: Record<string, { icon: string; color: string }> = {
  system:    { icon: 'settings',    color: CultureTokens.teal },
  event:     { icon: 'calendar',    color: CultureTokens.coral },
  perk:      { icon: 'gift',        color: CultureTokens.saffron },
  community: { icon: 'people',      color: CultureTokens.success },
  payment:   { icon: 'wallet',      color: CultureTokens.success },
  follow:    { icon: 'person-add',  color: CultureTokens.gold },
  review:    { icon: 'star',        color: CultureTokens.indigo },
};

function timeAgo(date: string): string {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days  = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const webTop = 0;
  const { userId } = useAuth();
  const colors = useColors();
  const s = getStyles(colors);

  const { data: notifications = [], isLoading } = useQuery<AppNotification[]>({
    queryKey: ['/api/notifications', userId],
    queryFn: () => api.notifications.list(),
    enabled: !!userId,
  });

  const markReadMutation = useMutation({
    mutationFn: (notifId: string) => api.notifications.markRead(notifId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/notifications', userId] }),
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={[s.container, { paddingTop: insets.top + webTop }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable 
          style={({ pressed }) => [s.backBtn, pressed && !isWeb && { transform: [{ scale: 0.95 }] }]} 
          onPress={() => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goBackOrReplace('/(tabs)'); }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable
            style={s.markAllBtn}
            onPress={() => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); markAllReadMutation.mutate(); }}
          >
            <Text style={s.markAllText}>Read All</Text>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {/* Unread banner */}
      {unreadCount > 0 && (
        <View style={s.unreadBanner}>
          <Ionicons name="notifications" size={16} color={CultureTokens.indigo} />
          <Text style={s.unreadText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={s.empty}>
          <ActivityIndicator size="large" color={CultureTokens.indigo} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconBg}>
            <Ionicons name="notifications-off-outline" size={56} color={colors.textSecondary} />
          </View>
          <Text style={s.emptyText}>No notifications yet</Text>
          <Text style={s.emptySub}>We&apos;ll let you know when something happens</Text>
        </View>
      ) : (
        <ScrollView
          style={s.list}
          contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 34 : insets.bottom), paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notif: AppNotification) => {
            const typeInfo = NOTIF_TYPE_INFO[notif.type] ?? NOTIF_TYPE_INFO.system;
            return (
              <Pressable
                key={notif.id}
                onPress={() => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (!notif.read) markReadMutation.mutate(notif.id); }}
                onLongPress={() => {
                  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert('Notification', 'Notification options coming soon.');
                }}
                style={({ pressed }) => [
                  s.notifCard,
                  !notif.read && s.notifCardUnread,
                  pressed && !isWeb && { transform: [{ scale: 0.98 }] },
                  pressed && isWeb && { opacity: 0.9 }
                ]}
              >
                {!notif.read && (
                  <View style={[s.notifAccentStrip, { backgroundColor: typeInfo.color }]} />
                )}
                <View style={[s.notifIcon, { backgroundColor: typeInfo.color + '18' }]}>
                  <Ionicons name={typeInfo.icon as never} size={22} color={typeInfo.color} />
                </View>
                <View style={s.notifContent}>
                  <View style={s.notifHeader}>
                    <Text
                      style={[s.notifTitle, !notif.read && s.notifTitleUnread]}
                      numberOfLines={1}
                    >
                      {notif.title}
                    </Text>
                    {!notif.read && <View style={s.unreadDot} />}
                  </View>
                  <Text style={[s.notifMessage, !notif.read && { color: colors.textSecondary }]} numberOfLines={2}>{notif.message}</Text>
                  {notif.createdAt && (
                    <View style={s.notifMeta}>
                      <View style={s.notifTimeChip}>
                        <Text style={s.notifTime}>{timeAgo(notif.createdAt)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  headerTitle: { ...TextStyles.title3, color: colors.text },
  markAllBtn:  { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: CultureTokens.indigo + '20' },
  markAllText: { ...TextStyles.captionSemibold, color: CultureTokens.indigo },

  unreadBanner:{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingVertical: 14, marginHorizontal: 20, marginBottom: 12, borderRadius: 20, backgroundColor: CultureTokens.indigo + '15', borderWidth: 1, borderColor: CultureTokens.indigo + '35' },
  unreadText:  { ...TextStyles.callout, color: CultureTokens.indigo },

  list:        { flex: 1, paddingHorizontal: 20 },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100, paddingHorizontal: 32 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background, borderWidth: 1, borderStyle: 'dashed' as const, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyText:   { ...TextStyles.title2, color: colors.text, marginBottom: 6 },
  emptySub:    { ...TextStyles.bodyMedium, color: colors.textSecondary, textAlign: 'center' },

  notifCard:        { flexDirection: 'row', gap: 14, borderRadius: 20, padding: 18, paddingLeft: 24, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, marginBottom: 12, overflow: 'hidden' },
  notifCardUnread:  { borderColor: CultureTokens.indigo + '35', backgroundColor: CultureTokens.indigo + '10' },
  notifAccentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  notifIcon:        { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifContent:     { flex: 1, justifyContent: 'center' },
  notifHeader:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle:       { ...TextStyles.callout, color: colors.textSecondary, flex: 1 },
  notifTitleUnread: { ...TextStyles.cardTitle, color: colors.text, flex: 1 },
  unreadDot:        { width: 10, height: 10, borderRadius: 5, marginLeft: 10, backgroundColor: CultureTokens.indigo, marginTop: 4 },
  notifMessage:     { ...TextStyles.bodyMedium, lineHeight: 20, color: colors.textSecondary, marginBottom: 8 },
  notifMeta:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notifTimeChip:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.backgroundSecondary },
  notifTime:        { ...TextStyles.caption, color: colors.textSecondary },
});

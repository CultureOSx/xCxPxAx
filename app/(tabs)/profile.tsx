import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Share,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaved } from '@/contexts/SavedContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/Button';
import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useColors } from '@/hooks/useColors';
import type { User, MembershipSummary } from '@shared/schema';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GuestProfileView } from '@/components/profile/GuestProfileView';
import { ProfileQuickMenuTrigger } from '@/components/ProfileQuickMenu';
import { CultureTokens } from '@/constants/theme';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { TextStyles } from '@/constants/typography';
import { BackButton } from '@/components/ui/BackButton';

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 92;
const HERO_BG     = '#0B0B14';    // matches CultureTokens deep space background
const BLUE        = CultureTokens.indigo;
const YELLOW      = CultureTokens.gold;

const TIER_LABELS: Record<string, string> = {
  free: 'Standard', plus: 'Plus', pro: 'Pro', premium: 'Premium', vip: 'VIP',
};

function QuickTile({
  icon, label, color, onPress, colors,
}: {
  icon: string; label: string; color: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Card
      onPress={onPress}
      style={{ flex: 1 }}
      padding={16}
    >
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View style={[t.tileIcon, { backgroundColor: color + '12' }]}>
          <Ionicons name={icon as never} size={22} color={color} />
        </View>
        <Text style={[TextStyles.labelSemibold, { color: colors.text, fontSize: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }]}>
          {label}
        </Text>
      </View>
    </Card>
  );
}

const t = StyleSheet.create({
  tile:      { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 4, borderRadius: 20, borderWidth: 1, gap: 8 },
  tileIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 10, fontFamily: 'Poppins_700Bold', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ─── Contact row component ────────────────────────────────────────────────────

function ContactRow({
  icon, label, value, verified, shareable, colors,
}: {
  icon: string; label: string; value: string;
  verified?: boolean;
  shareable?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const handleShare = useCallback(async () => {
    if (!shareable || value === '—') return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title: 'My CulturePass Profile', url: value });
      } else {
        await Share.share({ title: 'My CulturePass Profile', message: value, url: value });
      }
    } catch {}
  }, [shareable, value]);

  const content = (
    <>
      <View style={[c.rowIcon, { backgroundColor: BLUE + '12' }]}>
        <Ionicons name={icon as never} size={16} color={BLUE} />
      </View>
      <View style={c.rowBody}>
        <Text style={[TextStyles.caption, { color: colors.textTertiary, fontSize: 11 }]}>{label}</Text>
        <Text style={[TextStyles.headline, { color: value === '—' ? colors.textTertiary : colors.text }]} numberOfLines={1}>{value}</Text>
      </View>
      {verified && (
        <View style={c.badge}>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
        </View>
      )}
      {shareable && (
        <Pressable onPress={handleShare} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]} accessibilityLabel="Share profile link">
          <Ionicons name="share-outline" size={18} color={BLUE} />
        </Pressable>
      )}
    </>
  );

  return (
    <View style={c.row}>
      {content}
    </View>
  );
}

const c = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  rowIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowBody:  { flex: 1, gap: 2 },
  rowLabel: { fontSize: 11, fontFamily: 'Poppins_500Medium', letterSpacing: 0.2 },
  rowValue: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  badge:    { alignItems: 'center', justifyContent: 'center' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets       = useSafeAreaInsets();
  const topInset     = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset  = Platform.OS === 'web' ? 34 : insets.bottom;
  const { width }    = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const colors       = useColors();

  useSaved();
  const [refreshing, setRefreshing] = useState(false);
  const { userId, logout, user: authUser } = useAuth();
  const { role, isAdmin, isOrganizer } = useRole();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['api/auth/me'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/users/me', 'profile-tab', userId] }),
        queryClient.invalidateQueries({ queryKey: [`/api/membership/${userId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/notifications/${userId}/unread-count`] }),
      ]);
    } finally {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(false);
    }
  }, [userId]);

  const switchToHostMutation = useMutation({
    mutationFn: (newRole: string) => api.users.update(userId!, { role: newRole as any }),
    onSuccess: () => {
       if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
       queryClient.invalidateQueries({ queryKey: ['api/auth/me'] });
       queryClient.invalidateQueries({ queryKey: ['/api/users/me', 'profile-tab', userId] });
       Alert.alert('Welcome, Organizer!', 'Your account has been upgraded to a Host account. You can now create and manage events.');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const handleBecomeHost = useCallback(() => {
    Alert.alert(
      'Become a Host',
      'This will upgrade your account to an Organizer account. You will be able to create events, manage communities, and access host tools. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade to Host', onPress: () => switchToHostMutation.mutate('organizer') },
      ]
    );
  }, [switchToHostMutation]);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/users/me', 'profile-tab', userId],
    queryFn: () => api.users.me(),
    enabled: !!userId,
  });

  const { data: membership } = useQuery<MembershipSummary | null>({
    queryKey: [`/api/membership/${userId}`],
    queryFn: () => api.membership.get(userId!).catch(() => null),
    enabled: !!userId,
  });

  const { data: unreadNotifs } = useQuery<{ count: number }>({
    queryKey: [`/api/notifications/${userId}/unread-count`],
    queryFn: () => api.notifications.unreadCount().catch(() => ({ count: 0 })),
    enabled: !!userId,
  });

  const tier        = membership?.tier ?? 'free';
  const displayUser = (user || authUser) as Partial<User>;
  const displayName = displayUser?.displayName || displayUser?.username || 'CulturePass Member';
  const initials    = (displayName || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const unreadCount = unreadNotifs?.count ?? 0;
  const points      = (displayUser as Record<string, unknown>)?.points as number ?? 0;
  const location    = displayUser?.city
    ? `${displayUser.city}${displayUser?.country ? `, ${displayUser.country}` : ''}`
    : null;

  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = userId ? `https://culturepass.app/profile/${userId}` : 'https://culturepass.app';
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title: `${displayName} on CulturePass`, url });
      } else {
        await Share.share({ title: `${displayName} on CulturePass`, message: url, url });
      }
    } catch {}
  }, [displayName, userId]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try { await logout('/(tabs)'); }
          catch { Alert.alert('Sign out failed', 'Please try again.'); }
        },
      },
    ]);
  }, [logout]);

  if (!userId) return <GuestProfileView topInset={topInset} />;

  if (userLoading) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ backgroundColor: HERO_BG, paddingTop: topInset + 40, paddingBottom: 36, alignItems: 'center', gap: 14 }}>
            <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} />
            <Skeleton width={150} height={22} borderRadius={8} />
            <Skeleton width={100} height={44} borderRadius={8} />
            <Skeleton width={130} height={13} borderRadius={6} />
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[0,1,2].map(k => <Skeleton key={k} height={90} borderRadius={14} />)}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[0,1,2].map(k => <Skeleton key={k} height={90} borderRadius={14} />)}
            </View>
            <Skeleton width="100%" height={180} borderRadius={16} />
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  // ── Hero section ───────────────────────────────────────────────────────────

  const heroSection = (
    <View style={[s.hero, { paddingTop: topInset + 12 }]}>
      {/* Background layers */}
      <LinearGradient
        colors={[HERO_BG, CultureTokens.indigo + '40', '#1B0F2E']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Decorative arcs — like the reference */}
      <View style={s.arcOuter} />
      <View style={s.arcInner} />
      {/* Blue orb top-right */}
      <View style={s.orbBlue} />
      {/* Yellow orb bottom-left */}
      <View style={s.orbYellow} />

      {/* Top actions — Burger menu (left) + Share + Notifications (right) */}
      {!isDesktopWeb && (
        <View style={s.topRow}>
          <ProfileQuickMenuTrigger colors={colors} />
          <View style={s.topRight}>
            <Pressable 
              style={({ pressed }) => [s.topBtn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]} 
              onPress={handleShare} 
              accessibilityRole="button" 
              accessibilityLabel="Share"
            >
              <Ionicons name="share-outline" size={18} color="rgba(255,255,255,0.9)" />
              {Platform.OS !== 'web' && <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />}
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.topBtn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
              onPress={() => router.push('/notifications' as never)}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={18} color="rgba(255,255,255,0.9)" />
              {Platform.OS !== 'web' && <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />}
              {unreadCount > 0 && <View style={s.notifDot} />}
            </Pressable>
          </View>
        </View>
      )}

      {/* Avatar */}
      <Pressable
        style={s.avatarWrap}
        onPress={() => router.push('/profile/edit' as never)}
        accessibilityRole="button"
        accessibilityLabel="Edit profile photo"
      >
        <LinearGradient
          colors={[CultureTokens.gold, CultureTokens.saffron]}
          style={s.avatarRing}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={s.avatarInner}>
            {displayUser?.avatarUrl ? (
              <Image source={{ uri: displayUser.avatarUrl }} style={s.avatarImg} contentFit="cover" />
            ) : (
              <LinearGradient colors={[CultureTokens.indigo, '#3B2A8C']} style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[TextStyles.title2, { color: '#fff' }]}>{initials}</Text>
                </View>
              </LinearGradient>
            )}
          </View>
        </LinearGradient>
        <LinearGradient
          colors={[CultureTokens.gold, CultureTokens.saffron]}
          style={[s.editDot, { borderColor: HERO_BG }]}
        >
          <Ionicons name="camera" size={10} color={HERO_BG} />
        </LinearGradient>
      </Pressable>

      {/* Name */}
      <Text style={[TextStyles.title2, { color: '#FFFFFF', letterSpacing: 1.5, textAlign: 'center', paddingHorizontal: 24 }]}>{displayName.toUpperCase()}</Text>
      {(displayUser?.handle ?? displayUser?.username) && (
        <Text style={[TextStyles.body, { color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: 16 }]}>+{displayUser?.handle ?? displayUser?.username}</Text>
      )}

      {/* Points section (Blue) */}
      <View style={s.pointsSec}>
        <Text style={[TextStyles.title, { color: CultureTokens.indigo, fontSize: 32 }]}>{points}</Text>
        <Text style={[TextStyles.captionSemibold, { color: CultureTokens.indigo, letterSpacing: 2 }]}>CULTUREPASS POINTS</Text>
      </View>

      {/* Tier pill (Blue) */}
      <View style={[s.tierPill, { borderColor: CultureTokens.indigo + '40', backgroundColor: CultureTokens.indigo + '15' }]}>
        <Ionicons name="shield-checkmark" size={12} color={CultureTokens.indigo} />
        <Text style={[s.tierPillText, { color: CultureTokens.indigo }]}>{TIER_LABELS[tier] ?? 'Standard'} Member</Text>
      </View>

      {/* Blue bottom line */}
      <LinearGradient
        colors={[CultureTokens.indigo, CultureTokens.indigo + '80', 'rgba(30,58,138,0)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.heroBorderLine}
      />
    </View>
  );

  // ── Content ────────────────────────────────────────────────────────────────

  const contentBody = (
    <View style={s.content}>

      {/* ── Quick tiles ── */}
      <View style={s.tilesGrid}>
        {/* Row 1 */}
        <View style={s.tilesRow}>
          <QuickTile icon="person-outline"   label="Edit Profile"  color={CultureTokens.indigo}   onPress={() => router.push('/profile/edit' as never)}       colors={colors} />
          <QuickTile icon="people-outline"   label="Communities"   color={CultureTokens.indigo}   onPress={() => router.push('/(tabs)/community' as never)}  colors={colors} />
          <QuickTile icon="calendar-outline" label="My Events"     color={CultureTokens.indigo}   onPress={() => router.push('/tickets/index' as never)}            colors={colors} />
        </View>
        {/* Row 2 */}
        <View style={s.tilesRow}>
          <QuickTile icon="eye-outline"          label="View Public"   color={CultureTokens.indigo}   onPress={() => router.push(`/profile/${userId}` as never)}  colors={colors} />
          <QuickTile icon="share-social-outline" label="Share Profile" color={CultureTokens.indigo}   onPress={handleShare}                                       colors={colors} />
          <QuickTile 
            icon={isOrganizer ? "flash-outline" : "star-outline"}  
            label={isOrganizer ? "Host Tools" : "Become Host"}  
            color={CultureTokens.indigo}    
            onPress={isOrganizer ? () => router.push('/dashboard/organizer' as never) : handleBecomeHost} 
            colors={colors} 
          />
        </View>
        {/* Row 3 */}
        <View style={s.tilesRow}>
          <QuickTile icon="settings-outline" label="Settings"      color={CultureTokens.indigo}   onPress={() => router.push('/settings' as never)}          colors={colors} />
          <QuickTile icon="help-circle-outline" label="Help"       color={CultureTokens.indigo}   onPress={() => router.push('/help' as never)}              colors={colors} />
          <QuickTile icon="log-out-outline"  label="Sign Out"      color={CultureTokens.indigo}   onPress={handleSignOut}                                     colors={colors} />
        </View>
      </View>

      {/* ── Contact Information ── */}
      {(() => {
        const sl = displayUser?.socialLinks ?? {};
        const website = displayUser?.website ?? sl.website;
        const profileLink = userId ? `https://culturepass.app/profile/${userId}` : '—';
        const rows: { icon: string; label: string; value: string; verified?: boolean; shareable?: boolean }[] = [
          { icon: 'link-outline',     label: 'Profile link', value: profileLink, shareable: !!userId },
          { icon: 'mail-outline',     label: 'Email',    value: displayUser?.email ?? '—',                                           verified: !!displayUser?.email },
          { icon: 'location-outline', label: 'Location', value: location ?? '—',                                                     verified: !!location },
          { icon: 'person-outline',   label: 'Handle', value: displayUser ? `+${displayUser.handle ?? displayUser.username}` : '—' },
          { icon: 'call-outline',     label: 'Phone',    value: displayUser?.phone ?? '—' },
          { icon: 'globe-outline',    label: 'Website',  value: website ?? '—' },
          { icon: 'create-outline',   label: 'Bio',      value: displayUser?.bio ?? '—' },
          ...(displayUser?.languages?.length ? [{ icon: 'chatbubble-outline', label: 'Languages', value: displayUser.languages!.join(', ') }] : []),
          ...(displayUser?.ethnicityText     ? [{ icon: 'heart-outline',      label: 'Cultural Background', value: displayUser.ethnicityText }] : []),
          ...(sl.instagram ? [{ icon: 'logo-instagram',     label: 'Instagram', value: `@${sl.instagram.replace(/^@/, '')}` }] : []),
          ...(sl.twitter   ? [{ icon: 'logo-twitter',       label: 'X / Twitter', value: `@${sl.twitter.replace(/^@/, '')}` }] : []),
          ...(sl.tiktok    ? [{ icon: 'musical-notes-outline', label: 'TikTok',  value: `@${sl.tiktok.replace(/^@/, '')}` }] : []),
          ...(sl.linkedin  ? [{ icon: 'logo-linkedin',      label: 'LinkedIn',  value: sl.linkedin }] : []),
          ...(sl.youtube   ? [{ icon: 'logo-youtube',       label: 'YouTube',   value: sl.youtube }] : []),
          ...(sl.facebook  ? [{ icon: 'logo-facebook',      label: 'Facebook',  value: sl.facebook }] : []),
        ];
        return (
          <Card 
            style={s.card}
            padding={0}
          >
            {/* Card header with avatar */}
            <View style={[s.contactHeader, { borderBottomColor: colors.borderLight }]}>
              {displayUser?.avatarUrl ? (
                <Image source={{ uri: displayUser.avatarUrl }} style={s.contactAvatar} contentFit="cover" />
              ) : (
                <View style={[s.contactAvatarFallback, { backgroundColor: CultureTokens.indigo + '15' }]}>
                  <Text style={[TextStyles.title3, { color: CultureTokens.indigo }]}>{initials}</Text>
                </View>
              )}
              <View style={s.contactNameBlock}>
                <Text style={[TextStyles.headline, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
                {(displayUser?.handle ?? displayUser?.username) && (
                  <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>+{displayUser?.handle ?? displayUser?.username}</Text>
                )}
              </View>
              <Button
                size="sm"
                variant="outline"
                leftIcon="create-outline"
                onPress={() => router.push('/profile/edit' as never)}
                style={{ height: 32, paddingHorizontal: 12, borderRadius: 8, borderColor: CultureTokens.indigo + '30' }}
                labelStyle={{ fontSize: 12, color: CultureTokens.indigo }}
              >
                Edit
              </Button>
            </View>
            {/* Contact rows */}
            <View style={s.contactRows}>
              {rows.map((row, i) => (
                <View key={row.label}>
                  {i > 0 && <View style={[s.divider, { backgroundColor: colors.borderLight }]} />}
                  <ContactRow {...row} colors={colors} shareable={row.shareable} />
                </View>
              ))}
            </View>
          </Card>
        );
      })()}

      {/* ── Upgrade CTA ── */}
      {(tier === 'free' || tier === 'plus') && (
        <Card
          onPress={() => router.push({ pathname: '/membership/upgrade' } as never)}
          style={s.upgradeCard}
          padding={0}
        >
          <LinearGradient
            colors={[CultureTokens.indigo, '#3B2A8C']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16 }}>
            <View style={s.upgradeIconBox}>
              <Ionicons name={tier === 'free' ? 'star' : 'diamond'} size={24} color={CultureTokens.gold} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[TextStyles.headline, { color: '#fff' }]}>
                Upgrade for CulturePass+
              </Text>
              <Text style={[TextStyles.caption, { color: 'rgba(255,255,255,0.7)', lineHeight: 18 }]}>Early access, cashback & exclusive events</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </View>
        </Card>
      )}

      {/* ── Settings ── */}
      <Card 
        style={s.card}
        padding={0}
      >
        <Text style={[TextStyles.labelSemibold, { color: colors.text, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight, textTransform: 'uppercase', letterSpacing: 1 }]}>Settings</Text>
        {[
          { icon: 'notifications-outline', label: 'Notifications', badge: unreadCount > 0 ? String(unreadCount) : undefined, route: '/notifications' },
          { icon: 'card-outline',          label: 'Payment Methods', route: '/payment/methods' },
          { icon: 'receipt-outline',       label: 'Payment History', route: '/payment/transactions' },
          { icon: 'gift-outline',          label: 'My Perks',        route: '/perks' },
          { icon: 'help-buoy-outline',     label: 'Help & Support',  route: '/settings/help' },
          { icon: 'document-text-outline', label: 'Legal Center',    route: '/legal/terms' },
        ].map((item, i, arr) => (
          <View key={item.route}>
            {i > 0 && <View style={[s.divider, { backgroundColor: colors.borderLight }]} />}
            <Pressable
              style={({ pressed }) => [s.settingsRow, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.route as never);
              }}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={[s.settingsIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name={item.icon as never} size={17} color={colors.textSecondary} />
              </View>
              <Text style={[TextStyles.headline, { color: colors.text }]}>{item.label}</Text>
              <View style={s.settingsRight}>
                {item.badge && (
                  <View style={s.settingsBadge}>
                    <Text style={s.settingsBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
              </View>
            </Pressable>
          </View>
        ))}
      </Card>

      {/* ── Admin / Organizer ── */}
      {(isAdmin || isOrganizer) && (
        <Card 
          style={s.card}
          padding={0}
        >
          <Text style={[TextStyles.labelSemibold, { color: CultureTokens.coral, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: CultureTokens.coral + '20', textTransform: 'uppercase', letterSpacing: 1 }]}>
            {isAdmin ? 'Administration' : 'Organizer'}
          </Text>
          {isAdmin && (
            <>
              <Pressable style={({ pressed }) => [s.settingsRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => router.push('/admin/users' as never)} accessibilityRole="button" accessibilityLabel="Users database">
                <View style={[s.settingsIcon, { backgroundColor: CultureTokens.coral + '14' }]}><Ionicons name="people-circle-outline" size={17} color={CultureTokens.coral} /></View>
                <Text style={[TextStyles.headline, { color: colors.text }]}>Users Database</Text>
                <View style={s.settingsRight}><Text style={[TextStyles.captionSemibold, { color: CultureTokens.coral, fontSize: 11 }]}>{role === 'platformAdmin' ? 'Platform Admin' : 'Admin'}</Text><Ionicons name="chevron-forward" size={15} color={colors.textTertiary} /></View>
              </Pressable>
              <View style={[s.divider, { backgroundColor: colors.borderLight }]} />
            </>
          )}
          <Pressable style={({ pressed }) => [s.settingsRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => router.push('/dashboard/organizer' as never)} accessibilityRole="button" accessibilityLabel="Dashboard">
            <View style={[s.settingsIcon, { backgroundColor: CultureTokens.coral + '14' }]}><Ionicons name="stats-chart-outline" size={17} color={CultureTokens.coral} /></View>
            <Text style={[TextStyles.headline, { color: colors.text }]}>Dashboard</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
          </Pressable>
        </Card>
      )}

      {/* ── Sign out ── */}
      <Pressable
        style={({ pressed }) => [s.signOut, { opacity: pressed ? 0.65 : 1 }]}
        onPress={handleSignOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out-outline" size={18} color={CultureTokens.coral} />
        <Text style={[TextStyles.headline, { color: CultureTokens.coral }]}>Sign Out</Text>
      </Pressable>

      <Text style={[s.version, { color: colors.textTertiary }]}>CulturePass v1.0.0</Text>
    </View>
  );

  return (
    <ErrorBoundary>
      <View style={[s.root, { backgroundColor: colors.background }]}>
        {isDesktopWeb ? (
          <View style={s.desktopLayout}>
            {/* Top Bar for Mobile/Tablet within Desktop Left */}
            <View style={[s.topRow, { marginTop: insets.top + 10 }]}>
              <BackButton circled style={{ backgroundColor: colors.surface + '80' }} />
              <View style={{ flex: 1 }} />
              <Pressable 
                style={({ pressed }) => [s.topBtn, { backgroundColor: colors.surface + '80' }, pressed && { opacity: 0.7 }]}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={22} color={colors.text} />
              </Pressable>
            </View>
            <View style={s.desktopLeft}>
              {heroSection}
              <View style={[s.desktopActions, { borderColor: colors.borderLight }]}>
                <ProfileQuickMenuTrigger colors={colors} variant="surface" />
                <Pressable style={[s.desktopBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={() => router.push('/profile/edit' as never)} accessibilityRole="button">
                  <Ionicons name="create-outline" size={14} color={colors.text} />
                  <Text style={[s.desktopBtnText, { color: colors.text }]}>Edit Profile</Text>
                </Pressable>
                <Pressable style={[s.desktopBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={handleShare} accessibilityRole="button">
                  <Ionicons name="share-outline" size={14} color={colors.text} />
                  <Text style={[s.desktopBtnText, { color: colors.text }]}>Share</Text>
                </Pressable>
              </View>
            </View>
            <ScrollView style={s.desktopRight} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 48 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BLUE} />}>
              {contentBody}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BLUE} />}
          >
            {heroSection}
            {contentBody}
          </ScrollView>
        )}
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Desktop
  desktopLayout:  { flex: 1, flexDirection: 'row' },
  desktopLeft:    { width: 300, flexShrink: 0 },
  desktopRight:   { flex: 1 },
  desktopActions: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  desktopBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  desktopBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingBottom: 40,
    overflow: 'hidden',
  },
  // ── Contact Card Styles ────────────────────────────────────────────────
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    gap: 12,
  },
  contactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 4,
    backgroundColor: '#E6E6E6',
    borderWidth: 2,
    borderColor: CultureTokens.indigo + '20',
  },
  contactAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  contactInitials: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  contactNameBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 1,
  },
  contactDisplayName: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },
  contactUsername: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  contactEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
  },
  contactEditText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  contactRows: {
    paddingVertical: 4,
  },

  // Decorative arcs
  arcOuter: {
    position: 'absolute', top: -140, right: -140,
    width: 380, height: 380, borderRadius: 190,
    borderWidth: 1, borderColor: 'rgba(255,251,235,0.06)',
  },
  arcInner: {
    position: 'absolute', top: -70, right: -70,
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 1, borderColor: 'rgba(255,251,235,0.08)',
  },
  orbBlue: {
    position: 'absolute', top: -60, right: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: CultureTokens.indigo + '15',
  },
  orbYellow: {
    position: 'absolute', bottom: 30, left: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: CultureTokens.gold + '08',
  },

  topRow: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12, gap: 10,
  },
  topRight: {
    flexDirection: 'row', gap: 10,
  },
  topBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  notifDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: CultureTokens.coral,
    borderWidth: 1.5, borderColor: '#0B0B14',
    zIndex: 1,
  },

  // Avatar
  avatarWrap:     { position: 'relative', marginBottom: 20, marginTop: 8 },
  avatarRing:     { width: AVATAR_SIZE + 10, height: AVATAR_SIZE + 10, borderRadius: (AVATAR_SIZE + 10) / 2, padding: 4, alignItems: 'center', justifyContent: 'center' },
  avatarInner:    { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, overflow: 'hidden', backgroundColor: '#1B0F2E' },
  avatarImg:      { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarInitials: { fontSize: 36, fontFamily: 'Poppins_700Bold', color: '#fff' },
  editDot:        { position: 'absolute', bottom: 4, right: 4, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, zIndex: 1 },

  // Name & points
  heroName:    { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', letterSpacing: 1.5, textAlign: 'center', paddingHorizontal: 24 },
  heroHandle:  { fontSize: 14, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.5)', marginTop: 2, marginBottom: 16 },
  heroPoints:  { fontSize: 52, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', letterSpacing: -1.5, lineHeight: 60 },
  pointsSec: { alignItems: 'center', marginVertical: 12 },
  heroPtsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  heroPtsLabel:{ fontSize: 11, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold, letterSpacing: 2 },

  tierPill:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  tierPillText:{ fontSize: 12, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5, textTransform: 'uppercase' },

  heroBorderLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

  // ── Content ───────────────────────────────────────────────────────────────
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 20 },

  // Tiles
  tilesGrid: { gap: 14 },
  tilesRow:  { flexDirection: 'row', gap: 14 },

  // Cards
  card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  cardTitle: {
    fontSize: 12, fontFamily: 'Poppins_700Bold',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  divider: { height: 1, marginHorizontal: 20 },

  // Settings rows
  settingsRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 15 },
  settingsIcon:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingsLabel:     { flex: 1, fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  settingsRight:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsBadge:     { height: 24, borderRadius: 12, backgroundColor: CultureTokens.coral, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  settingsBadgeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#fff' },

  // Upgrade card
  upgradeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 24, borderRadius: 24, overflow: 'hidden',
    shadowColor: CultureTokens.indigo, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8
  },
  upgradeIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  upgradeTitle:   { fontSize: 17, fontFamily: 'Poppins_700Bold', color: '#fff' },
  upgradeSub:     { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)', lineHeight: 18 },

  // Sign out
  signOut:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, marginTop: 8 },
  signOutText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: CultureTokens.coral },
  version:     { textAlign: 'center', fontSize: 12, fontFamily: 'Poppins_400Regular', paddingBottom: 12 },
});

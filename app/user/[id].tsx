import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Share,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { User, Membership } from '@shared/schema';
import { Skeleton } from '@/components/ui/Skeleton';
import { CP, SOCIAL_ICONS, TIER_CONFIG, formatMemberDate, getInitials } from '@/components/user/profileUtils';
import { TextStyles } from '@/constants/theme';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const topInset    = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/users', id as string],
    enabled: !!id,
  });

  const { data: membership } = useQuery<Membership>({
    queryKey: [`/api/membership/${id}`],
    enabled: !!id,
  });

  const tier     = membership?.tier ?? 'free';
  const tierConf = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'community' | 'media' | 'about'>('overview');

  const socialLinks   = useMemo(() => (user?.socialLinks ?? {}) as Record<string, string | undefined>, [user?.socialLinks]);
  const activeSocials = useMemo(() => SOCIAL_ICONS.filter(s => socialLinks[s.key]), [socialLinks]);

  const displayName  = user?.displayName ?? 'CulturePass User';
  const initials     = useMemo(() => getInitials(displayName), [displayName]);
  const locationText = useMemo(() => [user?.city, user?.country].filter(Boolean).join(', '), [user?.city, user?.country]);
  const memberSince  = useMemo(() => formatMemberDate(user?.createdAt), [user?.createdAt]);
  const isDesktopWeb = Platform.OS === 'web';
  const socialCount = activeSocials.length;
  const tabs: Array<{ key: 'overview' | 'events' | 'community' | 'media' | 'about'; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { key: 'overview', label: 'Overview', icon: 'sparkles-outline' },
    { key: 'events', label: 'Events', icon: 'calendar-outline' },
    { key: 'community', label: 'Community', icon: 'people-outline' },
    { key: 'media', label: 'Media', icon: 'images-outline' },
    { key: 'about', label: 'About', icon: 'information-circle-outline' },
  ];

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = `https://culturepass.app/u/${user?.username}`;
      await Share.share({
        title: `${displayName} on CulturePass`,
        message: `Check out ${displayName}'s profile on CulturePass!\n\nCPID: ${user?.culturePassId ?? `CPID-${user?.id}`}\n@${user?.username}\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch { /* noop */ }
  }, [displayName, user?.id, user?.culturePassId, user?.username]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.hero, { paddingTop: topInset + 8, minHeight: 400 }]}>
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <Skeleton width={44} height={44} borderRadius={22} />
            </View>
            <Skeleton width={100} height={100} borderRadius={50} style={{ alignSelf: 'center', marginBottom: 20 }} />
            <Skeleton width={180} height={32} borderRadius={8} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Skeleton width={120} height={20} borderRadius={6} style={{ alignSelf: 'center', marginBottom: 30 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
              <Skeleton width={80} height={40} borderRadius={10} />
              <Skeleton width={80} height={40} borderRadius={10} />
            </View>
          </View>
        </View>
        <View style={{ padding: 20, gap: 20 }}>
          <Skeleton width="100%" height={120} borderRadius={16} />
          <Skeleton width="100%" height={180} borderRadius={16} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="person-outline" size={52} color={CP.muted} />
        <Text style={[styles.errorText, { marginTop: 14 }]}>Profile not found</Text>
        <Pressable style={styles.goBackButton} onPress={handleBack}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 52 }}
      >
        <LinearGradient colors={[CP.dark, CP.purpleDark, CP.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: topInset + 10 }]}>
          <View style={styles.heroNav}>
            <Pressable style={styles.heroIconBtn} onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={22} color="#FFF" />
            </Pressable>
            <Pressable style={styles.heroIconBtn} onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share profile">
              <Ionicons name="share-outline" size={20} color="#FFF" />
            </Pressable>
          </View>
          <View style={styles.heroCenter}>
            <View style={styles.avatarRing}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <Text style={styles.heroName}>{displayName}</Text>
            {(user.handle ?? user.username) ? <Text style={styles.heroHandle}>+{user.handle ?? user.username}</Text> : null}
            <View style={styles.heroMetaRow}>
              {locationText ? (
                <View style={styles.heroPill}>
                  <Ionicons name="location-outline" size={12} color={CP.muted} />
                  <Text style={styles.heroPillText}>{locationText}</Text>
                </View>
              ) : null}
              <View style={[styles.heroPill, styles.heroPillAccent]}>
                <Ionicons name="sparkles-outline" size={12} color={CP.teal} />
                <Text style={[styles.heroPillText, styles.heroPillTextAccent]}>{tierConf.label} Member</Text>
              </View>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{user.followersCount ?? 0}</Text>
                <Text style={styles.heroStatLabel}>Followers</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{user.eventsAttended ?? 0}</Text>
                <Text style={styles.heroStatLabel}>Events</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{user.communities?.length ?? 0}</Text>
                <Text style={styles.heroStatLabel}>Community</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {tabs.map(tab => (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}>
                <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? CP.teal : CP.muted} />
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.contentShell, isDesktopWeb && styles.desktopShell]}>
          <View style={styles.sideCol}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Profile Snapshot</Text>
              <Text style={styles.panelBody}>{user.bio || 'Culture-led member building community through local events and shared identity.'}</Text>
              <View style={styles.panelMetaRow}>
                <Ionicons name="calendar-outline" size={14} color={CP.muted} />
                <Text style={styles.panelMetaText}>Member since {memberSince || 'Recently joined'}</Text>
              </View>
              <View style={styles.panelMetaRow}>
                <Ionicons name="finger-print-outline" size={14} color={CP.muted} />
                <Text style={styles.panelMetaText}>{user.culturePassId ?? `CPID-${user.id}`}</Text>
              </View>
            </View>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Quick Actions</Text>
              <Pressable style={styles.actionRow} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={16} color={CP.teal} />
                <Text style={styles.actionText}>Share Profile</Text>
              </Pressable>
              <Pressable style={styles.actionRow} onPress={() => router.push('/events')}>
                <Ionicons name="calendar-number-outline" size={16} color={CP.teal} />
                <Text style={styles.actionText}>View Local Events</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.mainCol}>
            {activeTab === 'overview' && (
              <>
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Live Now</Text>
                  <Text style={styles.liveNowText}>Culture pulse is active in {user.city || 'your city'} with new events and community activity.</Text>
                </View>
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Featured Event Moments</Text>
                  <View style={styles.metricRow}>
                    <Metric label="Attended" value={`${user.eventsAttended ?? 0}`} />
                    <Metric label="Likes" value={`${user.likesCount ?? 0}`} />
                    <Metric label="Connections" value={`${user.connectionsCount ?? 0}`} />
                  </View>
                </View>
              </>
            )}

            {activeTab === 'events' && (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Events First</Text>
                <Text style={styles.panelBody}>This profile prioritizes event participation, upcoming city experiences, and community attendance momentum.</Text>
                <View style={styles.badgeRow}>
                  <Badge text={`Total attended: ${user.eventsAttended ?? 0}`} />
                  <Badge text={`Interest tags: ${user.interests?.length ?? 0}`} />
                </View>
              </View>
            )}

            {activeTab === 'community' && (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Community Layer</Text>
                <Text style={styles.panelBody}>Connected groups and culture circles appear here first to keep discovery social and local.</Text>
                <View style={styles.badgeRow}>
                  {(user.communities ?? []).slice(0, 6).map((community) => (
                    <Badge key={community} text={community} />
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'media' && (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Media Highlights</Text>
                <Text style={styles.panelBody}>Visual moments from events and culture snapshots can be displayed as a media rail in the next iteration.</Text>
              </View>
            )}

            {activeTab === 'about' && (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>About This Member</Text>
                <Text style={styles.panelBody}>{user.bio || 'No public bio yet.'}</Text>
                <View style={styles.badgeRow}>
                  {(user.interests ?? []).slice(0, 8).map((interest) => (
                    <Badge key={interest} text={interest} />
                  ))}
                  {socialCount > 0 ? <Badge text={`Social links: ${socialCount}`} /> : null}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CP.bg },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  errorText:        { ...TextStyles.bodyMedium, color: CP.muted },
  goBackButton:     { marginTop: 16, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 14, backgroundColor: CP.purple },
  goBackButtonText: { ...TextStyles.callout, color: '#FFF' },

  hero: { paddingBottom: 22, overflow: 'hidden' },
  heroNav: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroCenter: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: CP.teal,
    backgroundColor: CP.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 34, fontFamily: 'Poppins_700Bold', color: CP.teal },
  heroName: { marginTop: 12, fontSize: 26, fontFamily: 'Poppins_700Bold', color: '#FFF' },
  heroHandle: { marginTop: 2, fontSize: 14, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.72)' },
  heroMetaRow: { marginTop: 12, flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroPillAccent: { backgroundColor: CP.teal + '20' },
  heroPillText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.78)' },
  heroPillTextAccent: { color: CP.teal },
  heroStats: {
    marginTop: 16,
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 19, fontFamily: 'Poppins_700Bold', color: '#FFF' },
  heroStatLabel: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: CP.muted },
  heroStatDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.12)' },
  tabsWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: CP.border,
    backgroundColor: CP.surface,
  },
  tabsRow: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: CP.bg,
  },
  tabBtnActive: { backgroundColor: CP.teal + '15' },
  tabText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: CP.muted },
  tabTextActive: { color: CP.teal },
  contentShell: {
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 14,
  },
  desktopShell: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1100,
    gap: 16,
  },
  sideCol: { flex: 1, gap: 14 },
  mainCol: { flex: 1.8, gap: 14 },
  panel: {
    backgroundColor: CP.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CP.border,
    padding: 16,
  },
  panelTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: CP.text, marginBottom: 8 },
  panelBody: { fontSize: 14, lineHeight: 22, fontFamily: 'Poppins_400Regular', color: '#52525B' },
  panelMetaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelMetaText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#64748B' },
  actionRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  actionText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: CP.teal },
  liveNowText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: CP.text },
  metricRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: CP.bg,
    borderWidth: 1,
    borderColor: CP.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  metricValue: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: CP.text },
  metricLabel: { marginTop: 2, fontSize: 11, fontFamily: 'Poppins_500Medium', color: '#6B7280' },
  badgeRow: { marginTop: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: {
    borderRadius: 999,
    backgroundColor: CP.teal + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: CP.teal },
  spacer: {
    height: 1,
  },
});

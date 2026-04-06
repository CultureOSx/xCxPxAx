// app/(tabs)/profile.tsx — rebuilt
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Share, Linking, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { HeroGlassIconButton } from '@/app/event/_components/HeroGlassIconButton';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useCurrentUser } from '@/hooks/useProfile';
import { usePerks } from '@/hooks/queries/usePerks';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { NATIONALITIES } from '@/constants/cultures';
import { CultureTokens, gradients, LiquidGlassTokens } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GuestProfileView } from '@/components/profile/GuestProfileView';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/schema';
import QRCode from 'react-native-qrcode-svg';
import { ProfileScanner } from '@/components/scanner/ProfileScanner';

import {
  SectionHeader,
  ProfileAvatar,
  ProfileSkeleton,
  CultureMapModal,
} from '@/components/profile-tabs/ProfileComponents';
import {
  fmt, memberDate, TIER_CFG, NAT_COORDS, SOCIAL_DEFS,
} from '@/components/profile-tabs/ProfileUtils';
import {
  root, hero, act, tier, sec, cul, prk, cpid, soc, det, set, sout,
} from '@/components/profile-tabs/ProfileStyles';

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets   = useSafeAreaInsets();
  const colors   = useColors();
  const { isDesktop, hPad } = useLayout();
  const { userId, user: authUser, logout } = useAuth();
  const { state: onboarding } = useOnboarding();
  const [showCultureMap, setShowCultureMap] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();

  const { user, isLoading, isFetching, isError, refetch: refetchProfile, error: profileError } = useCurrentUser();
  const { data: perks = [], isLoading: perksLoading, refetch: refetchPerks } = usePerks();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProfile(), refetchPerks()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile, refetchPerks]);

  const matchedCultures = useMemo(() => {
    const natId = onboarding?.nationalityId;
    const cultureIds: string[] = onboarding?.cultureIds ?? [];
    const natIds = new Set<string>(natId ? [natId] : []);
    cultureIds.forEach(cid => {
      const nat = Object.values(NATIONALITIES).find(n => n.cultureIds.includes(cid));
      if (nat) natIds.add(nat.id);
    });
    return Array.from(natIds)
      .map((id, idx) => {
        const nat = NATIONALITIES[id];
        const coords = NAT_COORDS[id];
        if (!nat || !coords) return null;
        return { id: `${id}-${idx}`, name: nat.label, emoji: nat.emoji, lat: coords.lat, lng: coords.lng, color: CultureTokens.gold };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [onboarding?.nationalityId, onboarding?.cultureIds]);

  const displayUser = useMemo((): Partial<User> => {
    const a = (authUser ?? {}) as Partial<User>;
    const u = (user ?? {}) as Partial<User>;
    return {
      ...a,
      ...u,
      id: (u.id ?? a.id ?? userId) as string | undefined,
      email: u.email ?? a.email,
      username: u.username ?? a.username,
      displayName: u.displayName ?? a.displayName,
      city: u.city ?? a.city,
      country: u.country ?? a.country,
      bio: u.bio ?? a.bio,
      avatarUrl: u.avatarUrl ?? a.avatarUrl,
      handle: u.handle ?? a.handle,
      createdAt: u.createdAt ?? a.createdAt,
      culturePassId: u.culturePassId ?? a.culturePassId,
      website: u.website ?? a.website,
      phone: u.phone ?? a.phone,
      followersCount: u.followersCount ?? a.followersCount,
      followingCount: u.followingCount ?? a.followingCount,
      likesCount: u.likesCount ?? a.likesCount,
      socialLinks: u.socialLinks ?? a.socialLinks,
      membership: u.membership ?? a.membership,
    };
  }, [user, authUser, userId]);

  const tierKey = useMemo(() => {
    const apiTier = user?.membership?.tier;
    const sub = authUser?.subscriptionTier;
    const raw = String(apiTier ?? sub ?? 'free').toLowerCase();
    if (raw === 'sydney-local') return 'plus';
    return raw;
  }, [user?.membership?.tier, authUser?.subscriptionTier]);

  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const name     = displayUser?.displayName || displayUser?.username || 'a CulturePass member';
    const handle   = displayUser?.handle ?? displayUser?.username;
    const shareUrl = handle
      ? `https://culturepass.app/@${handle}`
      : `https://culturepass.app/profile/${userId}`;
    const message  = `Check out ${name}'s profile on CulturePass!\n\n${shareUrl}`;
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title: `${name} on CulturePass`, text: message, url: shareUrl });
      } else {
        await Share.share({ message, url: shareUrl });
      }
    } catch { /* user cancelled */ }
  }, [displayUser?.displayName, displayUser?.username, displayUser?.handle, userId]);

  if (!userId) return <GuestProfileView topInset={insets.top} />;

  const showBootSkeleton = isLoading && !user && !authUser?.username && !authUser?.email;
  if (showBootSkeleton) return <ProfileSkeleton colors={colors} topInset={Platform.OS === 'web' ? 0 : insets.top} />;

  const displayName  = displayUser?.displayName || displayUser?.username || 'CulturePass Member';
  const handle       = displayUser?.handle ?? displayUser?.username;
  const locationText = [displayUser?.city, displayUser?.country].filter(Boolean).join(', ');
  const tierConf     = TIER_CFG[tierKey] ?? TIER_CFG.free;
  const cpidStr      = displayUser?.culturePassId ?? `CP-${(userId || '').slice(-6).toUpperCase()}`;
  const isFree       = !tierKey || tierKey === 'free';
  const since        = memberDate(displayUser?.createdAt);
  const hasCultures  = matchedCultures.length > 0;

  const userSocialLinks = (displayUser as Record<string, unknown>)?.socialLinks as Record<string, string> | undefined;
  const activeSocials   = SOCIAL_DEFS.filter(s => userSocialLinks?.[s.key]);
  const socialLinks     = userSocialLinks ?? {};

  const topInset    = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;

  return (
    <ErrorBoundary>
      <View style={[root.wrap, { backgroundColor: colors.background }]}>
        <ProfileScanner
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          }}
        />
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={profileGlass.ambientMesh}
          pointerEvents="none"
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={CultureTokens.indigo}
              colors={[CultureTokens.indigo]}
            />
          }
        >
          {isError ? (
            <Pressable
              onPress={() => void refetchProfile()}
              style={[profileGlass.errorBanner, { marginHorizontal: hPad, backgroundColor: CultureTokens.coral + '14', borderColor: CultureTokens.coral + '35' }]}
              accessibilityRole="button"
              accessibilityLabel="Profile could not load. Tap to retry."
            >
              <Ionicons name="cloud-offline-outline" size={18} color={CultureTokens.coral} />
              <Text style={[profileGlass.errorBannerText, { color: colors.text }]} numberOfLines={2}>
                {profileError instanceof Error ? profileError.message : String(profileError ?? 'Could not refresh profile.')} Tap to retry.
              </Text>
            </Pressable>
          ) : null}

          <View style={[hero.nav, { paddingHorizontal: hPad, paddingTop: topInset + 10 }]}>
            {!isDesktop && (
              <HeroGlassIconButton
                onPress={() => router.push('/settings')}
                accessibilityRole="button"
                accessibilityLabel="Settings"
              >
                <Ionicons name="settings-outline" size={20} color={colors.text} />
              </HeroGlassIconButton>
            )}
            <View style={{ flex: 1 }} />
            {isFetching && !refreshing ? (
              <ActivityIndicator size="small" color={CultureTokens.indigo} style={{ marginRight: 8 }} />
            ) : null}
            <HeroGlassIconButton onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share profile">
              <Ionicons name="share-outline" size={20} color={colors.text} />
            </HeroGlassIconButton>
          </View>

          <LiquidGlassPanel
            borderRadius={LiquidGlassTokens.corner.mainCard}
            style={{ marginHorizontal: hPad, marginTop: 4 }}
            contentStyle={{ alignItems: 'center', paddingVertical: 20, paddingHorizontal: 16 }}
          >
            <ProfileAvatar user={displayUser} displayName={displayName} size={96} />

            <Text style={[hero.name, { color: colors.text }]}>{displayName}</Text>
            {handle ? <Text style={[hero.handle, { color: colors.textSecondary }]}>@{handle}</Text> : null}

            {hasCultures ? (
              <Pressable
                style={profileGlass.culturePills}
                onPress={() => setShowCultureMap(true)}
                accessibilityRole="button"
                accessibilityLabel="View cultural heritage"
              >
                {matchedCultures.slice(0, 4).map(c => (
                  <View
                    key={c.id}
                    style={[profileGlass.culturePill, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
                  >
                    <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                    <Text style={[profileGlass.culturePillText, { color: colors.text }]}>{c.name}</Text>
                  </View>
                ))}
                {matchedCultures.length > 4 ? (
                  <View style={[profileGlass.culturePill, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
                    <Text style={[profileGlass.culturePillText, { color: colors.textSecondary }]}>
                      +{matchedCultures.length - 4}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null}

            <View
              style={[
                profileGlass.statsBar,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
              ]}
            >
              <LinearGradient
                colors={['transparent', CultureTokens.teal + 'AA', CultureTokens.indigo + 'AA', CultureTokens.teal + 'AA', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={profileGlass.statsAccentLine}
              />
              {[
                { label: 'Followers', value: displayUser?.followersCount ?? 0 },
                { label: 'Following', value: displayUser?.followingCount ?? 0 },
                { label: 'Likes', value: displayUser?.likesCount ?? 0 },
              ].map((stat, i, arr) => (
                <React.Fragment key={stat.label}>
                  <Pressable
                    style={hero.statItem}
                    onPress={() => router.push('/profile/edit')}
                    accessibilityRole="button"
                  >
                    <Text style={[hero.statNum, { color: colors.text }]}>{fmt(stat.value)}</Text>
                    <Text style={[hero.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
                  </Pressable>
                  {i < arr.length - 1 ? (
                    <View style={[hero.statDivider, { backgroundColor: colors.borderLight }]} />
                  ) : null}
                </React.Fragment>
              ))}
            </View>
          </LiquidGlassPanel>

          {/* ── CONTENT (max-width centred on desktop) ────────────────── */}
          <View style={isDesktop ? { maxWidth: 720, width: '100%', alignSelf: 'center' } : undefined}>

          {/* ── ACTION BUTTONS (glass rail) ───────────────────────────── */}
          <LiquidGlassPanel
            borderRadius={LiquidGlassTokens.corner.mainCard}
            style={{ marginHorizontal: hPad, marginTop: 16 }}
            contentStyle={[act.row, { padding: 12, gap: 10 }]}
          >
            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [act.btn, { backgroundColor: hovered ? CultureTokens.indigo + 'DD' : CultureTokens.indigo, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push('/profile/edit'); }}
              accessibilityRole="button" accessibilityLabel="Edit profile"
            >
              <Ionicons name="pencil" size={15} color={colors.textOnBrandGradient} />
              <Text style={[act.label, { color: colors.textOnBrandGradient }]}>Edit Profile</Text>
            </Pressable>
            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                act.btn,
                { backgroundColor: hovered ? CultureTokens.teal + '20' : CultureTokens.teal + '12', borderWidth: 1, borderColor: hovered ? CultureTokens.teal + '55' : CultureTokens.teal + '38', transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setShowScanner(true); }}
              accessibilityRole="button" accessibilityLabel="Scan ID"
            >
              <Ionicons name="scan-outline" size={15} color={CultureTokens.teal} />
              <Text style={[act.label, { color: CultureTokens.teal }]}>Scan</Text>
            </Pressable>
            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                act.btn,
                { backgroundColor: hovered ? colors.surfaceElevated : colors.primarySoft, borderWidth: 1, borderColor: colors.borderLight, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              onPress={handleShare}
              accessibilityRole="button" accessibilityLabel="Share profile"
            >
              <Ionicons name="share-outline" size={15} color={colors.textSecondary} />
              <Text style={[act.label, { color: colors.textSecondary }]}>Share</Text>
            </Pressable>
          </LiquidGlassPanel>

          {/* ── MEMBERSHIP TIER ───────────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
            <LiquidGlassPanel
              borderRadius={LiquidGlassTokens.corner.mainCard}
              contentStyle={{ padding: 0, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={[tierConf.color + '22', tierConf.color + '0A', colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[tier.card, { borderWidth: 0, borderColor: tierConf.color + '35' }]}
              >
                <View style={tier.left}>
                  <View style={[tier.iconWrap, { backgroundColor: tierConf.color + '20' }]}>
                    <Ionicons name={tierConf.icon} size={20} color={tierConf.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[tier.label, { color: tierConf.color }]}>{tierConf.label} Member</Text>
                    {since ? <Text style={[tier.since, { color: colors.textTertiary }]}>Member since {since}</Text> : null}
                  </View>
                </View>
                {isFree ? (
                  <Pressable
                    style={[tier.upgradeBtn, { backgroundColor: CultureTokens.indigo }]}
                    onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push('/membership/upgrade'); }}
                    accessibilityRole="button"
                  >
                    <Text style={tier.upgradeTxt}>Upgrade</Text>
                    <Ionicons name="arrow-forward" size={13} color={colors.textOnBrandGradient} />
                  </Pressable>
                ) : null}
              </LinearGradient>
            </LiquidGlassPanel>
          </View>

          {/* ── BIO ───────────────────────────────────────────────────── */}
          {displayUser?.bio ? (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
              <SectionHeader title="About" colors={colors} />
              <LiquidGlassPanel borderRadius={LiquidGlassTokens.corner.mainCard} contentStyle={{ padding: 16 }}>
                <Text style={[sec.bioText, { color: colors.textSecondary }]}>{displayUser.bio}</Text>
              </LiquidGlassPanel>
            </View>
          ) : null}

          {/* ── HERITAGE ──────────────────────────────────────────────── */}
          {hasCultures ? (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
              <SectionHeader title="Heritage" action="View Map" onAction={() => setShowCultureMap(true)} colors={colors} />
              <LiquidGlassPanel borderRadius={LiquidGlassTokens.corner.mainCard} contentStyle={{ padding: 14 }}>
                <View style={cul.grid}>
                  {matchedCultures.map((c, i) => (
                    <Animated.View
                      key={c.id}
                      entering={
                        reducedMotion || Platform.OS === 'web'
                          ? undefined
                          : FadeInDown.delay(Math.min(i * 70, 350)).springify().damping(18).stiffness(110)
                      }
                      style={[cul.chip, { backgroundColor: colors.primarySoft, borderColor: CultureTokens.teal + '35' }]}
                    >
                      <LinearGradient
                        colors={[CultureTokens.teal + '14', CultureTokens.indigo + '08']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
                      <Text style={[cul.chipLabel, { color: colors.text }]}>{c.name}</Text>
                    </Animated.View>
                  ))}
                </View>
              </LiquidGlassPanel>
            </View>
          ) : null}

          {/* ── PERKS ─────────────────────────────────────────────────── */}
          {(perksLoading || perks.length > 0) ? (
            <View style={[sec.wrap, { marginTop: 24 }]}>
              <View style={{ paddingHorizontal: hPad }}>
                <SectionHeader title="Your Perks" action="View All" onAction={() => router.push('/(tabs)/perks')} colors={colors} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[prk.scroll, { paddingHorizontal: hPad }]}>
                {perksLoading
                  ? [0, 1, 2].map((i) => (
                      <LiquidGlassPanel
                        key={`perk-sk-${i}`}
                        borderRadius={20}
                        style={{ width: 160, minHeight: 130 }}
                        contentStyle={{ alignItems: 'center', justifyContent: 'center', padding: 14 }}
                      >
                        <ActivityIndicator color={CultureTokens.indigo} />
                      </LiquidGlassPanel>
                    ))
                  : perks.slice(0, 6).map(perk => (
                      <Pressable
                        key={perk.id}
                        onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push({ pathname: '/perks/[id]', params: { id: perk.id } }); }}
                        accessibilityRole="button"
                        accessibilityLabel={perk.title}
                        style={({ pressed }) => [{ width: 160, opacity: pressed ? 0.9 : 1 }]}
                      >
                        <LiquidGlassPanel borderRadius={20} contentStyle={{ padding: 14, overflow: 'hidden', minHeight: 128 }}>
                          <LinearGradient colors={[CultureTokens.gold + '28', CultureTokens.indigo + '18']} style={prk.cardGrad} />
                          <View style={[prk.icon, { backgroundColor: CultureTokens.gold + '20' }]}>
                            <Ionicons name="gift-outline" size={18} color={CultureTokens.gold} />
                          </View>
                          <Text style={[prk.title, { color: colors.text }]} numberOfLines={2}>{perk.title}</Text>
                          {'discount' in perk && (perk as unknown as { discount?: string }).discount ? (
                            <View style={[prk.badge, { backgroundColor: CultureTokens.coral + '18' }]}>
                              <Text style={[prk.badgeText, { color: CultureTokens.coral }]}>{(perk as unknown as { discount: string }).discount}</Text>
                            </View>
                          ) : null}
                        </LiquidGlassPanel>
                      </Pressable>
                    ))}
              </ScrollView>
            </View>
          ) : null}

          {/* ── DIGITAL IDENTITY CARD ─────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
            <SectionHeader title="Digital Identity" colors={colors} />
            <LiquidGlassPanel borderRadius={28} bordered={false} contentStyle={{ padding: 0, overflow: 'hidden' }}>
            <LinearGradient
              colors={[colors.background, CultureTokens.indigo + '35', colors.background]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={cpid.card}
            >
              <LinearGradient
                colors={['transparent', CultureTokens.teal, CultureTokens.indigo, CultureTokens.teal, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={cpid.accentLine}
              />
              <View style={cpid.topRow}>
                <View style={cpid.logoRow}>
                  <LinearGradient colors={[CultureTokens.teal, CultureTokens.indigo]} style={cpid.logoIcon}>
                    <Ionicons name="globe" size={13} color={colors.textOnBrandGradient} />
                  </LinearGradient>
                  <Text style={cpid.logoText}>CulturePass</Text>
                </View>
                <View style={[cpid.shieldBadge, { borderColor: CultureTokens.teal + '40' }]}>
                  <Ionicons name="shield-checkmark" size={15} color={CultureTokens.teal} />
                </View>
              </View>
              <View style={cpid.centerBlock}>
                <Text style={cpid.cpidLabel}>CULTUREPASS ID</Text>
                <Text style={cpid.cpidValue}>{cpidStr}</Text>
                <LinearGradient
                  colors={['transparent', CultureTokens.teal, 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={cpid.underline}
                />
              </View>
              <View style={cpid.metaRow}>
                <View style={cpid.metaItem}>
                  <Text style={cpid.metaLabel}>NAME</Text>
                  <Text style={cpid.metaValue}>{displayName}</Text>
                </View>
                <View style={cpid.metaItem}>
                  <Text style={cpid.metaLabel}>SINCE</Text>
                  <Text style={cpid.metaValue}>{since || 'N/A'}</Text>
                </View>
                <View style={[cpid.metaItem, { alignItems: 'flex-end' }]}>
                  <Text style={cpid.metaLabel}>TIER</Text>
                  <Text style={[cpid.metaValue, { color: tierConf.color }]}>{tierConf.label}</Text>
                </View>
              </View>
              <View style={cpid.qrOverlay}>
                <View style={cpid.qrPadding}>
                  <QRCode
                    value={`culturepass://profile/${displayUser?.id || userId}`}
                    size={72}
                    backgroundColor="transparent"
                    color={CultureTokens.teal}
                  />
                </View>
              </View>
              <View style={[cpid.footer, { borderTopColor: colors.borderLight + '55' }]}>
                <Text style={cpid.footerText}>Verified Digital Identity</Text>
                <Ionicons name="finger-print" size={20} color={CultureTokens.teal + '55'} />
              </View>
            </LinearGradient>
            </LiquidGlassPanel>
          </View>

          {/* ── SOCIAL LINKS ─────────────────────────────────────────── */}
          {activeSocials.length > 0 && (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
              <SectionHeader title="Social" colors={colors} />
              <LiquidGlassPanel borderRadius={LiquidGlassTokens.corner.mainCard} contentStyle={{ padding: 12 }}>
              <View style={soc.grid}>
                {activeSocials.map(s => (
                  <Pressable
                    key={s.key}
                    style={[soc.card, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const url = socialLinks[s.key];
                      if (url) Linking.openURL(url);
                    }}
                    accessibilityRole="link"
                    accessibilityLabel={s.label}
                  >
                    <View style={[soc.strip, { backgroundColor: s.color }]} />
                    <View style={[soc.iconWrap, { backgroundColor: s.color + '14' }]}>
                      <Ionicons name={s.icon} size={22} color={s.color} />
                    </View>
                    <Text style={[soc.label, { color: colors.text }]}>{s.label}</Text>
                    <Ionicons name="open-outline" size={14} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
              </LiquidGlassPanel>
            </View>
          )}

          {/* ── CONTACT DETAILS ──────────────────────────────────────── */}
          {(locationText || displayUser?.website || displayUser?.phone) ? (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
              <SectionHeader title="Details" colors={colors} />
              <LiquidGlassPanel borderRadius={20} contentStyle={{ padding: 4 }}>
              <View style={[det.card, { borderWidth: 0, backgroundColor: 'transparent' }]}>
                {locationText ? (
                  <View style={det.row}>
                    <View style={[det.iconWrap, { backgroundColor: CultureTokens.indigo + '14' }]}>
                      <Ionicons name="location" size={18} color={CultureTokens.indigo} />
                    </View>
                    <View style={det.text}>
                      <Text style={[det.label, { color: colors.textTertiary }]}>Location</Text>
                      <Text style={[det.value, { color: colors.text }]}>{locationText}</Text>
                    </View>
                  </View>
                ) : null}
                {displayUser?.website ? (
                  <>
                    {locationText ? <View style={[det.divider, { backgroundColor: colors.borderLight }]} /> : null}
                    <Pressable style={det.row} onPress={() => Linking.openURL(displayUser.website!)} accessibilityRole="link">
                      <View style={[det.iconWrap, { backgroundColor: CultureTokens.teal + '14' }]}>
                        <Ionicons name="globe-outline" size={18} color={CultureTokens.teal} />
                      </View>
                      <View style={det.text}>
                        <Text style={[det.label, { color: colors.textTertiary }]}>Website</Text>
                        <Text style={[det.value, { color: CultureTokens.teal }]}>{displayUser.website}</Text>
                      </View>
                      <Ionicons name="open-outline" size={15} color={colors.textTertiary} />
                    </Pressable>
                  </>
                ) : null}
                {displayUser?.phone ? (
                  <>
                    <View style={[det.divider, { backgroundColor: colors.borderLight }]} />
                    <View style={det.row}>
                      <View style={[det.iconWrap, { backgroundColor: CultureTokens.coral + '14' }]}>
                        <Ionicons name="call-outline" size={18} color={CultureTokens.coral} />
                      </View>
                      <View style={det.text}>
                        <Text style={[det.label, { color: colors.textTertiary }]}>Phone</Text>
                        <Text style={[det.value, { color: colors.text }]}>{displayUser.phone}</Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
              </LiquidGlassPanel>
            </View>
          ) : null}

          {/* ── SETTINGS SHORTCUTS ───────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
            <SectionHeader title="Settings" colors={colors} />
            <LiquidGlassPanel borderRadius={20} contentStyle={{ padding: 4 }}>
            <View style={[set.card, { borderWidth: 0, backgroundColor: 'transparent' }]}>
              {[
                { icon: 'person-outline' as const,        label: 'Edit Profile',   path: '/profile/edit',           accent: CultureTokens.indigo },
                { icon: 'notifications-outline' as const, label: 'Notifications',  path: '/settings/notifications', accent: CultureTokens.teal   },
                { icon: 'lock-closed-outline' as const,   label: 'Privacy',        path: '/settings/privacy',       accent: CultureTokens.coral  },
                { icon: 'help-circle-outline' as const,   label: 'Help & Support', path: '/help',                   accent: CultureTokens.gold   },
              ].map((item, i, arr) => (
                <React.Fragment key={item.path}>
                  <Pressable
                    style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [set.row, { transform: [{ scale: pressed ? 0.99 : 1 }], ...(hovered && { backgroundColor: colors.surfaceElevated }) }]}
                    onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push(item.path); }}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <View style={[set.iconWrap, { backgroundColor: item.accent + '18' }]}>
                      <Ionicons name={item.icon} size={18} color={item.accent} />
                    </View>
                    <Text style={[set.label, { color: colors.text }]}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Pressable>
                  {i < arr.length - 1 && <View style={[set.divider, { backgroundColor: colors.borderLight }]} />}
                </React.Fragment>
              ))}
            </View>
            </LiquidGlassPanel>
          </View>

          {/* ── SIGN OUT ─────────────────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 16 }]}>
            <LiquidGlassPanel borderRadius={LiquidGlassTokens.corner.mainCard} bordered={false} contentStyle={{ padding: 0 }}>
            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [sout.btn, { borderColor: hovered ? CultureTokens.coral + '60' : CultureTokens.coral + '40', backgroundColor: pressed ? CultureTokens.coral + '16' : hovered ? CultureTokens.coral + '12' : CultureTokens.coral + '09', transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              onPress={async () => {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                try {
                  await logout();
                } catch (e) {
                  if (__DEV__) console.error(e);
                  if (Platform.OS === 'web') {
                    alert('Logout failed. Please try again.');
                  } else {
                    Alert.alert('Logout failed', 'Please try again.');
                  }
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Ionicons name="log-out-outline" size={18} color={CultureTokens.coral} />
              <Text style={[sout.label, { color: CultureTokens.coral }]}>Sign Out</Text>
            </Pressable>
            </LiquidGlassPanel>
          </View>
          </View>{/* end desktop centering wrapper */}
        </ScrollView>

        {/* ── CULTURE MAP MODAL ─────────────────────────────────────── */}
        {hasCultures && (
          <CultureMapModal
            visible={showCultureMap}
            onClose={() => setShowCultureMap(false)}
            cultures={matchedCultures}
            colors={colors}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

const profileGlass = StyleSheet.create({
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 18,
  },
  culturePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  culturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  culturePillText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 15,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  statsAccentLine: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 2,
    opacity: 0.45,
  },
});

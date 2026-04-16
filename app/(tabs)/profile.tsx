// app/(tabs)/profile.tsx — rebuilt
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Share, Linking, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffectiveMainTabTopInset } from '@/hooks/useEffectiveMainTabTopInset';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { MAIN_TAB_UI, MAIN_TAB_CARD_SHADOW } from '@/components/tabs/mainTabTokens';
import { TabHeaderNativeShell } from '@/components/tabs/TabHeaderNativeShell';
import { TabPageChromeRow } from '@/components/tabs/TabHeaderChrome';
import { usePerks } from '@/hooks/queries/usePerks';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { NATIONALITIES } from '@/constants/cultures';
import { communityGroups, communityFlags } from '@/constants/onboardingCommunities';
import { CultureTokens, TextStyles, FontFamily, FontSize, LineHeight } from '@/constants/theme';
import { CardSurface } from '@/components/ui/CardSurface';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GuestProfileView } from '@/components/profile/GuestProfileView';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/schema';
import QRCode from 'react-native-qrcode-svg';
import { ProfileScanner } from '@/components/scanner/ProfileScanner';
import { identityFeature } from '@/features';

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
  root, hero, act, tier, sec, prk, cpid, det, set, sout,
} from '@/components/profile-tabs/ProfileStyles';

const COMMUNITY_COLOR: Record<string, string> = {};
for (const g of communityGroups) {
  for (const m of g.members) COMMUNITY_COLOR[m] = g.color;
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets   = useSafeAreaInsets();
  const effectiveTop = useEffectiveMainTabTopInset();
  const colors   = useColors();
  const { isDesktop, hPad } = useLayout();
  const { userId, user: authUser, logout } = useAuth();
  const { state: onboarding } = useOnboarding();
  const [showCultureMap, setShowCultureMap] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const queryClient = useQueryClient();
  const {
    data: featureUser,
    isLoading,
    isError,
    refetch: refetchProfile,
    error: profileError,
  } = useQuery({
    queryKey: ['feature-identity-profile', userId],
    queryFn: () => identityFeature.getIdentityFeatureProfile(),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
  const user = featureUser ?? null;
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
      languages: u.languages ?? a.languages,
      communities: u.communities ?? a.communities,
      interests: u.interests ?? a.interests,
      ethnicityText: u.ethnicityText ?? a.ethnicityText,
    };
  }, [user, authUser, userId]);

  const tierKey = useMemo(() => {
    const apiTier = user?.membership?.tier;
    const sub = authUser?.subscriptionTier;
    const raw = String(apiTier ?? sub ?? 'free').toLowerCase();
    if (raw === 'sydney-local') return 'plus';
    return raw;
  }, [user?.membership?.tier, authUser?.subscriptionTier]);

  const languages = useMemo(() => {
    if (!displayUser?.languages) return [];
    if (Array.isArray(displayUser.languages)) return displayUser.languages;
    return (displayUser.languages as string).split(',').map((s: string) => s.trim()).filter(Boolean);
  }, [displayUser?.languages]);

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

  if (!userId) return <GuestProfileView />;

  const showBootSkeleton = isLoading && !user && !authUser?.username && !authUser?.email;
  if (showBootSkeleton) return <ProfileSkeleton colors={colors} topInset={effectiveTop} />;

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

  const communities = (displayUser?.communities as string[]) ?? [];
  const interests   = (displayUser?.interests as string[]) ?? [];
  const contributionStats = [
    { id: 'communities', label: 'Communities', value: communities.length, icon: 'people-outline', color: CultureTokens.indigo },
    { id: 'interests', label: 'Interests', value: interests.length, icon: 'sparkles-outline', color: CultureTokens.gold },
    { id: 'perks', label: 'Perks Used', value: perks.length, icon: 'gift-outline', color: CultureTokens.teal },
    { id: 'social', label: 'Social Links', value: activeSocials.length, icon: 'share-social-outline', color: CultureTokens.coral },
  ];

  const contributionHistory = [
    communities.length > 0 ? `Joined ${communities.length} communities` : null,
    interests.length > 0 ? `Configured ${interests.length} culture interests` : null,
    perks.length > 0 ? `Unlocked ${perks.length} perk opportunities` : null,
    displayUser?.website ? 'Published a public profile link' : null,
  ].filter((item): item is string => Boolean(item));

  const topInset    = effectiveTop;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;

  return (
    <ErrorBoundary>
      <View style={[root.wrap, { backgroundColor: colors.background }]}>
        <ProfileScanner
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            void queryClient.invalidateQueries({ queryKey: ['feature-identity-profile'] });
          }}
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

          {Platform.OS === 'web' ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderBottomWidth: MAIN_TAB_UI.headerBorderWidth,
                borderBottomColor: colors.borderLight,
              }}
            >
              <View
                style={{
                  paddingTop: topInset + 6,
                  paddingBottom: MAIN_TAB_UI.headerVerticalPadding,
                  paddingHorizontal: hPad,
                }}
              >
                <TabPageChromeRow title="Profile" showHairline={false} />
              </View>
            </View>
          ) : (
            <TabHeaderNativeShell hPad={hPad}>
              <TabPageChromeRow title="Profile" showHairline={false} />
            </TabHeaderNativeShell>
          )}

          <CardSurface colors={colors}
            borderRadius={MAIN_TAB_UI.cardRadius}
            style={{ marginHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapSmall }}
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
              <View style={[profileGlass.statsAccentLine, { backgroundColor: CultureTokens.teal + '55' }]} />
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
                    accessibilityLabel={`${fmt(stat.value)} ${stat.label}`}
                    accessibilityHint="Opens profile edit"
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
          </CardSurface>

          {/* ── CONTENT (max-width centred on desktop) ────────────────── */}
          <View style={isDesktop ? { maxWidth: 720, width: '100%', alignSelf: 'center' } : undefined}>

          {/* ── ACTION BUTTONS ───────────────────────────── */}
          <CardSurface colors={colors}
            borderRadius={MAIN_TAB_UI.cardRadius}
            style={{ marginHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGap }}
            contentStyle={[act.row, { padding: 12, gap: 10 }]}
          >
            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [act.btn, { backgroundColor: hovered ? CultureTokens.indigo + 'DD' : CultureTokens.indigo, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push('/profile/edit'); }}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              accessibilityHint="Opens your profile edit screen"
            >
              <Ionicons name="pencil" size={MAIN_TAB_UI.iconSize.sm} color={colors.textOnBrandGradient} />
              <Text style={[act.label, { color: colors.textOnBrandGradient }]}>Edit Profile</Text>
            </Pressable>
            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                act.btn,
                { backgroundColor: hovered ? CultureTokens.teal + '20' : CultureTokens.teal + '12', borderWidth: 1, borderColor: hovered ? CultureTokens.teal + '55' : CultureTokens.teal + '38', transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setShowScanner(true); }}
              accessibilityRole="button"
              accessibilityLabel="Scan ID"
              accessibilityHint="Opens the scanner to connect with another member"
            >
              <Ionicons name="scan-outline" size={MAIN_TAB_UI.iconSize.sm} color={CultureTokens.teal} />
              <Text style={[act.label, { color: CultureTokens.teal }]}>Scan</Text>
            </Pressable>
            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                act.btn,
                { backgroundColor: hovered ? CultureTokens.gold + '1E' : CultureTokens.gold + '12', borderWidth: 1, borderColor: hovered ? CultureTokens.gold + '66' : CultureTokens.gold + '44', transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                router.push('/contacts');
              }}
              accessibilityRole="button"
              accessibilityLabel="Open contacts"
              accessibilityHint="Opens your contacts and CulturePass connections"
            >
              <Ionicons name="people-outline" size={MAIN_TAB_UI.iconSize.sm} color={CultureTokens.gold} />
              <Text style={[act.label, { color: CultureTokens.gold }]}>Contacts</Text>
            </Pressable>
            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                act.btn,
                { backgroundColor: hovered ? colors.surfaceElevated : colors.primarySoft, borderWidth: 1, borderColor: colors.borderLight, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share profile"
              accessibilityHint="Opens share options for your public profile"
            >
              <Ionicons name="share-outline" size={MAIN_TAB_UI.iconSize.sm} color={colors.textSecondary} />
              <Text style={[act.label, { color: colors.textSecondary }]}>Share</Text>
            </Pressable>
          </CardSurface>

          {/* ── MEMBERSHIP TIER ───────────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
            <CardSurface colors={colors}
              borderRadius={MAIN_TAB_UI.cardRadius}
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
                    accessibilityLabel="Upgrade membership"
                    accessibilityHint="Opens CulturePass Plus upgrade options"
                  >
                    <Text style={[tier.upgradeTxt, { color: colors.textOnBrandGradient }]}>Upgrade</Text>
                    <Ionicons name="arrow-forward" size={13} color={colors.textOnBrandGradient} />
                  </Pressable>
                ) : null}
              </LinearGradient>
            </CardSurface>
          </View>

          {/* ── BIO ───────────────────────────────────────────────────── */}
          {displayUser?.bio ? (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
              <SectionHeader title="About" colors={colors} />
              <CardSurface colors={colors} borderRadius={MAIN_TAB_UI.cardRadius} contentStyle={{ padding: 16 }}>
                <Text style={[sec.bioText, { color: colors.textSecondary }]}>{displayUser.bio}</Text>
              </CardSurface>
            </View>
          ) : null}

          {/* ── HERITAGE ──────────────────────────────────────────────── */}
          {(displayUser?.ethnicityText || languages.length > 0 || communities.length > 0 || hasCultures) ? (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
              <SectionHeader title="Roots & Culture" action="View Map" onAction={() => setShowCultureMap(true)} colors={colors} />
              <CardSurface colors={colors} borderRadius={MAIN_TAB_UI.cardRadius} contentStyle={{ padding: 0, overflow: 'hidden' }}>
                <View style={{ backgroundColor: `${CultureTokens.teal}15`, padding: 18, paddingBottom: 24 }}>
                  {displayUser?.ethnicityText ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={{ fontSize: 32 }}>{communityFlags[displayUser.ethnicityText as string] ?? '🌏'}</Text>
                      <Text style={{ fontSize: FontSize.title3, fontFamily: FontFamily.bold, lineHeight: LineHeight.title3, color: colors.text, letterSpacing: -0.3 }}>
                        {displayUser.ethnicityText as string}
                      </Text>
                    </View>
                  ) : hasCultures ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                       <Text style={{ fontSize: 32 }}>{matchedCultures[0].emoji}</Text>
                       <Text style={{ fontSize: FontSize.title3, fontFamily: FontFamily.bold, lineHeight: LineHeight.title3, color: colors.text, letterSpacing: -0.3 }}>
                         {matchedCultures[0].name}
                       </Text>
                    </View>
                  ) : null}
                </View>

                {(languages.length > 0 || communities.length > 0) && (
                  <View style={{ padding: 18 }}>
                    {languages.length > 0 && (
                      <View style={{ marginBottom: communities.length > 0 ? 16 : 0 }}>
                        <Text style={{ fontSize: FontSize.chip, lineHeight: LineHeight.chip, color: colors.textTertiary, fontFamily: FontFamily.semibold, textTransform: 'uppercase', marginBottom: 8 }}>Languages I Speak</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {languages.map(lang => (
                            <View key={lang} style={{ backgroundColor: `${colors.text}08`, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 16 }}>
                              <Text style={{ color: colors.text, fontSize: 14 }}>🗣 {lang}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {communities.length > 0 && (
                      <View>
                        <Text style={{ fontSize: FontSize.chip, lineHeight: LineHeight.chip, color: colors.textTertiary, fontFamily: FontFamily.semibold, textTransform: 'uppercase', marginBottom: 8 }}>My Communities</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {communities.slice(0, 10).map(c => {
                            const color = COMMUNITY_COLOR[c] ?? CultureTokens.indigo;
                            const flag  = communityFlags[c] ?? '🌐';
                            return (
                              <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${color}15`, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 14 }}>
                                <Text style={{ fontSize: 16 }}>{flag}</Text>
                                <Text style={{ color, fontSize: FontSize.chip, lineHeight: LineHeight.chip, fontFamily: FontFamily.medium }}>{c}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </CardSurface>
            </View>
          ) : null}

          {/* ── INTERESTS ── */}
          {interests.length > 0 ? (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
              <SectionHeader title="I'm Interested In" colors={colors} />
              <CardSurface
                colors={colors}
                borderRadius={MAIN_TAB_UI.cardRadius}
                style={{ borderColor: CultureTokens.coral + '28' }}
                contentStyle={{ backgroundColor: colors.primarySoft, padding: 16 }}
              >
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {interests.map((tag, i) => (
                    <View
                      key={tag + i}
                      style={[
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderLight,
                          borderWidth: StyleSheet.hairlineWidth * 2,
                          borderRadius: 100,
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                        },
                        MAIN_TAB_CARD_SHADOW,
                      ]}
                    >
                      <Text style={{ color: colors.text, fontSize: FontSize.chip, lineHeight: LineHeight.chip, fontFamily: FontFamily.medium }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </CardSurface>
            </View>
          ) : null}

          {/* ── PERKS ─────────────────────────────────────────────────── */}
          {(perksLoading || perks.length > 0) ? (
            <View style={[sec.wrap, { marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
              <View style={{ paddingHorizontal: hPad }}>
                <SectionHeader title="Your Perks" action="View All" onAction={() => router.push('/(tabs)/perks')} colors={colors} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[prk.scroll, { paddingHorizontal: hPad }]}>
                {perksLoading
                  ? [0, 1, 2].map((i) => (
                      <CardSurface colors={colors}
                        key={`perk-sk-${i}`}
                        borderRadius={MAIN_TAB_UI.cardRadius}
                        style={{ width: 160, minHeight: 130 }}
                        contentStyle={{ alignItems: 'center', justifyContent: 'center', padding: 14 }}
                      >
                        <ActivityIndicator color={CultureTokens.indigo} />
                      </CardSurface>
                    ))
                  : perks.slice(0, 6).map(perk => (
                      <Pressable
                        key={perk.id}
                        onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push({ pathname: '/perks/[id]', params: { id: perk.id } }); }}
                        accessibilityRole="button"
                        accessibilityLabel={perk.title}
                        accessibilityHint="Opens perk details"
                        style={({ pressed }) => [{ width: 160, opacity: pressed ? 0.9 : 1 }]}
                      >
                        <CardSurface colors={colors} borderRadius={MAIN_TAB_UI.cardRadius} contentStyle={{ padding: 14, overflow: 'hidden', minHeight: 128 }}>
                          <View style={[prk.icon, { backgroundColor: CultureTokens.gold + '20' }]}>
                            <Ionicons name="gift-outline" size={18} color={CultureTokens.gold} />
                          </View>
                          <Text style={[prk.title, { color: colors.text }]} numberOfLines={2}>{perk.title}</Text>
                          {'discount' in perk && (perk as unknown as { discount?: string }).discount ? (
                            <View style={[prk.badge, { backgroundColor: CultureTokens.coral + '18' }]}>
                              <Text style={[prk.badgeText, { color: CultureTokens.coral }]}>{(perk as unknown as { discount: string }).discount}</Text>
                            </View>
                          ) : null}
                        </CardSurface>
                      </Pressable>
                    ))}
              </ScrollView>
            </View>
          ) : null}

          {/* ── CONTRIBUTION HISTORY + PERSONALIZED STATS ────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
            <SectionHeader title="Contribution History" colors={colors} />
            <CardSurface colors={colors} borderRadius={MAIN_TAB_UI.cardRadius} contentStyle={{ padding: 14, gap: 10 }}>
              {contributionHistory.length > 0 ? (
                contributionHistory.map((entry) => (
                  <View key={entry} style={profileStats.row}>
                    <View style={[profileStats.dot, { backgroundColor: CultureTokens.indigo }]} />
                    <Text style={[profileStats.rowText, { color: colors.textSecondary }]}>{entry}</Text>
                  </View>
                ))
              ) : (
                <Text style={[profileStats.rowText, { color: colors.textSecondary }]}>
                  Activity appears here as you attend events and engage with the community.
                </Text>
              )}
            </CardSurface>
          </View>

          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGap }]}>
            <SectionHeader title="Personalized Stats" colors={colors} />
            <View style={profileStats.grid}>
              {contributionStats.map((item) => (
                <CardSurface colors={colors} key={item.id} borderRadius={MAIN_TAB_UI.cardRadius} style={profileStats.cell} contentStyle={{ padding: 12 }}>
                  <View style={[profileStats.iconWrap, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color={item.color} />
                  </View>
                  <Text style={[profileStats.value, { color: colors.text }]}>{fmt(item.value)}</Text>
                  <Text style={[profileStats.label, { color: colors.textSecondary }]}>{item.label}</Text>
                </CardSurface>
              ))}
            </View>
          </View>

          {/* ── DIGITAL IDENTITY CARD ─────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
            <SectionHeader title="Digital Identity" colors={colors} />
            <View style={[cpid.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={cpid.topRow}>
                <View style={cpid.brandRow}>
                  <View style={[cpid.brandIcon, { backgroundColor: CultureTokens.indigo + '20' }]}>
                    <Ionicons name="shield-checkmark" size={13} color={CultureTokens.indigo} />
                  </View>
                  <View style={{ gap: 1 }}>
                    <Text style={[cpid.brandTitle, { color: colors.text }]}>Digital Identity</Text>
                    <Text style={[cpid.brandSub, { color: colors.textTertiary }]}>Verified CulturePass</Text>
                  </View>
                </View>
                <View style={[cpid.tierPill, { borderColor: tierConf.color + '44', backgroundColor: tierConf.color + '12' }]}>
                  <Ionicons name={tierConf.icon} size={11} color={tierConf.color} />
                  <Text style={[cpid.tierText, { color: tierConf.color }]}>{tierConf.label}</Text>
                </View>
              </View>

              <View style={cpid.middleRow}>
                <View style={cpid.metaCol}>
                  <Text style={[cpid.idLabel, { color: colors.textTertiary }]}>CULTUREPASS ID</Text>
                  <Text style={[cpid.idValue, { color: colors.text }]} numberOfLines={1}>{cpidStr}</Text>
                  <Text style={[cpid.memberText, { color: colors.textSecondary }]}>Member since {since || 'N/A'}</Text>
                </View>
                <View style={[cpid.qrWrap, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                  <QRCode
                    value={`culturepass://profile/${displayUser?.id || userId}`}
                    size={58}
                    backgroundColor="transparent"
                    color={CultureTokens.indigo}
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  cpid.openBtn,
                  {
                    backgroundColor: pressed ? CultureTokens.indigo + 'DD' : CultureTokens.indigo,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  router.push('/profile/qr');
                }}
                accessibilityRole="button"
                accessibilityLabel="Open digital identity"
                accessibilityHint="Opens your full digital identity pass"
              >
                <Text style={[cpid.openBtnText, { color: colors.textOnBrandGradient }]}>Open Full Digital ID</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textOnBrandGradient} />
              </Pressable>
            </View>
          </View>

          {/* ── SOCIAL LINKS ─────────────────────────────────────────── */}
          {activeSocials.length > 0 && (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
              <SectionHeader title="Social" colors={colors} />
              <CardSurface colors={colors} borderRadius={MAIN_TAB_UI.cardRadius} contentStyle={{ padding: 12 }}>
              <View style={{ gap: 12 }}>
                {activeSocials.map(s => (
                  <Pressable
                    key={s.key}
                    style={({ pressed }) => [
                      { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 100, borderWidth: 1, padding: 14, backgroundColor: pressed ? s.color + '22' : s.color + '12', borderColor: s.color + '35' }
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const url = socialLinks[s.key];
                      if (url) Linking.openURL(url);
                    }}
                    accessibilityRole="link"
                    accessibilityLabel={s.label}
                    accessibilityHint="Opens external social profile"
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: s.color + '20' }}>
                      <Ionicons name={s.icon} size={18} color={s.color} />
                    </View>
                    <Text style={{ flex: 1, fontSize: FontSize.callout, lineHeight: LineHeight.callout, fontFamily: FontFamily.semibold, textAlign: 'center', color: colors.text }}>{s.label}</Text>
                    <Ionicons name="arrow-forward-circle-outline" size={18} color={s.color} />
                  </Pressable>
                ))}
              </View>
              </CardSurface>
            </View>
          )}

          {/* ── CONTACT DETAILS ──────────────────────────────────────── */}
          {(locationText || displayUser?.website || displayUser?.phone) ? (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
              <SectionHeader title="Details" colors={colors} />
              <CardSurface colors={colors} borderRadius={MAIN_TAB_UI.cardRadius} contentStyle={{ padding: 4 }}>
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
                    <Pressable
                      style={det.row}
                      onPress={() => Linking.openURL(displayUser.website!)}
                      accessibilityRole="link"
                      accessibilityLabel="Website"
                      accessibilityHint="Opens website in browser"
                    >
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
              </CardSurface>
            </View>
          ) : null}

          {/* ── SETTINGS SHORTCUTS ───────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGapLarge }]}>
            <SectionHeader title="Settings" colors={colors} />
            <CardSurface colors={colors} borderRadius={MAIN_TAB_UI.cardRadius} contentStyle={{ padding: 4 }}>
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
                    accessibilityHint={`Opens ${item.label}`}
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
            </CardSurface>
          </View>

          {/* ── SIGN OUT ─────────────────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: MAIN_TAB_UI.sectionGap }]}>
            <CardSurface colors={colors} borderRadius={MAIN_TAB_UI.cardRadius} bordered={false} contentStyle={{ padding: 0 }}>
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
              accessibilityHint="Signs out of your account"
            >
              <Ionicons name="log-out-outline" size={18} color={CultureTokens.coral} />
              <Text style={[sout.label, { color: CultureTokens.coral }]}>Sign Out</Text>
            </Pressable>
            </CardSurface>
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
    ...TextStyles.chip,
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
    fontSize: FontSize.micro,
    fontFamily: FontFamily.medium,
    lineHeight: LineHeight.micro,
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
    borderRadius: 1,
    opacity: 0.9,
  },
});

const profileStats = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rowText: {
    ...TextStyles.caption,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '48%',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    ...TextStyles.headline,
  },
  label: {
    ...TextStyles.caption,
  },
});

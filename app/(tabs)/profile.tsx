// app/(tabs)/profile.tsx — rebuilt
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Share, Linking, Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useCurrentUser } from '@/hooks/useProfile';
import { usePerks } from '@/hooks/queries/usePerks';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { NATIONALITIES } from '@/constants/cultures';
import { CultureTokens, CardTokens, gradients, shadows } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GuestProfileView } from '@/components/profile/GuestProfileView';
import type { User } from '@shared/schema';
import type { PerkData } from '@/shared/schema/perk';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}
function initials(name: string): string {
  return (name || 'U').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function memberDate(d?: string | Date | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

const TIER_CFG: Record<string, { color: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  free:    { color: '#94A3B8',           label: 'Standard', icon: 'shield-outline' },
  plus:    { color: CultureTokens.teal,  label: 'Plus',     icon: 'star'           },
  pro:     { color: '#7C3AED',           label: 'Pro',      icon: 'flash'          },
  premium: { color: CultureTokens.coral, label: 'Premium',  icon: 'diamond'        },
  vip:     { color: CultureTokens.gold,  label: 'VIP',      icon: 'trophy'         },
};

const NAT_COORDS: Record<string, { lat: number; lng: number }> = {
  indian: { lat: 20.5937, lng: 78.9629 }, chinese: { lat: 35.8617, lng: 104.1954 },
  korean: { lat: 35.9078, lng: 127.7669 }, japanese: { lat: 36.2048, lng: 138.2529 },
  vietnamese: { lat: 14.0583, lng: 108.2772 }, filipino: { lat: 12.8797, lng: 121.7740 },
  greek: { lat: 39.0742, lng: 21.8243 }, italian: { lat: 41.8719, lng: 12.5674 },
  lebanese: { lat: 33.8547, lng: 35.8623 }, egyptian: { lat: 26.8206, lng: 30.8025 },
  nigerian: { lat: 9.0820, lng: 8.6753 }, mexican: { lat: 23.6345, lng: -102.5528 },
  brazilian: { lat: -14.2350, lng: -51.9253 }, kiwi: { lat: -40.9006, lng: 174.8860 },
  aboriginal: { lat: -25.2744, lng: 133.7751 }, maori: { lat: -40.9006, lng: 174.8860 },
  indonesian: { lat: -0.7893, lng: 113.9213 }, thai: { lat: 15.8700, lng: 100.9925 },
  malay: { lat: 4.2105, lng: 101.9758 }, spanish: { lat: 40.4637, lng: -3.7492 },
  somali: { lat: 5.1521, lng: 46.1996 }, ethiopian: { lat: 9.1450, lng: 40.4897 },
  colombian: { lat: 4.5709, lng: -74.2973 }, ghanaian: { lat: 7.9465, lng: -1.0232 },
};

const SOCIAL_DEFS = [
  { key: 'instagram', icon: 'logo-instagram' as const, label: 'Instagram', color: '#E1306C' },
  { key: 'twitter',   icon: 'logo-twitter'   as const, label: 'Twitter',   color: '#1DA1F2' },
  { key: 'linkedin',  icon: 'logo-linkedin'  as const, label: 'LinkedIn',  color: '#0A66C2' },
  { key: 'facebook',  icon: 'logo-facebook'  as const, label: 'Facebook',  color: '#1877F2' },
];

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, action, onAction, colors }: {
  title: string; action?: string; onAction?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={sh.row}>
      <View style={[sh.accent, { backgroundColor: CultureTokens.indigo }]} />
      <Text style={[sh.title, { color: colors.text }]}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={[sh.action, { color: CultureTokens.indigo }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  accent: { width: 4, height: 22, borderRadius: 2 },
  title:  { fontSize: 18, fontFamily: 'Poppins_700Bold', letterSpacing: -0.3, flex: 1, lineHeight: 26 },
  action: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
});

// ── Avatar ────────────────────────────────────────────────────────────────────

function ProfileAvatar({ user, displayName, size = 100 }: { user: Partial<User>; displayName: string; size?: number }) {
  const hasPhoto = !!user.avatarUrl;
  return (
    <View style={{ position: 'relative', marginBottom: 14 }}>
      <LinearGradient
        colors={[CultureTokens.teal, CultureTokens.indigo, CultureTokens.coral]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, padding: 3, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#1C1C2E' }}>
          {hasPhoto
            ? <Image source={{ uri: user.avatarUrl! }} style={{ width: size, height: size }} contentFit="cover" />
            : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: size * 0.35, fontFamily: 'Poppins_700Bold', color: CultureTokens.teal, letterSpacing: 1 }}>
                  {initials(displayName)}
                </Text>
              </View>}
        </View>
      </LinearGradient>
      {user.isVerified && (
        <View style={av.verifiedDot}>
          <Ionicons name="checkmark" size={10} color="#fff" />
        </View>
      )}
    </View>
  );
}
const av = StyleSheet.create({
  verifiedDot: {
    position: 'absolute', bottom: 14, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: CultureTokens.teal,
    borderWidth: 3, borderColor: '#0B0B14',
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[sk.hero, { backgroundColor: '#0B0B14' }]}>
        <View style={[sk.avatarRing, { backgroundColor: colors.border + '40' }]} />
        <View style={[sk.nameLine, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
        <View style={[sk.handleLine, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
      </View>
      <View style={{ padding: 20, gap: 14 }}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[sk.block, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} />
        ))}
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  hero:       { alignItems: 'center', paddingTop: 80, paddingBottom: 32, gap: 12 },
  avatarRing: { width: 108, height: 108, borderRadius: 54 },
  nameLine:   { width: 160, height: 18, borderRadius: 9, marginTop: 4 },
  handleLine: { width: 100, height: 12, borderRadius: 6 },
  block:      { height: 90, borderRadius: 16, borderWidth: 1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets   = useSafeAreaInsets();
  const colors   = useColors();
  const { isDesktop, hPad } = useLayout();
  const { userId, user: authUser, logout } = useAuth();
  const { state: onboarding } = useOnboarding();
  const [showCultureMap, setShowCultureMap] = useState(false);

  const { user, isLoading } = useCurrentUser();
  const { data: perks = [] } = usePerks();

  // Matched culture markers
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
        return { id: `${id}-${idx}`, name: nat.label, emoji: nat.emoji, lat: coords.lat, lng: coords.lng, color: CultureTokens.saffron };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [onboarding?.nationalityId, onboarding?.cultureIds]);


  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const name = displayUser?.displayName || displayUser?.username || 'a CulturePass member';
    try {
      await Share.share({ message: `Check out ${name}'s profile on CulturePass!` });
    } catch { /* user cancelled */ }
  }, [displayUser?.displayName, displayUser?.username]);

  if (!userId) return <GuestProfileView topInset={insets.top} />;
  if (isLoading) return <ProfileSkeleton colors={colors} />;

  const displayUser = (user || authUser) as Partial<User>;
  const displayName = displayUser?.displayName || displayUser?.username || 'CulturePass Member';
  const handle      = displayUser?.handle ?? displayUser?.username;
  const locationText = [displayUser?.city, displayUser?.country].filter(Boolean).join(', ');
  const tierKey     = displayUser?.membership?.tier ?? 'free';
  const tierConf    = TIER_CFG[tierKey] ?? TIER_CFG.free;
  const cpidStr     = displayUser?.culturePassId ?? `CP-${(userId || '').slice(-6).toUpperCase()}`;
  const isFree      = !tierKey || tierKey === 'free';
  const since       = memberDate(displayUser?.createdAt);
  const hasCultures = matchedCultures.length > 0;

  const activeSocials = SOCIAL_DEFS.filter(s => {
    const links = (displayUser as any)?.socialLinks;
    return links && links[s.key];
  });
  const socialLinks = (displayUser as any)?.socialLinks ?? {};

  const topInset    = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;

  return (
    <ErrorBoundary>
      <View style={[root.wrap, { backgroundColor: colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        >
          {/* ── HERO ──────────────────────────────────────────────────── */}
          <View style={[hero.container, { paddingTop: topInset + 12 }]}>
            <LinearGradient
              colors={['#0B0B14', CultureTokens.indigo + '50', '#1B0F2E']}
              start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Decorative circles */}
            <View style={[hero.arcOuter]} pointerEvents="none" />
            <View style={[hero.arcInner]} pointerEvents="none" />

            {/* Nav bar */}
            <View style={[hero.nav, { paddingHorizontal: hPad }]}>
              {!isDesktop && (
                <Pressable
                  style={hero.navBtn}
                  onPress={() => router.push('/settings' as any)}
                  accessibilityRole="button"
                  accessibilityLabel="Settings"
                >
                  <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.9)" />
                </Pressable>
              )}
              <View style={{ flex: 1 }} />
              <Pressable
                style={hero.navBtn}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share profile"
              >
                <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.9)" />
              </Pressable>
            </View>

            {/* Avatar */}
            <ProfileAvatar user={displayUser} displayName={displayName} size={96} />

            {/* Name + handle */}
            <Text style={hero.name}>{displayName}</Text>
            {handle && (
              <Text style={hero.handle}>@{handle}</Text>
            )}

            {/* Culture identity pills */}
            {hasCultures && (
              <Pressable
                style={hero.culturePills}
                onPress={() => setShowCultureMap(true)}
                accessibilityRole="button"
                accessibilityLabel="View cultural heritage"
              >
                {matchedCultures.slice(0, 4).map(c => (
                  <View key={c.id} style={hero.culturePill}>
                    <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                    <Text style={hero.culturePillText}>{c.name}</Text>
                  </View>
                ))}
                {matchedCultures.length > 4 && (
                  <View style={hero.culturePill}>
                    <Text style={hero.culturePillText}>+{matchedCultures.length - 4}</Text>
                  </View>
                )}
              </Pressable>
            )}

            {/* Stats bar */}
            <View style={hero.statsBar}>
              <LinearGradient
                colors={['transparent', CultureTokens.teal, CultureTokens.indigo, CultureTokens.teal, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={hero.statsAccentLine}
              />
              {[
                { label: 'Followers', value: displayUser?.followersCount ?? 0 },
                { label: 'Following', value: displayUser?.followingCount  ?? 0 },
                { label: 'Likes',     value: displayUser?.likesCount      ?? 0 },
              ].map((stat, i, arr) => (
                <React.Fragment key={stat.label}>
                  <Pressable
                    style={hero.statItem}
                    onPress={() => router.push(`/profile/edit` as any)}
                    accessibilityRole="button"
                  >
                    <Text style={hero.statNum}>{fmt(stat.value)}</Text>
                    <Text style={hero.statLabel}>{stat.label}</Text>
                  </Pressable>
                  {i < arr.length - 1 && <View style={hero.statDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── ACTION BUTTONS ────────────────────────────────────────── */}
          <View style={[act.row, { paddingHorizontal: hPad, marginTop: 16 }]}>
            <Pressable
              style={[act.btn, { backgroundColor: CultureTokens.indigo }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                router.push('/profile/edit' as any);
              }}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Ionicons name="pencil" size={15} color="#fff" />
              <Text style={[act.label, { color: '#fff' }]}>Edit Profile</Text>
            </Pressable>
            <Pressable
              style={[act.btn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }]}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share profile"
            >
              <Ionicons name="share-outline" size={15} color={colors.text} />
              <Text style={[act.label, { color: colors.text }]}>Share</Text>
            </Pressable>
            <Pressable
              style={[act.btn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                router.push('/profile/qr' as any);
              }}
              accessibilityRole="button"
              accessibilityLabel="Show QR code"
            >
              <Ionicons name="qr-code-outline" size={15} color={colors.text} />
              <Text style={[act.label, { color: colors.text }]}>QR Code</Text>
            </Pressable>
          </View>

          {/* ── MEMBERSHIP TIER ───────────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
            <LinearGradient
              colors={[tierConf.color + '20', tierConf.color + '08', colors.surface]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[tier.card, { borderColor: tierConf.color + '35', backgroundColor: colors.surface }]}
            >
              <View style={tier.left}>
                <View style={[tier.iconWrap, { backgroundColor: tierConf.color + '20' }]}>
                  <Ionicons name={tierConf.icon} size={20} color={tierConf.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[tier.label, { color: tierConf.color }]}>{tierConf.label} Member</Text>
                  {since ? (
                    <Text style={[tier.since, { color: colors.textTertiary }]}>Member since {since}</Text>
                  ) : null}
                </View>
              </View>
              {isFree && (
                <Pressable
                  style={[tier.upgradeBtn, { backgroundColor: CultureTokens.indigo }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    router.push('/membership/upgrade' as any);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={tier.upgradeTxt}>Upgrade</Text>
                  <Ionicons name="arrow-forward" size={13} color="#fff" />
                </Pressable>
              )}
            </LinearGradient>
          </View>

          {/* ── BIO ───────────────────────────────────────────────────── */}
          {displayUser?.bio ? (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
              <SectionHeader title="About" colors={colors} />
              <View style={[sec.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Text style={[sec.bioText, { color: colors.textSecondary }]}>{displayUser.bio}</Text>
              </View>
            </View>
          ) : null}

          {/* ── HERITAGE ──────────────────────────────────────────────── */}
          {hasCultures && (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
              <SectionHeader
                title="Heritage"
                action="View Map"
                onAction={() => setShowCultureMap(true)}
                colors={colors}
              />
              <View style={cul.grid}>
                {matchedCultures.map((c, i) => (
                  <Animated.View
                    key={c.id}
                    entering={Platform.OS !== 'web' ? FadeInDown.delay(i * 80).springify() : undefined}
                    style={[cul.chip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  >
                    <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
                    <Text style={[cul.chipLabel, { color: colors.text }]}>{c.name}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {/* ── PERKS ─────────────────────────────────────────────────── */}
          {perks.length > 0 && (
            <View style={[sec.wrap, { marginTop: 24 }]}>
              <View style={{ paddingHorizontal: hPad }}>
                <SectionHeader
                  title="Your Perks"
                  action="View All"
                  onAction={() => router.push('/(tabs)/perks' as any)}
                  colors={colors}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[prk.scroll, { paddingHorizontal: hPad }]}
              >
                {perks.slice(0, 6).map(perk => (
                  <Pressable
                    key={perk.id}
                    style={[prk.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      router.push({ pathname: '/perks/[id]', params: { id: perk.id } } as never);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={perk.title}
                  >
                    <LinearGradient
                      colors={[CultureTokens.saffron + '30', CultureTokens.indigo + '20']}
                      style={prk.cardGrad}
                    />
                    <View style={[prk.icon, { backgroundColor: CultureTokens.saffron + '20' }]}>
                      <Ionicons name="gift-outline" size={18} color={CultureTokens.saffron} />
                    </View>
                    <Text style={[prk.title, { color: colors.text }]} numberOfLines={2}>{perk.title}</Text>
                    {(perk as any).discount && (
                      <View style={[prk.badge, { backgroundColor: CultureTokens.coral + '18' }]}>
                        <Text style={[prk.badgeText, { color: CultureTokens.coral }]}>{(perk as any).discount}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── DIGITAL IDENTITY CARD ─────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
            <SectionHeader title="Digital Identity" colors={colors} />
            <LinearGradient
              colors={['#0B0B14', '#1a0533', '#0B0B14']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={cpid.card}
            >
              {/* Top accent line */}
              <LinearGradient
                colors={['transparent', CultureTokens.teal, CultureTokens.indigo, CultureTokens.teal, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={cpid.accentLine}
              />
              {/* Logo row */}
              <View style={cpid.topRow}>
                <View style={cpid.logoRow}>
                  <LinearGradient colors={[CultureTokens.teal, CultureTokens.indigo]} style={cpid.logoIcon}>
                    <Ionicons name="globe" size={13} color="#fff" />
                  </LinearGradient>
                  <Text style={cpid.logoText}>CulturePass</Text>
                </View>
                <View style={[cpid.shieldBadge, { borderColor: CultureTokens.teal + '40' }]}>
                  <Ionicons name="shield-checkmark" size={15} color={CultureTokens.teal} />
                </View>
              </View>
              {/* CPID */}
              <View style={cpid.centerBlock}>
                <Text style={cpid.cpidLabel}>CULTUREPASS ID</Text>
                <Text style={cpid.cpidValue}>{cpidStr}</Text>
                <LinearGradient
                  colors={['transparent', CultureTokens.teal, 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={cpid.underline}
                />
              </View>
              {/* Meta row */}
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
              {/* Footer */}
              <View style={[cpid.footer, { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={cpid.footerText}>Verified Digital Identity</Text>
                <Ionicons name="finger-print" size={20} color={CultureTokens.teal + '55'} />
              </View>
            </LinearGradient>
          </View>

          {/* ── SOCIAL LINKS ─────────────────────────────────────────── */}
          {activeSocials.length > 0 && (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
              <SectionHeader title="Social" colors={colors} />
              <View style={soc.grid}>
                {activeSocials.map(s => (
                  <Pressable
                    key={s.key}
                    style={[soc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
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
            </View>
          )}

          {/* ── CONTACT DETAILS ──────────────────────────────────────── */}
          {(locationText || displayUser?.website || displayUser?.phone) ? (
            <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
              <SectionHeader title="Details" colors={colors} />
              <View style={[det.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
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
            </View>
          ) : null}

          {/* ── SETTINGS SHORTCUTS ───────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
            <SectionHeader title="Settings" colors={colors} />
            <View style={[set.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {[
                { icon: 'person-outline' as const,        label: 'Edit Profile',    path: '/profile/edit'             },
                { icon: 'notifications-outline' as const, label: 'Notifications',   path: '/settings/notifications'   },
                { icon: 'lock-closed-outline' as const,   label: 'Privacy',         path: '/settings/privacy'         },
                { icon: 'help-circle-outline' as const,   label: 'Help & Support',  path: '/help'                     },
              ].map((item, i, arr) => (
                <React.Fragment key={item.path}>
                  <Pressable
                    style={set.row}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      router.push(item.path as any);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <View style={[set.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
                      <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
                    </View>
                    <Text style={[set.label, { color: colors.text }]}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Pressable>
                  {i < arr.length - 1 && <View style={[set.divider, { backgroundColor: colors.borderLight }]} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── SIGN OUT ─────────────────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 16 }]}>
            <Pressable
              style={[sout.btn, { borderColor: CultureTokens.coral + '50' }]}
              onPress={async () => {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                try {
                  await logout();
                } catch (e) {
                  // Minimal feedback and logging
                  if (__DEV__) console.error(e);
                  if (Platform.OS === 'web') {
                    alert('Logout failed. Please try again.');
                  } else {
                    // Use Alert from react-native
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { Alert } = require('react-native');
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
          </View>
        </ScrollView>

        {/* ── CULTURE MAP MODAL ─────────────────────────────────────── */}
        {hasCultures && (
          <CultureMapModal
            visible={showCultureMap}
            onClose={() => setShowCultureMap(false)}
            cultures={matchedCultures}
            colors={colors}
            insets={insets}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}


import { CultureWalletMap } from '../../components/profile/CultureWalletMap';
// ── Culture Map Modal ─────────────────────────────────────────────────────────

function CultureMapModal({ visible, onClose, cultures, colors, insets }: {
  visible: boolean; onClose: () => void;
  cultures: { id: string; name: string; emoji: string; lat: number; lng: number; color: string }[];
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[cmap.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={Platform.OS !== 'web' ? FadeIn.duration(300) : undefined}
          style={[cmap.sheet, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}
        >
          <View style={cmap.header}>
            <View>
              <Text style={[cmap.title, { color: colors.text }]}>Cultural Heritage</Text>
              <Text style={[cmap.sub, { color: colors.textSecondary }]}>
                {cultures.length === 1
                  ? `Rooted in ${cultures[0].name} heritage.`
                  : `Your CulturePass spans ${cultures.length} traditions`}
              </Text>
            </View>
            <Pressable
              style={[cmap.closeBtn, { backgroundColor: colors.surfaceElevated }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Culture chips */}
          <View style={cmap.chipsRow}>
            {cultures.map(c => (
              <View key={c.id} style={[cmap.chip, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                <Text style={[cmap.chipLabel, { color: colors.text }]}>{c.name}</Text>
              </View>
            ))}
          </View>

          {/* Map */}
          <View style={cmap.mapWrap}>
            <CultureWalletMap cultures={cultures} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const root = StyleSheet.create({ wrap: { flex: 1 } });

const hero = StyleSheet.create({
  container:     { alignItems: 'center', paddingBottom: 28, overflow: 'hidden' },
  arcOuter: {
    position: 'absolute', top: -80, right: -80,
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 28, borderColor: CultureTokens.teal + '10',
    pointerEvents: 'none',
  } as any,
  arcInner: {
    position: 'absolute', top: -40, right: -40,
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 18, borderColor: CultureTokens.indigo + '12',
    pointerEvents: 'none',
  } as any,
  nav:       { flexDirection: 'row', alignItems: 'center', width: '100%', paddingBottom: 20 },
  navBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  name:      { fontSize: 26, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -0.4, textAlign: 'center' },
  handle:    { fontSize: 14, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.55)', marginTop: 2, marginBottom: 14 },
  culturePills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 20, paddingHorizontal: 20 },
  culturePill:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  culturePillText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.85)', lineHeight: 15 },
  statsBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', width: '88%' },
  statsAccentLine: { position: 'absolute', top: 0, left: 24, right: 24, height: 1.5, opacity: 0.5 },
  statItem:  { flex: 1, alignItems: 'center' },
  statNum:   { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#fff', letterSpacing: -0.5 },
  statLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
});

const act = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 10 },
  btn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
  label: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
});

const tier = StyleSheet.create({
  card:       { borderRadius: CardTokens.radius, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  left:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label:      { fontSize: 14, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  since:      { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1, lineHeight: 15 },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  upgradeTxt: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 17 },
});

const sec = StyleSheet.create({
  wrap:    {},
  card:    { borderRadius: CardTokens.radius, borderWidth: 1, padding: 18 },
  bioText: { fontSize: 15, fontFamily: 'Poppins_400Regular', lineHeight: 26 },
});

const cul = StyleSheet.create({
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip:      { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, gap: 6, minWidth: 88 },
  chipLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', lineHeight: 16 },
});

const prk = StyleSheet.create({
  scroll:   { gap: 12, paddingRight: 20 },
  card:     { width: 160, padding: 16, borderRadius: CardTokens.radius, borderWidth: 1, overflow: 'hidden', gap: 10 },
  cardGrad: { ...StyleSheet.absoluteFillObject },
  icon:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 13, fontFamily: 'Poppins_700Bold', lineHeight: 19 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText:{ fontSize: 11, fontFamily: 'Poppins_700Bold', lineHeight: 15 },
});

const cpid = StyleSheet.create({
  card:        { borderRadius: 24, padding: 24, overflow: 'hidden' },
  accentLine:  { position: 'absolute', top: 0, left: 0, right: 0, height: 2.5 },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:    { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText:    { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#fff', letterSpacing: 0.4 },
  shieldBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  centerBlock: { alignItems: 'center', marginBottom: 26 },
  cpidLabel:   { fontFamily: 'Poppins_500Medium', fontSize: 9, color: '#94A3B8', letterSpacing: 4, marginBottom: 8 },
  cpidValue:   { fontFamily: 'Poppins_700Bold', fontSize: 30, color: '#fff', letterSpacing: 5 },
  underline:   { width: 160, height: 1.5, marginTop: 10, opacity: 0.65 },
  metaRow:     { flexDirection: 'row', marginBottom: 20, gap: 8 },
  metaItem:    { flex: 1 },
  metaLabel:   { fontFamily: 'Poppins_400Regular', fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  metaValue:   { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#fff' },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 14 },
  footerText:  { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#94A3B8', letterSpacing: 0.3 },
});

const soc = StyleSheet.create({
  grid:    { gap: 10 },
  card:    { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 16, overflow: 'hidden', borderWidth: 1 },
  strip:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3.5, borderRadius: 2 },
  iconWrap:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label:   { flex: 1, fontFamily: 'Poppins_600SemiBold', fontSize: 15, lineHeight: 20 },
});

const det = StyleSheet.create({
  card:    { borderRadius: CardTokens.radius, borderWidth: 1, padding: 18 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text:    { flex: 1 },
  label:   { fontFamily: 'Poppins_400Regular', fontSize: 11, letterSpacing: 0.3, marginBottom: 2, lineHeight: 15 },
  value:   { fontFamily: 'Poppins_600SemiBold', fontSize: 14, lineHeight: 20 },
  divider: { height: 1, marginVertical: 14, marginLeft: 58 },
});

const set = StyleSheet.create({
  card:    { borderRadius: CardTokens.radius, borderWidth: 1, overflow: 'hidden' },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:   { flex: 1, fontSize: 15, fontFamily: 'Poppins_500Medium', lineHeight: 20 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
});

const sout = StyleSheet.create({
  btn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  label: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
});

const cmap = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  sheet:    { borderTopLeftRadius: 32, borderTopRightRadius: 32, flex: 1, maxHeight: '92%' },
  header:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 20 },
  title:    { fontSize: 22, fontFamily: 'Poppins_700Bold', lineHeight: 30 },
  sub:      { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 18 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 24, marginBottom: 20 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipLabel:{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', lineHeight: 18 },
  mapWrap:  { flex: 1, marginHorizontal: 24, marginBottom: 32, borderRadius: 24, overflow: 'hidden' },
});

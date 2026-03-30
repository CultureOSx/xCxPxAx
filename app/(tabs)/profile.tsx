// app/(tabs)/profile.tsx — rebuilt
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Share, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useCurrentUser } from '@/hooks/useProfile';
import { usePerks } from '@/hooks/queries/usePerks';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { NATIONALITIES } from '@/constants/cultures';
import { CultureTokens } from '@/constants/theme';
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

  const { user, isLoading } = useCurrentUser();
  const { data: perks = [] } = usePerks();

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

  const displayUser = (user || authUser) as Partial<User>;
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
  if (isLoading) return <ProfileSkeleton colors={colors} />;

  const displayName  = displayUser?.displayName || displayUser?.username || 'CulturePass Member';
  const handle       = displayUser?.handle ?? displayUser?.username;
  const locationText = [displayUser?.city, displayUser?.country].filter(Boolean).join(', ');
  const tierKey      = displayUser?.membership?.tier ?? 'free';
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
            queryClient.invalidateQueries({ queryKey: ['/api/profiles/me'] });
          }}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        >
          {/* ── HERO ──────────────────────────────────────────────────── */}
          <View style={[hero.container, { paddingTop: topInset + 12 }]}>
            <LinearGradient
              colors={[colors.background, CultureTokens.indigo + '40', '#1B0F2E']}
              start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[hero.arcOuter]} pointerEvents="none" />
            <View style={[hero.arcInner]} pointerEvents="none" />

            <View style={[hero.nav, { paddingHorizontal: hPad }]}>
              {!isDesktop && (
                <Pressable
                  style={({ pressed }) => [hero.navBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                  onPress={() => router.push('/settings')}
                  accessibilityRole="button"
                  accessibilityLabel="Settings"
                >
                  <BlurView intensity={Platform.OS === 'ios' ? 24 : 50} tint="dark" style={StyleSheet.absoluteFill} />
                  <Ionicons name="settings-outline" size={20} color="#fff" />
                </Pressable>
              )}
              <View style={{ flex: 1 }} />
              <Pressable
                style={({ pressed }) => [hero.navBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share profile"
              >
                <BlurView intensity={Platform.OS === 'ios' ? 24 : 50} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="share-outline" size={20} color="#fff" />
              </Pressable>
            </View>

            <ProfileAvatar user={displayUser} displayName={displayName} size={96} />

            <Text style={hero.name}>{displayName}</Text>
            {handle && <Text style={hero.handle}>@{handle}</Text>}

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
                  <Pressable style={hero.statItem} onPress={() => router.push('/profile/edit')} accessibilityRole="button">
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
              onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push('/profile/edit'); }}
              accessibilityRole="button" accessibilityLabel="Edit profile"
            >
              <Ionicons name="pencil" size={15} color="#fff" />
              <Text style={[act.label, { color: '#fff' }]}>Edit Profile</Text>
            </Pressable>
            <Pressable
              style={[act.btn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }]}
              onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setShowScanner(true); }}
              accessibilityRole="button" accessibilityLabel="Scan ID"
            >
              <Ionicons name="scan-outline" size={15} color={colors.text} />
              <Text style={[act.label, { color: colors.text }]}>Scan</Text>
            </Pressable>
            <Pressable
              style={[act.btn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }]}
              onPress={handleShare}
              accessibilityRole="button" accessibilityLabel="Share profile"
            >
              <Ionicons name="share-outline" size={15} color={colors.text} />
              <Text style={[act.label, { color: colors.text }]}>Share</Text>
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
                  {since ? <Text style={[tier.since, { color: colors.textTertiary }]}>Member since {since}</Text> : null}
                </View>
              </View>
              {isFree && (
                <Pressable
                  style={[tier.upgradeBtn, { backgroundColor: CultureTokens.indigo }]}
                  onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push('/membership/upgrade'); }}
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
              <SectionHeader title="Heritage" action="View Map" onAction={() => setShowCultureMap(true)} colors={colors} />
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
                <SectionHeader title="Your Perks" action="View All" onAction={() => router.push('/(tabs)/perks')} colors={colors} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[prk.scroll, { paddingHorizontal: hPad }]}>
                {perks.slice(0, 6).map(perk => (
                  <Pressable
                    key={perk.id}
                    style={[prk.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                    onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push({ pathname: '/perks/[id]', params: { id: perk.id } }); }}
                    accessibilityRole="button"
                    accessibilityLabel={perk.title}
                  >
                    <LinearGradient colors={[CultureTokens.gold + '30', CultureTokens.indigo + '20']} style={prk.cardGrad} />
                    <View style={[prk.icon, { backgroundColor: CultureTokens.gold + '20' }]}>
                      <Ionicons name="gift-outline" size={18} color={CultureTokens.gold} />
                    </View>
                    <Text style={[prk.title, { color: colors.text }]} numberOfLines={2}>{perk.title}</Text>
                    {'discount' in perk && (perk as unknown as { discount?: string }).discount && (
                      <View style={[prk.badge, { backgroundColor: CultureTokens.coral + '18' }]}>
                        <Text style={[prk.badgeText, { color: CultureTokens.coral }]}>{(perk as unknown as { discount: string }).discount}</Text>
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
              <LinearGradient
                colors={['transparent', CultureTokens.teal, CultureTokens.indigo, CultureTokens.teal, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={cpid.accentLine}
              />
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
            </View>
          ) : null}

          {/* ── SETTINGS SHORTCUTS ───────────────────────────────────── */}
          <View style={[sec.wrap, { paddingHorizontal: hPad, marginTop: 24 }]}>
            <SectionHeader title="Settings" colors={colors} />
            <View style={[set.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {[
                { icon: 'person-outline' as const,        label: 'Edit Profile',   path: '/profile/edit'           },
                { icon: 'notifications-outline' as const, label: 'Notifications',  path: '/settings/notifications' },
                { icon: 'lock-closed-outline' as const,   label: 'Privacy',        path: '/settings/privacy'       },
                { icon: 'help-circle-outline' as const,   label: 'Help & Support', path: '/help'                   },
              ].map((item, i, arr) => (
                <React.Fragment key={item.path}>
                  <Pressable
                    style={set.row}
                    onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push(item.path); }}
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
          </View>
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

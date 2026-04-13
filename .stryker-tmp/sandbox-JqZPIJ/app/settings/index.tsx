// @ts-nocheck
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useColors, useIsDark } from '@/hooks/useColors';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Alert, Linking, useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/Button';
import { CultureTokens, LayoutRules, Spacing, gradients, type ColorTheme } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { BackButton } from '@/components/ui/BackButton';
import { TextStyles } from '@/constants/typography';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  APP_NAME,
  APP_NAME_AU,
  EMAIL_BUGS,
  EMAIL_SUPPORT,
  PRIMARY_REGION,
  getAppVersion,
  getAppVersionWithBuild,
} from '@/lib/app-meta';
import { getTravelModeEnabled } from '@/lib/storage';

interface SettingItem {
  icon: string;
  label: string;
  sub?: string;
  color: string;
  route?: string;
  action?: () => void;
  rightText?: string;
}
interface SettingSection { title: string; items: SettingItem[] }

export default function AccountSettingsScreen() {
  const colors   = useColors();
  const isDark   = useIsDark();
  const s        = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const insets   = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const { user, isAuthenticated, logout, emailVerified, sendVerificationEmail, checkEmailVerified } = useAuth();
  const { restartOnboarding } = useOnboarding();
  const { isOrganizer, isAdmin, hasMinRole } = useRole();
  const [verifySending, setVerifySending] = useState(false);
  const [showAdvancedSections, setShowAdvancedSections] = useState(false);
  const canTargetCampaigns = hasMinRole('cityAdmin');
  const appVersion = getAppVersion();
  const appVersionWithBuild = getAppVersionWithBuild();
  const [travelModeEnabled, setTravelModeEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const enabled = await getTravelModeEnabled(user?.id);
      if (!cancelled) setTravelModeEnabled(enabled);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const tier      = user?.subscriptionTier ?? 'free';
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const tierStr   = tier as string;
  const tierColor =
    tierStr === 'plus'    ? CultureTokens.indigo :
    tierStr === 'premium' || tierStr === 'vip' || tierStr === 'elite' ? CultureTokens.gold :
    tierStr === 'pro'     ? CultureTokens.teal :
    tierStr === 'sydney-local' ? CultureTokens.success :
    colors.textTertiary;

  const pathname = usePathname();
  const navigate = (route: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (route === '/(onboarding)/login' || route === '/(onboarding)/signup') {
      router.push({ pathname: route, params: { redirectTo: pathname } });
      return;
    }
    try {
      router.push({ pathname: route });
    } catch (error) {
      if (__DEV__) console.warn('[settings] navigation failed:', route, error);
      router.replace('/(tabs)');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout('/(onboarding)');
          } catch {
            Alert.alert('Sign out failed', 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleVerifyEmail = useCallback(async () => {
    if (verifySending) return;
    setVerifySending(true);
    try {
      await sendVerificationEmail();
      Alert.alert(
        'Verification email sent',
        `We sent a link to ${user?.email ?? 'your email'}. Open it to verify your account.\n\nAlready clicked the link?`,
        [
          { text: 'Done', style: 'cancel' },
          {
            text: 'I verified — refresh',
            onPress: async () => {
              const verified = await checkEmailVerified();
              if (verified) {
                Alert.alert('Email verified', 'Your email address is now verified.');
              } else {
                Alert.alert('Not yet verified', 'We could not confirm verification. Please check your inbox and try again.');
              }
            },
          },
        ],
      );
    } catch (err: any) {
      const msg = err?.code === 'auth/too-many-requests'
        ? 'Too many requests. Please wait a few minutes and try again.'
        : 'Failed to send verification email. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setVerifySending(false);
    }
  }, [verifySending, sendVerificationEmail, checkEmailVerified, user?.email]);

  const handleRedoSetup = useCallback(() => {
    Alert.alert(
      'Redo account setup?',
      'Your previous selections will be kept as defaults — you can change anything.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await restartOnboarding();
            router.replace('/(onboarding)/location');
          },
        },
      ],
    );
  }, [restartOnboarding]);

  const AUTH_SECTIONS: SettingSection[] = [
    {
      title: 'App',
      items: [
        { icon: 'color-palette-outline', label: 'Appearance',       sub: 'Theme and visual style',            color: CultureTokens.indigo, route: '/settings/appearance' },
        {
          icon: 'airplane-outline',
          label: 'Travel Mode',
          sub: 'Reorganize Discover for workers constantly on the move',
          color: CultureTokens.teal,
          route: '/settings/travel-mode',
          rightText: travelModeEnabled ? 'On' : 'Off',
        },
        { icon: 'location-outline',      label: 'Location & City',  sub: 'Country, region & city for local content', color: CultureTokens.teal, route: '/settings/location' },
        { icon: 'calendar-outline',      label: 'Calendar Sync',    sub: 'Apple, Google, Outlook & device',   color: CultureTokens.indigo, route: '/settings/calendar-sync' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'person-outline',        label: 'Edit Profile',         sub: 'Name, bio, photo, social links',   color: CultureTokens.indigo, route: '/profile/edit' },
        { icon: 'notifications-outline', label: 'Notifications',        sub: 'Push, email, event reminders',     color: CultureTokens.coral,  route: '/settings/notifications' },
        ...(!emailVerified ? [{
          icon: 'mail-unread-outline',
          label: verifySending ? 'Sending…' : 'Verify Email',
          sub: `${user?.email ?? 'Your email'} is not yet verified`,
          color: CultureTokens.warning,
          action: handleVerifyEmail,
        }] : []),
        { icon: 'refresh-circle-outline', label: 'Redo Account Setup', sub: 'Update your city, communities & interests', color: CultureTokens.teal, action: handleRedoSetup },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { icon: 'lock-closed-outline',   label: 'Privacy & Security',   sub: 'Profile visibility, data sharing', color: CultureTokens.gold, route: '/settings/privacy' },
      ],
    },
    {
      title: 'Membership & Payments',
      items: [
        { icon: 'star-outline',    label: 'My Membership',       sub: `${tierLabel} Plan · Tap to upgrade`, color: CultureTokens.gold,   route: '/membership/upgrade' },
        { icon: 'wallet-outline',  label: 'Wallet & Balance',    sub: 'Top up, view cashback',              color: CultureTokens.teal,   route: '/payment/wallet' },
        { icon: 'card-outline',    label: 'Payment Methods',     sub: 'Cards, bank accounts',               color: CultureTokens.indigo, route: '/payment/methods' },
        { icon: 'receipt-outline', label: 'Transaction History', sub: 'Purchases and payments',             color: colors.textSecondary, route: '/payment/transactions' },
      ],
    },
    {
      title: 'My Content',
      items: [
        { icon: 'ticket-outline',   label: 'My Tickets',     sub: 'Upcoming and past events',  color: CultureTokens.gold,  route: '/tickets' },
        { icon: 'bookmark-outline', label: 'Saved Items',    sub: 'Events, perks, businesses', color: CultureTokens.coral, route: '/saved' },
        { icon: 'people-outline',   label: 'My Communities', sub: "Groups you've joined",       color: CultureTokens.teal,  route: '/(tabs)/community' },
        { icon: 'help-circle-outline', label: 'Help Center', sub: 'FAQs, guides, tutorials', color: CultureTokens.gold, route: '/help' },
      ],
    },
    ...(isOrganizer ? [{
      title: 'Organizer Tools',
      items: [
        { icon: 'grid-outline',       label: 'Organizer Dashboard', sub: 'Manage your events and tickets',                color: CultureTokens.indigo, route: '/dashboard/organizer' },
        { icon: 'qr-code-outline',    label: 'Ticket Scanner',      sub: 'Scan attendee tickets at gate',                 color: CultureTokens.gold,   route: '/scanner' },
        // { icon: 'add-circle-outline', label: 'Create & submit',     sub: 'Events, movies, dining, shops, activities, profiles', color: CultureTokens.coral, route: '/submit' },
        ...(canTargetCampaigns ? [{ icon: 'megaphone-outline',      label: 'Campaign Targeting', sub: 'Dry-run and send targeted push', color: CultureTokens.gold,    route: '/admin/notifications' }] : []),
        ...(canTargetCampaigns ? [{ icon: 'document-text-outline',  label: 'Campaign Audit Logs', sub: 'Review admin send history',    color: CultureTokens.warning, route: '/admin/audit-logs' }] : []),
      ] as SettingItem[],
    }] : []),
    ...(isAdmin ? [{
      title: 'Admin Tools',
      items: [
        { icon: 'people-outline',    label: 'Admin Panel',     sub: 'Manage users and roles',             color: CultureTokens.error,  route: '/admin/users' },
        { icon: 'bar-chart-outline', label: 'Admin Dashboard', sub: 'Platform overview and operations',   color: CultureTokens.indigo, route: '/admin/dashboard' },
      ] as SettingItem[],
    }] : []),
    {
      title: 'Help & Support',
      items: [
        // { icon: 'help-circle-outline', label: 'Help Center',      sub: 'FAQs, guides, tutorials',  color: CultureTokens.gold,    route: '/help' },
        { icon: 'mail-outline',        label: 'Contact Us',       sub: EMAIL_SUPPORT,  color: CultureTokens.teal,   action: () => Linking.openURL(`mailto:${EMAIL_SUPPORT}?subject=${encodeURIComponent(`${APP_NAME} Support`)}`) },
        { icon: 'flag-outline',        label: 'Report a Problem', sub: 'Something not working?',  color: CultureTokens.warning, action: () => Linking.openURL(`mailto:${EMAIL_BUGS}?subject=${encodeURIComponent('Bug Report')}`) },
        { icon: 'star-half-outline',   label: 'Rate CulturePass', sub: 'Share your feedback',     color: CultureTokens.coral,   action: () => Linking.openURL(Platform.OS === 'android' ? 'market://details?id=au.culturepass.app' : 'https://apps.apple.com/app/culturepass/id6742686059') },
      ],
    },
    {
      title: 'Legal',
      items: [
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy',       color: CultureTokens.gold,  route: '/legal/privacy' },
        { icon: 'document-text-outline',    label: 'Terms of Service',     color: CultureTokens.gold,  route: '/legal/terms' },
        { icon: 'finger-print-outline',     label: 'Cookie Policy',        color: CultureTokens.coral, route: '/legal/cookies' },
        { icon: 'people-circle-outline',    label: 'Community Guidelines', color: CultureTokens.teal,  route: '/legal/guidelines' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'information-circle-outline', label: 'About CulturePass', color: CultureTokens.indigo,     route: '/settings/about' },
        { icon: 'newspaper-outline',          label: "What's New",        color: CultureTokens.teal,       route: '/updates/index' },
        { icon: 'phone-portrait-outline',     label: 'App Version',       color: colors.textSecondary,     rightText: appVersionWithBuild },
      ],
    },
  ];

  const GUEST_SECTIONS: SettingSection[] = [
    {
      title: 'App',
      items: [
        { icon: 'color-palette-outline', label: 'Appearance', sub: 'Theme and visual style', color: CultureTokens.indigo, route: '/settings/appearance' },
        {
          icon: 'airplane-outline',
          label: 'Travel Mode',
          sub: 'Reorganize Discover for workers constantly on the move',
          color: CultureTokens.teal,
          route: '/settings/travel-mode',
          rightText: travelModeEnabled ? 'On' : 'Off',
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { icon: 'lock-closed-outline', label: 'Privacy & Security', sub: 'Profile visibility and data controls', color: CultureTokens.gold, route: '/settings/privacy' },
      ],
    },
    {
      title: 'Help & Support',
      items: [
        // { icon: 'help-circle-outline', label: 'Help Center',  sub: 'FAQs, guides, tutorials', color: CultureTokens.gold,  route: '/help' },
        { icon: 'mail-outline',        label: 'Contact Us',   sub: EMAIL_SUPPORT, color: CultureTokens.teal, action: () => Linking.openURL(`mailto:${EMAIL_SUPPORT}?subject=${encodeURIComponent(`${APP_NAME} Support`)}`) },
      ],
    },
    {
      title: 'Legal',
      items: [
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy',       color: CultureTokens.gold,  route: '/legal/privacy' },
        { icon: 'document-text-outline',    label: 'Terms of Service',     color: CultureTokens.gold,  route: '/legal/terms' },
        { icon: 'finger-print-outline',     label: 'Cookie Policy',        color: CultureTokens.coral, route: '/legal/cookies' },
        { icon: 'people-circle-outline',    label: 'Community Guidelines', color: CultureTokens.teal,  route: '/legal/guidelines' },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'information-circle-outline', label: 'About CulturePass', color: CultureTokens.indigo,  route: '/settings/about' },
        { icon: 'newspaper-outline',          label: "What's New",        color: CultureTokens.teal,    route: '/updates/index' },
        { icon: 'phone-portrait-outline',     label: 'App Version',       color: colors.textSecondary, rightText: appVersionWithBuild },
      ],
    },
  ];

  const sections = isAuthenticated ? AUTH_SECTIONS : GUEST_SECTIONS;
  const primarySectionTitles = useMemo(
    () =>
      isAuthenticated
        ? new Set(['App', 'Account', 'Privacy', 'Help & Support'])
        : new Set(['App', 'Privacy', 'Help & Support']),
    [isAuthenticated]
  );
  const visibleSections = useMemo(
    () =>
      showAdvancedSections
        ? sections
        : sections.filter((section) => primarySectionTitles.has(section.title)),
    [sections, primarySectionTitles, showAdvancedSections]
  );
  const hiddenSectionsCount = sections.length - visibleSections.length;
  const reducedMotion = useReducedMotion();

  return (
    <View style={s.container}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={settingsAmbient.mesh}
        pointerEvents="none"
      />

      <View style={{ paddingTop: insets.top }}>
        <LiquidGlassPanel
          borderRadius={0}
          bordered={false}
          style={{
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: colors.borderLight,
          }}
          contentStyle={s.headerGlassInner}
        >
          <BackButton fallback="/(tabs)" style={s.backBtnGlass} />
          <Text style={[TextStyles.headline, { flex: 1, textAlign: 'center', color: colors.text }]}>
            Settings
          </Text>
          <View style={{ width: 38 }} />
        </LiquidGlassPanel>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: LayoutRules.sectionSpacing + (Platform.OS === 'web' ? 34 : insets.bottom),
          paddingTop: 12,
        }}
      >
        {/* ── Profile card / guest CTA ────────────────────────── */}
        {isAuthenticated && user ? (
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.springify().damping(18).stiffness(120)}>
            <View style={[s.profileCard, isDesktopWeb && s.webSection]}>
              {/* Dark gradient background */}
              <LinearGradient
                colors={['#0F0F22', '#190A30', '#0A1430'] as [string, string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Decorative arc */}
              <View style={s.cardArc} pointerEvents="none" />

              <View style={s.profileRow}>
                <Pressable
                  style={({ pressed }) => [s.profileMainTap, pressed && { opacity: 0.93, transform: [{ scale: 0.99 }] }]}
                  onPress={() => navigate('/profile/edit')}
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile"
                >
                  {/* Gradient-ring avatar */}
                  <View style={s.avatarRingOuter}>
                    <LinearGradient
                      colors={[CultureTokens.teal, CultureTokens.indigo, CultureTokens.coral] as [string, string, string]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={s.avatarInner}>
                      {user.avatarUrl ? (
                        <Image source={{ uri: user.avatarUrl }} style={s.avatar} contentFit="cover" />
                      ) : (
                        <View style={s.avatarFallback}>
                          <Text style={s.avatarLetter}>
                            {(user.displayName ?? user.username ?? 'C')[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.profileName} numberOfLines={1}>
                      {user.displayName ?? user.username ?? 'User'}
                    </Text>
                    <Text style={s.profileEmail} numberOfLines={1}>{user.email ?? ''}</Text>
                    <View style={[s.tierBadge, { backgroundColor: tierColor + '18', borderColor: tierColor + '35' }]}>
                      <Ionicons name="star" size={9} color={tierColor} />
                      <Text style={[s.tierText, { color: tierColor }]}>{tierLabel}</Text>
                    </View>
                  </View>
                </Pressable>

                <View style={s.editBtnGlass} pointerEvents="none">
                  <LiquidGlassPanel borderRadius={14} bordered={false} contentStyle={s.editBtnInner}>
                    <Ionicons name="create-outline" size={15} color={colors.textOnBrandGradient} />
                    <Text style={[s.editBtnText, { color: colors.textOnBrandGradient }]}>Edit</Text>
                  </LiquidGlassPanel>
                </View>
              </View>

              {(user.city || user.country) && (
                <View style={s.locationRow}>
                  <Ionicons name="location" size={11} color={CultureTokens.teal} />
                  <Text style={s.locationText}>
                    {[user.city, user.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}

              {!emailVerified && (
                <Pressable
                  style={({ pressed }) => [s.verifyBanner, pressed && { opacity: 0.8 }]}
                  onPress={handleVerifyEmail}
                  accessibilityRole="button"
                  accessibilityLabel="Verify email address"
                >
                  <Ionicons name="alert-circle" size={13} color={CultureTokens.warning} />
                  <Text style={s.verifyBannerText}>
                    Email not verified —{' '}
                    <Text style={{ fontFamily: 'Poppins_700Bold' }}>
                      {verifySending ? 'Sending…' : 'Send verification link'}
                    </Text>
                  </Text>
                  <Ionicons name="chevron-forward" size={11} color={CultureTokens.warning} />
                </Pressable>
              )}
            </View>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={reducedMotion ? undefined : FadeInDown.springify().damping(18)}>
              <LiquidGlassPanel
                borderRadius={28}
                style={[s.guestCardOuter, isDesktopWeb && s.webSection]}
                contentStyle={s.guestCardInner}
              >
                <View style={s.guestIconWrap}>
                  <LinearGradient
                    colors={[CultureTokens.indigo + '30', CultureTokens.teal + '10'] as [string, string]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Ionicons name="person-circle" size={56} color={CultureTokens.indigo + '80'} />
                </View>
                <Text style={s.guestTitle}>Welcome to CulturePass</Text>
                <Text style={s.guestSub}>
                  Join CulturePass to access your profile, tickets, wallet, and exclusive cultural events.
                </Text>
              </LiquidGlassPanel>
            </Animated.View>
            {/* Floating Action Button for guests */}
            <View style={s.fabWrap} pointerEvents="box-none">
              <Button
                variant="gold"
                leftIcon="person-add-outline"
                style={s.fabBtn}
                onPress={() => navigate('/(onboarding)/signup')}
                accessibilityLabel="Join CulturePass"
              >
                Join CulturePass
              </Button>
            </View>
          </>
        )}

        {/* ── Settings sections ───────────────────────────────── */}
        {isAuthenticated && visibleSections.map((section, idx) => (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(Math.min(80 + idx * 55, 400)).springify().damping(18).stiffness(110)}
            key={section.title}
            style={[s.section, isDesktopWeb && s.webSection]}
          >
            {/* Section label */}
            <View style={s.sectionTitleRow}>
              <View style={s.sectionAccent} />
              <Text style={s.sectionTitle}>{section.title}</Text>
            </View>

            <LiquidGlassPanel borderRadius={22} contentStyle={{ padding: 0 }}>
              {section.items.map((item, ii) => (
                <View key={item.label}>
                  <Pressable
                    style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                      s.settingRow,
                      (pressed || hovered) && { backgroundColor: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.03)' },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (item.route) navigate(item.route);
                      else item.action?.();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    {/* Coloured icon squircle */}
                    <View style={[s.settingIcon, { backgroundColor: item.color + '1A' }]}>
                      <Ionicons
                        name={item.icon as keyof typeof Ionicons.glyphMap}
                        size={19}
                        color={item.color}
                      />
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.settingLabel}>{item.label}</Text>
                      {item.sub ? <Text style={s.settingSub}>{item.sub}</Text> : null}
                    </View>

                    {item.rightText ? (
                      <Text style={s.settingRightText}>{item.rightText}</Text>
                    ) : (item.route ?? item.action) ? (
                      <Ionicons name="chevron-forward" size={14} color={colors.textTertiary + 'AA'} />
                    ) : null}
                  </Pressable>

                  {ii < section.items.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </LiquidGlassPanel>
          </Animated.View>
        ))}

        {isAuthenticated && hiddenSectionsCount > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInDown.delay(220).springify().damping(18).stiffness(110)}
            style={[s.section, isDesktopWeb && s.webSection, { alignItems: 'center', marginTop: 18, marginBottom: 18 }]}
          >
            {showAdvancedSections ? (
              <Text style={s.advancedHint}>Advanced and admin sections</Text>
            ) : null}
            <Pressable
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                s.showMoreBtn,
                { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 22, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surfaceSecondary },
                hovered && { backgroundColor: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.06)' },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 220, justifyContent: 'center' },
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAdvancedSections((v) => !v);
              }}
              accessibilityRole="button"
              accessibilityLabel={showAdvancedSections ? 'Show fewer settings' : `Show ${hiddenSectionsCount} more settings sections`}
            >
              <Ionicons
                name={showAdvancedSections ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={20}
                color={CultureTokens.indigo}
                style={{ marginRight: 8 }}
              />
              <Text style={[s.showMoreText, { fontSize: 16, fontWeight: '600', color: CultureTokens.indigo }] }>
                {showAdvancedSections ? 'Show fewer settings' : `Show ${hiddenSectionsCount} more sections`}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ── Sign out ─────────────────────────────────────────── */}
        {isAuthenticated && (
          <>
            <View style={{ height: 18 }} />
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.delay(Math.min(80 + sections.length * 55, 450)).springify().damping(18)}
              style={[s.section, isDesktopWeb && s.webSection, { marginBottom: 20 }]}
            >
              <Pressable
                style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                  s.signOutBtn,
                  hovered && { backgroundColor: isDark ? 'rgba(255,94,91,0.14)' : 'rgba(255,94,91,0.11)', borderColor: CultureTokens.coral + '44' },
                  pressed && { opacity: 0.72, transform: [{ scale: 0.98 }] },
                ]}
                onPress={handleSignOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                <Ionicons name="log-out-outline" size={17} color={CultureTokens.coral} />
                <Text style={s.signOutText}>Sign Out</Text>
              </Pressable>
            </Animated.View>
          </>
        )}

        {/* Bottom Help Center button removed */}
        <Text style={s.footer}>
          {`${APP_NAME_AU} · v${appVersion}${'\n'}Available in ${PRIMARY_REGION}`}
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const getStyles = (colors: ColorTheme, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    headerGlassInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: LayoutRules.screenHorizontalPadding,
      paddingBottom: 10,
      paddingTop: 6,
    },
    backBtnGlass: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },

    // Profile card
    profileCard: {
      marginHorizontal: LayoutRules.screenHorizontalPadding,
      marginBottom: 24,
      borderRadius: 28,
      padding: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      ...Platform.select({
        web: { boxShadow: '0px 16px 48px rgba(0,0,0,0.28)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.28,
          shadowRadius: 28,
          elevation: 10,
        },
      }),
    },
    cardArc: {
      position: 'absolute', top: -50, right: -50,
      width: 180, height: 180, borderRadius: 90,
      borderWidth: 26, borderColor: CultureTokens.teal + '09',
    },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    profileMainTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },

    // Gradient-ring avatar
    avatarRingOuter: {
      width: 82, height: 82, borderRadius: 41,
      overflow: 'hidden',
      alignItems: 'center', justifyContent: 'center',
    },
    avatarInner: {
      width: 76, height: 76, borderRadius: 38,
      overflow: 'hidden',
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center', justifyContent: 'center',
    },
    avatar: { width: 76, height: 76 },
    avatarFallback: {
      width: 76, height: 76, borderRadius: 38,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.textOnBrandGradient },

    profileName:  { fontSize: 19, fontFamily: 'Poppins_700Bold', color: colors.textOnBrandGradient, letterSpacing: -0.3 },
    profileEmail: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textOnBrandGradient, opacity: 0.55 },
    tierBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4,
      borderRadius: 20, borderWidth: 1,
    },
    tierText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },

    editBtnGlass: { alignSelf: 'flex-start' },
    editBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      height: 36,
    },
    editBtnText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },

    locationRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
      backgroundColor: 'rgba(46,196,182,0.12)',
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: 10, alignSelf: 'flex-start',
      borderWidth: 1, borderColor: 'rgba(46,196,182,0.22)',
    },
    locationText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.textOnBrandGradient, opacity: 0.75 },

    verifyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 12,
      backgroundColor: CultureTokens.warning + '18',
      borderWidth: 1,
      borderColor: CultureTokens.warning + '40',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    verifyBannerText: {
      flex: 1,
      fontSize: 11,
      fontFamily: 'Poppins_400Regular',
      color: CultureTokens.warning,
      lineHeight: 16,
    },

    guestCardOuter: {
      marginHorizontal: LayoutRules.screenHorizontalPadding,
      marginBottom: 24,
      ...Platform.select({
        web: { boxShadow: '0px 8px 32px rgba(0,0,0,0.08)' },
        default: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4 },
      }),
    },
    guestCardInner: { padding: 32, alignItems: 'center' },
    guestIconWrap: {
      width: 96, height: 96, borderRadius: 48,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', marginBottom: 16,
    },
    guestTitle:   { fontSize: 21, fontFamily: 'Poppins_700Bold', marginBottom: 8, textAlign: 'center', color: colors.text },
    guestSub:     { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 24, color: colors.textSecondary },
    guestSignUpBtn: { paddingVertical: Spacing.xs, marginTop: 12 },
    guestSignUpText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center' },

    // Sections
    section: { paddingHorizontal: 20, marginBottom: 20 },

    sectionTitleRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 8, marginBottom: 10, marginLeft: 2,
    },
    sectionAccent: {
      width: 3, height: 14, borderRadius: 2,
      backgroundColor: CultureTokens.indigo,
    },
    sectionTitle: {
      fontSize: 11, fontFamily: 'Poppins_700Bold',
      color: colors.textTertiary,
      textTransform: 'uppercase', letterSpacing: 1.6,
    },

    settingRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 13,
      gap: 14,
    },
    settingIcon: {
      width: 42, height: 42, borderRadius: 13,
      alignItems: 'center', justifyContent: 'center',
    },
    settingLabel:     { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text, lineHeight: 20 },
    settingSub:       { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 17 },
    settingRightText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textTertiary },

    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 72,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    },

    // Sign out
    signOutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 14, borderRadius: 18,
      backgroundColor: isDark ? 'rgba(255,94,91,0.09)' : 'rgba(255,94,91,0.07)',
      borderWidth: 1, borderColor: CultureTokens.coral + '28',
    },
    signOutText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: CultureTokens.coral },
    showMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    },
    showMoreText: {
      fontSize: 13,
      fontFamily: 'Poppins_600SemiBold',
      color: colors.textSecondary,
    },
    advancedHint: {
      fontSize: 11,
      fontFamily: 'Poppins_500Medium',
      color: colors.textTertiary,
      marginBottom: 8,
      marginLeft: 4,
    },

    footer: {
      textAlign: 'center', fontSize: 11, fontFamily: 'Poppins_500Medium',
      marginTop: 16, marginBottom: 60, lineHeight: 20,
      color: colors.textTertiary, opacity: 0.45,
    },

    webSection: { maxWidth: 800, width: '100%', alignSelf: 'center' },

    fabWrap: {
      position: 'absolute',
      right: 24,
      bottom: 34,
      zIndex: 100,
      alignItems: 'flex-end',
      pointerEvents: 'box-none',
    },
    fabBtn: {
      borderRadius: 22,
      minWidth: 170,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.13,
      shadowRadius: 12,
    },
  });

const settingsAmbient = StyleSheet.create({
  mesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
  },
});

/**
 * Tab header chrome: home logo + page title + global actions (search, notifications, profile avatar).
 * One pattern for Discover, Feed, Events, Community, Perks, and Profile (in-tab).
 */
import React, { useCallback, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { HEADER_CHROME_TOKENS, MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export const BRAND_TAGLINE_SHORT = 'Discover culture · Belong anywhere';

const isWeb = Platform.OS === 'web';

function haptic() {
  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function ActionBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={markStyles.actionBadge}>
      <Text style={markStyles.actionBadgeText}>{count > 9 ? '9+' : String(count)}</Text>
    </View>
  );
}

/** Logo only — tap returns to Discover home. */
export function HomeLogoMark({ compact = true }: { compact?: boolean }) {
  const onHome = useCallback(() => {
    haptic();
    router.push('/(tabs)' as const);
  }, []);

  return (
    <Pressable
      onPress={onHome}
      accessibilityRole="button"
      accessibilityLabel="CulturePass home, Discover"
      accessibilityHint="Navigates to the Discover tab"
      style={markStyles.logoPress}
      hitSlop={10}
    >
      <View style={[markStyles.logoBg, compact && markStyles.logoBgCompact]}>
        <Image
          source={require('@/assets/images/culturepass-logo.png')}
          style={[markStyles.logoPlain, compact && markStyles.logoPlainCompact]}
          contentFit="cover"
        />
      </View>
    </Pressable>
  );
}

/** Legacy: full wordmark + optional tagline (web-only marketing surfaces). */
export function BrandMark({
  compact = false,
  showTagline = true,
}: {
  compact?: boolean;
  showTagline?: boolean;
}) {
  const colors = useColors();

  const onHome = useCallback(() => {
    haptic();
    router.push('/(tabs)' as const);
  }, []);

  return (
    <Pressable
      style={[markStyles.press, compact && markStyles.pressCompact]}
      onPress={onHome}
      accessibilityRole="button"
      accessibilityLabel="CulturePass home"
    >
      <View style={[markStyles.logoBg, compact && markStyles.logoBgCompact]}>
        <Image
          source={require('@/assets/images/culturepass-logo.png')}
          style={[markStyles.logoPlain, compact && markStyles.logoPlainCompact]}
          contentFit="cover"
        />
      </View>

      <View style={markStyles.textWrap}>
        <Text
          style={[markStyles.name, compact && markStyles.nameCompact, { color: colors.text }]}
          numberOfLines={1}
        >
          CulturePass
        </Text>
        {showTagline && !compact ? (
          <Text style={[markStyles.tagline, { color: CultureTokens.gold }]} numberOfLines={1}>
            {BRAND_TAGLINE_SHORT}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Circular avatar button — shows user photo or fallback person icon. Navigates to profile. */
function ProfileAvatarButton() {
  const colors = useColors();
  const isDark = useIsDark();
  const { user, isAuthenticated } = useAuth();

  const ringBg = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.055)';
  const ringBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)';

  return (
    <Pressable
      style={({ pressed }) => [
        markStyles.avatarBtn,
        { borderColor: isAuthenticated ? CultureTokens.indigo + '60' : ringBorder, backgroundColor: ringBg },
        pressed && { opacity: 0.75 },
      ]}
      onPress={() => {
        haptic();
        router.push('/(tabs)/profile' as const);
      }}
      accessibilityRole="button"
      accessibilityLabel={isAuthenticated ? 'View your profile' : 'Sign in'}
      accessibilityHint="Open profile and settings"
    >
      {isAuthenticated && user?.avatarUrl ? (
        <Image
          source={{ uri: user.avatarUrl }}
          style={markStyles.avatarImg}
          contentFit="cover"
        />
      ) : (
        <Ionicons
          name={isAuthenticated ? 'person-circle' : 'person-circle-outline'}
          size={22}
          color={isAuthenticated ? CultureTokens.indigo : colors.textSecondary}
        />
      )}
    </Pressable>
  );
}

export function GlobalNavActions({
  showMenu = true,
  leadingAction,
}: {
  showMenu?: boolean;
  leadingAction?: ReactNode;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const { userId, isRestoring } = useAuth();

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notifications', 'unread-count', userId, 'tab-header-chrome'],
    queryFn: async () => {
      const res = await api.notifications.unreadCount();
      return res.count ?? 0;
    },
    enabled: Boolean(userId) && !isRestoring,
    refetchInterval: 60_000,
  });

  const chipBg = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.055)';
  const chipBorder = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={markStyles.actions}>
      {leadingAction ? leadingAction : null}
      <Pressable
        style={({ pressed }) => [
          markStyles.iconBtn,
          { backgroundColor: colors.primarySoft, borderColor: CultureTokens.indigo + '30' },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          haptic();
          router.push('/search' as const);
        }}
        accessibilityRole="button"
        accessibilityLabel="Search"
        accessibilityHint="Open search"
      >
        <Ionicons name="search" size={MAIN_TAB_UI.iconSize.md} color={CultureTokens.indigo} />
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          markStyles.iconBtn,
          { backgroundColor: chipBg, borderColor: chipBorder },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          haptic();
          router.push('/notifications' as const);
        }}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        accessibilityHint="Open notifications"
      >
        <Ionicons name="notifications-outline" size={MAIN_TAB_UI.iconSize.md} color={colors.text} />
        <ActionBadge count={unreadCount} />
      </Pressable>

      {showMenu ? <ProfileAvatarButton /> : null}
    </View>
  );
}

/** Page-first header: logo | title | search · notifications · profile avatar */
export function TabPageChromeRow({
  title,
  subtitle: _subtitle,
  locationLabel,
  showMenu = true,
  showHairline = false,
  showBrandStrip = false,
  topHeaderAction,
}: {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  showMenu?: boolean;
  showHairline?: boolean;
  showBrandStrip?: boolean;
  topHeaderAction?: ReactNode;
}) {
  const colors = useColors();

  return (
    <View style={markStyles.chromeWrapper}>
      <View
        style={[
          markStyles.pageChromeRow,
          !showHairline && markStyles.chromeRowPlain,
          showHairline && { borderBottomColor: colors.borderLight },
        ]}
      >
        <HomeLogoMark compact />
        <View style={markStyles.pageTitleCol}>
          <Text
            style={[markStyles.pageTitle, { color: colors.text }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {locationLabel ? (
            <View style={markStyles.locationInline}>
              <Ionicons name="location-outline" size={MAIN_TAB_UI.iconSize.sm} color={CultureTokens.indigo} />
              <Text style={[markStyles.pageLocation, { color: colors.textTertiary }]} numberOfLines={1}>
                {locationLabel}
              </Text>
            </View>
          ) : null}
        </View>
        <GlobalNavActions showMenu={showMenu} leadingAction={topHeaderAction} />
      </View>
      {/* Brand gradient accent strip */}
      {showBrandStrip ? (
        <LinearGradient
          colors={[CultureTokens.indigo, CultureTokens.teal, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={markStyles.brandStrip}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const markStyles = StyleSheet.create({
  logoPress: {
    flexShrink: 0,
  },
  logoPlain: {
    width: HEADER_CHROME_TOKENS.logo.defaultSize,
    height: HEADER_CHROME_TOKENS.logo.defaultSize,
    borderRadius: HEADER_CHROME_TOKENS.logo.defaultRadius,
  },
  logoPlainCompact: {
    width: HEADER_CHROME_TOKENS.logo.compactSize,
    height: HEADER_CHROME_TOKENS.logo.compactSize,
    borderRadius: HEADER_CHROME_TOKENS.logo.compactRadius,
  },
  logoBg: {
    width: HEADER_CHROME_TOKENS.logo.defaultRing,
    height: HEADER_CHROME_TOKENS.logo.defaultRing,
    borderRadius: HEADER_CHROME_TOKENS.logo.defaultRing / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBgCompact: {
    width: HEADER_CHROME_TOKENS.logo.compactRing,
    height: HEADER_CHROME_TOKENS.logo.compactRing,
    borderRadius: HEADER_CHROME_TOKENS.logo.compactRing / 2,
  },
  pageChromeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: HEADER_CHROME_TOKENS.row.gap,
    marginBottom: HEADER_CHROME_TOKENS.row.marginBottom,
    paddingBottom: HEADER_CHROME_TOKENS.row.paddingBottom,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitleCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 2 : 4,
  },
  pageTitle: {
    fontSize: Platform.OS === 'web'
      ? HEADER_CHROME_TOKENS.title.webFontSize
      : HEADER_CHROME_TOKENS.title.nativeFontSize,
    lineHeight: Platform.OS === 'web'
      ? HEADER_CHROME_TOKENS.title.webLineHeight
      : HEADER_CHROME_TOKENS.title.nativeLineHeight,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: HEADER_CHROME_TOKENS.title.letterSpacing,
  },
  pageSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Poppins_500Medium',
  },
  locationInline: {
    marginTop: HEADER_CHROME_TOKENS.location.marginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER_CHROME_TOKENS.location.gap,
  },
  pageLocation: {
    flex: 1,
    fontSize: HEADER_CHROME_TOKENS.location.fontSize,
    lineHeight: HEADER_CHROME_TOKENS.location.lineHeight,
    fontFamily: 'Poppins_400Regular',
  },
  chromeRowPlain: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  press: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pressCompact: {
    gap: 8,
  },
  logoRingOuter: {
    width: 44,
    height: 44,
    borderRadius: 14,
    flexShrink: 0,
  },
  logoRingOuterCompact: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  logoRingGradient: {
    flex: 1,
    borderRadius: 14,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingGradientCompact: {
    borderRadius: 12,
    padding: 2,
  },
  logoRingInner: {
    flex: 1,
    width: '100%',
    borderRadius: 11,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingInnerCompact: {
    borderRadius: 10,
  },
  logo: {
    width: 39,
    height: 39,
  },
  logoCompact: {
    width: 34,
    height: 34,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  name: {
    fontSize: Platform.OS === 'web' ? 19 : 21,
    lineHeight: Platform.OS === 'web' ? 24 : 26,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.45,
  },
  nameCompact: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.35,
  },
  tagline: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.35,
    opacity: 0.92,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    flexShrink: 0,
    paddingTop: Platform.OS === 'android' ? 0 : 2,
  },
  iconBtn: {
    width: HEADER_CHROME_TOKENS.actionButton.size,
    height: HEADER_CHROME_TOKENS.actionButton.size,
    borderRadius: HEADER_CHROME_TOKENS.actionButton.radius,
    borderWidth: HEADER_CHROME_TOKENS.actionButton.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: 5,
    right: 4,
    minWidth: HEADER_CHROME_TOKENS.actionButton.badgeSize,
    height: HEADER_CHROME_TOKENS.actionButton.badgeSize,
    borderRadius: HEADER_CHROME_TOKENS.actionButton.badgeRadius,
    backgroundColor: CultureTokens.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  actionBadgeText: {
    color: '#FFFFFF',
    fontSize: HEADER_CHROME_TOKENS.actionButton.badgeFontSize,
    lineHeight: 10,
    fontFamily: 'Poppins_700Bold',
  },
  avatarBtn: {
    width: HEADER_CHROME_TOKENS.actionButton.size,
    height: HEADER_CHROME_TOKENS.actionButton.size,
    borderRadius: HEADER_CHROME_TOKENS.actionButton.radius,
    borderWidth: HEADER_CHROME_TOKENS.actionButton.avatarBorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: HEADER_CHROME_TOKENS.actionButton.avatarImageSize,
    height: HEADER_CHROME_TOKENS.actionButton.avatarImageSize,
    borderRadius: HEADER_CHROME_TOKENS.actionButton.avatarImageRadius,
  },
  chromeWrapper: {
    position: 'relative',
  },
  brandStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HEADER_CHROME_TOKENS.stripHeight,
  },
});

/**
 * Tab header chrome: home logo + page title + global actions (search, notifications, account menu).
 * One pattern for Discover, Feed, Events, Community, Perks, and Profile (in-tab).
 */
import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';

export const BRAND_TAGLINE_SHORT = 'Discover culture · Belong anywhere';

const isWeb = Platform.OS === 'web';

function haptic() {
  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Logo only — tap returns to Discover home. */
export function HomeLogoMark({ compact = true }: { compact?: boolean }) {
  const colors = useColors();

  const onHome = useCallback(() => {
    haptic();
    router.push('/(tabs)' as const);
  }, []);

  return (
    <Pressable
      onPress={onHome}
      accessibilityRole="button"
      accessibilityLabel="CulturePass home, Discover"
      style={markStyles.logoPress}
      hitSlop={8}
    >
      <View style={[markStyles.logoRingOuter, compact && markStyles.logoRingOuterCompact]}>
        <LinearGradient
          colors={[CultureTokens.indigo, CultureTokens.teal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[markStyles.logoRingGradient, compact && markStyles.logoRingGradientCompact]}
        >
          <View
            style={[
              markStyles.logoRingInner,
              { backgroundColor: colors.background },
              compact && markStyles.logoRingInnerCompact,
            ]}
          >
            <Image
              source={require('@/assets/images/culturepass-logo.png')}
              style={[markStyles.logo, compact && markStyles.logoCompact]}
              contentFit="cover"
            />
          </View>
        </LinearGradient>
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
      <View style={[markStyles.logoRingOuter, compact && markStyles.logoRingOuterCompact]}>
        <LinearGradient
          colors={[CultureTokens.indigo, CultureTokens.teal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[markStyles.logoRingGradient, compact && markStyles.logoRingGradientCompact]}
        >
          <View
            style={[
              markStyles.logoRingInner,
              { backgroundColor: colors.background },
              compact && markStyles.logoRingInnerCompact,
            ]}
          >
            <Image
              source={require('@/assets/images/culturepass-logo.png')}
              style={[markStyles.logo, compact && markStyles.logoCompact]}
              contentFit="cover"
            />
          </View>
        </LinearGradient>
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

export function GlobalNavActions({ showMenu = true }: { showMenu?: boolean }) {
  const colors = useColors();
  const isDark = useIsDark();
  const { isAuthenticated } = useAuth();

  const chipBg = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.055)';
  const chipBorder = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.08)';
  const menuBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={markStyles.actions}>
      <Pressable
        style={({ pressed }) => [
          markStyles.iconBtn,
          { backgroundColor: chipBg, borderColor: chipBorder },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          haptic();
          router.push('/search' as const);
        }}
        accessibilityRole="button"
        accessibilityLabel="Search"
      >
        <Ionicons name="search" size={MAIN_TAB_UI.iconSize.md} color={colors.text} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          markStyles.iconBtn,
          { backgroundColor: chipBg, borderColor: chipBorder },
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          haptic();
          if (isAuthenticated) {
            router.push('/notifications' as const);
            return;
          }
          router.push(routeWithRedirect('/(onboarding)/login', '/notifications'));
        }}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Ionicons
          name={isAuthenticated ? 'notifications' : 'notifications-outline'}
          size={MAIN_TAB_UI.iconSize.md}
          color={colors.text}
        />
        {isAuthenticated ? (
          <View style={[markStyles.notifDot, { borderColor: colors.surface }]} />
        ) : null}
      </Pressable>

      {showMenu ? (
        <Pressable
          style={({ pressed }) => [
            markStyles.iconBtn,
            { backgroundColor: chipBg, borderColor: menuBorder },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => {
            haptic();
            router.push('/menu' as const);
          }}
          accessibilityRole="button"
          accessibilityLabel="Account and profile menu"
        >
          <Ionicons name="menu" size={MAIN_TAB_UI.iconSize.lg} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Page-first header: logo | title + subtitle | search · notifications · account menu */
export function TabPageChromeRow({
  title,
  subtitle,
  locationLabel,
  showMenu = true,
  showHairline = true,
}: {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  showMenu?: boolean;
  showHairline?: boolean;
}) {
  const colors = useColors();

  return (
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
        {subtitle ? (
          <Text style={[markStyles.pageSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {locationLabel ? (
          <View style={markStyles.locationInline}>
            <Ionicons name="location-outline" size={MAIN_TAB_UI.iconSize.sm} color={CultureTokens.indigo} />
            <Text style={[markStyles.pageLocation, { color: colors.textTertiary }]} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <GlobalNavActions showMenu={showMenu} />
    </View>
  );
}

const markStyles = StyleSheet.create({
  logoPress: {
    flexShrink: 0,
  },
  pageChromeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pageTitleCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 2 : 4,
  },
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 22,
    lineHeight: Platform.OS === 'web' ? 26 : 28,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Poppins_500Medium',
  },
  locationInline: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageLocation: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
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
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CultureTokens.coral,
    borderWidth: 1.5,
  },
});

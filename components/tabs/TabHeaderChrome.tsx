/**
 * Tab header chrome: home logo + page title + global actions (search, notifications, account menu).
 * One pattern for Discover, Feed, Events, Community, Perks, and Profile (in-tab).
 */
import React, { useCallback, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
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

export function GlobalNavActions({
  showMenu = true,
  leadingAction,
}: {
  showMenu?: boolean;
  leadingAction?: ReactNode;
}) {
  const colors = useColors();
  const isDark = useIsDark();

  const chipBg = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.055)';
  const chipBorder = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.08)';
  const menuBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={markStyles.actions}>
      {leadingAction ? leadingAction : null}
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
        accessibilityHint="Open search"
      >
        <Ionicons name="search" size={MAIN_TAB_UI.iconSize.md} color={colors.text} />
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
          accessibilityHint="Open app menu"
        >
          <Ionicons name="menu" size={MAIN_TAB_UI.iconSize.lg} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Page-first header: logo | title | search · notifications · account menu */
export function TabPageChromeRow({
  title,
  subtitle: _subtitle,
  locationLabel,
  showMenu = true,
  showHairline = false,
  topHeaderAction,
}: {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  showMenu?: boolean;
  showHairline?: boolean;
  topHeaderAction?: ReactNode;
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
  );
}

const markStyles = StyleSheet.create({
  logoPress: {
    flexShrink: 0,
  },
  logoPlain: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  logoPlainCompact: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  logoBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBgCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: MAIN_TAB_UI.minTouchTarget,
    height: MAIN_TAB_UI.minTouchTarget,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

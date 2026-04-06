import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { CultureTokens, FontFamily, FontSize, LineHeight, LetterSpacing } from '@/constants/theme';
import { LocationPicker } from '@/components/LocationPicker';
import { BrandWordmark } from '@/components/ui/BrandWordmark';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import * as Haptics from 'expo-haptics';

const isWeb = Platform.OS === 'web';

interface DiscoverHeaderProps {
  currentTime: string;
  weatherSummary: string;
  city: string;
  country: string;
  isAuthenticated: boolean;
  onRefresh?: () => void;
}

function DiscoverHeaderComponent({
  currentTime,
  weatherSummary,
  city,
  isAuthenticated,
}: DiscoverHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDesktop, hPad } = useLayout();
  const { user } = useAuth();

  /** Native dark chrome → light icons; web (light theme) → dark icons */
  const chromeIconColor = isWeb ? colors.text : colors.textOnBrandGradient;
  const { timeGreeting, firstName } = useMemo(() => {
    const hour = new Date().getHours();
    const tg = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const fn = user?.displayName?.split(' ')[0] ?? user?.username ?? null;
    return { timeGreeting: tg, firstName: fn };
  }, [user?.displayName, user?.username]);

  const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
  const mobileMetaLabel = [currentTime, weatherSummary].filter(Boolean).join(' · ');

  const haptic = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const TopBarContent = (
    <View style={[styles.topBarInner, { paddingHorizontal: hPad }]}>
      <Pressable
        style={styles.brandBlock}
        onPress={() => {
          haptic();
          router.push('/(tabs)' as const);
        }}
        accessibilityRole="button"
        accessibilityLabel="CulturePass home"
      >
        <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft }]}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logoImg} contentFit="contain" />
        </View>
        <BrandWordmark size="sm" withTagline light={!isWeb} />
      </Pressable>

      <View style={styles.flex1} />

      <View style={styles.actions}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.primarySoft }]}
          onPress={() => {
            haptic();
            router.push('/search' as const);
          }}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Ionicons name="search" size={20} color={chromeIconColor} />
        </Pressable>

        {isAuthenticated ? (
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.primarySoft }]}
            onPress={() => {
              haptic();
              router.push('/notifications' as const);
            }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications" size={20} color={chromeIconColor} />
            <View style={[styles.notifDot, { borderColor: colors.background }]} />
          </Pressable>
        ) : null}

        <Pressable
          style={[
            styles.iconBtn,
            styles.menuBtn,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.borderLight,
            },
          ]}
          onPress={() => {
            haptic();
            router.push('/menu' as const);
          }}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={22} color={chromeIconColor} />
        </Pressable>
      </View>
    </View>
  );

  const renderTopBar = () => (
    <LiquidGlassPanel
      borderRadius={0}
      bordered={false}
      style={{
        zIndex: 100,
        borderBottomWidth: StyleSheet.hairlineWidth * 2,
        borderBottomColor: colors.borderLight,
      }}
      contentStyle={{ paddingTop: insets.top }}
    >
      {TopBarContent}
    </LiquidGlassPanel>
  );

  return (
    <View>
      {!isDesktop ? renderTopBar() : null}

      {isDesktop ? (
        <View style={[styles.heroDesktop, { paddingHorizontal: hPad }]}>
          <View style={styles.heroDesktopLeft}>
            <Text style={[styles.desktopMeta, { color: colors.textSecondary }]}>
              {currentTime}
              {weatherSummary ? ` · ${weatherSummary}` : ''}
            </Text>
            <Text style={[styles.desktopGreeting, { color: colors.text }]}>{greeting}</Text>
            <Text style={[styles.desktopTagline, { color: CultureTokens.gold }]}>BELONG ANYWHERE</Text>
            <Text style={[styles.desktopSub, { color: colors.textSecondary }]}>
              {`Explore festivals, communities, and events in ${city}.`}
            </Text>
          </View>
          <View style={styles.desktopActions}>
            <LocationPicker />
            <Pressable
              style={[styles.iconBtn, styles.desktopIconBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push('/search' as const)}
              accessibilityLabel="Search"
            >
              <Ionicons name="search" size={20} color={colors.text} />
            </Pressable>
            {isAuthenticated ? (
              <Pressable
                style={[styles.iconBtn, styles.desktopIconBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                onPress={() => router.push('/notifications' as const)}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.iconBtn, styles.desktopIconBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
              onPress={() => router.push('/menu' as const)}
              accessibilityLabel="Open menu"
            >
              <Ionicons name="menu" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.mobileHero, { paddingHorizontal: hPad }]}>
          <Text style={[styles.mobileGreeting, { color: colors.text }]} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={[styles.mobileTagline, { color: CultureTokens.gold }]}>BELONG ANYWHERE</Text>
          <View style={styles.mobileMetaRow}>
            <View style={styles.mobileMetaLocationWrap}>
              <LocationPicker variant="text" />
            </View>
            {mobileMetaLabel ? (
              <Text style={[styles.mobileMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {mobileMetaLabel}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },

  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 56,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
  },
  logoImg: { width: 36, height: 36 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    borderWidth: StyleSheet.hairlineWidth * 2,
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

  mobileHero: {
    marginTop: 16,
    marginBottom: 20,
    gap: 4,
  },
  mobileGreeting: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: LineHeight.hero,
  },
  mobileTagline: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  mobileMetaLocationWrap: {
    flexShrink: 1,
  },
  mobileMeta: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    opacity: 0.85,
  },

  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 32,
  },
  heroDesktopLeft: { flex: 1 },
  desktopMeta: { fontSize: FontSize.chip, fontFamily: FontFamily.regular, marginBottom: 4 },
  desktopGreeting: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
    letterSpacing: -1,
    lineHeight: 42,
  },
  desktopTagline: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginTop: 4,
    marginBottom: 12,
  },
  desktopSub: { fontSize: FontSize.callout, fontFamily: FontFamily.regular, lineHeight: LineHeight.callout },
  desktopActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 24 },
  desktopIconBtn: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});

export const DiscoverHeader = React.memo(DiscoverHeaderComponent);

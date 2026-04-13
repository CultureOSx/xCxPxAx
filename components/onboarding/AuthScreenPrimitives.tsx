/**
 * Shared Liquid Glass chrome for onboarding auth screens (login, signup, reset).
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CultureTokens,
  gradients,
  shadows,
  Spacing,
  IconSize,
  FontFamily,
  FontSize,
  LiquidGlassTokens,
} from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { BrandWordmark } from '@/components/ui/BrandWordmark';

export function AuthAmbientBackground() {
  return (
    <>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />
      <View style={[styles.orb, styles.orbIndigo]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbGold]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbCoral]} pointerEvents="none" />
    </>
  );
}

type AuthLiquidFormCardProps = {
  children: React.ReactNode;
  isDesktop: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AuthLiquidFormCard({ children, isDesktop, style }: AuthLiquidFormCardProps) {
  return (
    <LiquidGlassPanel
      borderRadius={LiquidGlassTokens.corner.mainCard}
      style={[
        styles.formCard,
        isDesktop && styles.formCardDesktop,
        Platform.select({
          ios: shadows.large,
          android: { elevation: 8 },
          web: shadows.heavy,
        }),
        style,
      ]}
      contentStyle={styles.formCardInner}
    >
      {children}
    </LiquidGlassPanel>
  );
}

type DesktopBackPillProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function AuthDesktopBackPill({ label, onPress, accessibilityLabel }: DesktopBackPillProps) {
  const colors = useColors();
  return (
    <View style={styles.desktopBackRow}>
      <Pressable
        onPress={onPress}
        hitSlop={Spacing.sm}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
      >
        <LiquidGlassPanel
          borderRadius={Spacing.lg}
          style={styles.desktopPillWrap}
          contentStyle={styles.desktopPillInner}
        >
          <Ionicons name="chevron-back" size={IconSize.md - 2} color={colors.text} />
          <Text style={[styles.desktopBackText, { color: colors.text }]}>{label}</Text>
        </LiquidGlassPanel>
      </Pressable>
    </View>
  );
}

type MobileHeaderVariant = 'close-with-brand' | 'close-only' | 'back-only';

type AuthMobileHeaderProps = {
  variant: MobileHeaderVariant;
  onPress: () => void;
};

export function AuthMobileHeader({ variant, onPress }: AuthMobileHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const padTop = topInset + Spacing.sm + 4;

  const icon =
    variant === 'back-only' ? (
      <Ionicons name="chevron-back" size={28} color={colors.textOnBrandGradient} />
    ) : (
      <Ionicons name="close" size={28} color={colors.textOnBrandGradient} />
    );

  if (variant === 'close-with-brand') {
    return (
      <View style={[styles.mobileHeader, { paddingTop: padTop }]}>
        <Pressable
          onPress={onPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          {icon}
        </Pressable>
        <View style={styles.mobileHeaderBrand}>
          <BrandWordmark size="md" withTagline centered light />
        </View>
        <View style={{ width: 28 }} />
      </View>
    );
  }

  return (
    <View style={[styles.mobileHeaderSingle, { paddingTop: padTop }]}>
      <Pressable
        onPress={onPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={variant === 'back-only' ? 'Go back' : 'Close'}
      >
        {icon}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.88 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  orbIndigo: {
    top: -100,
    right: -50,
    backgroundColor: CultureTokens.indigo,
    opacity: 0.42,
    ...Platform.select({ web: { filter: 'blur(64px)' } as object, default: {} }),
  },
  orbGold: {
    bottom: -50,
    left: -50,
    backgroundColor: CultureTokens.gold,
    opacity: 0.26,
    ...Platform.select({ web: { filter: 'blur(56px)' } as object, default: {} }),
  },
  orbCoral: {
    top: '42%',
    left: -80,
    backgroundColor: CultureTokens.coral,
    opacity: 0.18,
    ...Platform.select({ web: { filter: 'blur(48px)' } as object, default: {} }),
  },
  formCard: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  formCardDesktop: { maxWidth: 520 },
  formCardInner: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  desktopBackRow: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.xxl,
    zIndex: 10,
  },
  desktopPillWrap: { alignSelf: 'flex-start' },
  desktopPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  desktopBackText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Spacing.sm + 4,
  },
  mobileHeaderBrand: { alignItems: 'center', gap: 2 },
  mobileHeaderSingle: {
    paddingHorizontal: 20,
    paddingBottom: Spacing.sm + 4,
    alignItems: 'flex-start',
  },
});

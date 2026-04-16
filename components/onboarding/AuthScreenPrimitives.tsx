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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Spacing,
  IconSize,
  FontFamily,
  FontSize,
} from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { BrandWordmark } from '@/components/ui/BrandWordmark';

export function AuthAmbientBackground() {
  return null;
}

type AuthLiquidFormCardProps = {
  children: React.ReactNode;
  isDesktop: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AuthLiquidFormCard({ children, isDesktop, style }: AuthLiquidFormCardProps) {
  return (
    <View
      style={[
        styles.formCard,
        isDesktop && styles.formCardDesktop,
        style,
      ]}
    >
      <View style={styles.formCardInner}>{children}</View>
    </View>
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
        style={[
          styles.desktopPillInner,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderRadius: Spacing.lg,
          },
        ]}
      >
        <Ionicons name="chevron-back" size={IconSize.md - 2} color={colors.text} />
        <Text style={[styles.desktopBackText, { color: colors.text }]}>{label}</Text>
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
      <Ionicons name="chevron-back" size={28} color={colors.text} />
    ) : (
      <Ionicons name="close" size={28} color={colors.text} />
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
          <BrandWordmark size="md" withTagline centered />
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
  formCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  formCardDesktop: { maxWidth: 620 },
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
  desktopPillInner: {
    alignSelf: 'flex-start',
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

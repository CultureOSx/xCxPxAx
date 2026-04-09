/**
 * LiquidGlassPanel — refractive surface stack for onboarding and hero sheets.
 *
 * - iOS: uses expo-glass-effect when the system API is available (iOS 26+), else expo-blur.
 * - Android: material-friendly blur + translucency.
 * - Web: backdrop-filter + tokenized fallback fill (see README Liquid Glass web notes).
 */

import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { glass, LiquidGlassTokens } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';

export type LiquidGlassPanelProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  bordered?: boolean;
};

export function LiquidGlassPanel({
  children,
  style,
  contentStyle,
  borderRadius = LiquidGlassTokens.corner.mainCard,
  bordered = true,
}: LiquidGlassPanelProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then(setReduceTransparency)
      .catch(() => {});
    return () => sub.remove();
  }, []);

  const borderStyle = bordered
    ? {
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: colors.borderLight,
      }
    : {};

  const shell: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    ...borderStyle,
  };

  const nativeLiquidGlass =
    Platform.OS === 'ios' && isGlassEffectAPIAvailable() && !reduceTransparency;

  if (nativeLiquidGlass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        tintColor={colors.primarySoft}
        style={[shell, style]}
      >
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      </GlassView>
    );
  }

  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const tint = isDark ? 'dark' : 'light';
    return (
      <View style={[shell, style]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? LiquidGlassTokens.blurFallback.ios : LiquidGlassTokens.blurFallback.android}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
        <View style={[{ flex: 1 }, isDark ? { backgroundColor: glass.dark.backgroundColor } : null, contentStyle]}>
          {children}
        </View>
      </View>
    );
  }

  const webGlass: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: `blur(${LiquidGlassTokens.blurFallback.webPx}px) saturate(175%)`,
          WebkitBackdropFilter: `blur(${LiquidGlassTokens.blurFallback.webPx}px) saturate(175%)`,
        } as ViewStyle)
      : {};

  const webShellStyle: StyleProp<ViewStyle> = [
    shell,
    {
      backgroundColor: isDark ? glass.ultraDark.backgroundColor : glass.ultraLight.backgroundColor,
      ...webGlass,
    },
    style,
  ];

  return (
    <View style={webShellStyle}>
      <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
    </View>
  );
}

/**
 * LiquidGlassPanel — elevated solid surface (legacy name kept for imports site-wide).
 * Uses theme surfaces + hairline border + light shadow — no blur or glassmorphism.
 */

import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LiquidGlassTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

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

  const borderStyle = bordered
    ? {
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderColor: colors.borderLight,
      }
    : {};

  const elevation =
    Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 14px rgba(0,0,0,0.08)' },
    }) ?? {};

  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          ...borderStyle,
          ...elevation,
        },
        style,
      ]}
    >
      <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
    </View>
  );
}

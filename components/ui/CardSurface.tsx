import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { ColorTheme } from '@/constants/colors';
import { CardTokens } from '@/constants/theme';

export type CardSurfaceProps = {
  colors: ColorTheme;
  children: React.ReactNode;
  borderRadius?: number;
  /** When false, outer shell has no hairline border (inner content may still define borders). */
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Opaque elevated surface — replaces liquid-glass shells on profile/settings-style screens.
 */
export function CardSurface({
  colors,
  children,
  borderRadius = CardTokens.radius,
  bordered = true,
  style,
  contentStyle,
}: CardSurfaceProps) {
  return (
    <View
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          ...(bordered
            ? {
                borderWidth: StyleSheet.hairlineWidth * 2,
                borderColor: colors.borderLight,
              }
            : {}),
        },
        style,
      ]}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

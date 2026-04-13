/**
 * Clips Liquid Glass to modal sheet radii (top-only on mobile sheet, full on desktop).
 */
// @ts-nocheck


import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';

type Props = {
  isDesktop: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EventLiquidModalBody({ isDesktop, children, style }: Props) {
  return (
    <View
      style={[
        { flex: 1, overflow: 'hidden' },
        isDesktop
          ? { borderRadius: 24 }
          : {
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            },
        style,
      ]}
    >
      <LiquidGlassPanel borderRadius={0} bordered={false} style={{ flex: 1 }} contentStyle={{ flex: 1 }}>
        {children}
      </LiquidGlassPanel>
    </View>
  );
}

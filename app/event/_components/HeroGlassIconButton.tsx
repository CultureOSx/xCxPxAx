/**
 * Circular / squircle glass control for event hero (back, share, save).
 */

import React from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeroGlassIconButton({ children, style, ...pressableProps }: Props) {
  return (
    <Pressable
      {...pressableProps}
      style={({ pressed }) => [styles.hit, { transform: [{ scale: pressed ? 0.96 : 1 }] }, style]}
    >
      <LiquidGlassPanel
        borderRadius={14}
        bordered={false}
        style={StyleSheet.absoluteFill}
        contentStyle={styles.inner}
      >
        {children}
      </LiquidGlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

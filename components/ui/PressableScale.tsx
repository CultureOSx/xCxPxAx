/**
 * PressableScale — Pressable with a Reanimated 4 spring-scale press animation.
 *
 * Usage:
 *   <PressableScale onPress={handlePress} style={styles.card}>
 *     <CardContent />
 *   </PressableScale>
 *
 * scaleTo defaults to 0.96 — a subtle but tactile feedback signal.
 * Use scaleTo={0.92} for more pronounced press feedback on large cards.
 */

import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  scaleTo?: number;
  children: React.ReactNode;
}

export function PressableScale({
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  children,
  style,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

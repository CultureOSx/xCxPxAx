/**
 * Skeleton — animated shimmer placeholder for loading states.
 *
 * Usage:
 *   <Skeleton width="100%" height={120} borderRadius={12} />
 *   <Skeleton width={200} height={16} />
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const sweep = Math.max(screenWidth, 400);
  const shimmer = useSharedValue(-sweep);

  useEffect(() => {
    shimmer.value = -sweep;
    shimmer.value = withRepeat(
      withTiming(sweep, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
    // shimmer is a stable shared value reference — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sweep]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value }],
  }));

  const baseColor = colors.surface ?? '#E5E7EB';
  const shimmerLight = colors.surfaceElevated ?? '#F3F4F6';

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius, backgroundColor: baseColor },
        style,
      ]}
    >
      <Reanimated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[baseColor + '00', shimmerLight, baseColor + '00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

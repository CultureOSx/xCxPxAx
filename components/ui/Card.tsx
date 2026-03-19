/**
 * Card — surface container with optional press, shadow, and glassmorphism.
 *
 * Usage:
 *   <Card>...</Card>
 *   <Card onPress={handlePress} shadow="medium">...</Card>
 *   <Card glass>...</Card>
 */

import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { shadows, glass, CardTokens, SpringConfig } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useColorScheme } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  onPress?: () => void;
  shadow?: keyof typeof shadows;
  /** Enable glassmorphism background */
  glass?: boolean;
  /** Enable subtle haptic feedback when card is pressed */
  haptic?: boolean;
  /** Override internal padding */
  padding?: number;
  /** Override border radius */
  radius?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function Card({
  onPress,
  shadow: shadowKey = 'medium',
  glass: isGlass = false,
  haptic = true,
  padding = CardTokens.padding,
  radius = CardTokens.radius,
  accessibilityLabel,
  accessibilityHint,
  style,
  children,
}: CardProps) {
  const colors = useColors();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const glassPreset = isDark ? glass.dark : glass.light;
  const glassStyle: { backgroundColor: string; borderColor?: string } = isGlass
    ? glassPreset
    : { backgroundColor: colors.card };

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardStyle = [
    styles.card,
    shadows[shadowKey],
    glassStyle,
    {
      borderRadius: radius,
      padding,
      borderColor: isGlass
        ? glassStyle.borderColor
        : colors.cardBorder,
      borderWidth: 1,
    },
    Platform.OS === 'web' && onPress ? (styles.webHover as object) : undefined,
    style,
  ];

  if (onPress) {
    const handleCardPress = () => {
      if (haptic && Platform.OS !== 'web') {
        Haptics.selectionAsync().catch(() => undefined);
      }
      onPress();
    };

    const handlePressIn = () => {
      scale.value = withSpring(0.97, SpringConfig.snappy);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, SpringConfig.smooth);
    };

    return (
      <AnimatedPressable
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, cardStyle] as StyleProp<ViewStyle>}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  webHover: Platform.OS === 'web'
    ? {
        // @ts-ignore — web-only hover effect
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        cursor: 'pointer',
      }
    : {},
});

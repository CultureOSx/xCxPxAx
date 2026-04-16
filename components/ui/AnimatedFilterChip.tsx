import React from 'react';
import { Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CultureTokens, FontFamily, FontSize } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface AnimatedFilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
  accentColor?: string;
}

export function AnimatedFilterChip({
  label, active, onPress, icon, accentColor = CultureTokens.indigo,
}: AnimatedFilterChipProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const bg = useSharedValue(0);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Reanimated interpolateColor on web often does not paint chip fills reliably over
  // backdrop-filter panels → illegible (near-white on white). Native keeps full tint.
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      bg.value,
      [0, 1],
      active ? [accentColor, accentColor + 'CC'] : [colors.surface, colors.surfaceElevated],
    ),
  }));

  const webChipBg = Platform.OS === 'web' ? { backgroundColor: active ? accentColor : colors.surface } : null;
  const labelColor = active ? '#fff' : colors.text;
  const iconColor = active ? '#fff' : colors.textSecondary;

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.92); bg.value = withTiming(1, { duration: 100 }); }}
      onPressOut={() => { scale.value = withSpring(1); bg.value = withTiming(0, { duration: 100 }); }}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        style={[
          s.chip,
          { borderColor: active ? accentColor : colors.borderLight },
          scaleStyle,
          Platform.OS === 'web' ? webChipBg : bgStyle,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={13}
            color={iconColor}
          />
        ) : null}
        <Text style={[s.text, { color: labelColor }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  text: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.semibold,
    lineHeight: 17,
  },
});

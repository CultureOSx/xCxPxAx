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

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      bg.value, [0, 1],
      active
        ? [accentColor, accentColor + 'CC']
        : [colors.surface, colors.surfaceElevated],
    ),
  }));

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
      <Animated.View style={[s.chip, { borderColor: active ? accentColor : colors.borderLight }, animStyle]}>
        {icon ? (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={13}
            color={active ? '#fff' : colors.textTertiary}
          />
        ) : null}
        <Text style={[s.text, { color: active ? '#fff' : colors.textSecondary }]}>{label}</Text>
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

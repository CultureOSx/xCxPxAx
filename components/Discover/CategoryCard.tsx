import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/constants/typography';
import { DISCOVER_TOKENS } from '@/components/Discover/tokens';

interface CategoryCardProps {
  item: {
    id: string;
    label: string;
    icon: string;
    color?: string;
    emoji?: string;
  };
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function CategoryCard({ item, onPress, style }: CategoryCardProps) {
  const colors = useColors();
  const accent = item.color || colors.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
        Platform.OS === 'web' && { cursor: 'pointer' as any },
        Colors.shadows.small,
        style,
      ]}
      onPress={onPress}
    >
        <View style={[styles.iconWrap, { backgroundColor: accent + '15' }]}>
        {item.emoji ? (
          <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
        ) : (
          <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={accent} />
        )}
      </View>
      <Text style={[TextStyles.chip, styles.label, { color: colors.text }]} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: DISCOVER_TOKENS.category.width,
    borderRadius: DISCOVER_TOKENS.category.radius,
    alignItems: 'center',
    paddingVertical: DISCOVER_TOKENS.category.paddingY,
    paddingHorizontal: DISCOVER_TOKENS.category.paddingX,
    borderWidth: StyleSheet.hairlineWidth,
    // backgroundColor & borderColor applied inline via useColors()
  },
  iconWrap: {
    width: DISCOVER_TOKENS.category.iconWrap,
    height: DISCOVER_TOKENS.category.iconWrap,
    borderRadius: DISCOVER_TOKENS.category.iconRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DISCOVER_TOKENS.rail.gap,
  },
  label: {
    textAlign: 'center',
    // color applied inline
  },
});

// ⚡ Bolt Optimization: Added React.memo() to prevent unnecessary re-renders in lists
export default React.memo(CategoryCard);

import React from 'react';
import { Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, CategoryColors, LiquidGlassTokens, FontFamily } from '@/constants/theme';

interface AppLink {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const APP_LINKS: AppLink[] = [
  { id: 'culture', label: 'Hubs', icon: 'earth', color: CultureTokens.teal, route: '/culture' },
  { id: 'council', label: 'My council', icon: 'map', color: CultureTokens.teal, route: '/my-council' },
  { id: 'events', label: 'Events', icon: 'calendar', color: CultureTokens.gold, route: '/events' },
  { id: 'movies', label: 'Movies', icon: 'film', color: CultureTokens.coral, route: '/movies' },
  { id: 'dining', label: 'Dining', icon: 'restaurant', color: CategoryColors.food, route: '/restaurants' },
  { id: 'activities', label: 'Activities', icon: 'compass', color: CultureTokens.teal, route: '/activities' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle', color: CategoryColors.shopping, route: '/shopping' },
  { id: 'offerings', label: 'Offers', icon: 'pricetags-outline', color: CultureTokens.gold, route: '/offerings' },
  { id: 'directory', label: 'Directory', icon: 'storefront', color: CultureTokens.indigo, route: '/(tabs)/directory' },
  { id: 'indigenous', label: 'Indigenous', icon: 'leaf', color: CultureTokens.gold, route: '/(tabs)/explore?focus=indigenous' },
  { id: 'search', label: 'Search', icon: 'search', color: CultureTokens.purple, route: '/search' },
];

export function SuperAppLinks() {
  const colors = useColors();
  const { hPad, vPad } = useLayout();

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        {
          marginHorizontal: hPad,
          marginBottom: Math.min(14, Math.round(vPad * 0.45)),
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
        },
      ]}
      style={styles.scroll}
    >
      {APP_LINKS.map((link) => (
        <Pressable
          key={link.id}
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(link.route as any);
          }}
          accessibilityRole="button"
          accessibilityLabel={link.label}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: pressed ? colors.primarySoft : colors.surfaceSecondary,
              borderColor: pressed ? link.color : colors.border,
            },
            Platform.OS === 'web' && { cursor: 'pointer' as const },
          ]}
        >
          <Ionicons
            name={link.icon}
            size={15}
            color={link.id === 'search' ? colors.textSecondary : link.color}
          />
          <Text style={[styles.label, { color: colors.text }]}>{link.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { overflow: 'visible' },
  row: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: LiquidGlassTokens.corner.mainCard,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.1,
  },
});

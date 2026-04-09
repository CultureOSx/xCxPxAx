import React from 'react';
import { Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, CategoryColors, LiquidGlassTokens } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';

interface AppLink {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const APP_LINKS: AppLink[] = [
  { id: 'culture', label: 'Hubs', icon: 'earth', color: CultureTokens.teal, route: '/culture' },
  { id: 'events', label: 'Events', icon: 'calendar', color: CultureTokens.gold, route: '/events' },
  { id: 'movies', label: 'Movies', icon: 'film', color: CultureTokens.coral, route: '/movies' },
  { id: 'dining', label: 'Dining', icon: 'restaurant', color: CategoryColors.food, route: '/restaurants' },
  { id: 'activities', label: 'Activities', icon: 'compass', color: CultureTokens.teal, route: '/activities' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle', color: CategoryColors.shopping, route: '/shopping' },
  { id: 'directory', label: 'Directory', icon: 'storefront', color: CultureTokens.indigo, route: '/(tabs)/directory' },
  { id: 'indigenous', label: 'Indigenous', icon: 'leaf', color: CultureTokens.gold, route: '/(tabs)/explore?focus=indigenous' },
  { id: 'search', label: 'Search', icon: 'search', color: CultureTokens.purple, route: '/search' },
];

export function SuperAppLinks() {
  const colors = useColors();
  const { hPad, vPad } = useLayout();

  return (
    <LiquidGlassPanel
      borderRadius={LiquidGlassTokens.corner.mainCard}
      style={[styles.glassRail, { marginHorizontal: hPad, marginBottom: Math.min(14, Math.round(vPad * 0.45)) }]}
      contentStyle={styles.glassRailInner}
    >
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
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
                backgroundColor: pressed ? `${link.color}28` : `${link.color}18`,
                borderColor: `${link.color}44`,
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
    </LiquidGlassPanel>
  );
}

const styles = StyleSheet.create({
  glassRail: {
    overflow: 'hidden',
  },
  glassRailInner: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  scroll: {},
  row: { gap: 8, paddingHorizontal: 6, alignItems: 'center' },
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
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.1,
  },
});

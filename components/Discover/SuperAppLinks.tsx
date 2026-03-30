import React from 'react';
import { Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, CategoryColors } from '@/constants/theme';

interface AppLink {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const APP_LINKS: AppLink[] = [
  { id: 'events',     label: 'Events',     icon: 'calendar',    color: CultureTokens.gold,       route: '/events' },
  { id: 'movies',     label: 'Movies',     icon: 'film',        color: CultureTokens.coral,      route: '/movies' },
  { id: 'dining',     label: 'Dining',     icon: 'restaurant',  color: '#FF9500',                route: '/restaurants' },
  { id: 'activities', label: 'Activities', icon: 'compass',     color: CultureTokens.teal,       route: '/activities' },
  { id: 'shopping',   label: 'Shopping',   icon: 'bag-handle',  color: CategoryColors.shopping,  route: '/shopping' },
  { id: 'directory',  label: 'Directory',  icon: 'storefront',  color: CultureTokens.indigo,     route: '/(tabs)/directory' },
  { id: 'indigenous', label: 'Indigenous', icon: 'leaf',        color: CultureTokens.gold,       route: '/(tabs)/explore?focus=indigenous' },
  { id: 'search',     label: 'Search',     icon: 'search',      color: '#8E8E93',                route: '/search' },
];

export function SuperAppLinks() {
  const colors  = useColors();
  const { hPad } = useLayout();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: hPad }]}
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
              backgroundColor: pressed ? link.color + '25' : link.color + '15',
              borderColor: link.color + '40',
            },
          ]}
        >
          <Ionicons name={link.icon} size={15} color={link.color} />
          <Text style={[styles.label, { color: colors.text }]}>{link.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginBottom: 8 },
  row:    { gap: 8, paddingVertical: 2 },
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

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
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
  { id: 'events',     label: 'Events',     icon: 'calendar',       color: CultureTokens.gold,        route: '/events' },
  { id: 'movies',     label: 'Movies',     icon: 'film',           color: CultureTokens.coral,       route: '/movies' },
  { id: 'dining',     label: 'Dining',     icon: 'restaurant',     color: '#FF9500',                 route: '/restaurants' },
  { id: 'activities', label: 'Activities', icon: 'compass',        color: CultureTokens.teal,        route: '/activities' },
  { id: 'shopping',   label: 'Shopping',   icon: 'bag-handle',     color: CategoryColors.shopping,   route: '/shopping' },
  { id: 'directory',  label: 'Directory',  icon: 'storefront',     color: CultureTokens.indigo,      route: '/(tabs)/directory' },
  { id: 'indigenous', label: 'Indigenous', icon: 'leaf',           color: CultureTokens.gold,        route: '/(tabs)/explore?focus=indigenous' },
  { id: 'search',     label: 'Search',     icon: 'search',         color: '#8E8E93',                             route: '/search' },
];

function AppLinkTile({ link }: { link: AppLink }) {
  const colors = useColors();
  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(link.route as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={link.label}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        pressed && styles.tilePressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: link.color + '18' }]}>
        <Ionicons name={link.icon} size={22} color={link.color} />
      </View>
      <Text style={[styles.tileLabel, { color: colors.text }]} numberOfLines={1}>
        {link.label}
      </Text>
    </Pressable>
  );
}

export function SuperAppLinks() {
  const { hPad } = useLayout();
  const rows: [AppLink[], AppLink[]] = [APP_LINKS.slice(0, 4), APP_LINKS.slice(4)];

  return (
    <View style={[styles.container, { paddingHorizontal: hPad }]}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((link) => (
            <AppLinkTile key={link.id} link={link} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8, gap: 10 },
  row:       { flexDirection: 'row', gap: 10 },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  tilePressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});

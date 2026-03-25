import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CultureTokens, CategoryColors } from '@/constants/theme';
import { FilterChipRow } from '@/components/FilterChip';

const superAppSections = [
  { id: 'indigenous', label: '🪃 Indigenous', icon: 'leaf', color: CultureTokens.gold, route: '/(tabs)/explore?focus=indigenous' },
  { id: 'movies', label: 'Movies', icon: 'film', color: CultureTokens.error, route: '/movies' },
  { id: 'restaurants', label: 'Dining', icon: 'restaurant', color: CultureTokens.gold, route: '/restaurants' },
  { id: 'activities', label: 'Activities', icon: 'compass', color: CultureTokens.success, route: '/activities' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle', color: CategoryColors.shopping, route: '/shopping' },
  { id: 'search', label: 'Search', icon: 'search', color: CultureTokens.indigo, route: '/search' },
  { id: 'events', label: 'All Events', icon: 'calendar', color: CultureTokens.gold, route: '/events' },
  { id: 'directory', label: 'Directory', icon: 'storefront', color: CultureTokens.teal, route: '/(tabs)/directory' },
] as const;

export function SuperAppLinks() {
  return (
    <View style={styles.container}>
      <FilterChipRow
        items={superAppSections.map(s => ({ 
          id: s.id, 
          label: s.label, 
          icon: s.icon, 
          color: s.color,
          backgroundColor: s.color + '15'
        }))}
        selectedId=""
        onSelect={(id) => {
          const section = superAppSections.find(s => s.id === id);
          if (section) router.push(section.route as any);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
});

import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useLayout } from '@/hooks/useLayout';
import SectionHeader from './SectionHeader';
import CategoryCard from './CategoryCard';
import { CategoryColors } from '@/constants/theme';

const CATEGORY_RAIL_SNAP_INTERVAL = 140;

const browseCategories = [
  { id: 'c1', label: 'Music', icon: 'musical-notes', color: CategoryColors.music },
  { id: 'c2', label: 'Dance', icon: 'body', color: CategoryColors.dance },
  { id: 'c3', label: 'Food', icon: 'restaurant', color: CategoryColors.food },
  { id: 'c4', label: 'Art', icon: 'color-palette', color: CategoryColors.art },
  { id: 'c5', label: 'Wellness', icon: 'heart', color: CategoryColors.wellness },
  { id: 'c6', label: 'Movies', icon: 'film', color: CategoryColors.movies },
  { id: 'c7', label: 'Workshop', icon: 'construct', color: CategoryColors.workshop },
  { id: 'c8', label: 'Heritage', icon: 'library', color: CategoryColors.heritage },
  { id: 'c9', label: 'Activities & Play', icon: 'game-controller', color: CategoryColors.activities },
  { id: 'c10', label: 'Nightlife', icon: 'moon', color: CategoryColors.nightlife },
  { id: 'c14', label: 'Featured Artists', icon: 'star', color: CategoryColors.artists },
] as const;

function CategoryRailComponent() {
  const { isDesktop } = useLayout();

  return (
    <View style={styles.container}>
      <View style={[styles.headerPad, isDesktop && { paddingHorizontal: 0 }]}>
        <SectionHeader title="Browse Categories" onSeeAll={() => router.push('/events')} />
      </View>
      <FlatList
        horizontal
        data={browseCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryCard item={item} onPress={() => router.push('/(tabs)/explore')} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollRail, { gap: 12 }, isDesktop && { paddingHorizontal: 0 }]}
        decelerationRate="fast"
        snapToInterval={CATEGORY_RAIL_SNAP_INTERVAL}
        snapToAlignment="start"
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 32 },
  headerPad: { paddingHorizontal: 20 },
  scrollRail: { paddingHorizontal: 20, gap: 16, paddingRight: 40 },
});

export const CategoryRail = React.memo(CategoryRailComponent);

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import SectionHeader from './SectionHeader';
import CategoryCard from './CategoryCard';
import { CategoryColors } from '@/constants/theme';

const browseCategories = [
  { id: 'c1',  label: 'Music',            icon: 'musical-notes',    color: CategoryColors.music },
  { id: 'c2',  label: 'Dance',            icon: 'body',             color: CategoryColors.dance },
  { id: 'c3',  label: 'Food',             icon: 'restaurant',       color: CategoryColors.food },
  { id: 'c4',  label: 'Art',              icon: 'color-palette',    color: CategoryColors.art },
  { id: 'c5',  label: 'Wellness',         icon: 'heart',            color: CategoryColors.wellness },
  { id: 'c6',  label: 'Movies',           icon: 'film',             color: CategoryColors.movies },
  { id: 'c7',  label: 'Workshop',         icon: 'construct',        color: CategoryColors.workshop },
  { id: 'c8',  label: 'Heritage',         icon: 'library',          color: CategoryColors.heritage },
  { id: 'c9',  label: 'Activities & Play',icon: 'game-controller',  color: CategoryColors.activities },
  { id: 'c10', label: 'Nightlife',        icon: 'moon',             color: CategoryColors.nightlife },
  { id: 'c14', label: 'Featured Artists', icon: 'star',             color: CategoryColors.artists },
] as const;

function CategoryRailComponent() {
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();

  return (
    <View style={[styles.container, { marginBottom: vPad }]}>
      <View style={headerPadStyle}>
        <SectionHeader title="Browse Categories" onSeeAll={() => router.push('/events')} />
      </View>
      <View style={[styles.grid, scrollPadStyle]}>
        {browseCategories.map((item) => (
          <CategoryCard
            key={item.id}
            item={item}
            onPress={() => router.push('/(tabs)/explore')}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

export const CategoryRail = React.memo(CategoryRailComponent);

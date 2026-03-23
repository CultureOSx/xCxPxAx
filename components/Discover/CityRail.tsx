import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLayout } from '@/hooks/useLayout';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/constants/typography';
import SectionHeader from './SectionHeader';

const CITY_SNAP_INTERVAL = 176;

const majorCities = [
  { id: 'syd', name: 'Sydney', country: 'Australia', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=400&q=80' },
  { id: 'mel', name: 'Melbourne', country: 'Australia', image: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=400&q=80' },
  { id: 'bne', name: 'Brisbane', country: 'Australia', image: 'https://images.unsplash.com/photo-1554030439-0bf90e2908f5?auto=format&fit=crop&w=400&q=80' },
  { id: 'per', name: 'Perth', country: 'Australia', image: 'https://images.unsplash.com/photo-1534445883836-7cd3b4eb7932?auto=format&fit=crop&w=400&q=80' },
  { id: 'adk', name: 'Adelaide', country: 'Australia', image: 'https://images.unsplash.com/photo-1558231737-293699b867ba?auto=format&fit=crop&w=400&q=80' },
];

export function CityRailComponent() {
  const { isDesktop } = useLayout();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerPad, isDesktop && { paddingHorizontal: 0 }]}>
        <SectionHeader title="Explore Cities" onSeeAll={() => {}} />
      </View>
      <FlatList
        horizontal
        data={majorCities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/city/[name]' as any, params: { name: item.name, country: item.country } });
            }}
            style={({ pressed }) => [styles.cityCard, { backgroundColor: colors.surface }, pressed && { opacity: 0.85 }]}
          >
            <Image source={{ uri: item.image }} style={styles.cityCardImg} contentFit="cover" />
            <View style={styles.cityCardOverlay} />
            <Text style={styles.cityCardName}>{item.name}</Text>
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
        snapToInterval={CITY_SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { marginBottom: 32 },
  headerPad: { paddingHorizontal: 20 },
  scrollRail: { paddingHorizontal: 20, gap: 16, paddingRight: 40 },
  cityCard: { 
    width: 160, 
    height: 100, 
    borderRadius: 16, 
    overflow: 'hidden', 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cityCardImg: { ...StyleSheet.absoluteFillObject },
  cityCardOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(11, 11, 20, 0.4)' 
  },
  cityCardName: { 
    ...TextStyles.title3, 
    color: '#FFFFFF', 
    zIndex: 1 
  },
});

export const CityRail = React.memo(CityRailComponent);

import React from 'react';
import { ScrollView, View } from 'react-native';
import SectionHeader from './SectionHeader';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { CultureCard } from './CultureCard';
import type { CultureCardModel } from '@/shared/schema';

interface CultureCardRailProps {
  title: string;
  subtitle: string;
  items: CultureCardModel[];
}

export function CultureCardRail({ title, subtitle, items }: CultureCardRailProps) {
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();

  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: vPad }}>
      <View style={headerPadStyle}>
        <SectionHeader title={title} subtitle={subtitle} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: 18 }]}
      >
        {items.map((item) => (
          <CultureCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

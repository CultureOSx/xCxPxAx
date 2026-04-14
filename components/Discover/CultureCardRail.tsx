import React from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
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
      <FlashList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CultureCard item={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={scrollPadStyle}
        ItemSeparatorComponent={() => <View style={{ width: 18 }} />}
        // @ts-expect-error FlashList type mismatch on some versions
        estimatedItemSize={248}
      />
    </View>
  );
}

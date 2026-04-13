// @ts-nocheck
import React from 'react';
import { View, ScrollView, Platform, StyleSheet, RefreshControlProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useBrowseData } from '@/hooks/useBrowseData';
import { FilterChipRow } from '@/components/FilterChip';
import { CultureTokens } from '@/constants/theme';

// Modular Components
import { BrowseHeader } from './browse/BrowseHeader';
import { PromotedRail } from './browse/PromotedRail';
import { BrowseLayout } from './browse/BrowseLayout';

export interface CategoryFilter {
  label: string;
  icon: string;
  color: string;
  count?: number;
}

export interface BrowseItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  priceLabel?: string;
  badge?: string;
  isPromoted?: boolean;
  meta?: string;
  [key: string]: any;
}

interface BrowsePageProps {
  title: string;
  tagline?: string;
  accentColor?: string;
  accentIcon?: string;
  categories: CategoryFilter[];
  categoryKey?: string;
  items: BrowseItem[];
  isLoading: boolean;
  promotedItems?: BrowseItem[];
  promotedTitle?: string;
  onItemPress: (item: BrowseItem) => void;
  renderItemExtra?: (item: BrowseItem) => React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  layout?: 'list' | 'grid';
  imageRatio?: number;
}

export default function BrowsePage({
  title,
  tagline,
  accentColor = CultureTokens.indigo,
  accentIcon = 'compass',
  categories,
  categoryKey = 'category',
  items,
  isLoading,
  promotedItems = [],
  promotedTitle = 'Popular',
  onItemPress,
  renderItemExtra,
  emptyMessage = 'Nothing found',
  emptyIcon = 'search-outline',
  refreshControl,
  layout = 'list',
  imageRatio = 1,
}: BrowsePageProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const {
    selectedCat,
    setSelectedCat,
    filteredItems,
    chipItems,
    handleItemPress,
  } = useBrowseData({
    items,
    categories,
    categoryKey,
    onItemPress,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <BrowseHeader 
        title={title} 
        tagline={tagline} 
        accentColor={accentColor} 
        accentIcon={accentIcon} 
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        refreshControl={refreshControl}
      >
        <PromotedRail 
          title={promotedTitle} 
          items={promotedItems} 
          accentColor={accentColor} 
          accentIcon={accentIcon} 
          onItemPress={handleItemPress} 
        />

        {categories.length > 0 && (
          <FilterChipRow
            items={chipItems}
            selectedId={selectedCat}
            onSelect={setSelectedCat}
          />
        )}

        <BrowseLayout 
          items={filteredItems}
          isLoading={isLoading}
          layout={layout}
          title={title}
          selectedCat={selectedCat}
          accentColor={accentColor}
          accentIcon={accentIcon}
          emptyMessage={emptyMessage}
          emptyIcon={emptyIcon}
          imageRatio={imageRatio}
          onItemPress={handleItemPress}
          onClearFilter={() => setSelectedCat('All')}
          renderItemExtra={renderItemExtra}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

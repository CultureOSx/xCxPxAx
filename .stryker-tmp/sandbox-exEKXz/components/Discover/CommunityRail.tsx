// @ts-nocheck
import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import SectionHeader from './SectionHeader';
import CommunityCard from './CommunityCard';
import { CommunityCardSkeleton } from '@/components/CommunityCardSkeleton';
import { RailErrorBanner } from './RailErrorBanner';
import type { Community } from '@/shared/schema';

const DEFAULT_SNAP_INTERVAL = 236;

interface CommunityRailProps {
  title: string;
  subtitle?: string;
  data: (Community | string)[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  snapInterval?: number;
  errorMessage?: string | null;
  onRetry?: () => void;
}

function CommunityRailComponent({
  title,
  subtitle,
  data,
  isLoading,
  onSeeAll,
  snapInterval = DEFAULT_SNAP_INTERVAL,
  errorMessage,
  onRetry,
}: CommunityRailProps) {
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();

  const hasRealItems = data.some((item) => typeof item !== 'string');

  if (!isLoading && !hasRealItems && !errorMessage) return null;

  return (
    <View style={[styles.container, { marginBottom: vPad }]}>
      <View style={headerPadStyle}>
        <SectionHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
      </View>
      {errorMessage && !isLoading && !hasRealItems ? (
        <RailErrorBanner message={errorMessage} onRetry={onRetry} />
      ) : (
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
        renderItem={({ item, index }) =>
          typeof item === 'string' ? (
            <CommunityCardSkeleton />
          ) : (
            <CommunityCard community={item} index={index} />
          )
        }
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: 22 }]}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
        getItemLayout={(_, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index,
        })}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});

export const CommunityRail = React.memo(CommunityRailComponent);

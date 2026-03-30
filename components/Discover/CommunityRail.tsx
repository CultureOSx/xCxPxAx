import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useLayout } from '@/hooks/useLayout';
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
  const { isDesktop } = useLayout();

  const hasRealItems = data.some((item) => typeof item !== 'string');

  if (!isLoading && !hasRealItems && !errorMessage) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.headerPad, isDesktop && { paddingHorizontal: 0 }]}>
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
        contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
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
  container: { marginBottom: 36 },
  headerPad: { paddingHorizontal: 20 },
  scrollRail: { paddingHorizontal: 20, gap: 22, paddingRight: 44 },
});

export const CommunityRail = React.memo(CommunityRailComponent);

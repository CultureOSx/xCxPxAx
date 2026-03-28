import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLayout } from '@/hooks/useLayout';
import SectionHeader from './SectionHeader';
import EventCard from './EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import type { EventData } from '@/shared/schema';

const DEFAULT_SNAP_INTERVAL = 254;

interface EventRailProps {
  title: string;
  subtitle?: string;
  data: (EventData | string)[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  snapInterval?: number;
  isLive?: boolean;
}

function EventRailComponent({
  title,
  subtitle,
  data,
  isLoading,
  onSeeAll,
  snapInterval = DEFAULT_SNAP_INTERVAL,
  isLive,
}: EventRailProps) {
  const { isDesktop } = useLayout();

  if (!isLoading && data.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.headerPad, isDesktop && { paddingHorizontal: 0 }]}>
        <SectionHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
      </View>
      <FlashList
        horizontal
        data={data}
        keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
        renderItem={({ item, index }) =>
          typeof item === 'string' ? (
            <EventCardSkeleton />
          ) : (
            <EventCard event={item} index={index} isLive={isLive} />
          )
        }
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        // @ts-expect-error Types for FlashList are missing estimatedItemSize in this version
        estimatedItemSize={snapInterval}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { marginBottom: 36, paddingTop: 4 },
  headerPad:  { paddingHorizontal: 20 },
  scrollRail: { paddingHorizontal: 20, gap: 14, paddingRight: 32 },
});

export const EventRail = React.memo(EventRailComponent);

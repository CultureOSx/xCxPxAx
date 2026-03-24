import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
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
      <FlatList
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 32 },
  headerPad: { paddingHorizontal: 20 },
  scrollRail: { paddingHorizontal: 20, gap: 16, paddingRight: 40 },
});

export const EventRail = React.memo(EventRailComponent);

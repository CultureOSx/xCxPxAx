import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLayout } from '@/hooks/useLayout';
import SectionHeader from './SectionHeader';
import EventCard from './EventCard';
import { EventCardSkeleton } from '@/components/EventCardSkeleton';
import { RailErrorBanner } from './RailErrorBanner';
import type { EventData } from '@/shared/schema';

/** Stacked Discover card width — match `EventCard` rail width. */
const RAIL_CARD_WIDTH = 248;
const RAIL_ITEM_GAP = 24;

interface EventRailProps {
  title: string;
  subtitle?: string;
  data: (EventData | string)[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  /** @deprecated FlashList uses ItemSeparator — kept for call-site compatibility */
  snapInterval?: number;
  isLive?: boolean;
  /** Stacked cards: LIVE + ticking “Starts in …” (Discover starting-soon rail). */
  schedulingMode?: 'default' | 'live_and_countdown';
  errorMessage?: string | null;
  onRetry?: () => void;
}

function EventRailComponent({
  title,
  subtitle,
  data,
  isLoading,
  onSeeAll,
  isLive,
  schedulingMode = 'default',
  errorMessage,
  onRetry,
}: EventRailProps) {
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
        <FlashList
          horizontal
          data={data}
          keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
          ItemSeparatorComponent={() => <View style={{ width: RAIL_ITEM_GAP }} />}
          renderItem={({ item, index }) =>
            typeof item === 'string' ? (
              <View style={{ width: RAIL_CARD_WIDTH }}>
                <EventCardSkeleton />
              </View>
            ) : (
              <EventCard
                event={item}
                index={index}
                isLive={isLive}
                layout="stacked"
                schedulingMode={schedulingMode}
              />
            )
          }
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
          snapToInterval={RAIL_CARD_WIDTH + RAIL_ITEM_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          // @ts-expect-error FlashList types omit estimatedItemSize in some versions
          estimatedItemSize={RAIL_CARD_WIDTH}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 36, paddingTop: 4 },
  headerPad: { paddingHorizontal: 20 },
  scrollRail: { paddingHorizontal: 20, paddingRight: 44 },
});

export const EventRail = React.memo(EventRailComponent);

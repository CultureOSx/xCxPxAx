import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { TextStyles } from '@/constants/typography';
import { CultureTokens } from '@/constants/theme';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { formatEventDateTime } from '@/lib/dateUtils';
import { eventListImageUrl } from '@/lib/eventImage';
import type { EventData } from '@/shared/schema';

const isWeb = Platform.OS === 'web';
const HERO_CARD_DESKTOP_WIDTH = 800;

interface HeroCarouselProps {
  events: EventData[];
  /** When true and there are no events, show skeletons instead of the empty state. */
  isLoading?: boolean;
}

function HeroCarouselComponent({ events, isLoading }: HeroCarouselProps) {
  const colors = useColors();
  const { isDesktop, width, vPad } = useLayout();
  const { pad } = useDiscoverRailInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  
  const heroCardWidth = isDesktop ? HERO_CARD_DESKTOP_WIDTH : width;
  const heroSnapInterval = isDesktop ? heroCardWidth + 20 : heroCardWidth;

  const renderFeaturedEvent = useCallback(({ item, index }: { item: EventData; index: number }) => {
    const heroUri = eventListImageUrl(item);
    return (
    <View
      style={{
        width: heroCardWidth,
        paddingHorizontal: isDesktop ? 0 : pad,
        marginRight: isDesktop && index < events.length - 1 ? 20 : 0,
      }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.heroCard,
          isDesktop && styles.heroCardDesktop,
          pressed && !isWeb && { transform: [{ scale: 0.98 }] },
          pressed && isWeb && { opacity: 0.9 },
        ]}
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
        accessibilityRole="button"
        accessibilityLabel={`Featured event: ${item.title}${item.venue ? `, at ${item.venue}` : ''}`}
        accessibilityHint="Opens event details"
      >
        {heroUri ? (
          <Image
            source={{ uri: heroUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <LinearGradient
            colors={['#2C2A72', '#2EC4B6']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)']}
          style={StyleSheet.absoluteFillObject}
          locations={[0, 0.5, 1]}
        />

        <View style={styles.heroCardBadge}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />
          <Text style={styles.heroCardBadgeText}>FEATURED</Text>
        </View>

        <View style={styles.heroCardContent}>
          <View style={styles.heroCardMetaTop}>
            <View style={[styles.heroCardPrice, { backgroundColor: (item.priceCents === 0 || item.isFree) ? CultureTokens.teal : CultureTokens.indigo }]}>
              <Text style={styles.heroCardPriceText}>
                {(item.priceCents === 0 || item.isFree) ? 'FREE' : item.priceLabel || 'TICKETS'}
              </Text>
            </View>
            <View style={styles.heroCardDateBox}>
              <Text style={styles.heroCardDateText}>{formatEventDateTime(item.date, item.time)}</Text>
            </View>
          </View>

          <Text style={styles.heroCardTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.heroCardLocationRow}>
            <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroCardLocation} numberOfLines={1}>{item.venue || item.city}</Text>
          </View>
        </View>
      </Pressable>
    </View>
    );
  }, [events.length, heroCardWidth, isDesktop, pad, styles]);

  if (events.length === 0) {
    if (isLoading) {
      return (
        <View style={[styles.container, { marginBottom: vPad }]}>
          <View style={{ paddingHorizontal: isDesktop ? 0 : pad }}>
            <Skeleton height={420} borderRadius={16} />
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.container, { marginBottom: vPad }]}>
        <View style={{ paddingHorizontal: isDesktop ? 0 : pad }}>
          <LinearGradient
            colors={['#2C2A72', '#2EC4B6']}
            style={[styles.heroCard, isDesktop && styles.heroCardDesktop]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.emptyInner}>
              <Text style={styles.emptyTitle}>{"See what's near you"}</Text>
              <Text style={styles.emptySubtitle}>
                Featured events from organisers in your city will appear here. Browse the full calendar or list your own.
              </Text>
              <View style={styles.emptyActions}>
                <Button
                  variant="gradient"
                  size="md"
                  onPress={() => router.push('/events')}
                  accessibilityLabel="Browse all events"
                >
                  Browse events
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => router.push('/submit')}
                  accessibilityLabel="Submit or list an event"
                >
                  List an event
                </Button>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { marginBottom: vPad }]}>
      <FlatList
        horizontal
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderFeaturedEvent}
        pagingEnabled={!isDesktop}
        showsHorizontalScrollIndicator={false}
        snapToInterval={heroSnapInterval}
        decelerationRate="fast"
        snapToAlignment="start"
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        getItemLayout={(_, index) => ({
          length: heroSnapInterval,
          offset: heroSnapInterval * index,
          index,
        })}
      />
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {},
  heroCard: { 
    height: 420, 
    borderRadius: 16, 
    overflow: 'hidden', 
    backgroundColor: colors.surface,
  },
  heroCardDesktop: { 
    boxShadow: '0 20px 20px rgba(0,0,0,0.25)', 
    elevation: 10 
  },
  heroCardBadge: { 
    position: 'absolute', 
    top: 20, 
    right: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    overflow: 'hidden', 
    zIndex: 2 
  },
  heroCardBadgeText: { ...TextStyles.badgeCaps, color: '#FFFFFF', letterSpacing: 1 },
  heroCardContent: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 24, 
    gap: 12 
  },
  heroCardMetaTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroCardPrice: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heroCardPriceText: { ...TextStyles.badge, color: '#FFFFFF' },
  heroCardDateBox: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)' 
  },
  heroCardDateText: { ...TextStyles.badge, color: '#FFFFFF' },
  heroCardTitle: { ...TextStyles.title, color: '#FFFFFF', lineHeight: 32 },
  heroCardLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroCardLocation: { ...TextStyles.cardTitle, color: 'rgba(255, 255, 255, 0.7)' },
  emptyInner: {
    flex: 1,
    minHeight: 360,
    padding: 28,
    justifyContent: 'center',
    gap: 14,
  },
  emptyTitle: { ...TextStyles.title, color: '#FFFFFF', textAlign: 'center' },
  emptySubtitle: {
    ...TextStyles.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 420,
    alignSelf: 'center',
  },
  emptyActions: { marginTop: 8, gap: 12, alignItems: 'stretch', maxWidth: 320, alignSelf: 'center', width: '100%' },
});

export const HeroCarousel = React.memo(HeroCarouselComponent);

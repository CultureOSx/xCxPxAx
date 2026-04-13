import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, CultureTokens, SpringConfig } from '@/constants/theme';
import { CultureTagRow } from '@/components/ui/CultureTag';
import { EventPublisherLine } from '@/components/events/EventPublisherLine';
import { DISCOVER_TOKENS } from '@/components/Discover/tokens';
import { useColors } from '@/hooks/useColors';
import {
  DISCOVER_EVENT_LIVE_WINDOW_MS,
  formatEventDateTimeBadge,
  formatStartsInCountdown,
  parseEventStartMs,
} from '@/lib/dateUtils';
import { eventListImageUrl } from '@/lib/eventImage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RAIL_CARD_WIDTH = DISCOVER_TOKENS.card.railWidth;
const RAIL_IMAGE_HEIGHT = DISCOVER_TOKENS.card.railImageHeight;

function isFreePriceLabel(label: string | undefined): boolean {
  return Boolean(label && label.trim().toLowerCase() === 'free');
}

interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    time?: string;
    venue?: string;
    city?: string;
    imageUrl?: string;
    communityId?: string;
    attending?: number;
    priceLabel?: string;
    isFeatured?: boolean;
    distanceKm?: number;
    cultureTag?: string[];
    cultureTags?: string[];
    publisherProfileId?: string;
  };
  highlight?: boolean;
  index?: number;
  isLive?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  /** `stacked` = image on top, text below (Discover rails). `overlay` = full-bleed hero (e.g. city grid). */
  layout?: 'overlay' | 'stacked';
  /**
   * When `live_and_countdown` + stacked: show LIVE (within window after start) or a ticking “Starts in …” timer.
   * Ignores `isLive` for badge logic.
   */
  schedulingMode?: 'default' | 'live_and_countdown';
}

function StackedLiveSoonSchedule({ event }: { event: EventCardProps['event'] }) {
  const [, setTick] = React.useState(0);
  const startMs = React.useMemo(() => parseEventStartMs(event.date, event.time), [event.date, event.time]);

  React.useEffect(() => {
    if (startMs == null) return;
    const bump = () => setTick((x) => x + 1);
    bump();
    const left = startMs - Date.now();
    const intervalMs = left > 3600000 ? 30000 : 1000;
    const id = setInterval(bump, intervalMs);
    return () => clearInterval(id);
  }, [startMs, event.id]);

  if (startMs == null) {
    return (
      <View style={[styles.statusBadgeStacked, { backgroundColor: CultureTokens.indigo }]}>
        <Text style={styles.statusBadgeTextDark}>Starting soon</Text>
      </View>
    );
  }

  const now = Date.now();
  const endLive = startMs + DISCOVER_EVENT_LIVE_WINDOW_MS;

  if (now >= startMs && now < endLive) {
    return (
      <View style={[styles.statusBadgeStacked, { backgroundColor: CultureTokens.error }]}>
        <View style={styles.pulseDot} />
        <Text style={styles.statusBadgeTextDark}>LIVE</Text>
      </View>
    );
  }

  if (now < startMs) {
    return (
      <View
        style={[
          styles.countdownRow,
          { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '33' },
        ]}
        accessibilityRole="timer"
        accessibilityLabel={`Starts in ${formatStartsInCountdown(startMs - now)}`}
      >
        <Ionicons name="time-outline" size={16} color={CultureTokens.indigo} />
        <Text style={[styles.countdownLabel, { color: CultureTokens.indigo }]} numberOfLines={1}>
          Starts in {formatStartsInCountdown(startMs - now)}
        </Text>
      </View>
    );
  }

  return null;
}

function OverlayCardContent({
  event,
  highlight,
  colors,
  isLive,
}: Pick<EventCardProps, 'event' | 'highlight' | 'isLive'> & { colors: ReturnType<typeof useColors> }) {
  const now = new Date();
  const eventDate = new Date(event.date);
  const isToday = eventDate.toDateString() === now.toDateString();
  const isStartingNext = !isLive && isToday;

  return (
    <View style={styles.centeredContent}>
      {isLive ? (
        <View style={[styles.statusBadge, { backgroundColor: CultureTokens.error }]}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusBadgeText}>now live</Text>
        </View>
      ) : isStartingNext ? (
        <View style={[styles.statusBadge, { backgroundColor: CultureTokens.indigo }]}>
          <Text style={styles.statusBadgeText}>Starting next</Text>
        </View>
      ) : null}

      <Text style={[styles.dateText, highlight && styles.dateHighlight]}>
        {formatEventDateTimeBadge(event.date, event.time)}
      </Text>

      <Text style={[styles.titleText, highlight && styles.titleHighlight]} numberOfLines={2}>
        {event.title}
      </Text>

      <View style={styles.metaRowCentered}>
        <Ionicons name="location" size={12} color={`${colors.textInverse}CC`} />
        <Text style={[styles.locationText, { color: `${colors.textInverse}E6` }]} numberOfLines={1}>
          {event.venue || event.city}
        </Text>
      </View>

      {event.publisherProfileId ? (
        <EventPublisherLine profileId={event.publisherProfileId} variant="onDark" />
      ) : null}

      {event.priceLabel && (
        <View
          style={[
            styles.pricePill,
            isFreePriceLabel(event.priceLabel) && {
              backgroundColor: CultureTokens.teal + 'E6',
              borderColor: CultureTokens.teal + 'AA',
            },
          ]}
        >
          <Text style={styles.pricePillText}>{event.priceLabel}</Text>
        </View>
      )}
    </View>
  );
}

function StackedCardContent({
  event,
  highlight,
  colors,
  isLive,
  schedulingMode = 'default',
}: Pick<EventCardProps, 'event' | 'highlight' | 'isLive' | 'schedulingMode'> & { colors: ReturnType<typeof useColors> }) {
  const now = new Date();
  const eventDate = new Date(event.date);
  const isToday = eventDate.toDateString() === now.toDateString();
  const isStartingNext = !isLive && isToday;

  const liveOrNextBadge = schedulingMode === 'live_and_countdown' ? (
    <StackedLiveSoonSchedule event={event} />
  ) : isLive ? (
    <View style={[styles.statusBadgeStacked, { backgroundColor: CultureTokens.error }]}>
      <View style={styles.pulseDot} />
      <Text style={styles.statusBadgeTextDark}>now live</Text>
    </View>
  ) : isStartingNext ? (
    <View style={[styles.statusBadgeStacked, { backgroundColor: CultureTokens.indigo }]}>
      <Text style={styles.statusBadgeTextDark}>Starting next</Text>
    </View>
  ) : null;

  return (
    <View style={styles.stackedBody}>
      {liveOrNextBadge}
      <Text style={[styles.stackedDate, { color: CultureTokens.gold }]}>
        {formatEventDateTimeBadge(event.date, event.time)}
      </Text>
      <Text
        style={[styles.stackedTitle, { color: colors.text }, highlight && styles.stackedTitleHi]}
        numberOfLines={2}
      >
        {event.title}
      </Text>
      <View style={styles.stackedMetaRow}>
        <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
        <Text style={[styles.stackedLocation, { color: colors.textSecondary }]} numberOfLines={1}>
          {event.venue || event.city || ' '}
        </Text>
      </View>
      {event.publisherProfileId ? (
        <View style={styles.stackedPublisherRow}>
          <EventPublisherLine profileId={event.publisherProfileId} variant="compact" />
        </View>
      ) : null}
      {event.priceLabel ? (
        <View>
          <View
            style={[
              styles.stackedPricePill,
              { borderColor: colors.border, backgroundColor: colors.backgroundSecondary },
              isFreePriceLabel(event.priceLabel) && {
                backgroundColor: CultureTokens.teal + '22',
                borderColor: CultureTokens.teal + '55',
              },
            ]}
          >
            <Text style={[styles.stackedPriceText, { color: colors.text }]}>{event.priceLabel}</Text>
          </View>
        </View>
      ) : null}
      {(() => {
        const tags = Array.from(new Set([...(event.cultureTag ?? []), ...(event.cultureTags ?? [])]));
        return tags.length > 0 ? <CultureTagRow tags={tags} max={2} /> : null;
      })()}
    </View>
  );
}

function EventCard({
  event,
  highlight,
  index = 0,
  isLive,
  containerWidth,
  containerHeight,
  layout = 'overlay',
  schedulingMode = 'default',
}: EventCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, SpringConfig.snappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.smooth);
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const cardWidth = containerWidth ?? (layout === 'stacked'
    ? RAIL_CARD_WIDTH
    : DISCOVER_TOKENS.card.overlayWidth);
  const displayImageUri = eventListImageUrl(event);

  if (layout === 'stacked') {
    return (
      <View>
        <AnimatedPressable
          style={[
            styles.stackedCard,
            { width: cardWidth, backgroundColor: colors.surface },
            highlight && styles.stackedHighlight,
            animatedStyle,
            Platform.OS === 'web' && { cursor: 'pointer' as const },
            isHovered && Platform.OS === 'web' && {
              transform: [{ scale: 1.02 }],
              boxShadow: '0px 12px 28px rgba(0,0,0,0.14)',
            },
            Colors.shadows.medium,
          ]}
          onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          {...({
            onHoverIn: () => setIsHovered(true),
            onHoverOut: () => setIsHovered(false),
          } as Record<string, unknown>)}
          accessibilityRole="button"
          accessibilityLabel={`${event.title}, ${formatEventDateTimeBadge(event.date, event.time)}`}
          accessibilityHint="Opens event details"
        >
          <View style={{ position: 'relative' }}>
            {displayImageUri ? (
              <Image
                source={{ uri: displayImageUri }}
                style={[styles.stackedImage, { height: RAIL_IMAGE_HEIGHT, backgroundColor: colors.backgroundSecondary }]}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View
                style={[styles.stackedImage, { height: RAIL_IMAGE_HEIGHT, backgroundColor: colors.backgroundSecondary }]}
                accessibilityElementsHidden
              />
            )}
            {/* Minimal UI: Remove rank and featured badge for clarity */}
          </View>
          <StackedCardContent
            event={event}
            highlight={highlight}
            colors={colors}
            isLive={isLive}
            schedulingMode={schedulingMode}
          />
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View>
      <AnimatedPressable
        style={[
          styles.card,
          { backgroundColor: colors.surface },
          containerWidth ? { width: containerWidth } : null,
          containerHeight ? { height: containerHeight, minHeight: 280 } : null,
          highlight && styles.highlight,
          animatedStyle,
          Platform.OS === 'web' && {
            cursor: 'pointer' as const,
            transition: 'all 0.3s ease',
          },
          isHovered &&
            Platform.OS === 'web' && {
              transform: [{ scale: 1.02 }],
              boxShadow: '0px 12px 30px rgba(0,0,0,0.25)',
            },
          Colors.shadows.medium,
        ]}
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...({
          onHoverIn: () => setIsHovered(true),
          onHoverOut: () => setIsHovered(false),
        } as Record<string, unknown>)}
        accessibilityRole="button"
        accessibilityLabel={`${event.title}, ${formatEventDateTimeBadge(event.date, event.time)}`}
        accessibilityHint="Opens event details"
      >
        {displayImageUri ? (
          <Image
            source={{ uri: displayImageUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.backgroundSecondary }]} />
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.92)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.contentContainer}>
          <OverlayCardContent event={event} highlight={highlight} colors={colors} isLive={isLive} />
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: DISCOVER_TOKENS.card.overlayWidth,
    height: DISCOVER_TOKENS.card.overlayHeight,
    borderRadius: DISCOVER_TOKENS.card.radius,
    overflow: 'hidden',
    // Minimal shadow for clarity
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  stackedCard: {
    borderRadius: DISCOVER_TOKENS.card.radius,
    overflow: 'hidden',
    marginBottom: 2,
  },
  stackedHighlight: {
    borderWidth: 2,
    borderColor: CultureTokens.gold,
  },
  stackedImage: {
    width: '100%',
    borderTopLeftRadius: DISCOVER_TOKENS.card.radius,
    borderTopRightRadius: DISCOVER_TOKENS.card.radius,
  },
  stackedBody: {
    paddingHorizontal: DISCOVER_TOKENS.card.contentPadding - 2,
    paddingTop: DISCOVER_TOKENS.rail.gap,
    paddingBottom: DISCOVER_TOKENS.card.contentPadding,
    alignItems: 'flex-start',
    gap: DISCOVER_TOKENS.card.bodyGap,
  },
  stackedDate: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stackedTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
    marginBottom: 2,
  },
  stackedTitleHi: {
    fontSize: 17,
    lineHeight: 24,
  },
  stackedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    marginTop: 2,
    marginBottom: 2,
  },
  stackedPublisherRow: {
    alignSelf: 'stretch',
    marginTop: -2,
    marginBottom: 2,
  },
  stackedLocation: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 1,
    color: '#888',
  },
  stackedPricePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: '#F5F5F5',
    marginTop: 2,
  },
  stackedPriceText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#222',
  },
  // Removed featuredBadge and rankBadge for minimalism
  statusBadgeStacked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 2,
    backgroundColor: '#F5F5F5',
  },
  statusBadgeTextDark: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: '#222',
    letterSpacing: 0.3,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
    width: '100%',
    maxWidth: '100%',
  },
  countdownLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  highlight: {
    width: '100%',
    height: DISCOVER_TOKENS.card.overlayHighlightHeight,
    borderWidth: 2,
    borderColor: CultureTokens.gold,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DISCOVER_TOKENS.card.contentPadding,
    paddingTop: 32,
  },
  centeredContent: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: CultureTokens.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  dateHighlight: {
    fontSize: 13,
  },
  titleText: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
  },
  titleHighlight: {
    fontSize: 20,
    lineHeight: 26,
  },
  metaRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    maxWidth: '90%',
  },
  pricePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  pricePillText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#FFF',
  },
});

export default React.memo(EventCard);

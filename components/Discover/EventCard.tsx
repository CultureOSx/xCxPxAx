import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, CultureTokens, CardTokens, SpringConfig } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { formatEventDateTimeBadge } from '@/lib/dateUtils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GlassBadge({ children, style }: { children: React.ReactNode, style?: any }) {
  return (
    <View style={[styles.glassBadgeBase, style]}>
      {Platform.OS !== 'android' ? (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,11,20,0.85)' }]} />
      )}
      {children}
    </View>
  );
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
  };
  highlight?: boolean;
  index?: number;
  isLive?: boolean;
}

function CardContent({
  event,
  highlight,
  colors,
}: Pick<EventCardProps, 'event' | 'highlight'> & { colors: ReturnType<typeof useColors> }) {
  return (
    <>
      {event.priceLabel && (
        <View style={styles.priceBadge}>
          <Text style={[styles.priceBadgeText, { color: colors.background }]}>{event.priceLabel}</Text>
        </View>
      )}
      <GlassBadge style={styles.dateRibbon}>
        <Text style={[styles.date, highlight && styles.dateHighlight]}>
          {formatEventDateTimeBadge(event.date, event.time)}
        </Text>
      </GlassBadge>
      <GlassBadge>
        <Text style={[styles.title, highlight && styles.titleHighlight]} numberOfLines={2}>
          {event.title}
        </Text>
      </GlassBadge>
      <GlassBadge style={styles.metaRibbon}>
        <View style={styles.metaRow}>
          <Ionicons name="location" size={13} color={`${colors.textInverse}CC`} />
          <Text style={[styles.location, { color: `${colors.textInverse}E6` }]} numberOfLines={1}>
            {event.venue || event.city}
          </Text>
          {event.attending != null && event.attending > 0 && (
            <View style={[styles.attendingBadge, { backgroundColor: `${colors.textInverse}26` }]}>
              <Ionicons name="people" size={11} color={`${colors.textInverse}BF`} />
              <Text style={[styles.attendingText, { color: `${colors.textInverse}D9` }]}>{event.attending}</Text>
            </View>
          )}
        </View>
      </GlassBadge>
      {event.communityId ? (
        <GlassBadge style={styles.culturePill}>
          <Text style={styles.culturePillText}>{event.communityId}</Text>
        </GlassBadge>
      ) : null}
      {typeof event.distanceKm === 'number' ? (
        <GlassBadge style={styles.distancePill}>
          <Ionicons name="navigate" size={11} color={`${colors.textInverse}E6`} />
          <Text style={[styles.distancePillText, { color: `${colors.textInverse}E6` }]}>{event.distanceKm.toFixed(1)} km away</Text>
        </GlassBadge>
      ) : null}
    </>
  );
}

function EventCard({ event, highlight, index = 0, isLive }: EventCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.97, SpringConfig.snappy); };
  const handlePressOut = () => { scale.value = withSpring(1, SpringConfig.smooth); };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <View>
      <AnimatedPressable
        style={[
          styles.card,
          { backgroundColor: colors.surface },
          highlight && styles.highlight,
          animatedStyle,
          Platform.OS === 'web' && { cursor: 'pointer' as any },
          isHovered && Platform.OS === 'web' && { transform: [{ scale: 1.02 }] },
          Colors.shadows.medium,
        ]}
        onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...({
          onHoverIn: () => setIsHovered(true),
          onHoverOut: () => setIsHovered(false),
        } as any)}
        accessibilityLabel={`${event.title}, ${formatEventDateTimeBadge(event.date)}`}
      >
        <Image
          source={{ uri: event.imageUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={150}
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.05)', colors.overlay]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          <CardContent event={event} highlight={highlight} colors={colors} />
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    height: 260,
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
  },
  highlight: {
    width: '100%',
    height: 320,
    borderWidth: 1.5,
    borderColor: CultureTokens.gold,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 32,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: CultureTokens.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  priceBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  glassBadgeBase: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(11,11,20,0.5)' : 'transparent',
  },
  dateRibbon: {
    paddingVertical: 4,
  },
  metaRibbon: {
    marginBottom: 8,
  },
  date: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: CultureTokens.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateHighlight: {
    fontSize: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    lineHeight: 21,
  },
  titleHighlight: {
    fontSize: 18,
    lineHeight: 25,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  location: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  attendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  attendingText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  culturePill: {
    paddingVertical: 5,
  },
  culturePillText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  distancePillText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  liveBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 94, 91, 0.9)', // Movement Coral
    zIndex: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

// ⚡ Bolt Optimization: Added React.memo() to prevent unnecessary re-renders in lists
export default React.memo(EventCard);

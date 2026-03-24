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
  containerWidth?: number;
  containerHeight?: number;
}

function CardContent({
  event,
  highlight,
  colors,
  isLive,
}: Pick<EventCardProps, 'event' | 'highlight' | 'isLive'> & { colors: ReturnType<typeof useColors> }) {
  // Logic for "Starting Next" if not live
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

      {event.priceLabel && (
        <View style={styles.pricePill}>
          <Text style={styles.pricePillText}>{event.priceLabel}</Text>
        </View>
      )}
    </View>
  );
}

function EventCard({ event, highlight, index = 0, isLive, containerWidth, containerHeight }: EventCardProps) {
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
          containerWidth ? { width: containerWidth } : null,
          containerHeight ? { height: containerHeight, minHeight: 280 } : null,
          highlight && styles.highlight,
          animatedStyle,
          Platform.OS === 'web' && { 
            cursor: 'pointer' as any,
            transition: 'all 0.3s ease',
          },
          isHovered && Platform.OS === 'web' && { 
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
        } as any)}
        accessibilityLabel={`${event.title}, ${formatEventDateTimeBadge(event.date)}`}
      >
        <Image
          source={{ uri: event.imageUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={300}
        />

        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.92)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.contentContainer}>
          <CardContent event={event} highlight={highlight} colors={colors} isLive={isLive} />
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  highlight: {
    width: '100%',
    height: 320,
    borderWidth: 2,
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
  glassBadgeBase: {
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
});

// ⚡ Bolt Optimization: Added React.memo() to prevent unnecessary re-renders in lists
export default React.memo(EventCard);

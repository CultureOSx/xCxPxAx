import React, { useEffect, useRef } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CardTokens, Colors, CultureTokens } from '@/constants/theme';
import { withAlpha } from '@/lib/withAlpha';
import { useColors } from '@/hooks/useColors';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { captureEvent } from '@/lib/analytics';
import type { DiscoverArtistHighlight } from '@/shared/schema';
import SectionHeader from './SectionHeader';
import { RailErrorBanner } from './RailErrorBanner';
import { Skeleton } from '@/components/ui/Skeleton';

const CARD_WIDTH = 252;
const IMAGE_HEIGHT = 158;
const ITEM_GAP = 18;
const SNAP = CARD_WIDTH + ITEM_GAP;
const SKELETON_KEYS = ['a1', 'a2', 'a3', 'a4'] as const;

const SECTION_EYEBROW = 'Spotlight';
const SECTION_TITLE = 'Featured artists';
const SECTION_SUBTITLE =
  'Editorial picks — open a profile or jump into a themed Explore view.';

interface FeaturedArtistRailProps {
  data: DiscoverArtistHighlight[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

function FeaturedArtistSkeletonCard() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { width: CARD_WIDTH, backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
    >
      <View style={[styles.accentRail, { backgroundColor: colors.border }]} />
      <View style={styles.cardMain}>
        <Skeleton width="100%" height={IMAGE_HEIGHT} borderRadius={0} />
        <View style={styles.skeletonBody}>
          <Skeleton width="88%" height={15} borderRadius={6} />
          <Skeleton width="58%" height={13} borderRadius={6} />
          <Skeleton width="100%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
          <Skeleton width="100%" height={36} borderRadius={12} style={{ marginTop: 12 }} />
        </View>
      </View>
    </View>
  );
}

function FeaturedArtistRailComponent({ data, isLoading, errorMessage, onRetry }: FeaturedArtistRailProps) {
  const colors = useColors();
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();
  const lastImpressionKey = useRef<string>('');

  useEffect(() => {
    const impressionKey = data.map((item) => item.id).join('|');
    if (!impressionKey || lastImpressionKey.current === impressionKey) return;
    lastImpressionKey.current = impressionKey;
    captureEvent('discover_featured_artists_impression', {
      rail: 'featured_artists',
      itemIds: data.map((item) => item.id),
      count: data.length,
    });
  }, [data]);

  const sectionHeaderProps = {
    eyebrow: SECTION_EYEBROW,
    title: SECTION_TITLE,
    subtitle: SECTION_SUBTITLE,
    accentColor: CultureTokens.coral,
    seeAllLabel: 'Explore',
  } as const;

  if (errorMessage && !isLoading && data.length === 0) {
    return (
      <View style={[styles.container, { marginBottom: vPad }]}>
        <View style={headerPadStyle}>
          <SectionHeader {...sectionHeaderProps} />
        </View>
        <RailErrorBanner message={errorMessage} onRetry={onRetry} />
      </View>
    );
  }

  if (!isLoading && data.length === 0) return null;

  const handlePress = (item: DiscoverArtistHighlight) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    captureEvent('discover_featured_artist_tap', {
      rail: 'featured_artists',
      itemId: item.id,
      routeType: item.route.type,
      routeId: item.route.type === 'artist' ? item.route.id : undefined,
      focus: item.route.type === 'explore' ? item.route.focus : undefined,
      source: item.source,
    });

    if (item.route.type === 'artist') {
      router.push({
        pathname: '/artist/[id]',
        params: { id: item.route.id, source: 'featured_artist', featuredArtistId: item.id },
      });
      return;
    }

    router.push({
      pathname: '/explore',
      params: { focus: item.route.focus, source: 'featured_artist', featuredArtistId: item.id },
    });
  };

  const seeAllExplore = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    captureEvent('discover_featured_artists_see_all', { rail: 'featured_artists' });
    router.push({
      pathname: '/explore',
      params: { focus: 'music', source: 'featured_artists_see_all' },
    });
  };

  return (
    <View style={[styles.container, { marginBottom: vPad }]}>
      <View style={headerPadStyle}>
        <SectionHeader {...sectionHeaderProps} onSeeAll={seeAllExplore} />
      </View>
      <FlatList<DiscoverArtistHighlight | string>
        horizontal
        data={isLoading && data.length === 0 ? [...SKELETON_KEYS] : data}
        keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
        renderItem={({ item }) =>
          typeof item === 'string' ? (
            <FeaturedArtistSkeletonCard />
          ) : (
            <Pressable
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityHint={
                item.route.type === 'artist'
                  ? 'Opens the artist profile.'
                  : 'Opens Explore with filters for this theme.'
              }
              accessibilityLabel={`${item.name}. ${item.subtitle}. ${item.meta}`}
              style={({ pressed }) => [
                styles.card,
                {
                  width: CARD_WIDTH,
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
                pressed && { opacity: 0.94 },
                Platform.OS === 'web' && { cursor: 'pointer' as const },
                Colors.shadows.medium,
              ]}
            >
              <View style={[styles.accentRail, { backgroundColor: item.accentColor }]} />
              <View style={styles.cardMain}>
                <View style={styles.imageBlock}>
                  <Image
                    source={item.imageUrl ? { uri: item.imageUrl } : undefined}
                    style={[styles.cardImage, { backgroundColor: colors.backgroundSecondary }]}
                    contentFit="cover"
                    transition={200}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.55)']}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                  <View style={styles.imageBadge}>
                    <Ionicons name="star" size={11} color="#fff" />
                    <Text style={styles.imageBadgeText}>Pick</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.artistName, { color: colors.text }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.roleRow}>
                    <Ionicons name="mic-outline" size={14} color={item.accentColor} />
                    <Text style={[styles.artistSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Text style={[styles.artistMeta, { color: colors.textTertiary }]} numberOfLines={2}>
                    {item.meta}
                  </Text>
                  <View
                    style={[
                      styles.ctaPill,
                      {
                        backgroundColor: withAlpha(item.accentColor, 0.14),
                        borderColor: withAlpha(item.accentColor, 0.35),
                      },
                    ]}
                  >
                    <Text style={[styles.ctaPillText, { color: item.accentColor }]}>{item.ctaLabel}</Text>
                    <Ionicons name="arrow-forward" size={15} color={item.accentColor} />
                  </View>
                </View>
              </View>
            </Pressable>
          )
        }
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: ITEM_GAP }]}
        snapToInterval={SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 2 },
  card: {
    flexDirection: 'row',
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  accentRail: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  imageBlock: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  imageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.6,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 6,
  },
  skeletonBody: {
    padding: 14,
    gap: 8,
    width: '100%',
  },
  artistName: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artistSubtitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 18,
  },
  artistMeta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 17,
  },
  ctaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ctaPillText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.15,
    flex: 1,
  },
});

export const FeaturedArtistRail = React.memo(FeaturedArtistRailComponent);

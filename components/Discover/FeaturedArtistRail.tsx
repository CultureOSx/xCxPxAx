import React, { useEffect, useRef } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CardTokens, Colors, CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { captureEvent } from '@/lib/analytics';
import type { DiscoverArtistHighlight } from '@/shared/schema';
import SectionHeader from './SectionHeader';
import { RailErrorBanner } from './RailErrorBanner';
import { Skeleton } from '@/components/ui/Skeleton';

const CARD_WIDTH = 230;
const IMAGE_HEIGHT = 142;
const ITEM_GAP = 20;
const SNAP = CARD_WIDTH + ITEM_GAP;
const SKELETON_KEYS = ['a1', 'a2', 'a3', 'a4'] as const;

interface FeaturedArtistRailProps {
  data: DiscoverArtistHighlight[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

function FeaturedArtistSkeletonCard() {
  const colors = useColors();
  return (
    <View style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.surface }]}>
      <Skeleton width="100%" height={IMAGE_HEIGHT} borderRadius={0} />
      <View style={styles.skeletonBody}>
        <Skeleton width="88%" height={15} borderRadius={6} />
        <Skeleton width="58%" height={13} borderRadius={6} />
        <Skeleton width="100%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
        <Skeleton width={90} height={14} borderRadius={6} style={{ marginTop: 10 }} />
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

  if (errorMessage && !isLoading && data.length === 0) {
    return (
      <View style={[styles.container, { marginBottom: vPad }]}>
        <View style={headerPadStyle}>
          <SectionHeader
            title="Featured Artists"
            subtitle="Creators shaping the sound and spirit of your city"
          />
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
        <SectionHeader
          title="Featured Artists"
          subtitle="Creators shaping the sound and spirit of your city"
          onSeeAll={seeAllExplore}
        />
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
              accessibilityLabel={`${item.name}. ${item.ctaLabel}`}
              style={({ pressed }) => [
                styles.card,
                { width: CARD_WIDTH, backgroundColor: colors.surface, borderColor: colors.borderLight },
                pressed && { opacity: 0.92 },
                Platform.OS === 'web' && { cursor: 'pointer' as const },
                Colors.shadows.medium,
              ]}
            >
              <View style={[styles.accentTopBar, { backgroundColor: item.accentColor }]} />
              <Image
                source={item.imageUrl ? { uri: item.imageUrl } : undefined}
                style={[styles.cardImage, { height: IMAGE_HEIGHT, backgroundColor: colors.backgroundSecondary }]}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.cardBody}>
                <Text style={[styles.artistName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.artistSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.subtitle}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="sparkles" size={13} color={CultureTokens.gold} />
                  <Text style={[styles.artistMeta, { color: colors.textTertiary }]} numberOfLines={2}>
                    {item.meta}
                  </Text>
                </View>
                <View style={[styles.ctaRow, { borderTopColor: colors.borderLight }]}>
                  <Text style={[styles.ctaText, { color: item.accentColor }]}>{item.ctaLabel}</Text>
                  <Ionicons name="chevron-forward" size={16} color={item.accentColor} />
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
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  accentTopBar: {
    width: '100%',
    height: 4,
  },
  cardImage: {
    width: '100%',
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 5,
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
  artistSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  artistMeta: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 17,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.2,
  },
});

export const FeaturedArtistRail = React.memo(FeaturedArtistRailComponent);

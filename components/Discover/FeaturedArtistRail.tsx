import React, { useEffect, useRef } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CardTokens, Colors, CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { captureEvent } from '@/lib/analytics';
import type { DiscoverArtistHighlight } from '@/shared/schema';
import SectionHeader from './SectionHeader';

const DEFAULT_SNAP_INTERVAL = 212;

interface FeaturedArtistRailProps {
  data: DiscoverArtistHighlight[];
}

function FeaturedArtistRailComponent({ data }: FeaturedArtistRailProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();
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

  if (data.length === 0) return null;

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

  return (
    <View style={styles.container}>
      <View style={[styles.headerPad, isDesktop && { paddingHorizontal: 0 }]}>
        <SectionHeader
          title="Featured Artists"
          subtitle="Creators shaping the sound and spirit of your city"
        />
      </View>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
            style={({ pressed }) => [
              styles.card,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
              Platform.OS === 'web' && { cursor: 'pointer' as const },
            ]}
          >
            <Image
              source={item.imageUrl ? { uri: item.imageUrl } : undefined}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={150}
            />
            <LinearGradient
              colors={['transparent', 'rgba(11,11,20,0.8)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[styles.accentBar, { backgroundColor: item.accentColor }]} />
            <View style={[styles.ctaPill, { backgroundColor: CultureTokens.indigo }]}>
              <Text style={styles.ctaLabel}>{item.ctaLabel}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.artistName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.artistSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="sparkles" size={12} color={colors.textSecondary} />
                <Text style={[styles.artistMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.meta}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
        snapToInterval={DEFAULT_SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: DEFAULT_SNAP_INTERVAL,
          offset: DEFAULT_SNAP_INTERVAL * index,
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
  card: {
    width: 196,
    height: 248,
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: CultureTokens.indigo,
    ...Colors.shadows.medium,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  ctaPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaLabel: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 14,
  },
  content: {
    padding: 16,
    gap: 4,
  },
  artistName: {
    color: 'white',
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
  },
  artistSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  artistMeta: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
});

export const FeaturedArtistRail = React.memo(FeaturedArtistRailComponent);

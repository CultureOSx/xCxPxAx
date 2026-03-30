import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CardTokens, Colors, CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { captureEvent } from '@/lib/analytics';
import type { HeritagePlaylistEntry } from '@/shared/schema';
import SectionHeader from './SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';

const CARD_WIDTH = 236;
const IMAGE_HEIGHT = 148;
const ITEM_GAP = 22;
const SNAP = CARD_WIDTH + ITEM_GAP;
const SKELETON_KEYS = ['h1', 'h2', 'h3', 'h4'] as const;

interface HeritagePlaylistRailProps {
  data: HeritagePlaylistEntry[];
  isLoading?: boolean;
}

function HeritageSkeletonCard() {
  const colors = useColors();
  return (
    <View style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.surface }]}>
      <Skeleton width="100%" height={IMAGE_HEIGHT} borderRadius={0} />
      <View style={styles.skeletonBody}>
        <Skeleton width={72} height={22} borderRadius={8} />
        <Skeleton width="92%" height={16} borderRadius={6} />
        <Skeleton width="48%" height={13} borderRadius={6} />
        <Skeleton width="70%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

function HeritagePlaylistRailComponent({ data, isLoading }: HeritagePlaylistRailProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const lastImpressionKey = useRef<string>('');

  useEffect(() => {
    const impressionKey = data.map((item) => item.id).join('|');
    if (!impressionKey || lastImpressionKey.current === impressionKey) return;
    lastImpressionKey.current = impressionKey;
    captureEvent('discover_heritage_playlist_impression', {
      rail: 'heritage_playlist',
      itemIds: data.map((item) => item.id),
      count: data.length,
    });
  }, [data]);

  const openListenUrl = useCallback(async (url: string, itemId: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    captureEvent('discover_heritage_playlist_listen_external', { itemId });
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      /* ignore */
    }
  }, []);

  if (!isLoading && data.length === 0) return null;

  const handleCardPress = (item: HeritagePlaylistEntry) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();

    captureEvent('discover_heritage_playlist_tap', {
      rail: 'heritage_playlist',
      itemId: item.id,
      focus: item.focus,
      typeLabel: item.typeLabel,
      culture: item.culture,
      isLive: item.isLive ?? false,
    });

    router.push({
      pathname: '/explore',
      params: { focus: item.focus, source: 'heritage_playlist', playlistId: item.id },
    });
  };

  const seeAllExplore = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    captureEvent('discover_heritage_playlist_see_all', { rail: 'heritage_playlist' });
    router.push({
      pathname: '/explore',
      params: { focus: 'heritage', source: 'heritage_playlist_see_all' },
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerPad, isDesktop && { paddingHorizontal: 0 }]}>
        <SectionHeader
          title="Heritage Playlist"
          subtitle="Curated listening that opens into matching cultural discovery"
          onSeeAll={seeAllExplore}
        />
      </View>
      <FlatList<HeritagePlaylistEntry | string>
        horizontal
        data={isLoading && data.length === 0 ? [...SKELETON_KEYS] : data}
        keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
        renderItem={({ item }) =>
          typeof item === 'string' ? (
            <HeritageSkeletonCard />
          ) : (
            <Pressable
              onPress={() => handleCardPress(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title} by ${item.artist}. Opens matching culture in Explore.`}
              style={({ pressed }) => [
                styles.card,
                { width: CARD_WIDTH, backgroundColor: colors.surface, borderColor: colors.borderLight },
                pressed && { opacity: 0.92 },
                Platform.OS === 'web' && { cursor: 'pointer' as const },
                Colors.shadows.medium,
              ]}
            >
              <View style={[styles.accentTopBar, { backgroundColor: item.accentColor }]} />
              <View style={styles.imageWrap}>
                <Image
                  source={item.imageUrl ? { uri: item.imageUrl } : undefined}
                  style={[styles.cardImage, { backgroundColor: colors.backgroundSecondary }]}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.imageOverlayRow}>
                  <View style={[styles.typePill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <Text style={styles.typePillText}>{item.typeLabel}</Text>
                  </View>
                  {item.isLive ? (
                    <View style={[styles.livePill, { backgroundColor: CultureTokens.coral }]}>
                      <Ionicons name="radio" size={10} color="white" />
                      <Text style={styles.livePillText}>LIVE</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.playFab}>
                  <Ionicons name={item.isLive ? 'radio' : 'play'} size={20} color="white" />
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.artist}
                </Text>
                <Text style={[styles.cultureLine, { color: colors.textTertiary }]} numberOfLines={1}>
                  {item.culture} · tap for matching culture in Explore
                </Text>
                <View style={[styles.footerRow, { borderTopColor: colors.borderLight }]}>
                  <View style={styles.discoverHint}>
                    <Ionicons name="compass-outline" size={15} color={CultureTokens.teal} />
                    <Text style={[styles.discoverHintText, { color: CultureTokens.teal }]}>Open discovery</Text>
                  </View>
                  {item.externalUrl ? (
                    <Pressable
                      onPress={() => void openListenUrl(item.externalUrl!, item.id)}
                      style={({ pressed }) => [
                        styles.listenBtn,
                        { backgroundColor: colors.backgroundSecondary, borderColor: item.accentColor + '55' },
                        pressed && { opacity: 0.85 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Listen in Spotify or browser"
                      hitSlop={8}
                    >
                      <Ionicons name="musical-notes" size={14} color={item.accentColor} />
                      <Text style={[styles.listenLabel, { color: item.accentColor }]}>Listen</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )
        }
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollRail, isDesktop && { paddingHorizontal: 0 }]}
        snapToInterval={SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 36, paddingTop: 2 },
  headerPad: { paddingHorizontal: 20 },
  scrollRail: { paddingHorizontal: 20, gap: ITEM_GAP, paddingRight: 44 },
  card: {
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  accentTopBar: {
    width: '100%',
    height: 4,
  },
  imageWrap: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlayRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typePillText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.4,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  livePillText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  playFab: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 4,
  },
  skeletonBody: {
    padding: 14,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  artist: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 19,
  },
  cultureLine: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  discoverHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  discoverHintText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  listenLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
});

export const HeritagePlaylistRail = React.memo(HeritagePlaylistRailComponent);

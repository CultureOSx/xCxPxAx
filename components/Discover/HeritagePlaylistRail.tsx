import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
import type { HeritagePlaylistEntry } from '@/shared/schema';
import SectionHeader from './SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';

const CARD_WIDTH = 258;
const IMAGE_HEIGHT = 162;
const ITEM_GAP = 18;
const SNAP = CARD_WIDTH + ITEM_GAP;
const SKELETON_KEYS = ['h1', 'h2', 'h3', 'h4'] as const;

const SECTION_EYEBROW = 'Listen';
const SECTION_TITLE = 'Heritage playlist';
const SECTION_SUBTITLE =
  'Curated audio and stories — tap a card to open Explore for that culture, or jump straight to a stream when available.';

interface HeritagePlaylistRailProps {
  data: HeritagePlaylistEntry[];
  isLoading?: boolean;
}

function HeritageSkeletonCard() {
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
          <Skeleton width={72} height={22} borderRadius={8} />
          <Skeleton width="92%" height={16} borderRadius={6} />
          <Skeleton width="40%" height={13} borderRadius={6} />
          <Skeleton width="100%" height={40} borderRadius={12} style={{ marginTop: 10 }} />
        </View>
      </View>
    </View>
  );
}

function HeritagePlaylistRailComponent({ data, isLoading }: HeritagePlaylistRailProps) {
  const colors = useColors();
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();
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
    <View style={[styles.container, { marginBottom: vPad }]}>
      <View style={headerPadStyle}>
        <SectionHeader
          eyebrow={SECTION_EYEBROW}
          title={SECTION_TITLE}
          subtitle={SECTION_SUBTITLE}
          accentColor={CultureTokens.teal}
          seeAllLabel="Explore"
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
            <View
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
                Colors.shadows.medium,
              ]}
            >
              <View style={[styles.accentRail, { backgroundColor: item.accentColor }]} />
              {/* Web: avoid nested <button> — Explore and Listen are sibling pressables. */}
              <View style={styles.cardMain}>
                <Pressable
                  onPress={() => handleCardPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title} by ${item.artist}. Opens Explore for ${item.culture} culture.`}
                  accessibilityHint={
                    item.externalUrl ? 'Use the separate Listen control on this card to open the audio stream.' : undefined
                  }
                  style={({ pressed }) => [
                    styles.cardExplorePressable,
                    pressed && { opacity: 0.97 },
                    Platform.OS === 'web' && { cursor: 'pointer' as const },
                  ]}
                >
                  <View style={styles.imageBlock}>
                    <Image
                      source={item.imageUrl ? { uri: item.imageUrl } : undefined}
                      style={[styles.cardImage, { backgroundColor: colors.backgroundSecondary }]}
                      contentFit="cover"
                      transition={200}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.5)']}
                      style={StyleSheet.absoluteFillObject}
                      pointerEvents="none"
                    />
                    <View style={styles.imageTopRow}>
                      <View
                        style={[
                          styles.typePill,
                          { backgroundColor: withAlpha(colors.surface, 0.92), borderColor: colors.borderLight },
                        ]}
                      >
                        <Text style={[styles.typePillText, { color: colors.text }]}>{item.typeLabel}</Text>
                      </View>
                      {item.isLive ? (
                        <View style={[styles.livePill, { backgroundColor: CultureTokens.coral }]}>
                          <Ionicons name="radio" size={10} color="white" />
                          <Text style={styles.livePillText}>LIVE</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.imageBottomRow}>
                      <Text style={styles.imageTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.imageArtist} numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.lowerBody,
                      { borderTopColor: colors.borderLight },
                      item.externalUrl ? styles.lowerBodyWithListen : null,
                    ]}
                  >
                    <View style={styles.cultureRow}>
                      <Ionicons name="earth-outline" size={15} color={CultureTokens.teal} />
                      <Text style={[styles.cultureText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.culture}
                      </Text>
                    </View>
                    <Text style={[styles.exploreHint, { color: colors.textTertiary }]}>
                      Opens Explore with matching culture filters
                    </Text>
                    <View style={styles.actionsRow}>
                      <View style={styles.exploreAction}>
                        <Ionicons name="compass" size={16} color={colors.primary} />
                        <Text style={[styles.exploreActionText, { color: colors.primary }]}>Explore</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
                {item.externalUrl ? (
                  <Pressable
                    onPress={() => void openListenUrl(item.externalUrl!, item.id)}
                    style={({ pressed }) => [
                      styles.listenBtn,
                      styles.listenBtnAbsolute,
                      {
                        backgroundColor: withAlpha(item.accentColor, 0.12),
                        borderColor: withAlpha(item.accentColor, 0.4),
                      },
                      pressed && { opacity: 0.88 },
                      Platform.OS === 'web' && { cursor: 'pointer' as const },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Listen in Spotify, browser, or your music app"
                    hitSlop={6}
                  >
                    <Ionicons name="play-circle" size={18} color={item.accentColor} />
                    <Text style={[styles.listenLabel, { color: item.accentColor }]}>Listen</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
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
    position: 'relative',
  },
  cardExplorePressable: {
    flex: 1,
  },
  imageBlock: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageTopRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typePillText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.35,
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
  imageBottomRow: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  imageTitle: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  imageArtist: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  lowerBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lowerBodyWithListen: {
    paddingRight: 104,
  },
  skeletonBody: {
    padding: 14,
    gap: 8,
  },
  cultureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cultureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 19,
  },
  exploreHint: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    marginTop: 2,
  },
  listenBtnAbsolute: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    zIndex: 2,
  },
  exploreAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  exploreActionText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listenLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
});

export const HeritagePlaylistRail = React.memo(HeritagePlaylistRailComponent);

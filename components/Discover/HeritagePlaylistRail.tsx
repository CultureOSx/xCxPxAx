import React, { useEffect, useRef } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CardTokens, Colors, CultureTokens } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';
import { captureEvent } from '@/lib/analytics';
import type { HeritagePlaylistEntry } from '@/shared/schema';
import SectionHeader from './SectionHeader';

const DEFAULT_SNAP_INTERVAL = 248;

interface HeritagePlaylistRailProps {
  data: HeritagePlaylistEntry[];
}

function HeritagePlaylistRailComponent({ data }: HeritagePlaylistRailProps) {
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

  if (data.length === 0) return null;

  const handlePress = (item: HeritagePlaylistEntry) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

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

  return (
    <View style={styles.container}>
      <View style={[styles.headerPad, isDesktop && { paddingHorizontal: 0 }]}>
        <SectionHeader
          title="Heritage Playlist"
          subtitle="Curated listening that opens into matching cultural discovery"
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
            accessibilityLabel={`Open ${item.title}`}
            style={({ pressed }) => [
              styles.card,
              pressed && { transform: [{ scale: 0.985 }], opacity: 0.95 },
              Platform.OS === 'web' && { cursor: 'pointer' as const },
            ]}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={150}
            />
            <LinearGradient
              colors={['transparent', 'rgba(11,11,20,0.88)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[styles.accentBar, { backgroundColor: item.accentColor }]} />
            <View style={styles.topRow}>
              <View style={[styles.typePill, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
                <Text style={styles.typeLabel}>{item.typeLabel}</Text>
              </View>
              {item.isLive ? (
                <View style={[styles.livePill, { backgroundColor: CultureTokens.coral }]}>
                  <Ionicons name="radio" size={10} color="white" />
                  <Text style={styles.liveLabel}>LIVE</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.playButton}>
              <Ionicons name={item.isLive ? 'radio' : 'play'} size={18} color="white" />
            </View>
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
              <Text style={styles.meta} numberOfLines={1}>{`${item.culture} listening`}</Text>
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
    width: 232,
    height: 272,
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
    backgroundColor: CultureTokens.indigo,
    ...Colors.shadows.medium,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  topRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeLabel: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 14,
  },
  livePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveLabel: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 14,
  },
  playButton: {
    position: 'absolute',
    top: 110,
    left: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 4,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 24,
  },
  artist: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 18,
  },
  meta: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
});

export const HeritagePlaylistRail = React.memo(HeritagePlaylistRailComponent);

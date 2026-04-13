// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import type { HeritagePlaylistEntry } from '@/shared/schema/discover';

interface BrandPlaylistProps {
  playlist: HeritagePlaylistEntry[];
  title?: string;
  onItemPress?: (item: HeritagePlaylistEntry) => void;
}

export function BrandPlaylist({ playlist, title = "Heritage Playlist", onItemPress }: BrandPlaylistProps) {
  const colors = useColors();
  
  if (!playlist || playlist.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="headset" size={16} color={CultureTokens.indigo} />
          </View>
          <Text style={[TextStyles.title3, { color: colors.text }]}>{title}</Text>
        </View>
        <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>CURATED LISTENING</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={260 + 16}
      >
        {playlist.map((item) => (
          <Pressable 
            key={item.id} 
            style={({ pressed }) => [
              styles.card, 
              { backgroundColor: colors.surface },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
            onPress={() => onItemPress?.(item)}
          >
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
              <View style={[styles.typeBadge, { backgroundColor: item.accentColor || CultureTokens.indigo }]}>
                <Text style={styles.typeText}>{item.typeLabel.toUpperCase()}</Text>
              </View>
              {item.isLive && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
            
            <View style={styles.cardInfo}>
              <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.itemArtist, { color: colors.textSecondary }]} numberOfLines={1}>{item.artist}</Text>
              
              <View style={styles.footer}>
                <View style={styles.cultureBadge}>
                  <Text style={[styles.cultureText, { color: colors.textTertiary }]}>{item.culture}</Text>
                </View>
                <View style={styles.playBtn}>
                  <Ionicons name="play" size={12} color="#FFFFFF" />
                  <Text style={styles.playText}>Discover</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, marginBottom: 12 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CultureTokens.indigo + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  card: {
    width: 260,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.06)' } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 }
    })
  },
  imageContainer: { height: 160, position: 'relative' },
  image: { width: '100%', height: '100%' },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5E5B' },
  liveText: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  cardInfo: { padding: 16, gap: 4 },
  itemTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', letterSpacing: -0.3 },
  itemArtist: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  cultureBadge: { backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  cultureText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  playBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: CultureTokens.indigo, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  playText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
});

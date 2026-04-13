// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CardTokens, CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { Community } from '@/shared/schema';
import {
  getCommunityAccent,
  getCommunityActivityMeta,
  getCommunityEventsCount,
  getCommunityMemberCount,
  getCommunitySignals,
} from '@/lib/community';
import { useSaved } from '@/contexts/SavedContext';

interface CommunityCardProps {
  community: Community;
  index?: number;
}

function CommunityCard({ community, index = 0 }: CommunityCardProps) {
  const colors = useColors();
  const { isCommunityBookmarked, toggleSaveCommunityBookmark } = useSaved();
  const bookmarked = isCommunityBookmarked(community.id);
  const accent = getCommunityAccent(community, colors.primary);
  const members = getCommunityMemberCount(community);
  const upcomingEvents = getCommunityEventsCount(community);
  const activity = getCommunityActivityMeta(community);
  const signals = getCommunitySignals(community);

  // First letter of community name for the placeholder cover
  const initial = (community.name ?? '?').charAt(0).toUpperCase();

  function handlePress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: '/community/[id]',
      params: { id: community.slug || community.id },
    });
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface },
        pressed && styles.cardPressed,
        Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`View ${community.name} community`}
    >
      {/* Cover area */}
      <View style={[styles.cover, { backgroundColor: colors.backgroundSecondary }]}>
        {community.imageUrl ? (
          <Image
            source={{ uri: community.imageUrl }}
            style={styles.coverImage}
            contentFit="cover"
            accessibilityLabel={`${community.name} cover image`}
          />
        ) : (
          <LinearGradient
            colors={[accent + 'CC', accent + '66']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Bottom gradient overlay for text legibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.coverBottomGradient}
        />

        {/* Initial letter when no image */}
        {!community.imageUrl && (
          <View style={styles.initialWrap} pointerEvents="none">
            <Text style={styles.initialText}>{initial}</Text>
          </View>
        )}

        {/* Top-left: type badge */}
        {signals.length > 0 && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText} numberOfLines={1}>
              {signals[0]}
            </Text>
          </View>
        )}

        {/* Top-right: verified badge */}
        {community.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.bookmarkFab,
            { opacity: pressed ? 0.85 : 1 },
            Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
          ]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            toggleSaveCommunityBookmark(community.id);
          }}
          accessibilityRole="button"
          accessibilityLabel={bookmarked ? 'Remove community from saved' : 'Save community for later'}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      {/* Info strip */}
      <View style={[styles.infoStrip, { backgroundColor: colors.surface }]}>
        <Text style={[styles.communityName, { color: colors.text }]} numberOfLines={1}>
          {community.name}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {members.toLocaleString()}
            </Text>
          </View>
          {upcomingEvents > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {upcomingEvents} events
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.activityPill, { backgroundColor: accent + '16' }]}>
          <Text style={[styles.activityText, { color: accent }]}>
            {activity.label.toUpperCase()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: CardTokens.radius,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  // Cover
  cover: {
    width: '100%',
    height: 160,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverBottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
  },
  initialWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255,255,255,0.9)',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.40)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: CultureTokens.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkFab: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Info strip
  infoStrip: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  communityName: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  activityPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  activityText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.6,
  },
});

export default React.memo(CommunityCard);

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, CardTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { Community } from '@/shared/schema';
import {
  getCommunityAccent,
  getCommunityActivityMeta,
  getCommunityEventsCount,
  getCommunityHeadline,
  getCommunityMemberCount,
  getCommunitySignals,
} from '@/lib/community';

interface CommunityCardProps {
  community: Community;
  index?: number;
}

function CommunityCard({ community, index = 0 }: CommunityCardProps) {
  const colors = useColors();
  const accent = getCommunityAccent(community, colors.primary);
  const members = getCommunityMemberCount(community);
  const upcomingEvents = getCommunityEventsCount(community);
  const headline = getCommunityHeadline(community);
  const activity = getCommunityActivityMeta(community);
  const signals = getCommunitySignals(community);

  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
          pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
          Platform.OS === 'web' && { cursor: 'pointer' as any },
          Colors.shadows.small,
        ]}
        onPress={() =>
          router.push({
            pathname: '/community/[id]',
            params: { id: community.slug || community.id },
          })
        }
      >
        <View style={[styles.iconWrap, { backgroundColor: accent + '15' }]}>
          {community.iconEmoji ? (
            <Text style={{ fontSize: 24 }}>{community.iconEmoji}</Text>
          ) : (
            <Ionicons name="people" size={24} color={accent} />
          )}
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.metaBadge, { backgroundColor: accent + '15', borderColor: accent + '35' }]}>
            <Text style={[styles.metaBadgeText, { color: accent }]} numberOfLines={1}>
              {signals[0] ?? 'Community'}
            </Text>
          </View>
          <View style={[styles.metaBadge, { backgroundColor: activity.color + '12', borderColor: activity.color + '25' }]}>
            <Text style={[styles.metaBadgeText, { color: activity.color }]}>{activity.label}</Text>
          </View>
        </View>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {community.name}
        </Text>
        <Text style={[styles.headline, { color: colors.textSecondary }]} numberOfLines={2}>
          {headline}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.members, { color: colors.textSecondary }]}>
              {members.toLocaleString()} members
            </Text>
          </View>
          {upcomingEvents > 0 ? (
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.members, { color: colors.textSecondary }]}>
                {upcomingEvents} events
              </Text>
            </View>
          ) : null}
        </View>
        {signals.length > 1 ? (
          <View style={styles.signalRow}>
            {signals.slice(1).map((signal) => (
              <View key={signal} style={[styles.signalChip, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.signalText, { color: colors.textSecondary }]}>{signal}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {community.description && community.description !== headline ? (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {community.description}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 228,
    borderRadius: CardTokens.radius,
    padding: CardTokens.padding,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  metaBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  headline: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 18,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  members: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  signalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  signalChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  signalText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  description: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
});

// ⚡ Bolt Optimization: Added React.memo() to prevent unnecessary re-renders in lists
export default React.memo(CommunityCard);

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { EventData, Community } from '@/shared/schema';
import type { useColors } from '@/hooks/useColors';
import { TextStyles, CultureTokens, CardTokens } from '@/constants/theme';

type Colors = ReturnType<typeof useColors>;

interface DiscoverySectionProps {
  event: EventData;
  similarEvents: EventData[];
  relatedCommunities: Community[];
  colors: Colors;
  s?: unknown;
}

export function DiscoverySection({
  event,
  similarEvents,
  relatedCommunities,
  colors,
}: DiscoverySectionProps) {
  const eventItems = similarEvents.slice(0, 6);
  const communityItems = relatedCommunities.slice(0, 4);
  const hasContent = eventItems.length > 0 || communityItems.length > 0;

  if (!hasContent) {
    return (
      <View style={[styles.emptyWrap, { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="sparkles-outline" size={18} color={CultureTokens.indigo} />
        <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
          We are still finding related picks in {event.city || 'your city'}.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {eventItems.length > 0 ? (
        <View style={styles.block}>
          <Text style={[TextStyles.badgeCaps, { color: colors.textTertiary }]}>Recommended events</Text>
          <View style={styles.grid}>
            {eventItems.map((candidate) => (
              <Pressable
                key={candidate.id}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: candidate.id } })}
                style={({ pressed }) => [
                  styles.card,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Open event ${candidate.title}`}
              >
                <Text style={[TextStyles.captionSemibold, { color: colors.text }]} numberOfLines={2}>
                  {candidate.title}
                </Text>
                <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {[candidate.venue, candidate.city].filter(Boolean).join(' · ') || 'Venue TBC'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {communityItems.length > 0 ? (
        <View style={styles.block}>
          <Text style={[TextStyles.badgeCaps, { color: colors.textTertiary }]}>Related communities</Text>
          <View style={styles.grid}>
            {communityItems.map((community) => (
              <Pressable
                key={community.id}
                onPress={() => router.push({ pathname: '/community/[id]', params: { id: community.id } })}
                style={({ pressed }) => [
                  styles.card,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Open community ${community.name}`}
              >
                <Text style={[TextStyles.captionSemibold, { color: colors.text }]} numberOfLines={2}>
                  {community.name}
                </Text>
                <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {community.city || event.city || 'Community'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },
  block: {
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 74,
    justifyContent: 'center',
    gap: 4,
  },
  emptyWrap: {
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

// @ts-nocheck
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { TextStyles, CultureTokens } from '@/constants/theme';
import EventCard from '@/components/Discover/EventCard';
import CommunityCard from '@/components/Discover/CommunityCard';
import { useColors } from '@/hooks/useColors';
import { getStyles } from './styles';
import type { EventData, Community } from '@/shared/schema';

interface DiscoverySectionProps {
  event: EventData;
  similarEvents: EventData[];
  relatedCommunities: Community[];
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}

export function DiscoverySection({
  event,
  similarEvents,
  relatedCommunities,
  colors,
  s,
}: DiscoverySectionProps) {
  if (similarEvents.length === 0 && relatedCommunities.length === 0) return null;

  return (
    <>
      {similarEvents.length > 0 ? (
        <>
          <View style={s.divider} />
          <View style={s.discoverSection}>
            <View style={s.discoverSectionHeader}>
              <Text style={s.sectionTitle}>More in {event.city}</Text>
              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/index' })}
                hitSlop={10}
                accessibilityRole="link"
              >
                <Text style={[TextStyles.captionSemibold, { color: colors.primary }]}>See all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={s.discoverRail}
              contentContainerStyle={s.discoverRailContent}
            >
              {similarEvents.map((ev, idx) => (
                <EventCard key={ev.id} event={ev} index={idx} layout="stacked" />
              ))}
            </ScrollView>
          </View>
        </>
      ) : null}

      {relatedCommunities.length > 0 ? (
        <>
          <View style={s.divider} />
          <View style={s.discoverSection}>
            <View style={s.discoverSectionHeader}>
              <Text style={s.sectionTitle}>Related Communities</Text>
              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/community' })}
                hitSlop={10}
                accessibilityRole="link"
              >
                <Text style={[TextStyles.captionSemibold, { color: colors.primary }]}>See all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={s.discoverRail}
              contentContainerStyle={s.discoverRailContent}
            >
              {relatedCommunities.map((community, idx) => (
                <CommunityCard key={community.id} community={community} index={idx} />
              ))}
            </ScrollView>
          </View>
        </>
      ) : null}
    </>
  );
}

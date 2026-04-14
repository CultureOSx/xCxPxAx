import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TextStyles, CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getStyles } from './styles';
import type { EventData } from '@/shared/schema';

interface SocialProofBarProps {
  event: EventData;
  hostName: string;
  publisherProfileImageUrl?: string | null;
  colors: ReturnType<typeof useColors>;
  s: ReturnType<typeof getStyles>;
}

export function SocialProofBar({
  event,
  hostName,
  publisherProfileImageUrl,
  colors,
  s,
}: SocialProofBarProps) {
  const goingCount = Math.max(event.rsvpGoing ?? 0, event.attending ?? 0);

  return (
    <>
      {/* Host row + Attendee badge */}
      <View style={s.socialProofBar}>
        <Pressable
          style={s.hostCompactRow}
          onPress={
            event.publisherProfileId
              ? () =>
                  router.push({
                    pathname: '/profile/[id]',
                    params: { id: event.publisherProfileId! },
                  })
              : undefined
          }
          accessibilityRole={event.publisherProfileId ? 'link' : 'none'}
          accessibilityLabel={`Organiser: ${hostName}`}
        >
          <View style={[s.hostAvatarBadge, { backgroundColor: colors.primarySoft }]}>
            {publisherProfileImageUrl ? (
              <Image
                source={{ uri: publisherProfileImageUrl }}
                style={s.hostAvatarImg}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>Presented by</Text>
            <Text style={[TextStyles.headline, { color: colors.text }]} numberOfLines={1}>
              {hostName}
            </Text>
          </View>
          {event.publisherProfileId ? (
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          ) : null}
        </Pressable>

        <View
          style={[
            s.attendeeBadge,
            { backgroundColor: CultureTokens.teal + '15', borderColor: CultureTokens.teal + '30' },
          ]}
        >
          <Ionicons name="people-outline" size={13} color={CultureTokens.teal} />
          <Text style={[TextStyles.captionSemibold, { color: CultureTokens.teal }]}>
            {goingCount.toLocaleString()} going
          </Text>
        </View>
      </View>
    </>
  );
}

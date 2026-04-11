import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TextStyles, CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { EventData } from '@/shared/schema';

interface SidebarProfile {
  name?: string;
  imageUrl?: string;
}

interface SidebarCardProps {
  event: EventData;
  hostName: string;
  publisherProfile: SidebarProfile | null | undefined;
  eventTags: string[];
  goingCount: number;
  hostEmail?: string | null;
  hostPhone?: string | null;
  hostWebsite?: string | null;
  handleEmailHost: () => void;
  handleCallHost: () => void;
  handleVisitWebsite: () => void;
  colors: ReturnType<typeof useColors>;
}

export function SidebarCard({
  event,
  hostName,
  publisherProfile,
  eventTags,
  goingCount,
  hostEmail,
  hostPhone,
  hostWebsite,
  handleEmailHost,
  handleCallHost,
  handleVisitWebsite,
  colors,
}: SidebarCardProps) {
  const rawPresentedBy = (event as unknown as Record<string, unknown>).presentedBy;
  const presentedBy = typeof rawPresentedBy === 'string' && rawPresentedBy.trim().length > 0
    ? rawPresentedBy
    : publisherProfile?.name ?? hostName;

  const cardStyle = {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    overflow: 'hidden' as const,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 24px rgba(44,42,114,0.07)',
        position: 'sticky' as any,
        top: 24,
      },
      default: {},
    }),
  };

  const sectionStyle = {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10 as const,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  };

  const labelStyle = {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    color: colors.textTertiary,
    marginBottom: 2,
  };

  return (
    <View style={cardStyle}>

      {/* ── Hosted by ────────────────────────────────────────────── */}
      <Pressable
        style={sectionStyle}
        onPress={
          event.publisherProfileId
            ? () => router.push({ pathname: '/profile/[id]', params: { id: event.publisherProfileId! } })
            : undefined
        }
        accessibilityRole={event.publisherProfileId ? 'link' : 'none'}
        accessibilityLabel={`Organiser: ${hostName}`}
      >
        <Text style={labelStyle}>Hosted by</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {publisherProfile?.imageUrl ? (
              <Image
                source={{ uri: publisherProfile.imageUrl }}
                style={{ width: 44, height: 44 }}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[TextStyles.headline, { color: colors.text }]}
              numberOfLines={2}
            >
              {hostName}
            </Text>
            {event.city ? (
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                {event.city}
              </Text>
            ) : null}
          </View>
          {event.publisherProfileId ? (
            <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
          ) : null}
        </View>
      </Pressable>

      {/* ── Presented by ─────────────────────────────────────────── */}
      <View style={sectionStyle}>
        <Text style={labelStyle}>Presented by</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: CultureTokens.indigo + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="megaphone-outline" size={16} color={CultureTokens.indigo} />
          </View>
          <Text style={[TextStyles.bodyMedium, { color: colors.text, flex: 1 }]} numberOfLines={2}>
            {presentedBy}
          </Text>
        </View>
      </View>

      {/* ── People Going ─────────────────────────────────────────── */}
      <View style={sectionStyle}>
        <Text style={labelStyle}>People Going</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: CultureTokens.teal + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="people-outline" size={18} color={CultureTokens.teal} />
          </View>
          <Text style={[TextStyles.title3, { color: colors.text }]}>
            {goingCount.toLocaleString()}
          </Text>
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
            people going
          </Text>
        </View>
      </View>

      {/* ── Contact the Host ─────────────────────────────────────── */}
      {(hostEmail || hostPhone || hostWebsite) ? (
        <View style={sectionStyle}>
          <Text style={labelStyle}>Contact the host</Text>
          <View style={{ gap: 8 }}>
            {hostEmail ? (
              <Pressable
                onPress={handleEmailHost}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row' as const,
                    alignItems: 'center' as const,
                    gap: 10,
                    padding: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Email host"
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="mail-outline" size={16} color={colors.primary} />
                </View>
                <Text style={[TextStyles.bodyMedium, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {hostEmail}
                </Text>
              </Pressable>
            ) : null}

            {hostPhone ? (
              <Pressable
                onPress={handleCallHost}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row' as const,
                    alignItems: 'center' as const,
                    gap: 10,
                    padding: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Call host"
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: CultureTokens.teal + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="call-outline" size={16} color={CultureTokens.teal} />
                </View>
                <Text style={[TextStyles.bodyMedium, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {hostPhone}
                </Text>
              </Pressable>
            ) : null}

            {hostWebsite ? (
              <Pressable
                onPress={handleVisitWebsite}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row' as const,
                    alignItems: 'center' as const,
                    gap: 10,
                    padding: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Visit website"
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: CultureTokens.indigo + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="globe-outline" size={16} color={CultureTokens.indigo} />
                </View>
                <Text style={[TextStyles.bodyMedium, { color: colors.primary, flex: 1 }]} numberOfLines={1}>
                  {hostWebsite.replace(/^https?:\/\//, '')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ── Event Tags ───────────────────────────────────────────── */}
      {eventTags.length > 0 ? (
        <View style={sectionStyle}>
          <Text style={labelStyle}>Event Tags</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {eventTags.slice(0, 8).map((tag) => (
              <View
                key={tag}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  borderWidth: 1,
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primaryLight + '40',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.primaryLight,
                  }}
                >
                  #{tag.length <= 4 ? tag.toUpperCase() : tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── Report Event ─────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
        <Pressable
          onPress={() =>
            Alert.alert(
              'Report Event',
              'What issue would you like to report?',
              [
                { text: 'Spam or scam', onPress: () => Alert.alert('Reported', 'Thank you. Our team will review this event.') },
                { text: 'Misleading info', onPress: () => Alert.alert('Reported', 'Thank you. Our team will review this event.') },
                { text: 'Inappropriate content', onPress: () => Alert.alert('Reported', 'Thank you. Our team will review this event.') },
                { text: 'Cancel', style: 'cancel' },
              ]
            )
          }
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', gap: 6 }]}
          accessibilityRole="button"
          accessibilityLabel="Report this event"
        >
          <Ionicons name="flag-outline" size={14} color={colors.textTertiary} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Poppins_500Medium',
              color: colors.textTertiary,
            }}
          >
            Report this event
          </Text>
        </Pressable>
      </View>

    </View>
  );
}

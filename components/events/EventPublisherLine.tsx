import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

export type EventPublisherLineVariant = 'default' | 'compact' | 'onDark';

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaCompact: {
    gap: 4,
    marginBottom: 4,
    marginTop: 0,
  },
  metaOnDark: {
    gap: 4,
    marginBottom: 8,
    justifyContent: 'center',
  },
  metaText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    flex: 1,
  },
  metaTextCompact: {
    fontSize: 12,
  },
  metaTextOnDark: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    flexShrink: 1,
    maxWidth: '90%',
    textAlign: 'center',
  },
});

/**
 * Organiser line when `event.publisherProfileId` is set (React Query dedupes fetches by profile id).
 */
export function EventPublisherLine({
  profileId,
  variant = 'default',
}: {
  profileId: string;
  variant?: EventPublisherLineVariant;
}) {
  const colors = useColors();
  const { data: profile } = useQuery({
    queryKey: ['/api/profiles', profileId],
    queryFn: () => api.profiles.get(profileId),
    enabled: !!profileId,
    staleTime: 120_000,
  });
  if (!profile?.name) return null;

  const iconColor =
    variant === 'onDark' ? 'rgba(255,255,255,0.85)' : colors.textSecondary;
  const textColor =
    variant === 'onDark' ? 'rgba(255,255,255,0.92)' : colors.textSecondary;

  const metaStyle = [
    styles.meta,
    variant === 'compact' && styles.metaCompact,
    variant === 'onDark' && styles.metaOnDark,
  ];

  const textStyle =
    variant === 'onDark'
      ? [styles.metaTextOnDark, { color: textColor }]
      : [styles.metaText, variant === 'compact' && styles.metaTextCompact, { color: textColor }];

  const iconSize = variant === 'default' ? 13 : 12;

  return (
    <View style={metaStyle}>
      <Ionicons name="business-outline" size={iconSize} color={iconColor} />
      <Text style={textStyle} numberOfLines={1}>
        {profile.name}
      </Text>
    </View>
  );
}

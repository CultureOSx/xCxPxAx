// @ts-nocheck
import React, { useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { CultureTokens } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { Input } from '@/components/ui/Input';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/shared/schema';
import { FormData } from './types';
import type { CreateStyles } from './styles';

const VENUE_LIKE = new Set(['venue', 'business', 'restaurant']);

function profileImageUri(p: Profile): string | undefined {
  return p.imageUrl ?? p.avatarUrl ?? undefined;
}

interface Props {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
}

export function StepLocation({ form, setField, colors, s }: Props) {
  const { userId } = useAuth();

  const { data: myProfiles = [], isLoading } = useQuery({
    queryKey: ['/api/profiles/my', userId],
    queryFn: () => api.profiles.my(),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const venueChoices = useMemo(
    () => myProfiles.filter((p) => VENUE_LIKE.has((p.entityType ?? '').toLowerCase())),
    [myProfiles],
  );

  const setOneOffMode = () => {
    setField('useLinkedVenue', false);
    setField('venueProfileId', '');
    setField('venueProfileLabel', '');
  };

  const setLinkedMode = () => {
    setField('useLinkedVenue', true);
  };

  const selectVenueProfile = (p: Profile) => {
    setField('venueProfileId', p.id);
    setField('venueProfileLabel', p.name);
    if (!form.venue.trim()) setField('venue', p.name);
    if (p.city && !form.city.trim()) setField('city', p.city);
    if (p.country && !form.country.trim()) setField('country', p.country);
  };

  return (
    <View style={s.fields}>
      <Text style={[TextStyles.callout, { color: colors.textSecondary, marginBottom: 12 }]}>
        Use a saved venue page, or enter a one-off address. You can still edit the text fields either way.
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
        <Pressable
          onPress={setOneOffMode}
          accessibilityRole="button"
          accessibilityState={{ selected: !form.useLinkedVenue }}
          accessibilityLabel="One-off address"
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: !form.useLinkedVenue ? CultureTokens.gold : colors.border,
            backgroundColor: !form.useLinkedVenue ? CultureTokens.gold + '15' : colors.surfaceElevated,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text style={[TextStyles.labelSemibold, { color: colors.text, textAlign: 'center' }]}>One-off address</Text>
        </Pressable>
        <Pressable
          onPress={setLinkedMode}
          accessibilityRole="button"
          accessibilityState={{ selected: form.useLinkedVenue }}
          accessibilityLabel="Link saved venue"
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: form.useLinkedVenue ? CultureTokens.gold : colors.border,
            backgroundColor: form.useLinkedVenue ? CultureTokens.gold + '15' : colors.surfaceElevated,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text style={[TextStyles.labelSemibold, { color: colors.text, textAlign: 'center' }]}>Saved venue</Text>
        </Pressable>
      </View>

      {form.useLinkedVenue ? (
        <>
          {!userId ? (
            <Text style={[TextStyles.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
              Sign in to choose a venue profile.
            </Text>
          ) : null}
          {userId && isLoading ? (
            <ActivityIndicator size="small" color={CultureTokens.gold} style={{ marginBottom: 16 }} />
          ) : null}
          {userId && !isLoading && venueChoices.length === 0 ? (
            <View style={[s.infoBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, marginBottom: 16 }]}>
              <Ionicons name="location-outline" size={18} color={CultureTokens.coral} />
              <Text style={[s.infoText, { color: colors.textSecondary }]}>
                No venue, business, or restaurant profiles found. Switch to one-off address or create a venue profile from Submit.
              </Text>
            </View>
          ) : null}
          {venueChoices.map((p) => {
            const selected = form.venueProfileId === p.id;
            const uri = profileImageUri(p);
            return (
              <Pressable
                key={p.id}
                onPress={() => selectVenueProfile(p)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Venue ${p.name}`}
                style={({ pressed }) => [
                  s.typeChip,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 10,
                    borderColor: selected ? CultureTokens.gold : colors.border,
                    backgroundColor: selected ? CultureTokens.gold + '15' : colors.surfaceElevated,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? CultureTokens.gold : colors.textTertiary}
                />
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: 40, height: 40, borderRadius: 10 }}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: colors.backgroundSecondary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[TextStyles.labelSemibold, { color: colors.text }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{p.entityType}</Text>
                </View>
              </Pressable>
            );
          })}
        </>
      ) : null}

      <Input
        label="Venue Name"
        value={form.venue}
        onChangeText={(v) => setField('venue', v)}
        placeholder="e.g. Sydney Town Hall"
        autoCapitalize="words"
        accessibilityLabel="Venue name"
        containerStyle={{ marginBottom: 20 }}
      />
      <Input
        label="Street Address"
        value={form.address}
        onChangeText={(v) => setField('address', v)}
        placeholder="e.g. 483 George St, Sydney NSW 2000"
        autoCapitalize="words"
        accessibilityLabel="Street address"
        containerStyle={{ marginBottom: 20 }}
      />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Input
            label="City *"
            value={form.city}
            onChangeText={(v) => setField('city', v)}
            placeholder="Sydney"
            autoCapitalize="words"
            accessibilityLabel="City"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Country"
            value={form.country}
            onChangeText={(v) => setField('country', v)}
            placeholder="Australia"
            autoCapitalize="words"
            accessibilityLabel="Country"
          />
        </View>
      </View>
    </View>
  );
}

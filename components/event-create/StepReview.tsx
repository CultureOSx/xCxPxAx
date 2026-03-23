import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { formatDateForCountry } from '@/lib/dateUtils';
import { FormData, EVENT_TYPES } from './types';
import { ReviewRow } from './ReviewRow';
import type { CreateStyles } from './styles';

interface Props {
  form: FormData;
  colors: ReturnType<typeof useColors>;
  s: CreateStyles;
  availableCultures: { id: string; label: string }[];
  publishError: string | null;
}

export function StepReview({ form, colors, s, availableCultures, publishError }: Props) {
  return (
    <View style={s.fields}>
      {form.heroImageUrl ? (
        <Image
          source={{ uri: form.heroImageUrl }}
          style={s.reviewImage}
          contentFit="cover"
          accessibilityLabel="Event image preview"
        />
      ) : null}

      <ReviewRow label="Title" value={form.title} colors={colors} />
      <ReviewRow
        label="Type"
        value={EVENT_TYPES.find((t) => t.id === form.eventType)?.label ?? '—'}
        colors={colors}
      />
      <ReviewRow
        label="Location"
        value={[form.venue, form.city, form.country].filter(Boolean).join(', ')}
        colors={colors}
      />
      <ReviewRow
        label="Dates"
        value={[
          form.date ? formatDateForCountry(form.date, form.country) : '—',
          form.endDate ? `→ ${formatDateForCountry(form.endDate, form.country)}` : '',
          form.time ? `at ${form.time}` : '',
        ].filter(Boolean).join(' ')}
        colors={colors}
      />
      <ReviewRow
        label="Entry"
        value={
          form.entryType === 'ticketed'
            ? `Ticketed — ${form.tiers.length} tier(s)`
            : 'Free / Open Entry'
        }
        colors={colors}
      />
      {form.artists.length > 0 && (
        <ReviewRow label="Artists" value={form.artists.map((a) => a.name).join(', ')} colors={colors} />
      )}
      {form.sponsors.length > 0 && (
        <ReviewRow label="Sponsors" value={form.sponsors.map((sp) => sp.name).join(', ')} colors={colors} />
      )}
      {form.hostInfo.name ? (
        <ReviewRow label="Host" value={form.hostInfo.name} colors={colors} />
      ) : null}
      {form.cultureTagIds.length > 0 && (
        <ReviewRow
          label="Cultures"
          value={form.cultureTagIds.map((id) => availableCultures.find((c) => c.id === id)?.label ?? id).join(', ')}
          colors={colors}
        />
      )}

      <View style={[s.infoBox, { backgroundColor: CultureTokens.saffron + '15', borderColor: CultureTokens.saffron + '40', marginTop: 8 }]}>
        <Ionicons name="rocket-outline" size={18} color={CultureTokens.saffron} />
        <Text style={[s.infoText, { color: colors.textSecondary }]}>
          Your event will be published immediately and appear in Discover.
        </Text>
      </View>

      {publishError ? (
        <View style={[s.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error + '50', marginTop: 12 }]}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={[s.errorBannerText, { color: colors.error }]}>{publishError}</Text>
        </View>
      ) : null}
    </View>
  );
}

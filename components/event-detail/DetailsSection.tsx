import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { ColorTheme } from '@/constants/colors';
import { FontFamily } from '@/constants/theme';
import type { EventData } from '@/shared/schema';

interface DetailsSectionProps {
  event: EventData;
  countdown: { ended: boolean; days: number; hours: number; minutes: number } | null;
  capacityPercent: number;
  distanceKm: number | null;
  cultureTags: string[];
  languageTags: string[];
  accessibilityTags: string[];
  artistSummary: string | string[] | null;
  sponsorNames: string[];
  isPlus: boolean;
  colors: ColorTheme;
  s?: Record<string, unknown>;
  displayCategory?: string;
  displayCommunity?: string;
  description?: string;
  openMap?: () => void;
}

function Row({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: ColorTheme }) {
  return (
    <View style={ds.row}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[ds.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[ds.value, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export function DetailsSection({ event, countdown, capacityPercent, distanceKm, cultureTags, colors }: DetailsSectionProps) {
  const c = useColors();
  const col = colors ?? c;
  const venue = event.venue ?? '';
  const date = event.date ?? '';
  const time = event.time ?? '';
  const address = event.address ?? '';

  const countdownStr = countdown
    ? countdown.ended ? 'Event has ended' : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`
    : null;

  return (
    <View style={ds.container}>
      {date ? <Row icon="calendar-outline" label="Date" value={`${date}${time ? ` at ${time}` : ''}`} colors={col} /> : null}
      {venue ? <Row icon="location-outline" label="Venue" value={`${venue}${address ? `, ${address}` : ''}`} colors={col} /> : null}
      {countdownStr ? <Row icon="timer-outline" label="Starts in" value={countdownStr} colors={col} /> : null}
      {capacityPercent > 0 ? <Row icon="people-outline" label="Capacity" value={`${capacityPercent}% filled`} colors={col} /> : null}
      {distanceKm != null ? <Row icon="navigate-outline" label="Distance" value={`${distanceKm.toFixed(1)} km away`} colors={col} /> : null}
      {cultureTags.length > 0 ? <Row icon="globe-outline" label="Culture" value={cultureTags.join(', ')} colors={col} /> : null}
    </View>
  );
}

const ds = StyleSheet.create({
  container: { gap: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  label: { fontSize: 11, fontFamily: FontFamily.medium, marginBottom: 2 },
  value: { fontSize: 14, fontFamily: FontFamily.semibold },
});

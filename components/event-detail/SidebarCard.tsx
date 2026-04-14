import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ColorTheme } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { CardTokens, FontFamily, CultureTokens } from '@/constants/theme';
import type { EventData } from '@/shared/schema';

interface SidebarCardProps {
  event: EventData;
  organizer: unknown;
  eventTags: string[];
  goingCount: number;
  handleEmailHost: () => void;
  handleCallHost: () => void;
  handleVisitWebsite: () => void;
  colors: ColorTheme;
  title?: string;
  children?: React.ReactNode;
}

export function SidebarCard({
  event,
  eventTags,
  goingCount,
  handleEmailHost,
  handleVisitWebsite,
  colors,
}: SidebarCardProps) {
  return (
    <View style={[sc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Text style={[sc.title, { color: colors.text }]}>{event.organizerId ?? 'Organizer'}</Text>

      {goingCount > 0 ? (
        <View style={sc.stat}>
          <Ionicons name="people" size={16} color={CultureTokens.indigo} />
          <Text style={[sc.statText, { color: colors.textSecondary }]}>{goingCount} attending</Text>
        </View>
      ) : null}

      {eventTags.length > 0 ? (
        <View style={sc.tags}>
          {eventTags.slice(0, 5).map((tag) => (
            <View key={tag} style={[sc.tag, { backgroundColor: `${CultureTokens.indigo}16`, borderColor: `${CultureTokens.indigo}33` }]}>
              <Text style={sc.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={sc.actions}>
        <Button variant="outline" size="sm" leftIcon="mail-outline" onPress={handleEmailHost} fullWidth>
          Contact
        </Button>
        <Button variant="outline" size="sm" leftIcon="globe-outline" onPress={handleVisitWebsite} fullWidth>
          Website
        </Button>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    borderRadius: CardTokens.radius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    marginBottom: 16,
    gap: 14,
  },
  title: { fontFamily: FontFamily.semibold, fontSize: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: { fontFamily: FontFamily.medium, fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontFamily: FontFamily.semibold, color: CultureTokens.indigo },
  actions: { gap: 8, marginTop: 4 },
});

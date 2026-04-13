// @ts-nocheck
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CardTokens, CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { WidgetNearbyEventItem } from '@/lib/api';

interface WidgetNearbyEventsCardProps {
  events: WidgetNearbyEventItem[];
}

function formatStart(date: string, time?: string): string {
  const base = `${date}T${time?.trim().length ? time.trim() : '00:00'}:00`;
  const parsed = new Date(base);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function WidgetNearbyEventsCard({ events }: WidgetNearbyEventsCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
      {events.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>No nearby events yet.</Text>
      ) : (
        <View style={styles.list}>
          {events.map((event, idx) => (
            <Pressable
              key={event.id}
              style={[
                styles.row, 
                { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary },
                idx > 0 && { marginTop: 8 }
              ]}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Open event ${event.title}`}
            >
              <View style={styles.rowText}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                  <Text style={{ color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }}>
                    {formatStart(event.date, event.time)}
                  </Text>
                  {event.venue ? ` • ${event.venue}` : ''}
                </Text>
              </View>
              <View style={[styles.priceBadge, { backgroundColor: event.isFree ? CultureTokens.teal + '15' : CultureTokens.gold + '15' }]}>
                <Text style={[styles.price, { color: event.isFree ? CultureTokens.teal : CultureTokens.gold }]}>
                  {event.isFree ? 'Free' : `$${Math.round((event.priceCents ?? 0) / 100)}`}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardTokens.radiusLarge,
    borderWidth: 1,
    padding: 16,
  },
  list: {
    gap: 0,
  },
  empty: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    paddingVertical: 10,
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  price: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
});

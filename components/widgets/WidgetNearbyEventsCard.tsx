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
      <Text style={[styles.heading, { color: colors.text }]}>Happening Near You</Text>
      {events.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>No nearby events yet.</Text>
      ) : (
        events.map((event) => (
          <Pressable
            key={event.id}
            style={[styles.row, { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Open event ${event.title}`}
          >
            <View style={styles.rowText}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                {formatStart(event.date, event.time)} {event.venue ? `• ${event.venue}` : ''}
              </Text>
            </View>
            <Text style={[styles.price, { color: event.isFree ? CultureTokens.teal : CultureTokens.saffron }]}>
              {event.isFree ? 'Free' : `$${Math.round((event.priceCents ?? 0) / 100)}`}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardTokens.radiusLarge,
    borderWidth: 1,
    padding: CardTokens.padding,
    gap: 10,
  },
  heading: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  empty: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  row: {
    borderWidth: 1,
    borderRadius: CardTokens.radius,
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
    fontFamily: 'Poppins_600SemiBold',
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  price: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
});

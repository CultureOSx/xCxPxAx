import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CardTokens, CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { WidgetUpcomingTicketItem } from '@/lib/api';

interface WidgetUpcomingTicketCardProps {
  item: WidgetUpcomingTicketItem | null;
}

function formatStart(startIso: string | null): string {
  if (!startIso) return 'Date TBA';
  const parsed = new Date(startIso);
  if (Number.isNaN(parsed.getTime())) return 'Date TBA';
  return parsed.toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function WidgetUpcomingTicketCard({ item }: WidgetUpcomingTicketCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Upcoming Ticket</Text>
      {!item ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>No active ticket found.</Text>
      ) : (
        <Pressable
          style={[styles.ticket, { borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary }]}
          onPress={() => router.push({ pathname: '/tickets/[id]', params: { id: item.ticket.id } })}
          accessibilityRole="button"
          accessibilityLabel={`Open ticket ${item.ticket.id}`}
        >
          <View style={styles.ticketText}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item.event?.title ?? item.ticket.eventSnapshot?.title ?? 'CulturePass Ticket'}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={2}>
              {formatStart(item.startsAt)} {item.event?.venue ? `• ${item.event.venue}` : ''}
            </Text>
            <Text style={[styles.code, { color: colors.primary }]}>
              {item.ticket.cpTicketId ?? item.ticket.ticketCode ?? item.ticket.id}
            </Text>
          </View>
          <View style={[styles.qrStub, { borderColor: CultureTokens.indigo, backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.qrText, { color: CultureTokens.indigo }]}>QR</Text>
          </View>
        </Pressable>
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
  ticket: {
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ticketText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  code: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  qrStub: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
});

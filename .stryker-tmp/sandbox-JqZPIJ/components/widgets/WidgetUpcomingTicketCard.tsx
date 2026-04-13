// @ts-nocheck
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
      {!item ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={32} color={colors.textTertiary} />
          <Text style={[styles.empty, { color: colors.textSecondary }]}>No active ticket found.</Text>
        </View>
      ) : (
        <Pressable
          style={[styles.ticket, { borderColor: CultureTokens.indigo + '30', backgroundColor: colors.backgroundSecondary }]}
          onPress={() => router.push({ pathname: '/tickets/[id]', params: { id: (item.ticket as any).id ?? (item as any).ticketId } })}
          accessibilityRole="button"
          accessibilityLabel="Open upcoming ticket"
        >
          <View style={styles.ticketText}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {(item as any).eventTitle ?? item.event?.title ?? item.ticket?.eventSnapshot?.title ?? 'CulturePass Ticket'}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="time" size={14} color={CultureTokens.indigo} />
              <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                {formatStart((item as any).eventDate && (item as any).eventTime ? `${(item as any).eventDate}T${(item as any).eventTime}` : item.startsAt)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location" size={14} color={colors.textTertiary} />
              <Text style={[styles.meta, { color: colors.textTertiary }]} numberOfLines={1}>
                {(item as any).venue ?? item.event?.venue ?? 'See Details'}
              </Text>
            </View>
          </View>
          <View style={[styles.qrStub, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '30' }]}>
            <Ionicons name="qr-code" size={24} color={CultureTokens.indigo} />
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
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  empty: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  ticket: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ticketText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  qrStub: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

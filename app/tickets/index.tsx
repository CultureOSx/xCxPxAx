import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { ticketKeys } from '@/hooks/queries/keys';
import { CultureTokens, TextStyles, FontFamily } from '@/constants/theme';
import type { Ticket } from '@/shared/schema';

const IS_WEB = Platform.OS === 'web';

function parseDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(raw?: string | null): string {
  const d = parseDate(raw);
  if (!d) return 'Date TBA';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatMoney(cents?: number | null, currency?: string | null): string {
  const value = (cents ?? 0) / 100;
  const c = (currency || 'AUD').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function ticketState(t: Ticket): 'upcoming' | 'past' | 'cancelled' {
  if (t.status === 'cancelled') return 'cancelled';
  if (t.status === 'used' || t.status === 'expired') return 'past';
  const d = parseDate(t.eventDate || null);
  if (d && d.getTime() < Date.now()) return 'past';
  return 'upcoming';
}

async function shareTicket(t: Ticket) {
  const url = t.eventId ? `https://culturepass.app/event/${t.eventId}` : 'https://culturepass.app';
  const msg = `${t.eventTitle}\n${formatDate(t.eventDate || null)}${t.eventTime ? ` · ${t.eventTime}` : ''}\n${t.eventVenue || 'Venue TBA'}\n\n${url}`;
  try {
    await Share.share({ title: t.eventTitle, message: msg, url });
  } catch {
    // ignore user cancel
  }
}

function TicketCard({
  ticket,
  onCancel,
}: {
  ticket: Ticket;
  onCancel: (t: Ticket) => void;
}) {
  const colors = useColors();
  const state = ticketState(ticket);
  const isUpcoming = state === 'upcoming';
  const statusText =
    state === 'upcoming' ? 'Upcoming' : state === 'cancelled' ? 'Cancelled' : 'Past';
  const statusColor =
    state === 'upcoming' ? CultureTokens.teal : state === 'cancelled' ? CultureTokens.coral : colors.textTertiary;

  return (
    <Card
      onPress={() => router.push({ pathname: '/tickets/[id]', params: { id: ticket.id } })}
      style={[styles.ticketCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
      padding={14}
    >
      <View style={styles.rowBetween}>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
        <Text style={[styles.price, { color: colors.text }]}>
          {formatMoney(ticket.totalPriceCents, ticket.currency)}
        </Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {ticket.eventTitle || 'Event Ticket'}
      </Text>

      <View style={styles.metaList}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDate(ticket.eventDate || null)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{ticket.eventTime || 'Time TBA'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
            {ticket.eventVenue || 'Venue TBA'}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      <View style={styles.rowBetween}>
        <Text style={[styles.small, { color: colors.textSecondary }]}>
          {ticket.tierName || 'Standard'} x{ticket.quantity || 1}
        </Text>
        <View style={styles.actionsInline}>
          <Pressable onPress={() => void shareTicket(ticket)} style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={18} color={colors.textSecondary} />
          </Pressable>
          {isUpcoming ? (
            <Pressable onPress={() => onCancel(ticket)}>
              <Text style={[styles.cancelText, { color: CultureTokens.coral }]}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export default function TicketsScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const topInset = IS_WEB ? 0 : insets.top;
  const bottomInset = IS_WEB ? 20 : insets.bottom;

  const {
    data: tickets = [],
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery<Ticket[]>({
    queryKey: ticketKeys.forUser(userId ?? ''),
    queryFn: () => api.tickets.forUser(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (ticketId: string) => api.tickets.cancel(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.forUser(userId ?? '') });
      Alert.alert('Ticket cancelled', 'Your ticket has been cancelled.');
    },
    onError: () => {
      Alert.alert('Cancellation failed', 'Please try again.');
    },
  });

  const grouped = useMemo(() => {
    const upcoming: Ticket[] = [];
    const past: Ticket[] = [];
    const cancelled: Ticket[] = [];
    for (const t of tickets) {
      const s = ticketState(t);
      if (s === 'upcoming') upcoming.push(t);
      else if (s === 'past') past.push(t);
      else cancelled.push(t);
    }
    return { upcoming, past, cancelled };
  }, [tickets]);

  const askCancel = (ticket: Ticket) => {
    Alert.alert('Cancel ticket', `Cancel "${ticket.eventTitle}"?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Ticket',
        style: 'destructive',
        onPress: () => {
          if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          cancelMutation.mutate(ticket.id);
        },
      },
    ]);
  };

  return (
    <AuthGuard icon="ticket-outline" title="My Tickets" message="Sign in to view and manage your tickets.">
      <ErrorBoundary>
        <Stack.Screen options={{ title: 'My Tickets | CulturePass' }} />
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <TabPrimaryHeader title="My Tickets" subtitle={undefined} locationLabel={undefined} hPad={hPad} topInset={topInset} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={CultureTokens.indigo}
                colors={[CultureTokens.indigo]}
              />
            }
            contentContainerStyle={{
              paddingHorizontal: hPad,
              paddingTop: 12,
              paddingBottom: bottomInset + 34,
              alignSelf: 'center',
              width: '100%',
              maxWidth: isDesktop ? 860 : undefined,
            }}
          >
            {isLoading ? (
              <View style={{ gap: 12 }}>
                {[0, 1, 2].map((k) => (
                  <View key={k} style={[styles.ticketCard, { borderColor: colors.borderLight, backgroundColor: colors.surface, padding: 14 }]}>
                    <Skeleton width="70%" height={20} borderRadius={6} />
                    <Skeleton width="100%" height={52} borderRadius={8} style={{ marginTop: 10 }} />
                    <Skeleton width="45%" height={14} borderRadius={6} style={{ marginTop: 10 }} />
                  </View>
                ))}
              </View>
            ) : isError ? (
              <View style={styles.stateWrap}>
                <Ionicons name="alert-circle-outline" size={30} color={CultureTokens.coral} />
                <Text style={[styles.stateTitle, { color: colors.text }]}>Could not load tickets</Text>
                <Button onPress={() => void refetch()} variant="primary">Try Again</Button>
              </View>
            ) : tickets.length === 0 ? (
              <View style={styles.stateWrap}>
                <Ionicons name="ticket-outline" size={36} color={CultureTokens.indigo} />
                <Text style={[styles.stateTitle, { color: colors.text }]}>No tickets yet</Text>
                <Text style={[styles.stateSub, { color: colors.textSecondary }]}>
                  Book events and your tickets will appear here.
                </Text>
                <Button onPress={() => router.push('/events')} variant="primary">Discover Events</Button>
              </View>
            ) : (
              <>
                {grouped.upcoming.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                      Upcoming ({grouped.upcoming.length})
                    </Text>
                    {grouped.upcoming.map((t) => (
                      <TicketCard key={t.id} ticket={t} onCancel={askCancel} />
                    ))}
                  </View>
                ) : null}

                {grouped.past.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                      Past ({grouped.past.length})
                    </Text>
                    {grouped.past.map((t) => (
                      <TicketCard key={t.id} ticket={t} onCancel={askCancel} />
                    ))}
                  </View>
                ) : null}

                {grouped.cancelled.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
                      Cancelled ({grouped.cancelled.length})
                    </Text>
                    {grouped.cancelled.map((t) => (
                      <TicketCard key={t.id} ticket={t} onCancel={askCancel} />
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </ErrorBoundary>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: { marginBottom: 22 },
  sectionLabel: {
    marginBottom: 10,
    ...TextStyles.captionSemibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  ticketCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  statusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { ...TextStyles.tabLabel, letterSpacing: 0.4, textTransform: 'uppercase' },
  price: { ...TextStyles.headline },
  title: { marginTop: 8, ...TextStyles.headline, lineHeight: 22 },
  metaList: { marginTop: 10, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { ...TextStyles.caption, flex: 1 },
  divider: { height: 1, marginVertical: 10, opacity: 0.55 },
  small: { fontFamily: FontFamily.medium, fontSize: 12 },
  actionsInline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cancelText: { ...TextStyles.captionSemibold },

  stateWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 90, gap: 10 },
  stateTitle: { fontFamily: FontFamily.bold, fontSize: 19 },
  stateSub: { ...TextStyles.cardBody, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
});


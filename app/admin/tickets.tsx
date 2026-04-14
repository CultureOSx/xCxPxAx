import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { queryClient } from '@/lib/query-client';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { api } from '@/lib/api';
import { CultureTokens, gradients, TextStyles } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Ticket } from '@/shared/schema';

const isWeb = Platform.OS === 'web';

function TicketRow({ ticket, onPress, onCancel }: { 
  ticket: Ticket; 
  onPress: () => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const isCancellable = ticket.status === 'confirmed' || ticket.status === 'reserved';
  
  return (
    <View style={[styles.rowContainer, { borderBottomColor: colors.divider }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceElevated }]}>
        <View style={styles.ticketInfo}>
          <View style={[styles.iconWrap, { backgroundColor: CultureTokens.purple + '15' }]}>
            <Ionicons name="ticket" size={20} color={CultureTokens.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{ticket.eventSnapshot?.title || 'Unknown Event'}</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{ticket.tierName || 'Standard'} • {ticket.cpTicketId || ticket.id.slice(0, 8)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: ticket.status === 'confirmed' ? '#10B98120' : colors.divider }]}>
            <Text style={[styles.statusText, { color: ticket.status === 'confirmed' ? '#10B981' : colors.textTertiary }]}>
              {ticket.status?.toUpperCase()}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </Pressable>

      <View style={styles.actions}>
        {isCancellable && (
          <Pressable 
            onPress={onCancel} 
            style={[styles.actionBtn, { backgroundColor: '#FF5E5B15' }]}
          >
            <Ionicons name="close-circle-outline" size={18} color="#FF5E5B" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AdminTicketsScreen() {
  const colors = useColors();
  const { isDesktop, hPad, contentWidth } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const { isSuperAdmin, isAdmin, isLoading: roleLoading } = useRole();

  const [search, setSearch] = useState('');

  // Note: Tickets listing might be heavy. In production we'd use a dedicated admin tickets endpoint if available.
  // For now we use the global stats or list user tickets if search is for a user ID.
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin-tickets', search],
    queryFn: () => api.tickets.forUser(search || 'all'), // Placeholder logic
    enabled: isSuperAdmin || isAdmin,
  });


  // Mutations (must be above any early return)
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.tickets.cancel(id),
    onSuccess: () => {
      if(!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (err) => Alert.alert('Error', `Cancellation failed: ${err instanceof Error ? err.message : 'Unknown error'}`),
  });

  if (roleLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!isSuperAdmin && !isAdmin) {
    router.replace('/(tabs)');
    return null;
  }

  const handleCancel = (ticket: Ticket) => {
    Alert.alert(
      'Cancel Ticket',
      `Are you sure you want to cancel ticket ${ticket.cpTicketId || ticket.id.slice(0, 8)}?`,
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel Ticket', style: 'destructive', onPress: () => cancelMutation.mutate(ticket.id) },
      ]
    );
  };

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={gradients.midnight as unknown as [string, string]} style={{ paddingTop: topInset, zIndex: 10 }}>
          <View style={[styles.header, { paddingHorizontal: hPad }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#fff" /></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Global Tickets</Text>
              <Text style={styles.headerSub}>View all booking records and sales</Text>
            </View>
          </View>
          <View style={[styles.searchBox, { paddingHorizontal: hPad }]}>
            <View style={[styles.searchInputWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by User ID or Order ID..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>
          </View>
        </LinearGradient>

        <FlatList
          data={tickets ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TicketRow 
              ticket={item} 
              onPress={() => {}} 
              onCancel={() => handleCancel(item)}
            />
          )}
          contentContainerStyle={[
            styles.list, 
            { paddingBottom: insets.bottom + 20 },
            isDesktop && { width: contentWidth, alignSelf: 'center' }
          ]}
          ListEmptyComponent={() => (
            !isLoading ? (
              <View style={styles.empty}>
                <Ionicons name="ticket-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No tickets found</Text>
              </View>
            ) : null
          )}
          ListHeaderComponent={() => (
            isLoading ? (
              <View style={{ gap: 12, padding: 16 }}>
                {[1,2,3,4,5].map(i => <Skeleton key={i} width="100%" height={70} borderRadius={12} />)}
              </View>
            ) : null
          )}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...TextStyles.title2, color: '#fff' },
  headerSub: { ...TextStyles.caption, color: 'rgba(255,255,255,0.7)' },
  searchBox: { paddingBottom: 16, paddingTop: 8 },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44, borderRadius: 12, gap: 10 },
  searchInput: { flex: 1, color: '#fff', ...TextStyles.cardBody },
  list: { paddingVertical: 10 },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  row: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    gap: 12 
  },
  actions: {
    flexDirection: 'row',
    paddingRight: 16,
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { ...TextStyles.callout },
  subtitle: { ...TextStyles.caption },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 9, fontFamily: 'Poppins_700Bold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12 },
  emptyText: { ...TextStyles.cardBody },
});

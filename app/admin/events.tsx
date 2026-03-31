import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { api } from '@/lib/api';
import { CultureTokens, gradients } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import type { EventData } from '@/shared/schema';

const isWeb = Platform.OS === 'web';

// ─── Event Row Component ──────────────────────────────────────────────────────
function EventRow({ event, onPress }: { event: EventData; onPress: () => void }) {
  const colors = useColors();
  const date = event.date ? new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'No Date';
  
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.row, 
        { borderBottomColor: colors.divider },
        pressed && { backgroundColor: colors.surfaceElevated }
      ]}
    >
      <View style={styles.eventInfo}>
        <View style={[styles.dateBadge, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{date}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
          <View style={styles.eventMeta}>
            <Text style={[styles.eventSub, { color: colors.textTertiary }]}>{event.category} • {event.city}</Text>
            {event.isFeatured && (
              <View style={[styles.featuredBadge, { backgroundColor: CultureTokens.gold + '20' }]}>
                <Ionicons name="sparkles" size={10} color={CultureTokens.gold} />
                <Text style={[styles.featuredText, { color: CultureTokens.gold }]}>FEATURED</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

// ─── Main Admin Events CRUD Screen ──────────────────────────────────────────
export default function AdminEventsScreen() {
  const colors = useColors();
  const { isDesktop, hPad, contentWidth } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const { isSuperAdmin, isAdmin, isLoading: roleLoading } = useRole();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Fetch events via shared API
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-events', search, page],
    queryFn: () => api.events.list({ search, page, pageSize: 20 }),
    placeholderData: (previousData) => previousData,
    enabled: isSuperAdmin || isAdmin,
  });

  if (roleLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!isSuperAdmin && !isAdmin) {
    router.replace('/(tabs)');
    return null;
  }

  const events = data?.events ?? [];

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* Header */}
        <LinearGradient
          colors={gradients.midnight as unknown as [string, string]}
          style={{ paddingTop: topInset, zIndex: 10 }}
        >
          <View style={[styles.header, { paddingHorizontal: hPad }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Events Management</Text>
              <Text style={styles.subtitle}>List and moderate all platform events</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchBox, { paddingHorizontal: hPad }]}>
            <View style={[styles.searchInputWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search events by title, category, city..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={search}
                onChangeText={(t) => { setSearch(t); setPage(1); }}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                </Pressable>
              )}
            </View>
          </View>
        </LinearGradient>

        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventRow 
              event={item} 
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id, adminMode: 'true' } })} 
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
                <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No events found matching your search</Text>
              </View>
            ) : null
          )}
          ListHeaderComponent={() => (
            isLoading && events.length === 0 ? (
              <View style={{ gap: 12, padding: 16 }}>
                {[1,2,3,4,5].map(i => <Skeleton key={i} width="100%" height={80} radius={12} />)}
              </View>
            ) : null
          )}
          onEndReachedThreshold={0.3}
          refreshing={isLoading && !isPlaceholderData}
          onRefresh={() => setPage(1)}
        />

        {/* Floating Action Button for creation */}
        <Pressable
          style={[styles.fab, { backgroundColor: CultureTokens.indigo }]}
          onPress={() => router.push('/event/create')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff' },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)' },
  
  searchBox: { paddingBottom: 16, paddingTop: 8 },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular' },

  list: { paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  eventInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  eventTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  eventSub: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featuredText: { fontSize: 9, fontFamily: 'Poppins_700Bold' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  }
});

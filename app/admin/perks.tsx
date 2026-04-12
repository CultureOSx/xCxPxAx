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
import { CultureTokens, gradients } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PerkData } from '@/shared/schema';

const isWeb = Platform.OS === 'web';

function PerkRow({ perk, onPress, onToggleStatus, onDelete }: { 
  perk: PerkData; 
  onPress: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const isActive = perk.status === 'active';
  
  return (
    <View style={[styles.rowContainer, { borderBottomColor: colors.divider }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceElevated }]}>
        <View style={styles.perkInfo}>
          <View style={[styles.iconWrap, { backgroundColor: CultureTokens.coral + '15' }]}>
            <Ionicons name="gift" size={20} color={CultureTokens.coral} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{perk.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{perk.partnerName} • {perk.categories?.[0] || 'Perk'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? colors.success + '20' : colors.divider }]}>
            <Text style={[styles.statusText, { color: isActive ? colors.success : colors.textTertiary }]}>
              {(perk.status || 'DRAFT').toUpperCase()}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable 
          onPress={onToggleStatus} 
          style={[styles.actionBtn, { backgroundColor: isActive ? colors.success + '20' : colors.surfaceElevated }]}
        >
          <Ionicons 
            name={isActive ? "eye-off-outline" : "eye-outline"} 
            size={18} 
            color={isActive ? colors.success : colors.textTertiary} 
          />
        </Pressable>
        <Pressable 
          onPress={onDelete} 
          style={[styles.actionBtn, { backgroundColor: colors.error + '20' }]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminPerksScreen() {
  const colors = useColors();
  const { isDesktop, hPad, contentWidth } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const { isSuperAdmin, isAdmin, isLoading: roleLoading } = useRole();

  const [search, setSearch] = useState('');

  const { data: perks, isLoading } = useQuery({
    queryKey: ['admin-perks'],
    queryFn: () => api.perks.list(),
    enabled: isSuperAdmin || isAdmin,
  });


  // Mutations (must be above any early return)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'draft' }) => api.perks.update(id, { status }),
    onSuccess: () => {
      if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ['admin-perks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.perks.remove(id),
    onSuccess: () => {
      if(!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-perks'] });
    },
  });

  if (roleLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!isSuperAdmin && !isAdmin) {
    router.replace('/(tabs)');
    return null;
  }

  const handleDelete = (perk: PerkData) => {
    Alert.alert(
      'Delete Perk',
      `Are you sure you want to delete "${perk.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(perk.id) },
      ]
    );
  };

  const filtered = perks?.filter(p => 
    (p.title || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.partnerName || '').toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={gradients.midnight as unknown as [string, string]} style={{ paddingTop: topInset, zIndex: 10 }}>
          <View style={[styles.header, { paddingHorizontal: hPad }]}>
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/admin/dashboard')} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#fff" /></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Perks & Benefits</Text>
              <Text style={styles.headerSub}>Manage Partner Discounts & Member Coupons</Text>
            </View>
          </View>
          <View style={[styles.searchBox, { paddingHorizontal: hPad }]}>
            <View style={[styles.searchInputWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search perks..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>
          </View>
        </LinearGradient>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PerkRow 
              perk={item} 
              onPress={() => {}} 
              onToggleStatus={() => toggleStatusMutation.mutate({ id: item.id, status: item.status === 'active' ? 'draft' : 'active' })}
              onDelete={() => handleDelete(item)}
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
                <Ionicons name="gift-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No perks found</Text>
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
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff' },
  headerSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)' },
  searchBox: { paddingBottom: 16, paddingTop: 8 },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44, borderRadius: 12, gap: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular' },
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
  perkInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 9, fontFamily: 'Poppins_700Bold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
});

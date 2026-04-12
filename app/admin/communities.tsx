import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { queryClient } from '@/lib/query-client';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { api } from '@/lib/api';
import { CultureTokens, gradients, TextStyles } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Community } from '@/shared/schema';

const isWeb = Platform.OS === 'web';

function CommunityRow({ community, onPress, onToggleJoinMode, onDelete }: { 
  community: Community; 
  onPress: () => void;
  onToggleJoinMode: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const letter = community.name ? community.name[0].toUpperCase() : '?';
  const isOpen = community.joinMode === 'open';
  
  return (
    <View style={[styles.rowContainer, { borderBottomColor: colors.divider }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceElevated }]}>
        <View style={styles.communityInfo}>
          <View style={[styles.imageWrap, { backgroundColor: CultureTokens.indigo + '15' }]}>
            {community.imageUrl ? (
              <Image source={{ uri: community.imageUrl }} style={styles.image} contentFit="cover" />
            ) : (
              <Text style={[styles.imageLetter, { color: CultureTokens.indigo }]}>{letter}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{community.name}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{community.city} • {community.communityCategory}</Text>
              <View style={[styles.modeBadge, { backgroundColor: isOpen ? '#10B98115' : CultureTokens.gold + '15' }]}>
                <Text style={[styles.modeText, { color: isOpen ? '#10B981' : CultureTokens.gold }]}>
                  {(community.joinMode || 'OPEN').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable 
          onPress={onToggleJoinMode} 
          style={[styles.actionBtn, { backgroundColor: isOpen ? '#10B98115' : colors.surfaceElevated }]}
        >
          <Ionicons 
            name={isOpen ? "lock-open-outline" : "lock-closed-outline"} 
            size={18} 
            color={isOpen ? '#10B981' : colors.textTertiary} 
          />
        </Pressable>
        <Pressable 
          onPress={onDelete} 
          style={[styles.actionBtn, { backgroundColor: '#FF5E5B15' }]}
        >
          <Ionicons name="trash-outline" size={18} color="#FF5E5B" />
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminCommunitiesScreen() {
  const colors = useColors();
  const { isDesktop, hPad, contentWidth } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = isWeb ? 0 : insets.top;
  const { isSuperAdmin, isAdmin, isLoading: roleLoading } = useRole();

  const [search, setSearch] = useState('');

  const { data: communities, isLoading } = useQuery({
    queryKey: ['admin-communities', search],
    queryFn: () => api.communities.list({ city: search ? undefined : 'Sydney' }), // Simple placeholder logic
    enabled: isSuperAdmin || isAdmin,
  });


  // Mutations (must be above any early return)
  const toggleModeMutation = useMutation({
    mutationFn: ({ id, mode }: { id: string; mode: 'open' | 'request' | 'invite' }) => 
      api.communities.update(id, { joinMode: mode }),
    onSuccess: () => {
      if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ['admin-communities'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.communities.remove(id),
    onSuccess: () => {
      if(!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['admin-communities'] });
    },
  });

  if (roleLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!isSuperAdmin && !isAdmin) {
    router.replace('/(tabs)');
    return null;
  }

  const handleDelete = (community: Community) => {
    Alert.alert(
      'Delete Community',
      `Are you sure you want to delete "${community.name}"? This will remove all group members.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(community.id) },
      ]
    );
  };

  const filtered = communities?.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={gradients.midnight as unknown as [string, string]} style={{ paddingTop: topInset, zIndex: 10 }}>
          <View style={[styles.header, { paddingHorizontal: hPad }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={20} color="#fff" /></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Communities</Text>
              <Text style={styles.headerSub}>Manage Diaspora Groups & Local Hubs</Text>
            </View>
          </View>
          <View style={[styles.searchBox, { paddingHorizontal: hPad }]}>
            <View style={[styles.searchInputWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search communities..."
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
            <CommunityRow 
              community={item} 
              onPress={() => {}} 
              onToggleJoinMode={() => toggleModeMutation.mutate({ id: item.id, mode: item.joinMode === 'open' ? 'request' : 'open' })}
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
                <Ionicons name="people-circle-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No communities found</Text>
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
  communityInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: 44, height: 44 },
  imageLetter: { ...TextStyles.headline },
  title: { ...TextStyles.callout },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  subtitle: { ...TextStyles.caption },
  modeBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  modeText: { fontSize: 8, fontFamily: 'Poppins_700Bold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12 },
  emptyText: { ...TextStyles.cardBody },
});

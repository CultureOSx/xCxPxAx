import React, { useState } from 'react';
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
import type { Community } from '@/shared/schema';

const isWeb = Platform.OS === 'web';

function CommunityRow({ community, onPress }: { community: Community; onPress: () => void }) {
  const colors = useColors();
  const letter = community.name ? community.name[0].toUpperCase() : '?';
  
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { borderBottomColor: colors.divider }, pressed && { backgroundColor: colors.surfaceElevated }]}>
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
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{community.city} • {community.communityCategory}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
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

  if (roleLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!isSuperAdmin && !isAdmin) {
    router.replace('/(tabs)');
    return null;
  }

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
            <CommunityRow community={item} onPress={() => {}} />
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
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: '#fff' },
  headerSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.7)' },
  searchBox: { paddingBottom: 16, paddingTop: 8 },
  searchInputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44, borderRadius: 12, gap: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  list: { paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  communityInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: 44, height: 44 },
  imageLetter: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  title: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  subtitle: { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
});

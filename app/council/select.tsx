import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api, type CouncilData } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { useNearestCity } from '@/hooks/useNearestCity';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/constants/theme';
import { useLayout } from '@/hooks/useLayout';
import { queryClient } from '@/lib/query-client';
import { routeWithRedirect } from '@/lib/routes';
import { goBackOrReplace } from '@/lib/navigation';

const STATE_FILTERS = ['ALL', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;
const VIEW_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  { id: 'selected', label: 'Selected' },
] as const;

export default function CouncilSelectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDesktop, isTablet } = useLayout();
  const { updateLocation } = useOnboarding();
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams<{ next?: string }>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<(typeof STATE_FILTERS)[number]>('ALL');
  const [viewFilter, setViewFilter] = useState<(typeof VIEW_FILTERS)[number]['id']>('all');
  const [localSelectedCouncilId, setLocalSelectedCouncilId] = useState<string | null>(null);
  const [followOverrides, setFollowOverrides] = useState<Record<string, boolean>>({});
  const [actionCouncilId, setActionCouncilId] = useState<string | null>(null);
  const { detect, status: detectStatus } = useNearestCity();

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => clearTimeout(handle);
  }, [query]);

  const councilQuery = useQuery({
    queryKey: ['/api/council/list', 'select-browse', debouncedQuery, stateFilter],
    queryFn: () => api.council.list({
      q: debouncedQuery || undefined,
      state: stateFilter === 'ALL' ? undefined : stateFilter,
      pageSize: 2000,
      sortBy: 'name',
      sortDir: 'asc',
    }),
  });

  const selectedQuery = useQuery({
    queryKey: ['/api/council/selected'],
    queryFn: () => api.council.getSelected(),
    enabled: isAuthenticated,
  });

  const selectedId = selectedQuery.data?.council?.id ?? localSelectedCouncilId;

  const selectMutation = useMutation({
    mutationFn: async (council: CouncilData) => {
      await updateLocation('Australia', council.suburb || council.name);
      if (!isAuthenticated) return { success: true, councilId: council.id };
      return api.council.select(council.id);
    },
    onSuccess: async (result) => {
      setLocalSelectedCouncilId(result.councilId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/council/selected'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/council/list'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/council/my'] }),
      ]);
    },
  });

  const followMutation = useMutation({
    mutationFn: async ({ councilId, follow }: { councilId: string; follow: boolean }) => {
      if (follow) {
        return api.council.follow(councilId);
      }
      return api.council.unfollow(councilId);
    },
    onSuccess: async (_result, vars) => {
      setFollowOverrides((prev) => ({ ...prev, [vars.councilId]: vars.follow }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/council/list'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/council/my'] }),
      ]);
    },
  });

  const items = useMemo<(CouncilData & { following?: boolean; isPrimary?: boolean })[]>(() => {
    const base = councilQuery.data?.councils ?? [];
    const q = debouncedQuery.toLowerCase();
    if (!q) return base;

    const score = (item: CouncilData) => {
      const name = item.name.toLowerCase();
      const suburb = item.suburb.toLowerCase();
      const lga = item.lgaCode.toLowerCase();
      const stateCode = item.state.toLowerCase();
      const website = (item.websiteUrl ?? '').toLowerCase();
      if (name.startsWith(q)) return 100;
      if (name.includes(q)) return 80;
      if (suburb.startsWith(q)) return 60;
      if (suburb.includes(q)) return 40;
      if (stateCode === q) return 35;
      if (stateCode.includes(q)) return 32;
      if (lga.includes(q)) return 30;
      if (website.includes(q)) return 20;
      return 0;
    };

    const scored = [...base]
      .map((item) => ({ item, score: score(item) }))
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .map((entry) => entry.item);

    const hasStrongMatch = scored.some((item) => score(item) > 0);
    return hasStrongMatch ? scored : base;
  }, [councilQuery.data?.councils, debouncedQuery]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: items.length };
    for (const item of items) {
      const code = item.state?.toUpperCase() ?? '';
      if (!code) continue;
      counts[code] = (counts[code] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const followingCount = useMemo(
    () => items.filter((item) => (followOverrides[item.id] ?? item.following ?? false)).length,
    [items, followOverrides]
  );

  const gridColumns = Platform.OS === 'web' ? (isDesktop ? 3 : isTablet ? 2 : 1) : 1;
  const useInlineToolbar = Platform.OS === 'web';

  const hasExactSearch = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return true;
    return (councilQuery.data?.councils ?? []).some((item: CouncilData) => {
      const haystack = `${item.name} ${item.suburb} ${item.lgaCode} ${item.websiteUrl ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [debouncedQuery, councilQuery.data?.councils]);

  const detectLocation = async () => {
    const nearest = await detect();
    if (!nearest) return;
    setQuery(nearest.city);
    await updateLocation('Australia', nearest.city);
  };

  const visibleItems = useMemo(() => {
    if (viewFilter === 'following') {
      return items.filter((item) => (followOverrides[item.id] ?? item.following ?? false));
    }
    if (viewFilter === 'selected') {
      return items.filter((item) => item.id === selectedId);
    }
    return items;
  }, [items, viewFilter, followOverrides, selectedId]);

  const ensureAuthenticated = () => {
    if (isAuthenticated) return true;
    router.push(routeWithRedirect('/(onboarding)/login', '/council/select') as never);
    return false;
  };

  const renderItem = ({ item }: { item: CouncilData }) => {
    const active = item.id === selectedId;
    const following = followOverrides[item.id] ?? item.following ?? false;
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: active ? colors.primary : colors.borderLight },
        ]}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.verificationPill, { backgroundColor: item.verificationStatus === 'verified' ? colors.success + '20' : colors.surfaceElevated }]}>
              <Text style={[styles.verificationText, { color: item.verificationStatus === 'verified' ? colors.success : colors.textSecondary }]}>
                {item.verificationStatus === 'verified' ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.suburb}, {item.state} {item.postcode} · LGA {item.lgaCode}
          </Text>
          {item.websiteUrl ? <Text style={[styles.link, { color: colors.primary }]}>{item.websiteUrl}</Text> : null}
          <View style={styles.inlineMetaRow}>
            <View style={[styles.inlineMetaPill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
              <Text style={[styles.inlineMetaText, { color: colors.textSecondary }]}>{item.state}</Text>
            </View>
            {following ? (
              <View style={[styles.inlineMetaPill, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' }]}>
                <Text style={[styles.inlineMetaText, { color: colors.primary }]}>Following</Text>
              </View>
            ) : null}
            {active ? (
              <View style={[styles.inlineMetaPill, { backgroundColor: colors.success + '20', borderColor: colors.success + '40' }]}>
                <Text style={[styles.inlineMetaText, { color: colors.success }]}>Selected</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.actionRow}>
          <Button
            size="sm"
            variant={following ? 'outline' : 'secondary'}
            onPress={async () => {
              if (!ensureAuthenticated()) return;
              setActionCouncilId(item.id);
              try {
                await followMutation.mutateAsync({ councilId: item.id, follow: !following });
              } finally {
                setActionCouncilId(null);
              }
            }}
            loading={actionCouncilId === item.id && followMutation.isPending}
          >
            {following ? 'Following' : 'Follow'}
          </Button>
          <Button
            size="sm"
            variant={active ? 'primary' : 'outline'}
            onPress={async () => {
              setActionCouncilId(item.id);
              try {
                await selectMutation.mutateAsync(item);
              } finally {
                setActionCouncilId(null);
              }
            }}
            loading={actionCouncilId === item.id && selectMutation.isPending}
          >
            {active ? 'Selected' : 'Select'}
          </Button>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? 12 : insets.top + 8 }]}>
      <View style={styles.header}>
        <Button variant="ghost" size="sm" onPress={() => goBackOrReplace('/(tabs)')}>Back</Button>
        <Text style={[styles.title, { color: colors.text }]}>Choose your council</Text>
        <View style={{ width: 56 }} />
      </View>

      <View style={[styles.toolbarSection, useInlineToolbar && styles.toolbarSectionInline]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, useInlineToolbar && styles.heroInline]}
        >
          <Text style={[styles.heroTitle, { color: colors.textInverse }]}>Find your local council</Text>
          <Text style={[styles.heroSub, { color: colors.textInverse }]}>Search by suburb, council name, or state.</Text>
        </LinearGradient>

        <View style={[styles.toolbarRow, useInlineToolbar && styles.toolbarRowInline]}>
          <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.borderLight }, useInlineToolbar && styles.searchWrapInline]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search council / suburb / state"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { color: colors.text }]}
            />
          </View>
          <View style={useInlineToolbar ? styles.autoDetectInline : undefined}>
            <Button
              size="sm"
              variant="secondary"
              onPress={detectLocation}
              loading={detectStatus === 'requesting'}
              disabled={detectStatus === 'requesting'}
            >
              Auto-detect location
            </Button>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.filtersStickyWrap,
          { backgroundColor: colors.background, borderBottomColor: colors.borderLight },
          Platform.OS === 'web' ? ({ position: 'sticky', top: 0 } as any) : null,
        ]}
      >
        <View style={styles.viewFilterRow}>
          {VIEW_FILTERS.map((filter) => {
            const active = filter.id === viewFilter;
            return (
              <Pressable
                key={filter.id}
                onPress={() => setViewFilter(filter.id)}
                style={[
                  styles.viewChip,
                  {
                    backgroundColor: active ? colors.primarySoft : colors.surface,
                    borderColor: active ? colors.primary + '40' : colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.viewChipText, { color: active ? colors.primary : colors.textSecondary }]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stateFilterRow}>
          {STATE_FILTERS.map((stateCode) => {
            const active = stateFilter === stateCode;
            const count = stateCounts[stateCode] ?? 0;
            return (
              <Pressable
                key={stateCode}
                onPress={() => setStateFilter(stateCode)}
                style={[
                  styles.stateChip,
                  {
                    borderColor: active ? colors.primary : colors.borderLight,
                    backgroundColor: active ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text style={[styles.stateChipText, { color: active ? colors.textInverse : colors.textSecondary }]}>
                  {stateCode} · {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.searchActions}>
        {detectStatus === 'denied' ? <Text style={[styles.detectHint, { color: colors.warning }]}>Location permission denied.</Text> : null}
        {detectStatus === 'unavailable' ? <Text style={[styles.detectHint, { color: colors.warning }]}>Location services are off.</Text> : null}
        {detectStatus === 'error' ? <Text style={[styles.detectHint, { color: colors.error }]}>Could not detect your city. Try search.</Text> : null}
        {detectStatus === 'success' ? <Text style={[styles.detectHint, { color: colors.success }]}>Location detected. Results updated.</Text> : null}
        <Text style={[styles.detectHint, { color: colors.textSecondary }]}>
          Showing {visibleItems.length} of {items.length} councils · Following {followingCount}
        </Text>
        {__DEV__ && councilQuery.data?.source ? (
          <Text style={[styles.detectHint, { color: colors.textTertiary }]}>
            Data source: {councilQuery.data.source === 'firestore' ? 'Firestore' : 'Mock'}
          </Text>
        ) : null}
        {selectedId ? <Text style={[styles.detectHint, { color: colors.success }]}>Council selected. Tap Continue to open My Council.</Text> : null}
        {debouncedQuery.length > 0 && !hasExactSearch ? (
          <Text style={[styles.detectHint, { color: colors.warning }]}>No exact match found, showing all councils.</Text>
        ) : null}
      </View>

      {councilQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Loading councils…</Text>
        </View>
      ) : (
        <FlatList
          key={`council-grid-${gridColumns}`}
          data={visibleItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.cardWrap, gridColumns > 1 && (gridColumns === 3 ? styles.cardWrap3 : styles.cardWrap2)]}>
              {renderItem({ item })}
            </View>
          )}
          numColumns={gridColumns}
          columnWrapperStyle={gridColumns > 1 ? styles.cardRow : undefined}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.hint, { color: colors.textSecondary }]}>No councils for this filter. Try another state or view.</Text>
            </View>
          }
        />
      )}

      <View style={[styles.footer, { borderTopColor: colors.borderLight, backgroundColor: colors.background }]}> 
        <Button
          variant="secondary"
          onPress={() => {
            const nextRoute = typeof params.next === 'string' && params.next.length > 0 ? params.next : '/(tabs)/council';
            router.replace(nextRoute as never);
          }}
          disabled={selectMutation.isPending}
        >
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  title: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  toolbarSection: { paddingHorizontal: 16, gap: 8 },
  toolbarSectionInline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toolbarRow: { gap: 8 },
  toolbarRowInline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hero: { marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8, gap: 2 },
  heroInline: { marginHorizontal: 0, marginBottom: 0, width: 300, minHeight: 58, justifyContent: 'center' },
  heroTitle: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  heroSub: { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  searchWrap: { marginHorizontal: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 46, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchWrapInline: { marginHorizontal: 0, flex: 1 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Poppins_500Medium' },
  autoDetectInline: { minWidth: 170 },
  filtersStickyWrap: {
    zIndex: 20,
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  viewFilterRow: { paddingHorizontal: 16, paddingTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewChip: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewChipText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  stateFilterRow: { paddingHorizontal: 16, paddingTop: 4, paddingRight: 22, flexDirection: 'row', gap: 6 },
  stateChip: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 34,
    minWidth: 82,
    paddingHorizontal: 11,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateChipText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  searchActions: { paddingHorizontal: 16, paddingTop: 10, gap: 6 },
  detectHint: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  hint: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  cardWrap: { width: '100%' },
  cardWrap2: { width: '49%' },
  cardWrap3: { width: '32.2%' },
  cardRow: { justifyContent: 'space-between', marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verificationPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verificationText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  name: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  meta: { marginTop: 4, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  link: { marginTop: 4, fontSize: 12, fontFamily: 'Poppins_500Medium' },
  inlineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  inlineMetaPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inlineMetaText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footer: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
});

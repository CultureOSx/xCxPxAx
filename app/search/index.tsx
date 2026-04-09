import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { Card } from '@/components/ui/Card';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api } from '@/lib/api';
import { CultureTokens, gradients } from '@/constants/theme';

type ResultType = 'event' | 'movie' | 'restaurant' | 'activity' | 'shopping' | 'community' | 'person';

type SearchResult = {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  imageUrl?: string;
};

const FALLBACK_TRENDS = ['Diwali', 'Comedy Night', 'Bollywood', 'Food Festival', 'Art Exhibition', 'Cricket'];
const IS_WEB = Platform.OS === 'web';

const TYPE_META: Record<ResultType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  event: { label: 'Events', icon: 'calendar-outline', color: CultureTokens.gold },
  movie: { label: 'Movies', icon: 'film-outline', color: CultureTokens.gold },
  restaurant: { label: 'Dining', icon: 'restaurant-outline', color: CultureTokens.coral },
  activity: { label: 'Activities', icon: 'football-outline', color: CultureTokens.teal },
  shopping: { label: 'Shopping', icon: 'bag-outline', color: CultureTokens.indigo },
  community: { label: 'Communities', icon: 'people-outline', color: CultureTokens.indigo },
  person: { label: 'People', icon: 'person-outline', color: CultureTokens.coral },
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'near', 'your', 'this', 'that', 'into', 'over', 'under',
  'city', 'community', 'group', 'event', 'events', 'movie', 'movies', 'festival', 'festivals',
  'culture', 'cultural', 'club', 'society', 'association', 'australia',
]);

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
}

function titleCase(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function buildTrendingTerms(payload: {
  events: any[];
  communities: any[];
  movies: any[];
  profiles: any[];
}): string[] {
  const scored = new Map<string, number>();
  const bump = (token: string, weight: number) => scored.set(token, (scored.get(token) || 0) + weight);

  for (const e of payload.events) {
    normalizeTokens(`${e.title || ''} ${e.category || ''} ${(e.tags || []).join(' ')}`).forEach((t) => bump(t, 3));
  }
  for (const c of payload.communities) {
    normalizeTokens(`${c.name || ''} ${c.communityCategory || ''} ${c.countryOfOrigin || ''}`).forEach((t) => bump(t, 2));
  }
  for (const m of payload.movies) {
    normalizeTokens(`${m.title || ''} ${(m.genre || []).join(' ')} ${m.language || ''}`).forEach((t) => bump(t, 2));
  }
  for (const p of payload.profiles) {
    normalizeTokens(`${p.name || ''} ${p.category || ''} ${p.entityType || ''}`).forEach((t) => bump(t, 1));
  }

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([token]) => titleCase(token));
}

function buildTrendIndex(payload: {
  events: any[];
  communities: any[];
  movies: any[];
  profiles: any[];
}): Map<string, number> {
  const index = new Map<string, number>();
  const bump = (term: string, weight: number) => index.set(term, (index.get(term) || 0) + weight);
  const add = (text: string, weight: number) => normalizeTokens(text).forEach((token) => bump(token, weight));

  payload.events.forEach((e) => add(`${e.title || ''} ${e.category || ''} ${(e.tags || []).join(' ')}`, 3));
  payload.communities.forEach((c) => add(`${c.name || ''} ${c.communityCategory || ''} ${c.countryOfOrigin || ''}`, 2));
  payload.movies.forEach((m) => add(`${m.title || ''} ${(m.genre || []).join(' ')} ${m.language || ''}`, 2));
  payload.profiles.forEach((p) => add(`${p.name || ''} ${p.category || ''} ${p.entityType || ''}`, 1));

  return index;
}

function mapResults(raw: any): SearchResult[] {
  const out: SearchResult[] = [];
  const events = Array.isArray(raw?.events) ? raw.events : [];
  const movies = Array.isArray(raw?.movies) ? raw.movies : [];
  const profiles = Array.isArray(raw?.profiles) ? raw.profiles : [];
  const users = Array.isArray(raw?.users) ? raw.users : [];

  for (const e of events) {
    out.push({
      id: e.id,
      type: 'event',
      title: e.title ?? 'Event',
      subtitle: [e.venue, e.city].filter(Boolean).join(' · ') || 'Event',
      imageUrl: e.imageUrl,
    });
  }
  for (const m of movies) {
    out.push({
      id: m.id,
      type: 'movie',
      title: m.title ?? 'Movie',
      subtitle: Array.isArray(m.genre) ? m.genre.join(', ') : m.description || 'Movie',
      imageUrl: m.posterUrl || m.imageUrl,
    });
  }
  for (const p of profiles) {
    let type: ResultType = 'community';
    if (p.entityType === 'business') {
      const cat = String(p.category || '').toLowerCase();
      if (cat.includes('food') || cat.includes('restaurant')) type = 'restaurant';
      else if (cat.includes('shop') || cat.includes('retail')) type = 'shopping';
    }
    out.push({
      id: p.id,
      type,
      title: p.name ?? 'Profile',
      subtitle: [p.category || p.entityType, p.city || 'Australia'].filter(Boolean).join(' · '),
      imageUrl: p.imageUrl || p.avatarUrl,
    });
  }
  for (const u of users) {
    out.push({
      id: u.id,
      type: 'person',
      title: u.displayName || u.username || 'User',
      subtitle: `@${u.username || 'user'} · ${u.city || 'CulturePass'}`,
      imageUrl: u.avatarUrl,
    });
  }
  return out;
}

export default function SearchScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { state } = useOnboarding();
  const params = useLocalSearchParams<{
    q?: string;
    publisherProfileId?: string;
    venueProfileId?: string;
  }>();

  const topInset = IS_WEB ? 0 : insets.top;
  const bottomInset = IS_WEB ? 26 : insets.bottom;

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ResultType | 'all'>('all');
  const [focused, setFocused] = useState(false);

  const publisherProfileId = useMemo(() => {
    const raw = Array.isArray(params.publisherProfileId)
      ? params.publisherProfileId[0]
      : params.publisherProfileId;
    return raw?.trim() || undefined;
  }, [params.publisherProfileId]);

  const venueProfileId = useMemo(() => {
    const raw = Array.isArray(params.venueProfileId) ? params.venueProfileId[0] : params.venueProfileId;
    return raw?.trim() || undefined;
  }, [params.venueProfileId]);

  useEffect(() => {
    const raw = Array.isArray(params.q) ? params.q[0] : params.q;
    if (!raw) return;
    try {
      setQuery(decodeURIComponent(raw));
    } catch {
      setQuery(raw);
    }
  }, [params.q]);

  const structuredSearch =
    Boolean(publisherProfileId) || Boolean(venueProfileId);

  const { data, isFetching } = useQuery({
    queryKey: ['search', query, state.city, state.country, publisherProfileId, venueProfileId],
    queryFn: () =>
      api.search.query({
        q: query.trim(),
        city: state.city || undefined,
        country: state.country || undefined,
        publisherProfileId,
        venueProfileId,
      }),
    enabled: query.trim().length >= 2 || structuredSearch,
    staleTime: 60_000,
  });

  const allResults = useMemo(() => mapResults(data), [data]);

  const { data: liveTrends = FALLBACK_TRENDS } = useQuery({
    queryKey: ['search-trending', state.city, state.country],
    queryFn: async () => {
      const [eventsPage, communities, movies, profiles] = await Promise.all([
        api.events.list({ city: state.city || undefined, country: state.country || undefined, pageSize: 120 }),
        api.communities.list({ city: state.city || undefined, country: state.country || undefined }),
        api.movies.list({
          ...(state.city ? { city: state.city } : {}),
          ...(state.country ? { country: state.country } : {}),
          limit: '80',
        }),
        api.profiles.list({ city: state.city || undefined, country: state.country || undefined, pageSize: 80 }),
      ]);
      const computed = buildTrendingTerms({
        events: eventsPage?.events ?? [],
        communities: communities ?? [],
        movies: movies ?? [],
        profiles: profiles ?? [],
      });
      return computed.length > 0 ? computed : FALLBACK_TRENDS;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const autoIndexedTrends = useMemo(() => {
    const events = Array.isArray(data?.events) ? data.events : [];
    const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
    const movies = Array.isArray(data?.movies) ? data.movies : [];
    const communities = profiles.filter((p: any) => p.entityType === 'community');

    const index = buildTrendIndex({ events, communities, movies, profiles });
    if (index.size === 0) return liveTrends;

    const ranked = [...index.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([token]) => titleCase(token));

    return ranked.length > 0 ? ranked : liveTrends;
  }, [data, liveTrends]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allResults.length };
    for (const r of allResults) c[r.type] = (c[r.type] || 0) + 1;
    return c;
  }, [allResults]);

  const filtered = useMemo(
    () => (selectedType === 'all' ? allResults : allResults.filter((r) => r.type === selectedType)),
    [allResults, selectedType],
  );

  const onTypePress = (type: ResultType | 'all') => {
    if (!IS_WEB) Haptics.selectionAsync().catch(() => {});
    setSelectedType(type);
  };

  const onResultPress = (r: SearchResult) => {
    if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const path: Record<ResultType, string> = {
      event: '/event/[id]',
      movie: '/movies/[id]',
      restaurant: '/restaurants/[id]',
      activity: '/activities/[id]',
      shopping: '/shopping/[id]',
      community: '/profile/[id]',
      person: '/profile/[id]',
    };
    router.push({ pathname: path[r.type], params: { id: r.id } });
  };

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ambient}
          pointerEvents="none"
        />

        <TabPrimaryHeader title="Search" subtitle={undefined} locationLabel={undefined} hPad={hPad} topInset={topInset} />

        <View style={[styles.shell, isDesktop ? styles.desktopShell : null]}>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(220)}>
            <View style={[styles.searchRow, { marginHorizontal: hPad, borderColor: focused ? CultureTokens.indigo : colors.borderLight, backgroundColor: colors.surface }]}>
              <Ionicons name="search" size={18} color={focused ? CultureTokens.indigo : colors.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search events, communities, venues..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.searchInput, { color: colors.text }]}
                returnKeyType="search"
                accessibilityLabel="Search"
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>
          </Animated.View>

          <Pressable
            onPress={() => {
              if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push('/culture');
            }}
            style={[
              styles.hubEntry,
              {
                marginHorizontal: hPad,
                marginTop: 12,
                backgroundColor: colors.surface,
                borderColor: colors.borderLight,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Browse culture and language hubs"
          >
            <Ionicons name="earth-outline" size={20} color={CultureTokens.indigo} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.hubEntryTitle, { color: colors.text }]}>Culture & language hubs</Text>
              <Text style={[styles.hubEntrySub, { color: colors.textTertiary }]}>
                Kerala, Gujarati, Filipino, and more — filter by country or worldwide
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>

          {query.trim().length >= 2 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterRow, { paddingHorizontal: hPad }]}
              style={{ marginTop: 10 }}
            >
              <Pressable
                onPress={() => onTypePress('all')}
                style={[styles.filterChip, { backgroundColor: selectedType === 'all' ? CultureTokens.indigo : colors.surface, borderColor: selectedType === 'all' ? CultureTokens.indigo : colors.borderLight }]}
              >
                <Text style={[styles.filterText, { color: selectedType === 'all' ? '#fff' : colors.text }]}>All ({counts.all || 0})</Text>
              </Pressable>
              {(Object.keys(TYPE_META) as ResultType[]).map((t) =>
                counts[t] ? (
                  <Pressable
                    key={t}
                    onPress={() => onTypePress(t)}
                    style={[styles.filterChip, { backgroundColor: selectedType === t ? TYPE_META[t].color + '18' : colors.surface, borderColor: selectedType === t ? TYPE_META[t].color : colors.borderLight }]}
                  >
                    <Ionicons name={TYPE_META[t].icon} size={13} color={selectedType === t ? TYPE_META[t].color : colors.textTertiary} />
                    <Text style={[styles.filterText, { color: selectedType === t ? TYPE_META[t].color : colors.text }]}>
                      {TYPE_META[t].label} ({counts[t] || 0})
                    </Text>
                  </Pressable>
                ) : null,
              )}
            </ScrollView>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 40 }}>
            {query.trim().length === 0 ? (
              <View style={[styles.section, { paddingHorizontal: hPad }]}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Trending Searches</Text>
                <View style={styles.trendingGrid}>
                  {autoIndexedTrends.map((term) => (
                    <Pressable
                      key={term}
                      onPress={() => setQuery(term)}
                      style={({ pressed }) => [
                        styles.trendingChip,
                        { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: pressed ? 0.86 : 1 },
                      ]}
                    >
                      <Ionicons name="trending-up" size={14} color={CultureTokens.indigo} />
                      <Text style={[styles.trendingText, { color: colors.text }]}>{term}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : isFetching ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={CultureTokens.indigo} />
              </View>
            ) : filtered.length === 0 ? (
              <View style={[styles.centerState, { paddingHorizontal: hPad + 20 }]}>
                <Ionicons name="search-outline" size={34} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try another keyword or remove filters.</Text>
              </View>
            ) : (
              <View style={[styles.resultsWrap, { paddingHorizontal: hPad }]}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                </Text>
                {filtered.map((r) => (
                  <Card key={`${r.type}-${r.id}`} onPress={() => onResultPress(r)} style={styles.resultCard} padding={14}>
                    <View style={[styles.iconBox, { backgroundColor: TYPE_META[r.type].color + '14' }]}>
                      <Ionicons name={TYPE_META[r.type].icon} size={20} color={TYPE_META[r.type].color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{r.title}</Text>
                      <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1}>{r.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  ambient: { ...StyleSheet.absoluteFillObject, opacity: 0.07 },
  shell: { flex: 1 },
  desktopShell: { maxWidth: 980, width: '100%', alignSelf: 'center' },

  searchRow: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 46,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    paddingVertical: 0,
  },

  filterRow: { gap: 8, paddingTop: 10, paddingBottom: 2, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  filterText: { fontFamily: 'Poppins_600SemiBold', fontSize: 12 },

  section: { paddingTop: 20 },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  trendingText: { fontFamily: 'Poppins_500Medium', fontSize: 13 },

  centerState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18 },
  emptySub: { fontFamily: 'Poppins_400Regular', fontSize: 14, textAlign: 'center' },

  resultsWrap: { paddingTop: 12, gap: 10 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  resultSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 1 },

  hubEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hubEntryTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  hubEntrySub: { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 2 },
});


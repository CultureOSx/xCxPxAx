import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, Radius, Spacing, gradients, FontFamily } from '@/constants/theme';
import { GLOBAL_REGIONS } from '@/constants/locations';
import { COMMON_LANGUAGES, getLanguage } from '@/constants/languages';
import { api } from '@/lib/api';
import { goBackOrReplace } from '@/lib/navigation';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { EventData, MovieData, PerkData, Profile, User } from '@/shared/schema';
import { LocationPicker } from '@/components/LocationPicker';
import { TextStyles } from '@/constants/typography';

const isWeb = Platform.OS === 'web';

const AU_STATES = GLOBAL_REGIONS.filter((item) => item.country === 'Australia');
const QUICK_LANGUAGES = COMMON_LANGUAGES.slice(0, 20);

const STEP_META = [
  { step: 1, label: 'State', icon: 'location-outline' as const, hint: 'Where your community hub is anchored' },
  { step: 2, label: 'Language', icon: 'language-outline' as const, hint: 'Heritage or primary language tag' },
  { step: 3, label: 'Open', icon: 'open-outline' as const, hint: 'Preview and launch the hub page' },
];

const POPULAR_FINDER = ['Diwali', 'Bollywood', 'Sydney food', 'Perks', 'Tamil', 'Comedy'];

type FinderMode = 'search' | 'hub';

type FilterKey = 'all' | 'events' | 'perks' | 'movies' | 'places' | 'people';

type FinderHit =
  | { kind: 'event'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: EventData }
  | { kind: 'movie'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: MovieData }
  | { kind: 'place'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: Profile }
  | { kind: 'person'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: User }
  | { kind: 'perk'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: PerkData };

const QUICK_DESTINATIONS: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  color: string;
}[] = [
  { label: 'Discover', icon: 'compass-outline', href: '/(tabs)/index', color: CultureTokens.indigo },
  { label: 'Events', icon: 'calendar-outline', href: '/events', color: CultureTokens.gold },
  { label: 'Perks', icon: 'gift-outline', href: '/(tabs)/perks', color: CultureTokens.coral },
  { label: 'Movies', icon: 'film-outline', href: '/movies', color: CultureTokens.teal },
  { label: 'Community', icon: 'people-outline', href: '/(tabs)/community', color: CultureTokens.indigo },
  { label: 'Saved', icon: 'bookmark-outline', href: '/saved', color: CultureTokens.gold },
  { label: 'Search', icon: 'search-outline', href: '/search', color: CultureTokens.coral },
];

function profileRouteParams(p: Profile): { pathname: string; params: { id: string } } {
  const id = p.slug || p.id;
  switch (p.entityType) {
    case 'community':
      return { pathname: '/community/[id]', params: { id } };
    case 'venue':
      return { pathname: '/venue/[id]', params: { id } };
    case 'business':
    case 'brand':
      return { pathname: '/business/[id]', params: { id } };
    case 'artist':
    case 'creator':
      return { pathname: '/artist/[id]', params: { id } };
    case 'restaurant':
      return { pathname: '/restaurants/[id]', params: { id } };
    case 'organizer':
      return { pathname: '/organiser/[id]', params: { id } };
    default:
      return { pathname: '/profile/[id]', params: { id: p.id } };
  }
}

function placeLabel(entityType: Profile['entityType']): string {
  switch (entityType) {
    case 'community':
      return 'Community';
    case 'venue':
      return 'Venue';
    case 'business':
    case 'brand':
      return 'Business';
    case 'restaurant':
      return 'Dining';
    case 'artist':
    case 'creator':
      return 'Artist';
    case 'organizer':
      return 'Organiser';
    default:
      return 'Profile';
  }
}

function perkMatchesQuery(p: PerkData, q: string): boolean {
  const s = q.toLowerCase();
  const blob = [
    p.title,
    p.description,
    p.partnerName,
    ...(p.cultureTags ?? []),
    ...(p.categories ?? []),
    p.city,
    p.country,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return blob.includes(s);
}

function perkSubtitle(p: PerkData): string {
  const parts: string[] = [];
  if (p.partnerName) parts.push(p.partnerName);
  if (p.discountPercent != null && p.discountPercent > 0) parts.push(`${p.discountPercent}% off`);
  if (p.pointsCost != null && p.pointsCost > 0) parts.push(`${p.pointsCost} pts`);
  if (p.priceTier) parts.push(p.priceTier);
  if (parts.length === 0 && p.description) return p.description.length > 90 ? `${p.description.slice(0, 87)}…` : p.description;
  return parts.join(' · ') || 'Member offer';
}

function navigateHit(hit: FinderHit) {
  if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  switch (hit.kind) {
    case 'event':
      router.push({ pathname: '/event/[id]', params: { id: hit.id } });
      break;
    case 'movie':
      router.push({ pathname: '/movies/[id]', params: { id: hit.id } });
      break;
    case 'perk':
      router.push({ pathname: '/perks/[id]', params: { id: hit.id } });
      break;
    case 'place': {
      const r = profileRouteParams(hit.raw);
      router.push(r as Parameters<typeof router.push>[0]);
      break;
    }
    case 'person':
      router.push({ pathname: '/profile/[id]', params: { id: hit.id } });
      break;
    default:
      break;
  }
}

export default function FinderScreen() {
  const colors = useColors();
  const { isDesktop, hPad } = useLayout();
  const insets = useSafeAreaInsets();
  const { state } = useOnboarding();
  const [mode, setMode] = useState<FinderMode>('search');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const [stateCode, setStateCode] = useState('NSW');
  const [languageId, setLanguageId] = useState('mal');

  const bottomInset = isWeb ? 34 : insets.bottom;
  const padX = isDesktop ? Math.max(hPad, Spacing.xl) : Spacing.md;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 320);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (query.trim().length === 0) setFilter('all');
  }, [query]);

  const selectedState = useMemo(
    () => AU_STATES.find((s) => s.value === stateCode),
    [stateCode],
  );
  const selectedLanguage = useMemo(() => getLanguage(languageId), [languageId]);
  const previewUrl = `/hub/australia/${stateCode.toLowerCase()}?lang=${languageId}`;
  const activeStep = 3;

  const {
    data: searchData,
    isFetching: searchFetching,
    isError: searchError,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: ['finder', 'search', debounced, state.city, state.country],
    queryFn: () =>
      api.search.query({
        q: debounced,
        city: state.city || undefined,
        country: state.country || undefined,
        pageSize: 40,
      }),
    enabled: mode === 'search' && debounced.length >= 2,
    staleTime: 60_000,
  });

  const { data: perksList = [], isFetching: perksFetching } = useQuery({
    queryKey: ['perks', 'list', 'finder'],
    queryFn: () => api.perks.list(),
    enabled: mode === 'search' && debounced.length >= 2,
    staleTime: 300_000,
  });

  const allHits = useMemo((): FinderHit[] => {
    if (debounced.length < 2) return [];
    const out: FinderHit[] = [];

    const events = Array.isArray(searchData?.events) ? searchData!.events : [];
    events.forEach((e: EventData) => {
      out.push({
        kind: 'event',
        id: e.id,
        title: e.title,
        subtitle: [e.venue, e.city].filter(Boolean).join(' · ') || 'Event',
        imageUrl: e.heroImageUrl ?? e.imageUrl,
        accent: CultureTokens.gold,
        raw: e,
      });
    });

    const movies = Array.isArray(searchData?.movies) ? searchData!.movies : [];
    movies.forEach((m: MovieData) => {
      out.push({
        kind: 'movie',
        id: m.id,
        title: m.title,
        subtitle: (m.genre?.length ? m.genre.join(', ') : m.description) || 'Movie',
        imageUrl: m.posterUrl,
        accent: CultureTokens.teal,
        raw: m,
      });
    });

    const profiles = Array.isArray(searchData?.profiles) ? searchData!.profiles : [];
    profiles.forEach((p: Profile) => {
      out.push({
        kind: 'place',
        id: p.id,
        title: p.name,
        subtitle: `${placeLabel(p.entityType)} · ${p.city || p.country || 'Australia'}`,
        imageUrl: p.avatarUrl ?? p.imageUrl,
        accent: CultureTokens.indigo,
        raw: p,
      });
    });

    const users = Array.isArray(searchData?.users) ? searchData!.users : [];
    users.forEach((u: User) => {
      out.push({
        kind: 'person',
        id: u.id,
        title: u.displayName || u.username || 'Member',
        subtitle: u.username ? `@${u.username}` : u.city || 'CulturePass',
        imageUrl: u.avatarUrl,
        accent: CultureTokens.coral,
        raw: u,
      });
    });

    perksList.forEach((p: PerkData) => {
      if (!perkMatchesQuery(p, debounced)) return;
      out.push({
        kind: 'perk',
        id: p.id,
        title: p.title,
        subtitle: perkSubtitle(p),
        imageUrl: p.coverUrl,
        accent: CultureTokens.coral,
        raw: p,
      });
    });

    return out;
  }, [debounced, searchData, perksList]);

  const filteredHits = useMemo(() => {
    if (filter === 'all') return allHits;
    return allHits.filter((h) => {
      if (filter === 'events') return h.kind === 'event';
      if (filter === 'perks') return h.kind === 'perk';
      if (filter === 'movies') return h.kind === 'movie';
      if (filter === 'places') return h.kind === 'place';
      if (filter === 'people') return h.kind === 'person';
      return true;
    });
  }, [allHits, filter]);

  const counts = useMemo(() => {
    const c = { all: allHits.length, events: 0, perks: 0, movies: 0, places: 0, people: 0 };
    allHits.forEach((h) => {
      if (h.kind === 'event') c.events += 1;
      else if (h.kind === 'perk') c.perks += 1;
      else if (h.kind === 'movie') c.movies += 1;
      else if (h.kind === 'place') c.places += 1;
      else if (h.kind === 'person') c.people += 1;
    });
    return c;
  }, [allHits]);

  const filterChips: { key: FilterKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'All', icon: 'apps-outline' },
    { key: 'events', label: 'Events', icon: 'calendar-outline' },
    { key: 'perks', label: 'Perks', icon: 'gift-outline' },
    { key: 'movies', label: 'Movies', icon: 'film-outline' },
    { key: 'places', label: 'Places', icon: 'business-outline' },
    { key: 'people', label: 'People', icon: 'person-outline' },
  ];

  const loading =
    mode === 'search' && debounced.length >= 2 && (searchFetching || perksFetching) && allHits.length === 0;

  const onModeChange = useCallback((next: FinderMode) => {
    if (!isWeb) Haptics.selectionAsync();
    setMode(next);
    if (next === 'hub') setFilter('all');
  }, []);

  const sectioned = useMemo(() => {
    const order: { kind: FinderHit['kind']; title: string }[] = [
      { kind: 'event', title: 'Events' },
      { kind: 'perk', title: 'Perks & offers' },
      { kind: 'movie', title: 'Movies' },
      { kind: 'place', title: 'Communities & venues' },
      { kind: 'person', title: 'People' },
    ];
    return order
      .map(({ kind, title }) => ({
        kind,
        title,
        items: filteredHits.filter((h) => h.kind === kind),
      }))
      .filter((s) => s.items.length > 0);
  }, [filteredHits]);

  const showGrouped = filter === 'all' && sectioned.length > 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <Head>
        <title>Finder — CulturePass</title>
        <meta
          name="description"
          content="Search events, perks, movies, and community profiles in one place, or open a language hub for your state."
        />
        <link rel="canonical" href="https://culturepass.app/finder" />
      </Head>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: padX,
            paddingBottom: bottomInset + Spacing.xl,
            paddingTop: Spacing.sm,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.wrap, isDesktop && styles.wrapDesktop]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => goBackOrReplace('/(tabs)/index')}
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              hitSlop={8}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={styles.topTitles}>
              <Text style={[styles.topTitle, { color: colors.text }]}>Finder</Text>
              <Text style={[styles.topSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                Search the app · Open culture hubs
              </Text>
            </View>
            {mode === 'search' ? (
              <LocationPicker
                variant="icon"
                iconColor={colors.text}
                buttonStyle={{ ...styles.iconBtn, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}
              />
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {/* Mode switch */}
          <View style={[styles.segment, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
            <Pressable
              onPress={() => onModeChange('search')}
              style={[
                styles.segmentBtn,
                mode === 'search' && { backgroundColor: colors.surface, ...styles.segmentBtnActive },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'search' }}
            >
              <Ionicons
                name="search"
                size={18}
                color={mode === 'search' ? CultureTokens.indigo : colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  { color: mode === 'search' ? CultureTokens.indigo : colors.textSecondary },
                ]}
              >
                Search all
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onModeChange('hub')}
              style={[
                styles.segmentBtn,
                mode === 'hub' && { backgroundColor: colors.surface, ...styles.segmentBtnActive },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'hub' }}
            >
              <Ionicons
                name="compass-outline"
                size={18}
                color={mode === 'hub' ? CultureTokens.indigo : colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  { color: mode === 'hub' ? CultureTokens.indigo : colors.textSecondary },
                ]}
              >
                Culture hub
              </Text>
            </Pressable>
          </View>

          {mode === 'search' ? (
            <>
              <LinearGradient
                colors={[CultureTokens.indigo + '22', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.searchHero, { borderColor: colors.borderLight }]}
              >
                <Text style={[styles.searchHeroTitle, { color: colors.text }]}>
                  One search across what&apos;s live on CulturePass
                </Text>
                <Text style={[styles.searchHeroBody, { color: colors.textSecondary }]}>
                  Events, member perks & offers, movies, and public venues and communities. Results respect your location
                  when you&apos;ve set it.
                </Text>
              </LinearGradient>

              <Input
                variant="search"
                leftIcon="search-outline"
                placeholder="Try “coffee”, “Diwali”, “20% off”, a venue name…"
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                accessibilityLabel="Search CulturePass"
                containerStyle={{ marginBottom: Spacing.md }}
              />

              {state.city ? (
                <Text style={[styles.locHint, { color: colors.textTertiary }]}>
                  Scoped to {state.city}
                  {state.country ? `, ${state.country}` : ''}. Tap the pin to change.
                </Text>
              ) : (
                <Text style={[styles.locHint, { color: colors.textTertiary }]}>
                  Add a city from the pin for tighter local matches.
                </Text>
              )}

              {debounced.length < 2 ? (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Jump in</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickRow}
                  >
                    {QUICK_DESTINATIONS.map((d) => (
                      <Pressable
                        key={d.href}
                        onPress={() => {
                          if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(d.href as Parameters<typeof router.push>[0]);
                        }}
                        style={({ pressed }) => [
                          styles.quickChip,
                          {
                            borderColor: colors.borderLight,
                            backgroundColor: colors.surface,
                            opacity: pressed ? 0.9 : 1,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={d.label}
                      >
                        <View style={[styles.quickIcon, { backgroundColor: d.color + '18' }]}>
                          <Ionicons name={d.icon} size={18} color={d.color} />
                        </View>
                        <Text style={[styles.quickLabel, { color: colors.text }]}>{d.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text style={[styles.sectionLabel, { color: colors.textTertiary, marginTop: Spacing.lg }]}>
                    Popular searches
                  </Text>
                  <View style={styles.trendGrid}>
                    {POPULAR_FINDER.map((term) => (
                      <Pressable
                        key={term}
                        onPress={() => {
                          if (!isWeb) Haptics.selectionAsync();
                          setQuery(term);
                        }}
                        style={({ pressed }) => [
                          styles.trendPill,
                          {
                            borderColor: colors.borderLight,
                            backgroundColor: colors.backgroundSecondary,
                            opacity: pressed ? 0.88 : 1,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Search ${term}`}
                      >
                        <Ionicons name="flash-outline" size={16} color={CultureTokens.gold} />
                        <Text style={[TextStyles.label, { color: colors.text }]}>{term}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {debounced.length >= 2 && (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                    style={{ marginBottom: Spacing.md, flexGrow: 0 }}
                    accessibilityRole="tablist"
                  >
                    {filterChips.map((chip) => {
                      const n = counts[chip.key === 'all' ? 'all' : chip.key];
                      if (chip.key !== 'all' && n === 0) return null;
                      const active = filter === chip.key;
                      return (
                        <Pressable
                          key={chip.key}
                          onPress={() => {
                            if (!isWeb) Haptics.selectionAsync();
                            setFilter(chip.key);
                          }}
                          style={[
                            styles.filterChip,
                            {
                              borderColor: active ? CultureTokens.indigo : colors.borderLight,
                              backgroundColor: active ? colors.primarySoft : colors.surface,
                            },
                          ]}
                          accessibilityRole="tab"
                          accessibilityState={{ selected: active }}
                        >
                          <Ionicons
                            name={chip.icon}
                            size={14}
                            color={active ? CultureTokens.indigo : colors.textTertiary}
                          />
                          <Text
                            style={[
                              styles.filterChipText,
                              { color: active ? CultureTokens.indigo : colors.textSecondary },
                            ]}
                          >
                            {chip.label}
                            {chip.key === 'all' ? ` (${counts.all})` : ` (${n})`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {searchError ? (
                    <View style={[styles.errorBox, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
                      <Ionicons name="cloud-offline-outline" size={24} color={colors.error} />
                      <Text style={[TextStyles.callout, { color: colors.text, textAlign: 'center' }]}>
                        Search didn&apos;t load. Check your connection.
                      </Text>
                      <Button variant="outline" size="sm" onPress={() => void refetchSearch()}>
                        Retry
                      </Button>
                    </View>
                  ) : null}

                  {loading ? (
                    <View style={styles.loadingBox}>
                      <ActivityIndicator size="large" color={CultureTokens.indigo} />
                      <Text style={[TextStyles.callout, { color: colors.textSecondary }]}>Finding matches…</Text>
                    </View>
                  ) : null}

                  {!loading && !searchError && filteredHits.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
                      <Text style={[TextStyles.title3, { color: colors.text }]}>No matches</Text>
                      <Text style={[TextStyles.callout, { color: colors.textSecondary, textAlign: 'center' }]}>
                        Try another keyword, clear filters, or browse Perks and Events from the shortcuts above.
                      </Text>
                    </View>
                  ) : null}

                  {!loading && filteredHits.length > 0 ? (
                    showGrouped ? (
                      <View style={{ gap: Spacing.lg }}>
                        {sectioned.map((sec) => (
                          <View key={sec.kind}>
                            <Text style={[styles.sectionLabel, { color: colors.textTertiary, marginBottom: 10 }]}>
                              {sec.title}
                            </Text>
                            <View style={{ gap: 10 }}>
                              {sec.items.map((hit) => (
                                <HitRow key={`${hit.kind}-${hit.id}`} hit={hit} colors={colors} />
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={{ gap: 10 }}>
                        {filteredHits.map((hit) => (
                          <HitRow key={`${hit.kind}-${hit.id}`} hit={hit} colors={colors} />
                        ))}
                      </View>
                    )
                  ) : null}
                </>
              )}
            </>
          ) : (
            <>
              <View style={[styles.heroShell, { borderColor: colors.borderLight }]}>
                <LinearGradient
                  colors={[...gradients.culturepassBrand]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroInner}>
                    <View style={styles.heroBadgeRow}>
                      <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name="compass-outline" size={18} color="#FFFFFF" accessible={false} />
                        <Text style={styles.heroBadgeText}>Culture hub</Text>
                      </View>
                    </View>
                    <Text style={styles.heroTitle}>Build a hub in three steps</Text>
                    <Text style={styles.heroSubtitle}>
                      Pick a state and language. We open a focused page with communities, events, and updates for that
                      corridor.
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={[styles.stepTrack, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                {STEP_META.map((item) => {
                  const done = item.step < activeStep;
                  const current = item.step === activeStep;
                  return (
                    <View key={item.step} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepIconCircle,
                          {
                            backgroundColor: done || current ? CultureTokens.indigo : colors.surfaceElevated,
                            borderColor: done || current ? CultureTokens.indigo : colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={done || current ? '#FFFFFF' : colors.textSecondary}
                          accessibilityLabel={`Step ${item.step}: ${item.label}`}
                        />
                      </View>
                      <Text style={[styles.stepLabel, { color: colors.text }]}>{item.label}</Text>
                      <Text style={[styles.stepHint, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.hint}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryGlow }]}>
                    <Ionicons name="map-outline" size={20} color={CultureTokens.indigo} accessible={false} />
                  </View>
                  <View style={styles.sectionHeaderText}>
                    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                      State
                    </Text>
                    <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
                      Australian regions for this release
                    </Text>
                  </View>
                </View>
                <View style={styles.grid}>
                  {AU_STATES.map((st) => {
                    const active = st.value === stateCode;
                    return (
                      <Pressable
                        key={st.value}
                        onPress={() => setStateCode(st.value)}
                        style={({ pressed }) => [
                          styles.stateCard,
                          {
                            borderColor: active ? CultureTokens.indigo : colors.borderLight,
                            backgroundColor: active ? colors.primaryGlow : colors.surfaceElevated,
                            opacity: pressed ? 0.88 : 1,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`Select state ${st.label}`}
                        hitSlop={4}
                      >
                        <Text style={[styles.stateCode, { color: colors.text }]}>{st.value}</Text>
                        <Text style={[styles.stateName, { color: colors.textSecondary }]} numberOfLines={2}>
                          {st.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryGlow }]}>
                    <Ionicons name="chatbubbles-outline" size={20} color={CultureTokens.indigo} accessible={false} />
                  </View>
                  <View style={styles.sectionHeaderText}>
                    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                      Language
                    </Text>
                    <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
                      Heritage or primary language tag
                    </Text>
                  </View>
                </View>
                <View style={styles.chips}>
                  {QUICK_LANGUAGES.map((language) => {
                    const active = language.id === languageId;
                    return (
                      <Pressable
                        key={language.id}
                        onPress={() => setLanguageId(language.id)}
                        style={({ pressed }) => [
                          styles.chip,
                          {
                            borderColor: active ? CultureTokens.indigo : colors.borderLight,
                            backgroundColor: active ? colors.primaryGlow : colors.surfaceElevated,
                            minHeight: 44,
                            opacity: pressed ? 0.88 : 1,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`Select language ${language.name}`}
                      >
                        <Text style={[styles.chipText, { color: colors.text }]}>{language.name}</Text>
                        {language.nativeName && language.nativeName !== language.name ? (
                          <Text style={[styles.chipNative, { color: colors.textSecondary }]} numberOfLines={1}>
                            {language.nativeName}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryGlow }]}>
                    <Ionicons name="rocket-outline" size={20} color={CultureTokens.indigo} accessible={false} />
                  </View>
                  <View style={styles.sectionHeaderText}>
                    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                      Open hub
                    </Text>
                    <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
                      Share or open in the app
                    </Text>
                  </View>
                </View>
                <View style={[styles.previewCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview</Text>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>
                    {selectedState?.label ?? stateCode} · {selectedLanguage?.name ?? languageId.toUpperCase()}
                  </Text>
                  <Text
                    style={[styles.previewUrl, { color: CultureTokens.indigo }]}
                    selectable={Platform.OS === 'web'}
                    accessibilityLabel={`Hub path ${previewUrl}`}
                  >
                    {previewUrl}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Button
                    variant="gradient"
                    size="sm"
                    style={styles.actionButton}
                    onPress={() => router.push(previewUrl)}
                    leftIcon="arrow-forward-outline"
                  >
                    Open hub page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    style={styles.actionButton}
                    onPress={() => router.push('/(tabs)/index')}
                    leftIcon="compass-outline"
                  >
                    Discover home
                  </Button>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HitRow({ hit, colors }: { hit: FinderHit; colors: ReturnType<typeof useColors> }) {
  const kindLabel =
    hit.kind === 'event'
      ? 'Event'
      : hit.kind === 'movie'
        ? 'Movie'
        : hit.kind === 'perk'
          ? 'Perk'
          : hit.kind === 'place'
            ? placeLabel(hit.raw.entityType)
            : 'Person';

  return (
    <Pressable
      onPress={() => navigateHit(hit)}
      style={({ pressed }) => [
        styles.hitRow,
        {
          borderColor: colors.borderLight,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${kindLabel}: ${hit.title}`}
    >
      {hit.imageUrl ? (
        <Image source={{ uri: hit.imageUrl }} style={styles.hitImage} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.hitIconBox, { backgroundColor: hit.accent + '18' }]}>
          <Ionicons
            name={
              hit.kind === 'event'
                ? 'calendar'
                : hit.kind === 'movie'
                  ? 'film'
                  : hit.kind === 'perk'
                    ? 'gift'
                    : hit.kind === 'place'
                      ? 'business'
                      : 'person'
            }
            size={22}
            color={hit.accent}
          />
        </View>
      )}
      <View style={styles.hitBody}>
        <View style={styles.hitBadgeRow}>
          <View style={[styles.hitDot, { backgroundColor: hit.accent }]} />
          <Text style={[styles.hitBadgeText, { color: colors.textSecondary }]}>{kindLabel}</Text>
        </View>
        <Text style={[styles.hitTitle, { color: colors.text }]} numberOfLines={2}>
          {hit.title}
        </Text>
        <Text style={[styles.hitSub, { color: colors.textSecondary }]} numberOfLines={2}>
          {hit.subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1 },
  wrap: { width: '100%', alignSelf: 'center', gap: Spacing.md },
  wrapDesktop: { maxWidth: 720 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitles: { flex: 1 },
  topTitle: { fontSize: 22, fontFamily: FontFamily.bold },
  topSubtitle: { fontSize: 12, fontFamily: FontFamily.medium, marginTop: 2 },

  segment: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentLabel: { fontSize: 14, fontFamily: FontFamily.semibold },

  searchHero: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchHeroTitle: { fontSize: 18, fontFamily: FontFamily.bold, marginBottom: 6 },
  searchHeroBody: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 21 },
  locHint: { fontSize: 12, fontFamily: FontFamily.regular, marginBottom: Spacing.sm },
  sectionLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  quickRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 14, fontFamily: FontFamily.semibold },

  trendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontFamily: FontFamily.semibold },

  loadingBox: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 16 },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },

  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  hitImage: { width: 56, height: 56, borderRadius: 14 },
  hitIconBox: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hitBody: { flex: 1, minWidth: 0, gap: 2 },
  hitBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hitDot: { width: 6, height: 6, borderRadius: 3 },
  hitBadgeText: { fontSize: 10, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.6 },
  hitTitle: { fontSize: 16, fontFamily: FontFamily.semibold, lineHeight: 21 },
  hitSub: { fontSize: 13, fontFamily: FontFamily.regular, lineHeight: 18 },

  heroShell: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroGradient: { borderRadius: Radius.lg },
  heroInner: { padding: Spacing.lg, gap: Spacing.sm },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontFamily: FontFamily.bold,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
    maxWidth: 560,
  },
  stepTrack: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  stepItem: { flex: 1, alignItems: 'center', gap: 4 },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 13, fontFamily: FontFamily.bold, textAlign: 'center' },
  stepHint: { fontSize: 11, lineHeight: 15, fontFamily: FontFamily.regular, textAlign: 'center' },
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: { flex: 1, gap: 2 },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontFamily: FontFamily.bold },
  sectionCaption: { fontSize: 13, lineHeight: 19, fontFamily: FontFamily.regular },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  stateCard: {
    minWidth: 148,
    minHeight: 72,
    flexGrow: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    gap: 2,
  },
  stateCode: { fontSize: 16, lineHeight: 22, fontFamily: FontFamily.bold },
  stateName: { fontSize: 12, lineHeight: 17, fontFamily: FontFamily.regular },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 100,
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, lineHeight: 20, fontFamily: FontFamily.semibold },
  chipNative: { fontSize: 11, lineHeight: 16, fontFamily: FontFamily.regular, marginTop: 2 },
  previewCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 4,
  },
  previewLabel: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: FontFamily.semibold,
  },
  previewTitle: { fontSize: 17, lineHeight: 24, fontFamily: FontFamily.bold },
  previewUrl: { fontSize: 13, lineHeight: 20, fontFamily: FontFamily.medium },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionButton: { flexGrow: 1 },
});

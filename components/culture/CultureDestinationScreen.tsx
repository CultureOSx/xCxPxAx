import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/constants/typography';
import { CultureTokens, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FilterChips from '@/components/ui/FilterChips';
import EventCard from '@/components/Discover/EventCard';
import { GLOBAL_REGIONS, getStateForCity } from '@/constants/locations';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { CultureDestinationDefinition } from '@/constants/cultureDestinations';
import { useCultureDestinationData } from '@/hooks/useCultureDestinationData';
import { useLocations } from '@/hooks/useLocations';
import type { CultureHubScope } from '@/lib/cultureDestinationScope';
import { eventMatchesViewerRegion } from '@/lib/cultureDestinationScope';
import { getMarketingWebOrigin } from '@/lib/domainHost';
import {
  buildCultureHubShareUrl,
  cultureHubHasUrlOverrides,
  cultureHubRouteKey,
  parseCultureHubUrlApply,
} from '@/lib/cultureHubDeepLink';
import { CultureHubLocationModal } from '@/components/culture/CultureHubLocationModal';
import { APP_NAME } from '@/lib/app-meta';
import {
  cityAmbient,
  getCityDestinationStyles,
  StatPill,
} from '@/components/city/CityDestinationStyles';

type FilterMode = 'category' | 'culture' | 'language';

const CATEGORY_FILTERS = ['Music', 'Food', 'Arts', 'Nightlife', 'Indigenous', 'Sports', 'Workshop'];

function getRegionLabel(
  stateCode: string | undefined,
  auStates: { code: string; name: string }[],
): string | undefined {
  if (!stateCode) return undefined;
  const au = auStates.find((s) => s.code === stateCode);
  if (au) return au.name;
  return GLOBAL_REGIONS.find((r) => r.value === stateCode)?.label;
}

type Props = {
  definition: CultureDestinationDefinition;
  /** Query string from the route (?country=&scope=&state=) — web deep links & shares. */
  routeSearchParams?: Record<string, string | string[] | undefined>;
};

export function CultureDestinationScreen({ definition: def, routeSearchParams }: Props) {
  const colors = useColors();
  const { isDesktop, contentWidth, width } = useLayout();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { state: onboarding, isLoading: onboardingLoading, setCountry } = useOnboarding();
  const { states: auStates } = useLocations();
  const onboardingSeeded = useRef(false);

  const [focusCountry, setFocusCountry] = useState('Australia');
  const [focusStateCode, setFocusStateCode] = useState<string | undefined>(undefined);
  const [hubScope, setHubScope] = useState<CultureHubScope>('singleCountry');
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const hubRouteKey = useMemo(() => cultureHubRouteKey(routeSearchParams), [routeSearchParams]);

  useEffect(() => {
    if (onboardingLoading) return;

    if (cultureHubHasUrlOverrides(routeSearchParams)) {
      const url = parseCultureHubUrlApply(routeSearchParams);
      if (url.country) {
        setFocusCountry(url.country);
        if (!url.applyState) setFocusStateCode(undefined);
      } else {
        const c = onboarding.country?.trim();
        if (c) setFocusCountry(c);
      }
      if (url.scope) setHubScope(url.scope);
      if (url.applyState) setFocusStateCode(url.stateCode);
      onboardingSeeded.current = true;
      return;
    }

    if (!onboardingSeeded.current) {
      onboardingSeeded.current = true;
      const c = onboarding.country?.trim();
      if (c) setFocusCountry(c);
      const city = onboarding.city?.trim();
      if (city) {
        const st = getStateForCity(city);
        const row = st ? GLOBAL_REGIONS.find((r) => r.value === st) : undefined;
        const oc = c || 'Australia';
        if (row?.country === oc) setFocusStateCode(st);
      }
    }
  }, [onboardingLoading, hubRouteKey, onboarding.country, onboarding.city, routeSearchParams]);

  const focusStateLabel = useMemo(
    () => getRegionLabel(focusStateCode, auStates),
    [focusStateCode, auStates],
  );

  const cityMeta = useMemo(
    () => ({
      tagline: def.tagline,
      emoji: '🌴',
      cultureCommunities: def.cultureCommunities,
      languages: def.languages,
    }),
    [def],
  );

  const [filterMode, setFilterMode] = useState<FilterMode>('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCultures, setSelectedCultures] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const colAnim = useSharedValue(2);

  const { allEvents, venues, isLoading, refetch } = useCultureDestinationData(def, {
    focusCountry,
    focusStateCode,
    scope: hubScope,
  });

  const regionFilteredEvents = useMemo(() => {
    if (hubScope !== 'singleCountry' || !focusStateCode) return allEvents;
    return allEvents.filter((e) => eventMatchesViewerRegion(e, focusStateCode));
  }, [allEvents, hubScope, focusStateCode]);

  const uniqueCultureTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    regionFilteredEvents.forEach((e) => {
      (e.cultureTag ?? e.cultureTags ?? []).forEach((t: string) => set.add(t));
    });
    cityMeta.cultureCommunities.forEach((c) => set.add(c));
    return Array.from(set).slice(0, 20);
  }, [regionFilteredEvents, cityMeta.cultureCommunities]);

  const uniqueLanguageTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    regionFilteredEvents.forEach((e) => {
      (e.languageTags ?? []).forEach((t: string) => set.add(t));
    });
    cityMeta.languages.forEach((l) => set.add(l));
    return Array.from(set).slice(0, 16);
  }, [regionFilteredEvents, cityMeta.languages]);

  const events = useMemo(() => {
    let list = regionFilteredEvents;
    if (selectedCategories.length > 0) {
      const lower = selectedCategories.map((c) => c.toLowerCase());
      list = list.filter((e) => lower.includes((e.category ?? '').toLowerCase()));
    }
    if (selectedCultures.length > 0) {
      list = list.filter((e) => {
        const tags: string[] = [...(e.cultureTag ?? []), ...(e.cultureTags ?? [])];
        return selectedCultures.some((sel) =>
          tags.some((t) => t.toLowerCase().includes(sel.toLowerCase())),
        );
      });
    }
    if (selectedLanguages.length > 0) {
      list = list.filter((e) => {
        const langs: string[] = e.languageTags ?? [];
        return selectedLanguages.some((sel) =>
          langs.some((l) => l.toLowerCase().includes(sel.toLowerCase())),
        );
      });
    }
    return list;
  }, [regionFilteredEvents, selectedCategories, selectedCultures, selectedLanguages]);

  const resultsSubtitle = useMemo(() => {
    const n = events.length;
    const unit = n === 1 ? '' : 's';
    if (hubScope === 'diaspora') {
      return `${n} result${unit} · ${focusCountry} & your region boosted, then other hub countries`;
    }
    if (focusStateLabel) {
      return `${n} result${unit} · ${focusStateLabel} (${focusCountry})`;
    }
    return `${n} result${unit} · entire ${focusCountry}`;
  }, [events.length, hubScope, focusCountry, focusStateLabel]);

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const shareUrl = useMemo(
    () =>
      buildCultureHubShareUrl(getMarketingWebOrigin(), def.publicPath, {
        country: focusCountry,
        scope: hubScope,
        stateCode: focusStateCode,
      }),
    [def.publicPath, focusCountry, hubScope, focusStateCode],
  );

  const handleShare = useCallback(async () => {
    haptic();
    const message = `${def.heroTitle} on ${APP_NAME} — ${def.tagline}\n${shareUrl}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: `${def.heroTitle} · ${APP_NAME}`, text: message, url: shareUrl });
      } else {
        await Share.share({ title: `${def.heroTitle} · ${APP_NAME}`, message, url: shareUrl });
      }
    } catch {
      /* user cancelled */
    }
  }, [haptic, def.heroTitle, def.tagline, shareUrl]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const clearAllFilters = useCallback(() => {
    haptic();
    setSelectedCategories([]);
    setSelectedCultures([]);
    setSelectedLanguages([]);
  }, [haptic]);

  const totalActiveFilters = selectedCategories.length + selectedCultures.length + selectedLanguages.length;

  const gridGap = 16;
  const gridWidth = isDesktop ? contentWidth : width - 40;
  const cardWidth = Math.floor((gridWidth - gridGap) / 2) - 1;

  const animatedCardStyle = useAnimatedStyle(() => ({
    width: interpolate(colAnim.value, [2, 3], [cardWidth, cardWidth], Extrapolation.CLAMP),
    opacity: 1,
  }));

  const goToMap = useCallback(() => {
    haptic();
    router.push('/map');
  }, [haptic]);

  const styles = getCityDestinationStyles(colors, insets, isDesktop, gridGap);

  const activeFilters =
    filterMode === 'category'
      ? selectedCategories
      : filterMode === 'culture'
        ? selectedCultures
        : selectedLanguages;

  const filterOptions =
    filterMode === 'category'
      ? CATEGORY_FILTERS
      : filterMode === 'culture'
        ? uniqueCultureTags
        : uniqueLanguageTags;

  const onToggleFilter = useCallback(
    (f: string) => {
      haptic();
      const setter =
        filterMode === 'category'
          ? setSelectedCategories
          : filterMode === 'culture'
            ? setSelectedCultures
            : setSelectedLanguages;
      setter((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
    },
    [filterMode, haptic],
  );

  const onClearMode = useCallback(() => {
    haptic();
    if (filterMode === 'category') setSelectedCategories([]);
    else if (filterMode === 'culture') setSelectedCultures([]);
    else setSelectedLanguages([]);
  }, [filterMode, haptic]);

  const sectionTitle = useMemo(() => {
    const parts: string[] = [];
    if (selectedCategories.length) parts.push(selectedCategories.join(', '));
    if (selectedCultures.length) parts.push(selectedCultures.join(', '));
    if (selectedLanguages.length) parts.push(selectedLanguages.join(', '));
    return parts.length ? `${parts.join(' · ')} Events` : `${def.heroTitle} highlights`;
  }, [selectedCategories, selectedCultures, selectedLanguages, def.heroTitle]);

  const locationChip =
    hubScope === 'diaspora'
      ? `Worldwide · ${focusCountry} first`
      : focusStateLabel
        ? `${focusStateLabel} · ${focusCountry}`
        : `All ${focusCountry}`;

  const saveDiscoverCountry = useCallback(() => {
    haptic();
    setCountry(focusCountry);
  }, [focusCountry, haptic, setCountry]);

  const webTitle = `${def.heroTitle} · ${APP_NAME}`;

  return (
    <ErrorBoundary>
      {Platform.OS === 'web' && (
        <Head>
          <title>{webTitle}</title>
          <meta name="description" content={def.metaDescription} />
        </Head>
      )}
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cityAmbient.mesh}
          pointerEvents="none"
        />
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            isDesktop && { width: contentWidth, alignSelf: 'center' },
          ]}
          stickyHeaderIndices={[2]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.hero}>
            <Image
              source={{ uri: def.heroImage }}
              style={styles.heroImage}
              contentFit="cover"
              transition={600}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.90)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.heroTopBar, { paddingTop: Platform.OS === 'web' ? 16 : insets.top + 16 }]}>
              <LiquidGlassPanel
                borderRadius={22}
                bordered={false}
                style={{ width: 44, height: 44 }}
                contentStyle={styles.heroGlassCircleInner}
              >
                <Pressable
                  onPress={() => {
                    haptic();
                    router.back();
                  }}
                  style={styles.heroIconHit}
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                >
                  <Ionicons name="chevron-back" size={24} color={colors.textOnBrandGradient} />
                </Pressable>
              </LiquidGlassPanel>

              <LiquidGlassPanel
                borderRadius={20}
                bordered={false}
                style={styles.heroGlassChipShell}
                contentStyle={styles.heroGlassChipInner}
              >
                <Pressable
                  onPress={() => {
                    haptic();
                    setLocationModalOpen(true);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}
                  accessibilityLabel={`Location: ${locationChip}. Tap to change country or region.`}
                  accessibilityRole="button"
                >
                  <Ionicons name="location" size={13} color={CultureTokens.gold} />
                  <Text style={[styles.chipText, { color: colors.textOnBrandGradient }]} numberOfLines={2}>
                    {locationChip}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textOnBrandGradient} style={{ opacity: 0.85 }} />
                </Pressable>
              </LiquidGlassPanel>

              <LiquidGlassPanel
                borderRadius={22}
                bordered={false}
                style={{ width: 44, height: 44 }}
                contentStyle={styles.heroGlassCircleInner}
              >
                <Pressable
                  onPress={() => {
                    void handleShare();
                  }}
                  style={styles.heroIconHit}
                  accessibilityLabel="Share this hub"
                  accessibilityRole="button"
                >
                  <Ionicons name="share-social-outline" size={22} color={colors.textOnBrandGradient} />
                </Pressable>
              </LiquidGlassPanel>
            </View>

            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={[styles.heroBadgeText, { color: colors.text }]}>{def.heroBadge}</Text>
              </View>
              <Text style={[styles.heroCity, { color: colors.textOnBrandGradient }]}>{def.heroTitle}</Text>
              <View style={styles.stateRow}>
                <Ionicons name="map-outline" size={13} color={colors.textOnBrandGradient} style={{ opacity: 0.72 }} />
                <Text style={styles.stateText}>
                  {hubScope === 'diaspora'
                    ? `Diaspora hub · ${focusCountry} ranked first`
                    : focusStateLabel
                      ? `${focusStateLabel}, ${focusCountry}`
                      : `All of ${focusCountry}`}
                </Text>
              </View>
              <Text style={styles.heroSubtitle}>{cityMeta.tagline}</Text>
            </View>
          </View>

          <View style={[styles.statsStrip, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
            <StatPill icon="calendar" value={String(regionFilteredEvents.length)} label="Events" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <StatPill icon="business" value={String(venues.length || '—')} label="Places" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <StatPill icon="people" value={String(uniqueCultureTags.length)} label="Cultures" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <StatPill icon="chatbubble-ellipses" value={String(uniqueLanguageTags.length)} label="Languages" colors={colors} />
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: colors.surface,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.borderLight,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => {
                  haptic();
                  setHubScope('singleCountry');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor:
                    hubScope === 'singleCountry' ? CultureTokens.indigo : colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: hubScope === 'singleCountry' ? CultureTokens.indigo : colors.borderLight,
                }}
                accessibilityLabel="Show events in the selected country"
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins_600SemiBold',
                    color: hubScope === 'singleCountry' ? colors.textOnBrandGradient : colors.textSecondary,
                  }}
                >
                  This country
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  haptic();
                  setHubScope('diaspora');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor:
                    hubScope === 'diaspora' ? CultureTokens.indigo : colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: hubScope === 'diaspora' ? CultureTokens.indigo : colors.borderLight,
                }}
                accessibilityLabel="Show events across the worldwide diaspora hub"
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins_600SemiBold',
                    color: hubScope === 'diaspora' ? colors.textOnBrandGradient : colors.textSecondary,
                  }}
                >
                  Worldwide hub
                </Text>
              </Pressable>
            </View>
            <Pressable onPress={saveDiscoverCountry} accessibilityLabel="Save country for Discover" accessibilityRole="button">
              <Text style={[TextStyles.caption, { color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }]}>
                Use {focusCountry} as my Discover country
              </Text>
            </Pressable>
          </View>

          <View style={styles.filterBar}>
            <LiquidGlassPanel
              borderRadius={0}
              bordered={false}
              style={{
                borderBottomWidth: StyleSheet.hairlineWidth * 2,
                borderBottomColor: colors.borderLight,
              }}
              contentStyle={styles.filterBarGlassInner}
            >
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modeTabs}
              >
                {(['category', 'culture', 'language'] as FilterMode[]).map((mode) => {
                  const active = filterMode === mode;
                  const badge =
                    mode === 'category'
                      ? selectedCategories.length
                      : mode === 'culture'
                        ? selectedCultures.length
                        : selectedLanguages.length;
                  const labels: Record<FilterMode, string> = {
                    category: 'Category',
                    culture: 'Culture',
                    language: 'Language',
                  };
                  const icons: Record<FilterMode, keyof typeof Ionicons.glyphMap> = {
                    category: 'grid-outline',
                    culture: 'globe-outline',
                    language: 'chatbubble-outline',
                  };
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => {
                        haptic();
                        setFilterMode(mode);
                      }}
                      style={[styles.modeTab, active && { borderBottomColor: CultureTokens.indigo, borderBottomWidth: 2 }]}
                    >
                      <Ionicons
                        name={icons[mode]}
                        size={15}
                        color={active ? CultureTokens.indigo : colors.textTertiary}
                      />
                      <Text style={[styles.modeTabText, { color: active ? CultureTokens.indigo : colors.textTertiary }]}>
                        {labels[mode]}
                      </Text>
                      {badge > 0 && (
                        <View style={styles.modeBadge}>
                          <Text style={styles.modeBadgeText}>{badge}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
                {totalActiveFilters > 0 && (
                  <Pressable onPress={clearAllFilters} style={styles.clearAllTab}>
                    <Ionicons name="close-circle" size={15} color={colors.textTertiary} />
                    <Text style={[styles.modeTabText, { color: colors.textTertiary }]}>Clear all</Text>
                  </Pressable>
                )}
              </ScrollView>
              {filterOptions.length > 0 && (
                <FilterChips
                  filters={filterOptions}
                  selectedFilters={activeFilters}
                  onToggle={onToggleFilter}
                  onClearAll={onClearMode}
                />
              )}
            </LiquidGlassPanel>
          </View>

          {regionFilteredEvents.length > 5 && totalActiveFilters === 0 && (
            <View style={styles.section}>
              <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>
                Highlights · {hubScope === 'diaspora' ? `${focusCountry} first` : focusCountry}
              </Text>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              >
                {regionFilteredEvents.slice(0, 6).map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => router.push(`/event/${e.id}`)}
                    style={styles.trendingCard}
                  >
                    <Image
                      source={{ uri: e.heroImageUrl || e.imageUrl }}
                      style={styles.trendingImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.82)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.trendingInfo}>
                      {e.category && (
                        <View style={styles.trendingCategoryPill}>
                          <Text style={styles.trendingCategoryText}>{e.category}</Text>
                        </View>
                      )}
                      <Text style={styles.trendingTitle} numberOfLines={2}>
                        {e.title}
                      </Text>
                      {e.date && (
                        <Text style={styles.trendingDate} numberOfLines={1}>
                          {new Date(e.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View
            style={
              isDesktop
                ? { flexDirection: 'row', gap: gridGap * 2, paddingHorizontal: 20 }
                : undefined
            }
          >
            <View style={{ flex: isDesktop ? 2.8 : 1 }}>
              <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={[TextStyles.title3, { color: colors.text }]}>{sectionTitle}</Text>
                    <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                      {resultsSubtitle}
                    </Text>
                  </View>
                  {totalActiveFilters > 0 && (
                    <Pressable onPress={clearAllFilters} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </Pressable>
                  )}
                </View>

                {isLoading ? (
                  <View style={styles.skeletonGrid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <View key={i} style={[styles.skeletonCard, { width: cardWidth, height: 240 }]} />
                    ))}
                  </View>
                ) : events.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-clear-outline" size={64} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No events match yet</Text>
                    <Text style={styles.emptySubtitle}>
                      {hubScope === 'singleCountry'
                        ? `No matches in ${focusStateLabel ? `${focusStateLabel}, ` : ''}${focusCountry}. Try Worldwide hub or adjust filters.`
                        : 'Try filters or check back — we scan many countries for this community.'}
                    </Text>
                    <Pressable style={styles.retryButton} onPress={clearAllFilters}>
                      <Text style={styles.retryText}>Clear filters</Text>
                    </Pressable>
                    {hubScope === 'singleCountry' && (
                      <Pressable
                        style={[styles.retryButton, { marginTop: 8, backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => {
                          haptic();
                          setHubScope('diaspora');
                        }}
                      >
                        <Text style={[styles.retryText, { color: colors.text }]}>Open worldwide hub</Text>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <Animated.View style={[styles.grid, { gap: gridGap }]}>
                    {events.map((event) => {
                      const w = isDesktop ? (gridWidth * 0.72 - gridGap) / 2 : cardWidth;
                      return (
                        <Animated.View
                          key={event.id}
                          style={[isDesktop ? { width: w } : animatedCardStyle, { marginBottom: gridGap }]}
                        >
                          <EventCard event={event} containerWidth={w} containerHeight={260} />
                        </Animated.View>
                      );
                    })}
                  </Animated.View>
                )}
              </View>
            </View>

            <View style={{ flex: 1, paddingTop: isDesktop ? 28 : 0 }}>
              {venues.length > 0 && (
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0, paddingTop: 0 }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 16 }]}>
                    Places & partners
                  </Text>
                  <View style={isDesktop ? { gap: 12 } : styles.venueGrid}>
                    {venues.map((v) => (
                      <Pressable
                        key={v.id}
                        onPress={() => router.push(`/business/${v.id}`)}
                        style={[styles.venueCard, isDesktop && { width: '100%' }]}
                      >
                        <View style={styles.venueIcon}>
                          <Ionicons name="business" size={22} color={CultureTokens.indigo} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.venueName} numberOfLines={1}>
                            {v.name}
                          </Text>
                          <Text style={styles.venueCategory}>{v.category || 'Culture host'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                      </Pressable>
                    ))}
                  </View>
                  {isDesktop && (
                    <Pressable
                      style={[styles.mapCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                      onPress={goToMap}
                    >
                      <Ionicons name="map-outline" size={22} color={CultureTokens.indigo} />
                      <Text style={[styles.mapCardText, { color: colors.text }]}>Explore map</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {uniqueCultureTags.length > 0 && (
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>
                    Cultural tags
                  </Text>
                  <View style={styles.tagCloud}>
                    {uniqueCultureTags.map((tag) => {
                      const active = selectedCultures.includes(tag);
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => {
                            haptic();
                            setFilterMode('culture');
                            setSelectedCultures((prev) =>
                              prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
                            );
                          }}
                          style={[
                            styles.tagPill,
                            {
                              backgroundColor: active ? CultureTokens.indigo : colors.backgroundSecondary,
                              borderColor: active ? CultureTokens.indigo : colors.borderLight,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.tagPillText, { color: active ? colors.textOnBrandGradient : colors.text }]}
                          >
                            {tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {uniqueLanguageTags.length > 0 && (
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>
                    Languages
                  </Text>
                  <View style={styles.tagCloud}>
                    {uniqueLanguageTags.map((lang) => {
                      const active = selectedLanguages.includes(lang);
                      return (
                        <Pressable
                          key={lang}
                          onPress={() => {
                            haptic();
                            setFilterMode('language');
                            setSelectedLanguages((prev) =>
                              prev.includes(lang) ? prev.filter((x) => x !== lang) : [...prev, lang],
                            );
                          }}
                          style={[
                            styles.tagPill,
                            {
                              backgroundColor: active ? CultureTokens.gold + 'EE' : colors.backgroundSecondary,
                              borderColor: active ? CultureTokens.gold : colors.borderLight,
                            },
                          ]}
                        >
                          <Text style={[styles.tagPillText, { color: colors.text }]}>{lang}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {!isDesktop && (
          <Pressable style={styles.fab} onPress={goToMap} accessibilityLabel="Open map" accessibilityRole="button">
            <Ionicons name="map" size={22} color={colors.textOnBrandGradient} />
            <Text style={[styles.fabText, { color: colors.textOnBrandGradient }]}>Map</Text>
          </Pressable>
        )}

        <CultureHubLocationModal
          visible={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          initialCountry={focusCountry}
          initialStateCode={focusStateCode}
          onApply={(country, state) => {
            setFocusCountry(country);
            setFocusStateCode(state);
          }}
        />
      </View>
    </ErrorBoundary>
  );
}

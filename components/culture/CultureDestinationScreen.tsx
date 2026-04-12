import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { ScrollView as ScrollViewType } from 'react-native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
  Share,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
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
import { HeroOverlayBar } from '@/components/city/HeroOverlayBar';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FilterChips from '@/components/ui/FilterChips';
import EventCard from '@/components/Discover/EventCard';
import { GLOBAL_REGIONS, getStateForCity } from '@/constants/locations';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { CultureDestinationDefinition } from '@/constants/cultureDestinations';
import { useCultureDestinationData } from '@/hooks/useCultureDestinationData';
import { useLocations } from '@/hooks/useLocations';
import type { CultureHubNearRadiusKm, CultureHubScope } from '@/lib/cultureDestinationScope';
import {
  CULTURE_HUB_NEAR_RADIUS_KM,
  CULTURE_HUB_NEAR_RADIUS_PRESETS,
  eventMatchesViewerRegion,
} from '@/lib/cultureDestinationScope';
import { getMarketingWebOrigin } from '@/lib/domainHost';
import {
  buildCultureHubShareUrl,
  cultureHubHasUrlOverrides,
  cultureHubRouteKey,
  parseCultureHubUrlApply,
} from '@/lib/cultureHubDeepLink';
import { CultureHubLocationModal } from '@/components/culture/CultureHubLocationModal';
import { APP_NAME } from '@/lib/app-meta';
import { scrollToChildInScrollView } from '@/lib/scrollContent';
import {
  cityAmbient,
  getCityDestinationStyles,
  StatPill,
} from '@/components/city/CityDestinationStyles';

type FilterMode = 'category' | 'culture' | 'language';

const CATEGORY_FILTERS = ['Music', 'Food', 'Arts', 'Nightlife', 'Indigenous', 'Sports', 'Workshop'];

const webCursor = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

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
  const scrollRef = useRef<ScrollViewType>(null);
  const eventsSectionRef = useRef<View>(null);
  const placesColumnRef = useRef<View>(null);
  const layoutHeights = useRef({ hero: 400, stats: 76, filter: 200, highlights: 0 });
  const { state: onboarding, isLoading: onboardingLoading } = useOnboarding();
  const { states: auStates } = useLocations();
  const onboardingSeeded = useRef(false);

  const [focusCountry, setFocusCountry] = useState('Australia');
  const [focusStateCode, setFocusStateCode] = useState<string | undefined>(undefined);
  const [hubScope, setHubScope] = useState<CultureHubScope>('singleCountry');
  const [nearYouCoords, setNearYouCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearYouRadiusKm, setNearYouRadiusKm] = useState<CultureHubNearRadiusKm>(CULTURE_HUB_NEAR_RADIUS_KM);
  const [nearYouLoading, setNearYouLoading] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const nearYouBootRef = useRef(false);

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
      if (url.nearRadiusKm != null) setNearYouRadiusKm(url.nearRadiusKm);
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

  const resolveNearYouCoords = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, maximumAge: 60_000, timeout: 22_000 },
        );
      });
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }, []);

  /** Deep link `?scope=near` — request location after scope is applied from the URL. */
  useEffect(() => {
    if (hubScope !== 'nearYou') {
      nearYouBootRef.current = false;
      return;
    }
    if (nearYouCoords != null) return;
    if (nearYouBootRef.current) return;
    nearYouBootRef.current = true;
    let cancelled = false;
    void resolveNearYouCoords().then((c) => {
      if (cancelled) return;
      if (c) {
        setNearYouCoords(c);
      } else {
        setHubScope('singleCountry');
        nearYouBootRef.current = false;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hubScope, nearYouCoords, resolveNearYouCoords, hubRouteKey]);

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
    nearYouCoords,
    nearYouRadiusKm,
  });

  const regionFilteredEvents = useMemo(() => {
    if (hubScope === 'nearYou') return allEvents;
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
    if (hubScope === 'nearYou') {
      if (!nearYouCoords) {
        return `Allow location to load events within ${nearYouRadiusKm} km`;
      }
      return `${n} result${unit} · ${nearYouRadiusKm} km radius · ${def.heroTitle} matches, closest first`;
    }
    if (hubScope === 'diaspora') {
      return `${n} result${unit} · ${focusCountry} & your region boosted, then other hub countries`;
    }
    if (focusStateLabel) {
      return `${n} result${unit} · ${focusStateLabel} (${focusCountry})`;
    }
    return `${n} result${unit} · entire ${focusCountry}`;
  }, [events.length, hubScope, focusCountry, focusStateLabel, nearYouCoords, nearYouRadiusKm, def.heroTitle]);

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const activateNearYou = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (nearYouCoords) {
      setHubScope('nearYou');
      return;
    }
    nearYouBootRef.current = true;
    setHubScope('nearYou');
    setNearYouLoading(true);
    const c = await resolveNearYouCoords();
    setNearYouLoading(false);
    if (c) {
      setNearYouCoords(c);
    } else {
      setHubScope('singleCountry');
      nearYouBootRef.current = false;
      Alert.alert(
        'Location needed',
        Platform.OS === 'web'
          ? 'Allow location in your browser to see events near you.'
          : 'Enable location for CulturePass in Settings to browse nearby events.',
        [
          { text: 'Not now', style: 'cancel' },
          ...(Platform.OS !== 'web'
            ? [{ text: 'Open Settings', onPress: () => void Linking.openSettings() }]
            : []),
        ],
      );
    }
  }, [nearYouCoords, resolveNearYouCoords]);

  const shareUrl = useMemo(
    () =>
      buildCultureHubShareUrl(getMarketingWebOrigin(), def.publicPath, {
        country: focusCountry,
        scope: hubScope,
        stateCode: focusStateCode,
        nearRadiusKm: hubScope === 'nearYou' ? nearYouRadiusKm : undefined,
      }),
    [def.publicPath, focusCountry, hubScope, focusStateCode, nearYouRadiusKm],
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
    hubScope === 'nearYou'
      ? nearYouCoords
        ? `Near me · ${nearYouRadiusKm} km`
        : 'Near me · location needed'
      : hubScope === 'diaspora'
        ? `Worldwide · ${focusCountry} first`
        : focusStateLabel
          ? `${focusStateLabel} · ${focusCountry}`
          : `All ${focusCountry}`;

  const showHighlightsRail = regionFilteredEvents.length > 5 && totalActiveFilters === 0;

  const areaCountryShort = useMemo(() => {
    const t = focusCountry.trim() || '—';
    return t.length > 14 ? `${t.slice(0, 12)}…` : t;
  }, [focusCountry]);

  const scrollToStickyToolbar = useCallback(() => {
    const y = Math.max(0, layoutHeights.current.hero + layoutHeights.current.stats - 6);
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  const scrollEventsIntoView = useCallback(() => {
    const fallbackY =
      layoutHeights.current.hero +
      layoutHeights.current.stats +
      layoutHeights.current.filter +
      layoutHeights.current.highlights;
    scrollToChildInScrollView(scrollRef, eventsSectionRef, { offset: 8, fallbackY });
  }, []);

  const onStatEventsPress = useCallback(() => {
    haptic();
    setFilterMode('category');
    scrollEventsIntoView();
  }, [haptic, scrollEventsIntoView]);

  const onStatPlacesPress = useCallback(() => {
    haptic();
    const fallbackY =
      layoutHeights.current.hero +
      layoutHeights.current.stats +
      layoutHeights.current.filter +
      layoutHeights.current.highlights;
    scrollToChildInScrollView(scrollRef, placesColumnRef, { offset: 8, fallbackY });
  }, [haptic]);

  const onStatCulturesPress = useCallback(() => {
    haptic();
    setFilterMode('culture');
    scrollToStickyToolbar();
  }, [haptic, scrollToStickyToolbar]);

  const onStatLanguagesPress = useCallback(() => {
    haptic();
    setFilterMode('language');
    scrollToStickyToolbar();
  }, [haptic, scrollToStickyToolbar]);

  useEffect(() => {
    if (!showHighlightsRail) layoutHeights.current.highlights = 0;
  }, [showHighlightsRail]);

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
          <View
            style={styles.hero}
            onLayout={(e) => {
              layoutHeights.current.hero = e.nativeEvent.layout.height;
            }}
          >
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
            <LinearGradient
              colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.35)', 'transparent']}
              locations={[0, 0.55, 1]}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 150,
                zIndex: 8,
              }}
              pointerEvents="none"
            />
            <HeroOverlayBar
              paddingTop={Platform.OS === 'web' ? 16 : insets.top + 16}
              centerLabel={locationChip}
              onBack={() => {
                haptic();
                if (router.canGoBack()) router.back(); else router.replace('/(tabs)');
              }}
              onShare={() => {
                void handleShare();
              }}
              onCenterPress={() => {
                haptic();
                setLocationModalOpen(true);
              }}
              shareA11y="Share this hub"
            />

            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={[styles.heroBadgeText, { color: colors.text }]}>{def.heroBadge}</Text>
              </View>
              <Text style={[styles.heroCity, { color: colors.textOnBrandGradient }]}>{def.heroTitle}</Text>
              <View style={styles.stateRow}>
                <Ionicons name="map-outline" size={13} color={colors.textOnBrandGradient} style={{ opacity: 0.72 }} />
                <Text style={styles.stateText}>
                  {hubScope === 'nearYou'
                    ? nearYouCoords
                      ? `GPS · ${nearYouRadiusKm} km · ${def.heroTitle} culture`
                      : 'Turn on location for nearby listings'
                    : hubScope === 'diaspora'
                      ? `Diaspora hub · ${focusCountry} ranked first`
                      : focusStateLabel
                        ? `${focusStateLabel}, ${focusCountry}`
                        : `All of ${focusCountry}`}
                </Text>
              </View>
              <Text style={styles.heroSubtitle}>{cityMeta.tagline}</Text>
            </View>
          </View>

          <View
            style={[styles.statsStrip, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
            onLayout={(e) => {
              layoutHeights.current.stats = e.nativeEvent.layout.height;
            }}
          >
            <StatPill
              icon="calendar"
              value={String(regionFilteredEvents.length)}
              label="Events"
              colors={colors}
              onPress={onStatEventsPress}
              accessibilityLabel={`Events, ${regionFilteredEvents.length}. Jump to event list`}
            />
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <StatPill
              icon="business"
              value={String(venues.length || '—')}
              label="Places"
              colors={colors}
              onPress={onStatPlacesPress}
              accessibilityLabel={`Places, ${venues.length || 0}. Jump to places and partners`}
            />
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <StatPill
              icon="people"
              value={String(uniqueCultureTags.length)}
              label="Cultures"
              colors={colors}
              onPress={onStatCulturesPress}
              accessibilityLabel={`Cultures, ${uniqueCultureTags.length}. Open culture filter`}
            />
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <StatPill
              icon="chatbubble-ellipses"
              value={String(uniqueLanguageTags.length)}
              label="Languages"
              colors={colors}
              onPress={onStatLanguagesPress}
              accessibilityLabel={`Languages, ${uniqueLanguageTags.length}. Open language filter`}
            />
          </View>

          <View
            style={styles.filterBar}
            onLayout={(e) => {
              layoutHeights.current.filter = e.nativeEvent.layout.height;
            }}
          >
            <LiquidGlassPanel
              borderRadius={0}
              bordered={false}
              style={{
                backgroundColor: colors.surface,
                borderBottomWidth: StyleSheet.hairlineWidth * 2,
                borderBottomColor: colors.borderLight,
              }}
              contentStyle={styles.filterBarGlassInner}
            >
              <View style={styles.filterToolbarColumn}>
                <View style={styles.filterToolbarGroupWrap}>
                  <View
                    style={[
                      styles.hubControlGroup,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.borderLight,
                      },
                    ]}
                  >
                    {hubScope === 'nearYou' && (
                      <View style={styles.hubToolbarRow}>
                        <Text style={[styles.hubSectionLabel, { color: colors.textTertiary }]}>Distance</Text>
                        <Text style={[styles.hubDiscoverCaption, { color: colors.textTertiary, marginBottom: 8 }]}>
                          Events need map coordinates. Increase distance if results are thin.
                        </Text>
                        <ScrollView
                          horizontal
                          nestedScrollEnabled
                          showsHorizontalScrollIndicator={false}
                          keyboardShouldPersistTaps="handled"
                          style={{ flexGrow: 0 }}
                          contentContainerStyle={styles.nearRadiusScrollContent}
                        >
                          <View
                            style={[
                              styles.scopeSegmentTrack,
                              {
                                backgroundColor: colors.backgroundSecondary,
                                borderColor: colors.borderLight,
                                alignSelf: 'flex-start',
                              },
                            ]}
                          >
                            {CULTURE_HUB_NEAR_RADIUS_PRESETS.map((km) => {
                              const on = nearYouRadiusKm === km;
                              return (
                                <Pressable
                                  key={km}
                                  onPress={() => {
                                    haptic();
                                    setNearYouRadiusKm(km);
                                  }}
                                  style={[
                                    styles.scopeSegBtn,
                                    webCursor,
                                    { paddingHorizontal: 14 },
                                    on && { backgroundColor: CultureTokens.gold },
                                  ]}
                                  accessibilityLabel={`Interest radius ${km} kilometres`}
                                  accessibilityRole="button"
                                  accessibilityState={{ selected: on }}
                                >
                                  <Text
                                    style={[
                                      styles.scopeSegBtnText,
                                      { color: on ? colors.text : colors.textSecondary },
                                    ]}
                                  >
                                    {km} km
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    <View style={[styles.hubToolbarRow, styles.hubToolbarRowLast]}>
                      <ScrollView
                        horizontal
                        nestedScrollEnabled
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        style={{ flexGrow: 0 }}
                        contentContainerStyle={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingVertical: 2,
                          paddingRight: 8,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={[
                              styles.scopeSegmentTrack,
                              {
                                backgroundColor: colors.backgroundSecondary,
                                borderColor: colors.borderLight,
                              },
                            ]}
                          >
                            <Pressable
                              onPress={() => {
                                haptic();
                                setHubScope('singleCountry');
                              }}
                              style={[
                                styles.scopeSegBtn,
                                webCursor,
                                { maxWidth: 120 },
                                hubScope === 'singleCountry' && { backgroundColor: CultureTokens.indigo },
                              ]}
                              accessibilityLabel={`${focusCountry} — events in this country`}
                              accessibilityRole="button"
                              accessibilityState={{ selected: hubScope === 'singleCountry' }}
                            >
                              <Ionicons
                                name="flag-outline"
                                size={14}
                                color={hubScope === 'singleCountry' ? colors.textOnBrandGradient : colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.scopeSegBtnText,
                                  {
                                    color: hubScope === 'singleCountry' ? colors.textOnBrandGradient : colors.textSecondary,
                                    flexShrink: 1,
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {areaCountryShort}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                void activateNearYou();
                              }}
                              disabled={nearYouLoading}
                              style={[
                                styles.scopeSegBtn,
                                webCursor,
                                hubScope === 'nearYou' && { backgroundColor: CultureTokens.gold },
                              ]}
                              accessibilityLabel="Near me — events within your chosen distance using your location"
                              accessibilityRole="button"
                              accessibilityState={{ selected: hubScope === 'nearYou', busy: nearYouLoading }}
                            >
                              {nearYouLoading ? (
                                <ActivityIndicator
                                  size="small"
                                  color={CultureTokens.indigo}
                                  style={{ marginRight: 2 }}
                                />
                              ) : (
                                <Ionicons
                                  name="navigate-outline"
                                  size={14}
                                  color={hubScope === 'nearYou' ? colors.text : colors.textSecondary}
                                />
                              )}
                              <Text
                                style={[
                                  styles.scopeSegBtnText,
                                  {
                                    color: hubScope === 'nearYou' ? colors.text : colors.textSecondary,
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                Near me
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                haptic();
                                setHubScope('diaspora');
                              }}
                              style={[
                                styles.scopeSegBtn,
                                webCursor,
                                hubScope === 'diaspora' && { backgroundColor: CultureTokens.teal },
                              ]}
                              accessibilityLabel="Worldwide hub — diaspora listings with your country ranked first"
                              accessibilityRole="button"
                              accessibilityState={{ selected: hubScope === 'diaspora' }}
                            >
                              <Ionicons
                                name="earth-outline"
                                size={14}
                                color={hubScope === 'diaspora' ? colors.textOnBrandGradient : colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.scopeSegBtnText,
                                  {
                                    color: hubScope === 'diaspora' ? colors.textOnBrandGradient : colors.textSecondary,
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                Worldwide
                              </Text>
                            </Pressable>
                          </View>

                          <View
                            style={{
                              width: StyleSheet.hairlineWidth * 2,
                              alignSelf: 'stretch',
                              minHeight: 28,
                              backgroundColor: colors.borderLight,
                            }}
                          />

                          <View
                            style={[
                              styles.scopeSegmentTrack,
                              {
                                backgroundColor: colors.backgroundSecondary,
                                borderColor: colors.borderLight,
                              },
                            ]}
                          >
                            {(['category', 'culture', 'language'] as FilterMode[]).map((mode) => {
                              const active = filterMode === mode;
                              const labels: Record<FilterMode, string> = {
                                category: 'Category',
                                culture: 'Culture',
                                language: 'Language',
                              };
                              return (
                                <Pressable
                                  key={mode}
                                  onPress={() => {
                                    haptic();
                                    setFilterMode(mode);
                                  }}
                                  style={[
                                    styles.scopeSegBtn,
                                    webCursor,
                                    active && { backgroundColor: CultureTokens.indigo },
                                  ]}
                                  accessibilityLabel={`Filter by ${labels[mode]}`}
                                  accessibilityRole="button"
                                  accessibilityState={{ selected: active }}
                                >
                                  <Text
                                    style={[
                                      styles.scopeSegBtnText,
                                      {
                                        color: active ? colors.textOnBrandGradient : colors.textSecondary,
                                      },
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {labels[mode]}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>

                        {totalActiveFilters > 0 && (
                          <Pressable
                            onPress={clearAllFilters}
                            hitSlop={10}
                            style={webCursor}
                            accessibilityLabel="Clear all filters"
                            accessibilityRole="button"
                          >
                            <Text style={[styles.hubClearText, { color: CultureTokens.indigo }]}>Clear</Text>
                          </Pressable>
                        )}
                      </ScrollView>
                    </View>
                  </View>
                </View>

                {filterOptions.length > 0 && (
                  <FilterChips
                    variant="hub"
                    filters={filterOptions}
                    selectedFilters={activeFilters}
                    onToggle={onToggleFilter}
                    onClearAll={onClearMode}
                  />
                )}
              </View>
            </LiquidGlassPanel>
          </View>

          {showHighlightsRail && (
            <View
              style={styles.section}
              onLayout={(e) => {
                layoutHeights.current.highlights = e.nativeEvent.layout.height;
              }}
            >
              <View style={styles.sectionAccentTitleRow}>
                <View style={styles.sectionAccentBar} />
                <Text style={[TextStyles.title3, { color: colors.text, flex: 1 }]}>
                  Highlights ·{' '}
                  {hubScope === 'nearYou'
                    ? 'Near me'
                    : hubScope === 'diaspora'
                      ? `${focusCountry} first`
                      : focusCountry}
                </Text>
              </View>
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
              <View
                ref={eventsSectionRef}
                collapsable={false}
                style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}
              >
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
                    <View
                      style={[
                        styles.emptyStateCard,
                        { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      ]}
                    >
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          backgroundColor: colors.backgroundSecondary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="calendar-clear-outline" size={36} color={CultureTokens.indigo} />
                      </View>
                      <Text style={styles.emptyTitle}>No events match yet</Text>
                      <Text style={styles.emptySubtitle}>
                        {hubScope === 'nearYou'
                          ? nearYouCoords
                            ? `No ${def.heroTitle} events with coordinates in this radius yet. Try a larger km radius, Worldwide hub, or This country.`
                            : 'Allow location to see what is on near you.'
                          : hubScope === 'singleCountry'
                            ? `No matches in ${focusStateLabel ? `${focusStateLabel}, ` : ''}${focusCountry}. Try Worldwide hub or adjust filters.`
                            : 'Try filters or check back — we scan many countries for this community.'}
                      </Text>
                      <Pressable style={styles.retryButton} onPress={clearAllFilters}>
                        <Text style={styles.retryText}>Clear filters</Text>
                      </Pressable>
                      {hubScope === 'nearYou' && nearYouCoords && (
                        <Pressable
                          style={[styles.retryButton, { marginTop: 4, backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => {
                            haptic();
                            setHubScope('diaspora');
                          }}
                        >
                          <Text style={[styles.retryText, { color: colors.text }]}>Try worldwide hub</Text>
                        </Pressable>
                      )}
                      {hubScope === 'singleCountry' && (
                        <Pressable
                          style={[styles.retryButton, { marginTop: 4, backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => {
                            haptic();
                            setHubScope('diaspora');
                          }}
                        >
                          <Text style={[styles.retryText, { color: colors.text }]}>Open worldwide hub</Text>
                        </Pressable>
                      )}
                      {hubScope === 'nearYou' && !nearYouCoords && (
                        <Pressable
                          style={[styles.retryButton, { marginTop: 4, backgroundColor: CultureTokens.gold }]}
                          onPress={() => {
                            void activateNearYou();
                          }}
                        >
                          <Text style={[styles.retryText, { color: colors.text }]}>Enable location</Text>
                        </Pressable>
                      )}
                    </View>
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

            <View ref={placesColumnRef} collapsable={false} style={{ flex: 1, paddingTop: isDesktop ? 28 : 0 }}>
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

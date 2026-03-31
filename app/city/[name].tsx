import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/constants/typography';
import { CultureTokens, type ColorTheme } from '@/constants/theme';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FilterChips from '@/components/ui/FilterChips';
import EventCard from '@/components/Discover/EventCard';

  const CITY_IMAGES: Record<string, string> = {
  sydney: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=2000&q=90',
  melbourne: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=2000&q=90',
  brisbane: 'https://images.unsplash.com/photo-1549008880-927376046f4e?auto=format&fit=crop&w=2000&q=90',
  perth: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=2000&q=90',
  adelaide: 'https://images.unsplash.com/photo-1550747528-cdb869422707?auto=format&fit=crop&w=2000&q=90',
  uae: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=90',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2000&q=90',
};

const DEFAULT_CITY_IMAGE = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2000&q=90';

export default function CityScreen() {
  const { name, country } = useLocalSearchParams<{ name: string; country?: string }>();
  const colors = useColors();
  const { isDesktop, contentWidth, width } = useLayout();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const cityName = Array.isArray(name) ? name[0] : name ?? 'Sydney';
  const cityCountry = Array.isArray(country) ? country[0] : country ?? 'Australia';
  const heroImage = CITY_IMAGES[cityName.toLowerCase()] ?? DEFAULT_CITY_IMAGE;

  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Column layout (fixed to 2 for optimal discovery)
  const cols = 2;
  const colAnim = useSharedValue(2);

  const { data: eventsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/events', 'city', cityName, selectedFilters],
    queryFn: () =>
      api.events.list({
        city: cityName,
        country: cityCountry,
        pageSize: 40,
        category: selectedFilters.length > 0 ? selectedFilters[0].toLowerCase() : undefined,
      }),
    staleTime: 120_000,
  });

  const { data: venuesData } = useQuery({
    queryKey: ['/api/businesses', 'city', cityName],
    queryFn: () => api.businesses.list({ city: cityName, country: cityCountry }),
    staleTime: 300_000,
  });

  const events = useMemo(() => (Array.isArray(eventsData) ? eventsData : eventsData?.events ?? []), [eventsData]);
  const venues = useMemo(() => (Array.isArray(venuesData) ? venuesData : (venuesData as any)?.businesses ?? []).slice(0, 6), [venuesData]);

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const gridGap = 16;
  // Padding is fixed to 20 horizontally on mobile (total 40)
  const gridWidth = isDesktop ? contentWidth : width - 40;
  const cardWidth = Math.floor((gridWidth - gridGap) / 2) - 1;

  // Animated card style
  const animatedCardStyle = useAnimatedStyle(() => ({
    width: interpolate(colAnim.value, [2, 3], [cardWidth, cardWidth], Extrapolation.CLAMP),
    opacity: interpolate(colAnim.value, [2, 3], [1, 1]),
  }));

  const goToMap = useCallback(() => {
    haptic();
    router.push({ pathname: '/map', params: { city: cityName } });
  }, [cityName, haptic]);

  const styles = getStyles(colors, insets, isDesktop, gridGap);

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, isDesktop && { width: contentWidth, alignSelf: 'center' }]}
          stickyHeaderIndices={[1]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CultureTokens.indigo} />}
        >
          {/* ==================== HERO ==================== */}
          <View style={styles.hero}>
            <Image source={{ uri: heroImage }} style={styles.heroImage} contentFit="cover" transition={600} />

            <LinearGradient
              colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.85)']}
              locations={[0, 0.35, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Top Bar */}
            <View style={[styles.heroTopBar, { paddingTop: Platform.OS === 'web' ? 16 : insets.top + 16 }]}>
              <Pressable onPress={() => { haptic(); router.back(); }} style={styles.glassCircle}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </Pressable>

              <View style={styles.glassChip}>
                <Ionicons name="location" size={14} color={CultureTokens.gold} />
                <Text style={styles.countryText}>{cityCountry}</Text>
              </View>

              <Pressable onPress={haptic} style={styles.glassCircle}>
                <Ionicons name="share-social-outline" size={22} color="#FFF" />
              </Pressable>
            </View>

            {/* Hero Content */}
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>CITY GUIDE</Text>
              </View>
              <Text style={styles.heroCity}>{cityName}</Text>
              <Text style={styles.heroSubtitle}>Explore the vibrant heartbeat of culture</Text>
            </View>
          </View>

          {/* ==================== CATEGORY FLIPPER ==================== */}
          <FilterChips
            filters={['Music', 'Food', 'Arts', 'Nightlife', 'Indigenous']}
            selectedFilters={selectedFilters}
            onToggle={(f) => {
              haptic();
              setSelectedFilters((prev) =>
                prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
              );
            }}
            onClearAll={() => {
              haptic();
              setSelectedFilters([]);
            }}
          />

          {/* ==================== TRENDING NOW ==================== */}
          {events.length > 5 && selectedFilters.length === 0 && (
            <View style={styles.section}>
              <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12, textAlign: isDesktop ? 'left' : 'center' }]}>Trending Now</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {events.slice(0, 5).map((e: any) => (
                  <Pressable key={e.id} onPress={() => router.push(`/event/${e.id}`)} style={styles.trendingCard}>
                    <Image source={{ uri: e.heroImageUrl || e.imageUrl }} style={styles.trendingImage} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.trendingInfo}>
                      <Text style={styles.trendingTitle} numberOfLines={1}>{e.title}</Text>
                      <Text style={styles.trendingSubtitle}>{e.category}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ==================== MAIN CONTENT (Split on Desktop) ==================== */}
          <View style={isDesktop ? { flexDirection: 'row', gap: gridGap * 2, paddingHorizontal: 20 } : undefined}>
            <View style={{ flex: isDesktop ? 2.8 : 1 }}>
              {/* Upcoming Events */}
              <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
                <View style={styles.sectionHeader}>
                  <View style={!isDesktop && { alignItems: 'center' }}>
                    <Text style={[TextStyles.title3, { color: colors.text, textAlign: isDesktop ? 'left' : 'center' }]}>
                      {selectedFilters.length === 0 ? 'Upcoming Events' : `${selectedFilters.join(', ')} Events`}
                    </Text>
                    <Text style={[TextStyles.caption, { color: colors.textTertiary, textAlign: isDesktop ? 'left' : 'center' }]}>
                      {events.length} results in {cityName}
                    </Text>
                  </View>

                </View>

                {isLoading ? (
                  <View style={styles.skeletonGrid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <View key={i} style={[styles.skeletonCard, { width: cardWidth, height: cols === 2 ? 240 : 200 }]} />
                    ))}
                  </View>
                ) : events.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-clear-outline" size={64} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No events found</Text>
                    <Text style={styles.emptySubtitle}>Try changing the category or check back later</Text>
                    <Pressable
                      style={styles.retryButton}
                      onPress={() => {
                        setSelectedFilters([]);
                        refetch();
                      }}
                    >
                      <Text style={styles.retryText}>Show All Events</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Animated.View style={[styles.grid, { gap: isDesktop ? gridGap : gridGap }]}>
                    {events.map((event: any) => (
                      <Animated.View key={event.id} style={[isDesktop ? { width: (gridWidth * 0.72 - (gridGap * (cols - 1))) / cols } : animatedCardStyle, { marginBottom: gridGap }]}>
                        <EventCard event={event} containerWidth={isDesktop ? (gridWidth * 0.72 - (gridGap * (cols - 1))) / cols : cardWidth} containerHeight={260} />
                      </Animated.View>
                    ))}
                  </Animated.View>
                )}
              </View>
            </View>

            {/* Sidebar for Venues on Desktop, or Bottom Section on Mobile */}
            {venues.length > 0 && (
              <View style={{ flex: 1, paddingTop: isDesktop ? 28 : 0 }}>
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0, paddingTop: 0 }]}>
                    <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 16 }]}>Top Venues & Partners</Text>
                    <View style={isDesktop ? { gap: 12 } : styles.venueGrid}>
                      {venues.map((v: any) => (
                        <Pressable key={v.id} onPress={() => router.push(`/business/${v.id}`)} style={[styles.venueCard, isDesktop && { width: '100%' }]}>
                          <View style={styles.venueIcon}>
                            <Ionicons name="business" size={24} color={CultureTokens.indigo} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.venueName} numberOfLines={1}>{v.name}</Text>
                            <Text style={styles.venueCategory}>{v.category || 'Culture Host'}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                    {isDesktop && (
                        <Pressable 
                           style={{ marginTop: 24, padding: 16, borderRadius: 16, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center' }}
                           onPress={() => router.push({ pathname: '/map', params: { city: cityName } })}
                        >
                            <Ionicons name="map-outline" size={24} color={CultureTokens.indigo} style={{ marginBottom: 8 }} />
                            <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text }}>View All on Map</Text>
                        </Pressable>
                    )}
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Map Button (Mobile only if Desktop has sidebar link?) */}
        {!isDesktop && (
          <Pressable style={styles.fab} onPress={goToMap}>
            <Ionicons name="map" size={24} color="#FFF" />
            <Text style={styles.fabText}>Explore Map</Text>
          </Pressable>
        )}
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ColorTheme, insets: EdgeInsets, isDesktop: boolean, gridGap: number) =>
  StyleSheet.create({
    root: { flex: 1 },

    scroll: { paddingBottom: 40 },

    // HERO
    hero: { height: 380, position: 'relative', overflow: 'hidden' },
    heroImage: { ...StyleSheet.absoluteFillObject },
    heroTopBar: {
      position: 'absolute',
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    glassCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      // @ts-ignore
      backdropFilter: 'blur(12px)',
    },
    glassChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      // @ts-ignore
      backdropFilter: 'blur(12px)',
    },
    countryText: { color: '#FFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

    heroContent: { 
      paddingHorizontal: 24, 
      paddingBottom: 40, 
      position: 'absolute', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      alignItems: 'center' 
    },
    heroBadge: {
      backgroundColor: CultureTokens.gold,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'center',
      marginBottom: 8,
    },
    heroBadgeText: { color: '#000', fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 1 },
    heroCity: { ...TextStyles.display, color: '#FFF', fontSize: 48, lineHeight: 54, textAlign: 'center' },
    heroSubtitle: { 
       ...TextStyles.callout, 
       color: 'rgba(255,255,255,0.95)', 
       marginTop: 4, 
       maxWidth: '85%', 
       textAlign: 'center' 
    },

    // CATEGORY BAR
    catBar: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', zIndex: 5 },
    catScroll: { paddingHorizontal: 20, paddingVertical: 16, gap: 10, justifyContent: 'center', minWidth: '100%' },
    flipperChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    flipperChipActive: {
      backgroundColor: CultureTokens.indigo,
      borderColor: CultureTokens.indigo,
    },
    flipperChipText: { fontSize: 13.5, fontFamily: 'Poppins_600SemiBold' },

    // SECTION
    section: { paddingHorizontal: 20, paddingTop: 28 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isDesktop ? 'space-between' : 'center',
      marginBottom: 20,
      textAlign: isDesktop ? 'left' : 'center',
    },


    // TRENDING
    trendingCard: {
      width: 240,
      height: 150,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    trendingImage: { ...StyleSheet.absoluteFillObject },
    trendingInfo: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
    },
    trendingTitle: { color: '#FFF', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
    trendingSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Poppins_400Regular' },

    // VENUES
    venueGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    venueCard: {
      width: isDesktop ? '31%' : '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: 12,
    },
    venueIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: CultureTokens.indigo + '10',
      alignItems: 'center',
      justifyContent: 'center',
    },
    venueName: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    venueCategory: { fontSize: 12, color: colors.textTertiary, fontFamily: 'Poppins_400Regular' },

    // GRID
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: gridGap,
      justifyContent: isDesktop ? 'flex-start' : 'center',
    },

    // SKELETON
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: gridGap,
    },
    skeletonCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      opacity: 0.6,
    },

    // EMPTY STATE
    emptyState: {
      height: 320,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    emptySubtitle: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', maxWidth: 260 },
    retryButton: {
      marginTop: 12,
      backgroundColor: CultureTokens.indigo,
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 30,
    },
    retryText: { color: '#FFF', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },

    // FAB
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      backgroundColor: CultureTokens.indigo,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 30,
      ...Platform.select({
        web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.25)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 8,
        },
      }),
    },
    fabText: { color: '#FFF', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  });

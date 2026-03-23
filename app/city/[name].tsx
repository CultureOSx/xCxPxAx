import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/constants/typography';
import { CultureTokens, CardTokens, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import EventCard from '@/components/Discover/EventCard';

// City images keyed by lowercase city name
const CITY_IMAGES: Record<string, string> = {
  sydney: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
  melbourne: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=800&q=80',
  brisbane: 'https://images.unsplash.com/photo-1554030439-0bf90e2908f5?auto=format&fit=crop&w=800&q=80',
  perth: 'https://images.unsplash.com/photo-1534445883836-7cd3b4eb7932?auto=format&fit=crop&w=800&q=80',
  adelaide: 'https://images.unsplash.com/photo-1558231737-293699b867ba?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_CITY_IMAGE = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80';

interface CityLink {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  params?: Record<string, string>;
}

function buildCityLinks(city: string, country: string): CityLink[] {
  return [
    { id: 'indigenous', label: 'Indigenous',  icon: 'leaf-outline',     color: CultureTokens.gold,    route: '/(tabs)/explore', params: { focus: 'indigenous', city, country } },
    { id: 'movies',     label: 'Movies',       icon: 'film-outline',     color: '#E74C3C',             route: '/movies', params: { city, country } },
    { id: 'dining',     label: 'Dining',       icon: 'restaurant-outline',color: CultureTokens.saffron, route: '/restaurants', params: { city, country } },
    { id: 'activities', label: 'Activities',   icon: 'fitness-outline',  color: CultureTokens.teal,    route: '/activities', params: { city, country } },
    { id: 'shopping',   label: 'Shopping',     icon: 'bag-outline',      color: '#9B59B6',             route: '/shopping', params: { city, country } },
    { id: 'search',     label: 'Search',       icon: 'search-outline',   color: CultureTokens.indigo,  route: '/search', params: { city, country } },
    { id: 'events',     label: 'All Events',   icon: 'calendar-outline', color: CultureTokens.coral,   route: '/events', params: { city, country } },
    { id: 'directory',  label: 'Directory',    icon: 'grid-outline',     color: CultureTokens.teal,    route: '/(tabs)/directory', params: { city, country } },
  ];
}

export default function CityScreen() {
  const { name, country } = useLocalSearchParams<{ name: string; country?: string }>();
  const colors = useColors();
  const { isDesktop, contentWidth } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const cityName = Array.isArray(name) ? name[0] : name ?? 'Sydney';
  const cityCountry = Array.isArray(country) ? country[0] : country ?? 'Australia';

  const heroImage = CITY_IMAGES[cityName.toLowerCase()] ?? DEFAULT_CITY_IMAGE;

  const cityLinks = useMemo(() => buildCityLinks(cityName, cityCountry), [cityName, cityCountry]);

  const { data: eventsData } = useQuery({
    queryKey: ['/api/events', 'city', cityName],
    queryFn: () => api.events.list({ city: cityName, country: cityCountry, pageSize: 20 }),
    staleTime: 60_000,
  });

  const events = Array.isArray(eventsData)
    ? eventsData
    : (eventsData as any)?.events ?? [];

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const styles = useMemo(() => getStyles(colors), [colors]);
  const [heroError, setHeroError] = useState(false);

  return (
    <ErrorBoundary>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            isDesktop && { width: contentWidth, alignSelf: 'center' as any },
          ]}
        >
          {/* Hero */}
          <View style={styles.hero}>
            {heroError ? (
              <LinearGradient
                colors={[CultureTokens.indigo, CultureTokens.saffron, CultureTokens.coral]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroImage}
              />
            ) : (
              <Image
                source={{ uri: heroImage }}
                style={styles.heroImage}
                contentFit="cover"
                onError={() => setHeroError(true)}
              />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {/* Back button */}
            <Pressable
              onPress={() => { haptic(); if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as any); }}
              style={[styles.backBtn, { top: topInset + 12 }]}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={styles.heroContent}>
              <Text style={styles.heroCity}>{cityName}</Text>
              <Text style={styles.heroCountry}>{cityCountry}</Text>
            </View>
          </View>

          {/* Category grid */}
          <View style={styles.section}>
            <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 16 }]}>
              Explore {cityName}
            </Text>
            <View style={styles.linkGrid}>
              {cityLinks.map((link) => (
                <Pressable
                  key={link.id}
                  onPress={() => {
                    haptic();
                    router.push({ pathname: link.route as any, params: link.params });
                  }}
                  style={({ pressed }) => [
                    styles.linkCard,
                    { backgroundColor: colors.surface, borderColor: colors.borderLight },
                    pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={link.label}
                >
                  <View style={[styles.linkIcon, { backgroundColor: link.color + '18' }]}>
                    <Ionicons name={link.icon} size={22} color={link.color} />
                  </View>
                  <Text style={[TextStyles.captionSemibold, { color: colors.text, textAlign: 'center', marginTop: 8 }]}>
                    {link.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Upcoming events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[TextStyles.title3, { color: colors.text }]}>
                Upcoming in {cityName}
              </Text>
              <Pressable
                onPress={() => router.push({ pathname: '/events' as any, params: { city: cityName, country: cityCountry } })}
                accessibilityRole="button"
              >
                <Text style={[TextStyles.captionSemibold, { color: CultureTokens.indigo }]}>See all</Text>
              </Pressable>
            </View>

            {events.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <Ionicons name="calendar-outline" size={36} color={colors.textSecondary} />
                <Text style={[TextStyles.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
                  No upcoming events found in {cityName}.
                </Text>
              </View>
            ) : (
              events.slice(0, 10).map((event: any) => (
                <View key={event.id} style={{ marginBottom: 12 }}>
                  <EventCard event={event} />
                </View>
              ))
            )}
          </View>

          <View style={{ height: 40 + insets.bottom }} />
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 40 },
  hero: { height: 240, position: 'relative', justifyContent: 'flex-end' },
  heroImage: { ...StyleSheet.absoluteFillObject },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroContent: { padding: 20 },
  heroCity: { ...TextStyles.display, color: '#FFFFFF' },
  heroCountry: { ...TextStyles.callout, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  section: { paddingHorizontal: Spacing.md, paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linkCard: {
    width: '22%' as any,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: CardTokens.radius,
    borderWidth: 1,
  },
});

// app/(tabs)/index.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  FadeInDown,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { CultureTokens, EntityTypeColors, shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FilterChipRow, type FilterItem } from '@/components/FilterChip';
import { Card } from '@/components/ui/Card';

import { api, type CouncilData } from '@/lib/api';
import { isIndigenousProfile } from '@/lib/indigenous';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { Profile } from '@/shared/schema';

const { width } = Dimensions.get('window');

// ─── Animated Wrapper ─────────────────────────────────────────────────────────

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTITY_FILTERS = [
  { id: 'All',          label: 'All',             icon: 'grid',             color: CultureTokens.indigo },
  { id: 'event',        label: 'Events',          icon: 'calendar',          color: CultureTokens.saffron },
  { id: 'indigenous',   label: '🪃 Indigenous',   icon: 'leaf',              color: CultureTokens.gold },
  { id: 'business',     label: 'Businesses',      icon: 'storefront',        color: EntityTypeColors.business },
  { id: 'venue',        label: 'Venues',          icon: 'location',          color: EntityTypeColors.venue },
  { id: 'organisation', label: 'Organisations',   icon: 'business',          color: EntityTypeColors.organisation },
  { id: 'council',      label: 'Councils',        icon: 'shield-checkmark',  color: EntityTypeColors.council },
  { id: 'charity',      label: 'Charities',       icon: 'heart',             color: EntityTypeColors.charity },
] as const;

export default function DiscoveryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  const { state: onboardingState } = useOnboarding();

  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');

  // Scroll animations
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollY.value, [-100, 0, 250], [1.1, 1, 0.95], 'clamp') },
    ],
    opacity: interpolate(scrollY.value, [0, 200], [1, 0.4], 'clamp'),
  }));

  // Queries
  const { data: profilesRaw } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: () => api.profiles.list(),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['/api/events', 'discovery', onboardingState.city, onboardingState.country],
    queryFn: () => api.events.list({ 
      city: onboardingState.city ?? undefined, 
      country: onboardingState.country ?? undefined, 
      pageSize: 50 
    }),
    placeholderData: keepPreviousData,
  });

  const { data: councilListData } = useQuery({
    queryKey: ['/api/council/list', 'discovery-sync'],
    queryFn: () => api.council.list({ pageSize: 2000, sortBy: 'name', sortDir: 'asc' }),
  });

  const allEvents = useMemo(() => (eventsData && 'events' in eventsData ? eventsData.events : []), [eventsData]);

  const nonCommunityProfiles = useMemo(() => {
    const raw = profilesRaw as any;
    const profiles = Array.isArray(raw) ? raw : (raw?.profiles ?? []);
    const base = profiles.filter((p: any) => p.entityType !== 'community' && (p.category ?? '').toLowerCase() !== 'council');
    const councils = (councilListData?.councils ?? []).map((council: CouncilData) => ({
      id: council.id,
      name: council.name,
      description: council.description ?? `${council.suburb}, ${council.state}`,
      entityType: 'organizer',
      category: 'Council',
      city: council.suburb || '',
      country: council.country || 'Australia',
      isVerified: council.verificationStatus === 'verified',
      followersCount: 0,
      tags: [council.state, 'Council'].filter(Boolean),
      culturePassId: council.id.toUpperCase(),
      image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?q=80&w=400&auto=format&fit=crop',
    })) as unknown as Profile[];
    return [...base, ...councils];
  }, [profilesRaw, councilListData]);

  const filteredItems = useMemo(() => {
    let results: any[] = [
      ...allEvents.map(e => ({ type: 'event', data: e })),
      ...nonCommunityProfiles.map(p => ({ type: 'profile', data: p }))
    ];

    if (selectedType !== 'All') {
      if (selectedType === 'event') results = results.filter(i => i.type === 'event');
      else if (selectedType === 'indigenous') results = results.filter(i => i.type === 'profile' && isIndigenousProfile(i.data));
      else results = results.filter(i => i.type === 'profile' && (i.data.entityType === selectedType || (i.data.category?.toLowerCase() === selectedType)));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(item => {
        const d = item.data;
        const name = item.type === 'event' ? d.title : d.name;
        return name.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q);
      });
    }
    return results;
  }, [allEvents, nonCommunityProfiles, selectedType, search]);

  const handleCardPress = (item: any) => {
    const route = item.type === 'event' ? '/event/[id]' : '/profile/[id]';
    router.push({ pathname: route as any, params: { id: item.data.id } });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.heroWrapper}>
        <Animated.View style={[styles.heroContainer, heroAnimatedStyle]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1543157145-f78c636d023d?q=80&w=1200&auto=format&fit=crop' }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroTitle}>Discover Culture</Text>
            <Text style={styles.heroSubtitle}>Events, businesses & councils in {onboardingState.city || 'your city'}</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={{ backgroundColor: colors.background }}>
        <View style={styles.searchWrapper}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
            <Ionicons name="search" size={22} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search directory..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.chipsRow}>
          <FilterChipRow
            items={ENTITY_FILTERS as unknown as FilterItem[]}
            selectedId={selectedType}
            onSelect={(id) => {
              setSelectedType(id);
              if (Platform.OS !== 'web') Haptics.selectionAsync();
            }}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore Recommendations</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Verified cultural results</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ErrorBoundary>
        <AnimatedFlashList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item: any, index: number) => `${item.type}-${item.data.id}-${index}`}
          renderItem={({ item, index }: { item: any, index: number }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 50).springify().damping(20)}
              style={styles.cardContainer}
            >
              <TouchableOpacity activeOpacity={0.9} onPress={() => handleCardPress(item)} style={styles.cardPressable}>
                <Card padding={0} style={styles.roundedCard}>
                  <View style={styles.imageBox}>
                    <Image
                      source={{ uri: item.data.heroImageUrl || item.data.image || 'https://picsum.photos/id/1015/400/400' }}
                      style={styles.cardImage}
                      contentFit="cover"
                    />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.type === 'event' ? 'EVENT' : (item.data.category || 'PARTNER').toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>{item.type === 'event' ? item.data.title : item.data.name}</Text>
                    <View style={styles.cardFooter}>
                      <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                      <Text numberOfLines={1} style={[styles.cardLocation, { color: colors.textSecondary }]}>{item.data.city || 'Australia'}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 120 }]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          estimatedItemSize={280}
        />
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrapper: { height: 320, overflow: 'hidden' },
  heroContainer: { height: 320 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', padding: 28, justifyContent: 'flex-end' },
  heroTitle: { fontSize: 40, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: -1.5 },
  heroSubtitle: { fontSize: 18, fontFamily: 'Poppins_500Medium', color: '#fff', marginTop: 6, opacity: 0.9 },
  searchWrapper: { marginTop: -32, paddingHorizontal: 20, zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 16, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontFamily: 'Poppins_400Regular' },
  chipsRow: { paddingTop: 16 },
  sectionHeader: { paddingHorizontal: 24, paddingVertical: 20 },
  sectionTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold', letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 14, fontFamily: 'Poppins_500Medium', marginTop: 2, opacity: 0.8 },
  grid: { paddingHorizontal: 16 },
  cardContainer: { flex: 0.5, padding: 8 },
  cardPressable: { flex: 1 },
  roundedCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 0, backgroundColor: 'transparent', ...shadows.medium },
  imageBox: { height: 160, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 9, fontFamily: 'Poppins_800ExtraBold', color: '#000', letterSpacing: 0.5 },
  cardBody: { padding: 14, gap: 4 },
  cardTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardLocation: { fontSize: 13, fontFamily: 'Poppins_500Medium', opacity: 0.8 },
});

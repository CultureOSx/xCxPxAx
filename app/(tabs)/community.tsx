// app/(tabs)/community.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Pressable,
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
import { Button } from '@/components/ui/Button';

import { api } from '@/lib/api';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { NATIONALITIES } from '@/constants/cultures';
import type { Profile } from '@/shared/schema';

// ─── Constants & Types ────────────────────────────────────────────────────────

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

const CATEGORIES = [
  { id: 'All',        label: 'All',           icon: 'grid' },
  { id: 'association',label: 'Associations',  icon: 'business' },
  { id: 'student',    label: 'Student Groups',icon: 'school' },
  { id: 'professional',label: 'Professional', icon: 'briefcase' },
  { id: 'festival',   label: 'Festivals',     icon: 'party-popper' },
  { id: 'diaspora',   label: 'Diaspora',      icon: 'globe' },
];

const CULTURE_COLORS: Record<string, string> = {
  indian: '#FF9933', // Saffron
  korean: '#CD2E3A', // Korean Red
  chinese: '#EE1C25', // China Red
  nigerian: '#008751', // Nigerian Green
  mexican: '#006341', // Mexican Green
  brazilian: '#009739', // Brazil Green
  japanese: '#BC002D', // Japan Red
  greek: '#005BAE', // Greek Blue
  italian: '#008C45', // Italian Green
};

// ─── Components ───────────────────────────────────────────────────────────────

function CommunityGridCard({ item, colors, onPress }: { item: Profile, colors: any, onPress: () => void }) {
  const accentColor = CULTURE_COLORS[item.nationalityId || ''] || CultureTokens.indigo;
  
  return (
    <Animated.View entering={FadeInDown.springify().damping(20)} style={styles.cardWrapper}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <Card padding={0} style={styles.communityCard}>
          {/* Left Accent Bar */}
          <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
          
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: item.imageUrl || `https://ui-avatars.com/api/?name=${item.name}&background=random` }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                {item.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={8} color="#fff" />
                  </View>
                )}
              </View>
              
              <View style={styles.cardText}>
                <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  {item.category || 'Cultural Group'} • {item.city || 'Worldwide'}
                </Text>
              </View>
            </View>

            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={14} color={colors.textTertiary} />
                <Text style={[styles.statText, { color: colors.textTertiary }]}>{item.membersCount || 0} members</Text>
              </View>
              {(item as any).recentActivity && (
                <View style={[styles.activityPulse, { backgroundColor: accentColor + '15' }]}>
                  <Text style={[styles.activityText, { color: accentColor }]}>🔥 Trending</Text>
                </View>
              )}
            </View>

            <Button
              onPress={onPress}
              variant="outline"
              size="sm"
              style={styles.joinBtn}
            >
              <Text style={{ color: colors.text, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>Join Community</Text>
            </Button>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CommunitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, isDesktop, isTablet } = useLayout();
  const { state: onboardingState } = onboardingStateContext(); // Custom hook might vary, using what's available

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 200], [1, 0.4], 'clamp'),
    transform: [{ scale: interpolate(scrollY.value, [-100, 0, 300], [1.1, 1, 0.9], 'clamp') }],
  }));

  // Queries
  const { data: profilesRaw, isLoading } = useQuery({
    queryKey: ['/api/profiles', onboardingState?.city, selectedCategory],
    queryFn: () => api.profiles.list({ city: onboardingState?.city }),
  });

  const communities = useMemo(() => {
    const raw = (profilesRaw as any) || [];
    const base = Array.isArray(raw) ? raw : (raw.profiles || []);
    return base.filter((p: any) => p.entityType === 'community');
  }, [profilesRaw]);

  const filteredCommunities = useMemo(() => {
    let list = communities;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    return list;
  }, [communities, search]);

  const renderHeader = () => (
    <View>
      {/* 1. Cultural Hero Section */}
      <View style={styles.heroWrapper}>
        <Animated.View style={[styles.heroContainer, heroStyle]}>
          <Image
            source={{ uri: 'https://whakaatamaori-teaomaori-prod.web.arc-cdn.net/resizer/v2/BSRIUIXOCVHZLJ43F4L7ZWKL6E.jpg?auth=ebf374034e59e81f6dc4b2be20b5261ea16f35e31dc75ac61a59010efc7144d7&width=768' }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
            style={styles.heroOverlay}
          >
            <View style={styles.heroStats}>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>12.5k</Text>
                <Text style={styles.statLabel}>Communities</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statPill}>
                <Text style={styles.statValue}>2.4M</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Discover Communities Around Your Culture</Text>
            <Text style={styles.heroSubtitle}>Join diaspora networks and local groups celebrating traditions worldwide.</Text>
            
            <View style={styles.heroActions}>
              <Button size="lg" style={styles.heroPrimaryBtn}>
                <Text style={styles.btnText}>Create Community</Text>
              </Button>
              <TouchableOpacity style={styles.heroSecondaryBtn}>
                <Text style={styles.secondaryBtnText}>Explore by Culture</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={{ backgroundColor: colors.background }}>
        {/* 2. Overlapping Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search communities, cultures, languages..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* 3. Cultural Discovery Rail */}
        <View style={styles.railSection}>
          <Text style={[styles.railTitle, { color: colors.text }]}>Browse by Culture</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railScroll}>
            {Object.entries(NATIONALITIES).slice(0, 10).map(([id, nat]) => (
              <TouchableOpacity key={id} style={[styles.cultureCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.cultureEmoji}>{nat.emoji}</Text>
                <View>
                  <Text style={[styles.cultureName, { color: colors.text }]}>{nat.label}</Text>
                  <Text style={[styles.cultureCount, { color: colors.textSecondary }]}>24 groups</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsSection}>
          <FilterChipRow
            items={CATEGORIES as any}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>

        {/* Sorting & Header */}
        <View style={styles.listHeader}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {filteredCommunities.length} Communities Found
          </Text>
          <TouchableOpacity style={styles.sortBtn}>
            <Text style={[styles.sortText, { color: colors.textSecondary }]}>Most Active</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ErrorBoundary>
        <AnimatedFlashList
          data={filteredCommunities}
          numColumns={isDesktop ? 3 : isTablet ? 2 : 1}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <CommunityGridCard
              item={item}
              colors={colors}
              onPress={() => router.push({ pathname: '/community/[id]', params: { id: item.id } })}
            />
          )}
          ListHeaderComponent={renderHeader}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          estimatedItemSize={180}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        />
      </ErrorBoundary>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function onboardingStateContext() {
  const { state } = useOnboarding();
  return state;
}

const styles = StyleSheet.create({
  heroWrapper: { height: 440, overflow: 'hidden' },
  heroContainer: { height: 440 },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    padding: 32,
    justifyContent: 'flex-end',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  statPill: { alignItems: 'center' },
  statValue: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#fff' },
  statLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#fff', opacity: 0.8 },
  statDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.3)', mx: 12, marginHorizontal: 12 },
  heroTitle: { fontSize: 36, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 42, letterSpacing: -1 },
  heroSubtitle: { fontSize: 16, fontFamily: 'Poppins_400Regular', color: '#fff', marginTop: 12, opacity: 0.9, lineHeight: 22 },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  heroPrimaryBtn: { backgroundColor: CultureTokens.indigo, borderRadius: 16, paddingHorizontal: 24 },
  btnText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  heroSecondaryBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, justifyContent: 'center' },
  secondaryBtnText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },

  searchSection: { marginTop: -32, paddingHorizontal: 20, zIndex: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    ...shadows.large,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontFamily: 'Poppins_400Regular' },

  railSection: { marginTop: 32 },
  railTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', paddingHorizontal: 24, marginBottom: 16 },
  railScroll: { paddingHorizontal: 20, gap: 12 },
  cultureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingRight: 24,
    borderRadius: 18,
    gap: 14,
    ...shadows.small,
  },
  cultureEmoji: { fontSize: 28 },
  cultureName: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  cultureCount: { fontSize: 12, fontFamily: 'Poppins_500Medium' },

  chipsSection: { marginTop: 24, paddingHorizontal: 4 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  resultsCount: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  cardWrapper: { padding: 12, paddingHorizontal: 20 },
  communityCard: {
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.medium,
  },
  cardAccent: { width: 6 },
  cardContent: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarWrap: { width: 48, height: 48, position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 16 },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: CultureTokens.indigo,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  cardSub: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  activityPulse: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activityText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  joinBtn: { marginTop: 16, borderRadius: 12, borderColor: 'rgba(0,0,0,0.08)' },
});

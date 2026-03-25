// app/(tabs)/community.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { CultureTokens } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FilterChipRow } from '@/components/FilterChip';
import { CommunityGridCard } from '@/components/community/CommunityGridCard';
import { CommunityPreviewDrawer } from '@/components/community/CommunityPreviewDrawer';
import { useCommunities } from '@/hooks/queries/useCommunities';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { NATIONALITIES } from '@/constants/cultures';
import type { Community } from '@/shared/schema';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'All',          label: 'All',           icon: 'apps-outline'       },
  { id: 'association',  label: 'Associations',  icon: 'business-outline'   },
  { id: 'student',      label: 'Student',       icon: 'school-outline'     },
  { id: 'professional', label: 'Professional',  icon: 'briefcase-outline'  },
  { id: 'festival',     label: 'Festivals',     icon: 'sparkles-outline'   },
  { id: 'diaspora',     label: 'Diaspora',      icon: 'earth-outline'      },
];

const FALLBACK_CULTURE_IDS = ['indian', 'chinese', 'korean', 'nigerian', 'greek', 'italian'];

const STICKY_HEADER_HEIGHT = 56;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CommunitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { numColumns, hPad, columnWidth, columnGap, isDesktop } = useLayout();
  const { state: onboardingState } = useOnboarding();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCulture, setSelectedCulture] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<Community | null>(null);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });
  const webScrollHandler = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      scrollY.value = e.nativeEvent.contentOffset.y;
    },
    [scrollY],
  );

  const heroContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 200], [1, 0.4], 'clamp'),
    transform: [{ translateY: interpolate(scrollY.value, [0, 260], [0, -55], 'clamp') }],
  }));

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [220, 290], [0, 1], 'clamp'),
  }));

  const { data: communitiesRaw = [] } = useCommunities({
    city: onboardingState?.city,
    country: onboardingState?.country,
    nationalityId: onboardingState?.nationalityId,
  });

  const cultureChips = useMemo(() => {
    const seen = new Set<string>();
    const chips: { id: string; emoji: string; label: string }[] = [];
    const nats = NATIONALITIES as Record<string, { emoji: string; label: string } | undefined>;

    for (const c of communitiesRaw) {
      const natId = c.nationalityId;
      if (natId && !seen.has(natId)) {
        const nat = nats[natId];
        if (nat) {
          seen.add(natId);
          chips.push({ id: natId, emoji: nat.emoji, label: nat.label });
        }
      }
    }

    if (chips.length === 0) {
      for (const id of FALLBACK_CULTURE_IDS) {
        const nat = nats[id];
        if (nat) chips.push({ id, emoji: nat.emoji, label: nat.label });
      }
    }

    return chips.slice(0, 12);
  }, [communitiesRaw]);

  const filteredCommunities = useMemo(() => {
    let list = communitiesRaw;

    if (selectedCategory !== 'All') {
      const normalized = selectedCategory.toLowerCase();
      list = list.filter((c) => {
        const cat = c.communityCategory?.toLowerCase();
        const type = c.communityType?.toLowerCase();
        const legacy = c.category?.toLowerCase();
        return cat === normalized || type === normalized || legacy === normalized;
      });
    }

    if (selectedCulture) {
      list = list.filter(
        (c) =>
          c.nationalityId === selectedCulture ||
          (c.cultures ?? []).includes(selectedCulture),
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        const haystack = [
          c.name,
          c.description,
          c.headline,
          c.countryOfOrigin,
          c.primaryLanguageLabel,
          ...(c.cultures ?? []),
          ...(c.cultureIds ?? []),
          ...(c.chapterCities ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return list;
  }, [communitiesRaw, search, selectedCategory, selectedCulture]);

  const cardW = Math.floor(columnWidth());
  const topPad = Platform.OS === 'web' ? 24 : insets.top + STICKY_HEADER_HEIGHT + 16;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const handleCardPress = useCallback((item: Community) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPreview(item);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Community }) => (
      <CommunityGridCard item={item} width={cardW} onPress={handleCardPress} />
    ),
    [cardW, handleCardPress],
  );

  const renderHeader = () => (
    <View>
      {/* ── Hero ── */}
      <View style={s.heroWrapper}>
        <Animated.View style={[StyleSheet.absoluteFill, heroContentStyle]}>
          <LinearGradient
            colors={['#0B0B14', CultureTokens.indigo + '35', '#0B0B14']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={s.glowCircle1} />
          <View style={s.glowCircle2} />

          <View style={[s.heroContent, { paddingTop: topPad }]}>
            <Text style={s.heroTitle}>Diaspora Communities</Text>
            <Text style={s.heroSubtitle}>Connect with your heritage</Text>

            <View style={s.heroControlRow}>
              <View style={[s.searchBar, { backgroundColor: colors.surface }]}>
                <Ionicons name="search" size={17} color={colors.textSecondary} />
                <TextInput
                  style={[s.searchInput, { color: colors.text }]}
                  placeholder="Search communities, cultures..."
                  placeholderTextColor={colors.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
              <Pressable
                style={[s.bellBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  router.push('/notifications');
                }}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                {Platform.OS === 'ios' ? (
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                ) : null}
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={{ backgroundColor: colors.background }}>
        {/* ── Culture identity chips ── */}
        <View style={s.cultureSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.cultureScroll, { paddingHorizontal: hPad }]}
          >
            {cultureChips.map((chip) => {
              const active = selectedCulture === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  style={({ pressed }) => [
                    s.cultureChip,
                    {
                      backgroundColor: active ? CultureTokens.indigo + '20' : colors.surface,
                      borderColor: active ? CultureTokens.indigo : colors.borderLight,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setSelectedCulture(active ? null : chip.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${chip.label}`}
                >
                  <Text style={s.cultureEmoji}>{chip.emoji}</Text>
                  <Text
                    style={[s.cultureLabel, { color: active ? CultureTokens.indigo : colors.text }]}
                    numberOfLines={1}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Category filter chips ── */}
        <View style={s.chipsWrap}>
          <FilterChipRow
            items={CATEGORIES}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>

        {/* ── Results count ── */}
        <View style={[s.listHeader, { paddingHorizontal: hPad }]}>
          <Text style={[s.resultsText, { color: colors.textSecondary }]}>
            {filteredCommunities.length}{' '}
            {filteredCommunities.length === 1 ? 'community' : 'communities'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={[s.emptyWrap, { paddingHorizontal: hPad }]}>
      <LinearGradient
        colors={[CultureTokens.indigo + '40', CultureTokens.teal + '30']}
        style={s.emptyIconCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="globe-outline" size={36} color="#fff" />
      </LinearGradient>
      <Text style={[s.emptyHeading, { color: colors.text }]}>No communities found</Text>
      <Text style={[s.emptySub, { color: colors.textSecondary }]}>Try a different filter</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={[s.ctaBanner, { marginHorizontal: hPad }]}>
      <LinearGradient
        colors={[CultureTokens.indigo + '20', CultureTokens.teal + '15']}
        style={[StyleSheet.absoluteFill, s.ctaBannerGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={s.ctaTextBlock}>
        <Text style={[s.ctaTitle, { color: colors.text }]}>Start Your Community</Text>
        <Text style={[s.ctaSub, { color: colors.textSecondary }]}>
          Bring your culture together
        </Text>
      </View>
      <Pressable
        style={[s.ctaBtn, { backgroundColor: CultureTokens.indigo }]}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/submit?type=organisation' as any);
        }}
        accessibilityRole="button"
        accessibilityLabel="Create a community"
      >
        <Text style={s.ctaBtnText}>Create +</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Sticky top header (mobile / tablet only) ── */}
      {!isDesktop && (
        <View style={[s.stickyHeader, { paddingTop: topInset + 8 }]}>
          <Animated.View
            style={[StyleSheet.absoluteFill, headerBgStyle, { backgroundColor: colors.background }]}
          />
          <Text style={[s.stickyTitle, { color: '#FFFFFF' }]}>Communities</Text>
          <Pressable
            style={[s.stickyAddBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/submit?type=organisation' as any);
            }}
            accessibilityRole="button"
            accessibilityLabel="Create a community"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      )}

      <ErrorBoundary>
        <Animated.FlatList
          key={numColumns}
          data={filteredCommunities}
          numColumns={numColumns}
          keyExtractor={(item: Community) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onScroll={Platform.OS === 'web' ? webScrollHandler : scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          columnWrapperStyle={
            numColumns > 1
              ? { paddingHorizontal: hPad, gap: columnGap, marginBottom: columnGap }
              : undefined
          }
          showsVerticalScrollIndicator={false}
        />
      </ErrorBoundary>

      <CommunityPreviewDrawer
        profile={selectedPreview}
        onClose={() => setSelectedPreview(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  stickyTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  stickyAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrapper: {
    height: 320,
    overflow: 'hidden',
  },
  glowCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: CultureTokens.indigo + '18',
    top: -50,
    right: -40,
  },
  glowCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: CultureTokens.teal + '12',
    bottom: 30,
    left: -30,
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'flex-end',
    gap: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  heroControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    height: 44,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cultureSection: {
    paddingTop: 20,
    paddingBottom: 4,
  },
  cultureScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  cultureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  cultureEmoji: {
    fontSize: 15,
    lineHeight: 20,
  },
  cultureLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  chipsWrap: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  listHeader: {
    marginTop: 4,
    marginBottom: 14,
  },
  resultsText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyHeading: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.2,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: CultureTokens.indigo + '30',
    gap: 12,
  },
  ctaBannerGradient: {
    borderRadius: 20,
  },
  ctaTextBlock: {
    flex: 1,
    gap: 2,
  },
  ctaTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  ctaSub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  ctaBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  ctaBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
});

// app/(tabs)/community.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  SlideInDown,
  FadeInDown,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';

import { CultureTokens, shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FilterChipRow } from '@/components/FilterChip';
import { Button } from '@/components/ui/Button';

import { api } from '@/lib/api';
import {
  getCommunityAccent,
  getCommunityActivityMeta,
  getCommunityEventsCount,
  getCommunityHeadline,
  getCommunityLabel,
  getCommunityMemberCount,
  getCommunitySignals,
} from '@/lib/community';
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

// Deterministic gradient per community name initial
const COVER_GRADIENTS: [string, string][] = [
  [CultureTokens.indigo,  '#1B0F2E'],
  [CultureTokens.saffron, '#6B3A0A'],
  [CultureTokens.coral,   '#6B1A18'],
  [CultureTokens.teal,    '#0D3B35'],
  [CultureTokens.gold,    '#6B4600'],
];

function coverGradient(name: string): [string, string] {
  const idx = (name.charCodeAt(0) ?? 0) % COVER_GRADIENTS.length;
  return COVER_GRADIENTS[idx];
}

// Fallback culture chips shown before data loads
const FALLBACK_CULTURE_IDS = ['indian', 'chinese', 'korean', 'nigerian', 'greek', 'italian'];

// ─── Community Card ───────────────────────────────────────────────────────────

function CommunityCard({
  item,
  width,
  colors,
  onPress,
}: {
  item: Community;
  width: number;
  colors: ReturnType<typeof useColors>;
  onPress: (item: Community) => void;
}) {
  const members = getCommunityMemberCount(item);
  const activity = getCommunityActivityMeta(item);
  const gradient = coverGradient(item.name ?? 'C');
  const initial = (item.name ?? 'C').charAt(0).toUpperCase();
  const label = getCommunityLabel(item);
  const location = item.city || null;

  return (
    <Animated.View entering={FadeInDown.duration(350).springify()}>
      <Pressable
        style={({ pressed }) => [s.card, { width, opacity: pressed ? 0.88 : 1 }]}
        onPress={() => onPress(item)}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name} community`}
      >
        {/* Cover */}
        <View style={s.cover}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <LinearGradient
              colors={gradient}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          {/* Bottom fade for text legibility on photos */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            style={[StyleSheet.absoluteFill, { top: '50%' as unknown as number }]}
          />
          {!item.imageUrl && (
            <View style={s.initialWrap}>
              <Text style={s.initialText}>{initial}</Text>
            </View>
          )}
          {/* Type label badge */}
          {label ? (
            <View style={s.typeBadge}>
              <Text style={s.typeBadgeText}>{label}</Text>
            </View>
          ) : null}
          {item.isVerified && (
            <View style={s.verifiedBadge}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={[s.cardInfo, { backgroundColor: colors.surface }]}>
          <Text style={[s.cardName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {location ? (
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={10} color={colors.textTertiary} />
              <Text style={[s.cardMeta, { color: colors.textTertiary }]} numberOfLines={1}>
                {location}
              </Text>
            </View>
          ) : null}
          <View style={s.cardFooter}>
            <View style={s.membersRow}>
              <Ionicons name="people" size={11} color={colors.textTertiary} />
              <Text style={[s.membersText, { color: colors.textTertiary }]}>
                {members > 0 ? members.toLocaleString() : '—'}
              </Text>
            </View>
            <View style={[s.activityPill, { backgroundColor: activity.color + '22' }]}>
              <Text style={[s.activityLabel, { color: activity.color }]}>{activity.label}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Community Preview Drawer ─────────────────────────────────────────────────

function CommunityPreviewDrawer({
  profile,
  onClose,
  colors,
}: {
  profile: Community | null;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const insets = useSafeAreaInsets();
  if (!profile) return null;

  const accentColor = getCommunityAccent(profile, CultureTokens.indigo);
  const memberCount = getCommunityMemberCount(profile);
  const eventsCount = getCommunityEventsCount(profile);
  const activity = getCommunityActivityMeta(profile);
  const signals = getCommunitySignals(profile);
  const headline = getCommunityHeadline(profile);

  return (
    <Modal visible={!!profile} transparent animationType="none" onRequestClose={onClose}>
      <View style={ds.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <Animated.View
          entering={SlideInDown.springify().damping(22)}
          style={[ds.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
        >
          <View style={ds.handle} />

          <View style={ds.coverWrap}>
            <Image source={{ uri: profile.imageUrl ?? '' }} style={ds.cover} contentFit="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={StyleSheet.absoluteFill}
            />
            <TouchableOpacity style={ds.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={ds.content}>
            <View style={ds.header}>
              <View style={ds.titleRow}>
                <Text style={[ds.name, { color: colors.text }]}>{profile.name}</Text>
                {profile.isVerified && (
                  <Ionicons name="checkmark-circle" size={20} color={CultureTokens.indigo} />
                )}
              </View>
              <Text style={[ds.sub, { color: colors.textSecondary }]}>
                {getCommunityLabel(profile)} ·{' '}
                {[profile.city, profile.country].filter(Boolean).join(', ') || 'Australia'}
              </Text>
            </View>

            <View style={ds.statsRow}>
              <View style={[ds.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[ds.statVal, { color: colors.text }]}>
                  {memberCount > 0 ? memberCount.toLocaleString() : '—'}
                </Text>
                <Text style={[ds.statLab, { color: colors.textTertiary }]}>Members</Text>
              </View>
              <View style={[ds.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[ds.statVal, { color: colors.text }]}>
                  {eventsCount > 0 ? eventsCount : '—'}
                </Text>
                <Text style={[ds.statLab, { color: colors.textTertiary }]}>Events</Text>
              </View>
              <View style={[ds.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[ds.statVal, { color: activity.color }]}>{activity.label}</Text>
                <Text style={[ds.statLab, { color: colors.textTertiary }]}>Momentum</Text>
              </View>
            </View>

            {signals.length > 1 && (
              <View style={ds.signalRow}>
                {signals.slice(1).map((signal) => (
                  <View
                    key={signal}
                    style={[ds.signalChip, { backgroundColor: colors.backgroundSecondary }]}
                  >
                    <Text style={[ds.signalChipText, { color: colors.textSecondary }]}>
                      {signal}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[ds.desc, { color: colors.textSecondary }]} numberOfLines={3}>
              {headline}
            </Text>

            <View style={ds.actions}>
              <Button
                style={[ds.joinBtn, { backgroundColor: accentColor }]}
                onPress={() => {
                  onClose();
                  if (Platform.OS !== 'web') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }}
              >
                <Text style={ds.btnText}>Join Community</Text>
              </Button>
              <TouchableOpacity
                style={[ds.profileBtn, { borderColor: colors.borderLight }]}
                onPress={() => {
                  onClose();
                  router.push({ pathname: '/community/[id]', params: { id: profile.id } });
                }}
              >
                <Text style={[ds.profileBtnText, { color: colors.text }]}>View Full Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

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

  const heroContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 200], [1, 0.4], 'clamp'),
    transform: [{ translateY: interpolate(scrollY.value, [0, 260], [0, -55], 'clamp') }],
  }));

  // Sticky header fades in a solid background once the hero is scrolled away
  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [220, 290], [0, 1], 'clamp'),
  }));

  const { data: communitiesRaw = [] } = useQuery<Community[]>({
    queryKey: ['/api/communities', onboardingState?.city, onboardingState?.country, onboardingState?.nationalityId],
    queryFn: () => api.communities.list({
      city: onboardingState?.city,
      country: onboardingState?.country,
      nationalityId: onboardingState?.nationalityId,
    }),
  });

  // Culture chips derived from community data, fallback to preset list
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

    // Fallback when communities have no nationalityIds
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

  const STICKY_HEADER_HEIGHT = 56;
  const cardW = Math.floor(columnWidth());
  const topPad = Platform.OS === 'web' ? 24 : insets.top + STICKY_HEADER_HEIGHT + 16;

  const handleCardPress = useCallback((item: Community) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPreview(item);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Community }) => (
      <CommunityCard item={item} width={cardW} colors={colors} onPress={handleCardPress} />
    ),
    [cardW, colors, handleCardPress],
  );

  const renderHeader = () => (
    <View>
      {/* ── Hero ── */}
      <View style={s.heroWrapper}>
        <Animated.View style={[StyleSheet.absoluteFill, heroContentStyle]}>
          <LinearGradient
            colors={['#3D1B8E', '#1a1035', '#0a0820']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
          />
          {/* Decorative glow circles */}
          <View style={s.glowCircle1} />
          <View style={s.glowCircle2} />

          <View style={[s.heroContent, { paddingTop: topPad }]}>
            <View style={s.eyebrowRow}>
              <View style={s.eyebrowDot} />
              <Text style={s.heroEyebrow}>Diaspora · Culture · Belonging</Text>
            </View>
            <Text style={s.heroTitle}>Find Your{'\n'}Community</Text>
            <Text style={s.heroCount}>
              {communitiesRaw.length > 0
                ? `${communitiesRaw.length} communities near you`
                : 'Explore communities worldwide'}
            </Text>
          </View>
        </Animated.View>
      </View>

      <View style={{ backgroundColor: colors.background }}>
        {/* ── Search ── */}
        <View style={[s.searchWrap, { paddingHorizontal: hPad }]}>
          <View style={[s.searchBar, { backgroundColor: colors.surface, ...shadows.medium }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              placeholder="Search communities, cultures..."
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Culture chips ── */}
        <View style={s.cultureSection}>
          <Text style={[s.sectionTitle, { color: colors.text, paddingHorizontal: hPad }]}>
            Browse by Culture
          </Text>
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
                      backgroundColor: active ? 'transparent' : colors.surface,
                      borderColor: active ? 'transparent' : colors.borderLight,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    setSelectedCulture(active ? null : chip.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${chip.label}`}
                >
                  {active && (
                    <LinearGradient
                      colors={[CultureTokens.indigo, '#6B21A8']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  <View style={[s.cultureEmojiWrap, { backgroundColor: active ? 'rgba(255,255,255,0.15)' : colors.background }]}>
                    <Text style={s.cultureEmoji}>{chip.emoji}</Text>
                  </View>
                  <Text style={[s.cultureLabel, { color: active ? '#fff' : colors.text }]} numberOfLines={1}>
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Sticky top header (mobile / tablet only) ── */}
      {!isDesktop && (
        <View
          style={[
            s.stickyHeader,
            { paddingTop: Platform.OS === 'web' ? 8 : insets.top + 8 },
          ]}
        >
          {/* Background fades in as hero scrolls away */}
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
          onScroll={scrollHandler}
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
        colors={colors}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Sticky header
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

  // Hero
  heroWrapper: {
    height: 300,
    overflow: 'hidden',
  },
  glowCircle1: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: CultureTokens.saffron + '18',
    top: -60,
    right: -60,
  },
  glowCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: CultureTokens.teal + '12',
    bottom: 20,
    left: -40,
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 36,
    justifyContent: 'flex-end',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CultureTokens.saffron,
  },
  heroEyebrow: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 40,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    lineHeight: 46,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  heroCount: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 22,
  },

  // Search
  searchWrap: {
    marginTop: -22,
    marginBottom: 28,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },

  // Culture chips
  cultureSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 14,
  },
  cultureScroll: {
    gap: 10,
    paddingBottom: 8,
    paddingTop: 2,
  },
  cultureChip: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 76,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...shadows.small,
  },
  cultureEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cultureEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  cultureLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },

  // Category chips + list header
  chipsWrap: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  listHeader: {
    marginTop: 20,
    marginBottom: 14,
  },
  resultsText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },

  // Community card
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.medium,
  },
  cover: {
    height: 120,
    backgroundColor: '#1B0F2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: CultureTokens.indigo,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 12,
    paddingBottom: 14,
    gap: 4,
  },
  cardName: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardMeta: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membersText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
  },
  activityPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

// Drawer styles
const ds = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    ...shadows.large,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  coverWrap: { height: 180, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 24 },
  header: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontFamily: 'Poppins_700Bold' },
  sub: { fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center' },
  statVal: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  statLab: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  signalChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  signalChipText: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  desc: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: { gap: 12 },
  joinBtn: { height: 56, borderRadius: 16, justifyContent: 'center' },
  btnText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  profileBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
});

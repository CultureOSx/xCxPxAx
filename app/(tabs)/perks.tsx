// app/(tabs)/perks.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { CultureTokens, shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { FilterChipRow } from '@/components/FilterChip';
import { PerkCard } from '@/components/perks/PerkCard';
import { usePerks } from '@/hooks/queries/usePerks';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ─── Constants ────────────────────────────────────────────────────────────────

const CULTURAL_QUESTS = [
  {
    id: 'q1',
    title: 'Spice Routes',
    task: 'Visit 3 Indian Restaurants',
    progress: 1,
    total: 3,
    reward: 'Masala Explorer',
    color: '#FF9933',
    icon: 'restaurant',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400',
  },
  {
    id: 'q2',
    title: 'Hallyu Wave',
    task: 'Attend 2 Korean Art Events',
    progress: 1,
    total: 2,
    reward: 'K-Star Token',
    color: '#CD2E3A',
    icon: 'sparkles',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400',
  },
  {
    id: 'q3',
    title: 'Indigenous Echoes',
    task: 'Visit 1 Native Art Center',
    progress: 0,
    total: 1,
    reward: 'Ancient Roots Seed',
    color: CultureTokens.gold,
    icon: 'leaf',
    image: 'https://images.unsplash.com/photo-1543157145-f78c636d023d?q=80&w=400',
  },
];

const CATEGORIES = [
  { id: 'All',      label: 'All Perks', icon: 'gift'       },
  { id: 'tickets',  label: 'Tickets',   icon: 'ticket'     },
  { id: 'dining',   label: 'Dining',    icon: 'restaurant' },
  { id: 'shopping', label: 'Shopping',  icon: 'bag'        },
];

// ─── Quest Card ───────────────────────────────────────────────────────────────


function QuestCard({ quest }: { quest: (typeof CULTURAL_QUESTS)[number] }) {
  const colors = useColors();
  const [checkingIn, setCheckingIn] = useState(false);
  const [completed, setCompleted] = useState(false);
  const checkInTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleCheckIn = () => {
    if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current);
    setCheckingIn(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkInTimerRef.current = setTimeout(() => {
      setCheckingIn(false);
      setCompleted(true);
    }, 1500);
  };

  React.useEffect(() => {
    return () => {
      if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current);
    };
  }, []);

  const progressPct = (quest.progress / quest.total) * 100;

  return (
    <Animated.View
      entering={Platform.OS !== 'web' ? FadeInDown.duration(400).springify() : undefined}
      style={[s.questCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
    >
      {/* Left image strip */}
      <View style={s.questImageStrip}>
        <Image source={{ uri: quest.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient
          colors={['transparent', quest.color + 'CC']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        {/* Icon on image */}
        <View style={[s.questIconOnImage, { backgroundColor: quest.color }]}>
          <Ionicons name={quest.icon as never} size={18} color="#fff" />
        </View>
      </View>

      {/* Right content */}
      <View style={s.questCardContent}>
        {/* Reward badge */}
        <View style={s.questRewardBadge}>
          <Ionicons name="trophy" size={10} color={CultureTokens.gold} />
          <Text style={s.questRewardText}>{quest.reward}</Text>
        </View>

        {/* Title + task */}
        <Text style={[s.questTitle, { color: colors.text }]} numberOfLines={1}>
          {quest.title}
        </Text>
        <Text style={[s.questTask, { color: colors.textSecondary }]} numberOfLines={2}>
          {quest.task}
        </Text>

        {/* Progress bar */}
        <View style={s.progressSection}>
          <View style={[s.progressTrack, { backgroundColor: colors.borderLight }]}>
            <View
              style={[
                s.progressFill,
                { width: `${progressPct}%` as `${number}%`, backgroundColor: quest.color },
              ]}
            />
          </View>
          <Text style={[s.progressLabel, { color: colors.textTertiary }]}>
            {quest.progress}/{quest.total} completed
          </Text>
        </View>

        {/* CTA */}
        {completed ? (
          <Animated.View
            entering={Platform.OS !== 'web' ? SlideInDown.springify() : undefined}
            style={s.completedRow}
          >
            <View style={[s.completedBadge, { backgroundColor: colors.success + '18' }]}>
              <Ionicons name="checkmark-circle" size={15} color={colors.success} />
              <Text style={[s.completedText, { color: colors.success }]}>Completed!</Text>
            </View>
            <Pressable
              style={[s.shareBtn, { borderColor: CultureTokens.gold }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)/feed');
              }}
              accessibilityRole="button"
              accessibilityLabel="Post to community feed"
            >
              <Ionicons name="share-social" size={13} color={CultureTokens.gold} />
              <Text style={s.shareText}>Share</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable
            disabled={checkingIn}
            onPress={handleCheckIn}
            style={({ pressed }) => [
              s.checkInBtn,
              { backgroundColor: quest.color, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Check in at venue"
          >
            <Ionicons name="location" size={14} color="#fff" />
            <Text style={s.checkInText}>
              {checkingIn ? 'Verifying…' : 'Check In'}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Explorer Badge ───────────────────────────────────────────────────────────

function ExplorerBadge({ colors }: { colors: ReturnType<typeof useColors> }) {
  const expProgress = 0.62;

  return (
    <Animated.View
      entering={Platform.OS !== 'web' ? FadeInDown.duration(350) : undefined}
      style={[s.explorerCard, { backgroundColor: colors.surface }]}
    >
      <LinearGradient
        colors={[CultureTokens.gold + '22', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={s.explorerLeft}>
        <LinearGradient colors={[CultureTokens.gold, '#F4A100']} style={s.levelCircle}>
          <Text style={s.levelText}>4</Text>
          <Text style={s.levelLabel}>LVL</Text>
        </LinearGradient>
      </View>
      <View style={s.explorerRight}>
        <Text style={[s.explorerTitle, { color: colors.text }]}>Cultural Explorer</Text>
        <Text style={[s.explorerSub, { color: colors.textSecondary }]}>500 XP to next Explorer Token</Text>
        <View style={[s.expBarTrack, { backgroundColor: colors.borderLight }]}>
          <LinearGradient
            colors={[CultureTokens.gold, '#F4A100']}
            style={[s.expBarFill, { width: `${expProgress * 100}%` as `${number}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Membership Upgrade Banner ────────────────────────────────────────────────

function MembershipUpgradeBanner() {
  return (
    <Animated.View
      entering={Platform.OS !== 'web' ? FadeInDown.duration(400).delay(100) : undefined}
      style={s.upgradeBannerWrap}
    >
      <LinearGradient
        colors={[CultureTokens.indigo, CultureTokens.teal]}
        style={s.upgradeBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={s.upgradeBannerContent}>
          <Text style={s.upgradeHeadline}>Unlock 3x More Perks</Text>
          <Text style={s.upgradeSub}>Upgrade to CulturePass Plus</Text>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/membership/upgrade');
          }}
          style={({ pressed }) => [s.upgradeBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to CulturePass Plus"
        >
          <Text style={s.upgradeBtnText}>Upgrade Now →</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Perks Empty State ────────────────────────────────────────────────────────

function PerksEmptyState({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={s.emptyState}>
      <LinearGradient
        colors={[CultureTokens.gold + '30', CultureTokens.saffron + '20']}
        style={s.emptyIconCircle}
      >
        <Ionicons name="gift" size={36} color={CultureTokens.gold} />
      </LinearGradient>
      <Text style={[s.emptyTitle, { color: colors.text }]}>No perks available</Text>
      <Text style={[s.emptySub, { color: colors.textSecondary }]}>
        Check back soon for exclusive offers
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PerksTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad, isDesktop, isTablet } = useLayout();

  const [viewMode, setViewMode] = useState<'quests' | 'perks'>('quests');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: perks = [], refetch, isRefetching } = usePerks();

  const filteredPerks = useMemo(() => {
    if (selectedCategory === 'All') return perks;
    return perks.filter((p) => p.categories?.includes(selectedCategory));
  }, [perks, selectedCategory]);

  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const showUpgradeBanner = viewMode === 'perks'; // would check tier from useAuth in production
  const numPerkColumns = isDesktop || isTablet ? 2 : 1;

  const renderHeader = useCallback(() => (
    <View>
      {/* ── Hero ── */}
      <View style={[s.hero, { paddingTop: topInset + 20, paddingHorizontal: hPad }]}>
        <LinearGradient
          colors={['#2C1F6B', '#1a1035', '#0a0820']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        />
        {/* Decorative glows */}
        <View style={s.glow1} />
        <View style={s.glow2} />

        <View style={s.heroInner}>
          {/* Title row with XP badge */}
          <View style={s.heroTitleRow}>
            <View style={s.heroTitleBlock}>
              <View style={s.eyebrowRow}>
                <View style={s.eyebrowDot} />
                <Text style={s.eyebrow}>Rewards · Quests · Perks</Text>
              </View>
              <Text style={s.heroTitle}>Quests &{'\n'}Perks</Text>
            </View>
            {/* XP badge */}
            <View style={s.xpBadge}>
              <Text style={s.xpStar}>⭐</Text>
              <Text style={s.xpText}>240 XP</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[s.body, { backgroundColor: colors.background, paddingHorizontal: hPad }]}>
        {/* ── Explorer badge ── */}
        <ExplorerBadge colors={colors} />

        {/* ── View toggle ── */}
        <View style={[s.toggleWrap, { backgroundColor: colors.surface }]}>
          {(['quests', 'perks'] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                setViewMode(mode);
              }}
              style={({ pressed }) => [
                s.toggleBtn,
                viewMode === mode && s.toggleBtnActive,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: viewMode === mode }}
            >
              {viewMode === mode && (
                <LinearGradient
                  colors={[CultureTokens.indigo, '#6B21A8']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              <Ionicons
                name={mode === 'quests' ? 'map' : 'gift'}
                size={15}
                color={viewMode === mode ? '#fff' : colors.textSecondary}
              />
              <Text style={[s.toggleText, { color: viewMode === mode ? '#fff' : colors.textSecondary }]}>
                {mode === 'quests' ? 'Active Quests' : 'Exclusive Perks'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Category chips (perks mode only) ── */}
        {viewMode === 'perks' && (
          <View style={s.chipsRow}>
            <FilterChipRow items={CATEGORIES} selectedId={selectedCategory} onSelect={setSelectedCategory} />
          </View>
        )}

        {/* ── Membership upgrade banner (perks mode, free tier) ── */}
        {viewMode === 'perks' && showUpgradeBanner && (
          <MembershipUpgradeBanner />
        )}

        {/* ── Section header ── */}
        <View style={s.sectionHeaderRow}>
          <Ionicons
            name={viewMode === 'quests' ? 'map-outline' : 'gift-outline'}
            size={14}
            color={colors.textTertiary}
          />
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
            {viewMode === 'quests'
              ? `${CULTURAL_QUESTS.length} Active Quests`
              : `Member Perks · ${filteredPerks.length} available`}
          </Text>
        </View>
      </View>
    </View>
  ), [colors, hPad, topInset, viewMode, selectedCategory, filteredPerks.length, showUpgradeBanner]);

  const listData = viewMode === 'quests' ? CULTURAL_QUESTS : filteredPerks;

  const renderItem = useCallback(({ item }: { item: typeof listData[number] }) => (
    <View style={{ paddingHorizontal: hPad }}>
      {viewMode === 'quests' ? (
        <QuestCard quest={item as (typeof CULTURAL_QUESTS)[number]} />
      ) : (
        <View style={[s.perkWrapper, numPerkColumns === 2 && { flex: 1 }]}>
          <PerkCard perk={item as Parameters<typeof PerkCard>[0]['perk']} />
        </View>
      )}
    </View>
  ), [hPad, viewMode, numPerkColumns]);

  const ListEmpty = useCallback(() => (
    viewMode === 'perks' ? (
      <View style={{ paddingHorizontal: hPad }}>
        <PerksEmptyState colors={colors} />
      </View>
    ) : null
  ), [viewMode, hPad, colors]);

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <ErrorBoundary>
        <FlatList
          data={listData as typeof listData}
          keyExtractor={(item: { id: string }) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={ListEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          onRefresh={viewMode === 'perks' ? refetch : undefined}
          refreshing={viewMode === 'perks' ? isRefetching : false}
          numColumns={viewMode === 'perks' ? numPerkColumns : 1}
          key={`${viewMode}-${numPerkColumns}`}
        />
      </ErrorBoundary>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1 },

  // Hero
  hero: {
    overflow: 'hidden',
    paddingBottom: 32,
  },
  glow1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: CultureTokens.gold + '15',
    top: -70,
    right: -50,
  },
  glow2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: CultureTokens.teal + '10',
    bottom: 0,
    left: -30,
  },
  heroInner: { paddingTop: 8 },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTitleBlock: { flex: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: CultureTokens.gold },
  eyebrow: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 40,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    lineHeight: 46,
    letterSpacing: -0.8,
  },

  // XP badge
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CultureTokens.gold + '25',
    borderWidth: 1,
    borderColor: CultureTokens.gold + '50',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  xpStar: { fontSize: 13 },
  xpText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.gold,
  },

  // Body below hero
  body: { paddingTop: 24 },

  // Explorer badge
  explorerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    ...shadows.small,
  },
  explorerLeft: {},
  explorerRight: { flex: 1 },
  levelCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_800ExtraBold', lineHeight: 22 },
  levelLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: 'Poppins_700Bold', letterSpacing: 1 },
  explorerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  explorerSub: { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 10, opacity: 0.8 },
  expBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  expBarFill: { height: '100%', borderRadius: 3 },

  // View toggle
  toggleWrap: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 18,
    marginBottom: 20,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    overflow: 'hidden',
  },
  toggleBtnActive: {},
  toggleText: { fontSize: 13, fontFamily: 'Poppins_700Bold' },

  // Category chips
  chipsRow: { marginBottom: 16 },

  // Upgrade banner
  upgradeBannerWrap: { marginBottom: 20 },
  upgradeBanner: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    overflow: 'hidden',
    ...shadows.medium,
  },
  upgradeBannerContent: { flex: 1 },
  upgradeHeadline: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  upgradeSub: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.8)',
  },
  upgradeBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  upgradeBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.indigo,
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Quest card — horizontal layout
  questCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    height: 160,
    ...shadows.medium,
  },
  questImageStrip: {
    width: 160,
    position: 'relative',
  },
  questIconOnImage: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questCardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  questRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: CultureTokens.gold + '18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: CultureTokens.gold + '40',
    marginBottom: 4,
  },
  questRewardText: {
    color: CultureTokens.gold,
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  questTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 21,
  },
  questTask: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 17,
  },
  progressSection: { gap: 4 },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkInBtn: {
    height: 36,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  checkInText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    flex: 1,
  },
  completedText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: CultureTokens.gold + '08',
  },
  shareText: {
    color: CultureTokens.gold,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },

  // Perk card wrapper
  perkWrapper: { paddingVertical: 6 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

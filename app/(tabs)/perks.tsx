// app/(tabs)/perks.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, SlideInDown,
  useSharedValue, useAnimatedStyle, withSpring,
  interpolateColor, withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { CultureTokens, shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { PerkCard } from '@/components/perks/PerkCard';
import { usePerks } from '@/hooks/queries/usePerks';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useOnboarding } from '@/contexts/OnboardingContext';

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
    // Gold is kept intentionally for this indigenous quest — cultural choice
    color: CultureTokens.gold,
    icon: 'leaf',
    image: 'https://images.unsplash.com/photo-1543157145-f78c636d023d?q=80&w=400',
  },
];

const PERK_CATEGORIES = [
  { id: 'All',      label: 'All Perks', icon: 'gift-outline'      },
  { id: 'tickets',  label: 'Tickets',   icon: 'ticket-outline'    },
  { id: 'dining',   label: 'Dining',    icon: 'restaurant-outline' },
  { id: 'shopping', label: 'Shopping',  icon: 'bag-outline'       },
  { id: 'arts',     label: 'Arts',      icon: 'brush-outline'     },
  { id: 'wellness', label: 'Wellness',  icon: 'leaf-outline'      },
];

const isWeb = Platform.OS === 'web';

// ─── Inline animated FilterChip ───────────────────────────────────────────────

function FilterChip({
  label, active, onPress, icon,
}: {
  label: string; active: boolean; onPress: () => void; icon?: string;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const bg = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      bg.value, [0, 1],
      active
        ? [CultureTokens.indigo, CultureTokens.indigo + 'dd']
        : [colors.surface, colors.surfaceElevated],
    ),
  }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.92); bg.value = withTiming(1, { duration: 100 }); }}
      onPressOut={() => { scale.value = withSpring(1);   bg.value = withTiming(0, { duration: 100 }); }}
      onPress={() => { if (!isWeb) Haptics.selectionAsync(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Animated.View style={[fc.chip, { borderColor: active ? CultureTokens.indigo : colors.borderLight }, animStyle]}>
        {icon ? <Ionicons name={icon as never} size={13} color={active ? '#fff' : colors.textTertiary} /> : null}
        <Text style={[fc.text, { color: active ? '#fff' : colors.textSecondary }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const fc = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  text: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', lineHeight: 17 },
});

function FilterDivider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={{ width: 1, height: 18, backgroundColor: colors.borderLight, marginHorizontal: 4, alignSelf: 'center' }} />;
}

// ─── Perk Card Skeleton ───────────────────────────────────────────────────────

function PerkCardSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[pk.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[pk.image, { backgroundColor: colors.borderLight }]} />
      <View style={pk.body}>
        <View style={[pk.line, { width: '65%', backgroundColor: colors.borderLight }]} />
        <View style={[pk.line, { width: '45%', backgroundColor: colors.borderLight, marginTop: 6 }]} />
        <View style={[pk.pill, { backgroundColor: colors.borderLight, marginTop: 8 }]} />
      </View>
    </View>
  );
}

const pk = StyleSheet.create({
  card:  { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  image: { height: 100 },
  body:  { padding: 12 },
  line:  { height: 12, borderRadius: 6 },
  pill:  { height: 20, width: 70, borderRadius: 10 },
});

// ─── Quest Card ───────────────────────────────────────────────────────────────

function QuestCard({ quest }: { quest: (typeof CULTURAL_QUESTS)[number] }) {
  const colors = useColors();
  const [checkingIn, setCheckingIn] = useState(false);
  const [completed, setCompleted] = useState(false);
  const checkInTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCheckIn = () => {
    if (checkInTimerRef.current) clearTimeout(checkInTimerRef.current);
    setCheckingIn(true);
    if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      entering={!isWeb ? FadeInDown.duration(400).springify() : undefined}
      style={[qs.questCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
    >
      {/* Left image strip */}
      <View style={qs.questImageStrip}>
        <Image source={{ uri: quest.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient
          colors={['transparent', quest.color + 'CC']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={[qs.questIconOnImage, { backgroundColor: quest.color }]}>
          <Ionicons name={quest.icon as never} size={18} color="#fff" />
        </View>
      </View>

      {/* Right content */}
      <View style={qs.questCardContent}>
        {/* Reward badge — gold is intentional for quest rewards */}
        <View style={qs.questRewardBadge}>
          <Ionicons name="trophy" size={10} color={CultureTokens.gold} />
          <Text style={qs.questRewardText}>{quest.reward}</Text>
        </View>

        <Text style={[qs.questTitle, { color: colors.text }]} numberOfLines={1}>
          {quest.title}
        </Text>
        <Text style={[qs.questTask, { color: colors.textSecondary }]} numberOfLines={2}>
          {quest.task}
        </Text>

        <View style={qs.progressSection}>
          <View style={[qs.progressTrack, { backgroundColor: colors.borderLight }]}>
            <View
              style={[
                qs.progressFill,
                { width: `${progressPct}%` as `${number}%`, backgroundColor: quest.color },
              ]}
            />
          </View>
          <Text style={[qs.progressLabel, { color: colors.textTertiary }]}>
            {quest.progress}/{quest.total} completed
          </Text>
        </View>

        {completed ? (
          <Animated.View
            entering={!isWeb ? SlideInDown.springify() : undefined}
            style={qs.completedRow}
          >
            <View style={[qs.completedBadge, { backgroundColor: colors.success + '18' }]}>
              <Ionicons name="checkmark-circle" size={15} color={colors.success} />
              <Text style={[qs.completedText, { color: colors.success }]}>Completed!</Text>
            </View>
            <Pressable
              style={[qs.shareBtn, { borderColor: CultureTokens.gold }]}
              onPress={() => {
                if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)/feed');
              }}
              accessibilityRole="button"
              accessibilityLabel="Post to community feed"
            >
              <Ionicons name="share-social" size={13} color={CultureTokens.gold} />
              <Text style={qs.shareText}>Share</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable
            disabled={checkingIn}
            onPress={handleCheckIn}
            style={({ pressed }) => [
              qs.checkInBtn,
              { backgroundColor: quest.color, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Check in at venue"
          >
            <Ionicons name="location" size={14} color="#fff" />
            <Text style={qs.checkInText}>
              {checkingIn ? 'Verifying…' : 'Check In'}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const qs = StyleSheet.create({
  questCard: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 14, height: 160, ...shadows.medium },
  questImageStrip: { width: 160, position: 'relative' },
  questIconOnImage: { position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  questCardContent: { flex: 1, padding: 14, justifyContent: 'space-between' },
  questRewardBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: CultureTokens.gold + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: CultureTokens.gold + '40', marginBottom: 4 },
  questRewardText: { color: CultureTokens.gold, fontSize: 10, fontFamily: 'Poppins_700Bold' },
  questTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', lineHeight: 21 },
  questTask: { fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 17 },
  progressSection: { gap: 4 },
  progressTrack: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  checkInBtn: { height: 36, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  checkInText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff' },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, flex: 1 },
  completedText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.5, backgroundColor: CultureTokens.gold + '08' },
  shareText: { color: CultureTokens.gold, fontSize: 11, fontFamily: 'Poppins_700Bold' },
});

// ─── Explorer Badge ───────────────────────────────────────────────────────────

function ExplorerBadge({ colors }: { colors: ReturnType<typeof useColors> }) {
  const expProgress = 0.62;
  return (
    <Animated.View
      entering={!isWeb ? FadeInDown.duration(350) : undefined}
      style={[eb.explorerCard, { backgroundColor: colors.surface }]}
    >
      <LinearGradient
        colors={[CultureTokens.gold + '22', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <LinearGradient colors={[CultureTokens.gold, '#F4A100']} style={eb.levelCircle}>
        <Text style={eb.levelText}>4</Text>
        <Text style={eb.levelLabel}>LVL</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={[eb.explorerTitle, { color: colors.text }]}>Cultural Explorer</Text>
        <Text style={[eb.explorerSub, { color: colors.textSecondary }]}>500 XP to next Explorer Token</Text>
        <View style={[eb.expBarTrack, { backgroundColor: colors.borderLight }]}>
          <LinearGradient
            colors={[CultureTokens.gold, '#F4A100']}
            style={[eb.expBarFill, { width: `${expProgress * 100}%` as `${number}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const eb = StyleSheet.create({
  explorerCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 24, marginBottom: 24, overflow: 'hidden', ...shadows.small },
  levelCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  levelText: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_800ExtraBold', lineHeight: 22 },
  levelLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: 'Poppins_700Bold', letterSpacing: 1 },
  explorerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  explorerSub: { fontSize: 12, fontFamily: 'Poppins_500Medium', marginBottom: 10, opacity: 0.8 },
  expBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  expBarFill: { height: '100%', borderRadius: 3 },
});

// ─── Membership Upgrade Banner ────────────────────────────────────────────────

function MembershipUpgradeBanner() {
  return (
    <Animated.View
      entering={!isWeb ? FadeInDown.duration(400).delay(100) : undefined}
      style={{ marginBottom: 20 }}
    >
      <LinearGradient
        colors={[CultureTokens.indigo, CultureTokens.teal]}
        style={mb.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={{ flex: 1 }}>
          <Text style={mb.headline}>Unlock 3x More Perks</Text>
          <Text style={mb.sub}>Upgrade to CulturePass Plus</Text>
        </View>
        <Pressable
          onPress={() => {
            if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/membership/upgrade');
          }}
          style={({ pressed }) => [mb.btn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to CulturePass Plus"
        >
          <Text style={mb.btnText}>Upgrade Now →</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const mb = StyleSheet.create({
  banner: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, overflow: 'hidden', ...shadows.medium },
  headline: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#fff', marginBottom: 2 },
  sub: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.8)' },
  btn: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  btnText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: CultureTokens.indigo },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PerksTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad, isDesktop, isTablet } = useLayout();
  const { state } = useOnboarding();

  const topInset    = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 0 : insets.bottom;

  const [viewMode, setViewMode]           = useState<'quests' | 'perks'>('quests');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: perks = [], refetch, isRefetching, isLoading: perksLoading } = usePerks();

  const filteredPerks = useMemo(() => {
    if (selectedCategory === 'All') return perks;
    return perks.filter((p) => p.categories?.includes(selectedCategory));
  }, [perks, selectedCategory]);

  const numPerkColumns = isDesktop || isTablet ? 2 : 1;
  const colGap = isDesktop ? 20 : 12;

  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'your region';

  const filtersActive = selectedCategory !== 'All';

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
  }, []);

  const renderQuestItem = useCallback(({ item, index }: { item: typeof CULTURAL_QUESTS[number]; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 60, 400)).springify().damping(18)}
    >
      <QuestCard quest={item} />
    </Animated.View>
  ), []);

  const renderPerkItem = useCallback(({ item, index }: { item: ReturnType<typeof usePerks>['data'] extends (infer T)[] | undefined ? T : never; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 60, 400)).springify().damping(18)}
      style={{ flex: 1 }}
    >
      <PerkCard perk={item as Parameters<typeof PerkCard>[0]['perk']} />
    </Animated.View>
  ), []);

  const renderHeader = useCallback(() => (
    <View style={[s.headerSection, { paddingHorizontal: hPad }]}>
      <ExplorerBadge colors={colors} />

      {/* View mode toggle */}
      <View style={[s.toggleWrap, { backgroundColor: colors.surface }]}>
        {(['quests', 'perks'] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => {
              if (!isWeb) Haptics.selectionAsync();
              setViewMode(mode);
            }}
            style={({ pressed }) => [
              s.toggleBtn,
              viewMode === mode && s.toggleBtnActive,
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: viewMode === mode }}
            accessibilityLabel={mode === 'quests' ? 'Active Quests' : 'Exclusive Perks'}
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

      {/* Category filter chips — perks mode only */}
      {viewMode === 'perks' && (
        <View style={[s.filterBlock, { borderBottomColor: colors.divider }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.filterRow]}
            accessibilityRole="tablist"
            accessibilityLabel="Perk category filters"
          >
            {PERK_CATEGORIES.map(cat => (
              <FilterChip
                key={cat.id}
                label={cat.label}
                active={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                icon={cat.icon}
              />
            ))}
            {filtersActive && (
              <>
                <FilterDivider colors={colors} />
                <Pressable
                  onPress={clearFilters}
                  style={[s.clearBtn, { borderColor: colors.borderLight }]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear category filter"
                >
                  <Ionicons name="close" size={12} color={colors.textTertiary} />
                  <Text style={[s.clearBtnText, { color: colors.textTertiary }]}>Clear</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      )}

      {viewMode === 'perks' && <MembershipUpgradeBanner />}

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
  ), [colors, hPad, viewMode, selectedCategory, filteredPerks.length, filtersActive, clearFilters]);

  return (
    <ErrorBoundary>
      <View style={[s.screen, { backgroundColor: colors.background, paddingTop: topInset }]}>

        {/* ── Header ── */}
        <Animated.View
          entering={FadeInUp.duration(320).springify()}
          style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.divider, backgroundColor: colors.background }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Perks & Rewards</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="location" size={10} color={CultureTokens.indigo} />
              <Text style={[s.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationLabel}
                {!perksLoading && viewMode === 'perks' && filteredPerks.length > 0
                  ? ` · ${filteredPerks.length} perks`
                  : ''}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => refetch()}
            style={[s.iconBtn, { backgroundColor: colors.surface + '80', borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh perks"
          >
            {isRefetching
              ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
              : <Ionicons name="refresh" size={18} color={colors.text} />}
            {Platform.OS === 'ios' && <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />}
          </Pressable>
        </Animated.View>

        {/* ── Content shell ── */}
        <View style={[s.shell, isDesktop && s.shellDesktop]}>
          {viewMode === 'quests' ? (
            // Quests — single column list
            <FlatList
              data={CULTURAL_QUESTS}
              keyExtractor={(item) => item.id}
              renderItem={renderQuestItem}
              ListHeaderComponent={renderHeader}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[s.list, { paddingHorizontal: hPad, paddingBottom: bottomInset + 120 }]}
              ListFooterComponent={() => (
                <View style={s.listFooter}>
                  <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                  <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
                    {CULTURAL_QUESTS.length} active quests
                  </Text>
                  <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                </View>
              )}
            />
          ) : perksLoading ? (
            // Perks loading skeleton
            <>
              {renderHeader()}
              <FlatList
                key={`skeleton-${numPerkColumns}`}
                data={Array.from({ length: 6 })}
                renderItem={() => <View style={{ flex: 1, paddingBottom: 14 }}><PerkCardSkeleton colors={colors} /></View>}
                keyExtractor={(_, i) => `sk-${i}`}
                numColumns={numPerkColumns}
                columnWrapperStyle={numPerkColumns > 1 ? { gap: colGap } : undefined}
                contentContainerStyle={[s.list, { paddingHorizontal: hPad, gap: colGap }]}
                scrollEnabled={false}
              />
            </>
          ) : (
            // Perks grid
            <FlatList
              key={`perks-${numPerkColumns}`}
              data={filteredPerks}
              keyExtractor={(item) => item.id}
              renderItem={renderPerkItem}
              ListHeaderComponent={renderHeader}
              numColumns={numPerkColumns}
              columnWrapperStyle={numPerkColumns > 1 ? { gap: colGap } : undefined}
              contentContainerStyle={[s.list, { paddingHorizontal: hPad, gap: colGap, paddingBottom: bottomInset + 120 }]}
              showsVerticalScrollIndicator={false}
              refreshing={isRefetching}
              onRefresh={refetch}
              ListFooterComponent={() => {
                if (filteredPerks.length > 0) return (
                  <View style={s.listFooter}>
                    <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                    <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
                      {filteredPerks.length} perk{filteredPerks.length !== 1 ? 's' : ''} shown
                    </Text>
                    <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                  </View>
                );
                return null;
              }}
              ListEmptyComponent={
                <View style={s.emptyState}>
                  <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                    <Ionicons name="gift-outline" size={28} color={colors.textTertiary} />
                  </View>
                  <Text style={[s.emptyTitle, { color: colors.text }]}>No perks available</Text>
                  <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
                    {filtersActive
                      ? 'Try a different category.'
                      : 'Check back soon for exclusive offers.'}
                  </Text>
                  {filtersActive && (
                    <Pressable
                      style={[s.resetBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
                      onPress={clearFilters}
                      accessibilityRole="button"
                    >
                      <Ionicons name="refresh-outline" size={14} color={CultureTokens.indigo} />
                      <Text style={[s.resetBtnText, { color: CultureTokens.indigo }]}>Reset filters</Text>
                    </Pressable>
                  )}
                </View>
              }
            />
          )}
        </View>
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:         { flex: 1 },

  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBtn:        { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  headerTitle:    { fontSize: 20, fontFamily: 'Poppins_700Bold', lineHeight: 26 },
  headerSub:      { fontSize: 13, fontFamily: 'Poppins_500Medium', lineHeight: 18 },

  shell:          { flex: 1 },
  shellDesktop:   { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  headerSection:  { paddingTop: 24 },

  filterBlock:    { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 4, paddingBottom: 8, marginBottom: 16 },
  filterRow:      { flexDirection: 'row', alignItems: 'center', gap: 7 },
  clearBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  clearBtnText:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold', lineHeight: 17 },

  toggleWrap:     { flexDirection: 'row', padding: 5, borderRadius: 18, marginBottom: 20, gap: 4 },
  toggleBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, overflow: 'hidden' },
  toggleBtnActive:{},
  toggleText:     { fontSize: 13, fontFamily: 'Poppins_700Bold' },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  sectionLabel:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },

  list:           { paddingTop: 8, gap: 14 },
  listFooter:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 20, justifyContent: 'center' },
  listFooterText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, lineHeight: 20 },
  endLine:        { flex: 1, height: 1, opacity: 0.5 },

  emptyState:     { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40, gap: 14 },
  emptyIcon:      { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  emptyTitle:     { fontSize: 18, fontFamily: 'Poppins_700Bold', lineHeight: 24 },
  emptyDesc:      { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  resetBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 12 },
  resetBtnText:   { fontSize: 14, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 19 },
});

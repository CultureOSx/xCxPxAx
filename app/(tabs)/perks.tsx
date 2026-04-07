// app/(tabs)/perks.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { CultureTokens, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { PerkCard } from '@/components/perks/PerkCard';
import { usePerks } from '@/hooks/queries/usePerks';
import { AnimatedFilterChip } from '@/components/ui/AnimatedFilterChip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { MAIN_TAB_CARD_SHADOW, MAIN_TAB_CARD_SHADOW_STRONG, MAIN_TAB_UI } from '@/components/tabs/mainTabTokens';
import { CultureEngagementHero } from '@/components/tabs/CultureEngagementHero';
import { TabPrimaryHeader } from '@/components/tabs/TabPrimaryHeader';
import { api, type RewardsSummary } from '@/lib/api';
import type { PerkData, Ticket } from '@/shared/schema';

// ─── Constants ────────────────────────────────────────────────────────────────
// Tier thresholds — keep aligned with functions/src/routes/rewards.ts

const REWARDS_GOLD_AT = 500;
const REWARDS_DIAMOND_AT = 2500;
const TICKET_QUEST_GOAL = 5;
const PERK_REDEEM_QUEST_GOAL = 3;

type QuestCta = 'wallet' | 'tickets' | 'perks' | 'explore';

type ActiveQuest = {
  id: string;
  title: string;
  task: string;
  progress: number;
  total: number;
  reward: string;
  color: string;
  icon: string;
  image?: string;
  cta: QuestCta;
};

function tierJourneyQuestProgress(rewards: RewardsSummary): { progress: number; total: number } {
  const p = rewards.points;
  if (rewards.tier === 'diamond') return { progress: 1, total: 1 };
  if (rewards.tier === 'gold') {
    const total = REWARDS_DIAMOND_AT - REWARDS_GOLD_AT;
    const progress = Math.max(0, Math.min(total, p - REWARDS_GOLD_AT));
    return { progress, total };
  }
  const total = REWARDS_GOLD_AT;
  const progress = Math.max(0, Math.min(total, p));
  return { progress, total };
}

function buildActiveQuests(
  rewards: RewardsSummary,
  tickets: Ticket[],
  perks: PerkData[],
  city: string | undefined,
): ActiveQuest[] {
  const { progress: tierProgress, total: tierTotal } = tierJourneyQuestProgress(rewards);

  const ticketCount = tickets.filter((t) => t.status === 'confirmed' || t.status === 'used').length;
  const ticketProgress = Math.min(ticketCount, TICKET_QUEST_GOAL);

  const redeemed = rewards.perksRedeemed ?? 0;
  const perkProgress = Math.min(redeemed, PERK_REDEEM_QUEST_GOAL);

  const localPerks = city ? perks.filter((p) => !p.city || p.city === city) : perks;
  const perkCover = localPerks.find((p) => p.coverUrl)?.coverUrl;

  return [
    {
      id: 'rewards-tier',
      title: 'Rewards trail',
      task:
        rewards.nextTierLabel != null
          ? `${rewards.pointsToNextTier} pts to ${rewards.nextTierLabel}`
          : 'You are at the top rewards tier',
      progress: tierProgress,
      total: tierTotal,
      reward: rewards.nextTierLabel ? `${rewards.nextTierLabel} tier` : 'Max tier',
      color: CultureTokens.gold,
      icon: 'trending-up',
      cta: 'wallet',
    },
    {
      id: 'event-tickets',
      title: 'Culture calendar',
      task: `Collect ${TICKET_QUEST_GOAL} active tickets to events you love`,
      progress: ticketProgress,
      total: TICKET_QUEST_GOAL,
      reward: 'Ticket explorer',
      color: CultureTokens.teal,
      icon: 'ticket',
      cta: 'tickets',
    },
    {
      id: 'perk-redemptions',
      title: 'Perk pioneer',
      task: `Redeem ${PERK_REDEEM_QUEST_GOAL} member perks${city ? ` near ${city}` : ''}`,
      progress: perkProgress,
      total: PERK_REDEEM_QUEST_GOAL,
      reward: 'Local insider',
      color: CultureTokens.coral,
      icon: 'gift',
      image: perkCover,
      cta: 'perks',
    },
  ];
}

const PERK_CATEGORIES = [
  { id: 'All',      label: 'All Perks', icon: 'gift-outline'      },
  { id: 'tickets',  label: 'Tickets',   icon: 'ticket-outline'    },
  { id: 'dining',   label: 'Dining',    icon: 'restaurant-outline' },
  { id: 'shopping', label: 'Shopping',  icon: 'bag-outline'       },
  { id: 'arts',     label: 'Arts',      icon: 'brush-outline'     },
  { id: 'wellness', label: 'Wellness',  icon: 'leaf-outline'      },
];

const isWeb = Platform.OS === 'web';

// FilterChip imported from @/components/ui/AnimatedFilterChip

function FilterDivider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={{ width: 1, height: 18, backgroundColor: colors.borderLight, marginHorizontal: 4, alignSelf: 'center' }} />;
}

// ─── Perk Card Skeleton ───────────────────────────────────────────────────────

function PerkCardSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[pk.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[pk.image, { backgroundColor: colors.surfaceElevated }]} />
      <View style={pk.body}>
        <View style={[pk.line, { width: '65%', backgroundColor: colors.surfaceElevated }]} />
        <View style={[pk.line, { width: '45%', backgroundColor: colors.surfaceElevated, marginTop: 6 }]} />
        <View style={[pk.pill, { backgroundColor: colors.surfaceElevated, marginTop: 8 }]} />
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

function QuestCard({ quest, onContinue }: { quest: ActiveQuest; onContinue: () => void }) {
  const colors = useColors();
  const safeTotal = Math.max(1, quest.total);
  const progressPct = Math.min(100, (quest.progress / safeTotal) * 100);
  const isComplete = quest.total > 0 && quest.progress >= quest.total;

  return (
    <Animated.View
      entering={!isWeb ? FadeInDown.duration(400).springify() : undefined}
      style={[qs.questCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
    >
      <View style={qs.questImageStrip}>
        {quest.image ? (
          <Image source={{ uri: quest.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: quest.color + '33' }]} />
        )}
        <LinearGradient
          colors={['transparent', quest.color + 'CC']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={[qs.questIconOnImage, { backgroundColor: quest.color }]}>
          <Ionicons name={quest.icon as keyof typeof Ionicons.glyphMap} size={MAIN_TAB_UI.iconSize.md} color="#fff" />
        </View>
      </View>

      <View style={qs.questCardContent}>
        <View style={qs.questRewardBadge}>
          <Ionicons name="trophy" size={MAIN_TAB_UI.iconSize.xs} color={CultureTokens.gold} />
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

        {isComplete ? (
          <Animated.View
            entering={!isWeb ? SlideInDown.springify() : undefined}
            style={qs.completedRow}
          >
            <View style={[qs.completedBadge, { backgroundColor: colors.success + '18' }]}>
              <Ionicons name="checkmark-circle" size={MAIN_TAB_UI.iconSize.sm} color={colors.success} />
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
              <Ionicons name="share-social" size={MAIN_TAB_UI.iconSize.sm} color={CultureTokens.gold} />
              <Text style={qs.shareText}>Share</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              qs.checkInBtn,
              { backgroundColor: quest.color, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue this quest"
          >
            <Ionicons name="arrow-forward" size={MAIN_TAB_UI.iconSize.sm} color="#fff" />
            <Text style={qs.checkInText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const qs = StyleSheet.create({
  questCard: { 
    flexDirection: 'row', 
    borderRadius: 20, 
    borderWidth: 1, 
    overflow: 'hidden', 
    marginBottom: 14, 
    height: 160,
    ...MAIN_TAB_CARD_SHADOW,
  },
  questImageStrip: { width: 160, position: 'relative' },
  questIconOnImage: { position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  questCardContent: { flex: 1, padding: 14, justifyContent: 'space-between' },
  questRewardBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: CultureTokens.gold + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: CultureTokens.gold + '40', marginBottom: 4 },
  questRewardText: { color: CultureTokens.gold, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  questTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', lineHeight: 21 },
  questTask: { fontSize: 12, fontFamily: 'Poppins_500Medium', lineHeight: 17 },
  progressSection: { gap: 4 },
  progressTrack: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium' },
  checkInBtn: { height: 36, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  checkInText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff' },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, flex: 1 },
  completedText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.5, backgroundColor: CultureTokens.gold + '08' },
  shareText: { color: CultureTokens.gold, fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Explorer Badge ───────────────────────────────────────────────────────────

function ExplorerBadge({
  colors,
  signedIn,
  loading,
  rewards,
  rewardsError,
  onRetryRewards,
}: {
  colors: ReturnType<typeof useColors>;
  signedIn: boolean;
  loading: boolean;
  rewards: RewardsSummary | undefined;
  rewardsError: boolean;
  onRetryRewards: () => void;
}) {
  if (!signedIn) {
    return (
      <Animated.View
        entering={!isWeb ? FadeInDown.duration(350) : undefined}
        style={[eb.explorerCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }]}
      >
        <LinearGradient
          colors={[CultureTokens.indigo + '18', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[eb.levelCircle, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="person-circle-outline" size={28} color={CultureTokens.indigo} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[eb.explorerTitle, { color: colors.text }]}>Cultural Explorer</Text>
          <Text style={[eb.explorerSub, { color: colors.textSecondary }]}>
            Sign in to sync reward points and quests.
          </Text>
          <Pressable
            onPress={() => {
              if (!isWeb) Haptics.selectionAsync();
              router.push({ pathname: '/(onboarding)/login', params: { redirectTo: '/(tabs)/perks' } });
            }}
            style={({ pressed }) => [eb.signInBtn, { opacity: pressed ? 0.88 : 1, backgroundColor: CultureTokens.indigo }]}
            accessibilityRole="button"
            accessibilityLabel="Sign in to track rewards"
          >
            <Text style={eb.signInBtnText}>Sign in</Text>
            <Ionicons name="arrow-forward" size={MAIN_TAB_UI.iconSize.sm} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <View style={[eb.explorerCard, { backgroundColor: colors.surface, justifyContent: 'center', minHeight: 92 }]}>
        <ActivityIndicator color={CultureTokens.indigo} />
      </View>
    );
  }

  if (rewardsError || !rewards) {
    return (
      <View style={[eb.explorerCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }]}>
        <Text style={[eb.explorerTitle, { color: colors.text }]}>Cultural Explorer</Text>
        <Text style={[eb.explorerSub, { color: colors.textSecondary, marginBottom: 10 }]}>
          Rewards summary unavailable. Pull to refresh or try again.
        </Text>
        <Pressable
          onPress={onRetryRewards}
          style={({ pressed }) => [eb.signInBtn, { opacity: pressed ? 0.88 : 1, backgroundColor: CultureTokens.indigo, marginTop: 0 }]}
          accessibilityRole="button"
          accessibilityLabel="Retry loading rewards"
        >
          <Text style={eb.signInBtnText}>Retry</Text>
          <Ionicons name="refresh" size={MAIN_TAB_UI.iconSize.sm} color="#fff" />
        </Pressable>
      </View>
    );
  }

  const tierLevel = rewards.tier === 'silver' ? 1 : rewards.tier === 'gold' ? 2 : 3;
  const expProgress = Math.min(1, Math.max(0, (rewards.progressPercent ?? 0) / 100));
  const subtitle = rewards.nextTierLabel
    ? `${rewards.pointsToNextTier} pts to ${rewards.nextTierLabel}`
    : 'Top rewards tier unlocked';

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
        <Text style={eb.levelText}>{tierLevel}</Text>
        <Text style={eb.levelLabel}>LVL</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={[eb.explorerTitle, { color: colors.text }]}>Cultural Explorer · {rewards.tierLabel}</Text>
        <Text style={[eb.explorerSub, { color: colors.textSecondary }]}>{subtitle}</Text>
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
  explorerCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    padding: 18, 
    borderRadius: 24, 
    marginBottom: 24, 
    overflow: 'hidden',
    ...MAIN_TAB_CARD_SHADOW,
  },
  levelCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  levelText: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_800ExtraBold', lineHeight: 22 },
  levelLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1 },
  explorerTitle: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  explorerSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 10, opacity: 0.8 },
  expBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  expBarFill: { height: '100%', borderRadius: 3 },
  signInBtn: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  signInBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
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
  banner: { 
    borderRadius: 20, 
    padding: 18, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    gap: 12, 
    overflow: 'hidden',
    ...MAIN_TAB_CARD_SHADOW_STRONG,
  },
  headline: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#fff', marginBottom: 2 },
  sub: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.8)' },
  btn: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  btnText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: CultureTokens.indigo },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PerksTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hPad, isDesktop, isTablet } = useLayout();
  const { state } = useOnboarding();
  const queryClient = useQueryClient();
  const { userId, isAuthenticated } = useAuth();

  const topInset    = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 0 : insets.bottom;

  const [viewMode, setViewMode]           = useState<'quests' | 'perks'>('quests');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: perks = [], refetch, isRefetching, isLoading: perksLoading } = usePerks();

  const { data: rewards, isLoading: rewardsLoading, isError: rewardsError } = useQuery({
    queryKey: ['rewards', userId],
    queryFn: () => api.rewards.get(userId!),
    enabled: !!userId,
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets', userId],
    queryFn: () => api.tickets.forUser(userId!),
    enabled: !!userId,
  });

  const activeQuests = useMemo(() => {
    if (!userId || !rewards) return [];
    return buildActiveQuests(rewards, tickets, perks, state.city || undefined);
  }, [userId, rewards, tickets, perks, state.city]);

  const questsLoading = !!userId && (rewardsLoading || ticketsLoading);

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

  const handleQuestContinue = useCallback((quest: ActiveQuest) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (quest.cta) {
      case 'wallet':
        router.push('/payment/wallet');
        break;
      case 'tickets':
        router.push('/tickets');
        break;
      case 'perks':
        setViewMode('perks');
        break;
      case 'explore':
        router.push('/(tabs)/explore');
        break;
      default:
        break;
    }
  }, []);

  const renderQuestItem = useCallback(({ item, index }: { item: ActiveQuest; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 60, 400)).springify().damping(18)}
    >
      <QuestCard quest={item} onContinue={() => handleQuestContinue(item)} />
    </Animated.View>
  ), [handleQuestContinue]);

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
      <CultureEngagementHero
        title="Rewards that make culture exploration addictive."
        subtitle="Collect points, unlock tiers, and redeem real-world experiences near you."
        stat={`${filteredPerks.length} perks ready to redeem`}
        badge="Culture Explorer"
        ctaLabel="Open Wallet & Rewards"
        ctaRoute="/payment/wallet"
        icon="trophy"
      />

      <ExplorerBadge
        colors={colors}
        signedIn={isAuthenticated && !!userId}
        loading={!!userId && rewardsLoading}
        rewards={rewards}
        rewardsError={!!userId && rewardsError && !rewardsLoading}
        onRetryRewards={() => {
          if (userId) void queryClient.invalidateQueries({ queryKey: ['rewards', userId] });
        }}
      />

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
              size={MAIN_TAB_UI.iconSize.sm}
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
        <LiquidGlassPanel
          borderRadius={MAIN_TAB_UI.cardRadius}
          style={{ marginBottom: 16 }}
          contentStyle={{ paddingTop: 4, paddingBottom: 8 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.filterRow]}
            accessibilityRole="tablist"
            accessibilityLabel="Perk category filters"
          >
            {PERK_CATEGORIES.map(cat => (
              <AnimatedFilterChip
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
                  <Ionicons name="close" size={MAIN_TAB_UI.iconSize.sm} color={colors.textTertiary} />
                  <Text style={[s.clearBtnText, { color: colors.textTertiary }]}>Clear</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </LiquidGlassPanel>
      )}

      {viewMode === 'perks' && <MembershipUpgradeBanner />}

      <View style={s.sectionHeaderRow}>
        <Ionicons
          name={viewMode === 'quests' ? 'map-outline' : 'gift-outline'}
          size={MAIN_TAB_UI.iconSize.sm}
          color={colors.textTertiary}
        />
        <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
          {viewMode === 'quests'
            ? (!userId ? 'Sign in for quests' : `${activeQuests.length} active quests`)
            : `Member Perks · ${filteredPerks.length} available`}
        </Text>
      </View>
    </View>
  ), [colors, hPad, viewMode, selectedCategory, filteredPerks.length, filtersActive, clearFilters, userId, activeQuests.length, isAuthenticated, rewards, rewardsLoading, rewardsError, queryClient]);

  return (
    <ErrorBoundary>
      <View style={[s.screen, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.ambientMesh}
          pointerEvents="none"
        />

        {/* ── Header (liquid glass) ── */}
        <Animated.View entering={FadeInUp.duration(320).springify()}>
          <TabPrimaryHeader
            title="Perks & Rewards"
            subtitle="Unlock discounts, loyalty rewards, and premium experiences."
            locationLabel={
              `${locationLabel}${!perksLoading && viewMode === 'perks' && filteredPerks.length > 0 ? ` · ${filteredPerks.length} perks` : ''}`
            }
            hPad={hPad}
            rightActions={
              <Pressable
                onPress={() => {
                  void refetch();
                  if (userId) {
                    void queryClient.invalidateQueries({ queryKey: ['rewards', userId] });
                    void queryClient.invalidateQueries({ queryKey: ['/api/tickets', userId] });
                  }
                }}
                style={[s.iconBtn, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}
                accessibilityRole="button"
                accessibilityLabel="Refresh perks"
              >
                {isRefetching
                  ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
                  : <Ionicons name="refresh" size={18} color={colors.text} />}
              </Pressable>
            }
          >
          </TabPrimaryHeader>
        </Animated.View>

        {/* ── Content shell ── */}
        <View style={[s.shell, isDesktop && s.shellDesktop]}>
          {viewMode === 'quests' ? (
            <FlatList
              data={activeQuests}
              keyExtractor={(item) => item.id}
              renderItem={renderQuestItem}
              ListHeaderComponent={renderHeader}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[s.list, { paddingHorizontal: hPad, paddingBottom: bottomInset + 120 }]}
              ListEmptyComponent={
                !userId ? (
                  <View style={[s.emptyState, { paddingVertical: 48 }]}>
                    <Text style={[s.emptyDesc, { color: colors.textSecondary, textAlign: 'center' }]}>
                      Create an account to track reward points, tickets, and perk redemptions.
                    </Text>
                  </View>
                ) : questsLoading ? (
                  <ActivityIndicator style={{ marginTop: 32 }} color={CultureTokens.indigo} />
                ) : rewardsError ? (
                  <View style={[s.emptyState, { paddingVertical: 48 }]}>
                    <Text style={[s.emptyDesc, { color: colors.textSecondary, textAlign: 'center' }]}>
                      Could not load your quests. Check your connection and pull to refresh.
                    </Text>
                  </View>
                ) : null
              }
              ListFooterComponent={() => (
                <View style={s.listFooter}>
                  <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                  <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
                    {!userId ? 'Sign in to sync progress' : `${activeQuests.length} active quests`}
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
                      <Ionicons name="refresh-outline" size={MAIN_TAB_UI.iconSize.sm} color={CultureTokens.indigo} />
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
  ambientMesh:    { ...StyleSheet.absoluteFillObject, opacity: 0.06 },

  iconBtn:        { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth * 2 },

  shell:          { flex: 1 },
  shellDesktop:   { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  headerSection:  { paddingTop: MAIN_TAB_UI.sectionGapLarge },

  filterRow:      { flexDirection: 'row', alignItems: 'center', gap: 7 },
  clearBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  clearBtnText:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold', lineHeight: 17 },

  toggleWrap:     { flexDirection: 'row', padding: 5, borderRadius: 18, marginBottom: 20, gap: 4 },
  toggleBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, overflow: 'hidden' },
  toggleBtnActive:{},
  toggleText:     { fontSize: 13, fontFamily: 'Poppins_700Bold' },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  sectionLabel:   { fontSize: 12, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },

  list:           { paddingTop: MAIN_TAB_UI.sectionGapSmall, gap: MAIN_TAB_UI.sectionGapSmall },
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

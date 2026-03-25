// app/(tabs)/perks.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  FadeInRight,
  SlideInRight,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { CultureTokens, shadows } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { FilterChipRow } from '@/components/FilterChip';
import { PerkCard } from '@/components/perks/PerkCard';
import { usePerks } from '@/hooks/queries/usePerks';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AnimatedFlashList = Platform.OS === 'web' 
  ? Animated.FlatList 
  : Animated.createAnimatedComponent(FlashList) as any;

// ─── Constants ────────────────────────────────────────────────────────────────

const CULTURAL_QUESTS = [
  { id: 'q1', title: 'Spice Routes', task: 'Visit 3 Indian Restaurants', progress: 1, total: 3, reward: 'Masala Explorer', color: '#FF9933', icon: 'restaurant', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400' },
  { id: 'q2', title: 'Hallyu Wave', task: 'Attend 2 Korean Art Events', progress: 1, total: 2, reward: 'K-Star Token', color: '#CD2E3A', icon: 'sparkles', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400' },
  { id: 'q3', title: 'Indigenous Echoes', task: 'Visit 1 Native Art Center', progress: 0, total: 1, reward: 'Ancient Roots Seed', color: CultureTokens.gold, icon: 'leaf', image: 'https://images.unsplash.com/photo-1543157145-f78c636d023d?q=80&w=400' },
];

const CATEGORIES = [
  { id: 'All',        label: 'All Perks',    icon: 'gift'       },
  { id: 'tickets',    label: 'Tickets',      icon: 'ticket'     },
  { id: 'dining',     label: 'Dining',       icon: 'restaurant' },
  { id: 'shopping',   label: 'Shopping',     icon: 'bag'        },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function QuestCard({ quest, colors }: { quest: any, colors: any }) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleCheckIn = () => {
    setCheckingIn(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setCheckingIn(false);
      setCompleted(true);
    }, 1500);
  };

  const progressPct = (quest.progress / quest.total) * 100;

  return (
    <Animated.View entering={FadeInRight.springify()} style={[s.questCard, { backgroundColor: colors.surface }]}>
      <Image source={{ uri: quest.image }} style={s.questImage} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
      
      <View style={s.questContent}>
        <View style={s.questHeader}>
          <View style={[s.questIconWrap, { backgroundColor: quest.color }]}>
            <Ionicons name={quest.icon} size={20} color="#fff" />
          </View>
          <View>
            <Text style={s.questTitle}>{quest.title}</Text>
            <Text style={s.questTask}>{quest.task}</Text>
          </View>
        </View>

        <View style={s.progressSection}>
          <View style={s.progressInfo}>
            <Text style={s.progressText}>{quest.progress}/{quest.total} Reached</Text>
            <Text style={s.rewardText}>REWARD: {quest.reward}</Text>
          </View>
          <View style={[s.progressBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <View style={[s.progressFill, { width: `${progressPct}%`, backgroundColor: quest.color }]} />
          </View>
        </View>

        <TouchableOpacity 
          disabled={completed || checkingIn}
          onPress={handleCheckIn}
          style={[s.checkInBtn, { backgroundColor: completed ? CultureTokens.teal : '#fff' }]}
        >
          {checkingIn ? (
            <Text style={[s.checkInText, { color: quest.color }]}>VERIFYING...</Text>
          ) : completed ? (
            <View style={s.completedRow}><Ionicons name="checkmark-circle" size={16} color="#fff" /><Text style={[s.checkInText, { color: '#fff' }]}>QUEST COMPLETE</Text></View>
          ) : (
            <Text style={[s.checkInText, { color: '#000' }]}>CHECK-IN AT VENUE</Text>
          )}
        </TouchableOpacity>

        {completed && (
          <Animated.View entering={SlideInRight.springify()} style={s.shareBox}>
            <TouchableOpacity 
              style={[s.shareBtn, { borderColor: CultureTokens.gold }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)/feed');
              }}
            >
              <Ionicons name="share-social" size={16} color={CultureTokens.gold} />
              <Text style={s.shareText}>POST TO COMMUNITY FEED</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PerksTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<'perks' | 'quests'>('quests');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const { data: perksPages, refetch, isRefetching } = usePerks();
  const perks = useMemo(() => perksPages?.pages.flatMap((p) => p.perks) ?? [], [perksPages]);

  const filteredItems = useMemo(() => {
    if (viewMode === 'quests') return CULTURAL_QUESTS;
    if (selectedCategory === 'All') return perks;
    return perks.filter(p => p.category === selectedCategory);
  }, [viewMode, perks, selectedCategory]);

  const renderHeader = () => (
    <View>
      <View style={s.header}>
        <Text style={[s.headerTitle, { color: colors.text }]}>{viewMode === 'quests' ? 'Active Quests' : 'Exclusive Perks'}</Text>
        <View style={[s.toggleContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => setViewMode('quests')} style={[s.toggleBtn, viewMode === 'quests' && { backgroundColor: CultureTokens.indigo }]}><Text style={[s.toggleText, { color: viewMode === 'quests' ? '#fff' : colors.textSecondary }]}>Quests</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('perks')} style={[s.toggleBtn, viewMode === 'perks' && { backgroundColor: CultureTokens.indigo }]}><Text style={[s.toggleText, { color: viewMode === 'perks' ? '#fff' : colors.textSecondary }]}>Perks</Text></TouchableOpacity>
        </View>
      </View>

      {viewMode === 'perks' && (
        <View style={s.chipsRow}>
          <FilterChipRow items={CATEGORIES} selectedId={selectedCategory} onSelect={setSelectedCategory} />
        </View>
      )}

      {viewMode === 'quests' && (
        <View style={s.explorerBadge}>
          <LinearGradient colors={[CultureTokens.gold, '#F4A100']} style={s.levelCircle}><Text style={s.levelText}>Lvl 4</Text></LinearGradient>
          <View><Text style={[s.expTitle, { color: colors.text }]}>Cultural Explorer</Text><Text style={[s.expSub, { color: colors.textSecondary }]}>500 EXP to next Explorer Token</Text></View>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ErrorBoundary>
        <AnimatedFlashList
          data={filteredItems}
          numColumns={1}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item, index }: { item: any, index: number }) => (
            viewMode === 'quests' ? (
              <QuestCard quest={item} colors={colors} />
            ) : (
              <View style={s.perkWrapper}><PerkCard perk={item} /></View>
            )
          )}
          ListHeaderComponent={renderHeader}
          onScroll={scrollHandler}
          estimatedItemSize={250}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 120, paddingTop: insets.top + 10 } as any]}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      </ErrorBoundary>
    </View>
  );
}

const s = StyleSheet.create({
  list: { paddingHorizontal: 20 },
  header: { marginBottom: 24, gap: 16 },
  headerTitle: { fontSize: 32, fontFamily: 'Poppins_700Bold' },
  toggleContainer: { flexDirection: 'row', padding: 4, borderRadius: 16, alignSelf: 'flex-start' },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  toggleText: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  explorerBadge: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, backgroundColor: 'rgba(0,0,0,0.02)', padding: 16, borderRadius: 24 },
  levelCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  levelText: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_800ExtraBold' },
  expTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  expSub: { fontSize: 13, fontFamily: 'Poppins_500Medium', opacity: 0.7 },
  questCard: { height: 280, borderRadius: 32, overflow: 'hidden', marginBottom: 20, ...shadows.medium },
  questImage: { width: '100%', height: '100%' },
  questContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 28 },
  questHeader: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 24 },
  questIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  questTitle: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: '#fff' },
  questTask: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.8)' },
  progressSection: { marginBottom: 20 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_700Bold' },
  rewardText: { color: CultureTokens.gold, fontSize: 10, fontFamily: 'Poppins_800ExtraBold' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%' },
  checkInBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  checkInText: { fontSize: 14, fontFamily: 'Poppins_800ExtraBold', letterSpacing: 0.5 },
  completedRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  shareBox: { marginTop: 12 },
  shareBtn: { height: 44, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,215,0,0.05)' },
  shareText: { color: CultureTokens.gold, fontSize: 12, fontFamily: 'Poppins_800ExtraBold' },
  perkWrapper: { paddingVertical: 8 },
  chipsRow: { marginBottom: 16 },
});

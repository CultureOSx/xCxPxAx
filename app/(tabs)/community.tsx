// app/(tabs)/community.tsx
import React, { useState, useMemo } from 'react';
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
import { FlashList } from '@shopify/flash-list';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
  FadeInDown,
  SlideInDown,
  FadeInLeft,
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
import { Card } from '@/components/ui/Card';
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
import { NATIONALITIES, DIASPORA_GROUPS } from '@/constants/cultures';
import type { Community } from '@/shared/schema';

// ─── Constants & Types ────────────────────────────────────────────────────────

const AnimatedFlashList = Platform.OS === 'web' 
  ? Animated.FlatList 
  : Animated.createAnimatedComponent(FlashList) as any;

const CATEGORIES = [
  { id: 'All',        label: 'All',           icon: 'grid' },
  { id: 'association',label: 'Associations',  icon: 'business' },
  { id: 'student',    label: 'Student Groups',icon: 'school' },
  { id: 'professional',label: 'Professional', icon: 'briefcase' },
  { id: 'festival',   label: 'Festivals',     icon: 'party-popper' },
  { id: 'diaspora',   label: 'Diaspora',      icon: 'globe' },
];

const LEADERBOARD_DATA = [
  { id: 'india', name: 'Indian Diaspora', count: '124k', growth: '+12%', color: '#FF9933', emoji: '🇮🇳', rank: 1 },
  { id: 'korea', name: 'Korean Wave', count: '98k', growth: '+24%', color: '#CD2E3A', emoji: '🇰🇷', rank: 2 },
  { id: 'greece', name: 'Hellenic Hub', count: '85k', growth: '+8%', color: '#005BAE', emoji: '🇬🇷', rank: 3 },
];

const CULTURE_COLORS: Record<string, string> = {
  indian: '#FF9933', korean: '#CD2E3A', chinese: '#EE1C25',
  nigerian: '#008751', mexican: '#006341', brazilian: '#009739',
  japanese: '#BC002D', greek: '#005BAE', italian: '#008C45',
};

// ─── Global Cultural Identity Graph (Diaspora Map) ────────────────────────────

function CulturalIdentityGraph({ colors }: { colors: any }) {
  return (
    <View style={graphStyles.container}>
      <Text style={[graphStyles.title, { color: colors.text }]}>Global Cultural Hub</Text>
      <Text style={[graphStyles.subtitle, { color: colors.textSecondary }]}>Mapping connections between diaspora communities</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={graphStyles.scroll}>
        {Object.values(DIASPORA_GROUPS).map((group, idx) => (
          <Animated.View 
            key={group.id} 
            entering={FadeInLeft.delay(idx * 100).springify()}
            style={graphStyles.nodeColumn}
          >
            <TouchableOpacity activeOpacity={0.8} style={[graphStyles.hubNode, { backgroundColor: colors.surface }]}>
              <LinearGradient 
                colors={[CultureTokens.indigo, CultureTokens.saffron]} 
                style={graphStyles.nodeIconWrap}
              >
                <Text style={graphStyles.nodeEmoji}>{group.emoji}</Text>
              </LinearGradient>
              <Text style={[graphStyles.nodeLabel, { color: colors.text }]}>{group.label}</Text>
              <View style={graphStyles.connectionDots}>
                <View style={[graphStyles.dot, { backgroundColor: CultureTokens.indigo }]} />
                <View style={[graphStyles.dot, { backgroundColor: CultureTokens.saffron }]} />
                <View style={[graphStyles.dot, { backgroundColor: CultureTokens.teal }]} />
              </View>
            </TouchableOpacity>

            <View style={graphStyles.leafContainer}>
              {group.nationalityIds.slice(0, 3).map((natId) => {
                const nat = NATIONALITIES[natId];
                if (!nat) return null;
                return (
                  <View key={natId} style={[graphStyles.leafNode, { backgroundColor: colors.surface }]}>
                    <Text style={graphStyles.leafEmoji}>{nat.emoji}</Text>
                    <Text style={[graphStyles.leafLabel, { color: colors.textSecondary }]}>{nat.label}</Text>
                  </View>
                );
              })}
              {group.nationalityIds.length > 3 && (
                <View style={[graphStyles.leafNode, { backgroundColor: colors.surface }]}>
                  <Text style={[graphStyles.leafLabel, { color: colors.textTertiary }]}>+{group.nationalityIds.length - 3} more</Text>
                </View>
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const graphStyles = StyleSheet.create({
  container: { marginTop: 32, paddingBottom: 16 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', paddingHorizontal: 24 },
  subtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', paddingHorizontal: 24, marginTop: 4, opacity: 0.8 },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  nodeColumn: { alignItems: 'center', gap: 12 },
  hubNode: { width: 140, padding: 16, borderRadius: 28, alignItems: 'center', ...shadows.medium },
  nodeIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  nodeEmoji: { fontSize: 24 },
  nodeLabel: { fontSize: 13, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  connectionDots: { flexDirection: 'row', gap: 4, marginTop: 8 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  leafContainer: { gap: 6, width: 140 },
  leafNode: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 12, ...shadows.small },
  leafEmoji: { fontSize: 14 },
  leafLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
});

function HeritageLeaderboard({ colors }: { colors: any }) {
  return (
    <View style={leaderStyles.container}>
      <View style={leaderStyles.header}>
        <Text style={[leaderStyles.title, { color: colors.text }]}>Heritage Leaderboard</Text>
        <Ionicons name="stats-chart" size={18} color={CultureTokens.indigo} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={leaderStyles.scroll}>
        {LEADERBOARD_DATA.map((item, idx) => (
          <Animated.View 
            key={item.id} 
            entering={FadeInDown.delay(idx * 200).springify()}
            style={[leaderStyles.card, { backgroundColor: colors.surface }]}
          >
            <View style={[leaderStyles.rankBadge, { backgroundColor: item.color }]}>
              <Text style={leaderStyles.rankText}>{item.rank}</Text>
            </View>
            <Text style={leaderStyles.emoji}>{item.emoji}</Text>
            <View style={leaderStyles.info}>
              <Text style={[leaderStyles.name, { color: colors.text }]}>{item.name}</Text>
              <View style={leaderStyles.statRow}>
                <Text style={[leaderStyles.count, { color: colors.textSecondary }]}>{item.count} active</Text>
                <Text style={leaderStyles.growth}>{item.growth}</Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const leaderStyles = StyleSheet.create({
  container: { marginTop: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, marginBottom: 16 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold' },
  scroll: { paddingHorizontal: 20, gap: 16, paddingBottom: 8 },
  card: { width: 200, padding: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadows.medium },
  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_800ExtraBold' },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 13, fontFamily: 'Poppins_700Bold' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  count: { fontSize: 10, fontFamily: 'Poppins_500Medium' },
  growth: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: CultureTokens.teal },
});

// ─── Community Preview Drawer ─────────────────────────────────────────────────

function CommunityPreviewDrawer({ 
  profile, 
  onClose, 
  colors 
}: { 
  profile: Community | null; 
  onClose: () => void; 
  colors: any 
}) {
  const insets = useSafeAreaInsets();
  if (!profile) return null;

  const accentColor = getCommunityAccent(profile, CULTURE_COLORS[profile.nationalityId || ''] || CultureTokens.indigo);
  const memberCount = getCommunityMemberCount(profile);
  const eventsCount = getCommunityEventsCount(profile);
  const activity = getCommunityActivityMeta(profile);
  const signals = getCommunitySignals(profile);
  const headline = getCommunityHeadline(profile);

  return (
    <Modal visible={!!profile} transparent animationType="none" onRequestClose={onClose}>
      <View style={drawerStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <Animated.View 
          entering={SlideInDown.springify().damping(22)}
          style={[drawerStyles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
        >
          <View style={drawerStyles.handle} />
          
          <View style={drawerStyles.coverWrap}>
            <Image
              source={{ uri: profile.imageUrl || 'https://images.unsplash.com/photo-1543157145-f78c636d023d?q=80&w=800' }}
              style={drawerStyles.cover}
              contentFit="cover"
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
            <TouchableOpacity style={drawerStyles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={drawerStyles.content}>
              <View style={drawerStyles.header}>
                <View style={drawerStyles.titleRow}>
                  <Text style={[drawerStyles.name, { color: colors.text }]}>{profile.name}</Text>
                  {profile.isVerified && <Ionicons name="checkmark-circle" size={20} color={CultureTokens.indigo} />}
                </View>
              <Text style={[drawerStyles.sub, { color: colors.textSecondary }]}>
                {getCommunityLabel(profile)} • {[profile.city, profile.country].filter(Boolean).join(', ') || 'Australia'}
              </Text>
            </View>

            <View style={drawerStyles.statsRow}>
              <View style={[drawerStyles.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[drawerStyles.statVal, { color: colors.text }]}>{memberCount}</Text>
                <Text style={[drawerStyles.statLab, { color: colors.textTertiary }]}>Members</Text>
              </View>
              <View style={[drawerStyles.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[drawerStyles.statVal, { color: colors.text }]}>{eventsCount}</Text>
                <Text style={[drawerStyles.statLab, { color: colors.textTertiary }]}>Events</Text>
              </View>
              <View style={[drawerStyles.statBox, { backgroundColor: colors.surface }]}>
                <Text style={[drawerStyles.statVal, { color: activity.color }]}>{activity.label}</Text>
                <Text style={[drawerStyles.statLab, { color: colors.textTertiary }]}>Momentum</Text>
              </View>
            </View>

            {signals.length > 1 ? (
              <View style={drawerStyles.signalRow}>
                {signals.slice(1).map((signal) => (
                  <View key={signal} style={[drawerStyles.signalChip, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[drawerStyles.signalChipText, { color: colors.textSecondary }]}>{signal}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={[drawerStyles.desc, { color: colors.textSecondary }]} numberOfLines={3}>
              {headline}
            </Text>

            <View style={drawerStyles.actions}>
              <Button 
                style={[drawerStyles.joinBtn, { backgroundColor: accentColor }]}
                onPress={() => {
                  onClose();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Text style={drawerStyles.btnText}>Join Community</Text>
              </Button>
              <TouchableOpacity 
                style={[drawerStyles.profileBtn, { borderColor: colors.borderLight }]}
                onPress={() => {
                  onClose();
                  router.push({ pathname: '/community/[id]', params: { id: profile.id } });
                }}
              >
                <Text style={[drawerStyles.profileBtnText, { color: colors.text }]}>View Full Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const drawerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', ...shadows.large },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  coverWrap: { height: 180, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24 },
  header: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 24, fontFamily: 'Poppins_700Bold' },
  sub: { fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center' },
  statVal: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  statLab: { fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  signalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  signalChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  signalChipText: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  desc: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22, marginBottom: 24 },
  actions: { gap: 12 },
  joinBtn: { height: 56, borderRadius: 16, justifyContent: 'center' },
  btnText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  profileBtn: { height: 56, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  profileBtnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
});

// ─── Sub-Components ───────────────────────────────────────────────────────────

function CommunityGridCard({ item, colors, onPreview }: { item: Community, colors: any, onPreview: (p: Community) => void }) {
  const accentColor = getCommunityAccent(item, CULTURE_COLORS[item.nationalityId || ''] || CultureTokens.indigo);
  const headline = getCommunityHeadline(item);
  const signals = getCommunitySignals(item);
  const members = getCommunityMemberCount(item);
  const activity = getCommunityActivityMeta(item);
  
  return (
    <Animated.View entering={FadeInDown.springify().damping(20)} style={styles.cardWrapper}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => onPreview(item)}>
        <Card padding={0} style={styles.communityCard}>
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
                  {getCommunityLabel(item)} • {item.city || 'Worldwide'}
                </Text>
              </View>
            </View>
            <Text numberOfLines={2} style={[styles.cardHeadline, { color: colors.textSecondary }]}>
              {headline}
            </Text>
            {signals.length > 1 ? (
              <View style={styles.cardSignalRow}>
                {signals.slice(1, 3).map((signal) => (
                  <View key={signal} style={[styles.cardSignalChip, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.cardSignalText, { color: colors.textSecondary }]}>{signal}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={14} color={colors.textTertiary} />
                <Text style={[styles.statText, { color: colors.textTertiary }]}>{members} members</Text>
              </View>
              {(item as any).isTrending ? (
                <View style={[styles.activityPulse, { backgroundColor: accentColor + '15' }]}>
                  <Text style={[styles.activityText, { color: accentColor }]}>🔥 Trending</Text>
                </View>
              ) : (
                <View style={[styles.activityPulse, { backgroundColor: activity.color + '15' }]}>
                  <Text style={[styles.activityText, { color: activity.color }]}>{activity.label}</Text>
                </View>
              )}
            </View>
            <Button
              onPress={() => onPreview(item)}
              variant="outline"
              size="sm"
              style={styles.joinBtn}
            >
              <Text style={{ color: colors.text, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>Quick Preview</Text>
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
  const { isDesktop, isTablet } = useLayout();
  const { state: onboardingState } = useOnboarding();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPreview, setSelectedPreview] = useState<Community | null>(null);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 200], [1, 0.4], 'clamp'),
    transform: [{ scale: interpolate(scrollY.value, [-100, 0, 300], [1.1, 1, 0.9], 'clamp') }],
  }));

  const { data: communitiesRaw = [] } = useQuery<Community[]>({
    queryKey: ['/api/communities', onboardingState?.city, onboardingState?.country, onboardingState?.nationalityId],
    queryFn: () => api.communities.list({
      city: onboardingState?.city,
      country: onboardingState?.country,
      nationalityId: onboardingState?.nationalityId,
    }),
  });

  const communities = useMemo(() => {
    return communitiesRaw.map((community, index) => ({
      ...community,
      isTrending: index % 4 === 0,
    }));
  }, [communitiesRaw]);

  const filteredCommunities = useMemo(() => {
    let list = communities;
    if (selectedCategory !== 'All') {
      const normalized = selectedCategory.toLowerCase();
      list = list.filter((community) => {
        const category = community.communityCategory?.toLowerCase();
        const type = community.communityType?.toLowerCase();
        const legacy = community.category?.toLowerCase();
        return category === normalized || type === normalized || legacy === normalized;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((community) => {
        const haystack = [
          community.name,
          community.description,
          community.headline,
          community.countryOfOrigin,
          community.primaryLanguageLabel,
          ...(community.cultures ?? []),
          ...(community.cultureIds ?? []),
          ...(community.languageIds ?? []),
          ...(community.chapterCities ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return list;
  }, [communities, search, selectedCategory]);

  const renderHeader = () => (
    <View>
      <View style={styles.heroWrapper}>
        <Animated.View style={[styles.heroContainer, heroStyle]}>
          <Image
            source={{ uri: 'https://whakaatamaori-teaomaori-prod.web.arc-cdn.net/resizer/v2/BSRIUIXOCVHZLJ43F4L7ZWKL6E.jpg?auth=ebf374034e59e81f6dc4b2be20b5261ea16f35e31dc75ac61a59010efc7144d7&width=768' }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']} style={styles.heroOverlay}>
            <View style={styles.heroStats}>
              <View style={styles.statPill}><Text style={styles.statValue}>12.5k</Text><Text style={styles.statLabel}>Communities</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statPill}><Text style={styles.statValue}>2.4M</Text><Text style={styles.statLabel}>Members</Text></View>
            </View>
            <Text style={styles.heroTitle}>Discover Communities Around Your Culture</Text>
            <Text style={styles.heroSubtitle}>Join diaspora networks and local groups celebrating traditions worldwide.</Text>
            <View style={styles.heroActions}>
              <Button size="lg" style={styles.heroPrimaryBtn}><Text style={styles.btnTextHeader}>Create Community</Text></Button>
              <TouchableOpacity style={styles.heroSecondaryBtn}><Text style={styles.secondaryBtnText}>Explore by Culture</Text></TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={{ backgroundColor: colors.background }}>
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, ...shadows.medium }]}>
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

        {/* CULTURAL IDENTITY GRAPH */}
        <CulturalIdentityGraph colors={colors} />

        {/* GLOBAL HERITAGE LEADERBOARD */}
        <HeritageLeaderboard colors={colors} />

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

        <View style={styles.chipsSection}>
          <FilterChipRow items={CATEGORIES as any} selectedId={selectedCategory} onSelect={setSelectedCategory} />
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>{filteredCommunities.length} Communities Found</Text>
          <TouchableOpacity style={styles.sortBtn}><Text style={[styles.sortText, { color: colors.textSecondary }]}>Most Active</Text><Ionicons name="chevron-down" size={14} color={colors.textSecondary} /></TouchableOpacity>
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
              onPreview={(p) => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedPreview(p);
              }}
            />
          )}
          ListHeaderComponent={renderHeader}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          estimatedItemSize={180}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        />
        
        <CommunityPreviewDrawer
          profile={selectedPreview}
          onClose={() => setSelectedPreview(null)}
          colors={colors}
        />
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrapper: { height: 440, overflow: 'hidden' },
  heroContainer: { height: 440 },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', padding: 32, justifyContent: 'flex-end' },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 },
  statPill: { alignItems: 'center' },
  statValue: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#fff' },
  statLabel: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: '#fff', opacity: 0.8 },
  statDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 },
  heroTitle: { fontSize: 36, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 42, letterSpacing: -1 },
  heroSubtitle: { fontSize: 16, fontFamily: 'Poppins_400Regular', color: '#fff', marginTop: 12, opacity: 0.9, lineHeight: 22 },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  heroPrimaryBtn: { backgroundColor: CultureTokens.indigo, borderRadius: 16, paddingHorizontal: 24 },
  btnTextHeader: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  heroSecondaryBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, justifyContent: 'center' },
  secondaryBtnText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  searchSection: { marginTop: -32, paddingHorizontal: 20, zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, ...shadows.large },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontFamily: 'Poppins_400Regular' },
  railSection: { marginTop: 32 },
  railTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', paddingHorizontal: 24, marginBottom: 16 },
  railScroll: { paddingHorizontal: 20, gap: 12 },
  cultureCard: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingRight: 24, borderRadius: 18, gap: 14, ...shadows.small },
  cultureEmoji: { fontSize: 28 },
  cultureName: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  cultureCount: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  chipsSection: { marginTop: 24, paddingHorizontal: 4 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 24, marginBottom: 12 },
  resultsCount: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  cardWrapper: { padding: 12, paddingHorizontal: 20 },
  communityCard: { borderRadius: 24, flexDirection: 'row', overflow: 'hidden', ...shadows.medium },
  cardAccent: { width: 6 },
  cardContent: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarWrap: { width: 48, height: 48, position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 16 },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: CultureTokens.indigo, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold' },
  cardSub: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  cardHeadline: { fontSize: 13, fontFamily: 'Poppins_500Medium', lineHeight: 18, marginTop: 12 },
  cardSignalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  cardSignalChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  cardSignalText: { fontSize: 11, fontFamily: 'Poppins_500Medium' },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  activityPulse: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activityText: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  joinBtn: { marginTop: 16, borderRadius: 12, borderColor: 'rgba(0,0,0,0.08)' },
});

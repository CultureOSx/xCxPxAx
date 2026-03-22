import {
  View, Text, Pressable, StyleSheet, Platform,
  RefreshControl, ScrollView, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaved } from '@/contexts/SavedContext';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import type { Profile } from '@shared/schema';
import { FilterChipRow } from '@/components/FilterChip';
import { CommunityListSkeleton } from '@/components/CommunityListSkeleton';
import { EntityTypeColors, CultureTokens, gradients } from '@/constants/theme';
import { TextStyles } from '@/constants/typography';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { NATIONALITIES } from '@/constants/cultures';

const isWeb = Platform.OS === 'web';

const TYPE_META: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  community:    { color: EntityTypeColors.community, icon: 'people' },
  organisation: { color: EntityTypeColors.organisation, icon: 'business' },
  venue:        { color: EntityTypeColors.venue, icon: 'location' },
  council:      { color: EntityTypeColors.council, icon: 'shield-checkmark' },
  government:   { color: EntityTypeColors.government, icon: 'flag' },
  artist:       { color: EntityTypeColors.artist, icon: 'musical-notes' },
  business:     { color: EntityTypeColors.business, icon: 'storefront' },
  charity:      { color: EntityTypeColors.charity, icon: 'heart' },
};

const CATEGORIES = [
  { id: 'all',          label: 'All',           icon: 'grid' },
  { id: 'community',    label: 'Communities',   icon: 'people' },
  { id: 'organisation', label: 'Organisations', icon: 'business' },
  { id: 'venue',        label: 'Venues',        icon: 'location' },
  { id: 'council',      label: 'Councils',      icon: 'shield-checkmark' },
  { id: 'artist',       label: 'Artists',       icon: 'musical-notes' },
  { id: 'business',     label: 'Businesses',    icon: 'storefront' },
  { id: 'charity',      label: 'Charities',     icon: 'heart' },
];

type CommunitySort = 'alphabetical' | 'members';

function fmt(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
}

function FeaturedCard({ profile, colors, styles }: { profile: Profile; colors: ReturnType<typeof useColors>; styles: any }) {
  const { isCommunityJoined, toggleJoinCommunity } = useSaved();
  const joined = isCommunityJoined(profile.id);
  const meta = TYPE_META[profile.entityType] ?? { color: CultureTokens.indigo, icon: 'people' as const };

  return (
    <Card
      onPress={() => {
        if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(
          profile.entityType === 'community'
            ? { pathname: '/community/[id]', params: { id: profile.id } }
            : { pathname: '/profile/[id]', params: { id: profile.id } }
        );
      }}
      style={styles.fcCard}
      padding={0}
    >
      <View style={styles.fcTapArea}>
        <LinearGradient
          colors={[`${meta.color}25`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={{ padding: 20 }}>
          <View style={styles.fcTop}>
            <View style={[styles.fcIconBox, { backgroundColor: colors.surface, borderColor: `${meta.color}30` }]}>
              <Ionicons name={meta.icon} size={24} color={meta.color} />
            </View>
            {profile.isVerified && (
              <View style={[styles.fcVerifiedBadge, { backgroundColor: CultureTokens.indigo }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 4 }]} numberOfLines={1}>{profile.name}</Text>
            <View style={styles.fcMetaRow}>
              <Text style={[TextStyles.labelSemibold, { color: meta.color, fontSize: 10, textTransform: 'uppercase' }]}>{profile.entityType}</Text>
              {profile.city ? (
                <>
                  <View style={styles.fcDot} />
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>{profile.city}</Text>
                </>
              ) : null}
            </View>
            <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary, lineHeight: 20 }]} numberOfLines={2}>
              {profile.description || `Join the ${profile.name} ${profile.entityType} area.`}
            </Text>
          </View>
          <View style={styles.fcBottom}>
            <View style={styles.fcMembers}>
              <Ionicons name="people" size={14} color={colors.textTertiary} />
              <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>{fmt(profile.membersCount ?? 0)} members</Text>
            </View>
          </View>
        </View>
      </View>
      
      <Button
        onPress={() => {
          if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          toggleJoinCommunity(profile.id);
        }}
        variant={joined ? 'outline' : 'primary'}
        size="sm"
        style={[
          styles.fcJoinBtnFloating,
          !joined && { backgroundColor: meta.color, borderColor: meta.color }
        ]}
      >
        {joined ? 'Joined' : 'Join'}
      </Button>
    </Card>
  );
}

function CommunityCard({ profile, colors, styles }: { profile: Profile; colors: ReturnType<typeof useColors>; styles: any }) {
  const { isCommunityJoined, toggleJoinCommunity } = useSaved();
  const joined = isCommunityJoined(profile.id);
  const meta = TYPE_META[profile.entityType] ?? { color: CultureTokens.indigo, icon: 'people' as const };
  const cultureTags = (profile as any).cultureIds ?? (profile as any).cultures ?? [];

  return (
    <Card
      onPress={() => {
        if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(
          profile.entityType === 'community'
            ? { pathname: '/community/[id]', params: { id: profile.id } }
            : { pathname: '/profile/[id]', params: { id: profile.id } }
        );
      }}
      style={styles.lcCard}
      padding={0}
    >
      <View style={[styles.lcAccentStrip, { backgroundColor: meta.color }]} />
      <View style={styles.lcCardMain}>
        <View style={[styles.lcIconBox, { backgroundColor: colors.background, borderColor: `${meta.color}20` }]}>
          <Ionicons name={meta.icon} size={24} color={meta.color} />
        </View>
        <View style={styles.lcCenter}>
          <View style={styles.lcNameRow}>
            <Text style={[TextStyles.cardTitle, { color: colors.text }]} numberOfLines={1}>{profile.name}</Text>
            {profile.isVerified && (
              <View style={[styles.lcVerifiedBadge, { backgroundColor: CultureTokens.indigo }]}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.lcMetaRow}>
            <Text style={[TextStyles.labelSemibold, { color: meta.color, fontSize: 10, textTransform: 'uppercase' }]}>{profile.entityType}</Text>
            {profile.city && (
              <>
                <View style={styles.lcDot} />
                <View style={styles.lcLocationRow}>
                  <Ionicons name="location" size={12} color={colors.textTertiary} />
                  <Text style={[TextStyles.caption, { color: colors.textTertiary }]} numberOfLines={1}>{profile.city}</Text>
                </View>
              </>
            )}
          </View>
          {cultureTags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {(cultureTags as string[]).slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.cultureChip, { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '30' }]}>
                  <Text style={[TextStyles.badge, { color: CultureTokens.indigo, fontSize: 9 }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.lcRight}>
          <Button
            onPress={() => {
              if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleJoinCommunity(profile.id);
            }}
            variant={joined ? 'outline' : 'primary'}
            size="sm"
            style={[
              styles.lcJoinBtn,
              !joined && { backgroundColor: meta.color, borderColor: meta.color }
            ]}
          >
            {joined ? 'Joined' : 'Join'}
          </Button>
        </View>
      </View>
    </Card>
  );
}

export default function CommunitiesScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets  = useSafeAreaInsets();
  const { width, isDesktop, isTablet } = useLayout();
  useRole();
  const { state: onboardingState } = useOnboarding();

  const topInset = isWeb ? 0 : insets.top;
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 800 : width;
  const useThreeColumnResults = isWeb && isDesktop;

  const [search,         setSearch]         = useState('');
  const [selectedType,   setSelectedType]   = useState('all');
  const [selectedCulture,setSelectedCulture]= useState<string | null>(null);
  const [sortBy,         setSortBy]         = useState<CommunitySort>('alphabetical');
  const [prefsHydrated,  setPrefsHydrated]  = useState(false);

  const { data: allProfiles, isLoading } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
    queryFn: () => api.profiles.list()
  });
  const { userId } = useAuth();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Build cultural filter chips: user's nationality first, then top ones found in data
  const cultureFilterChips = useMemo(() => {
    const chips: { id: string; label: string; emoji: string }[] = [
      { id: 'all', label: 'All Cultures', emoji: '🌍' },
    ];
    const userNationalityId = onboardingState.nationalityId;
    if (userNationalityId) {
      const nat = NATIONALITIES[userNationalityId];
      if (nat) chips.push({ id: nat.id, label: nat.label, emoji: nat.emoji });
    }
    // Add other nationalities that appear in the loaded community data
    const seen = new Set(chips.map((c) => c.id));
    const profiles = Array.isArray(allProfiles) ? allProfiles : [];
    profiles.forEach((p: any) => {
      if (p.nationalityId && !seen.has(p.nationalityId)) {
        const nat = NATIONALITIES[p.nationalityId];
        if (nat) {
          chips.push({ id: nat.id, label: nat.label, emoji: nat.emoji });
          seen.add(nat.id);
        }
      }
    });
    return chips.slice(0, 8);
  }, [allProfiles, onboardingState.nationalityId]);

  // Communities that match the user's cultural identity (for the "Your Culture" section)
  const yourCultureCommunities = useMemo(() => {
    const { nationalityId, cultureIds } = onboardingState;
    if (!nationalityId && (!cultureIds || cultureIds.length === 0)) return [];
    const profiles = Array.isArray(allProfiles) ? allProfiles : [];
    return profiles.filter((p: any) => {
      if (nationalityId && p.nationalityId === nationalityId) return true;
      if (cultureIds?.length && Array.isArray(p.cultureIds)) {
        return cultureIds.some((id: string) => p.cultureIds.includes(id));
      }
      return false;
    }).slice(0, 6);
  }, [allProfiles, onboardingState]);

  const filteredProfiles = useMemo(() => {
    let profiles = Array.isArray(allProfiles) ? allProfiles : [];
    if (selectedType !== 'all') profiles = profiles.filter((p) => p.entityType === selectedType);
    if (selectedCulture && selectedCulture !== 'all') {
      profiles = profiles.filter((p: any) =>
        p.nationalityId === selectedCulture ||
        (Array.isArray(p.cultureIds) && p.cultureIds.includes(selectedCulture))
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      profiles = profiles.filter((p) => {
        const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
        const cultureIds = Array.isArray((p as any).cultureIds) ? ((p as any).cultureIds as string[]) : [];
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.city ?? '').toLowerCase().includes(q) ||
          tags.some((t) => t.toLowerCase().includes(q)) ||
          cultureIds.some((id) => id.toLowerCase().includes(q))
        );
      });
    }
    const sorted = [...profiles];
    if (sortBy === 'members') {
      sorted.sort((a, b) => (b.membersCount ?? 0) - (a.membersCount ?? 0));
      return sorted;
    }
    sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [allProfiles, search, selectedType, selectedCulture, sortBy]);

  const featuredProfiles = useMemo(() => (
    (Array.isArray(allProfiles) ? allProfiles : [])
      .filter((p) => p.isVerified || (p.membersCount ?? 0) > 500)
      .sort((a, b) => (b.membersCount ?? 0) - (a.membersCount ?? 0))
      .slice(0, 8)
  ), [allProfiles]);

  const activeCategoryLabel = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedType)?.label ?? 'All',
    [selectedType],
  );

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
    setTimeout(() => {
      if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleSelectType = useCallback((id: string) => {
    if (!isWeb) Haptics.selectionAsync();
    setSelectedType(id);
  }, []);

  const handleSelectCulture = useCallback((id: string) => {
    if (!isWeb) Haptics.selectionAsync();
    setSelectedCulture(id === 'all' ? null : id);
  }, []);

  const prefsStorageKey = useMemo(() => `@communities_prefs:${userId ?? 'guest'}`, [userId]);

  useEffect(() => {
    let isMounted = true;
    const loadCommunityPreferences = async () => {
      try {
        const raw = await AsyncStorage.getItem(prefsStorageKey);
        if (!isMounted || !raw) return;
        const parsed = JSON.parse(raw);
        if (parsed.sortBy) setSortBy(parsed.sortBy);
        if (parsed.selectedType) setSelectedType(parsed.selectedType);
        if (parsed.search) setSearch(parsed.search);
      } catch { /* ignore */ } finally {
        if (isMounted) setPrefsHydrated(true);
      }
    };
    loadCommunityPreferences();
    return () => { isMounted = false; };
  }, [prefsStorageKey]);

  useEffect(() => {
    if (!prefsHydrated) return;
    AsyncStorage.setItem(prefsStorageKey, JSON.stringify({ sortBy, selectedType, search }));
  }, [sortBy, selectedType, search, prefsHydrated, prefsStorageKey]);

  if (isLoading) {
    return (
      <View style={[styles.container]}>
        <LinearGradient
          colors={['#2C2A72', '#3A86FF', '#2EC4B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: topInset }}
        >
          <View style={[styles.topBar, { paddingTop: topInset }]}>
            <View style={styles.topBarIconBlock}>
              <Ionicons name="people" size={20} color="#FFC857" />
            </View>
            <Text style={styles.topBarTitle}>Communities</Text>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
          </View>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ paddingBottom: 120, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => <CommunityListSkeleton key={i} />)}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={[styles.container]}>
        {/* Brand gradient top bar */}
        <LinearGradient
          colors={gradients.culturepassBrand as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: topInset }}
        >
          <View style={styles.topBar}>
            <View style={styles.topBarIconBlock}>
              <Ionicons name="people" size={24} color="#FFC857" />
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={styles.topBarTitle}>Communities</Text>
              <Text style={styles.topBarSubtitle}>Connect with your culture</Text>
            </View>
          </View>
        </LinearGradient>

        <Animated.ScrollView
          onScroll={isWeb ? (e: any) => { scrollY.value = e.nativeEvent.contentOffset.y; } : scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            maxWidth: contentMaxWidth,
            width: '100%',
            alignSelf: 'center',
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={CultureTokens.community} />}
        >
          {/* Category Filters */}
          <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
            <FilterChipRow
              items={CATEGORIES}
              selectedId={selectedType}
              onSelect={handleSelectType}
              size="small"
            />
          </View>

          {/* Culture Identity Filters */}
          {cultureFilterChips.length > 1 && (
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                {cultureFilterChips.map((chip) => {
                  const active = selectedCulture === chip.id || (chip.id === 'all' && !selectedCulture);
                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => handleSelectCulture(chip.id)}
                      style={[
                        styles.cultureFilterChip,
                        active
                          ? { backgroundColor: CultureTokens.indigo, borderColor: CultureTokens.indigo }
                          : { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      ]}
                    >
                      <Text style={{ fontSize: 14 }}>{chip.emoji}</Text>
                      <Text style={[TextStyles.captionSemibold, { color: active ? '#fff' : colors.textSecondary }]}>
                        {chip.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Search Input */}
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Input
              placeholder="Search by name, city, or interests..."
              value={search}
              onChangeText={setSearch}
              leftIcon="search-outline"
            />
          </View>

          {/* Featured Section */}
          {search.trim().length === 0 && selectedType === 'all' && !selectedCulture && featuredProfiles.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured</Text>
                <Text style={styles.sectionContext}>Verified</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                {featuredProfiles.map((p) => <FeaturedCard key={p.id} profile={p} colors={colors} styles={styles} />)}
              </ScrollView>
            </View>
          )}

          {/* Your Culture Section */}
          {search.trim().length === 0 && !selectedCulture && yourCultureCommunities.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Your Culture</Text>
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>Communities matching your identity</Text>
                </View>
                <Pressable onPress={() => setSelectedCulture(onboardingState.nationalityId ?? null)}>
                  <Text style={[TextStyles.captionSemibold, { color: CultureTokens.indigo }]}>See all</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                {yourCultureCommunities.map((p) => <FeaturedCard key={p.id} profile={p} colors={colors} styles={styles} />)}
              </ScrollView>
            </View>
          )}

          {/* Results List */}
          <View style={{ paddingHorizontal: 16 }}>
             <View style={styles.sectionHeaderNoPad}>
               <Text style={styles.sectionTitle}>{activeCategoryLabel}</Text>
               <View style={styles.sortGroup}>
                 <Pressable onPress={() => setSortBy('alphabetical')} style={[styles.sortBtn, sortBy === 'alphabetical' && styles.sortBtnActive]}>
                   <Text style={[styles.sortBtnText, sortBy === 'alphabetical' && styles.sortBtnTextActive]}>A-Z</Text>
                 </Pressable>
                 <Pressable onPress={() => setSortBy('members')} style={[styles.sortBtn, sortBy === 'members' && styles.sortBtnActive]}>
                   <Text style={[styles.sortBtnText, sortBy === 'members' && styles.sortBtnTextActive]}>Members</Text>
                 </Pressable>
               </View>
             </View>

            {filteredProfiles.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyStateCard}>
                   <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                   <Text style={styles.emptyTitle}>No communities found</Text>
                   <Text style={styles.emptySub}>Try adjusting your search or category filter.</Text>
                </View>
              </View>
            ) : (
              <View style={useThreeColumnResults ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : undefined}>
                {filteredProfiles.map((item) => (
                  <View key={item.id} style={useThreeColumnResults ? { width: '31.5%' } : undefined}>
                    <CommunityCard profile={item} colors={colors} styles={styles} />
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, minHeight: 64, gap: 14 },
  topBarIconBlock: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { ...TextStyles.title2, color: '#FFFFFF', lineHeight: 24, marginBottom: 2 },
  topBarSubtitle: { ...TextStyles.caption, color: 'rgba(255,255,255,0.85)' },
  
  heroBanner: { marginHorizontal: 16, marginTop: 4, marginBottom: 12, borderRadius: 20, padding: 16, overflow: 'hidden', shadowColor: CultureTokens.community, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  heroOrb: { position: 'absolute' },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 1 },
  heroIconBoxMini: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroRibbon: { alignSelf: 'flex-start', backgroundColor: '#ffffff1a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#ffffff26' },
  heroTitle: { ...TextStyles.cardTitle, color: '#fff' },
  heroStatsBadge: { backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  heroStatsText: { ...TextStyles.badge, color: '#fff' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  sectionHeaderNoPad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  sectionTitle: { ...TextStyles.title2, color: colors.text },
  sectionContext: { ...TextStyles.badge, color: colors.textTertiary, textTransform: 'uppercase' },
  sortGroup: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 4, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  sortBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  sortBtnActive: { backgroundColor: colors.surface },
  sortBtnText: { ...TextStyles.captionSemibold, color: colors.textTertiary },
  sortBtnTextActive: { color: CultureTokens.indigo },
  emptyWrap: { paddingVertical: 40 },
  emptyStateCard: { padding: 48, borderRadius: 32, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderLight, backgroundColor: colors.backgroundSecondary, alignItems: 'center', gap: 16 },
  emptyTitle: { ...TextStyles.title3, color: colors.text },
  emptySub: { ...TextStyles.bodyMedium, textAlign: 'center', color: colors.textSecondary },
  
  fcCard: { width: 280, padding: 20, borderRadius: 28, borderWidth: 1, overflow: 'hidden', backgroundColor: colors.surface, borderColor: colors.borderLight },
  fcCardHover: { transform: [{ translateY: -4 }] },
  fcTapArea: { flex: 1 },
  fcTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  fcIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  fcVerifiedBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: -4, right: -4 },
  fcName: { ...TextStyles.title3, color: colors.text, marginBottom: 4 },
  fcMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  fcTypeLabel: { ...TextStyles.badgeCaps },
  fcDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textTertiary },
  fcCityText: { ...TextStyles.caption, color: colors.textSecondary },
  fcDesc: { ...TextStyles.bodyMedium, color: colors.textSecondary, lineHeight: 20 },
  fcBottom: { marginTop: 12 },
  fcMembers: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fcMembersText: { ...TextStyles.caption, color: colors.textTertiary },
  fcJoinBtnFloating: { position: 'absolute', right: 16, bottom: 16 },
  
  lcCard: { borderRadius: 20, marginBottom: 12, borderWidth: 1, backgroundColor: colors.surface, overflow: 'hidden' },
  lcAccentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  lcCardMain: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  lcIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  lcCenter: { flex: 1, marginLeft: 12 },
  lcNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lcName: { ...TextStyles.cardTitle, color: colors.text },
  lcVerifiedBadge: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  lcMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lcTypeLabel: { ...TextStyles.badgeCaps, fontSize: 10 },
  lcDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary },
  lcLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lcLocationText: { ...TextStyles.caption, color: colors.textTertiary },
  lcRight: { marginLeft: 12 },
  lcJoinBtn: { minWidth: 70 },
  cultureChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  cultureFilterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});

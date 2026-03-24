import {
  View, Text, Pressable, StyleSheet, Platform,
  RefreshControl, ScrollView, ActivityIndicator, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaved } from '@/contexts/SavedContext';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useState, useMemo, useCallback, useEffect, memo } from 'react';
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
  community:    { color: EntityTypeColors.community,    icon: 'people' },
  organisation: { color: EntityTypeColors.organisation, icon: 'business' },
  venue:        { color: EntityTypeColors.venue,        icon: 'location' },
  council:      { color: EntityTypeColors.council,      icon: 'shield-checkmark' },
  government:   { color: EntityTypeColors.government,   icon: 'flag' },
  artist:       { color: EntityTypeColors.artist,       icon: 'musical-notes' },
  business:     { color: EntityTypeColors.business,     icon: 'storefront' },
  charity:      { color: EntityTypeColors.charity,      icon: 'heart' },
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

// ---------------------------------------------------------------------------
// Profile avatar — image with icon fallback
// ---------------------------------------------------------------------------
function ProfileAvatar({
  imageUrl,
  name,
  color,
  icon,
  size = 48,
  style,
}: {
  imageUrl?: string | null;
  name: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: object;
}) {
  const [imgError, setImgError] = useState(false);

  if (imageUrl && !imgError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[{ width: size, height: size, borderRadius: size / 4 }, style]}
        contentFit="cover"
        onError={() => setImgError(true)}
        transition={200}
      />
    );
  }

  // Fallback: colored icon box with first letter
  const initials = name.trim().charAt(0).toUpperCase();
  return (
    <View
      style={[{
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: `${color}18`,
        borderWidth: 1,
        borderColor: `${color}30`,
        alignItems: 'center',
        justifyContent: 'center',
      }, style]}
    >
      {initials ? (
        <Text style={{ fontSize: size * 0.4, fontWeight: '700', color }}>{initials}</Text>
      ) : (
        <Ionicons name={icon} size={size * 0.5} color={color} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// FeaturedCard — horizontal scroll card with image banner
// ---------------------------------------------------------------------------
const FeaturedCard = memo(function FeaturedCard({
  profile,
  colors,
  styles,
  currentUserId,
}: {
  profile: Profile;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof getStyles>;
  currentUserId?: string | null;
}) {
  const { isCommunityJoined, toggleJoinCommunity } = useSaved();
  const joined = isCommunityJoined(profile.id);
  const isManaged = profile.ownerId === currentUserId || (profile as any).memberRole === 'admin' || (profile as any).memberRole === 'organizer';
  const meta = TYPE_META[profile.entityType] ?? { color: CultureTokens.indigo, icon: 'people' as const };
  const [joining, setJoining] = useState(false);

  const handleJoin = useCallback(async () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJoining(true);
    try {
      await toggleJoinCommunity(profile.id);
    } finally {
      setJoining(false);
    }
  }, [profile.id, toggleJoinCommunity]);

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
      {/* Image banner */}
      {profile.imageUrl ? (
        <Image
          source={{ uri: profile.imageUrl }}
          style={styles.fcBanner}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <LinearGradient
          colors={[`${meta.color}40`, `${meta.color}10`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fcBanner}
        >
          <Ionicons name={meta.icon} size={36} color={`${meta.color}80`} style={{ alignSelf: 'center', marginTop: 16 }} />
        </LinearGradient>
      )}

      {/* Verified badge overlay */}
      {profile.isVerified && (
        <View style={[styles.fcVerifiedBadge, { backgroundColor: CultureTokens.indigo }]}>
          <Ionicons name="checkmark" size={10} color="#fff" />
        </View>
      )}

      <View style={{ padding: 14 }}>
        <Text style={[TextStyles.cardTitle, { color: colors.text, marginBottom: 2 }]} numberOfLines={1}>
          {profile.name}
        </Text>
        <View style={styles.fcMetaRow}>
          <Text style={[TextStyles.labelSemibold, { color: meta.color, fontSize: 10, textTransform: 'uppercase' }]}>
            {profile.entityType}
          </Text>
          {profile.city ? (
            <>
              <View style={styles.fcDot} />
              <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                {profile.city}
              </Text>
            </>
          ) : null}
        </View>
        <Text
          style={[TextStyles.caption, { color: colors.textSecondary, lineHeight: 18, marginBottom: 12 }]}
          numberOfLines={2}
        >
          {profile.description || `Join the ${profile.name} ${profile.entityType}.`}
        </Text>

        <View style={styles.fcBottom}>
          <View style={styles.fcMembers}>
            <Ionicons name="people" size={13} color={colors.textTertiary} />
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
              {fmt(profile.membersCount ?? 0)}
            </Text>
          </View>
          {isManaged ? (
            <Button
              onPress={() => router.push(`/dashboard/organizer/${profile.id}` as never)}
              variant="outline"
              size="sm"
              style={[styles.fcJoinBtn, { borderColor: CultureTokens.indigo }]}
            >
              <Text style={[TextStyles.labelSemibold, { color: CultureTokens.indigo, fontSize: 11 }]}>Manage</Text>
            </Button>
          ) : (
            <Button
              onPress={handleJoin}
              variant={joined ? 'outline' : 'primary'}
              size="sm"
              disabled={joining}
              style={[styles.fcJoinBtn, !joined && { backgroundColor: meta.color, borderColor: meta.color }]}
            >
              {joining ? '...' : joined ? 'Joined' : 'Join'}
            </Button>
          )}
        </View>
      </View>
    </Card>
  );
});

// ---------------------------------------------------------------------------
// CommunityCard — list row with image avatar
// ---------------------------------------------------------------------------
const CommunityCard = memo(function CommunityCard({
  profile,
  colors,
  styles,
  currentUserId,
}: {
  profile: Profile;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof getStyles>;
  currentUserId?: string | null;
}) {
  const { isCommunityJoined, toggleJoinCommunity } = useSaved();
  const joined = isCommunityJoined(profile.id);
  const isManaged = profile.ownerId === currentUserId || (profile as any).memberRole === 'admin' || (profile as any).memberRole === 'organizer';
  const meta = TYPE_META[profile.entityType] ?? { color: CultureTokens.indigo, icon: 'people' as const };
  const cultureTags = (profile as any).cultureIds ?? (profile as any).cultures ?? [];
  const [joining, setJoining] = useState(false);

  const handleJoin = useCallback(async () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJoining(true);
    try {
      await toggleJoinCommunity(profile.id);
    } finally {
      setJoining(false);
    }
  }, [profile.id, toggleJoinCommunity]);

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
        <ProfileAvatar
          imageUrl={profile.imageUrl}
          name={profile.name}
          color={meta.color}
          icon={meta.icon}
          size={48}
        />
        <View style={styles.lcCenter}>
          <View style={styles.lcNameRow}>
            <Text style={[TextStyles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {profile.name}
            </Text>
            {profile.isVerified && (
              <View style={[styles.lcVerifiedBadge, { backgroundColor: CultureTokens.indigo }]}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.lcMetaRow}>
            <Text style={[TextStyles.labelSemibold, { color: meta.color, fontSize: 10, textTransform: 'uppercase' }]}>
              {profile.entityType}
            </Text>
            {isManaged && (
              <>
                <View style={styles.lcDot} />
                <View style={[styles.statusBadge, { backgroundColor: CultureTokens.indigo + '15' }]}>
                  <Text style={[styles.statusBadgeText, { color: CultureTokens.indigo }]}>Managed</Text>
                </View>
              </>
            )}
            {!isManaged && joined && (
              <>
                <View style={styles.lcDot} />
                <View style={[styles.statusBadge, { backgroundColor: CultureTokens.teal + '15' }]}>
                  <Text style={[styles.statusBadgeText, { color: CultureTokens.teal }]}>Following</Text>
                </View>
              </>
            )}
            {profile.city && (
              <>
                <View style={styles.lcDot} />
                <View style={styles.lcLocationRow}>
                  <Ionicons name="location" size={12} color={colors.textTertiary} />
                  <Text style={[TextStyles.caption, { color: colors.textTertiary }]} numberOfLines={1}>
                    {profile.city}
                  </Text>
                </View>
              </>
            )}
          </View>
          {(profile.membersCount ?? 0) > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="people" size={11} color={colors.textTertiary} />
              <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
                {fmt(profile.membersCount ?? 0)} members
              </Text>
            </View>
          )}
          {cultureTags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {(cultureTags as string[]).slice(0, 3).map((tag) => (
                <View
                  key={tag}
                  style={[styles.cultureChip, { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '30' }]}
                >
                  <Text style={[TextStyles.badge, { color: CultureTokens.indigo, fontSize: 9 }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.lcRight}>
          {isManaged ? (
            <Button
              onPress={() => router.push(`/dashboard/organizer/${profile.id}` as never)}
              variant="outline"
              size="sm"
              style={{ borderColor: CultureTokens.indigo }}
            >
              <Text style={[TextStyles.labelSemibold, { color: CultureTokens.indigo, fontSize: 11 }]}>Manage</Text>
            </Button>
          ) : (
            <Button
              onPress={handleJoin}
              variant={joined ? 'outline' : 'primary'}
              size="sm"
              disabled={joining}
              style={[styles.lcJoinBtn, !joined && { backgroundColor: meta.color, borderColor: meta.color }]}
            >
              {joining ? '...' : joined ? 'Joined' : 'Join'}
            </Button>
          )}
        </View>
      </View>
    </Card>
  );
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function CommunitiesScreen() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets  = useSafeAreaInsets();
  const { width, isDesktop, isTablet } = useLayout();
  useRole();
  const { state: onboardingState } = useOnboarding();
  const { isAuthenticated, userId } = useAuth();
  const { joinedCommunities } = useSaved();

  const topInset = isWeb ? 0 : insets.top;
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 800 : width;
  const useThreeColumnResults = isWeb && isDesktop;

  const [search,          setSearch]          = useState('');
  const [selectedType,    setSelectedType]    = useState('all');
  const [selectedCulture, setSelectedCulture] = useState<string | null>(null);
  const [sortBy,          setSortBy]          = useState<CommunitySort>('alphabetical');
  const [prefsHydrated,   setPrefsHydrated]   = useState(false);

  // Query key includes city/country so it refetches when location changes
  const queryKey = useMemo(
    () => ['/api/profiles', onboardingState.city, onboardingState.country],
    [onboardingState.city, onboardingState.country],
  );

  const { data: allProfiles, isLoading, refetch } = useQuery<Profile[]>({
    queryKey,
    queryFn: () => api.profiles.list({
      city:    onboardingState.city    ?? undefined,
      country: onboardingState.country ?? undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Build cultural filter chips
  const cultureFilterChips = useMemo(() => {
    const chips: { id: string; label: string; emoji: string }[] = [
      { id: 'all', label: 'All Cultures', emoji: '🌍' },
    ];
    const userNationalityId = onboardingState.nationalityId;
    if (userNationalityId) {
      const nat = NATIONALITIES[userNationalityId];
      if (nat) chips.push({ id: nat.id, label: nat.label, emoji: nat.emoji });
    }
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

  // Communities matching user's cultural identity
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

  // Communities the user has joined (from API-synced SavedContext)
  const yourJoinedProfiles = useMemo(() => {
    if (!isAuthenticated || joinedCommunities.length === 0) return [];
    const profiles = Array.isArray(allProfiles) ? allProfiles : [];
    return profiles.filter((p) => joinedCommunities.includes(p.id));
  }, [allProfiles, joinedCommunities, isAuthenticated]);

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
        const cids = Array.isArray((p as any).cultureIds) ? ((p as any).cultureIds as string[]) : [];
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.city ?? '').toLowerCase().includes(q) ||
          tags.some((t) => t.toLowerCase().includes(q)) ||
          cids.some((id) => id.toLowerCase().includes(q))
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
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
      if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [refetch]);

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
    AsyncStorage.getItem(prefsStorageKey).then((raw) => {
      if (!isMounted || !raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.sortBy) setSortBy(parsed.sortBy);
        if (parsed.selectedType) setSelectedType(parsed.selectedType);
        if (parsed.search) setSearch(parsed.search);
      } catch { /* ignore */ }
    }).finally(() => {
      if (isMounted) setPrefsHydrated(true);
    });
    return () => { isMounted = false; };
  }, [prefsStorageKey]);

  useEffect(() => {
    if (!prefsHydrated) return;
    AsyncStorage.setItem(prefsStorageKey, JSON.stringify({ sortBy, selectedType, search }));
  }, [sortBy, selectedType, search, prefsHydrated, prefsStorageKey]);

  const isFiltering = search.trim().length > 0 || selectedType !== 'all' || !!selectedCulture;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={gradients.culturepassBrand as [string, string, string]}
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
      <View style={styles.container}>
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
              <Text style={styles.topBarSubtitle}>
                {onboardingState.city ? `${onboardingState.city} · ` : ''}Connect with your culture
              </Text>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={CultureTokens.community}
            />
          }
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
              >
                {cultureFilterChips.map((chip) => {
                  const active = selectedCulture === chip.id || (chip.id === 'all' && !selectedCulture);
                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => handleSelectCulture(chip.id)}
                      accessibilityRole="button"
                      accessibilityLabel={chip.label}
                      accessibilityState={{ selected: active }}
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

          {/* Your Communities (joined) */}
          {!isFiltering && isAuthenticated && yourJoinedProfiles.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Communities</Text>
                <Text style={styles.sectionContext}>{yourJoinedProfiles.length} joined</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {yourJoinedProfiles.map((p) => (
                  <FeaturedCard key={p.id} profile={p} colors={colors} styles={styles} currentUserId={userId} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Featured Section */}
          {!isFiltering && featuredProfiles.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured</Text>
                <Text style={styles.sectionContext}>Verified</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {featuredProfiles.map((p) => (
                  <FeaturedCard key={p.id} profile={p} colors={colors} styles={styles} currentUserId={userId} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Your Culture Section */}
          {!isFiltering && yourCultureCommunities.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Your Culture</Text>
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                    Communities matching your identity
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedCulture(onboardingState.nationalityId ?? null)}>
                  <Text style={[TextStyles.captionSemibold, { color: CultureTokens.indigo }]}>See all</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              >
                {yourCultureCommunities.map((p) => (
                  <FeaturedCard key={p.id} profile={p} colors={colors} styles={styles} currentUserId={userId} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Results List */}
          <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.sectionHeaderNoPad}>
              <View>
                <Text style={styles.sectionTitle}>{activeCategoryLabel}</Text>
                {filteredProfiles.length > 0 && (
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                    {filteredProfiles.length} {filteredProfiles.length === 1 ? 'result' : 'results'}
                  </Text>
                )}
              </View>
              <View style={styles.sortGroup}>
                <Pressable
                  onPress={() => setSortBy('alphabetical')}
                  style={[styles.sortBtn, sortBy === 'alphabetical' && styles.sortBtnActive]}
                  accessibilityRole="button"
                  accessibilityLabel="Sort alphabetically"
                  accessibilityState={{ selected: sortBy === 'alphabetical' }}
                >
                  <Text style={[styles.sortBtnText, sortBy === 'alphabetical' && styles.sortBtnTextActive]}>A-Z</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSortBy('members')}
                  style={[styles.sortBtn, sortBy === 'members' && styles.sortBtnActive]}
                  accessibilityRole="button"
                  accessibilityLabel="Sort by members"
                  accessibilityState={{ selected: sortBy === 'members' }}
                >
                  <Text style={[styles.sortBtnText, sortBy === 'members' && styles.sortBtnTextActive]}>Members</Text>
                </Pressable>
              </View>
            </View>

            <FlatList
              data={filteredProfiles}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              key={useThreeColumnResults ? 'grid' : 'list'}
              numColumns={useThreeColumnResults ? 3 : 1}
              columnWrapperStyle={useThreeColumnResults ? { gap: 16 } : undefined}
              renderItem={({ item }) => (
                useThreeColumnResults
                  ? <View style={{ flex: 1 }}><CommunityCard profile={item} colors={colors} styles={styles} currentUserId={userId} /></View>
                  : <CommunityCard profile={item} colors={colors} styles={styles} currentUserId={userId} />
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyStateCard}>
                    <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>
                      {search.trim() ? `No results for "${search}"` : 'No communities found'}
                    </Text>
                    <Text style={styles.emptySub}>
                      {search.trim()
                        ? 'Try a different search term or clear the filter.'
                        : 'Try adjusting your category or culture filter.'}
                    </Text>
                    {(search.trim() || selectedType !== 'all' || selectedCulture) ? (
                      <Button
                        onPress={() => { setSearch(''); setSelectedType('all'); setSelectedCulture(null); }}
                        variant="outline"
                        size="sm"
                      >
                        Clear filters
                      </Button>
                    ) : null}
                  </View>
                </View>
              }
            />
          </View>
        </Animated.ScrollView>
      </View>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 64,
    gap: 14,
  },
  topBarIconBlock: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: { ...TextStyles.title2, color: '#FFFFFF', lineHeight: 24, marginBottom: 2 },
  topBarSubtitle: { ...TextStyles.caption, color: 'rgba(255,255,255,0.85)' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionHeaderNoPad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  sectionTitle: { ...TextStyles.title2, color: colors.text },
  sectionContext: { ...TextStyles.badge, color: colors.textTertiary, textTransform: 'uppercase' },

  sortGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 4,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sortBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  sortBtnActive: { backgroundColor: colors.surface },
  sortBtnText: { ...TextStyles.captionSemibold, color: colors.textTertiary },
  sortBtnTextActive: { color: CultureTokens.indigo },

  emptyWrap: { paddingVertical: 40 },
  emptyStateCard: {
    padding: 48,
    borderRadius: 32,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderLight,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: { ...TextStyles.title3, color: colors.text },
  emptySub: { ...TextStyles.bodyMedium, textAlign: 'center', color: colors.textSecondary },

  // Featured card
  fcCard: {
    width: 240,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  fcBanner: { width: '100%', height: 100 },
  fcVerifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  fcMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fcDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textTertiary },
  fcBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fcMembers: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fcJoinBtn: { minWidth: 64 },

  // List card
  lcCard: {
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderColor: colors.borderLight,
  },
  lcAccentStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  lcCardMain: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingLeft: 20 },
  lcCenter: { flex: 1, marginLeft: 12 },
  lcNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lcVerifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lcMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lcDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textTertiary, marginHorizontal: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },
  lcLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  lcRight: { marginLeft: 12 },
  lcJoinBtn: { minWidth: 70 },

  cultureChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  cultureFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});

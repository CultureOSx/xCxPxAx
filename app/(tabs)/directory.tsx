import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CultureTokens, EntityTypeColors, shadows, gradients } from '@/constants/theme';
import { useState, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import type { Profile } from '@shared/schema';
import { api, type CouncilData } from '@/lib/api';
import { FilterChipRow, FilterItem } from '@/components/FilterChip';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { isIndigenousProfile } from '@/lib/indigenous';

const isWeb = Platform.OS === 'web';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  business: 'storefront',
  venue: 'location',
  council: 'shield-checkmark',
  government: 'flag',
  organisation: 'business',
  charity: 'heart',
};

const ENTITY_FILTERS = [
  { label: 'All', icon: 'grid', color: CultureTokens.indigo, display: 'All' },
  { label: 'indigenous', icon: 'leaf', color: CultureTokens.gold, display: '🪃 Indigenous' },
  { label: 'business', icon: 'storefront', color: EntityTypeColors.business, display: 'Businesses' },
  { label: 'venue', icon: 'location', color: EntityTypeColors.venue, display: 'Venues' },
  { label: 'organisation', icon: 'business', color: EntityTypeColors.organisation, display: 'Organisations' },
  { label: 'council', icon: 'shield-checkmark', color: EntityTypeColors.council, display: 'Councils' },
  { label: 'government', icon: 'flag', color: EntityTypeColors.government, display: 'Government' },
  { label: 'charity', icon: 'heart', color: EntityTypeColors.charity, display: 'Charities' },
] as const;

function getOptionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
}

function getTags(profile: Profile): string[] {
  return Array.isArray(profile.tags) ? (profile.tags as string[]) : [];
}

function getDirectoryListingType(profile: Profile): string {
  const category = (profile.category ?? '').toLowerCase();
  if (category === 'council') return 'council';
  return profile.entityType;
}

// ─── DirectoryCard ────────────────────────────────────────────────────────────

function DirectoryCard({ profile, colors, styles }: { profile: Profile; colors: ReturnType<typeof useColors>; styles: any }) {
  const color = (EntityTypeColors as Record<string, string>)[profile.entityType] ?? CultureTokens.indigo;
  const icon = TYPE_ICONS[profile.entityType] ?? 'business';
  const tags = getTags(profile);
  const profileRecord = profile as unknown as Record<string, unknown>;
  const phone = getOptionalString(profileRecord, 'phone');
  const address = getOptionalString(profileRecord, 'address');

  const handlePress = () => {
    router.push({ pathname: '/profile/[id]', params: { id: profile.id } });
  };

  return (
    <View>
      <Card padding={0}>
        <Pressable 
          onPress={handlePress}
          style={({ pressed }) => [
            { padding: 22 },
            pressed && { backgroundColor: colors.backgroundSecondary, borderTopLeftRadius: 20, borderTopRightRadius: 20 }
          ]}
          accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
          accessibilityLabel={`View ${profile.name} profile`}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.businessIcon, { backgroundColor: `${color}15` }]}>
              <Ionicons name={icon as never} size={28} color={color} />
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {profile.name}
                </Text>
                {profile.isVerified && (
                  <Ionicons name="checkmark-circle" size={18} color={CultureTokens.indigo} />
                )}
              </View>
              <Text style={styles.cardCategory}>
                {profile.category ?? profile.entityType}
              </Text>
              {(profile as any).culturePassId ? (
                <Text style={styles.cpidLabel}>{(profile as any).culturePassId}</Text>
              ) : null}
            </View>

            {profile.rating != null ? (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color={CultureTokens.saffron} />
                <Text style={styles.ratingText}>{profile.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          {profile.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {profile.description}
            </Text>
          ) : null}

          {tags.length > 0 && (
            <View style={styles.serviceRow}>
              {tags.slice(0, 3).map(tag => (
                <View key={tag} style={styles.servicePill}>
                  <Text style={styles.serviceText}>{tag}</Text>
                </View>
              ))}
              {tags.length > 3 && (
                <Text style={styles.moreServices}>+{tags.length - 3}</Text>
              )}
            </View>
          )}

          {(phone || address) && (
            <View style={styles.contactHintRow}>
              {phone ? (
                <View style={styles.contactHint}>
                  <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.contactHintText}>Phone listed</Text>
                </View>
              ) : null}
              {address ? (
                <View style={styles.contactHint}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.contactHintText}>Address listed</Text>
                </View>
              ) : null}
            </View>
          )}
          <View style={styles.cardFooter}>
            {profile.city ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.locationText}>
                  {profile.city}
                  {profile.country ? `, ${profile.country}` : ''}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.statsRow}>
              <Text style={styles.followersText}>
                {formatNumber(profile.followersCount ?? 0)} followers
              </Text>
              {(profile.reviewsCount ?? 0) > 0 && (
                <Text style={styles.reviewCount}>{profile.reviewsCount} reviews</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </View>
        </Pressable>
      </Card>
    </View>
  );
}

// ─── DirectoryScreen ──────────────────────────────────────────────────────────

export default function DirectoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = getStyles(colors);
  const { width, isDesktop, isTablet } = useLayout();
  
  const isDesktopWeb = isWeb && isDesktop;
  const topInset = isWeb ? (isDesktopWeb ? 32 : 16) : insets.top;
  const shellMaxWidth = isDesktopWeb ? 1120 : isTablet ? 840 : width;
  
  const shellStyle = isWeb || isTablet
    ? { maxWidth: shellMaxWidth, width: '100%' as const, alignSelf: 'center' as const }
    : undefined;
  const useWebTwoColumnResults = isWeb && shellMaxWidth >= 900;

  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const { data: allProfilesRaw, isLoading } = useQuery<Profile[] | { profiles?: Profile[] }>({
    queryKey: ['/api/profiles'],
    queryFn: () => api.profiles.list(),
  });

  const allProfiles = useMemo<Profile[]>(
    () => (Array.isArray(allProfilesRaw)
      ? allProfilesRaw
      : (allProfilesRaw?.profiles ?? [])),
    [allProfilesRaw],
  );

  const { data: councilListData } = useQuery({
    queryKey: ['/api/council/list', 'directory-sync'],
    queryFn: () => api.council.list({ pageSize: 2000, sortBy: 'name', sortDir: 'asc' }),
  });

  // Keep directory council entries in sync with council source of truth.
  const nonCommunityProfiles = useMemo(() => {
    const base = allProfiles.filter(
      p => p.entityType !== 'community' && (p.category ?? '').toLowerCase() !== 'council'
    );
    const councils = (councilListData?.councils ?? []).map((council: CouncilData) => ({
      id: council.id,
      name: council.name,
      description: council.description ?? `${council.suburb}, ${council.state}`,
      entityType: 'organizer',
      category: 'Council',
      city: council.suburb || '',
      country: council.country || 'Australia',
      ownerId: 'system-council',
      isVerified: council.verificationStatus === 'verified',
      followersCount: 0,
      tags: [council.state, 'Council'].filter(Boolean),
      website: council.websiteUrl,
      phone: council.phone,
      address: council.addressLine1,
      culturePassId: council.id.toUpperCase(),
    })) as unknown as Profile[];
    return [...base, ...councils];
  }, [allProfiles, councilListData?.councils]);

  const filtered = useMemo(() => {
    let results = nonCommunityProfiles;

    if (selectedType !== 'All') {
      if (selectedType === 'indigenous') {
        results = results.filter((p) => isIndigenousProfile(p));
      } else {
        results = results.filter((p) => getDirectoryListingType(p) === selectedType);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(p => {
        const tags = getTags(p);
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q) ||
          tags.some(t => t.toLowerCase().includes(q))
        );
      });
    }

    return results;
  }, [selectedType, search, nonCommunityProfiles]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: nonCommunityProfiles.length };
    counts.indigenous = nonCommunityProfiles.filter((p) => isIndigenousProfile(p)).length;
    for (const p of nonCommunityProfiles) {
      const listingType = getDirectoryListingType(p);
      counts[listingType] = (counts[listingType] ?? 0) + 1;
    }
    return counts;
  }, [nonCommunityProfiles]);

  const directoryStats = useMemo(
    () => [
      { id: 'listings', label: 'Listings', value: typeCounts.All ?? 0, icon: 'grid-outline', color: CultureTokens.indigo },
      { id: 'councils', label: 'Councils', value: typeCounts.council ?? 0, icon: 'shield-checkmark-outline', color: CultureTokens.teal },
      { id: 'verified', label: 'Verified', value: nonCommunityProfiles.filter((p) => p.isVerified).length, icon: 'checkmark-circle-outline', color: CultureTokens.saffron },
    ],
    [typeCounts, nonCommunityProfiles]
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

  const handleFilterSelect = useCallback((id: string) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(id);
  }, []);

  const filterItems = useMemo<FilterItem[]>(() => {
    return ENTITY_FILTERS.map(filter => ({
      id: filter.label,
      label: filter.display,
      icon: filter.icon,
      color: filter.color,
      count: typeCounts[filter.label],
    }));
  }, [typeCounts]);

  const hasActiveFilters = selectedType !== 'All' || search.trim().length > 0;
  const resultContext = useMemo(() => {
    const filters: string[] = [];
    if (selectedType !== 'All') {
      const selectedFilter = ENTITY_FILTERS.find((filter) => filter.label === selectedType);
      filters.push(selectedFilter?.display ?? selectedType);
    }
    if (search.trim()) filters.push(`"${search.trim()}"`);
    return filters.length > 0 ? `Filtered by ${filters.join(' • ')}` : 'Showing all listings';
  }, [selectedType, search]);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Gradient top bar */}
        <LinearGradient
          colors={gradients.culturepassBrand as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: topInset }}
        >
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleWrap}>
                <Text style={[styles.title, { color: '#fff' }]}>Directory</Text>
                <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.85)' }]}>Businesses, venues, organisations & more</Text>
              </View>
              {isWeb ? (
                <View style={[styles.headerSearchWrap, searchFocused && styles.searchContainerFocused, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}>
                  <Ionicons name="search" size={20} color={searchFocused ? '#fff' : 'rgba(255,255,255,0.8)'} />
                  <TextInput
                    style={[styles.headerSearchInput, { color: '#fff' }]}
                    placeholder="Search directory..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    returnKeyType="search"
                  />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch('')} hitSlop={12}>
                      <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.8)" />
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>

        <View style={shellStyle}>
          <View style={styles.summaryRow}>
            {directoryStats.map((stat, index) => (
              <View key={stat.id} style={styles.summaryInlineItem}>
                <Text style={[styles.summaryInlineValue, { color: colors.text }]} numberOfLines={1}>
                  {formatNumber(stat.value)}
                </Text>
                <Text style={[styles.summaryInlineLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  {stat.label}
                </Text>
                {index < directoryStats.length - 1 ? (
                  <View style={[styles.summaryDivider, { backgroundColor: colors.borderLight }]} />
                ) : null}
              </View>
            ))}
          </View>

          {/* Search bar */}
          {!isWeb && (
            <View style={styles.searchCenterRow}>
              <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
                <Ionicons name="search" size={22} color={searchFocused ? CultureTokens.indigo : colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search directory..."
                  placeholderTextColor={colors.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={14}>
                    <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Category filter chips */}
          <View style={styles.categorySection}>
            <FilterChipRow items={filterItems} selectedId={selectedType} onSelect={handleFilterSelect} />
            <View style={styles.filterMetaRow}>
              <Text style={styles.filterMetaText} numberOfLines={1}>{resultContext}</Text>
              <Button
                variant="outline"
                size="sm"
                pill
                onPress={() => {
                  setSelectedType('All');
                  setSearch('');
                }}
                disabled={!hasActiveFilters}
              >
                Clear
              </Button>
            </View>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={CultureTokens.indigo} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 40 : 100 }]}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={CultureTokens.indigo} colors={[CultureTokens.indigo]} />}
          >
            <View style={shellStyle}>
              <Text style={styles.resultCount}>
                {filtered.length} {filtered.length === 1 ? 'listing' : 'listings'} found
              </Text>
              <Text style={styles.resultContextText}>{resultContext}</Text>

              {useWebTwoColumnResults ? (
                <View style={styles.resultsGridWeb}>
                  {filtered.map((profile) => (
                    <View key={profile.id} style={styles.resultsGridItemWeb}>
                      <DirectoryCard profile={profile} colors={colors} styles={styles} />
                    </View>
                  ))}
                </View>
              ) : (
                filtered.map((profile) => (
                  <DirectoryCard key={profile.id} profile={profile} colors={colors} styles={styles} />
                ))
              )}

              {filtered.length === 0 && (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBox}>
                    <Ionicons name="storefront-outline" size={48} color={colors.textTertiary} />
                  </View>
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptySubtext}>
                    Try a different filter or search term
                  </Text>
                  {hasActiveFilters && (
                    <View style={{ marginTop: 8 }}>
                      <Button
                        variant="secondary"
                        size="md"
                        onPress={() => {
                          setSelectedType('All');
                          setSearch('');
                        }}
                      >
                        Reset Filters
                      </Button>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  headerTitleWrap: { flex: 1 },
  title: { fontSize: 32, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.6 },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 0,
  },
  summaryInlineItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    minWidth: 0,
    position: 'relative',
  },
  summaryInlineValue: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  summaryInlineLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  summaryDivider: {
    position: 'absolute',
    right: 0,
    width: 1,
    height: 14,
  },
  headerSearchWrap: {
    width: '52%',
    maxWidth: 620,
    minWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    paddingVertical: 0,
    minWidth: 0,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 12,
  },
  searchCenterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  searchContainerFocused: {
    borderColor: CultureTokens.indigo,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.text,
    padding: 0,
    minWidth: 0,
  },
  categorySection: { paddingTop: 8, paddingBottom: 14, paddingHorizontal: isWeb ? 0 : undefined },
  filterMetaRow: {
    marginTop: -4,
    marginBottom: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterMetaText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  filterClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CultureTokens.indigo + '50',
    backgroundColor: CultureTokens.indigo + '14',
  },
  filterClearBtnDisabled: {
    borderColor: colors.borderLight,
    backgroundColor: colors.backgroundSecondary,
  },
  filterClearBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.indigo,
  },
  filterClearBtnTextDisabled: {
    color: colors.textTertiary,
  },
  resultCount: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  resultContextText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.textTertiary,
    marginBottom: 14,
  },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  resultsGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resultsGridItemWeb: {
    width: '48.8%',
  },
  
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
    marginBottom: 16,
    ...shadows.medium,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  businessIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text,
    flexShrink: 1,
  },
  cardCategory: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, textTransform: 'capitalize' },
  cpidLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CultureTokens.saffron + '26',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  ratingText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: CultureTokens.saffron },
  cardDesc: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  serviceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  servicePill: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  serviceText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  moreServices: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: CultureTokens.indigo },
  contactHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  contactHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.backgroundSecondary,
  },
  contactHintText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 4,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  followersText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },
  reviewCount: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textTertiary },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: CultureTokens.indigo + '14',
    borderWidth: 1,
    borderColor: CultureTokens.indigo + '26',
  },
  cardActionText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: CultureTokens.indigo },
  
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 14 },
  emptyIconBox: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text,
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyResetBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CultureTokens.indigo + '40',
    backgroundColor: CultureTokens.indigo + '14',
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: CultureTokens.indigo,
  },
});
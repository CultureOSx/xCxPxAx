import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, Platform } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CultureTokens, gradients, CategoryColors, LiquidGlassTokens } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useLayout } from '@/hooks/useLayout';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { goBackOrReplace } from '@/lib/navigation';
import { LocationPicker } from '@/components/LocationPicker';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import { TextStyles } from '@/constants/typography';
import { Card } from '@/components/ui/Card';

const isWeb = Platform.OS === 'web';

type ResultType = 'event' | 'movie' | 'restaurant' | 'activity' | 'shopping' | 'community' | 'person';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  imageUrl?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const POPULAR_SEARCHES = ['Diwali', 'Comedy Night', 'Bollywood', 'Food Festival', 'Art Exhibition', 'Cricket'];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const s = getStyles(colors);
  const { isDesktop, hPad } = useLayout();
  const reducedMotion = useReducedMotion();

  const openNotifications = useCallback(() => {
    if (isAuthenticated) {
      router.push('/notifications');
      return;
    }
    router.push(routeWithRedirect('/(onboarding)/login', '/notifications'));
  }, [isAuthenticated]);

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ResultType | 'all'>('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const { state } = useOnboarding();
  const routeParams = useLocalSearchParams<{ q?: string }>();

  useEffect(() => {
    const raw = routeParams.q;
    const single = Array.isArray(raw) ? raw[0] : raw;
    if (typeof single !== 'string' || !single.trim()) return;
    try {
      setQuery(decodeURIComponent(single.trim()));
    } catch {
      setQuery(single.trim());
    }
  }, [routeParams.q]);

  const TYPE_CONFIG = useMemo((): Record<ResultType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> => ({
    event:      { label: 'Events',       icon: 'calendar',   color: CultureTokens.gold },
    movie:      { label: 'Movies',       icon: 'film',       color: CultureTokens.gold },
    restaurant: { label: 'Dining',       icon: 'restaurant', color: CultureTokens.coral },
    activity:   { label: 'Activities',   icon: 'football',   color: CultureTokens.teal },
    shopping:   { label: 'Stores',       icon: 'bag',        color: CategoryColors.shopping },
    community:  { label: 'Communities',  icon: 'people',     color: CultureTokens.indigo },
    person:     { label: 'People',       icon: 'person',     color: CultureTokens.coral },
  }), []);

  const { data: searchData } = useQuery({
    queryKey: ['api/search', query, state.city, state.country],
    queryFn: () => api.search.query({ q: query, city: state.city || undefined, country: state.country || undefined }),
    enabled: query.length >= 2,
    staleTime: 60000,
  });

  const allResults = useMemo((): SearchResult[] => {
    if (query.length < 2) return [];
    
    const results: SearchResult[] = [];
    
    // 1. Events from /api/search (Firestore-backed)
    const localEvents = Array.isArray(searchData?.events) ? searchData.events : [];
    localEvents.forEach((e: any) => {
      results.push({
        id: e.id,
        type: 'event',
        title: e.title,
        subtitle: `${e.communityId || 'General'} · ${e.venue || e.city}`,
        imageUrl: e.imageUrl,
        icon: TYPE_CONFIG.event.icon,
        color: TYPE_CONFIG.event.color,
      });
    });

    // 2. Movies
    const localMovies = Array.isArray(searchData?.movies) ? searchData.movies : [];
    localMovies.forEach((m: any) => {
      results.push({
        id: m.id,
        type: 'movie',
        title: m.title,
        subtitle: m.genre?.join(', ') || m.description || 'Movie',
        imageUrl: m.posterUrl || m.imageUrl,
        icon: TYPE_CONFIG.movie.icon,
        color: TYPE_CONFIG.movie.color,
      });
    });

    // 3. Profiles (Restaurants, Shopping, Communities, etc.)
    const localProfiles = Array.isArray(searchData?.profiles) ? searchData.profiles : [];
    localProfiles.forEach((p: any) => {
      let type: ResultType = 'community';
      if (p.entityType === 'business') {
        if (p.category?.toLowerCase().includes('food') || p.category?.toLowerCase().includes('restaurant')) type = 'restaurant';
        else if (p.category?.toLowerCase().includes('shop') || p.category?.toLowerCase().includes('retail')) type = 'shopping';
        else type = 'community'; // Fallback
      } else if (p.entityType === 'artist') {
        type = 'community'; 
      }
      
      results.push({
        id: p.id,
        type,
        title: p.name,
        subtitle: `${p.category || p.entityType} · ${p.city || 'Australia'}`,
        imageUrl: p.avatarUrl || p.imageUrl,
        icon: TYPE_CONFIG[type].icon,
        color: TYPE_CONFIG[type].color,
      });
    });

    // 4. People (Users)
    const localUsers = Array.isArray(searchData?.users) ? searchData.users : [];
    localUsers.forEach((u: any) => {
      results.push({
        id: u.id,
        type: 'person',
        title: u.displayName || u.username || 'Anonymous User',
        subtitle: `@${u.username || 'user'} · ${u.city || 'CulturePass'}`,
        imageUrl: u.avatarUrl,
        icon: TYPE_CONFIG.person.icon,
        color: TYPE_CONFIG.person.color,
      });
    });

    return results;
  }, [query, searchData, TYPE_CONFIG]);

  const filteredResults = useMemo(() => {
    if (selectedType === 'all') return allResults;
    return allResults.filter(r => r.type === selectedType);
  }, [allResults, selectedType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allResults.length };
    allResults.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return counts;
  }, [allResults]);

  const handleResultPress = (result: SearchResult) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const routes: Record<ResultType, string> = {
      event: '/event/[id]',
      movie: '/movies/[id]',
      restaurant: '/restaurants/[id]',
      activity: '/activities/[id]',
      shopping: '/shopping/[id]',
      community: '/profile/[id]',
      person: '/profile/[id]',
    };
    router.push({ pathname: routes[result.type], params: { id: result.id } });
  };

  return (
    <ErrorBoundary>
      <View style={[s.container, { paddingTop: topInset }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={searchStyles.ambientMesh}
          pointerEvents="none"
        />

        {/* Top bar — liquid glass */}
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(280).springify()}>
          <LiquidGlassPanel
            borderRadius={0}
            bordered={false}
            style={{
              zIndex: 10,
              elevation: 10,
              borderBottomWidth: StyleSheet.hairlineWidth * 2,
              borderBottomColor: colors.borderLight,
            }}
            contentStyle={s.topBar}
          >
            <Pressable
              onPress={() => goBackOrReplace('/(tabs)')}
              style={({ pressed }) => [s.headerIconBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={[TextStyles.title2, { color: colors.text, flex: 1, textAlign: 'center' }]}>Search</Text>
            <View style={s.topBarActions}>
              <LocationPicker
                variant="icon"
                iconColor={colors.text}
                buttonStyle={{ ...s.headerIconBtn, backgroundColor: 'transparent' }}
              />
              <Pressable
                onPress={openNotifications}
                style={({ pressed }) => [s.headerIconBtn, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                {isAuthenticated && <View style={[s.notifDot, { borderColor: colors.surface }]} />}
              </Pressable>
            </View>
          </LiquidGlassPanel>
        </Animated.View>

        <View style={[s.shell, isDesktop && s.desktopShell]}>
          <LiquidGlassPanel
            borderRadius={LiquidGlassTokens.corner.mainCard}
            bordered={false}
            style={{ marginHorizontal: hPad, marginTop: 10, marginBottom: 8 }}
            contentStyle={s.searchGlassInner}
          >
            <View
              style={[
                s.searchBarInner,
                {
                  borderColor: searchFocused ? CultureTokens.indigo : colors.borderLight,
                  backgroundColor: colors.primarySoft,
                  borderRadius: LiquidGlassTokens.corner.valueRibbon,
                },
              ]}
            >
              <Ionicons name="search" size={20} color={searchFocused ? CultureTokens.indigo : colors.textSecondary} />
              <TextInput
                style={s.searchInput}
                placeholder="Events, communities, venues..."
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                autoFocus
                returnKeyType="search"
                selectionColor={CultureTokens.indigo}
                accessibilityLabel="Search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={10} style={{ padding: 4 }} accessibilityRole="button" accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </LiquidGlassPanel>

          {query.length > 0 && allResults.length > 0 && (
            <LiquidGlassPanel
              borderRadius={LiquidGlassTokens.corner.mainCard}
              bordered={false}
              style={{ marginHorizontal: hPad, marginBottom: 8 }}
              contentStyle={s.filterGlassInner}
            >
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.typeRow}
                style={{ flexGrow: 0 }}
                accessibilityRole="tablist"
                accessibilityLabel="Result type filters"
              >
                <Pressable
                  style={[s.typeChip, { backgroundColor: selectedType === 'all' ? CultureTokens.indigo : colors.surface, borderColor: selectedType === 'all' ? CultureTokens.indigo : colors.borderLight }]}
                  onPress={() => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedType('all'); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: selectedType === 'all' }}
                >
                  <Text style={[TextStyles.captionSemibold, { color: selectedType === 'all' ? colors.textOnBrandGradient : colors.textSecondary }]}>
                    All ({typeCounts.all})
                  </Text>
                </Pressable>
                {(Object.keys(TYPE_CONFIG) as ResultType[]).filter(t => typeCounts[t]).map(type => (
                  <Pressable
                    key={type}
                    style={[s.typeChip, { backgroundColor: selectedType === type ? TYPE_CONFIG[type].color + '20' : colors.surface, borderColor: selectedType === type ? TYPE_CONFIG[type].color : colors.borderLight }]}
                    onPress={() => { if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedType(type); }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: selectedType === type }}
                  >
                    <Ionicons name={TYPE_CONFIG[type].icon} size={14} color={selectedType === type ? TYPE_CONFIG[type].color : colors.textTertiary} />
                    <Text style={[TextStyles.captionSemibold, { color: selectedType === type ? TYPE_CONFIG[type].color : colors.textSecondary }]}>
                      {TYPE_CONFIG[type].label} ({typeCounts[type]})
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </LiquidGlassPanel>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 40 }}>
            {query.length === 0 ? (
              <View style={s.suggestionsContainer}>
                <Text style={TextStyles.badgeCaps}>Trending Searches</Text>
                <View style={[s.suggestionsGrid, { marginTop: 12 }]}>
                  {POPULAR_SEARCHES.map(term => (
                    <Pressable 
                      key={term} 
                      style={({ pressed }) => [s.suggestionPill, { transform: [{ scale: pressed ? 0.98 : 1 }] }]} 
                      onPress={() => setQuery(term)}
                    >
                      <Ionicons name="trending-up" size={16} color={CultureTokens.indigo} />
                      <Text style={[TextStyles.label, { color: colors.text }]}>{term}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[TextStyles.badgeCaps, { marginTop: 32 }]}>Explore Categories</Text>
                <View style={[s.categoriesGrid, { marginTop: 12 }]}>
                  {(Object.entries(TYPE_CONFIG) as [ResultType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }][]).map(([key, config]) => (
                    <Card
                      key={key}
                      onPress={() => {
                        if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const routes: Record<ResultType, string> = {
                          event: '/(tabs)/explore',
                          movie: '/movies',
                          restaurant: '/restaurants',
                          activity: '/activities',
                          shopping: '/shopping',
                          community: '/profile/[id]',
                          person: '/profile/[id]',
                        };
                        router.push(routes[key]);
                      }}
                      style={s.categoryCard}
                      padding={16}
                    >
                      <View style={[s.categoryIcon, { backgroundColor: config.color + '15' }]}>
                        <Ionicons name={config.icon} size={24} color={config.color} />
                      </View>
                      <Text style={[TextStyles.labelSemibold, { color: colors.text, textAlign: 'center' }]}>{config.label}</Text>
                    </Card>
                  ))}
                </View>
              </View>
            ) : filteredResults.length === 0 ? (
              <View style={s.emptyState}>
                <View style={s.emptyIconWrap}>
                  <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                </View>
                <Text style={[TextStyles.title3, { color: colors.text }]}>No results found</Text>
                <Text style={[TextStyles.body, { textAlign: 'center', color: colors.textSecondary }]}>We couldn&apos;t find anything matching &quot;{query}&quot;. Try different keywords or browse categories.</Text>
              </View>
            ) : (
              <View style={s.resultsList}>
                <Text style={TextStyles.badgeCaps}>
                  {filteredResults.length} {filteredResults.length === 1 ? 'match found' : 'matches found'}
                </Text>
                {filteredResults.map((result) => (
                  <View key={`${result.type}-${result.id}`}>
                    <Card 
                      onPress={() => handleResultPress(result)}
                      style={s.resultCard}
                      padding={14}
                    >
                      {result.imageUrl ? (
                        <Image source={{ uri: result.imageUrl }} style={s.resultImage} />
                      ) : (
                        <View style={[s.resultIconBox, { backgroundColor: result.color + '15' }]}>
                          <Ionicons name={result.icon} size={24} color={result.color} />
                        </View>
                      )}
                      <View style={s.resultInfo}>
                        <View style={s.resultTypeBadge}>
                          <View style={[s.resultTypeDot, { backgroundColor: result.color }]} />
                          <Text style={[TextStyles.badge, { fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary }]}>{TYPE_CONFIG[result.type].label}</Text>
                        </View>
                        <Text style={[TextStyles.headline, { color: colors.text }]} numberOfLines={1}>{result.title}</Text>
                        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 1 }]} numberOfLines={1}>{result.subtitle}</Text>
                      </View>
                      <View style={s.resultArrowBox}>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                      </View>
                    </Card>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1 },
  desktopShell: { maxWidth: 800, width: '100%', alignSelf: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CultureTokens.coral,
    borderWidth: 2,
  },
  searchGlassInner: { paddingVertical: 10, paddingHorizontal: 10 },
  filterGlassInner: { paddingVertical: 10, paddingHorizontal: 8 },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth * 2,
    minHeight: 48,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Poppins_500Medium', paddingVertical: 0, minWidth: 0, color: colors.text },

  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 4 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  typeChipText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  
  suggestionsContainer: { paddingHorizontal: 20, paddingTop: 20 },
  suggestionsTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 16, color: colors.text },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suggestionPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  suggestionText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },
  
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { 
    width: '31%' as `${number}%`, 
    flexGrow: 1, 
    borderRadius: 24, 
    padding: 20, 
    alignItems: 'center', 
    gap: 12, 
    borderWidth: 1, 
    backgroundColor: colors.surface, 
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  categoryIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, textAlign: 'center' },
  
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: colors.surface },
  emptyTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  emptyDesc: { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, color: colors.textSecondary },
  
  resultsList: { paddingHorizontal: 20, paddingTop: 12 },
  resultsCount: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 16, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  resultCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 20, 
    padding: 14, 
    marginBottom: 12, 
    borderWidth: 1, 
    backgroundColor: colors.surface, 
    borderColor: colors.borderLight, 
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  resultImage: { width: 66, height: 66, borderRadius: 16 },
  resultIconBox: { width: 66, height: 66, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1, gap: 2 },
  resultTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  resultTypeDot: { width: 7, height: 7, borderRadius: 3.5 },
  resultTypeText: { fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.textSecondary },
  resultTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', paddingRight: 8, color: colors.text },
  resultSubtitle: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 1 },
  resultArrowBox: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary + '80' },
});

const searchStyles = StyleSheet.create({
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
  },
});

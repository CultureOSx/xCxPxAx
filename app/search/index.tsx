import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CultureTokens, gradients, HeaderTokens } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlgoliaSearch } from '@/hooks/useAlgolia';
import { BlurView } from 'expo-blur';
import { useColors } from '@/hooks/useColors';
import { goBackOrReplace } from '@/lib/navigation';
import { LocationPicker } from '@/components/LocationPicker';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import { TextStyles } from '@/constants/typography';
import { Card } from '@/components/ui/Card';

const isWeb = Platform.OS === 'web';

type ResultType = 'event' | 'movie' | 'restaurant' | 'activity' | 'shopping' | 'community';

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const openNotifications = useCallback(() => {
    if (isAuthenticated) {
      router.push('/notifications' as never);
      return;
    }
    router.push(routeWithRedirect('/(onboarding)/login', '/notifications') as never);
  }, [isAuthenticated]);

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ResultType | 'all'>('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const { state } = useOnboarding();

  const TYPE_CONFIG = useMemo((): Record<ResultType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> => ({
    event:      { label: 'Events',       icon: 'calendar',   color: CultureTokens.saffron },
    movie:      { label: 'Movies',       icon: 'film',       color: CultureTokens.gold },
    restaurant: { label: 'Dining',       icon: 'restaurant', color: CultureTokens.coral },
    activity:   { label: 'Activities',   icon: 'football',   color: CultureTokens.teal },
    shopping:   { label: 'Stores',       icon: 'bag',        color: '#FF9F1C' },
    community:  { label: 'Communities',  icon: 'people',     color: CultureTokens.indigo },
  }), []);

  useAlgoliaSearch({
    indexName: 'culturepass_events',
    query,
    city: state.city,
  });

  const { data: searchData } = useQuery({
    queryKey: ['api/search', query, state.city, state.country],
    queryFn: () => api.search.query({ q: query, city: state.city || undefined, country: state.country || undefined }),
    enabled: query.length >= 2,
    staleTime: 60000,
  });

  const allResults = useMemo((): SearchResult[] => {
    if (query.length < 2) return [];
    
    const results: SearchResult[] = [];
    
    // 1. Events from Local Search (or Algolia if you prefer)
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
      community: '/community/[id]',
    };
    router.push({ pathname: routes[result.type] as never, params: { id: result.id } });
  };

  return (
    <ErrorBoundary>
      <View style={[s.container, { paddingTop: topInset }]}>
        <LinearGradient
          colors={[CultureTokens.indigo + '66', colors.background]}
          style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
        />
        
        {/* Decorative Orbs */}
        <View style={[s.orb, { top: -100, right: -50, backgroundColor: CultureTokens.indigo, opacity: 0.3, filter: 'blur(80px)' } as any]} />
        <View style={[s.orb, { top: 300, left: -100, backgroundColor: CultureTokens.saffron, opacity: 0.15, filter: 'blur(100px)' } as any]} />

        {/* Top Bar — Location, Search, Notifications */}
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.topBarGradient}
        >
          <View style={s.topBar}>
            <Pressable
              onPress={() => goBackOrReplace('/(tabs)')}
              style={({ pressed }) => [s.headerIconBtn, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              </Pressable>
            <Text style={[TextStyles.title2, { color: '#FFFFFF', flex: 1, textAlign: 'center' }]}>Search</Text>
            <View style={s.topBarActions}>
              <LocationPicker
                variant="icon"
                iconColor="#FFFFFF"
                buttonStyle={s.headerIconBtn}
              />
              <Pressable
                onPress={openNotifications}
                style={({ pressed }) => [s.headerIconBtn, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                {isAuthenticated && <View style={s.notifDot} />}
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        <View style={[s.shell, isDesktop && s.desktopShell]}>
          <View style={s.header}>
            <View style={s.searchBarContainer}>
              {Platform.OS === 'ios' || isWeb ? (
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backgroundSecondary }]} />
              )}
              <View style={[s.searchBarInner, { borderColor: searchFocused ? CultureTokens.indigo : colors.borderLight, backgroundColor: colors.surface + '40' }]}>
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
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} hitSlop={10} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {query.length > 0 && allResults.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.typeRow} style={{ flexGrow: 0 }}>
              <Pressable
                style={[s.typeChip, { backgroundColor: selectedType === 'all' ? CultureTokens.indigo : colors.surface, borderColor: selectedType === 'all' ? CultureTokens.indigo : colors.borderLight }]}
                onPress={() => { if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedType('all'); }}
              >
                <Text style={[TextStyles.captionSemibold, { color: selectedType === 'all' ? '#FFFFFF' : colors.textSecondary }]}>All ({typeCounts.all})</Text>
              </Pressable>
              {(Object.keys(TYPE_CONFIG) as ResultType[]).filter(t => typeCounts[t]).map(type => (
                <Pressable
                  key={type}
                  style={[s.typeChip, { backgroundColor: selectedType === type ? TYPE_CONFIG[type].color + '20' : colors.surface, borderColor: selectedType === type ? TYPE_CONFIG[type].color : colors.borderLight }]}
                  onPress={() => { if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedType(type); }}
                >
                  <Ionicons name={TYPE_CONFIG[type].icon} size={14} color={selectedType === type ? TYPE_CONFIG[type].color : colors.textTertiary} />
                  <Text style={[TextStyles.captionSemibold, { color: selectedType === type ? TYPE_CONFIG[type].color : colors.textSecondary }]}> 
                    {TYPE_CONFIG[type].label} ({typeCounts[type]})
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
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
                          community: '/(tabs)/community',
                        };
                        router.push(routes[key] as never);
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
                          <Ionicons name={result.icon as never} size={24} color={result.color} />
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
  orb: { position: 'absolute', width: 400, height: 400, borderRadius: 200 },
  desktopShell: { maxWidth: 800, width: '100%', alignSelf: 'center' },
  topBarGradient: { zIndex: 10, elevation: 10 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  topBarTitle: { flex: 1, fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#FFFFFF', textAlign: 'center' },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    borderColor: '#FFFFFF',
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: HeaderTokens.paddingHorizontal, paddingVertical: 12 },
  searchBarContainer: { flex: 1, borderRadius: 16, height: 48, overflow: 'hidden', backgroundColor: colors.backgroundSecondary },
  searchBarInner: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, borderWidth: 1, height: '100%' },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Poppins_500Medium', paddingVertical: 0, minWidth: 0, color: colors.text },
  
  typeRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 16, paddingTop: 4 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  typeChipText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  
  suggestionsContainer: { paddingHorizontal: 20, paddingTop: 20 },
  suggestionsTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 16, color: colors.text },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suggestionPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  suggestionText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text },
  
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { 
    width: '31%' as never, 
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

import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Share, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { routeWithRedirect } from '@/lib/routes';
import { useColors } from '@/hooks/useColors';
import { ButtonTokens, CardTokens, CultureTokens , TextStyles } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import { goBackOrReplace } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';

// Third-party cinema brand colours — not part of the CulturePass token system
const HOYTS_BRAND_COLOR = '#D90429';
const EVENT_CINEMAS_BRAND_COLOR = '#0055A5';

export default function MovieDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  const handleTicketPress = (url: string) => {
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please sign in to buy tickets.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push(routeWithRedirect('/(onboarding)/login', pathname)) },
      ]);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(url);
  };
  
  const { data: movie, isLoading } = useQuery({
    queryKey: ['/api/movies', id],
    queryFn: () => api.movies.get(id),
    enabled: !!id,
  });

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = `https://culturepass.app/movies/${id}`;
      await Share.share({
        title: movie?.title ?? '',
        message: movie ? `Check out ${movie.title} on CulturePass! ${movie.genre?.join(', ')} - ${movie.duration}. Rating: ${movie.imdbScore}/10. Book tickets now!\n\n${shareUrl}` : shareUrl,
        url: shareUrl,
      });
    } catch {}
  };

  if (isLoading) return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Pressable 
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              goBackOrReplace('/(tabs)');
            }} 
            style={styles.headerBtn} 
            hitSlop={10} 
            accessibilityRole="button" 
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Skeleton width="45%" height={18} borderRadius={8} />
          <View style={styles.headerBtn} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Skeleton width="100%" height={280} borderRadius={0} />
          <View style={{ padding: 20, gap: 14 }}>
            <Skeleton width="70%" height={28} borderRadius={10} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Skeleton width={72} height={30} borderRadius={12} />
              <Skeleton width={58} height={30} borderRadius={12} />
              <Skeleton width={48} height={30} borderRadius={12} />
            </View>
            <Skeleton width="100%" height={14} borderRadius={6} />
            <Skeleton width="88%" height={14} borderRadius={6} />
            <Skeleton width="94%" height={14} borderRadius={6} />
            <Skeleton width="72%" height={14} borderRadius={6} />
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
  
  if (!movie) return (
    <ErrorBoundary>
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontFamily: 'Poppins_500Medium' }}>Movie not found</Text>
      </View>
    </ErrorBoundary>
  );

  return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: topInset }]}> 
        <View style={styles.header}>
          <Pressable 
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              goBackOrReplace('/(tabs)');
            }} 
            style={styles.headerBtn} 
            hitSlop={10} 
            accessibilityRole="button" 
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{movie.title}</Text>
          <Pressable style={styles.headerBtn} hitSlop={10} onPress={handleShare} accessibilityRole="button" accessibilityLabel={`Share ${movie.title}`}>
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 120 }}>
          <View style={styles.posterArea}>
            <Image source={{ uri: movie.posterUrl }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" transition={200} />
            <View style={styles.posterBadge}>
              <Ionicons name="star" size={14} color={CultureTokens.gold} />
              <Text style={styles.posterScore}>{movie.imdbScore}</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.cpidRow}>
              <Ionicons name="finger-print-outline" size={15} color={CultureTokens.gold} />
              <Text style={[TextStyles.labelSemibold, { color: CultureTokens.gold, fontSize: 11 }]}>CPID: {(movie).culturePassId || movie.id}</Text>
            </View>
            <Text style={[TextStyles.display, { color: colors.text, letterSpacing: -0.5 }]}>{movie.title}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.metaPill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}><Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{movie.language}</Text></View>
              <View style={[styles.metaPill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}><Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{movie.duration}</Text></View>
              <View style={[styles.metaPill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}><Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{movie.rating}</Text></View>
            </View>
            <View style={styles.genreRow}>
              {(movie.genre ?? []).map((g: string) => (
                <View key={g} style={[styles.genrePill, { backgroundColor: CultureTokens.gold + '15' }]}> 
                  <Text style={[TextStyles.captionSemibold, { color: CultureTokens.gold }]}>{g}</Text>
                </View>
              ))}
            </View>
            <Text style={[TextStyles.body, { color: colors.textSecondary, lineHeight: 24 }]}>{movie.description}</Text>
            <View style={styles.crewSection}>
              <Text style={styles.crewLabel}>Director</Text>
              <Text style={styles.crewValue}>{movie.director}</Text>
            </View>
            <View style={styles.crewSection}>
              <Text style={styles.crewLabel}>Cast</Text>
              <Text style={styles.crewValue}>{movie.cast?.join(', ')}</Text>
            </View>
          </View>

          {movie.showtimes && movie.showtimes.length > 0 && (
            <View style={styles.showtimeSection}>
              <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>Where to Watch</Text>
              {movie.showtimes.map((st: any, ci: number) => (
                <View key={ci} style={styles.cinemaBlock}>
                  <Card padding={16} radius={CardTokens.radius} style={{ backgroundColor: colors.surface }}>
                    <View style={styles.cinemaHeader}>
                      <View style={styles.cinemaIconBox}>
                        <Ionicons name="location" size={16} color={CultureTokens.gold} />
                      </View>
                      <Text style={[TextStyles.headline, { color: colors.text, flex: 1 }]}>{st.venueName}</Text>
                      <Text style={[TextStyles.title3, { color: CultureTokens.gold }]}>From ${st.price}</Text>
                    </View>
                    <View style={styles.timesRow}>
                      <Card padding={12} radius={12} style={{ minWidth: 80, alignItems: 'center', backgroundColor: colors.backgroundSecondary }}>
                        <Text style={[TextStyles.labelSemibold, { color: colors.text }]}>{st.time}</Text>
                      </Card>
                    </View>
                  </Card>
                </View>
              ))}

              <View style={styles.externalLinksSection}>
                <Text style={[TextStyles.headline, { color: colors.text, marginBottom: 12 }]}>Buy Tickets Online</Text>
                <Pressable 
                  style={({pressed}) => [styles.externalBtn, { backgroundColor: HOYTS_BRAND_COLOR, opacity: pressed ? 0.8 : 1 }]} 
                  onPress={() => handleTicketPress('https://www.hoyts.com.au/movies')} 
                  accessibilityRole="button"
                > 
                  <Ionicons name="open-outline" size={18} color="#FFF" />
                  <Text style={[TextStyles.headline, { color: '#FFF' }]}>Hoyts Cinemas</Text>
                </Pressable>
                <Pressable 
                  style={({pressed}) => [styles.externalBtn, { backgroundColor: EVENT_CINEMAS_BRAND_COLOR, opacity: pressed ? 0.8 : 1 }]} 
                  onPress={() => handleTicketPress('https://www.eventcinemas.com.au/Movies')} 
                  accessibilityRole="button"
                > 
                  <Ionicons name="open-outline" size={18} color="#FFF" />
                  <Text style={[TextStyles.headline, { color: '#FFF' }]}>Event Cinemas</Text>
                </Pressable>
                <Pressable 
                  style={({pressed}) => [styles.externalBtn, { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight, opacity: pressed ? 0.8 : 1 }]} 
                  onPress={() => handleTicketPress('https://www.dendy.com.au/movies')} 
                  accessibilityRole="button"
                > 
                  <Ionicons name="open-outline" size={18} color={colors.text} />
                  <Text style={[TextStyles.headline, { color: colors.text }]}>Dendy Cinemas</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}> 
          <View>
            <Text style={[TextStyles.title2, { color: colors.text, fontSize: 24 }]}>From ${movie.showtimes?.[0]?.price || '—'}</Text>
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>at nearby cinemas</Text>
          </View>
          <Pressable
            style={({pressed}) => [styles.bookButton, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              const query = encodeURIComponent(`${movie.title} movie tickets ${movie.city || ''}`);
              handleTicketPress(`https://www.google.com/search?q=${query}`);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Book tickets for ${movie.title}`}
          >
            <Ionicons name="ticket" size={18} color={colors.background} />
            <Text style={[TextStyles.headline, { color: colors.background }]}>Find Tickets</Text>
          </Pressable>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    fontSize: 18, 
    fontFamily: 'Poppins_700Bold', 
    color: colors.text, 
    flex: 1, 
    textAlign: 'center', 
    marginHorizontal: 12,
  },
  posterArea: { height: 280, position: 'relative', overflow: 'hidden' },
  posterBadge: { 
    position: 'absolute', 
    bottom: 16, 
    right: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(11,11,20,0.8)', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.3)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 }
    })
  },
  posterScore: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: 0.5 },
  infoSection: { padding: CardTokens.padding + 4, gap: 16 },
  cpidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CultureTokens.gold + '33',
    backgroundColor: CultureTokens.gold + '14',
  },
  cpidText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: CultureTokens.gold,
  },
  movieTitle: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaPill: { 
    backgroundColor: colors.backgroundSecondary, 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: CardTokens.radius - 4,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  metaPillText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genrePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  genrePillText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  description: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 24 },
  crewSection: { flexDirection: 'row', gap: 12 },
  crewLabel: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text, width: 80 },
  crewValue: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, flex: 1, lineHeight: 22 },
  
  showtimeSection: { paddingHorizontal: CardTokens.padding + 4, gap: 16, paddingTop: 12 },
  showtimeTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  cinemaBlock: { gap: 12 },
  cinemaHeader: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: colors.surface, 
    borderRadius: CardTokens.radius,
    padding: CardTokens.padding,
    borderWidth: 1, 
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.3)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: { elevation: 8 }
    })
  },
  cinemaIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: CultureTokens.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cinemaName: { flex: 1, fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  cinemaPrice: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingLeft: 4 },
  timeChip: { 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: CardTokens.radius - 2,
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.borderLight 
  },
  timeText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  
  externalLinksSection: { marginTop: 24, gap: 12 },
  externalLinksTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text, marginBottom: 4 },
  externalBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    paddingHorizontal: CardTokens.padding + 4,
    paddingVertical: CardTokens.padding,
    borderRadius: ButtonTokens.radius,
  },
  externalBtnText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.background },
  
  bottomBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: CardTokens.padding + 4,
    paddingTop: 16, 
    backgroundColor: colors.surface,
    borderTopWidth: 1, 
    borderTopColor: colors.borderLight 
  },
  bottomPrice: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.5 },
  bottomLabel: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textTertiary },
  bookButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: CultureTokens.gold, 
    paddingHorizontal: 28, 
    paddingVertical: 16, 
    borderRadius: ButtonTokens.radius,
  },
  bookButtonText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.background },
});

import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Alert, Share } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { ButtonTokens, CardTokens, CultureTokens } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import { goBackOrReplace } from '@/lib/navigation';

export default function ActivityDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: act, isLoading } = useQuery({
    queryKey: ['/api/activities', id],
    queryFn: () => api.activities.get(id),
    enabled: !!id,
  });

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = `https://culturepass.app/activities/${id}`;
      await Share.share({
        title: `${act?.name} on CulturePass`,
        message: `Check out ${act?.name} on CulturePass! ${act?.category} - ${act?.duration}. ${act?.location}. ${act?.priceLabel}. Rating: ${act?.rating}/5.\n\n${shareUrl}`,
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
          <Skeleton width="100%" height={260} borderRadius={0} />
          <View style={{ padding: 20, gap: 16 }}>
            <Skeleton width="70%" height={28} borderRadius={10} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Skeleton width={90} height={32} borderRadius={12} />
              <Skeleton width={80} height={32} borderRadius={12} />
              <Skeleton width={75} height={32} borderRadius={12} />
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[0,1,2,3,4].map(k => <Skeleton key={k} width={18} height={18} borderRadius={9} />)}
            </View>
            <Skeleton width="100%" height={14} borderRadius={6} />
            <Skeleton width="85%" height={14} borderRadius={6} />
            <Skeleton width="92%" height={14} borderRadius={6} />
            <Skeleton width="100%" height={56} borderRadius={16} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );

  if (!act) return (
    <ErrorBoundary>
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontFamily: 'Poppins_500Medium' }}>Activity not found</Text>
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
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{act.name}</Text>
          <Pressable style={styles.headerBtn} hitSlop={10} onPress={handleShare} accessibilityRole="button">
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 100 }}>
          <View style={styles.banner}>
            <Image source={{ uri: act.imageUrl }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" transition={200} />
            {act.isPopular && (
              <View style={styles.popularBadge}>
                <Ionicons name="flame" size={14} color={colors.background} />
                <Text style={styles.popularText}>Popular</Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <View style={styles.cpidRow}>
              <Ionicons name="finger-print-outline" size={15} color={CultureTokens.teal} />
              <Text style={styles.cpidText}>CPID: {(act as any).culturePassId || act.id}</Text>
            </View>
            <Text style={styles.name}>{act.name}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="compass" size={14} color={CultureTokens.teal} />
                <Text style={styles.metaText}>{act.category}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="time" size={14} color={CultureTokens.teal} />
                <Text style={styles.metaText}>{act.duration}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="people" size={14} color={CultureTokens.teal} />
                <Text style={styles.metaText}>{act.ageGroup}</Text>
              </View>
            </View>

            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons 
                  key={s} 
                  name={s <= Math.floor(act.rating ?? 0) ? "star" : "star-outline"} 
                  size={18} 
                  color={CultureTokens.gold} 
                />
              ))}
              <Text style={styles.ratingNum}>{act.rating}</Text>
              <Text style={styles.reviewCount}>({act.reviewsCount ?? 0} reviews)</Text>
            </View>
            
            <Text style={styles.desc}>{act.description}</Text>

            <View style={styles.locCard}>
              <View style={styles.locIconBox}>
                <Ionicons name="location" size={20} color={CultureTokens.teal} />
              </View>
              <Text style={styles.locText}>{act.location}</Text>
            </View>

            {act.highlights && act.highlights.length > 0 && (
              <>
                <Text style={styles.subTitle}>Highlights</Text>
                <View style={styles.highlightGrid}>
                  {act.highlights.map((h: string) => (
                    <View key={h} style={styles.highlightItem}>
                      <Ionicons name="checkmark-circle" size={20} color={CultureTokens.success} />
                      <Text style={styles.highlightText}>{h}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}>
          <Text style={styles.bottomPrice}>{act.priceLabel}</Text>
          <Pressable 
            style={styles.bookBtn} 
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Booking Confirmed!', `Your booking for ${act.name} has been confirmed.\n\nPrice: ${act.priceLabel}`);
            }}
          >
            <Ionicons name="ticket" size={20} color={colors.background} />
            <Text style={styles.bookText}>Book Now</Text>
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
    paddingVertical: 12 
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
    marginHorizontal: 12 
  },
  banner: { height: 260, position: 'relative', overflow: 'hidden' },
  popularBadge: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: CultureTokens.teal, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CultureTokens.teal + '50',
  },
  popularText: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.background, letterSpacing: 0.5, textTransform: 'uppercase' },
  info: { padding: CardTokens.padding + 4, gap: 16 },
  cpidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CultureTokens.teal + '33',
    backgroundColor: CultureTokens.teal + '14',
  },
  cpidText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: CultureTokens.teal,
  },
  name: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.5 },
  
  metaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: colors.backgroundSecondary, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: CardTokens.radius - 4,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  metaText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNum: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold, marginLeft: 6 },
  reviewCount: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginLeft: 4 },
  
  desc: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 24 },
  
  locCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14, 
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
  locIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: CultureTokens.teal + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locText: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1, lineHeight: 22 },
  
  subTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text, marginTop: 12 },
  highlightGrid: { gap: 12 },
  highlightItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: colors.surface, 
    borderRadius: CardTokens.radius,
    padding: CardTokens.padding,
    borderWidth: 1, 
    borderColor: colors.borderLight,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.2)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 4 }
    })
  },
  highlightText: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1 },
  
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
  bottomPrice: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.5 },
  bookBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: CultureTokens.teal, 
    paddingHorizontal: 28, 
    paddingVertical: 16, 
    borderRadius: ButtonTokens.radius,
  },
  bookText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.background },
});

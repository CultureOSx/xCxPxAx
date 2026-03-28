import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Share } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ShopDeal } from '@/shared/schema';
import { ButtonTokens, CardTokens, CultureTokens } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import { useColors } from '@/hooks/useColors';
import { goBackOrReplace } from '@/lib/navigation';

export default function ShoppingDetailScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const { data: store, isLoading } = useQuery({
    queryKey: ['/api/shopping', id],
    queryFn: () => api.shopping.get(id),
    enabled: !!id,
  });

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = `https://culturepass.app/shopping/${id}`;
      await Share.share({
        title: `${store?.name} on CulturePass`,
        message: `Check out ${store?.name} on CulturePass! ${store?.category} - ${store?.location}. Rating: ${store?.rating}/5 (${store?.reviewsCount ?? 0} reviews).${(store?.deals?.length ?? 0) > 0 ? ` ${store?.deals?.length} deals available!` : ''}\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {}
  };

  if (isLoading) return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={styles.headerBtn} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Skeleton width="45%" height={18} borderRadius={8} />
          <View style={styles.headerBtn} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Skeleton width="100%" height={240} borderRadius={0} />
          <View style={{ padding: 20, gap: 14 }}>
            <Skeleton width="65%" height={28} borderRadius={10} />
            <Skeleton width="40%" height={15} borderRadius={6} />
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[0,1,2,3,4].map(k => <Skeleton key={k} width={18} height={18} borderRadius={9} />)}
            </View>
            <Skeleton width="100%" height={14} borderRadius={6} />
            <Skeleton width="88%" height={14} borderRadius={6} />
            <Skeleton width="100%" height={56} borderRadius={16} style={{ marginTop: 8 }} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Skeleton width={140} height={40} borderRadius={12} />
              <Skeleton width={100} height={40} borderRadius={12} />
            </View>
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );

  if (!store) return (
    <ErrorBoundary>
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontFamily: 'Poppins_500Medium' }}>Store not found</Text>
      </View>
    </ErrorBoundary>
  );

  return (
    <ErrorBoundary>
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrReplace('/(tabs)')} style={styles.headerBtn} hitSlop={10} accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{store.name}</Text>
          <Pressable style={styles.headerBtn} hitSlop={10} onPress={handleShare} accessibilityRole="button">
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 80 }}>
          <View style={styles.banner}>
            <Image source={{ uri: store.imageUrl }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" transition={200} />
            {store.isOpen && (
              <View style={styles.openBadge}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>Open Now</Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <View style={styles.cpidRow}>
              <Ionicons name="finger-print-outline" size={15} color={CultureTokens.indigo} />
              <Text style={styles.cpidText}>CPID: {store.culturePassId || store.id}</Text>
            </View>
            <Text style={styles.name}>{store.name}</Text>
            <Text style={styles.cat}>{store.category}</Text>
            
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons 
                  key={s} 
                  name={s <= Math.floor(store.rating ?? 0) ? "star" : "star-outline"} 
                  size={18} 
                  color={CultureTokens.gold} 
                />
              ))}
              <Text style={styles.ratingNum}>{store.rating}</Text>
              <Text style={styles.reviewCount}>({store.reviewsCount ?? 0} reviews)</Text>
            </View>
            
            <Text style={styles.desc}>{store.description}</Text>

            <View style={styles.locCard}>
              <View style={[styles.locIconBox, { backgroundColor: CultureTokens.indigo + '15' }]}>
                <Ionicons name="location" size={20} color={CultureTokens.indigo} />
              </View>
              <Text style={styles.locText}>{[store.address, store.city, store.country].filter(Boolean).join(", ")}</Text>
            </View>

            <View style={styles.featureRow}>
              {store.deliveryAvailable && (
                <View style={[styles.featurePill, { backgroundColor: CultureTokens.indigo + '15', borderColor: CultureTokens.indigo + '30' }]}>
                  <Ionicons name="bicycle" size={16} color={CultureTokens.indigo} />
                  <Text style={[styles.featureText, { color: CultureTokens.indigo }]}>Delivery Available</Text>
                </View>
              )}
              {store.isOpen && (
                <View style={[styles.featurePill, { backgroundColor: CultureTokens.success + '15', borderColor: CultureTokens.success + '30' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={CultureTokens.success} />
                  <Text style={[styles.featureText, { color: CultureTokens.success }]}>Open Now</Text>
                </View>
              )}
            </View>

            {(store.deals?.length ?? 0) > 0 && (
              <View style={styles.dealsSection}>
                <Text style={styles.subTitle}>Current Deals & Offers</Text>
                {(store.deals ?? []).map((deal: ShopDeal, i: number) => (
                  <View key={i} style={styles.dealCard}>
                    <View style={styles.dealHeader}>
                      <View style={styles.dealIconBox}>
                        <Ionicons name="pricetag" size={16} color={CultureTokens.indigo} />
                      </View>
                      <Text style={styles.dealTitle}>{deal.title}</Text>
                    </View>
                    <View style={styles.dealBody}>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{deal.discount}</Text>
                      </View>
                      <Text style={styles.dealValid}>Valid till {new Date(deal.validTill).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
          </View>
        </ScrollView>
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
    paddingHorizontal: CardTokens.padding + 4,
    paddingVertical: 12 
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: ButtonTokens.radiusPill,
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
  banner: { height: 240, position: 'relative', overflow: 'hidden' },
  openBadge: { 
    position: 'absolute', 
    top: 16, 
    right: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: colors.surface,
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  openDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: CultureTokens.success },
  openText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text, letterSpacing: 0.5, textTransform: 'uppercase' },
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
    borderColor: CultureTokens.indigo + '33',
    backgroundColor: CultureTokens.indigo + '14',
  },
  cpidText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: CultureTokens.indigo,
  },
  name: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.5 },
  cat: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
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
  },
  locIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locText: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1, lineHeight: 22 },
  
  featureRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  featurePill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 14, 
    paddingVertical: 12,
    borderRadius: CardTokens.radius - 4,
    borderWidth: 1,
  },
  featureText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  
  dealsSection: { marginTop: 12, gap: 12 },
  subTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text, marginBottom: 4 },
  dealCard: { 
    backgroundColor: colors.surface,
    borderRadius: CardTokens.radiusLarge,
    borderWidth: 1, 
    borderColor: CultureTokens.indigo + '30', 
    overflow: 'hidden' 
  },
  dealHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: CardTokens.padding,
    borderBottomWidth: 1, 
    borderBottomColor: colors.borderLight,
  },
  dealIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: CultureTokens.indigo + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealTitle: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text, flex: 1 },
  dealBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: CardTokens.padding },
  discountBadge: { backgroundColor: CultureTokens.indigo, paddingHorizontal: CardTokens.padding, paddingVertical: 8, borderRadius: CardTokens.radius - 4 },
  discountText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: colors.background },
  dealValid: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
});

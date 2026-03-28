import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Alert, Linking, Share } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ButtonTokens, CardTokens, CultureTokens } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import { useColors } from '@/hooks/useColors';
import { goBackOrReplace } from '@/lib/navigation';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const styles = getStyles(colors);

  const { data: rest, isLoading } = useQuery({
    queryKey: ['/api/restaurants', id],
    queryFn: () => api.restaurants.get(id),
    enabled: !!id,
  });

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = `https://culturepass.app/restaurants/${id}`;
      await Share.share({
        title: `${rest?.name} on CulturePass`,
        message: `Check out ${rest?.name} on CulturePass! ${rest?.cuisine} - ${rest?.priceRange}. ${rest?.address}. Rating: ${rest?.rating}/5 (${rest?.reviewsCount} reviews).\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch {}
  };

  const handleReserve = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Reservation Request', `Your reservation request at ${rest?.name} has been submitted. You will receive a confirmation shortly.`, [{ text: 'OK' }]);
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
          <Skeleton width="100%" height={280} borderRadius={0} />
          <View style={{ padding: 20, gap: 14 }}>
            <Skeleton width="65%" height={28} borderRadius={10} />
            <Skeleton width="50%" height={15} borderRadius={6} />
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[0,1,2,3,4].map(k => <Skeleton key={k} width={18} height={18} borderRadius={9} />)}
            </View>
            <Skeleton width="100%" height={14} borderRadius={6} />
            <Skeleton width="90%" height={14} borderRadius={6} />
            <Skeleton width="80%" height={14} borderRadius={6} />
            <Skeleton width="100%" height={120} borderRadius={20} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );

  if (!rest) return (
    <ErrorBoundary>
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontFamily: 'Poppins_500Medium' }}>Restaurant not found</Text>
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
          <Text style={styles.headerTitle} numberOfLines={1}>{rest.name}</Text>
          <Pressable style={styles.headerBtn} hitSlop={10} onPress={handleShare} accessibilityRole="button">
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 100 }}>
          <View style={styles.banner}>
            <Image source={{ uri: rest.imageUrl }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" transition={200} />
            {rest.isOpen && (
              <View style={styles.openBadge}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>Open Now</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.cpidRow}>
              <Ionicons name="finger-print-outline" size={15} color={CultureTokens.coral} />
              <Text style={styles.cpidText}>CPID: {rest.culturePassId || rest.id}</Text>
            </View>
            <Text style={styles.name}>{rest.name}</Text>
            <Text style={styles.cuisine}>{rest.cuisine} | {rest.priceRange} | {rest.reviewsCount ?? 0} reviews</Text>
            
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons 
                  key={s} 
                  name={s <= Math.floor(rest.rating ?? 0) ? "star" : s - 0.5 <= (rest.rating ?? 0) ? "star-half" : "star-outline"} 
                  size={18} 
                  color={CultureTokens.gold} 
                />
              ))}
              <Text style={styles.ratingNum}>{rest.rating}</Text>
            </View>
            
            <Text style={styles.desc}>{rest.description}</Text>

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBox, { backgroundColor: CultureTokens.coral + '15' }]}>
                  <Ionicons name="time" size={18} color={CultureTokens.coral} />
                </View>
                <Text style={styles.detailText}>{rest.hours || 'Hours not available'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBox, { backgroundColor: CultureTokens.coral + '15' }]}>
                  <Ionicons name="location" size={18} color={CultureTokens.coral} />
                </View>
                <Text style={styles.detailText}>{rest.address}</Text>
              </View>
              <View style={styles.divider} />
              <Pressable 
                style={({ pressed }) => [styles.detailRow, pressed && { opacity: 0.7 }]} 
                onPress={() => Linking.openURL(`tel:${rest.phone}`)}
              >
                <View style={[styles.detailIconBox, { backgroundColor: CultureTokens.coral + '15' }]}>
                  <Ionicons name="call" size={18} color={CultureTokens.coral} />
                </View>
                <Text style={[styles.detailText, { color: CultureTokens.coral, fontFamily: 'Poppins_600SemiBold' }]}>{rest.phone}</Text>
              </Pressable>
            </View>

            {rest.features && rest.features.length > 0 && (
              <>
                <Text style={styles.subTitle}>Features</Text>
                <View style={styles.featureGrid}>
                  {rest.features.map((f: string) => (
                    <View key={f} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={CultureTokens.success} />
                      <Text style={styles.featureLabel}>{f}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {rest.menuHighlights && rest.menuHighlights.length > 0 && (
              <>
                <Text style={styles.subTitle}>Menu Highlights</Text>
                <View style={styles.menuGrid}>
                  {rest.menuHighlights.map((item: string) => (
                    <View key={item} style={styles.menuItem}>
                      <Ionicons name="restaurant-outline" size={16} color={CultureTokens.coral} />
                      <Text style={styles.menuItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}>
          <Pressable style={styles.callButton} onPress={() => Linking.openURL(`tel:${rest.phone}`)}>
            <Ionicons name="call" size={20} color={CultureTokens.coral} />
          </Pressable>
          {rest.reservationAvailable ? (
            <Pressable style={styles.reserveButton} onPress={handleReserve}>
              <Ionicons name="calendar" size={18} color={colors.background} />
              <Text style={styles.reserveText}>Make Reservation</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.reserveButton, { backgroundColor: CultureTokens.gold }]} onPress={() => Alert.alert('Order', 'Opening delivery options...')}>
              <Ionicons name="bicycle" size={18} color={colors.background} />
              <Text style={[styles.reserveText, { color: colors.background }]}>Order Delivery</Text>
            </Pressable>
          )}
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
  banner: { height: 280, position: 'relative', overflow: 'hidden' },
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
    borderColor: CultureTokens.coral + '33',
    backgroundColor: CultureTokens.coral + '14',
  },
  cpidText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: CultureTokens.coral,
  },
  name: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.text, letterSpacing: -0.5 },
  cuisine: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNum: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: CultureTokens.gold, marginLeft: 6 },
  desc: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, lineHeight: 24 },
  
  detailCard: { 
    backgroundColor: colors.surface,
    borderRadius: CardTokens.radiusLarge,
    borderWidth: 1, 
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginTop: 12,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: CardTokens.padding },
  detailIconBox: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  detailText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 66 },
  
  subTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text, marginTop: 12 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: CultureTokens.success + '15', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: CardTokens.radius - 4,
    borderWidth: 1,
    borderColor: CultureTokens.success + '30',
  },
  featureLabel: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  
  menuGrid: { gap: 12 },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: colors.surface,
    borderRadius: CardTokens.radius - 2,
    padding: 14, 
    borderWidth: 1, 
    borderColor: colors.borderLight,
  },
  menuItemText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1 },
  
  bottomBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    paddingHorizontal: CardTokens.padding + 4,
    paddingTop: 16, 
    backgroundColor: colors.surface,
    borderTopWidth: 1, 
    borderTopColor: colors.borderLight,
  },
  callButton: { 
    width: 56,
    height: 56,
    borderRadius: ButtonTokens.radius,
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: CultureTokens.coral + '15',
    borderWidth: 1, 
    borderColor: CultureTokens.coral + '50',
  },
  reserveButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    backgroundColor: CultureTokens.coral, 
    height: 56, 
    borderRadius: ButtonTokens.radius,
  },
  reserveText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: colors.background },
});

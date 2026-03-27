// app/checkout/index.tsx
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Pressable,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventData } from '@/shared/schema';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/Skeleton';
import { BlurView } from 'expo-blur';
import Animated, { SlideInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { getCurrencyForCountry, formatCurrency } from '@/lib/currency';

const isWeb = Platform.OS === 'web';

export default function CheckoutPage() {
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const tierName = params.tierName as string;
  const quantity = parseInt((params.quantity as string) || '1', 10);
  const basePriceCents = parseInt((params.priceCents as string) || '0', 10);

  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { userId } = useAuth();

  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: event, isLoading: eventLoading } = useQuery<EventData>({
    queryKey: ['/api/events', eventId],
    queryFn: () => api.events.get(eventId) as Promise<EventData>,
    enabled: !!eventId,
  });

  const totalPriceCents = discountApplied
    ? Math.max(0, (basePriceCents * quantity) - 500)
    : basePriceCents * quantity;

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (promoCode.toLowerCase() === 'culture5') {
      setDiscountApplied(true);
    } else {
      Alert.alert('Invalid', 'Promo code not found.');
    }
  };

  const handleCheckout = async () => {
    if (!userId) {
      Alert.alert('Login Required', 'You must be signed in to purchase tickets.');
      return;
    }
    setLoading(true);
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (totalPriceCents === 0) {
        await api.tickets.purchase({ eventId, tierId: tierName, quantity });
        router.replace('/(tabs)');
        return;
      }
      const session = await api.stripe.createCheckoutSession({
        eventId, eventTitle: event?.title, eventDate: event?.date,
        tierName, quantity, totalPriceCents, currency: getCurrencyForCountry(event?.country),
      });
      if (session.checkoutUrl) {
        if (isWeb) window.location.href = session.checkoutUrl;
        else await WebBrowser.openBrowserAsync(session.checkoutUrl);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (eventLoading) {
    return (
      <View style={styles.screen}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Skeleton width={150} height={28} borderRadius={14} />
            <View style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </View>
          </View>
          <View style={styles.content}>
            <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 24 }} />
            <Skeleton width="100%" height={140} borderRadius={24} style={{ marginBottom: 24 }} />
            <Skeleton width="100%" height={52} borderRadius={16} style={{ marginBottom: 32 }} />
            <View style={styles.footer}>
              <View style={[styles.row, { marginBottom: 24 }]}>
                <Skeleton width={80} height={32} borderRadius={8} />
                <Skeleton width={120} height={32} borderRadius={8} />
              </View>
              <Skeleton width="100%" height={60} borderRadius={20} />
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      <Animated.View
        entering={SlideInDown.springify().damping(20)}
        style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Confirm Order</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.steps}>
            <View style={[styles.stepDot, { backgroundColor: CultureTokens.indigo }]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, { backgroundColor: CultureTokens.indigo }]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, { backgroundColor: colors.borderLight }]} />
          </View>

          <View style={styles.eventInfo}>
            <Image
              source={{ uri: event?.heroImageUrl || 'https://images.unsplash.com/photo-1543157145-f78c636d023d?q=80&w=400' }}
              style={styles.eventThumb}
              contentFit="cover"
            />
            <View style={styles.eventText}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>{event?.title}</Text>
              <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>{event?.date} • {event?.venue}</Text>
            </View>
          </View>

          <Card glass={!isDark} padding={20} style={styles.summaryCard}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Ticket</Text>
              <Text style={[styles.value, { color: colors.text }]}>{tierName}</Text>
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Quantity</Text>
              <Text style={[styles.value, { color: colors.text }]}>{quantity}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.value, { color: colors.text }]}>{formatCurrency(basePriceCents * quantity, event?.country)}</Text>
            </View>
          </Card>

          <View style={styles.promoWrap}>
            <TextInput
              style={[styles.promoInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
              placeholder="Promo Code"
              placeholderTextColor={colors.textTertiary}
              value={promoCode}
              onChangeText={setPromoCode}
            />
            <Button size="sm" variant="outline" onPress={handleApplyPromo} style={styles.promoBtn}>Apply</Button>
          </View>

          <View style={styles.footer}>
            <View style={styles.row}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: CultureTokens.gold }]}>
                {totalPriceCents === 0 ? 'Free' : formatCurrency(totalPriceCents, event?.country)}
              </Text>
            </View>
            {discountApplied && (
              <Text style={styles.discountTag}>-$5.00 Culture Loyalty Applied</Text>
            )}

            <Button
              variant="gradient"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleCheckout}
              style={styles.payBtn}
            >
              <Text style={styles.payBtnText}>
                {totalPriceCents === 0 ? 'Complete Order' : 'Checkout & Pay'}
              </Text>
            </Button>
            <Text style={[styles.secureText, { color: colors.textTertiary }]}>
              <Ionicons name="lock-closed" size={10} /> Secure checkout powered by Stripe
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end' },
  sheet: { 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    height: '85%', 
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px -8px 32px rgba(0,0,0,0.4)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
      },
      android: { elevation: 24 }
    })
  },
  handle: { width: 44, height: 5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3, alignSelf: 'center', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingTop: 0 },
  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, alignSelf: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLine: { width: 32, height: 2, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 8 },
  eventInfo: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  eventThumb: { width: 80, height: 80, borderRadius: 16 },
  eventText: { flex: 1, justifyContent: 'center' },
  eventTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  eventMeta: { fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 4 },
  summaryCard: { borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.02)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  value: { fontSize: 14, fontFamily: 'Poppins_700Bold' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 16 },
  promoWrap: { flexDirection: 'row', gap: 12, marginTop: 24 },
  promoInput: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontFamily: 'Poppins_500Medium' },
  promoBtn: { borderRadius: 12 },
  footer: { marginTop: 32 },
  totalLabel: { fontSize: 28, fontFamily: 'Poppins_700Bold' },
  totalValue: { fontSize: 28, fontFamily: 'Poppins_800ExtraBold' },
  discountTag: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: CultureTokens.teal, marginTop: 4 },
  payBtn: { marginTop: 24, height: 60, borderRadius: 20 },
  payBtnText: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_700Bold' },
  secureText: { textAlign: 'center', marginTop: 16, fontSize: 11, fontFamily: 'Poppins_600SemiBold', opacity: 0.6 },
});

import { View, Text, StyleSheet, ScrollView, Platform, Alert, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useIsDark } from '@/hooks/useColors';
import { TextStyles } from '@/constants/typography';
import { CultureTokens, BorderTokens } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EventData } from '@/shared/schema';
import { useAuth } from '@/lib/auth';

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
    ? Math.max(0, (basePriceCents * quantity) - 500) // fake $5 off
    : basePriceCents * quantity;

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (promoCode.toLowerCase() === 'culture5') {
      setDiscountApplied(true);
      Alert.alert('Promo Applied', '$5 discount applied to your order.');
    } else {
      Alert.alert('Invalid Promo', 'This promo code does not exist or has expired.');
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
        // Free ticket directly
        await api.tickets.purchase({
          eventId,
          tierId: tierName,
          quantity,
        });
        Alert.alert('Success', 'Your ticket has been reserved!', [
          { text: 'View Tickets', onPress: () => router.replace('/(tabs)') } // temp
        ]);
        return;
      }
      
      // Real checkout logic with Stripe integration
      const session = await api.stripe.createCheckoutSession({
        eventId,
        eventTitle: event?.title,
        eventDate: event?.date,
        tierName,
        quantity,
        totalPriceCents,
        currency: 'AUD',
      });

      if (session.checkoutUrl) {
        if (isWeb) {
          window.location.href = session.checkoutUrl;
        } else {
          // Native deep link redirect or open in webview (expo-web-browser)
          router.replace(session.checkoutUrl as never);
        }
      } else {
        Alert.alert('Checkout Flow Error', 'Backend did not return a valid Stripe session.');
      }
    } catch (error) {
      Alert.alert('Purchase Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const s = getStyles(colors);

  if (eventLoading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading Checkout...</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[TextStyles.headline, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={[TextStyles.title2, { color: colors.text, marginBottom: 16 }]}>Order Summary</Text>
        
        <Card glass={!isDark} padding={20} style={s.summaryCard}>
          <Text style={[TextStyles.headline, { color: colors.text }]}>{event?.title || 'Unknown Event'}</Text>
          <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
            {event?.date} • {event?.venue}
          </Text>
          <View style={s.divider} />
          
          <View style={s.row}>
            <Text style={[TextStyles.body, { color: colors.textSecondary }]}>Ticket Type</Text>
            <Text style={[TextStyles.headline, { color: colors.text }]}>{tierName}</Text>
          </View>
          <View style={[s.row, { marginTop: 8 }]}>
            <Text style={[TextStyles.body, { color: colors.textSecondary }]}>Quantity</Text>
            <Text style={[TextStyles.headline, { color: colors.text }]}>{quantity}</Text>
          </View>
          <View style={[s.row, { marginTop: 8 }]}>
            <Text style={[TextStyles.body, { color: colors.textSecondary }]}>Price</Text>
            <Text style={[TextStyles.headline, { color: colors.text }]}>
              {basePriceCents === 0 ? 'Free' : `$${(basePriceCents / 100).toFixed(2)}`}
            </Text>
          </View>
        </Card>

        {basePriceCents > 0 && (
          <View style={s.promoSection}>
            <Text style={[TextStyles.headline, { color: colors.text, marginBottom: 8 }]}>Promo Code</Text>
            {/* Promo input field mocked since we don't have TextInput imported rn to keep minimal */}
            <View style={s.promoInputMock}>
              <Text style={{ color: colors.textSecondary }}>Enter CULTURE5</Text>
              <Button size="sm" variant="outline" onPress={handleApplyPromo}>Apply</Button>
            </View>
          </View>
        )}

        <View style={s.totalSection}>
          <View style={s.row}>
            <Text style={[TextStyles.title2, { color: colors.text }]}>Total</Text>
            <Text style={[TextStyles.title2, { color: CultureTokens.saffron }]}>
              {totalPriceCents === 0 ? 'Free' : `$${(totalPriceCents / 100).toFixed(2)}`}
            </Text>
          </View>
          {discountApplied && (
            <Text style={[TextStyles.captionSemibold, { color: CultureTokens.teal, textAlign: 'right', marginTop: 4 }]}>
              -$5.00 discount applied
            </Text>
          )}
        </View>

        <Button 
          variant="gradient" 
          size="lg" 
          fullWidth 
          loading={loading}
          onPress={handleCheckout}
          style={{ marginTop: 24 }}
        >
          {totalPriceCents === 0 ? 'Confirm Free Order' : `Pay $${(totalPriceCents / 100).toFixed(2)}`}
        </Button>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  backBtn: {
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderRadius: 20,
    shadowColor: 'black',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoSection: {
    marginTop: 32,
  },
  promoInputMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  totalSection: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
});

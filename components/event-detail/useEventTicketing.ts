import { Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CultureTokens } from '@/constants/theme';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { getCurrencyForCountry } from '@/lib/currency';
import { routeWithRedirect } from '@/lib/routes';
import type { EventData } from '@/shared/schema';
import { isWeb } from './utils';

type BuyMode = 'single' | 'family' | 'group';

export function useEventTicketing({
  event,
  userId,
  pathname,
  setTicketModalVisible,
}: {
  event: EventData;
  userId: string | null | undefined;
  pathname: string;
  setTicketModalVisible: (visible: boolean) => void;
}) {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [buyMode, setBuyMode] = useState<BuyMode>('single');

  const eventTiers = event.tiers;
  const selectedTier = useMemo(
    () => eventTiers?.[selectedTierIndex] || { priceCents: 0, available: 0, name: 'Standard' },
    [eventTiers, selectedTierIndex],
  );

  const familySize = 4;
  const familyDiscount = 0.10;
  const groupDiscount = 0.15;

  const minQty = buyMode === 'group' ? 6 : 1;
  const maxQty = buyMode === 'family' ? 1 : Math.max(minQty, Math.min(20, selectedTier?.available || 20));

  const basePrice = selectedTier?.priceCents ?? 0;
  const rawTotal = buyMode === 'family' ? basePrice * familySize : basePrice * quantity;
  const discountRate = buyMode === 'family' ? familyDiscount : buyMode === 'group' ? groupDiscount : 0;
  const discountAmount = Math.round(rawTotal * discountRate);
  const totalPrice = rawTotal - discountAmount;
  const effectiveQty = buyMode === 'family' ? familySize : quantity;

  const handleExternalTicketPress = useCallback(async () => {
    const url = event.externalTicketUrl ?? event.externalUrl;
    if (!url) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    api.events.trackTicketClick(event.id).catch(() => {});
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open the ticket page.');
    }
  }, [event.id, event.externalTicketUrl, event.externalUrl]);

  const purchaseMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      return api.stripe.createCheckoutSession(body as {
        eventId: string;
        eventTitle?: string;
        eventDate?: string;
        tierName?: string;
        quantity?: number;
        totalPriceCents?: number;
        currency?: string;
      });
    },
    onSuccess: async (data: { checkoutUrl?: string; ticketId?: string }) => {
      if (!data.checkoutUrl) return;
      setPaymentLoading(true);
      setTicketModalVisible(false);
      try {
        const result = await WebBrowser.openBrowserAsync(data.checkoutUrl, {
          dismissButtonStyle: 'cancel',
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
        if ((result.type === 'cancel' || result.type === 'dismiss') && data.ticketId) {
          const ticket = await api.tickets.get(data.ticketId);
          if (ticket.paymentStatus === 'paid' || ticket.status === 'confirmed') {
            if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Ticket Purchased!', 'Your payment was successful.', [
              { text: 'View Ticket', onPress: () => router.push(`/tickets/${data.ticketId}`) },
              { text: 'OK' },
            ]);
          }
        }
      } catch {
        Alert.alert('Payment Error', 'Could not open payment page. Please try again.');
      } finally {
        setPaymentLoading(false);
      }
    },
    onError: (error: Error) => Alert.alert('Purchase Failed', error.message),
  });

  const purchaseFreeTicket = useCallback(async (body: Record<string, unknown>) => {
    try {
      const data = await api.tickets.purchase(body as { eventId: string; tierId?: string; quantity?: number });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setTicketModalVisible(false);
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Ticket Confirmed!', 'Your free ticket has been reserved.', [
        { text: 'View Ticket', onPress: () => router.push(`/tickets/${data.id}`) },
        { text: 'OK' },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to reserve ticket. Please try again.');
    }
  }, [setTicketModalVisible]);

  const handlePurchase = useCallback(() => {
    if (!userId) {
      Alert.alert('Login required', 'Please sign in to complete ticket purchase.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push(routeWithRedirect('/(onboarding)/login', pathname)) },
      ]);
      return;
    }
    const ticketLabel =
      buyMode === 'family'
        ? `${selectedTier.name} (Family Pack)`
        : buyMode === 'group'
          ? `${selectedTier.name} (Group)`
          : selectedTier.name;
    const body = {
      userId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventVenue: event.venue,
      tierName: ticketLabel,
      quantity: effectiveQty,
      totalPriceCents: totalPrice,
      currency: getCurrencyForCountry(event?.country),
      imageColor: event.imageColor ?? CultureTokens.indigo,
    };
    if (totalPrice <= 0) {
      purchaseFreeTicket(body);
      return;
    }
    purchaseMutation.mutate(body);
  }, [buyMode, effectiveQty, event, pathname, purchaseFreeTicket, purchaseMutation, selectedTier, totalPrice, userId]);

  return {
    eventTiers,
    isPurchasing: purchaseMutation.isPending,
    paymentLoading,
    selectedTierIndex,
    setSelectedTierIndex,
    quantity,
    setQuantity,
    buyMode,
    setBuyMode,
    selectedTier,
    minQty,
    maxQty,
    rawTotal,
    discountAmount,
    totalPrice,
    effectiveQty,
    handleExternalTicketPress,
    handlePurchase,
  };
}

import {
  View, Text, Pressable, ScrollView, Platform, Share, Modal, Alert,
  ActivityIndicator, Linking, StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, usePathname, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { goBackOrReplace } from '@/lib/navigation';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { useSaved } from '@/contexts/SavedContext';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/query-client';
import { TextStyles , CultureTokens } from '@/constants/theme';
import * as WebBrowser from 'expo-web-browser';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { calculateDistance } from '@shared/location/australian-postcodes';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { BlurView } from 'expo-blur';
import type { EventData } from '@/shared/schema';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { getCurrencyForCountry, formatCurrency } from '@/lib/currency';
import { formatEventTime } from '@/lib/dateUtils';
import { routeWithRedirect } from '@/lib/routes';
import { getStyles } from './_components/styles';
import { EventDetailSkeleton } from './_components/EventDetailSkeleton';
import { formatDate, promptRsvpLogin, confirmRemoveRsvp, cityToCoordinates, toCalendarDate, toGoogleCalendarTimestamp, buildICS, safeIcsFilenameBase, isWeb } from './_components/utils';
import { AdminToolbar } from '@/components/ui/AdminToolbar';
import { useRole } from '@/hooks/useRole';

// Third-party brand colours — not part of the CulturePass token system
const GOOGLE_BRAND_COLOR = '#4285F4';
const OUTLOOK_BRAND_COLOR = '#0078D4';

export default function EventDetailScreen() {
  const { id, adminMode } = useLocalSearchParams<{ id: string; adminMode?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const s = getStyles(colors, isDark);

  const { data: event, isLoading, isError } = useQuery<EventData>({
    queryKey: ['/api/events', id],
    queryFn: () => api.events.get(String(id)) as Promise<EventData>,
    enabled: !!id,
  });

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (isError || !event) {
    return (
      <View style={s.emptyContainer}>
        <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
        <Text style={[TextStyles.title2, { marginTop: 12, color: colors.text }]}>Event not found</Text>
        <Text style={[TextStyles.body, { textAlign: 'center', marginBottom: 20, color: colors.textSecondary }]}>
          This event may have been removed or is currently unavailable.
        </Text>
        <Button
          onPress={() => goBackOrReplace('/(tabs)')}
          variant="outline"
          size="md"
          leftIcon="home-outline"
        >
          Return Home
        </Button>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: event.title }} /><Head>
        <title>{`${event.title} | CulturePass`}</title>
        <meta name="description" content={event.description || `Join ${event.title} on CulturePass.`} />
        <meta property="og:title" content={`${event.title} | CulturePass`} />
        <meta property="og:description" content={event.description || `Join ${event.title} on CulturePass.`} />
        {event.imageUrl && <meta property="og:image" content={event.imageUrl} />}
        <meta property="og:url" content={`https://culturepass.app/event/${event.id}`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head><EventDetail event={event} insets={insets} adminMode={adminMode === 'true'} />
    </ErrorBoundary>
  );
}

function EventDetail({ event, insets, adminMode }: { event: EventData; insets: EdgeInsets; adminMode?: boolean }) {
  const { isEventSaved, toggleSaveEvent } = useSaved();
  const { userId } = useAuth();
  const { state: onboardingState } = useOnboarding();
  const colors = useColors();
  const isDark = useIsDark();
  const s = getStyles(colors, isDark);
  const saved = isEventSaved(event.id);
  const pathname = usePathname();
  const { isDesktop } = useLayout();
  const { isAdmin, isSuperAdmin } = useRole();
  const [showAdminTools, setShowAdminTools] = useState(adminMode && (isAdmin || isSuperAdmin));
  const topInset = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 34 : insets.bottom;

  const { uploadImage, deleteImage, uploading } = useImageUpload();

  const handlePickCover = useCallback(async () => {
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]) {
      try {
        if (event.imageUrl) {
          await deleteImage('events', event.id, event.imageUrl, 'imageUrl');
        }
        await uploadImage(result, 'events', event.id, 'imageUrl');
        // Hero image url is also kept in sync usually
        await api.events.update(event.id, { heroImageUrl: result.assets[0].uri });
        queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
      } catch (err) {
        Alert.alert('Upload Error', String(err));
      }
    }
  }, [event.id, event.imageUrl, uploadImage, deleteImage]);

  const canEdit = userId === event.organizerId || userId === event.createdBy || __DEV__;

  // Re-enabled localized distance mapping safely
  const distanceKm = useMemo(() => {
    if (!onboardingState.city || !event.city) return null;
    const userCoords = cityToCoordinates(onboardingState.city);
    const eventCoords = cityToCoordinates(event.city);
    if (!userCoords || !eventCoords) return null;
    return calculateDistance(userCoords.latitude, userCoords.longitude, eventCoords.latitude, eventCoords.longitude);
  }, [onboardingState.city, event.city]);
  
  const [now, setNow] = useState(() => new Date());
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [buyMode, setBuyMode] = useState<"single" | "family" | "group">("single");

  const { data: membership } = useQuery<{ tier: string; cashbackMultiplier?: number; }>({
    queryKey: [`/api/membership/${userId}`],
    queryFn: () => api.membership.get(userId!),
    enabled: !!userId,
  });
  const isPlus = membership?.tier === "plus";

  const isFreeOrOpen = event.isFree || event.entryType === 'free_open';

  // ── RSVP ──────────────────────────────────────────────────────────────────
  const { data: myRsvpData } = useQuery({
    queryKey: [`/api/events/${event.id}/rsvp/me`],
    queryFn: () => api.events.myRsvp(event.id),
    enabled: !!userId,
  });
  const myRsvp = myRsvpData?.status ?? null;

  const rsvpMutation = useMutation({
    mutationFn: (status: 'going' | 'maybe' | 'not_going') => api.events.rsvp(event.id, status),
    onSuccess: () => {
      if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [`/api/events/${event.id}/rsvp/me`] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
    },
    onError: () => Alert.alert('Error', 'Could not save your RSVP. Please try again.'),
  });

  const handleRsvp = useCallback((status: 'going' | 'maybe' | 'not_going') => {
    if (!userId) {
      promptRsvpLogin(pathname);
      return;
    }
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rsvpMutation.mutate(status);
  }, [userId, rsvpMutation, pathname]);

  const handlePrimaryGoingPress = useCallback(() => {
    if (!userId) {
      promptRsvpLogin(pathname);
      return;
    }
    if (!isWeb) Haptics.selectionAsync();
    if (myRsvp === 'going') {
      confirmRemoveRsvp(() => rsvpMutation.mutate('not_going'));
      return;
    }
    rsvpMutation.mutate('going');
  }, [userId, pathname, myRsvp, rsvpMutation]);

  // ── External Ticket Click Tracking ────────────────────────────────────────
  const handleExternalTicketPress = useCallback(async () => {
    const url = event.externalTicketUrl ?? event.externalUrl;
    if (!url) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // fire-and-forget tracking
    api.events.trackTicketClick(event.id).catch(() => {});
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open the ticket page.');
    }
  }, [event.id, event.externalTicketUrl, event.externalUrl]);

  const [paymentLoading, setPaymentLoading] = useState(false);

  const purchaseMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/stripe/create-checkout-session", { ticketData: body });
      return await res.json();
    },
    onSuccess: async (data: any) => {
      if (data.checkoutUrl) {
        setPaymentLoading(true);
        setTicketModalVisible(false);
        try {
          const result = await WebBrowser.openBrowserAsync(data.checkoutUrl, { dismissButtonStyle: "cancel", presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
          queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
          if (result.type === "cancel" || result.type === "dismiss") {
            const ticketRes = await apiRequest("GET", `/api/ticket/${data.ticketId}`);
            const ticket = await ticketRes.json();
            if (ticket.paymentStatus === "paid" || ticket.status === "confirmed") {
              if(!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Ticket Purchased!", "Your payment was successful.", [
                { text: "View Ticket", onPress: () => router.push(`/tickets/${data.ticketId}`) },
                { text: "OK" },
              ]);
            }
          }
        } catch {
          Alert.alert("Payment Error", "Could not open payment page. Please try again.");
        } finally {
          setPaymentLoading(false);
        }
      }
    },
    onError: (error: Error) => Alert.alert("Purchase Failed", error.message),
  });

  const eventTiers = event.tiers;
  const selectedTier = useMemo(() => eventTiers?.[selectedTierIndex] || { priceCents: 0, available: 0, name: 'Standard' }, [eventTiers, selectedTierIndex]);

  // Family / group purchase constants
  const familySize    = 4;  // standard family pack size
  const familyDiscount = 0.10; // 10% family discount
  const groupDiscount  = 0.15; // 15% group discount (6+)

  const minQty = buyMode === "group" ? 6 : 1;
  const maxQty = buyMode === "family" ? 1 : Math.max(minQty, Math.min(20, selectedTier?.available || 20));

  const basePrice = selectedTier?.priceCents ?? 0;

  const rawTotal = buyMode === "family" ? basePrice * familySize : basePrice * quantity;
  const discountRate = buyMode === "family" ? familyDiscount : buyMode === "group" ? groupDiscount : 0;
  const discountAmount = Math.round(rawTotal * discountRate); // Force Integer to prevent Stripe fractional cent crash
  const totalPrice = rawTotal - discountAmount; 
  const effectiveQty = buyMode === "family" ? familySize : quantity;
  
  const purchaseFreeTicket = useCallback(async (body: Record<string, unknown>) => {
    try {
      const res = await apiRequest("POST", "/api/tickets", body);
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setTicketModalVisible(false);
      if(!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Ticket Confirmed!", "Your free ticket has been reserved.", [
        { text: "View Ticket", onPress: () => router.push(`/tickets/${data.id}`) },
        { text: "OK" },
      ]);
    } catch {
      Alert.alert("Error", "Failed to reserve ticket. Please try again.");
    }
  }, []);

  const handlePurchase = useCallback(() => {
    if (!userId) {
      Alert.alert("Login required", "Please sign in to complete ticket purchase.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign in", onPress: () => router.push(routeWithRedirect('/(onboarding)/login', pathname)) },
      ]);
      return;
    }
    const ticketLabel = buyMode === "family" ? `${selectedTier.name} (Family Pack)` : buyMode === "group" ? `${selectedTier.name} (Group)` : selectedTier.name;
    const body = {
      userId, eventId: event.id, eventTitle: event.title, eventDate: event.date, eventTime: event.time,
      eventVenue: event.venue, tierName: ticketLabel, quantity: effectiveQty, totalPriceCents: totalPrice,
      currency: getCurrencyForCountry(event?.country), imageColor: event.imageColor ?? CultureTokens.indigo,
    };
    if (totalPrice <= 0) { purchaseFreeTicket(body); return; }
    purchaseMutation.mutate(body);
  }, [userId, event, selectedTier, totalPrice, effectiveQty, buyMode, pathname, purchaseMutation, purchaseFreeTicket]);

  // ── Admin Actions ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => api.events.remove(event.id),
    onSuccess: () => {
      if(!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Deleted', 'Event has been successfully removed.');
      router.replace('/admin/events');
    },
    onError: (err) => Alert.alert('Error', `Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: (featured: boolean) => api.events.update(event.id, { isFeatured: featured }),
    onSuccess: () => {
      if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
  });

  const handleAdminDelete = useCallback(() => {
    Alert.alert(
      'Delete Event',
      'Are you absolutely sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  }, [deleteMutation]);

  const handleAdminToggleFeatured = useCallback(() => {
    toggleFeaturedMutation.mutate(!event.isFeatured);
  }, [event.isFeatured, toggleFeaturedMutation]);

  const openTicketModal = useCallback((tierIdx?: number) => {
    setSelectedTierIndex(tierIdx ?? 0);
    setQuantity(1);
    setBuyMode("single");
    setTicketModalVisible(true);
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    if (!event.date || !event.time) return null;
    const [year, month, day] = event.date.split("-").map(Number);
    if (!year || !month || !day) return null;
    const eventDate = new Date(year, month - 1, day);
    const ampmParts = event.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    const h24Parts  = !ampmParts ? event.time.match(/^(\d{1,2}):(\d{2})$/) : null;
    if (ampmParts) {
      let hours = parseInt(ampmParts[1], 10);
      const mins = parseInt(ampmParts[2], 10);
      const ampm = ampmParts[3].toUpperCase();
      if (ampm === "PM" && hours !== 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      eventDate.setHours(hours, mins, 0, 0);
    } else if (h24Parts) {
      eventDate.setHours(parseInt(h24Parts[1], 10), parseInt(h24Parts[2], 10), 0, 0);
    }
    const diff = eventDate.getTime() - now.getTime();
    if (diff <= 0) return { ended: true as const, days: 0, hours: 0, minutes: 0 };
    return {
      ended: false as const,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000)
    };
  }, [event.date, event.time, now]);

  const capacityPercent = useMemo(() => {
      const attending = event.attending || 0;
      const capacity = event.capacity || 1;
      return capacity > 0 ? Math.min(100, Math.round((attending / capacity) * 100)) : 0;
  }, [event.attending, event.capacity]);

  const handleShare = useCallback(async () => {
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const shareUrl = `https://culturepass.app/event/${event.id}`;
      const message = `${event.title}\n📅 ${formatDate(event.date)}\n📍 ${event.venue}\n\nJoin us on CulturePass: ${shareUrl}`;
      
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description || `Check out ${event.title} on CulturePass`,
          url: shareUrl
        });
      } else {
        await Share.share({ 
          title: event.title, 
          message: message,
          url: shareUrl 
        });
      }
    } catch {}
  }, [event.id, event.title, event.venue, event.date, event.description]);

  const handleSave = useCallback(() => {
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSaveEvent(event.id);
  }, [event.id, toggleSaveEvent]);

  const openMap = useCallback(() => {
    if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = [event.venue, event.city, event.country].filter(Boolean).join(", ");
    // Fixed malformed URL structure for platform specific maps
    const url = Platform.OS === 'ios' 
        ? `maps:0,0?q=${encodeURIComponent(q)}` 
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    Linking.openURL(url);
  }, [event.venue, event.city, event.country]);


  const [calendarSheetVisible, setCalendarSheetVisible] = useState(false);

  // Calendar params: compute start/end Date objects, title, details, location
  const calendarParams = useMemo(() => {
    const start = toCalendarDate(event.date, event.time);
    // Try to use event.endTime if present, else add 2 hours to start
    let end: Date | null = null;
    const endTime = event.endTime;
    if (endTime) {
      end = toCalendarDate(event.date, endTime);
    } else if (start) {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    }
    const title = event.title;
    const details = event.description || '';
    const location = [event.venue, event.city, event.country].filter(Boolean).join(', ');
    return start && end ? { start, end, title, details, location } : null;
  }, [event]);

  const addToGoogleCalendar = useCallback(() => {
    if (!calendarParams) { Alert.alert('Calendar unavailable', 'We could not parse this event date.'); return; }
    const { start, end, title, details, location } = calendarParams;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGoogleCalendarTimestamp(start)}/${toGoogleCalendarTimestamp(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Google Calendar.'));
    setCalendarSheetVisible(false);
  }, [calendarParams]);

  const addToOutlook = useCallback(() => {
    if (!calendarParams) { Alert.alert('Calendar unavailable', 'We could not parse this event date.'); return; }
    const { start, end, title, details, location } = calendarParams;
    const url = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Outlook Calendar.'));
    setCalendarSheetVisible(false);
  }, [calendarParams]);

  const addToAppleIcal = useCallback(() => {
    if (!calendarParams) { Alert.alert('Calendar unavailable', 'We could not parse this event date.'); return; }
    const { start, end, title, details, location } = calendarParams;
    const ics = buildICS(title, start, end, details, location);
    if (isWeb && typeof document !== 'undefined') {
      try {
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${safeIcsFilenameBase(title)}.ics`;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      } catch {
        Alert.alert('Error', 'Could not download the calendar file. Try Google or Outlook instead.');
      }
      setCalendarSheetVisible(false);
      return;
    }
    const uri = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    Linking.openURL(uri).catch(() => Alert.alert('Error', 'Could not open Calendar. Try downloading the .ics file.'));
    setCalendarSheetVisible(false);
  }, [calendarParams]);

  const openCalendarSheet = useCallback(() => {
    if (!calendarParams) {
      Alert.alert('Calendar unavailable', 'We could not parse this event date.');
      return;
    }
    setCalendarSheetVisible(true);
  }, [calendarParams]);

  const BottomBarInner = ({
    event: ev,
    openTicketModal: openModal,
  }: {
    event: EventData;
    openTicketModal: (tierIdx?: number) => void;
  }) => {
    const calendarBtn = (
      <Pressable
        onPress={openCalendarSheet}
        style={({ pressed }) => [
          s.iconActionBtn,
          { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
          pressed && { opacity: 0.7 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add to calendar"
      >
        <Ionicons name="calendar-number-outline" size={22} color={colors.text} />
      </Pressable>
    );

    if (isFreeOrOpen) {
      const goingHeadline = Math.max(ev.rsvpGoing ?? 0, ev.attending ?? 0);
      const pillMaybeActive = myRsvp === 'maybe';
      const pillCantActive = myRsvp === 'not_going';

      const onMaybe = () => {
        if (!userId) {
          promptRsvpLogin(pathname);
          return;
        }
        if (!isWeb) Haptics.selectionAsync();
        handleRsvp('maybe');
      };
      const onCant = () => {
        if (!userId) {
          promptRsvpLogin(pathname);
          return;
        }
        if (!isWeb) Haptics.selectionAsync();
        handleRsvp('not_going');
      };

      return (
        <View style={s.unifiedBarRow}>
          <View style={[s.bottomPriceSection, s.unifiedBarStat]}>
            <Text style={s.bottomPriceLabel}>Free</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="people-outline" size={14} color={CultureTokens.teal} />
              <Text style={[s.bottomPriceValue, { color: CultureTokens.teal, fontSize: 17 }]}>
                {goingHeadline}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={s.unifiedBarScroll}
            contentContainerStyle={s.unifiedBarScrollContent}
          >
            <Button
              variant={myRsvp === 'going' ? 'gradient' : 'primary'}
              size="md"
              leftIcon={myRsvp === 'going' ? 'checkmark-circle' : 'person-add-outline'}
              onPress={handlePrimaryGoingPress}
              loading={rsvpMutation.isPending}
              style={{ height: 52, minWidth: 108, borderRadius: 18, marginRight: 4 }}
              textStyle={{ fontFamily: 'Poppins_700Bold' }}
            >
              {myRsvp === 'going' ? "You're in" : 'Going'}
            </Button>

            <Pressable
              onPress={onMaybe}
              style={({ pressed }) => [
                s.compactRsvpPill,
                {
                  backgroundColor: pillMaybeActive ? CultureTokens.gold + '22' : colors.backgroundSecondary,
                  borderColor: pillMaybeActive ? CultureTokens.gold : colors.borderLight,
                },
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="RSVP maybe"
              accessibilityState={{ selected: pillMaybeActive }}
            >
              <Text
                style={[
                  s.compactRsvpPillText,
                  { color: pillMaybeActive ? CultureTokens.gold : colors.text },
                ]}
                numberOfLines={1}
              >
                Maybe
              </Text>
            </Pressable>

            <Pressable
              onPress={onCant}
              style={({ pressed }) => [
                s.compactRsvpPill,
                {
                  backgroundColor: pillCantActive ? colors.error + '22' : colors.backgroundSecondary,
                  borderColor: pillCantActive ? colors.error : colors.borderLight,
                },
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="RSVP cannot attend"
              accessibilityState={{ selected: pillCantActive }}
            >
              <Text
                style={[
                  s.compactRsvpPillText,
                  { color: pillCantActive ? colors.error : colors.text },
                ]}
                numberOfLines={1}
              >
                Can&apos;t go
              </Text>
            </Pressable>

            {calendarBtn}
          </ScrollView>
        </View>
      );
    }

    const hasExternal = !!(ev.externalTicketUrl || ev.externalUrl);
    return (
      <View style={s.unifiedBarRow}>
        <View style={[s.bottomPriceSection, s.unifiedBarStat]}>
          <Text style={s.bottomPriceLabel}>Tickets</Text>
          <Text style={[s.bottomPriceValue, { fontSize: 20 }]} numberOfLines={1}>
            {ev.priceLabel || 'TBA'}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={s.unifiedBarScroll}
          contentContainerStyle={s.unifiedBarScrollContent}
        >
          {hasExternal ? (
            <Button
              variant="gradient"
              size="md"
              leftIcon="ticket-outline"
              onPress={handleExternalTicketPress}
              accessibilityLabel="Buy tickets"
              style={{ height: 52, minWidth: 130, borderRadius: 18, marginRight: 4 }}
              textStyle={{ fontFamily: 'Poppins_700Bold' }}
            >
              Get tickets
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="md"
              leftIcon="ticket"
              onPress={() => openModal()}
              accessibilityLabel="Reserve tickets"
              style={{ height: 52, minWidth: 130, borderRadius: 18, marginRight: 4 }}
              textStyle={{ fontFamily: 'Poppins_700Bold' }}
            >
              Reserve
            </Button>
          )}
          {calendarBtn}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {showAdminTools && (
        <AdminToolbar 
          isFeatured={!!event.isFeatured}
          onToggleFeatured={handleAdminToggleFeatured}
          onDelete={handleAdminDelete}
          onClose={() => setShowAdminTools(false)}
        />
      )}
      <View style={[s.shellWrapper, isDesktop && s.desktopShellWrapper]}>
        <View style={[s.shellInner, isDesktop && s.desktopShell]}>
          <ScrollView
            style={s.mainScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
          >
            {/* Hero Image Block */}
            <View style={s.heroWrapper}>
              <View style={[s.heroSection, { height: isDesktop ? 450 : 380 + topInset }, isDesktop && { borderRadius: 32, marginHorizontal: 20, marginTop: 20, overflow: 'hidden' }]}>
                <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
                
                {canEdit && (
                  <Pressable 
                    onPress={handlePickCover} 
                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }]}
                    accessibilityLabel="Change cover image"
                  >
                    {uploading ? (
                      <ActivityIndicator size="large" color="white" />
                    ) : (
                      <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}>
                        <Ionicons name="camera" size={24} color="white" />
                      </View>
                    )}
                  </Pressable>
                )}
                
                <LinearGradient
                  colors={['rgba(11,11,20,0.5)', 'transparent', 'rgba(11,11,20,0.85)']}
                  style={StyleSheet.absoluteFill}
                />

                <View style={[s.heroOverlay, { paddingTop: topInset + 12 }]}>
                  {/* Top Header Buttons */}
                  <View style={s.heroNav}>
                    <Pressable
                      onPress={() => {
                        if(!isWeb) Haptics.selectionAsync();
                        goBackOrReplace('/(tabs)');
                      }}
                      style={({ pressed }) => [s.navBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                      accessibilityRole="button"
                      accessibilityLabel="Go back"
                    >
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                      <Ionicons name="chevron-back" size={24} color="white" />
                    </Pressable>
                    <View style={s.heroActions}>
                      <Pressable
                        onPress={handleShare}
                        style={({ pressed }) => [s.navBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                        accessibilityRole="button"
                        accessibilityLabel="Share"
                      >
                        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                        <Ionicons name="share-outline" size={20} color="white" />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          handleSave();
                        }}
                        style={({ pressed }) => [s.navBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                        accessibilityRole="button"
                        accessibilityLabel="Save event"
                      >
                        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                        <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saved ? CultureTokens.gold : 'white'} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={s.heroBottomContent}>
                    <View style={s.heroTitleRibbon}>
                      <Text style={[TextStyles.hero, { color: 'white', ...Platform.select({ web: { textShadow: '0px 2px 6px rgba(0,0,0,0.5)' }, default: { textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 } }) }]} numberOfLines={3}>
                        {event.title}
                      </Text>
                    </View>
                    <View style={s.heroMetaRow}>
                        <View style={[s.heroCardBadge, { backgroundColor: CultureTokens.gold }]}>
                            <Text style={[TextStyles.badgeCaps, { color: 'black' }]}>{event.category || 'Event'}</Text>
                        </View>
                        <Text style={[TextStyles.captionSemibold, { color: 'rgba(255,255,255,0.9)' }]}>{formatDate(event.date)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Primary Info Header */}
            <View style={s.detailShell}>
              <Card glass={!isDark} padding={20} style={s.heroInfoCard}>
                <View style={s.heroBadges}>
                  <View style={[s.heroBadge, { backgroundColor: CultureTokens.gold }]}>
                    <Text style={[TextStyles.badgeCaps, { color: 'black' }]}>{event.communityId || 'General'}</Text>
                  </View>
                  {event.councilTag ? (
                    <View style={[s.heroBadge, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                      <Text style={[TextStyles.badgeCaps, { color: colors.primary }]}>{event.councilTag}</Text>
                    </View>
                  ) : null}
                  <View style={[s.heroBadge, { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight }]}>
                    <Ionicons name="finger-print-outline" size={12} color={CultureTokens.indigo} />
                    <Text style={[TextStyles.badgeCaps, { color: colors.textSecondary }]}>
                      CPID: {event.culturePassId ?? event.id}
                    </Text>
                  </View>
                </View>
                <Text style={[TextStyles.title, { color: colors.text, marginTop: 8 }]}>{event.title}</Text>
                <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>by {event.organizerId || event.communityId || 'CulturePass'}</Text>
              </Card>
              
              {countdown && (
                <View style={s.countdownWrapper}>
                  {countdown.ended ? (
                    <Card style={s.countdownEndedBox}>
                      <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                      <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary }]}>Event has ended</Text>
                    </Card>
                  ) : (
                    <Card style={s.countdownRow}>
                      <View style={s.countBlock}>
                        <Text style={[TextStyles.title, { color: colors.text }]}>{countdown.days}</Text>
                        <Text style={TextStyles.badgeCaps}>days</Text>
                      </View>
                      <Text style={s.countSep}>:</Text>
                      <View style={s.countBlock}>
                        <Text style={[TextStyles.title, { color: colors.text }]}>{countdown.hours}</Text>
                        <Text style={TextStyles.badgeCaps}>hrs</Text>
                      </View>
                      <Text style={s.countSep}>:</Text>
                      <View style={s.countBlock}>
                        <Text style={[TextStyles.title, { color: colors.text }]}>{countdown.minutes}</Text>
                        <Text style={TextStyles.badgeCaps}>mins</Text>
                      </View>
                    </Card>
                  )}
                </View>
              )}

              <View style={[s.infoGrid, isDesktop && s.infoGridDesktop]}>
                <Card style={[s.infoCard, isDesktop && s.infoCardDesktopHalf]} padding={16}>
                  <View style={[s.infoIconWrap, { backgroundColor: CultureTokens.indigo + '15' }]}>
                    <Ionicons name="calendar-outline" size={20} color={CultureTokens.indigo} />
                  </View>
                  <View style={s.infoTextWrap}>
                    <Text style={TextStyles.badgeCaps}>Date & Time</Text>
                    <Text style={[TextStyles.headline, { color: colors.text }]}>{formatDate(event.date)}</Text>
                    <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{formatEventTime(event.time)}</Text>
                  </View>
                </Card>

                <Card 
                  onPress={openMap} 
                  style={[s.infoCard, isDesktop && s.infoCardDesktopHalf]} 
                  padding={16}
                >
                  <View style={[s.infoIconWrap, { backgroundColor: CultureTokens.teal + '15' }]}>
                    <Ionicons name="location-outline" size={20} color={CultureTokens.teal} />
                  </View>
                  <View style={[s.infoTextWrap, { flex: 1 }]}>
                    <Text style={TextStyles.badgeCaps}>Venue</Text>
                    <Text style={[TextStyles.headline, { color: colors.text }]}>{event.venue || event.city}</Text>
                    <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                        {event.address || event.city}
                        {distanceKm !== null ? ` • ${distanceKm.toFixed(1)} km away` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </Card>

              </View>

              {isPlus && (
                <View style={s.earlyAccessBanner}>
                  <Ionicons name="star" size={16} color={CultureTokens.indigo} />
                  <Text style={s.earlyAccessText}>CulturePass+ Priority Member</Text>
                </View>
              )}

              <View style={s.divider} />

              {/* Sections */}
              <View style={s.section}>
                <Text style={TextStyles.badgeCaps}>About</Text>
                <Text style={[TextStyles.body, { color: colors.textSecondary, lineHeight: 26, marginTop: 8 }]}>{event.description}</Text>
              </View>

              <View style={s.divider} />

              <View style={s.section}>
                <View style={s.capacityHeader}>
                  <Text style={TextStyles.badgeCaps}>Capacity</Text>
                  <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary }]}>{capacityPercent}% filled</Text>
                </View>
                <View style={s.capacityBarBg}>
                  <View style={[s.capacityBarFill, { width: `${capacityPercent}%`, backgroundColor: capacityPercent > 80 ? CultureTokens.coral : CultureTokens.teal }]} />
                </View>
                <View style={s.capacityFooter}>
                  <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary }]}>{event.attending || 0} attending</Text>
                  <Text style={[TextStyles.captionSemibold, { color: colors.textSecondary }]}>{Math.max(0, (event.capacity || 0) - (event.attending || 0))} spots left</Text>
                </View>
              </View>

              {eventTiers && eventTiers.length > 0 && (
                <>
                  <View style={s.divider} />
                  <View style={s.section}>
                    <Text style={TextStyles.badgeCaps}>Tickets</Text>
                    {eventTiers.map((tier, idx) => (
                      <Card 
                        key={`${tier.name}-${idx}`} 
                        onPress={() => openTicketModal(idx)}
                        style={s.tierCard}
                        padding={16}
                      >
                        <View style={s.tierLeft}>
                          <Text style={[TextStyles.headline, { color: colors.text }]}>{tier.name}</Text>
                          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{tier.available} available</Text>
                        </View>
                        <View style={s.tierRight}>
                          <Text style={[TextStyles.title3, { color: CultureTokens.gold }]}>
                            {tier.priceCents === 0 ? "Free" : formatCurrency(tier.priceCents, event?.country)}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                        </View>
                      </Card>
                    ))}
                  </View>
                </>
              )}

              <View style={s.divider} />

              <View style={s.section}>
                 <Text style={s.sectionTitle}>Event Details</Text>
                 {event.culturePassId && (
                   <View style={s.metricRow}>
                     <View style={s.metricIconBg}><Ionicons name="finger-print-outline" size={16} color={CultureTokens.indigo} /></View>
                     <Text style={[s.metricText, { color: colors.text }]}>CPID: {event.culturePassId}</Text>
                   </View>
                 )}
                 <View style={s.metricRow}>
                   <View style={s.metricIconBg}><Ionicons name="pricetag-outline" size={16} color={colors.textSecondary} /></View>
                   <Text style={s.metricText}>Category: {event.category}</Text>
                 </View>
                 <View style={s.metricRow}>
                   <View style={s.metricIconBg}><Ionicons name="people-outline" size={16} color={colors.textSecondary} /></View>
                   <Text style={s.metricText}>Community: {event.communityId}</Text>
                 </View>
              </View>

            </View>
          </ScrollView>
        </View>
      </View>

      {/* Floating Bottom Bar Container */}
      <View style={[s.floatingBottomBarWrapper, { paddingBottom: bottomInset + 16, pointerEvents: 'box-none' }]}>
        <View style={{ overflow: 'hidden', borderRadius: 24, marginHorizontal: 20 }}>
          {isWeb ? (
            <View style={[s.floatingBottomBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }, isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%', bottom: 0 }]}>
              <BottomBarInner event={event} openTicketModal={openTicketModal} />
            </View>
          ) : (
            <BlurView intensity={30} tint="dark" style={[s.floatingBottomBar, isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%', bottom: 0 }]}>
              <BottomBarInner event={event} openTicketModal={openTicketModal} />
            </BlurView>
          )}
        </View>
      </View>

      {/* Ticket Modal */}
      <Modal visible={ticketModalVisible} animationType="slide" transparent onRequestClose={() => setTicketModalVisible(false)}>
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTicketModalVisible(false)} />
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 20 }, isDesktop && { maxHeight: 800, maxWidth: 600, width: '100%', alignSelf: 'center', borderRadius: 24, marginBottom: 'auto', marginTop: 'auto' }]}>
            {isWeb ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background}]} /> : <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.borderLight}]} />
            {!isDesktop && <View style={s.modalHandle} />}
            
            <View style={[s.modalHeader, isDesktop && { paddingTop: 20 }]}>
              <Text style={s.modalTitle}>Select Tickets</Text>
              <Pressable
                onPress={() => setTicketModalVisible(false)}
                hitSlop={10}
                style={({ pressed }) => [{ width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.6 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={15} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
              <Text style={s.modalGroupLabel}>How are you booking?</Text>
              <View style={s.buyModeRow}>
                {([
                  { key: "single", icon: "person", label: "Single" },
                  { key: "family", icon: "people", label: "Family" },
                  { key: "group", icon: "people-circle", label: "Group" }
                ] as const).map((mode) => (
                  <Pressable
                    key={mode.key}
                    style={[s.buyModeBtn, buyMode === mode.key && { backgroundColor: colors.primarySoft, borderColor: CultureTokens.indigo }]}
                    onPress={() => { setBuyMode(mode.key); setQuantity(mode.key === "group" ? 6 : 1); if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Ionicons name={mode.icon as keyof typeof Ionicons.glyphMap} size={18} color={buyMode === mode.key ? colors.primaryLight : colors.textTertiary} />
                    <Text style={[s.buyModeText, buyMode === mode.key && { color: colors.primaryLight, fontFamily: 'Poppins_600SemiBold' }]}>{mode.label}</Text>
                  </Pressable>
                ))}
              </View>

              {eventTiers && eventTiers.length > 0 && (
                 <>
                   <Text style={[s.modalGroupLabel, { marginTop: 20 }]}>Ticket Tier</Text>
                   {eventTiers.map((tier, idx) => {
                     const isSelected = idx === selectedTierIndex;
                     return (
                       <Pressable 
                         key={`modal-tier-${idx}`} 
                         style={[s.modalTierCard, isSelected && { backgroundColor: colors.primarySoft, borderColor: CultureTokens.indigo }]}
                         onPress={() => { setSelectedTierIndex(idx); setQuantity(1); if(!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                       >
                         <View style={s.modalTierLeft}>
                           <View style={[s.radioOuter, { borderColor: isSelected ? CultureTokens.indigo : colors.border }]}>
                             {isSelected && <View style={[s.radioInner, { backgroundColor: CultureTokens.indigo }]} />}
                           </View>
                           <View>
                             <Text style={s.modalTierName}>{tier.name}</Text>
                             <Text style={s.modalTierAvail}>{tier.available} available</Text>
                           </View>
                         </View>
                         <Text style={[s.modalTierPrice, isSelected && { color: colors.primaryLight }]}>
                            {tier.priceCents === 0 ? "Free" : formatCurrency(tier.priceCents, event?.country)}
                          </Text>
                        </Pressable>
                      );
                    })}
                 </>
              )}

              {buyMode !== "family" && (
                <>
                  <Text style={[s.modalGroupLabel, { marginTop: 20 }]}>{buyMode === "group" ? "Group Size" : "Quantity"}</Text>
                  <View style={s.quantityRow}>
                    <Button
                      onPress={() => { if(quantity > minQty) { setQuantity(q => q - 1); } }}
                      variant="outline"
                      size="md"
                      leftIcon="remove"
                      style={s.quantityBtn}
                      disabled={quantity <= minQty}
                    >
                      {null}
                    </Button>
                    <Text style={s.quantityNum}>{quantity}</Text>
                    <Button
                      onPress={() => { if(quantity < maxQty) { setQuantity(q => q + 1); } }}
                      variant="outline"
                      size="md"
                      leftIcon="add"
                      style={s.quantityBtn}
                      disabled={quantity >= maxQty}
                    >
                      {null}
                    </Button>
                  </View>
                </>
              )}

              <View style={s.priceSummaryBox}>
                <View style={s.pRow}>
                  <Text style={s.pRowLabel}>{effectiveQty}x {selectedTier?.name}</Text>
                  <Text style={s.pRowVal}>{formatCurrency(rawTotal, event?.country)}</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={s.pRow}>
                    <Text style={[s.pRowLabel, { color: CultureTokens.teal }]}>{buyMode === "family" ? "Family" : "Group"} Discount</Text>
                    <Text style={[s.pRowVal, { color: CultureTokens.teal }]}>-{formatCurrency(discountAmount, event?.country)}</Text>
                  </View>
                )}
                <View style={s.pDiv} />
                <View style={s.pRow}>
                  <Text style={s.pTotalLabel}>Total</Text>
                  <Text style={s.pTotalVal}>{totalPrice <= 0 ? "Free" : formatCurrency(totalPrice, event?.country)}</Text>
                </View>
              </View>

              <Button
                variant="gradient"
                size="lg"
                fullWidth
                loading={purchaseMutation.isPending || paymentLoading}
                onPress={handlePurchase}
              >
                {totalPrice <= 0 ? "Get Free Ticket" : `Pay ${formatCurrency(totalPrice, event?.country)}`}
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Picker Sheet */}
      <Modal visible={calendarSheetVisible} animationType="slide" transparent onRequestClose={() => setCalendarSheetVisible(false)}>
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarSheetVisible(false)} />
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 12 }]}>
            {isWeb ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} /> : <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.borderLight }]} />
            {!isDesktop && <View style={s.modalHandle} />}
            <View style={[s.modalHeader, { paddingTop: 16 }]}>
              <Text style={s.modalTitle}>Add to Calendar</Text>
              <Pressable
                onPress={() => setCalendarSheetVisible(false)}
                hitSlop={10}
                style={({ pressed }) => [{ width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.6 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={15} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={{ padding: 16, gap: 10 }}>
              {[
                { label: 'Google Calendar', sub: 'Open in Google Calendar', icon: 'logo-google' as const, color: GOOGLE_BRAND_COLOR, onPress: addToGoogleCalendar },
                { label: 'Outlook Calendar', sub: 'Open in Outlook / Office 365', icon: 'mail' as const, color: OUTLOOK_BRAND_COLOR, onPress: addToOutlook },
                { label: 'Apple Calendar / iCal', sub: 'Download .ics file', icon: 'calendar' as const, color: CultureTokens.teal, onPress: addToAppleIcal },
              ].map((opt) => (
                <Pressable
                  key={opt.label}
                  style={({ pressed }) => [s.calOptRow, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={opt.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                >
                  <View style={[s.calOptIcon, { backgroundColor: opt.color + '18' }]}>
                    <Ionicons name={opt.icon} size={20} color={opt.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.calOptLabel}>{opt.label}</Text>
                    <Text style={s.calOptSub}>{opt.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

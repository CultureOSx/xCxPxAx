import {
  View, Text, Pressable, ScrollView, Platform, Share, Modal, Alert,
  ActivityIndicator, Linking, StyleSheet, useWindowDimensions
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
import { TextStyles } from '@/constants/typography';
import * as WebBrowser from 'expo-web-browser';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { calculateDistance, getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import type { EventData } from '@/shared/schema';
import { routeWithRedirect } from '@/lib/routes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as ImagePicker from 'expo-image-picker';

const isWeb = Platform.OS === 'web';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function cityToCoordinates(city?: string): { latitude: number; longitude: number } | null {
  if (!city) return null;
  const match = getPostcodesByPlace(city)[0];
  if (!match) return null;
  return { latitude: match.latitude, longitude: match.longitude };
}

function toCalendarDate(date: string, time?: string): Date | null {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;
  const dt = new Date(year, month - 1, day, 18, 0, 0, 0);
  const match = (time ?? '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    dt.setHours(hour, minute, 0, 0);
  }
  return dt;
}

function toGoogleCalendarTimestamp(value: Date): string {
  const iso = value.toISOString();
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function toICSTimestamp(value: Date): string {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function buildICS(title: string, start: Date, end: Date, description: string, location: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CulturePass//CulturePass//EN',
    'BEGIN:VEVENT',
    `DTSTART:${toICSTimestamp(start)}`,
    `DTEND:${toICSTimestamp(end)}`,
    `SUMMARY:${title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

// Ensure proper typing for Tiers
interface TicketTier {
  name: string;
  priceCents: number;
  available: number;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const s = getStyles(colors);

  const { data: event, isLoading, isError } = useQuery<EventData>({
    queryKey: ['/api/events', id],
    queryFn: () => api.events.get(String(id)) as Promise<EventData>,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={CultureTokens.indigo} />
      </View>
    );
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
      </Head><EventDetail event={event} insets={insets} />
    </ErrorBoundary>
  );
}

function EventDetail({ event, insets }: { event: EventData; insets: EdgeInsets }) {
  const { isEventSaved, toggleSaveEvent } = useSaved();
  const { userId } = useAuth();
  const { state: onboardingState } = useOnboarding();
  const colors = useColors();
  const s = getStyles(colors);
  const isDark = useIsDark();
  const saved = isEventSaved(event.id);
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
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
        await api.events.update(event.id, { heroImageUrl: result.assets[0].uri } as any); // just for local sync if needed, though hook updates DB
        queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
      } catch (err) {
        Alert.alert('Upload Error', String(err));
      }
    }
  }, [event.id, event.imageUrl, uploadImage, deleteImage]);

  const canEdit = userId === event.organizerId || userId === (event as any).createdBy || __DEV__;

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
      Alert.alert('Login required', 'Please sign in to RSVP.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push(routeWithRedirect('/(onboarding)/login', pathname) as any) },
      ]);
      return;
    }
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rsvpMutation.mutate(status);
  }, [userId, rsvpMutation, pathname]);

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
                { text: "View Ticket", onPress: () => router.push(`/tickets/${data.ticketId}` as never) },
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

  const eventTiers = (event as any).tiers as TicketTier[] | undefined;
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
        { text: "View Ticket", onPress: () => router.push(`/tickets/${data.id}` as never) },
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
        { text: "Sign in", onPress: () => router.push(routeWithRedirect('/(onboarding)/login', pathname) as any) },
      ]);
      return;
    }
    const ticketLabel = buyMode === "family" ? `${selectedTier.name} (Family Pack)` : buyMode === "group" ? `${selectedTier.name} (Group)` : selectedTier.name;
    const body = {
      userId, eventId: event.id, eventTitle: event.title, eventDate: event.date, eventTime: event.time,
      eventVenue: event.venue, tierName: ticketLabel, quantity: effectiveQty, totalPriceCents: totalPrice,
      currency: "AUD", imageColor: (event as any).imageColor ?? CultureTokens.indigo,
    };
    if (totalPrice <= 0) { purchaseFreeTicket(body); return; }
    purchaseMutation.mutate(body);
  }, [userId, event, selectedTier, totalPrice, effectiveQty, buyMode, pathname, purchaseMutation, purchaseFreeTicket]);

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
    const endTime = (event as any).endTime as string | undefined;
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
    const uri = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    Linking.openURL(uri).catch(() => Alert.alert('Error', 'Could not open Calendar. Try downloading the .ics file.'));
    setCalendarSheetVisible(false);
  }, [calendarParams]);

  const RSVP_OPTIONS = [
    { status: 'going' as const,     icon: 'checkmark-circle' as const, label: 'Going',    color: CultureTokens.teal },
    { status: 'maybe' as const,     icon: 'help-circle' as const,      label: 'Maybe',    color: CultureTokens.saffron },
    { status: 'not_going' as const, icon: 'close-circle' as const,     label: "Can't Go", color: colors.textTertiary },
  ] as const;

  const BottomBarInner = ({ event: ev, colors: c, setCalendarSheetVisible: setCalSheet, openTicketModal: openModal }: any) => {
    if (isFreeOrOpen) {
      // RSVP mode for free/open events (Premium Glass Design)
      return (
        <>
          <View style={s.bottomPriceSection}>
            <Text style={s.bottomPriceLabel}>Free Entry</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="people-outline" size={14} color={CultureTokens.teal} />
              <Text style={[s.bottomPriceValue, { color: CultureTokens.teal, fontSize: 18 }]}>
                {ev.rsvpGoing || 0}
              </Text>
            </View>
          </View>

          <View style={[s.bottomBtnGroup, { flex: 1, gap: 8 }]}>
            {/* Main Action: Going */}
            <Button
              variant={myRsvp === 'going' ? 'gradient' : 'primary'}
              size="md"
              leftIcon={myRsvp === 'going' ? 'checkmark-circle' : 'person-add-outline'}
              onPress={() => handleRsvp('going')}
              loading={rsvpMutation.isPending && myRsvp === 'going'}
              style={{ flex: 3, borderRadius: 18, height: 52 }}
              textStyle={{ fontFamily: 'Poppins_700Bold' }}
            >
              Interested
            </Button>

            {/* Secondary: Calendar */}
            <Pressable
              onPress={() => setCalSheet(true)}
              style={({ pressed }) => [
                s.iconActionBtn, 
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
                pressed && { opacity: 0.7 }
              ]}
              accessibilityLabel="Calendar"
            >
              <Ionicons name="calendar-number-outline" size={22} color={colors.text} />
            </Pressable>

            {/* Tertiary: Options (Maybe/Not Going) */}
            <Pressable
              onPress={() => {
                // For simplicity, just toggle maybe if not set, or show alert
                if (myRsvp === 'maybe') handleRsvp('not_going');
                else handleRsvp('maybe');
              }}
              style={({ pressed }) => [
                s.iconActionBtn, 
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
                pressed && { opacity: 0.7 }
              ]}
              accessibilityLabel="More RSVP options"
            >
              <Ionicons 
                name={myRsvp === 'maybe' ? 'help-circle' : 'ellipsis-horizontal'} 
                size={22} 
                color={myRsvp === 'maybe' ? CultureTokens.saffron : colors.text} 
              />
            </Pressable>
          </View>
        </>
      );
    }

    // Ticketed event mode
    const hasExternal = !!(ev.externalTicketUrl || ev.externalUrl);
    return (
      <>
        <View style={s.bottomPriceSection}>
          <Text style={s.bottomPriceLabel}>Tickets from</Text>
          <Text style={[s.bottomPriceValue, { fontSize: 24 }]}>{ev.priceLabel || 'TBA'}</Text>
        </View>
        <View style={[s.bottomBtnGroup, { flex: 1 }]}>
          {hasExternal ? (
            <Button
              variant="gradient"
              size="lg"
              leftIcon="ticket-outline"
              onPress={handleExternalTicketPress}
              accessibilityLabel="Buy tickets"
              style={{ flex: 1, borderRadius: 20, height: 56 }}
              textStyle={{ fontFamily: 'Poppins_700Bold' }}
            >
              Get Tickets
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="lg"
              leftIcon="ticket"
              onPress={() => openModal()}
              accessibilityLabel="Get tickets"
              style={{ flex: 1, borderRadius: 20, height: 56 }}
              textStyle={{ fontFamily: 'Poppins_700Bold' }}
            >
              Reserve Spot
            </Button>
          )}
          
          <Pressable
            onPress={() => setCalSheet(true)}
            style={({ pressed }) => [
              s.iconActionBtn, 
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight, height: 56, width: 56 },
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <View style={s.container}>
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
                  colors={['rgba(11,11,20,0.5)', 'transparent', 'rgba(11,11,20,0.9)']}
                  style={StyleSheet.absoluteFill}
                />

                <View style={[s.heroOverlay, { paddingTop: topInset + 12 }]}>
                  {/* Top Header Buttons */}
                  <View style={s.heroNav}>
                    <Button
                      onPress={() => goBackOrReplace('/(tabs)')}
                      variant="ghost"
                      size="sm"
                      leftIcon="chevron-back"
                      style={s.navBtn}
                      iconColor="white"
                    >
                      {null}
                    </Button>
                    <View style={s.heroActions}>
                      <Button
                        onPress={handleShare}
                        variant="ghost"
                        size="sm"
                        leftIcon="share-outline"
                        style={s.navBtn}
                        iconColor="white"
                      >
                        {null}
                      </Button>
                      <Button
                        onPress={handleSave}
                        variant="ghost"
                        size="sm"
                        leftIcon={saved ? "bookmark" : "bookmark-outline"}
                        style={s.navBtn}
                        iconColor={saved ? CultureTokens.saffron : 'white'}
                      >
                        {null}
                      </Button>
                    </View>
                  </View>

                  <View style={s.heroBottomContent}>
                    <View style={s.heroTitleRibbon}>
                      <Text style={[TextStyles.hero, { color: 'white', ...Platform.select({ web: { textShadow: '0px 2px 6px rgba(0,0,0,0.5)' }, default: { textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 } }) }]} numberOfLines={3}>
                        {event.title}
                      </Text>
                    </View>
                    <View style={s.heroMetaRow}>
                        <View style={[s.heroCardBadge, { backgroundColor: CultureTokens.saffron }]}>
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
                  <View style={[s.heroBadge, { backgroundColor: CultureTokens.saffron }]}>
                    <Text style={[TextStyles.badgeCaps, { color: 'black' }]}>{event.communityId || 'General'}</Text>
                  </View>
                  {(event as any).councilTag ? (
                    <View style={[s.heroBadge, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                      <Text style={[TextStyles.badgeCaps, { color: colors.primary }]}>{(event as any).councilTag}</Text>
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

              <View style={s.infoGrid}>
                <Card style={s.infoCard} padding={16}>
                  <View style={[s.infoIconWrap, { backgroundColor: CultureTokens.indigo + '15' }]}>
                    <Ionicons name="calendar-outline" size={20} color={CultureTokens.indigo} />
                  </View>
                  <View style={s.infoTextWrap}>
                    <Text style={TextStyles.badgeCaps}>Date & Time</Text>
                    <Text style={[TextStyles.headline, { color: colors.text }]}>{formatDate(event.date)}</Text>
                    <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{event.time}</Text>
                  </View>
                </Card>

                <Card 
                  onPress={openMap} 
                  style={s.infoCard} 
                  padding={16}
                >
                  <View style={[s.infoIconWrap, { backgroundColor: CultureTokens.teal + '15' }]}>
                    <Ionicons name="location-outline" size={20} color={CultureTokens.teal} />
                  </View>
                  <View style={[s.infoTextWrap, { flex: 1 }]}>
                    <Text style={TextStyles.badgeCaps}>Venue</Text>
                    <Text style={[TextStyles.headline, { color: colors.text }]}>{event.venue || event.city}</Text>
                    <Text style={[TextStyles.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                        {(event as any).address || event.city}
                        {distanceKm !== null ? ` • ${distanceKm.toFixed(1)} km away` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </Card>

                <Card
                  onPress={() => { if(Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCalendarSheetVisible(true); }}
                  style={s.infoCard}
                  padding={16}
                >
                  <View style={[s.infoIconWrap, { backgroundColor: CultureTokens.saffron + '15' }]}>
                    <Ionicons name="calendar-number-outline" size={20} color={CultureTokens.saffron} />
                  </View>
                  <View style={[s.infoTextWrap, { flex: 1 }]}>
                    <Text style={TextStyles.badgeCaps}>Calendar</Text>
                    <Text style={[TextStyles.headline, { color: colors.text }]}>Add Reminders</Text>
                    <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>Save this event date</Text>
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
                          <Text style={[TextStyles.title3, { color: CultureTokens.saffron }]}>
                            {tier.priceCents === 0 ? "Free" : `$${(tier.priceCents / 100).toFixed(2)}`}
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
              <BottomBarInner event={event} colors={colors} setCalendarSheetVisible={setCalendarSheetVisible} openTicketModal={openTicketModal} />
            </View>
          ) : (
            <BlurView intensity={30} tint="dark" style={[s.floatingBottomBar, isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%', bottom: 0 }]}>
              <BottomBarInner event={event} colors={colors} setCalendarSheetVisible={setCalendarSheetVisible} openTicketModal={openTicketModal} />
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
                    <Ionicons name={mode.icon as never} size={18} color={buyMode === mode.key ? colors.primaryLight : colors.textTertiary} />
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
                            {tier.priceCents === 0 ? "Free" : `$${(tier.priceCents / 100).toFixed(2)}`}
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
                  <Text style={s.pRowVal}>${(rawTotal / 100).toFixed(2)}</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={s.pRow}>
                    <Text style={[s.pRowLabel, { color: CultureTokens.teal }]}>{buyMode === "family" ? "Family" : "Group"} Discount</Text>
                    <Text style={[s.pRowVal, { color: CultureTokens.teal }]}>-${(discountAmount / 100).toFixed(2)}</Text>
                  </View>
                )}
                <View style={s.pDiv} />
                <View style={s.pRow}>
                  <Text style={s.pTotalLabel}>Total</Text>
                  <Text style={s.pTotalVal}>{totalPrice <= 0 ? "Free" : `A$${(totalPrice / 100).toFixed(2)}`}</Text>
                </View>
              </View>

              <Button
                variant="gradient"
                size="lg"
                fullWidth
                loading={purchaseMutation.isPending || paymentLoading}
                onPress={handlePurchase}
              >
                {totalPrice <= 0 ? "Get Free Ticket" : `Pay A$${(totalPrice / 100).toFixed(2)}`}
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
                { label: 'Google Calendar', sub: 'Open in Google Calendar', icon: 'logo-google' as const, color: '#4285F4', onPress: addToGoogleCalendar },
                { label: 'Outlook Calendar', sub: 'Open in Outlook / Office 365', icon: 'mail' as const, color: '#0078D4', onPress: addToOutlook },
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

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  shellWrapper: { flex: 1 },
  shellInner: { flex: 1 },
  mainScroll: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, backgroundColor: colors.background },
  errorText: { fontSize: 20, fontFamily: 'Poppins_700Bold', marginTop: 12, color: colors.text },
  errorDesc: { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 20, color: colors.textSecondary },
  backActionBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  backActionText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },

  desktopShellWrapper: { flex: 1, alignItems: 'center' },
  desktopShell: { width: '100%', maxWidth: 800 },
  detailShell: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  heroWrapper: { width: '100%' },
  heroSection: { position: 'relative', justifyContent: 'flex-end', overflow: 'hidden' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'space-between' },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  navBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(11, 11, 20, 0.45)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  heroActions: { flexDirection: 'row', gap: 10 },
  
  heroBottomContent: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  heroTitleRibbon: { alignSelf: 'flex-start' },
  heroImageTitle: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: 'white', letterSpacing: -0.5, lineHeight: 34, ...Platform.select({ web: { textShadow: '0px 2px 4px rgba(0,0,0,0.3)' }, default: { textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 } }) },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCardBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  heroCardBadgeText: { fontSize: 12, fontFamily: 'Poppins_700Bold', color: 'black', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroDateRibbonText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: 'rgba(255,255,255,0.85)' },

  heroInfoCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    gap: 10,
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  heroBadgeText: { color: colors.background, fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.2 },
  heroTitle: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: colors.text, lineHeight: 32, letterSpacing: -0.4 },
  heroOrganizer: { fontSize: 16, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },

  countdownWrapper: { marginBottom: 20 },
  countdownEndedBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderRadius: 20, borderWidth: 1, justifyContent: 'center', backgroundColor: colors.surface, borderColor: colors.borderLight },
  countdownEndedText: { fontSize: 15, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20, borderRadius: 20, borderWidth: 1, backgroundColor: colors.surface, borderColor: colors.borderLight },
  countBlock: { alignItems: 'center', minWidth: 44 },
  countNum: { fontSize: 24, fontFamily: 'Poppins_700Bold', lineHeight: 30, color: colors.text },
  countLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', color: colors.textTertiary, letterSpacing: 0.5 },
  countSep: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.borderLight, paddingBottom: 12 },

  infoGrid: { gap: 12, marginBottom: 20 },
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 16, backgroundColor: colors.surface, borderColor: colors.borderLight },
  infoIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  infoTextWrap: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.textTertiary },
  infoVal: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  infoSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  
  earlyAccessBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 20, justifyContent: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primaryLight },
  earlyAccessText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primaryLight },

  divider: { height: 1, width: '100%', marginVertical: 32, backgroundColor: colors.borderLight, opacity: 0.5 },

  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, color: colors.textTertiary },
  aboutDesc: { fontSize: 16, fontFamily: 'Poppins_400Regular', lineHeight: 26, color: colors.textSecondary },

  capacityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  capacityPercent: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: colors.textSecondary },
  capacityBarBg: { height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 8, backgroundColor: colors.surfaceElevated },
  capacityBarFill: { height: '100%', borderRadius: 5 },
  capacityFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  capacityFootText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

  tierCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, backgroundColor: colors.surface, borderColor: colors.borderLight },
  tierLeft: { gap: 2 },
  tierName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  tierAvail: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },
  tierRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tierPrice: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: CultureTokens.saffron },

  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  metricIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
  metricText: { fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.textSecondary },

  floatingBottomBarWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 },
  floatingBottomBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 10 },
      web: { boxShadow: '0 -4px 12px rgba(0,0,0,0.1)' }
    })
  },
  bottomPriceSection: { minWidth: 90, gap: 2 },
  iconActionBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPriceLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', color: colors.textSecondary, letterSpacing: 0.8 },
  bottomPriceValue: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },
  bottomBtnGroup: { flexDirection: 'row', gap: 10 },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', maxHeight: '90%' },
  modalHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 12, marginBottom: 8, backgroundColor: colors.border, opacity: 0.3 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderColor: colors.borderLight },
  modalTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text },
  modalGroupLabel: { fontSize: 12, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, color: colors.textTertiary },

  buyModeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  buyModeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  buyModeText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary },

  modalTierCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 18, borderWidth: 1, marginBottom: 12, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  modalTierLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  modalTierName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 2, color: colors.text },
  modalTierAvail: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  modalTierPrice: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },

  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 18, borderWidth: 1, backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
  quantityBtn: { width: 48, height: 48, borderRadius: 14 },
  quantityNum: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },

  priceSummaryBox: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 12, marginTop: 24, marginBottom: 24, backgroundColor: colors.surface, borderColor: colors.borderLight },
  pRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pRowLabel: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: colors.textSecondary },
  pRowVal: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  pDiv: { height: 1, width: '100%', marginVertical: 6, backgroundColor: colors.borderLight, opacity: 0.5 },
  pTotalLabel: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text },
  pTotalVal: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text },

  calOptRow:   { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 18, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  calOptIcon:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  calOptLabel: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  calOptSub:   { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, marginTop: 2 },
});

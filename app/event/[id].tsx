import {
  View, Text, Pressable, ScrollView, Platform, Share, Modal, Alert,
  ActivityIndicator, Linking, StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, usePathname, Stack } from 'expo-router';
import Head from 'expo-router/head';
import Constants from 'expo-constants';
import { BackButton } from '@/components/ui/BackButton';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { useSaved } from '@/contexts/SavedContext';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { TextStyles, CultureTokens, shadows } from '@/constants/theme';
import { api } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { calculateDistance } from '@shared/location/australian-postcodes';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import type { EventData } from '@/shared/schema';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { formatCurrency } from '@/lib/currency';
import { formatEventTime } from '@/lib/dateUtils';
import { getStyles } from '@/components/event-detail/styles';
import { EventLiquidModalBody } from '@/components/event-detail/EventLiquidModalBody';
import { HeroGlassIconButton } from '@/components/event-detail/HeroGlassIconButton';
import { EventDetailSkeleton } from '@/components/event-detail/EventDetailSkeleton';
import { formatDate, promptRsvpLogin, confirmRemoveRsvp, cityToCoordinates, toCalendarDate, toGoogleCalendarTimestamp, buildICS, safeIcsFilenameBase, isWeb } from '@/components/event-detail/utils';
import { useEventTicketing } from '@/components/event-detail/useEventTicketing';
import { AdminToolbar } from '@/components/ui/AdminToolbar';
import { useRole } from '@/hooks/useRole';
import { CultureTagRow } from '@/components/ui/CultureTag';
import { captureEvent } from '@/lib/analytics';

// Third-party brand colours — not part of the CulturePass token system
const GOOGLE_BRAND_COLOR = '#4285F4';
const OUTLOOK_BRAND_COLOR = '#0078D4';

function startCaseLabel(value?: string | null): string | null {
  if (!value) return null;
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

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
        <BackButton fallback="/(tabs)" style={{ marginTop: 16, alignSelf: 'center' }} accessibilityLabel="Return Home" />
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

  useEffect(() => {
    captureEvent('event_detail_viewed', {
      event_id: event.id,
      publisher_profile_id: event.publisherProfileId ?? null,
      venue_profile_id: event.venueProfileId ?? null,
      organizer_id: event.organizerId ?? null,
    });
  }, [event.id, event.publisherProfileId, event.venueProfileId, event.organizerId]);
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
  const isExpoGoAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';
  const reminderSupported = !isExpoGoAndroid && Platform.OS !== 'web';

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

  const { data: publisherProfile } = useQuery({
    queryKey: ['/api/profiles', event.publisherProfileId],
    queryFn: () => api.profiles.get(event.publisherProfileId!),
    enabled: !!event.publisherProfileId,
    staleTime: 120_000,
  });

  const { data: linkedVenueProfile } = useQuery({
    queryKey: ['/api/profiles', event.venueProfileId],
    queryFn: () => api.profiles.get(event.venueProfileId!),
    enabled: !!event.venueProfileId,
    staleTime: 120_000,
  });

  const canEdit = userId === event.organizerId || userId === event.createdBy || __DEV__;
  const displayCommunity = startCaseLabel(event.communityId) ?? 'General';
  const displayCategory = startCaseLabel(event.category) ?? 'Event';
  const hostName =
    publisherProfile?.name ??
    event.hostInfo?.name ??
    event.hostName ??
    startCaseLabel(event.organizerId) ??
    displayCommunity ??
    'CulturePass';
  const hostEmail =
    event.hostInfo?.contactEmail ??
    event.hostEmail ??
    publisherProfile?.contactEmail ??
    publisherProfile?.email;
  const hostPhone = event.hostInfo?.contactPhone ?? event.hostPhone ?? publisherProfile?.phone;
  const hostWebsite = event.hostInfo?.websiteUrl ?? publisherProfile?.website;
  const cultureTags = useMemo(
    () => Array.from(new Set([...(event.cultureTag ?? []), ...(event.cultureTags ?? [])])).filter(Boolean),
    [event.cultureTag, event.cultureTags],
  );
  const languageTags = useMemo(
    () => Array.from(new Set(event.languageTags ?? [])).filter(Boolean),
    [event.languageTags],
  );
  const accessibilityTags = useMemo(
    () => Array.from(new Set(event.accessibility ?? [])).filter(Boolean),
    [event.accessibility],
  );
  const sponsorNames = useMemo(
    () => Array.from(new Set((event.eventSponsors ?? []).map((sponsor) => sponsor.name).filter(Boolean))),
    [event.eventSponsors],
  );
  const artistSummary = useMemo(
    () => Array.from(new Set((event.artists ?? []).map((artist) => artist.name).filter(Boolean))),
    [event.artists],
  );
  const eventLocationLabel = useMemo(() => {
    // Prefer linkedVenueProfile.name if present, otherwise event.venue
    const primaryVenueName = linkedVenueProfile?.name && event.venueProfileId ? linkedVenueProfile.name : event.venue;
    // Build parts, deduplicating venue name
    const parts = [primaryVenueName, event.address, event.city, event.country].filter(Boolean);
    // Remove duplicate venue if present
    const dedupedParts = parts.filter((part, idx) => idx === 0 || part !== parts[0]);
    return dedupedParts.join(', ');
  }, [event.venue, event.venueProfileId, linkedVenueProfile?.name, event.address, event.city, event.country]);

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

  const {
    eventTiers,
    isPurchasing,
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
  } = useEventTicketing({
    event,
    userId,
    pathname,
    setTicketModalVisible,
  });

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
  }, [setBuyMode, setQuantity, setSelectedTierIndex, setTicketModalVisible]);

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

  const openExternalLink = useCallback((url: string, errorMessage: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', errorMessage));
  }, []);

  const handleVisitWebsite = useCallback(() => {
    if (!hostWebsite) return;
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openExternalLink(hostWebsite, 'Could not open the host website.');
  }, [hostWebsite, openExternalLink]);

  const handleEmailHost = useCallback(() => {
    if (!hostEmail) return;
    openExternalLink(`mailto:${hostEmail}`, 'Could not open your email app.');
  }, [hostEmail, openExternalLink]);

  const handleCallHost = useCallback(() => {
    if (!hostPhone) return;
    openExternalLink(`tel:${hostPhone}`, 'Could not open your phone app.');
  }, [hostPhone, openExternalLink]);


  const [calendarSheetVisible, setCalendarSheetVisible] = useState(false);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);

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

  const scheduleEventReminder = useCallback(
    async (minutesBefore: number, label: string) => {
      if (!calendarParams) {
        Alert.alert('Reminder unavailable', 'We could not parse this event date.');
        return;
      }
      if (Platform.OS === 'web') {
        Alert.alert(
          'Reminder not available on web',
          'Event reminders are available on iOS and Android. You can still add this event to your calendar.'
        );
        return;
      }

      const triggerDate = new Date(calendarParams.start.getTime() - minutesBefore * 60_000);
      if (triggerDate.getTime() <= Date.now()) {
        Alert.alert('Reminder time passed', `Cannot set a ${label.toLowerCase()} reminder because that time has already passed.`);
        return;
      }

      let NotificationsModule: typeof import('expo-notifications');
      try {
        NotificationsModule = await import('expo-notifications');
      } catch {
        Alert.alert(
          'Reminders unavailable',
          'Local reminders require a development build on Android (Expo Go limitation).'
        );
        return;
      }

      const existingPerm = await NotificationsModule.getPermissionsAsync();
      let finalStatus = existingPerm.status;
      if (finalStatus !== 'granted') {
        const req = await NotificationsModule.requestPermissionsAsync();
        finalStatus = req.status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission needed', 'Please enable notifications to receive event reminders.');
        return;
      }

      try {
        await NotificationsModule.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${event.title}`,
            body: `${label} reminder. ${formatDate(event.date)} at ${formatEventTime(event.time)}.`,
            sound: true,
            data: { screen: 'event', eventId: event.id },
          },
          trigger: triggerDate as unknown as import('expo-notifications').NotificationTriggerInput,
        });
        if (!isWeb) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setReminderSheetVisible(false);
        Alert.alert('Reminder set', `You will be reminded ${label.toLowerCase()} before this event.`);
      } catch {
        Alert.alert('Could not set reminder', 'Please try again.');
      }
    },
    [calendarParams, event.date, event.id, event.time, event.title]
  );

  const openReminderSheet = useCallback(() => {
    if (!calendarParams) {
      Alert.alert('Reminder unavailable', 'We could not parse this event date.');
      return;
    }
    setReminderSheetVisible(true);
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

                <LinearGradient
                  colors={['rgba(11,11,20,0.5)', 'transparent', 'rgba(11,11,20,0.85)']}
                  style={StyleSheet.absoluteFill}
                />

                <View
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    alignSelf: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: 'rgba(0,0,0,0.24)',
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: 'rgba(255,255,255,0.14)',
                  }}
                  pointerEvents="none"
                >
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.58)',
                      fontFamily: 'Poppins_600SemiBold',
                      fontSize: 10,
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                    }}
                  >
                    CulturePass Verified
                  </Text>
                </View>

                <View style={[s.heroOverlay, { paddingTop: topInset + 12 }]}>
                  {/* Top Header Buttons */}
                  <View style={s.heroNav}>
                    <HeroGlassIconButton
                      onPress={() => {
                        if (!isWeb) Haptics.selectionAsync();
                        router.replace('/(tabs)');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Go back"
                    >
                      <Ionicons name="chevron-back" size={24} color={colors.textOnBrandGradient} />
                    </HeroGlassIconButton>
                    <View style={s.heroActions}>
                      {canEdit ? (
                        <HeroGlassIconButton
                          onPress={handlePickCover}
                          accessibilityRole="button"
                          accessibilityLabel="Change cover image"
                        >
                          {uploading ? (
                            <ActivityIndicator size="small" color={colors.textOnBrandGradient} />
                          ) : (
                            <Ionicons name="create-outline" size={18} color={colors.textOnBrandGradient} />
                          )}
                        </HeroGlassIconButton>
                      ) : null}
                      <HeroGlassIconButton onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share">
                        <Ionicons name="share-outline" size={18} color={colors.textOnBrandGradient} />
                      </HeroGlassIconButton>
                      <HeroGlassIconButton
                        onPress={() => {
                          if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          handleSave();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Save event"
                      >
                        <Ionicons
                          name={saved ? 'bookmark' : 'bookmark-outline'}
                          size={18}
                          color={saved ? CultureTokens.gold : colors.textOnBrandGradient}
                        />
                      </HeroGlassIconButton>
                    </View>
                  </View>

                  <View style={s.heroBottomContent}>
                    <View style={s.heroTitleRibbon}>
                      <Text
                        style={[
                          TextStyles.hero,
                          {
                            color: colors.textOnBrandGradient,
                            ...Platform.select({
                              web: { textShadow: '0px 2px 6px rgba(0,0,0,0.5)' },
                              default: {
                                textShadowColor: 'rgba(0,0,0,0.5)',
                                textShadowOffset: { width: 0, height: 2 },
                                textShadowRadius: 6,
                              },
                            }),
                          },
                        ]}
                        numberOfLines={3}
                        maxFontSizeMultiplier={1.5}
                      >
                        {event.title}
                      </Text>
                    </View>
                    <View style={s.heroMetaRow}>
                        <View style={[s.heroCardBadge, { backgroundColor: CultureTokens.gold }]}>
                            <Text style={[TextStyles.badgeCaps, { color: 'black' }]}>{event.category || 'Event'}</Text>
                        </View>
                        <Text style={[TextStyles.captionSemibold, { color: colors.textOnBrandGradient, opacity: 0.92 }]}>
                          {formatDate(event.date)}
                        </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Primary Info Header */}
            <View style={s.detailShell}>
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
                <Text style={[TextStyles.body, { color: colors.textSecondary, lineHeight: 26, marginTop: 8 }]}>
                  {event.description?.trim() || 'More details for this event will be announced soon.'}
                </Text>
              </View>

              <View style={s.divider} />

              <View style={s.section}>
                <Text style={s.sectionTitle}>Plan Your Visit</Text>
                <View style={[s.actionGrid, isDesktop && s.actionGridDesktop]}>
                  <Button
                    variant="outline"
                    size="md"
                    leftIcon="location-outline"
                    onPress={openMap}
                    style={s.actionButton}
                  >
                    Open map
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    leftIcon="calendar-number-outline"
                    onPress={openCalendarSheet}
                    style={s.actionButton}
                  >
                    Add to calendar
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    leftIcon="notifications-outline"
                    onPress={openReminderSheet}
                    style={s.actionButton}
                    disabled={!reminderSupported}
                  >
                    Add reminder
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    leftIcon="share-social-outline"
                    onPress={handleShare}
                    style={s.actionButton}
                  >
                    Share event
                  </Button>
                </View>
                {eventLocationLabel ? (
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                    {eventLocationLabel}
                  </Text>
                ) : null}
                {!reminderSupported ? (
                  <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 6 }]}>
                    Reminders need a development build on Android.
                  </Text>
                ) : null}
              </View>

              {(cultureTags.length > 0 || languageTags.length > 0 || accessibilityTags.length > 0) && (
                <>
                  <View style={s.divider} />
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>Culture & Access</Text>
                    {cultureTags.length > 0 ? (
                      <View style={s.metaBlock}>
                        <Text style={TextStyles.badgeCaps}>Culture</Text>
                        <CultureTagRow tags={cultureTags} max={6} size="md" />
                      </View>
                    ) : null}
                    {languageTags.length > 0 ? (
                      <View style={s.metaBlock}>
                        <Text style={TextStyles.badgeCaps}>Languages</Text>
                        <View style={s.chipRow}>
                          {languageTags.map((tag) => (
                            <View key={tag} style={[s.metaChip, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}>
                              <Text style={[s.metaChipText, { color: colors.primaryLight }]}>{startCaseLabel(tag) ?? tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                    {accessibilityTags.length > 0 ? (
                      <View style={s.metaBlock}>
                        <Text style={TextStyles.badgeCaps}>Accessibility</Text>
                        <View style={s.chipRow}>
                          {accessibilityTags.map((tag) => (
                            <View key={tag} style={[s.metaChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                              <Text style={[s.metaChipText, { color: colors.text }]}>{startCaseLabel(tag) ?? tag}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                </>
              )}

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
                <Text style={s.sectionTitle}>Host</Text>
                <Card
                  style={s.hostCard}
                  padding={18}
                  onPress={
                    event.publisherProfileId
                      ? () =>
                          router.push({
                            pathname: '/profile/[id]',
                            params: { id: event.publisherProfileId! },
                          })
                      : undefined
                  }
                  accessibilityLabel={
                    event.publisherProfileId
                      ? `Open organiser profile ${hostName}`
                      : `Organiser: ${hostName}`
                  }
                  accessibilityHint={
                    event.publisherProfileId
                      ? 'Opens organiser profile'
                      : 'Organiser information (not interactive)'
                  }
                >
                  <View style={s.hostHeader}>
                    <View style={[s.metricIconBg, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={s.hostContent}>
                      <Text style={[TextStyles.headline, { color: colors.text }]}>{hostName}</Text>
                      <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                        {displayCategory} in {event.city}
                      </Text>
                    </View>
                  </View>
                  <View style={[s.chipRow, { marginTop: 14 }]}>
                    {hostEmail ? (
                      <Button variant="outline" size="sm" leftIcon="mail-outline" onPress={handleEmailHost}>
                        Email host
                      </Button>
                    ) : null}
                    {hostPhone ? (
                      <Button variant="outline" size="sm" leftIcon="call-outline" onPress={handleCallHost}>
                        Call host
                      </Button>
                    ) : null}
                    {hostWebsite ? (
                      <Button variant="outline" size="sm" leftIcon="globe-outline" onPress={handleVisitWebsite}>
                        Visit website
                      </Button>
                    ) : null}
                  </View>
                </Card>
              </View>

              {(artistSummary.length > 0 || sponsorNames.length > 0) && (
                <>
                  <View style={s.divider} />
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>Lineup & Partners</Text>
                    {artistSummary.length > 0 ? (
                      <View style={s.metaBlock}>
                        <Text style={TextStyles.badgeCaps}>Featuring</Text>
                        <Text style={[TextStyles.bodyMedium, { color: colors.textSecondary }]}>
                          {artistSummary.join(', ')}
                        </Text>
                      </View>
                    ) : null}
                    {sponsorNames.length > 0 ? (
                      <View style={s.metaBlock}>
                        <Text style={TextStyles.badgeCaps}>Partners</Text>
                        <View style={s.chipRow}>
                          {sponsorNames.map((name) => (
                            <View key={name} style={[s.metaChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                              <Text style={[s.metaChipText, { color: colors.text }]}>{name}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                </>
              )}

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
                   <Text style={s.metricText}>Category: {displayCategory}</Text>
                 </View>
                 <View style={s.metricRow}>
                   <View style={s.metricIconBg}><Ionicons name="people-outline" size={16} color={colors.textSecondary} /></View>
                   <Text style={s.metricText}>Community: {displayCommunity}</Text>
                 </View>
              </View>

              <View style={[s.section, { paddingTop: 2 }]}>
                <View
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    backgroundColor: colors.backgroundSecondary,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <Text style={[TextStyles.badgeCaps, { color: colors.textSecondary }]}>CPID</Text>
                  <Text style={[TextStyles.captionSemibold, { color: colors.text }]}>
                    {event.culturePassId ?? event.id}
                  </Text>
                </View>
              </View>

            </View>
          </ScrollView>
        </View>
      </View>

      {/* Floating Bottom Bar Container */}
      <View style={[s.floatingBottomBarWrapper, { paddingBottom: bottomInset + 16, pointerEvents: 'box-none' }]}>
        <LiquidGlassPanel
          borderRadius={24}
          style={[
            { marginHorizontal: 20 },
            Platform.select({
              ios: shadows.large,
              android: { elevation: 12 },
              web: shadows.medium,
            }),
            isDesktop ? { maxWidth: 800, alignSelf: 'center', width: '100%' } : null,
          ]}
          contentStyle={[s.floatingBottomBar]}
        >
          <BottomBarInner event={event} openTicketModal={openTicketModal} />
        </LiquidGlassPanel>
      </View>

      {/* Ticket Modal */}
      <Modal visible={ticketModalVisible} animationType="slide" transparent onRequestClose={() => setTicketModalVisible(false)}>
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTicketModalVisible(false)} />
          <View
            style={[
              s.modalSheet,
              isDesktop && { maxHeight: 800, maxWidth: 600, width: '100%', alignSelf: 'center', marginBottom: 'auto', marginTop: 'auto' },
            ]}
          >
            <EventLiquidModalBody isDesktop={isDesktop}>
              {!isDesktop ? <View style={s.modalHandle} /> : null}

              <View style={[s.modalHeader, isDesktop && { paddingTop: 20 }]}>
                <Text style={s.modalTitle}>Select Tickets</Text>
                <Pressable
                  onPress={() => setTicketModalVisible(false)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    {
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.backgroundSecondary,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={15} color={colors.textSecondary} />
                </Pressable>
              </View>

              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
              >
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
                loading={isPurchasing || paymentLoading}
                onPress={handlePurchase}
              >
                {totalPrice <= 0 ? "Get Free Ticket" : `Pay ${formatCurrency(totalPrice, event?.country)}`}
              </Button>
            </ScrollView>
            </EventLiquidModalBody>
          </View>
        </View>
      </Modal>

      {/* Calendar Picker Sheet */}
      <Modal visible={calendarSheetVisible} animationType="slide" transparent onRequestClose={() => setCalendarSheetVisible(false)}>
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarSheetVisible(false)} />
          <View style={[s.modalSheet]}>
            <EventLiquidModalBody isDesktop={isDesktop}>
              {!isDesktop ? <View style={s.modalHandle} /> : null}
              <View style={[s.modalHeader, { paddingTop: 16 }]}>
                <Text style={s.modalTitle}>Add to Calendar</Text>
                <Pressable
                  onPress={() => setCalendarSheetVisible(false)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    {
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.backgroundSecondary,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={15} color={colors.textSecondary} />
                </Pressable>
              </View>
              <View style={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 12 }}>
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
            </EventLiquidModalBody>
          </View>
        </View>
      </Modal>

      {/* Reminder Picker Sheet */}
      <Modal visible={reminderSheetVisible} animationType="slide" transparent onRequestClose={() => setReminderSheetVisible(false)}>
        <View style={s.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setReminderSheetVisible(false)} />
          <View style={[s.modalSheet]}>
            <EventLiquidModalBody isDesktop={isDesktop}>
              {!isDesktop ? <View style={s.modalHandle} /> : null}
              <View style={[s.modalHeader, { paddingTop: 16 }]}>
                <Text style={s.modalTitle}>Add Reminder</Text>
                <Pressable
                  onPress={() => setReminderSheetVisible(false)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    {
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.backgroundSecondary,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={15} color={colors.textSecondary} />
                </Pressable>
              </View>
              <View style={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 12 }}>
                {[
                  { label: '1 day before', mins: 24 * 60 },
                  { label: '3 hours before', mins: 3 * 60 },
                  { label: '1 hour before', mins: 60 },
                  { label: '15 minutes before', mins: 15 },
                ].map((opt) => (
                  <Pressable
                    key={opt.label}
                    style={({ pressed }) => [s.calOptRow, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => {
                      void scheduleEventReminder(opt.mins, opt.label);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Set reminder ${opt.label}`}
                  >
                    <View style={[s.calOptIcon, { backgroundColor: CultureTokens.indigo + '18' }]}>
                      <Ionicons name="notifications-outline" size={20} color={CultureTokens.indigo} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.calOptLabel}>{opt.label}</Text>
                      <Text style={s.calOptSub}>Local notification on this device</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
            </EventLiquidModalBody>
          </View>
        </View>
      </Modal>

    </View>
  );
}

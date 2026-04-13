// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, usePathname, router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/currency';
import { formatEventDateTime } from '@/lib/dateUtils';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useImageUpload } from '@/hooks/useImageUpload';
import { CultureTokens, TextStyles } from '@/constants/theme';
import { EventDetailSkeleton } from '@/components/event-detail/EventDetailSkeleton';
import { EventPageOrchestrator } from '@/components/event-detail/EventPageOrchestrator';
import { EventHero } from '@/components/event-detail/EventHero';
import { PrimaryActionSection } from '@/components/event-detail/PrimaryActionSection';
import { DetailsSection } from '@/components/event-detail/DetailsSection';
import { TicketsSection } from '@/components/event-detail/TicketsSection';
import { HostSection } from '@/components/event-detail/HostSection';
import { DiscoverySection } from '@/components/event-detail/DiscoverySection';
import { SidebarCard } from '@/components/event-detail/SidebarCard';
import { EventLiquidModalBody } from '@/components/event-detail/EventLiquidModalBody';
import { getStyles } from '@/components/event-detail/styles';
import {
  cityToCoordinates,
  confirmRemoveRsvp,
  promptRsvpLogin,
  startCaseLabel,
  toCalendarDate,
} from '@/components/event-detail/utils';
import { useEventTicketing } from '@/components/event-detail/useEventTicketing';
import type { EventData, Profile } from '@/shared/schema';

const EMPTY_EVENT: EventData = {
  id: '',
  title: '',
  description: '',
  date: '',
  country: '',
  city: '',
};

function normalizeTagList(...groups: Array<string[] | undefined>): string[] {
  const merged = groups.flatMap((group) => group ?? []).filter((value): value is string => Boolean(value));
  return Array.from(new Set(merged.map((item) => item.trim()).filter(Boolean)));
}

function StorySection({
  eyebrow,
  title,
  subtitle,
  children,
  colors,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Card
      glass
      shadow="small"
      style={{
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,
        backgroundColor: colors.surface,
        borderColor: colors.borderLight,
      }}
    >
      <View style={{ marginBottom: 12 }}>
        <Text style={[TextStyles.badgeCaps, { color: colors.textTertiary }]}>{eyebrow}</Text>
        <Text style={[TextStyles.title3, { color: colors.text, marginTop: 4 }]}>{title}</Text>
        {subtitle ? (
          <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </Card>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const eventId = typeof id === 'string' ? id : '';
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  const { userId, user } = useAuth();
  const colors = useColors();
  const isDark = useIsDark();
  const s = getStyles(colors, isDark);
  const queryClient = useQueryClient();
  const { uploadImage, uploading } = useImageUpload();

  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 20 : Math.max(insets.bottom, 20);

  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [myRsvp, setMyRsvp] = useState<'going' | 'maybe' | 'not_going' | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.events.get(eventId),
    enabled: eventId.length > 0,
    staleTime: 15000,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });

  const { data: myRsvpData } = useQuery({
    queryKey: ['event', eventId, 'my-rsvp', userId],
    queryFn: () => api.events.myRsvp(eventId),
    enabled: Boolean(userId && eventId),
    staleTime: 10000,
    refetchInterval: 20000,
  });

  const { data: publisherProfile } = useQuery({
    queryKey: ['profile', event?.publisherProfileId],
    queryFn: () => api.profiles.get(event!.publisherProfileId!),
    enabled: Boolean(event?.publisherProfileId),
  });

  const { data: similarEvents = [] } = useQuery({
    queryKey: ['event', event?.id, 'similar', event?.city, event?.country],
    enabled: Boolean(event?.id && event?.city),
    queryFn: async () => {
      const response = await api.events.list({
        city: event!.city,
        country: event!.country,
        pageSize: 12,
      });
      return response.events.filter((candidate) => candidate.id !== event!.id).slice(0, 8);
    },
  });

  const { data: relatedCommunities = [] } = useQuery({
    queryKey: ['event', event?.id, 'communities', event?.communityId, event?.city, event?.country],
    enabled: Boolean(event?.id),
    queryFn: async () => {
      if (event?.communityId) {
        try {
          const community = await api.communities.get(event.communityId);
          return [community];
        } catch {
          return [];
        }
      }
      const communities = await api.communities.list({ city: event?.city, country: event?.country });
      return communities.slice(0, 8);
    },
  });

  useEffect(() => {
    if (!event) return;
    const eventAsRecord = event as unknown as Record<string, unknown>;
    setSaved(Boolean(eventAsRecord.favorite ?? eventAsRecord.saved));
    setMyRsvp(event.myRsvp ?? null);
  }, [event]);

  useEffect(() => {
    if (myRsvpData?.status === undefined) return;
    setMyRsvp(myRsvpData.status);
  }, [myRsvpData]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const hostName = useMemo(() => {
    if (!event) return 'CulturePass host';
    return (
      event.hostInfo?.name ||
      event.hostName ||
      publisherProfile?.name ||
      'CulturePass host'
    );
  }, [event, publisherProfile?.name]);

  const hostEmail = event?.hostInfo?.contactEmail ?? event?.hostEmail ?? null;
  const hostPhone = event?.hostInfo?.contactPhone ?? event?.hostPhone ?? null;
  const hostWebsite = event?.hostInfo?.websiteUrl ?? null;
  const displayCategory = startCaseLabel(event?.category) ?? 'Cultural event';
  const displayCommunity = useMemo(() => {
    const first = relatedCommunities[0];
    return first?.name ?? 'Independent community';
  }, [relatedCommunities]);
  const isPlus = user?.subscriptionTier === 'plus' || user?.subscriptionTier === 'elite';
  const isFreeOrOpen = Boolean(
    event &&
      (event.entryType === 'free_open' ||
        event.isFree ||
        (event.priceCents ?? 0) <= 0),
  );

  const countdown = useMemo(() => {
    if (!event?.date) return null;
    const startsAt = toCalendarDate(event.date, event.time);
    if (!startsAt) return null;
    const diff = startsAt.getTime() - nowMs;
    if (diff <= 0) return { ended: true, days: 0, hours: 0, minutes: 0 };
    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    return { ended: false, days, hours, minutes };
  }, [event?.date, event?.time, nowMs]);

  const capacityPercent = useMemo(() => {
    if (!event?.capacity || event.capacity <= 0) return 0;
    const percent = Math.round(((event.attending ?? 0) / event.capacity) * 100);
    return Math.max(0, Math.min(100, percent));
  }, [event?.attending, event?.capacity]);

  const cultureTags = normalizeTagList(event?.cultureTags, event?.cultureTag, event?.indigenousTags);
  const languageTags = normalizeTagList(event?.languageTags);
  const accessibilityTags = normalizeTagList(event?.accessibility);
  const artistSummary = (event?.artists ?? []).map((artist) => artist.name).filter(Boolean);
  const sponsorNames = normalizeTagList(
    (event?.eventSponsors ?? []).map((sponsor) => sponsor.name),
    event?.sponsors?.split(',').map((name) => name.trim()),
  );
  const eventTags = normalizeTagList(
    event?.tags,
    event?.category ? [event.category] : [],
    event?.eventType ? [event.eventType] : [],
  );
  const goingCount = Math.max(event?.rsvpGoing ?? 0, event?.attending ?? 0);
  const canEdit = Boolean(userId && event && (event.organizerId === userId || event.createdBy === userId));
  const effectiveMyRsvp = myRsvpData?.status ?? myRsvp;

  const tierPrices = (event?.tiers ?? []).map((tier) => tier.priceCents).filter((price) => Number.isFinite(price));
  const floorTierPrice = tierPrices.length > 0 ? Math.min(...tierPrices) : event?.priceCents ?? 0;
  const ceilingTierPrice = tierPrices.length > 0 ? Math.max(...tierPrices) : event?.priceCents ?? 0;
  const entryLabel = isFreeOrOpen
    ? 'Free / RSVP'
    : floorTierPrice === ceilingTierPrice
      ? formatCurrency(floorTierPrice, event?.country)
      : `${formatCurrency(floorTierPrice, event?.country)} - ${formatCurrency(ceilingTierPrice, event?.country)}`;
  const startsLabel = event ? formatEventDateTime(event.date, event.time, event.country) : '';
  const venuePrimary = event?.venue || event?.city || 'Venue TBC';
  const venueSecondary = event?.address || [event?.city, event?.country].filter(Boolean).join(', ');
  const spotsLeft = event?.capacity ? Math.max(0, event.capacity - (event.attending ?? 0)) : null;

  const saveMutation = useMutation({
    mutationFn: (nextSaved: boolean) => api.events.favorite(eventId, nextSaved),
    onMutate: async (nextSaved: boolean) => {
      setSaved(nextSaved);
      return { previous: !nextSaved };
    },
    onError: () => {
      setSaved((prev) => !prev);
      Alert.alert('Could not save event', 'Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: 'going' | 'maybe' | 'not_going') => api.events.rsvp(eventId, status),
    onMutate: (status) => {
      setMyRsvp(status);
    },
    onError: (mutationError) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      if (mutationError instanceof ApiError && mutationError.isUnauthorized) {
        promptRsvpLogin(pathname);
        return;
      }
      Alert.alert('Could not update RSVP', 'Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  const handleShare = useCallback(async () => {
    if (!event) return;
    const webOrigin =
      typeof globalThis !== 'undefined' &&
      'location' in globalThis &&
      typeof globalThis.location?.origin === 'string'
        ? globalThis.location.origin
        : 'https://culturepass.app';
    const link = Platform.OS === 'web'
      ? `${webOrigin}/event/${event.id}`
      : `culturepass://event/${event.id}`;
    try {
      await Share.share({
        message: `${event.title} • ${event.city}\n${link}`,
        url: link,
        title: event.title,
      });
    } catch {
      Alert.alert('Share unavailable', 'Try again in a moment.');
    }
  }, [event]);

  const handleSave = useCallback(() => {
    const nextSaved = !saved;
    saveMutation.mutate(nextSaved);
  }, [saveMutation, saved]);

  const handleRsvp = useCallback((status: 'going' | 'maybe' | 'not_going') => {
    if (!userId) {
      promptRsvpLogin(pathname);
      return;
    }
    rsvpMutation.mutate(status);
  }, [pathname, rsvpMutation, userId]);

  const handlePrimaryGoingPress = useCallback(() => {
    if (!userId) {
      promptRsvpLogin(pathname);
      return;
    }
    if (effectiveMyRsvp === 'going') {
      confirmRemoveRsvp(() => handleRsvp('not_going'));
      return;
    }
    handleRsvp('going');
  }, [effectiveMyRsvp, handleRsvp, pathname, userId]);

  const handlePickCover = useCallback(async () => {
    if (!event || !canEdit) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to update the event cover.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    if (result.canceled) return;
    try {
      const uploadResult = await uploadImage(result, 'events', event.id, 'heroImageUrl');
      queryClient.setQueryData(['event', event.id], (oldValue: EventData | undefined) => {
        if (!oldValue) return oldValue;
        return {
          ...oldValue,
          heroImageUrl: uploadResult.downloadURL,
        };
      });
    } catch {
      Alert.alert('Upload failed', 'Could not update event cover. Please try again.');
    }
  }, [canEdit, event, queryClient, uploadImage]);

  const openMap = useCallback(() => {
    if (!event) return;
    const locationText = [event.venue, event.address, event.city].filter(Boolean).join(', ');
    const fallbackCoords = cityToCoordinates(event.city);
    const mapQuery = event.lat && event.lng
      ? `${event.lat},${event.lng}`
      : fallbackCoords
        ? `${fallbackCoords.latitude},${fallbackCoords.longitude}`
        : locationText;
    const encoded = encodeURIComponent(mapQuery);
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    });
    if (!mapUrl) return;
    Linking.openURL(mapUrl).catch(() => {
      Alert.alert('Unable to open map', 'Please check your map app settings.');
    });
  }, [event]);

  const handleEmailHost = useCallback(() => {
    if (!hostEmail) return;
    Linking.openURL(`mailto:${hostEmail}?subject=${encodeURIComponent('Event enquiry')}`).catch(() => {
      Alert.alert('Could not open email', 'Please try again.');
    });
  }, [hostEmail]);

  const handleCallHost = useCallback(() => {
    if (!hostPhone) return;
    Linking.openURL(`tel:${hostPhone}`).catch(() => {
      Alert.alert('Could not place call', 'Please try again.');
    });
  }, [hostPhone]);

  const handleVisitWebsite = useCallback(() => {
    if (!hostWebsite) return;
    const url = /^https?:\/\//i.test(hostWebsite) ? hostWebsite : `https://${hostWebsite}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open website', 'Please try again.');
    });
  }, [hostWebsite]);

  const eventForTicketing = event ?? EMPTY_EVENT;
  const {
    eventTiers,
    isPurchasing,
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
    event: eventForTicketing,
    userId,
    pathname,
    setTicketModalVisible,
  });

  const openTicketModal = useCallback((tierIndex?: number) => {
    if (typeof tierIndex === 'number') {
      setSelectedTierIndex(tierIndex);
    }
    setTicketModalVisible(true);
  }, [setSelectedTierIndex]);

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (error || !event) {
    return (
      <View style={s.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={42} color={colors.error} />
        <Text style={s.errorText}>Event not available</Text>
        <Text style={s.errorDesc}>
          This event may have been removed or is currently unavailable.
        </Text>
        <Pressable
          onPress={() => router.replace('/events')}
          style={s.backActionBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back to events"
        >
          <Text style={s.backActionText}>Back to events</Text>
        </Pressable>
      </View>
    );
  }

  const mainContent = (
    <>
      <EventHero
        event={event}
        heroDisplayUri={event.heroImageUrl ?? event.imageUrl}
        saved={saved}
        canEdit={canEdit}
        uploading={uploading}
        isDesktop={isDesktop}
        topInset={topInset}
        handleShare={handleShare}
        handleSave={handleSave}
        handlePickCover={handlePickCover}
        colors={colors}
        s={s}
      />

      <View style={s.detailShell}>
        <StorySection
          eyebrow="At a glance"
          title="Quick event snapshot"
          subtitle="When, where, entry, attendance, then your next move."
          colors={colors}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <View
              style={{
                width: '48.5%',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
                backgroundColor: colors.backgroundSecondary,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text style={[TextStyles.badgeCaps, { color: colors.textTertiary }]}>When</Text>
              <Text style={[TextStyles.captionSemibold, { color: colors.text }]} numberOfLines={1}>
                {startsLabel}
              </Text>
            </View>
            <View
              style={{
                width: '48.5%',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
                backgroundColor: colors.backgroundSecondary,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text style={[TextStyles.badgeCaps, { color: colors.textTertiary }]}>Where</Text>
              <Text style={[TextStyles.captionSemibold, { color: colors.text }]} numberOfLines={1}>
                {venuePrimary}
              </Text>
              <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 1 }]} numberOfLines={1}>
                {venueSecondary}
              </Text>
            </View>
            <View
              style={{
                width: '48.5%',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
                backgroundColor: colors.backgroundSecondary,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text style={[TextStyles.badgeCaps, { color: colors.textTertiary }]}>Entry</Text>
              <Text style={[TextStyles.captionSemibold, { color: colors.text }]} numberOfLines={1}>
                {entryLabel}
              </Text>
            </View>
            <View
              style={{
                width: '48.5%',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderLight,
                backgroundColor: colors.backgroundSecondary,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text style={[TextStyles.badgeCaps, { color: colors.textTertiary }]}>Attendance</Text>
              <Text style={[TextStyles.captionSemibold, { color: colors.text }]} numberOfLines={1}>
                {goingCount.toLocaleString()} going
              </Text>
              {spotsLeft !== null ? (
                <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 1 }]} numberOfLines={1}>
                  {spotsLeft.toLocaleString()} spots left
                </Text>
              ) : null}
            </View>
          </View>

          <Text style={[TextStyles.badgeCaps, { color: colors.textTertiary, marginBottom: 6 }]}>Your next move</Text>

          <PrimaryActionSection
            event={event}
            saved={saved}
            isFreeOrOpen={isFreeOrOpen}
            myRsvp={effectiveMyRsvp}
            userId={userId}
            pathname={pathname}
            rsvpMutation={{ isPending: rsvpMutation.isPending }}
            handlePrimaryGoingPress={handlePrimaryGoingPress}
            handleRsvp={handleRsvp}
            handleExternalTicketPress={handleExternalTicketPress}
            openTicketModal={openTicketModal}
            handleShare={handleShare}
            handleSave={handleSave}
            colors={colors}
            s={s}
          />
        </StorySection>

        <StorySection
          eyebrow="Plan your visit"
          title="Everything you need before you go"
          subtitle="Time, venue, accessibility and attendance insights."
          colors={colors}
        >
          <DetailsSection
            event={event}
            countdown={countdown}
            capacityPercent={capacityPercent}
            distanceKm={event.distanceKm ?? null}
            cultureTags={cultureTags}
            languageTags={languageTags}
            accessibilityTags={accessibilityTags}
            artistSummary={artistSummary}
            sponsorNames={sponsorNames}
            isPlus={isPlus}
            displayCategory={displayCategory}
            displayCommunity={displayCommunity}
            description={event.description}
            openMap={openMap}
            colors={colors}
            s={s}
          />
        </StorySection>

        <StorySection
          eyebrow="Tickets & host"
          title="Reserve confidently"
          subtitle="Choose your tier and contact the organizer instantly."
          colors={colors}
        >
          <TicketsSection
            event={event}
            eventTiers={eventTiers ?? []}
            openTicketModal={openTicketModal}
            colors={colors}
            s={s}
          />

          <HostSection
            event={event}
            hostName={hostName}
            displayCategory={displayCategory}
            hostEmail={hostEmail}
            hostPhone={hostPhone}
            hostWebsite={hostWebsite}
            handleEmailHost={handleEmailHost}
            handleCallHost={handleCallHost}
            handleVisitWebsite={handleVisitWebsite}
            colors={colors}
            s={s}
          />
        </StorySection>

        <StorySection
          eyebrow="Keep exploring"
          title="Continue your cultural journey"
          subtitle="Related events and communities, tailored to this vibe."
          colors={colors}
        >
          <DiscoverySection
            event={event}
            similarEvents={similarEvents}
            relatedCommunities={relatedCommunities}
            colors={colors}
            s={s}
          />
        </StorySection>
      </View>
    </>
  );

  const sidebarContent = (
    <SidebarCard
      event={event}
      hostName={hostName}
      publisherProfile={publisherProfile as Profile | undefined}
      eventTags={eventTags}
      goingCount={goingCount}
      hostEmail={hostEmail}
      hostPhone={hostPhone}
      hostWebsite={hostWebsite}
      handleEmailHost={handleEmailHost}
      handleCallHost={handleCallHost}
      handleVisitWebsite={handleVisitWebsite}
      colors={colors}
    />
  );

  return (
    <View style={s.container}>
      <EventPageOrchestrator
        isDesktop={isDesktop}
        bottomInset={bottomInset}
        mainContent={mainContent}
        sidebarContent={sidebarContent}
        s={s}
      />

      <Modal
        visible={ticketModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTicketModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <EventLiquidModalBody isDesktop={isDesktop} style={[s.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Reserve your spot</Text>
              <Pressable
                onPress={() => setTicketModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close ticket selector"
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomInset + 24 }}
              showsVerticalScrollIndicator={false}
            >
              {isFreeOrOpen ? null : (
                <>
                  <Text style={s.modalGroupLabel}>Purchase mode</Text>
                  <View style={s.buyModeRow}>
                    {[
                      { key: 'single', label: 'Single', icon: 'person-outline' },
                      { key: 'family', label: 'Family', icon: 'people-outline' },
                      { key: 'group', label: 'Group', icon: 'people-circle-outline' },
                    ].map((modeOption) => {
                      const active = buyMode === modeOption.key;
                      return (
                        <Pressable
                          key={modeOption.key}
                          onPress={() => setBuyMode(modeOption.key as 'single' | 'family' | 'group')}
                          style={[
                            s.buyModeBtn,
                            {
                              borderColor: active ? colors.primary : colors.borderLight,
                              backgroundColor: active ? colors.primarySoft : colors.backgroundSecondary,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Choose ${modeOption.label} purchase mode`}
                          accessibilityState={{ selected: active }}
                        >
                          <Ionicons
                            name={modeOption.icon as keyof typeof Ionicons.glyphMap}
                            size={16}
                            color={active ? colors.primary : colors.textSecondary}
                          />
                          <Text style={[s.buyModeText, { color: active ? colors.primary : colors.textSecondary }]}>
                            {modeOption.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={s.modalGroupLabel}>Select tier</Text>
              {(eventTiers?.length ? eventTiers : [{ name: 'General Admission', priceCents: 0, available: 999 }]).map((tier, index) => {
                const active = selectedTierIndex === index;
                return (
                  <Pressable
                    key={`${tier.name}-${index}`}
                    onPress={() => setSelectedTierIndex(index)}
                    style={[
                      s.modalTierCard,
                      {
                        borderColor: active ? CultureTokens.gold : colors.borderLight,
                        backgroundColor: active ? CultureTokens.gold + '14' : colors.backgroundSecondary,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${tier.name} tier`}
                    accessibilityState={{ selected: active }}
                  >
                    <View style={s.modalTierLeft}>
                      <View style={[s.radioOuter, { borderColor: active ? CultureTokens.gold : colors.borderLight }]}>
                        {active ? <View style={[s.radioInner, { backgroundColor: CultureTokens.gold }]} /> : null}
                      </View>
                      <View>
                        <Text style={s.modalTierName}>{tier.name}</Text>
                        <Text style={s.modalTierAvail}>{Math.max(tier.available, 0)} available</Text>
                      </View>
                    </View>
                    <Text style={s.modalTierPrice}>
                      {tier.priceCents === 0 ? 'Free' : formatCurrency(tier.priceCents, event.country)}
                    </Text>
                  </Pressable>
                );
              })}

              <Text style={[s.modalGroupLabel, { marginTop: 8 }]}>Quantity</Text>
              <View style={s.quantityRow}>
                <Pressable
                  onPress={() => setQuantity((current) => Math.max(minQty, current - 1))}
                  style={[s.quantityBtn, { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight }]}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease ticket quantity"
                >
                  <Ionicons name="remove" size={20} color={colors.text} />
                </Pressable>
                <Text style={s.quantityNum}>{buyMode === 'family' ? 4 : quantity}</Text>
                <Pressable
                  onPress={() => setQuantity((current) => Math.min(maxQty, current + 1))}
                  style={[s.quantityBtn, { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight }]}
                  accessibilityRole="button"
                  accessibilityLabel="Increase ticket quantity"
                >
                  <Ionicons name="add" size={20} color={colors.text} />
                </Pressable>
              </View>

              <View style={s.priceSummaryBox}>
                <View style={s.pRow}>
                  <Text style={s.pRowLabel}>Tier</Text>
                  <Text style={s.pRowVal}>{selectedTier?.name ?? 'General Admission'}</Text>
                </View>
                <View style={s.pRow}>
                  <Text style={s.pRowLabel}>Tickets</Text>
                  <Text style={s.pRowVal}>{effectiveQty}</Text>
                </View>
                <View style={s.pRow}>
                  <Text style={s.pRowLabel}>Subtotal</Text>
                  <Text style={s.pRowVal}>{formatCurrency(rawTotal, event.country)}</Text>
                </View>
                {discountAmount > 0 ? (
                  <View style={s.pRow}>
                    <Text style={s.pRowLabel}>Discount</Text>
                    <Text style={[s.pRowVal, { color: CultureTokens.teal }]}>- {formatCurrency(discountAmount, event.country)}</Text>
                  </View>
                ) : null}
                <View style={s.pDiv} />
                <View style={s.pRow}>
                  <Text style={s.pTotalLabel}>Total</Text>
                  <Text style={s.pTotalVal}>{formatCurrency(totalPrice, event.country)}</Text>
                </View>
              </View>

              <Button
                variant="gradient"
                size="lg"
                fullWidth
                leftIcon={totalPrice > 0 ? 'card-outline' : 'checkmark-circle-outline'}
                onPress={handlePurchase}
                loading={isPurchasing}
              >
                {totalPrice > 0 ? 'Continue to payment' : 'Confirm reservation'}
              </Button>
            </ScrollView>
          </EventLiquidModalBody>
        </View>
      </Modal>

      {uploading ? (
        <View style={{ position: 'absolute', top: topInset + 12, right: 16 }}>
          <ActivityIndicator size="small" color={CultureTokens.gold} />
        </View>
      ) : null}
    </View>
  );
}

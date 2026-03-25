import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  KeyboardAvoidingView, Alert, ActivityIndicator, Share,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api, ApiError } from '@/lib/api';
import { ALL_NATIONALITIES, getCulturesForNationality } from '@/constants/cultures';
import { EventData, EventType, EventArtist, EventSponsor, EventHostInfo } from '@/shared/schema';
import { TextStyles } from '@/constants/typography';
import { useImageUpload } from '@/hooks/useImageUpload';
import { getCurrencyForCountry } from '@/lib/dateUtils';
import { useAuth } from '@/lib/auth';

import { getStyles } from '@/components/event-create/styles';
import {
  FormData, ArtistDraft, SponsorDraft, TierDraft,
  defaultForm, ALL_STEPS, STEP_TITLES, STEP_ICONS, getStepSub,
} from '@/components/event-create/types';
import { StepBasics } from '@/components/event-create/StepBasics';
import { StepImage } from '@/components/event-create/StepImage';
import { StepLocation } from '@/components/event-create/StepLocation';
import { StepDatetime } from '@/components/event-create/StepDatetime';
import { StepEntry } from '@/components/event-create/StepEntry';
import { StepTickets } from '@/components/event-create/StepTickets';
import { StepTeam } from '@/components/event-create/StepTeam';
import { StepCulture } from '@/components/event-create/StepCulture';
import { StepReview } from '@/components/event-create/StepReview';

type Step = typeof ALL_STEPS[number];

// ---------------------------------------------------------------------------
// Success Screen
// ---------------------------------------------------------------------------
function SuccessScreen({
  event,
  onCreateAnother,
  colors,
}: {
  event: EventData;
  onCreateAnother: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const s = getStyles(colors);
  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out ${event.title} on CulturePass!` });
    } catch {
      // user cancelled
    }
  };

  return (
    <View style={[s.successRoot, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.teal + 'CC', colors.background]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Animated.View entering={FadeInUp.delay(0).springify().damping(18)} style={s.successIconWrap}>
        <Ionicons name="checkmark-circle" size={80} color={CultureTokens.teal} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).springify().damping(18)} style={s.successContent}>
        <Text style={[s.successTitle, { color: colors.text }]}>Published!</Text>
        <Text style={[s.successSub, { color: colors.textSecondary }]}>
          {event.title} is now live and visible in Discover.
        </Text>
        {event.heroImageUrl ? (
          <Image
            source={{ uri: event.heroImageUrl }}
            style={s.successImage}
            contentFit="cover"
            accessibilityLabel="Event hero image"
          />
        ) : null}
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(240).springify().damping(18)} style={s.successActions}>
        <Button
          variant="primary" size="lg" fullWidth leftIcon="eye-outline"
          style={{ backgroundColor: CultureTokens.teal }}
          onPress={() => router.replace({ pathname: '/event/[id]', params: { id: event.id } })}
        >
          View Event
        </Button>
        <Button variant="outline" size="lg" fullWidth leftIcon="share-social-outline" onPress={handleShare}>
          Share Event
        </Button>
        <Button variant="ghost" size="md" fullWidth onPress={onCreateAnother}>
          Create Another Event
        </Button>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CreateEventScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { state: onboardingState } = useOnboarding();

  const isDesktop = Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth >= 1024;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const [form, setForm] = useState<FormData>({
    ...defaultForm,
    city: onboardingState.city || '',
    country: onboardingState.country || 'Australia',
    cultureTagIds: onboardingState.cultureIds?.slice(0, 3) ?? [],
    languageTagIds: onboardingState.languageIds?.slice(0, 2) ?? [],
    accessibilityIds: [],
  });

  const [stepIndex, setStepIndex] = useState(0);
  const { uploadImage, deleteImage, uploading: imageUploading } = useImageUpload();
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [publishedEvent, setPublishedEvent] = useState<EventData | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [newArtist, setNewArtist] = useState<ArtistDraft>({ name: '', role: '' });
  const [newSponsor, setNewSponsor] = useState<SponsorDraft>({ name: '', tier: 'gold' });
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [showAddTier, setShowAddTier] = useState(false);
  const [newTier, setNewTier] = useState<TierDraft>({ name: '', priceCents: '', capacity: '' });
  const [artistSearch, setArtistSearch] = useState('');

  const { data: artistResults } = useQuery({
    queryKey: ['/api/profiles', 'artist', artistSearch],
    queryFn: () => api.profiles.list(),
    enabled: artistSearch.length > 1,
    staleTime: 30_000,
  });

  const visibleSteps = useMemo((): Step[] =>
    ALL_STEPS.filter((s) => s !== 'tickets' || form.entryType === 'ticketed'),
  [form.entryType]);

  const step = visibleSteps[stepIndex];

  const availableCultures = useMemo(() => {
    const nat = onboardingState.nationalityId;
    if (nat) return getCulturesForNationality(nat);
    return ALL_NATIONALITIES.flatMap((n) => getCulturesForNationality(n.id)).slice(0, 30);
  }, [onboardingState.nationalityId]);

  const currency = getCurrencyForCountry(form.country);

  // ── Mutation ──────────────────────────────────────────────────────────────
  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: async () => {
      const isTicketed = form.entryType === 'ticketed';
      const payload: Partial<EventData> = {
        title:       form.title.trim(),
        description: form.description.trim(),
        eventType:   form.eventType as EventType || undefined,
        category:    form.eventType || undefined,
        venue:       form.venue.trim() || undefined,
        address:     form.address.trim() || undefined,
        city:        form.city.trim(),
        country:     form.country.trim(),
        date:        form.date,
        endDate:     form.endDate || undefined,
        time:        form.time || undefined,
        endTime:     form.endTime || undefined,
        heroImageUrl: form.heroImageUrl || undefined,
        imageUrl:    form.heroImageUrl || undefined,
        entryType:   form.entryType,
        isFree:      !isTicketed,
        priceCents:  isTicketed && form.tiers.length === 0
          ? Math.round(parseFloat(form.priceCents || '0') * 100)
          : 0,
        capacity:    form.capacity ? parseInt(form.capacity, 10) : undefined,
        tiers:       isTicketed && form.tiers.length > 0
          ? form.tiers.map((t) => ({
              name: t.name,
              priceCents: Math.round(parseFloat(t.priceCents || '0') * 100),
              available: t.capacity ? parseInt(t.capacity, 10) : 999,
            }))
          : undefined,
        cultureTag:  form.cultureTagIds,
        languageTags: form.languageTagIds,
        accessibility: form.accessibilityIds,
        artists: form.artists.length > 0
          ? form.artists.map((a) => ({ name: a.name, role: a.role || undefined, profileId: a.profileId, imageUrl: a.imageUrl } as EventArtist))
          : undefined,
        eventSponsors: form.sponsors.length > 0
          ? form.sponsors.map((sp) => ({ name: sp.name, tier: sp.tier, websiteUrl: sp.websiteUrl, logoUrl: sp.logoUrl } as EventSponsor))
          : undefined,
        hostInfo: form.hostInfo.name ? ({
          name: form.hostInfo.name,
          contactEmail: form.hostInfo.contactEmail || undefined,
          contactPhone: form.hostInfo.contactPhone || undefined,
          websiteUrl: form.hostInfo.websiteUrl || undefined,
        } as EventHostInfo) : null,
        hostName:  form.hostInfo.name || undefined,
        hostEmail: form.hostInfo.contactEmail || undefined,
        hostPhone: form.hostInfo.contactPhone || undefined,
      };
      const draft = await api.events.create(payload);
      await api.events.publish(draft.id);
      return draft;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPublishedEvent(event);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isUnauthorized) {
        router.push('/(onboarding)/login');
        return;
      }
      const message = err instanceof Error ? err.message : 'Please try again.';
      setPublishError(message);
      if (Platform.OS !== 'web') Alert.alert('Could not create event', message);
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleCultureTag = useCallback((id: string) => {
    haptic();
    setField('cultureTagIds', form.cultureTagIds.includes(id)
      ? form.cultureTagIds.filter((c) => c !== id)
      : [...form.cultureTagIds, id]);
  }, [form.cultureTagIds, setField]);

  const toggleLanguageTag = useCallback((id: string) => {
    haptic();
    setField('languageTagIds', form.languageTagIds.includes(id)
      ? form.languageTagIds.filter((l) => l !== id)
      : [...form.languageTagIds, id]);
  }, [form.languageTagIds, setField]);

  const toggleAccessibilityTag = useCallback((id: string) => {
    haptic();
    setField('accessibilityIds', form.accessibilityIds.includes(id)
      ? form.accessibilityIds.filter((l) => l !== id)
      : [...form.accessibilityIds, id]);
  }, [form.accessibilityIds, setField]);

  const pickImage = useCallback(async () => {
    haptic();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    
    setImageUploadError(null);
    try {
      if (form.heroImageUrl) {
        // Purge orphaned pre-creation images
        await deleteImage('events', 'temp', form.heroImageUrl, 'heroImageUrl');
      }
      const uploadId = userId ?? `anon-${Date.now()}`;
      const { downloadURL } = await uploadImage(result, 'events', uploadId, 'heroImageUrl', true);
      setField('heroImageUrl', downloadURL);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image. Please try again.';
      setImageUploadError(message);
    }
  }, [userId, setField, form.heroImageUrl, deleteImage, uploadImage]);

  const addArtist = useCallback(() => {
    if (!newArtist.name.trim()) return;
    setField('artists', [...form.artists, { ...newArtist, name: newArtist.name.trim() }]);
    setNewArtist({ name: '', role: '' });
    setShowArtistForm(false);
    haptic();
  }, [newArtist, form.artists, setField]);

  const removeArtist = useCallback((index: number) => {
    setField('artists', form.artists.filter((_, i) => i !== index));
  }, [form.artists, setField]);

  const addSponsor = useCallback(() => {
    if (!newSponsor.name.trim()) return;
    setField('sponsors', [...form.sponsors, { ...newSponsor, name: newSponsor.name.trim() }]);
    setNewSponsor({ name: '', tier: 'gold' });
    setShowSponsorForm(false);
    haptic();
  }, [newSponsor, form.sponsors, setField]);

  const removeSponsor = useCallback((index: number) => {
    setField('sponsors', form.sponsors.filter((_, i) => i !== index));
  }, [form.sponsors, setField]);

  const addTier = useCallback(() => {
    if (!newTier.name.trim()) return;
    setField('tiers', [...form.tiers, { ...newTier, name: newTier.name.trim() }]);
    setNewTier({ name: '', priceCents: '', capacity: '' });
    setShowAddTier(false);
    haptic();
  }, [newTier, form.tiers, setField]);

  const removeTier = useCallback((index: number) => {
    setField('tiers', form.tiers.filter((_, i) => i !== index));
  }, [form.tiers, setField]);

  const validateStep = useCallback((): string | null => {
    if (step === 'basics') {
      if (!form.title.trim()) return 'Event title is required.';
      if (form.title.trim().length < 5) return 'Title must be at least 5 characters.';
      if (!form.description.trim()) return 'Description is required.';
    }
    if (step === 'location' && !form.city.trim()) return 'City is required.';
    if (step === 'datetime') {
      if (!form.date) return 'Date is required.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return 'Date format must be YYYY-MM-DD.';
      if (form.endDate && form.endDate < form.date) return 'End date cannot be before start date.';
    }
    if (step === 'tickets' && form.tiers.length === 0 && !form.priceCents)
      return 'Add at least one ticket tier or a price.';
    return null;
  }, [step, form]);

  const goNext = useCallback(() => {
    const err = validateStep();
    if (err) { setStepError(err); return; }
    setStepError(null);
    setPublishError(null);
    if (step === 'review') { createEvent(); return; }
    haptic();
    setStepIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
  }, [step, validateStep, createEvent, visibleSteps.length]);

  const goBack = useCallback(() => {
    setStepError(null);
    setPublishError(null);
    if (stepIndex === 0) {
      if (router.canGoBack()) { router.back(); } else { router.replace('/(tabs)'); }
      return;
    }
    haptic();
    setStepIndex((i) => i - 1);
  }, [stepIndex]);

  // ── Success Screen ────────────────────────────────────────────────────────
  if (publishedEvent) {
    return (
      <SuccessScreen
        event={publishedEvent}
        onCreateAnother={() => {
          setPublishedEvent(null);
          setForm({ ...defaultForm, city: form.city, country: form.country });
          setStepIndex(0);
        }}
        colors={colors}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.indigo + 'CC', colors.background]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={goBack} hitSlop={12} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={s.topCenter}>
          <Text style={[TextStyles.title3, { color: colors.text }]}>Create Event</Text>
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
            Step {stepIndex + 1} of {visibleSteps.length}
          </Text>
        </View>
        <View style={s.backBtn} />
      </View>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, {
          width: `${((stepIndex + 1) / visibleSteps.length) * 100}%` as `${number}%`,
          backgroundColor: CultureTokens.gold,
        }]} />
      </View>

      {/* Step dot indicator */}
      <View style={s.stepDots}>
        {visibleSteps.map((vs, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <View key={vs} style={s.stepDotWrap}>
              <View style={[
                s.stepDot,
                active && { backgroundColor: CultureTokens.gold, width: 24 },
                done && { backgroundColor: CultureTokens.indigo },
                !active && !done && { backgroundColor: colors.borderLight },
              ]}>
                {done && <Ionicons name="checkmark" size={10} color="#fff" />}
              </View>
              {i < visibleSteps.length - 1 && (
                <View style={[s.stepDotLine, { backgroundColor: i < stepIndex ? CultureTokens.indigo : colors.borderLight }]} />
              )}
            </View>
          );
        })}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]}
        >
          <Animated.View
            key={step}
            entering={FadeInDown.duration(220).springify().damping(22)}
            style={[s.card, isDesktop && s.cardDesktop, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {/* Step header */}
            <View style={s.stepHeader}>
              <View style={[s.stepIconWrap, { backgroundColor: CultureTokens.indigo + '20', borderColor: CultureTokens.indigo + '30' }]}>
                <Ionicons name={STEP_ICONS[step]} size={24} color={CultureTokens.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TextStyles.title2, { color: colors.text }]}>{STEP_TITLES[step]}</Text>
                <Text style={[TextStyles.callout, { color: colors.textSecondary }]}>{getStepSub(step)}</Text>
              </View>
            </View>

            {/* Step content */}
            {step === 'basics' && (
              <StepBasics form={form} setField={setField} colors={colors} s={s} stepError={stepError} haptic={haptic} />
            )}
            {step === 'image' && (
              <StepImage form={form} setField={setField} colors={colors} s={s} imageUploading={imageUploading} imageUploadError={imageUploadError} pickImage={pickImage} />
            )}
            {step === 'location' && (
              <StepLocation form={form} setField={setField} colors={colors} s={s} />
            )}
            {step === 'datetime' && (
              <StepDatetime form={form} setField={setField} colors={colors} s={s} />
            )}
            {step === 'entry' && (
              <StepEntry form={form} setField={setField} colors={colors} s={s} haptic={haptic} />
            )}
            {step === 'tickets' && (
              <StepTickets
                form={form} setField={setField} colors={colors} s={s} currency={currency}
                showAddTier={showAddTier} setShowAddTier={setShowAddTier}
                newTier={newTier} setNewTier={setNewTier}
                addTier={addTier} removeTier={removeTier} haptic={haptic}
              />
            )}
            {step === 'team' && (
              <StepTeam
                form={form} setField={setField} colors={colors} s={s}
                showArtistForm={showArtistForm} setShowArtistForm={setShowArtistForm}
                newArtist={newArtist} setNewArtist={setNewArtist}
                artistSearch={artistSearch} setArtistSearch={setArtistSearch}
                artistResults={artistResults}
                addArtist={addArtist} removeArtist={removeArtist}
                showSponsorForm={showSponsorForm} setShowSponsorForm={setShowSponsorForm}
                newSponsor={newSponsor} setNewSponsor={setNewSponsor}
                addSponsor={addSponsor} removeSponsor={removeSponsor}
                haptic={haptic}
              />
            )}
            {step === 'culture' && (
              <StepCulture
                form={form} colors={colors} s={s}
                toggleCultureTag={toggleCultureTag} toggleLanguageTag={toggleLanguageTag}
                toggleAccessibilityTag={toggleAccessibilityTag}
                haptic={haptic}
                initialNationalityId={onboardingState.nationalityId}
              />
            )}
            {step === 'review' && (
              <StepReview
                form={form} colors={colors} s={s}
                availableCultures={availableCultures}
                publishError={publishError}
              />
            )}

            {/* Inline step error */}
            {stepError ? (
              <View style={[s.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error + '50' }]}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={[s.errorBannerText, { color: colors.error }]}>{stepError}</Text>
              </View>
            ) : null}

            {/* Navigation */}
            <View style={s.navRow}>
              {stepIndex > 0 && (
                <Button variant="outline" size="lg" onPress={goBack} style={s.navBack}>Back</Button>
              )}
              <Button
                variant="primary" size="lg"
                fullWidth={stepIndex === 0}
                rightIcon={step === 'review' ? undefined : 'arrow-forward'}
                onPress={goNext}
                disabled={isPending || imageUploading}
                style={[s.navNext, { backgroundColor: CultureTokens.gold, flex: stepIndex > 0 ? 1 : undefined }]}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : step === 'review' ? (
                  'Publish Event'
                ) : step === 'image' ? (
                  form.heroImageUrl ? 'Continue' : 'Skip for Now'
                ) : (
                  'Continue'
                )}
              </Button>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  KeyboardAvoidingView, Alert, ActivityIndicator, Share,
  TextInput,
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
import { CultureTokens, CardTokens } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api, ApiError } from '@/lib/api';
import { ALL_NATIONALITIES, getCulturesForNationality } from '@/constants/cultures';
import { COMMON_LANGUAGES } from '@/constants/languages';
import {
  EventData, EventType, EntryType, EventArtist, EventSponsor, EventHostInfo, SponsorTier,
} from '@/shared/schema';
import { TextStyles } from '@/constants/typography';
import { Input } from '@/components/ui/Input';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { uploadEventImageTemp } from '@/lib/storage';
import { formatDateForCountry, getCurrencyForCountry } from '@/lib/dateUtils';
import { useAuth } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Step = 'basics' | 'image' | 'location' | 'datetime' | 'entry' | 'tickets' | 'team' | 'culture' | 'review';

const ALL_STEPS: Step[] = ['basics', 'image', 'location', 'datetime', 'entry', 'tickets', 'team', 'culture', 'review'];

const STEP_TITLES: Record<Step, string> = {
  basics:   'Event Details',
  image:    'Event Image',
  location: 'Where is it?',
  datetime: 'When is it?',
  entry:    'Entry Type',
  tickets:  'Ticketing',
  team:     'Core Team',
  culture:  'Cultural Tags',
  review:   'Review & Publish',
};

const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  basics:   'create-outline',
  image:    'image-outline',
  location: 'location-outline',
  datetime: 'calendar-outline',
  entry:    'ticket-outline',
  tickets:  'cash-outline',
  team:     'people-outline',
  culture:  'globe-outline',
  review:   'checkmark-circle-outline',
};

function getStepSub(step: Step): string {
  switch (step) {
    case 'basics':   return 'Name and describe your event';
    case 'image':    return 'Add a hero image for your event';
    case 'location': return 'Tell us where it\'s happening';
    case 'datetime': return 'Set the date and start time';
    case 'entry':    return 'Ticketed or free open entry?';
    case 'tickets':  return 'Configure pricing and capacity';
    case 'team':     return 'Artists, sponsors, and host info';
    case 'culture':  return 'Add cultural and language tags';
    case 'review':   return 'Check everything before publishing';
    default:         return '';
  }
}

const EVENT_TYPES: { id: EventType; label: string; emoji: string }[] = [
  { id: 'festival',    label: 'Festival',      emoji: '🎉' },
  { id: 'concert',     label: 'Concert',       emoji: '🎵' },
  { id: 'food',        label: 'Food',          emoji: '🍜' },
  { id: 'cultural',    label: 'Cultural',      emoji: '🎭' },
  { id: 'workshop',    label: 'Workshop',      emoji: '🛠️' },
  { id: 'community',   label: 'Community',     emoji: '👥' },
  { id: 'sports',      label: 'Sports',        emoji: '⚽' },
  { id: 'conference',  label: 'Conference',    emoji: '🎤' },
  { id: 'exhibition',  label: 'Exhibition',    emoji: '🖼️' },
  { id: 'puja',        label: 'Puja / Prayer', emoji: '🙏' },
  { id: 'other',       label: 'Other',         emoji: '✨' },
];

const SPONSOR_TIERS: { id: SponsorTier; label: string; color: string }[] = [
  { id: 'title',  label: 'Title Sponsor', color: CultureTokens.gold },
  { id: 'gold',   label: 'Gold',          color: CultureTokens.saffron },
  { id: 'silver', label: 'Silver',        color: '#9CA3AF' },
  { id: 'bronze', label: 'Bronze',        color: '#B45309' },
];

interface ArtistDraft { name: string; role: string; profileId?: string; imageUrl?: string }
interface SponsorDraft { name: string; tier: SponsorTier; websiteUrl?: string; logoUrl?: string }
interface HostDraft { name: string; contactEmail: string; contactPhone: string; websiteUrl?: string }
interface TierDraft { name: string; priceCents: string; capacity: string }

interface FormData {
  title: string;
  description: string;
  eventType: EventType | '';
  heroImageUrl: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  entryType: EntryType;
  isFree: boolean;
  priceCents: string;
  capacity: string;
  tiers: TierDraft[];
  artists: ArtistDraft[];
  sponsors: SponsorDraft[];
  hostInfo: HostDraft;
  cultureTagIds: string[];
  languageTagIds: string[];
}

const defaultForm: FormData = {
  title: '',
  description: '',
  eventType: '',
  heroImageUrl: '',
  venue: '',
  address: '',
  city: '',
  country: 'Australia',
  date: '',
  endDate: '',
  time: '',
  endTime: '',
  entryType: 'free_open',
  isFree: true,
  priceCents: '',
  capacity: '',
  tiers: [{ name: 'General Admission', priceCents: '', capacity: '' }],
  artists: [],
  sponsors: [],
  hostInfo: { name: '', contactEmail: '', contactPhone: '', websiteUrl: '' },
  cultureTagIds: [],
  languageTagIds: [],
};

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
          variant="primary"
          size="lg"
          fullWidth
          leftIcon="eye-outline"
          style={{ backgroundColor: CultureTokens.teal }}
          onPress={() => router.replace({ pathname: '/event/[id]', params: { id: event.id } })}
        >
          View Event
        </Button>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          leftIcon="share-social-outline"
          onPress={handleShare}
        >
          Share Event
        </Button>
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onPress={onCreateAnother}
        >
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
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [publishedEvent, setPublishedEvent] = useState<EventData | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Ticket tier & artist/sponsor editing state
  const [newArtist, setNewArtist] = useState<ArtistDraft>({ name: '', role: '' });
  const [newSponsor, setNewSponsor] = useState<SponsorDraft>({ name: '', tier: 'gold' });
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [showAddTier, setShowAddTier] = useState(false);
  const [newTier, setNewTier] = useState<TierDraft>({ name: '', priceCents: '', capacity: '' });

  // Artist profile search
  const [artistSearch, setArtistSearch] = useState('');
  const { data: artistResults } = useQuery({
    queryKey: ['/api/profiles', 'artist', artistSearch],
    queryFn: () => api.profiles.list(),
    enabled: artistSearch.length > 1,
    staleTime: 30_000,
  });

  // Compute visible steps (skip 'tickets' when free_open)
  const visibleSteps = useMemo((): Step[] =>
    ALL_STEPS.filter((s) => s !== 'tickets' || form.entryType === 'ticketed'),
  [form.entryType]);

  const step = visibleSteps[stepIndex];

  // Culture options
  const availableCultures = useMemo(() => {
    const nat = onboardingState.nationalityId;
    if (nat) return getCulturesForNationality(nat);
    return ALL_NATIONALITIES.flatMap((n) => getCulturesForNationality(n.id)).slice(0, 30);
  }, [onboardingState.nationalityId]);

  // ── Mutation ────────────────────────────────────────────────────────────────
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
        artists:     form.artists.length > 0 ? form.artists.map((a) => ({
          name: a.name, role: a.role || undefined, profileId: a.profileId, imageUrl: a.imageUrl,
        } as EventArtist)) : undefined,
        eventSponsors: form.sponsors.length > 0 ? form.sponsors.map((sp) => ({
          name: sp.name, tier: sp.tier, websiteUrl: sp.websiteUrl, logoUrl: sp.logoUrl,
        } as EventSponsor)) : undefined,
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
      Alert.alert('Could not create event', err instanceof Error ? err.message : 'Please try again.');
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
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

  const pickImage = useCallback(async () => {
    haptic();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setImageUploading(true);
    try {
      const uploadId = userId ?? `anon-${Date.now()}`;
      const url = await uploadEventImageTemp(uri, uploadId);
      setField('heroImageUrl', url);
    } catch {
      Alert.alert('Upload failed', 'Could not upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  }, [userId, setField]);

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
    if (step === 'location') {
      if (!form.city.trim()) return 'City is required.';
    }
    if (step === 'datetime') {
      if (!form.date) return 'Date is required.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return 'Date format must be YYYY-MM-DD.';
      if (form.endDate && form.endDate < form.date) return 'End date cannot be before start date.';
    }
    if (step === 'tickets') {
      if (form.tiers.length === 0 && !form.priceCents) return 'Add at least one ticket tier or a price.';
    }
    return null;
  }, [step, form]);

  const goNext = useCallback(() => {
    const err = validateStep();
    if (err) { setStepError(err); return; }
    setStepError(null);
    if (step === 'review') { createEvent(); return; }
    haptic();
    setStepIndex((i) => Math.min(i + 1, visibleSteps.length - 1));
  }, [step, validateStep, createEvent, visibleSteps.length]);

  const goBack = useCallback(() => {
    setStepError(null);
    if (stepIndex === 0) {
      if (router.canGoBack()) { router.back(); } else { router.replace('/(tabs)'); }
      return;
    }
    haptic();
    setStepIndex((i) => i - 1);
  }, [stepIndex]);

  const currency = getCurrencyForCountry(form.country);

  // ── Success Screen ─────────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
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
          backgroundColor: CultureTokens.saffron,
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
                active && { backgroundColor: CultureTokens.saffron, width: 24 },
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
                <Ionicons name={STEP_ICONS[step]} size={24} color={CultureTokens.saffron} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[TextStyles.title2, { color: colors.text }]}>{STEP_TITLES[step]}</Text>
                <Text style={[TextStyles.callout, { color: colors.textSecondary }]}>{getStepSub(step)}</Text>
              </View>
            </View>

            {/* ── Basics ─────────────────────────────────────────────────── */}
            {step === 'basics' && (
              <View style={s.fields}>
                <Field label="Event Title *" colors={colors}>
                  <Input
                    value={form.title}
                    onChangeText={(v) => setField('title', v)}
                    placeholder="e.g. Onam Festival Sydney 2026"
                    autoCapitalize="words"
                    maxLength={120}
                    accessibilityLabel="Event title"
                  />
                </Field>

                <Field label="Description *" colors={colors}>
                  <TextInput
                    value={form.description}
                    onChangeText={(v) => { setField('description', v); if (v.trim()) setStepError(null); }}
                    placeholder="Tell people what this event is about…"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    maxLength={1000}
                    textAlignVertical="top"
                    accessibilityLabel="Event description"
                    style={[s.descriptionInput, {
                      color: colors.text,
                      backgroundColor: colors.surfaceElevated,
                      borderColor: stepError && !form.description.trim() ? colors.error : colors.border,
                    }]}
                  />
                </Field>

                <Field label="Event Type" colors={colors}>
                  <View style={s.typeGrid}>
                    {EVENT_TYPES.map(({ id, label, emoji }) => {
                      const isSelected = form.eventType === id;
                      return (
                        <Pressable
                          key={id}
                          style={({ pressed }) => [
                            s.typeChip,
                            {
                              borderColor: isSelected ? CultureTokens.saffron : colors.border,
                              backgroundColor: isSelected ? CultureTokens.saffron + '15' : colors.surfaceElevated,
                            },
                            pressed && { opacity: 0.8 },
                          ]}
                          onPress={() => { haptic(); setField('eventType', id); }}
                          accessibilityRole="radio"
                          accessibilityLabel={label}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text style={s.typeEmoji}>{emoji}</Text>
                          <Text style={[TextStyles.labelSemibold, { color: isSelected ? CultureTokens.saffron : colors.text }]}>{label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
              </View>
            )}

            {/* ── Image ──────────────────────────────────────────────────── */}
            {step === 'image' && (
              <View style={s.fields}>
                <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
                  A great hero image helps your event stand out. Landscape ratio (16:9) works best.
                </Text>

                {form.heroImageUrl ? (
                  <View style={s.imagePreviewWrap}>
                    <Image
                      source={{ uri: form.heroImageUrl }}
                      style={s.imagePreview}
                      contentFit="cover"
                      accessibilityLabel="Event hero image preview"
                    />
                    <View style={s.imagePreviewActions}>
                      <Pressable
                        onPress={pickImage}
                        style={[s.imageActionBtn, { backgroundColor: colors.surface }]}
                        accessibilityRole="button"
                        accessibilityLabel="Change image"
                      >
                        <Ionicons name="pencil" size={18} color={colors.text} />
                        <Text style={[s.imageActionText, { color: colors.text }]}>Change</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setField('heroImageUrl', '')}
                        style={[s.imageActionBtn, { backgroundColor: CultureTokens.coral + '20' }]}
                        accessibilityRole="button"
                        accessibilityLabel="Remove image"
                      >
                        <Ionicons name="trash-outline" size={18} color={CultureTokens.coral} />
                        <Text style={[s.imageActionText, { color: CultureTokens.coral }]}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={pickImage}
                    disabled={imageUploading}
                    style={({ pressed }) => [
                      s.imagePicker,
                      { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                      pressed && { opacity: 0.8 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Select event image"
                  >
                    {imageUploading ? (
                      <>
                        <ActivityIndicator size="large" color={CultureTokens.saffron} />
                        <Text style={[s.imagePickerText, { color: colors.textSecondary }]}>Uploading…</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={48} color={CultureTokens.saffron} />
                        <Text style={[s.imagePickerText, { color: colors.text }]}>Tap to select an image</Text>
                        <Text style={[s.imagePickerSub, { color: colors.textSecondary }]}>JPG or PNG, 16:9 recommended</Text>
                      </>
                    )}
                  </Pressable>
                )}

                <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '20' }]}>
                  <Ionicons name="information-circle-outline" size={18} color={CultureTokens.saffron} />
                  <Text style={[s.infoText, { color: colors.textSecondary }]}>
                    You can skip this step and add an image later by editing the event.
                  </Text>
                </View>
              </View>
            )}

            {/* ── Location ───────────────────────────────────────────────── */}
            {step === 'location' && (
              <View style={s.fields}>
                <Input
                  label="Venue Name"
                  value={form.venue}
                  onChangeText={(v) => setField('venue', v)}
                  placeholder="e.g. Sydney Town Hall"
                  autoCapitalize="words"
                  accessibilityLabel="Venue name"
                  containerStyle={{ marginBottom: 20 }}
                />
                <Input
                  label="Street Address"
                  value={form.address}
                  onChangeText={(v) => setField('address', v)}
                  placeholder="e.g. 483 George St, Sydney NSW 2000"
                  autoCapitalize="words"
                  accessibilityLabel="Street address"
                  containerStyle={{ marginBottom: 20 }}
                />
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="City *"
                      value={form.city}
                      onChangeText={(v) => setField('city', v)}
                      placeholder="Sydney"
                      autoCapitalize="words"
                      accessibilityLabel="City"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Country"
                      value={form.country}
                      onChangeText={(v) => setField('country', v)}
                      placeholder="Australia"
                      autoCapitalize="words"
                      accessibilityLabel="Country"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ── Date & Time ─────────────────────────────────────────────── */}
            {step === 'datetime' && (
              <View style={s.fields}>
                <DatePickerInput
                  label="Start Date *"
                  value={form.date}
                  onChangeDate={(v) => setField('date', v)}
                  placeholder="Select start date"
                  accessibilityLabel="Event start date"
                  containerStyle={{ marginBottom: 20 }}
                />
                <DatePickerInput
                  label="End Date (optional)"
                  value={form.endDate}
                  onChangeDate={(v) => setField('endDate', v)}
                  placeholder="Select end date"
                  accessibilityLabel="Event end date"
                  containerStyle={{ marginBottom: 20 }}
                />
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Start Time"
                      value={form.time}
                      onChangeText={(v) => setField('time', v)}
                      placeholder="18:30"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      accessibilityLabel="Event start time"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="End Time"
                      value={form.endTime}
                      onChangeText={(v) => setField('endTime', v)}
                      placeholder="22:00"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      accessibilityLabel="Event end time"
                    />
                  </View>
                </View>

                {form.date ? (
                  <View style={[s.infoBox, { backgroundColor: CultureTokens.teal + '10', borderColor: CultureTokens.teal + '20', marginTop: 12 }]}>
                    <Ionicons name="calendar-outline" size={18} color={CultureTokens.teal} />
                    <Text style={[s.infoText, { color: colors.textSecondary }]}>
                      Displaying as: {formatDateForCountry(form.date, form.country)}
                    </Text>
                  </View>
                ) : null}

                <View style={[s.infoBox, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '20', marginTop: 8 }]}>
                  <Ionicons name="information-circle-outline" size={18} color={CultureTokens.saffron} />
                  <Text style={[s.infoText, { color: colors.textSecondary }]}>
                    Time in 24h format (e.g. 18:30).
                  </Text>
                </View>
              </View>
            )}

            {/* ── Entry Type ─────────────────────────────────────────────── */}
            {step === 'entry' && (
              <View style={s.fields}>
                <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
                  Choose whether this event requires tickets or is open to everyone.
                </Text>
                <View style={s.entryTypeGrid}>
                  {([
                    { id: 'ticketed' as EntryType, label: 'Ticketed', sub: 'Paid or free tickets required', icon: 'ticket-outline' as const, color: CultureTokens.saffron },
                    { id: 'free_open' as EntryType, label: 'Free / Open Entry', sub: 'No ticket required to attend', icon: 'people-outline' as const, color: CultureTokens.teal },
                  ] as const).map(({ id, label, sub, icon, color }) => {
                    const isSelected = form.entryType === id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => { haptic(); setField('entryType', id); setField('isFree', id === 'free_open'); }}
                        style={({ pressed }) => [
                          s.entryCard,
                          { borderColor: isSelected ? color : colors.border, backgroundColor: isSelected ? color + '12' : colors.surfaceElevated },
                          pressed && { opacity: 0.85 },
                        ]}
                        accessibilityRole="radio"
                        accessibilityLabel={label}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View style={[s.entryIconWrap, { backgroundColor: color + '20' }]}>
                          <Ionicons name={icon} size={28} color={color} />
                        </View>
                        <Text style={[s.entryCardTitle, { color: isSelected ? color : colors.text }]}>{label}</Text>
                        <Text style={[s.entryCardSub, { color: colors.textSecondary }]}>{sub}</Text>
                        {isSelected && (
                          <View style={[s.entryCheck, { backgroundColor: color }]}>
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Tickets ────────────────────────────────────────────────── */}
            {step === 'tickets' && (
              <View style={s.fields}>
                <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
                  Add ticket tiers. Each tier can have its own price and capacity.
                </Text>

                {/* Tier list */}
                {form.tiers.map((tier, i) => (
                  <View key={i} style={[s.tierRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <View style={s.tierInfo}>
                      <Text style={[s.tierName, { color: colors.text }]}>{tier.name}</Text>
                      <Text style={[s.tierDetails, { color: colors.textSecondary }]}>
                        {parseFloat(tier.priceCents || '0') === 0
                          ? 'Free'
                          : `${currency} ${parseFloat(tier.priceCents || '0').toFixed(2)}`}
                        {tier.capacity ? ` · ${tier.capacity} spots` : ''}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeTier(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${tier.name} tier`}>
                      <Ionicons name="close-circle" size={22} color={CultureTokens.coral} />
                    </Pressable>
                  </View>
                ))}

                {/* Add tier form */}
                {showAddTier ? (
                  <View style={[s.addTierForm, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.saffron + '40' }]}>
                    <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>TIER NAME</Text>
                    <View style={s.tierPresets}>
                      {['Early Bird', 'General Admission', 'VIP'].map((preset) => (
                        <Pressable
                          key={preset}
                          onPress={() => setNewTier((t) => ({ ...t, name: preset }))}
                          style={[s.tierPreset, { borderColor: newTier.name === preset ? CultureTokens.saffron : colors.border, backgroundColor: newTier.name === preset ? CultureTokens.saffron + '15' : colors.background }]}
                          accessibilityRole="button"
                        >
                          <Text style={[s.tierPresetText, { color: newTier.name === preset ? CultureTokens.saffron : colors.textSecondary }]}>{preset}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={newTier.name}
                      onChangeText={(v) => setNewTier((t) => ({ ...t, name: v }))}
                      placeholder="Or type custom tier name…"
                      placeholderTextColor={colors.textTertiary}
                    />
                    <View style={s.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>PRICE ({currency})</Text>
                        <TextInput
                          style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                          value={newTier.priceCents}
                          onChangeText={(v) => setNewTier((t) => ({ ...t, priceCents: v.replace(/[^0-9.]/g, '') }))}
                          placeholder="0.00 = Free"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>CAPACITY</Text>
                        <TextInput
                          style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                          value={newTier.capacity}
                          onChangeText={(v) => setNewTier((t) => ({ ...t, capacity: v.replace(/[^0-9]/g, '') }))}
                          placeholder="Unlimited"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                    <View style={s.row}>
                      <Button variant="outline" size="sm" onPress={() => setShowAddTier(false)} style={{ flex: 1 }}>Cancel</Button>
                      <Button variant="primary" size="sm" onPress={addTier} style={{ flex: 1, backgroundColor: CultureTokens.saffron }}>Add Tier</Button>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => { setShowAddTier(true); haptic(); }}
                    style={[s.addTierBtn, { borderColor: CultureTokens.saffron + '60', backgroundColor: CultureTokens.saffron + '10' }]}
                    accessibilityRole="button"
                    accessibilityLabel="Add ticket tier"
                  >
                    <Ionicons name="add-circle-outline" size={22} color={CultureTokens.saffron} />
                    <Text style={[s.addTierText, { color: CultureTokens.saffron }]}>Add Ticket Tier</Text>
                  </Pressable>
                )}

                <Input
                  label={`Overall Capacity (optional)`}
                  value={form.capacity}
                  onChangeText={(v) => setField('capacity', v.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 500 total attendees"
                  keyboardType="number-pad"
                  leftIcon="people-outline"
                  accessibilityLabel="Event capacity"
                  containerStyle={{ marginTop: 8 }}
                />
              </View>
            )}

            {/* ── Team ───────────────────────────────────────────────────── */}
            {step === 'team' && (
              <View style={s.fields}>
                <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
                  Optionally add artists, sponsors, and host information. All fields are optional.
                </Text>

                {/* Artists */}
                <View style={s.teamSection}>
                  <View style={s.teamSectionHeader}>
                    <Ionicons name="musical-notes-outline" size={20} color={CultureTokens.coral} />
                    <Text style={[s.teamSectionTitle, { color: colors.text }]}>Artists & Performers</Text>
                    <Text style={[s.teamCount, { color: colors.textTertiary }]}>{form.artists.length}</Text>
                  </View>

                  {form.artists.map((artist, i) => (
                    <View key={i} style={[s.teamChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <View style={[s.teamChipIcon, { backgroundColor: CultureTokens.coral + '20' }]}>
                        <Ionicons name="person" size={16} color={CultureTokens.coral} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.teamChipName, { color: colors.text }]}>{artist.name}</Text>
                        {artist.role ? <Text style={[s.teamChipRole, { color: colors.textSecondary }]}>{artist.role}</Text> : null}
                      </View>
                      <Pressable onPress={() => removeArtist(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${artist.name}`}>
                        <Ionicons name="close-circle" size={20} color={CultureTokens.coral} />
                      </Pressable>
                    </View>
                  ))}

                  {showArtistForm ? (
                    <View style={[s.addTierForm, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.coral + '40' }]}>
                      {artistSearch.length > 1 && artistResults ? (
                        <View style={{ marginBottom: 8 }}>
                          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>SEARCH RESULTS</Text>
                          {(Array.isArray(artistResults) ? artistResults : (artistResults as { profiles?: { id: string; name: string; imageUrl?: string }[] }).profiles ?? [])
                            .filter((p: { id: string; name: string; imageUrl?: string }) => p.name.toLowerCase().includes(artistSearch.toLowerCase()))
                            .slice(0, 4)
                            .map((p: { id: string; name: string; imageUrl?: string }) => (
                              <Pressable key={p.id} onPress={() => { setNewArtist({ name: p.name, role: '', profileId: p.id, imageUrl: p.imageUrl }); setArtistSearch(''); }} style={[s.searchResult, { borderColor: colors.border }]}>
                                <Text style={{ color: colors.text, fontFamily: 'Poppins_500Medium', fontSize: 14 }}>{p.name}</Text>
                              </Pressable>
                            ))}
                        </View>
                      ) : null}
                      <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>SEARCH OR ENTER NAME</Text>
                      <TextInput
                        style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={artistSearch || newArtist.name}
                        onChangeText={(v) => { setArtistSearch(v); setNewArtist((a) => ({ ...a, name: v })); }}
                        placeholder="Artist or performer name…"
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="words"
                      />
                      <Text style={[s.fieldLabel, { color: colors.textSecondary, marginTop: 8 }]}>ROLE (optional)</Text>
                      <TextInput
                        style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={newArtist.role}
                        onChangeText={(v) => setNewArtist((a) => ({ ...a, role: v }))}
                        placeholder="e.g. Headliner, Support, DJ…"
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="words"
                      />
                      <View style={[s.row, { marginTop: 8 }]}>
                        <Button variant="outline" size="sm" onPress={() => { setShowArtistForm(false); setArtistSearch(''); }} style={{ flex: 1 }}>Cancel</Button>
                        <Button variant="primary" size="sm" onPress={addArtist} style={{ flex: 1, backgroundColor: CultureTokens.coral }}>Add</Button>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => { setShowArtistForm(true); haptic(); }}
                      style={[s.addTierBtn, { borderColor: CultureTokens.coral + '60', backgroundColor: CultureTokens.coral + '10' }]}
                      accessibilityRole="button"
                      accessibilityLabel="Add artist"
                    >
                      <Ionicons name="add-circle-outline" size={20} color={CultureTokens.coral} />
                      <Text style={[s.addTierText, { color: CultureTokens.coral }]}>Add Artist / Performer</Text>
                    </Pressable>
                  )}
                </View>

                {/* Sponsors */}
                <View style={s.teamSection}>
                  <View style={s.teamSectionHeader}>
                    <Ionicons name="ribbon-outline" size={20} color={CultureTokens.gold} />
                    <Text style={[s.teamSectionTitle, { color: colors.text }]}>Sponsors</Text>
                    <Text style={[s.teamCount, { color: colors.textTertiary }]}>{form.sponsors.length}</Text>
                  </View>

                  {form.sponsors.map((sp, i) => {
                    const tierDef = SPONSOR_TIERS.find((t) => t.id === sp.tier);
                    return (
                      <View key={i} style={[s.teamChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <View style={[s.teamChipIcon, { backgroundColor: (tierDef?.color ?? CultureTokens.gold) + '20' }]}>
                          <Ionicons name="ribbon" size={16} color={tierDef?.color ?? CultureTokens.gold} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.teamChipName, { color: colors.text }]}>{sp.name}</Text>
                          <Text style={[s.teamChipRole, { color: tierDef?.color ?? colors.textSecondary }]}>{tierDef?.label ?? sp.tier}</Text>
                        </View>
                        <Pressable onPress={() => removeSponsor(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remove ${sp.name}`}>
                          <Ionicons name="close-circle" size={20} color={CultureTokens.coral} />
                        </Pressable>
                      </View>
                    );
                  })}

                  {showSponsorForm ? (
                    <View style={[s.addTierForm, { backgroundColor: colors.surfaceElevated, borderColor: CultureTokens.gold + '40' }]}>
                      <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>SPONSOR NAME</Text>
                      <TextInput
                        style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={newSponsor.name}
                        onChangeText={(v) => setNewSponsor((sp) => ({ ...sp, name: v }))}
                        placeholder="Company or brand name…"
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="words"
                      />
                      <Text style={[s.fieldLabel, { color: colors.textSecondary, marginTop: 8 }]}>SPONSOR TIER</Text>
                      <View style={s.tierPresets}>
                        {SPONSOR_TIERS.map((t) => (
                          <Pressable
                            key={t.id}
                            onPress={() => setNewSponsor((sp) => ({ ...sp, tier: t.id }))}
                            style={[s.tierPreset, { borderColor: newSponsor.tier === t.id ? t.color : colors.border, backgroundColor: newSponsor.tier === t.id ? t.color + '15' : colors.background }]}
                            accessibilityRole="button"
                          >
                            <Text style={[s.tierPresetText, { color: newSponsor.tier === t.id ? t.color : colors.textSecondary }]}>{t.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <Text style={[s.fieldLabel, { color: colors.textSecondary, marginTop: 8 }]}>WEBSITE (optional)</Text>
                      <TextInput
                        style={[s.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={newSponsor.websiteUrl ?? ''}
                        onChangeText={(v) => setNewSponsor((sp) => ({ ...sp, websiteUrl: v }))}
                        placeholder="https://…"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="url"
                        autoCapitalize="none"
                      />
                      <View style={[s.row, { marginTop: 8 }]}>
                        <Button variant="outline" size="sm" onPress={() => setShowSponsorForm(false)} style={{ flex: 1 }}>Cancel</Button>
                        <Button variant="primary" size="sm" onPress={addSponsor} style={{ flex: 1, backgroundColor: CultureTokens.gold }}>Add</Button>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => { setShowSponsorForm(true); haptic(); }}
                      style={[s.addTierBtn, { borderColor: CultureTokens.gold + '60', backgroundColor: CultureTokens.gold + '10' }]}
                      accessibilityRole="button"
                      accessibilityLabel="Add sponsor"
                    >
                      <Ionicons name="add-circle-outline" size={20} color={CultureTokens.gold} />
                      <Text style={[s.addTierText, { color: CultureTokens.gold }]}>Add Sponsor</Text>
                    </Pressable>
                  )}
                </View>

                {/* Host Info */}
                <View style={s.teamSection}>
                  <View style={s.teamSectionHeader}>
                    <Ionicons name="home-outline" size={20} color={CultureTokens.teal} />
                    <Text style={[s.teamSectionTitle, { color: colors.text }]}>Host Information</Text>
                  </View>
                  <Input
                    label="Host / Organizer Name"
                    value={form.hostInfo.name}
                    onChangeText={(v) => setField('hostInfo', { ...form.hostInfo, name: v })}
                    placeholder="e.g. Sydney Cultural Society"
                    autoCapitalize="words"
                    accessibilityLabel="Host name"
                    containerStyle={{ marginBottom: 12 }}
                  />
                  <View style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Contact Email"
                        value={form.hostInfo.contactEmail}
                        onChangeText={(v) => setField('hostInfo', { ...form.hostInfo, contactEmail: v })}
                        placeholder="hello@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        accessibilityLabel="Host contact email"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Contact Phone"
                        value={form.hostInfo.contactPhone}
                        onChangeText={(v) => setField('hostInfo', { ...form.hostInfo, contactPhone: v })}
                        placeholder="+61 4XX XXX XXX"
                        keyboardType="phone-pad"
                        accessibilityLabel="Host contact phone"
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ── Culture ────────────────────────────────────────────────── */}
            {step === 'culture' && (
              <View style={s.fields}>
                <Text style={[s.sectionNote, { color: colors.textSecondary }]}>
                  Tag this event so people from specific cultures can discover it.
                </Text>

                <Field label="Culture Tags" colors={colors}>
                  <View style={s.tagGrid}>
                    {availableCultures.slice(0, 20).map((c) => {
                      const isSelected = form.cultureTagIds.includes(c.id);
                      return (
                        <Pressable
                          key={c.id}
                          style={({ pressed }) => [
                            s.tagChip,
                            { borderColor: isSelected ? CultureTokens.saffron : colors.border, backgroundColor: isSelected ? CultureTokens.saffron + '22' : colors.background },
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => toggleCultureTag(c.id)}
                          accessibilityRole="checkbox"
                          accessibilityLabel={c.label}
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text style={s.tagEmoji}>{c.emoji}</Text>
                          <Text style={[s.tagLabel, { color: isSelected ? CultureTokens.saffron : colors.text }]}>{c.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>

                <Field label="Language Tags" colors={colors}>
                  <View style={s.tagGrid}>
                    {COMMON_LANGUAGES.slice(0, 16).map((l) => {
                      const isSelected = form.languageTagIds.includes(l.id);
                      return (
                        <Pressable
                          key={l.id}
                          style={({ pressed }) => [
                            s.tagChip,
                            { borderColor: isSelected ? CultureTokens.teal : colors.border, backgroundColor: isSelected ? CultureTokens.teal + '22' : colors.background },
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => toggleLanguageTag(l.id)}
                          accessibilityRole="checkbox"
                          accessibilityLabel={l.name}
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text style={[s.tagLabel, { color: isSelected ? CultureTokens.teal : colors.text }]}>{l.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
              </View>
            )}

            {/* ── Review ─────────────────────────────────────────────────── */}
            {step === 'review' && (
              <View style={s.fields}>
                {form.heroImageUrl ? (
                  <Image source={{ uri: form.heroImageUrl }} style={s.reviewImage} contentFit="cover" accessibilityLabel="Event image preview" />
                ) : null}
                <ReviewRow label="Title" value={form.title} colors={colors} />
                <ReviewRow label="Type" value={EVENT_TYPES.find((t) => t.id === form.eventType)?.label ?? '—'} colors={colors} />
                <ReviewRow label="Location" value={[form.venue, form.city, form.country].filter(Boolean).join(', ')} colors={colors} />
                <ReviewRow
                  label="Dates"
                  value={[
                    form.date ? formatDateForCountry(form.date, form.country) : '—',
                    form.endDate ? `→ ${formatDateForCountry(form.endDate, form.country)}` : '',
                    form.time ? `at ${form.time}` : '',
                  ].filter(Boolean).join(' ')}
                  colors={colors}
                />
                <ReviewRow
                  label="Entry"
                  value={form.entryType === 'ticketed'
                    ? `Ticketed — ${form.tiers.length} tier(s)`
                    : 'Free / Open Entry'}
                  colors={colors}
                />
                {form.artists.length > 0 && (
                  <ReviewRow label="Artists" value={form.artists.map((a) => a.name).join(', ')} colors={colors} />
                )}
                {form.sponsors.length > 0 && (
                  <ReviewRow label="Sponsors" value={form.sponsors.map((sp) => sp.name).join(', ')} colors={colors} />
                )}
                {form.hostInfo.name ? (
                  <ReviewRow label="Host" value={form.hostInfo.name} colors={colors} />
                ) : null}
                {form.cultureTagIds.length > 0 && (
                  <ReviewRow
                    label="Cultures"
                    value={form.cultureTagIds.map((id) => availableCultures.find((c) => c.id === id)?.label ?? id).join(', ')}
                    colors={colors}
                  />
                )}

                <View style={[s.infoBox, { backgroundColor: CultureTokens.saffron + '15', borderColor: CultureTokens.saffron + '40', marginTop: 8 }]}>
                  <Ionicons name="rocket-outline" size={18} color={CultureTokens.saffron} />
                  <Text style={[s.infoText, { color: colors.textSecondary }]}>
                    Your event will be published immediately and appear in Discover.
                  </Text>
                </View>
              </View>
            )}

            {/* ── Inline error ───────────────────────────────────────────── */}
            {stepError ? (
              <View style={[s.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error + '50' }]}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={[s.errorBannerText, { color: colors.error }]}>{stepError}</Text>
              </View>
            ) : null}

            {/* ── Navigation ─────────────────────────────────────────────── */}
            <View style={s.navRow}>
              {stepIndex > 0 && (
                <Button variant="outline" size="lg" onPress={goBack} style={s.navBack}>
                  Back
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth={stepIndex === 0}
                rightIcon={step === 'review' ? undefined : 'arrow-forward'}
                onPress={goNext}
                disabled={isPending || imageUploading}
                style={[s.navNext, { backgroundColor: CultureTokens.saffron, flex: stepIndex > 0 ? 1 : undefined }]}
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function ReviewRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
      <Text style={{ fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: colors.textSecondary, width: 90 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text, flex: 1 }}>{value || '—'}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  root:          { flex: 1 },
  successRoot:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 },
  successIconWrap: { alignItems: 'center' },
  successContent: { alignItems: 'center', gap: 10, width: '100%' },
  successTitle:  { fontSize: 32, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  successSub:    { fontSize: 16, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 24 },
  successImage:  { width: '100%', height: 180, borderRadius: 16, marginTop: 8 },
  successActions: { width: '100%', gap: 12 },
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4 },
  backBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topCenter:     { flex: 1, alignItems: 'center' },
  progressTrack: { height: 3, backgroundColor: colors.borderLight, marginHorizontal: 16, borderRadius: 2, marginBottom: 8 },
  progressFill:  { height: 3, borderRadius: 2 },
  stepDots:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 12, gap: 0 },
  stepDotWrap:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot:       { width: 10, height: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  stepDotLine:   { flex: 1, height: 2, marginHorizontal: 4 },
  scroll:        { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 60 },
  scrollDesktop: { paddingHorizontal: 0, maxWidth: 700, alignSelf: 'center' as const, width: '100%' },
  card:          { borderRadius: CardTokens.radius, borderWidth: 1, padding: CardTokens.padding + 4, gap: 0 },
  cardDesktop:   { borderRadius: 20 },
  stepHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  stepIconWrap:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  fields:        { gap: 0 },
  textArea:      { minHeight: 100, paddingTop: 12 },
  descriptionInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    lineHeight: 18,
  },
  row:           { flexDirection: 'row', gap: 12 },
  typeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  typeEmoji:     { fontSize: 16 },
  // Image
  imagePicker:   { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 48, gap: 12 },
  imagePickerText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  imagePickerSub:  { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  imagePreviewWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  imagePreview:    { width: '100%', height: 200 },
  imagePreviewActions: { flexDirection: 'row', gap: 8, padding: 8, backgroundColor: colors.surfaceElevated },
  imageActionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  imageActionText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  reviewImage:   { width: '100%', height: 160, borderRadius: 12, marginBottom: 16 },
  // Entry type
  entryTypeGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  entryCard:     { flex: 1, alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 2, gap: 8, position: 'relative' },
  entryIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  entryCardTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  entryCardSub:  { fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 16 },
  entryCheck:    { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  // Tickets
  tierRow:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  tierInfo:      { flex: 1 },
  tierName:      { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  tierDetails:   { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  addTierBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
  addTierText:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  addTierForm:   { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12, gap: 8 },
  tierPresets:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  tierPreset:    { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  tierPresetText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  fieldLabel:    { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  inlineInput:   { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  searchResult:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4 },
  // Team
  teamSection:   { marginBottom: 20 },
  teamSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  teamSectionTitle: { flex: 1, fontSize: 15, fontFamily: 'Poppins_700Bold' },
  teamCount:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  teamChip:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, gap: 10 },
  teamChipIcon:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  teamChipName:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  teamChipRole:  { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  // Culture
  tagGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  tagEmoji:      { fontSize: 15 },
  tagLabel:      { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  sectionNote:   { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 16, lineHeight: 20 },
  infoBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 8 },
  infoText:      { fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 18 },
  navRow:        { flexDirection: 'row', gap: 12, marginTop: 28 },
  navBack:       { flex: 0, minWidth: 90 },
  navNext:       { height: 56, borderRadius: 16 },
});

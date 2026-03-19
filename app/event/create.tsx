import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  KeyboardAvoidingView, useWindowDimensions, Alert,
  ActivityIndicator, Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens, CardTokens } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { api, ApiError } from '@/lib/api';
import { ALL_NATIONALITIES, getCulturesForNationality } from '@/constants/cultures';
import { COMMON_LANGUAGES } from '@/constants/languages';
import { EventData, EventType } from '@/shared/schema';
import { TextStyles } from '@/constants/typography';
import { Input } from '@/components/ui/Input';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Step = 'basics' | 'location' | 'datetime' | 'tickets' | 'culture' | 'review';

const STEPS: Step[] = ['basics', 'location', 'datetime', 'tickets', 'culture', 'review'];

const STEP_TITLES: Record<Step, string> = {
  basics:   'Event Details',
  location: 'Where is it?',
  datetime: 'When is it?',
  tickets:  'Ticketing',
  culture:  'Cultural Tags',
  review:   'Review & Publish',
};

const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  basics:   'create-outline',
  location: 'location-outline',
  datetime: 'calendar-outline',
  tickets:  'ticket-outline',
  culture:  'globe-outline',
  review:   'checkmark-circle-outline',
};

function getStepSub(step: Step): string {
  switch (step) {
    case 'basics':   return 'Name and describe your event';
    case 'location': return 'Tell us where it\'s happening';
    case 'datetime': return 'Set the date and start time';
    case 'tickets':  return 'Configure pricing and capacity';
    case 'culture':  return 'Add cultural and language tags';
    case 'review':   return 'Check everything before publishing';
    default:         return '';
  }
}

const EVENT_TYPES: { id: EventType; label: string; emoji: string }[] = [
  { id: 'festival',    label: 'Festival',    emoji: '🎉' },
  { id: 'concert',     label: 'Concert',     emoji: '🎵' },
  { id: 'food',        label: 'Food',        emoji: '🍜' },
  { id: 'cultural',    label: 'Cultural',    emoji: '🎭' },
  { id: 'workshop',    label: 'Workshop',    emoji: '🛠️' },
  { id: 'community',   label: 'Community',   emoji: '👥' },
  { id: 'sports',      label: 'Sports',      emoji: '⚽' },
  { id: 'conference',  label: 'Conference',  emoji: '🎤' },
  { id: 'exhibition',  label: 'Exhibition',  emoji: '🖼️' },
  { id: 'puja',        label: 'Puja / Prayer', emoji: '🙏' },
  { id: 'other',       label: 'Other',       emoji: '✨' },
];

interface FormData {
  title: string;
  description: string;
  eventType: EventType | '';
  venue: string;
  address: string;
  city: string;
  country: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  isFree: boolean;
  priceCents: string; // string for input, parse on submit
  capacity: string;
  cultureTagIds: string[];
  languageTagIds: string[];
}

const defaultForm: FormData = {
  title: '',
  description: '',
  eventType: '',
  venue: '',
  address: '',
  city: '',
  country: 'Australia',
  date: '',
  time: '',
  isFree: true,
  priceCents: '',
  capacity: '',
  cultureTagIds: [],
  languageTagIds: [],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CreateEventScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const queryClient = useQueryClient();

  const { state: onboardingState } = useOnboarding();

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormData>({
    ...defaultForm,
    city: onboardingState.city || '',
    country: onboardingState.country || 'Australia',
    cultureTagIds: onboardingState.cultureIds?.slice(0, 3) ?? [],
    languageTagIds: onboardingState.languageIds?.slice(0, 2) ?? [],
  });

  const step = STEPS[stepIndex];

  // Culture options from selected nationality
  const availableCultures = useMemo(() => {
    const nat = onboardingState.nationalityId;
    if (nat) return getCulturesForNationality(nat);
    return ALL_NATIONALITIES.flatMap((n) => getCulturesForNationality(n.id)).slice(0, 30);
  }, [onboardingState.nationalityId]);

  // ── Mutation ──────────────────────────────────────────────────────────────
  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: async () => {
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
        time:        form.time || undefined,
        isFree:      form.isFree,
        priceCents:  form.isFree ? 0 : Math.round(parseFloat(form.priceCents || '0') * 100),
        capacity:    form.capacity ? parseInt(form.capacity, 10) : undefined,
        cultureTag:  form.cultureTagIds,
        languageTags: form.languageTagIds,
      };
      const draft = await api.events.create(payload);
      await api.events.publish(draft.id);
      return draft;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/event/[id]', params: { id: event.id } });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isUnauthorized) {
        router.push('/(onboarding)/login');
        return;
      }
      Alert.alert('Could not create event', err instanceof Error ? err.message : 'Please try again.');
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
    }
    if (step === 'tickets') {
      if (!form.isFree && !form.priceCents) return 'Enter a ticket price or mark as free.';
    }
    return null;
  }, [step, form]);

  const goNext = useCallback(() => {
    const err = validateStep();
    if (err) { Alert.alert('Missing info', err); return; }
    if (step === 'review') { createEvent(); return; }
    haptic();
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, [step, validateStep, createEvent]);

  const goBack = useCallback(() => {
    if (stepIndex === 0) {
      if (router.canGoBack()) { router.back(); } else { router.replace('/(tabs)'); }
      return;
    }
    haptic();
    setStepIndex((i) => i - 1);
  }, [stepIndex]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.indigo + 'CC', colors.background]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={[TextStyles.title3, { color: colors.text }]}>Create Event</Text>
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>Step {stepIndex + 1} of {STEPS.length}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Step dot indicator */}
      <View style={styles.stepDots}>
        {STEPS.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <View key={s} style={styles.stepDotWrap}>
              <View style={[
                styles.stepDot,
                active && { backgroundColor: CultureTokens.saffron, width: 24 },
                done && { backgroundColor: CultureTokens.indigo },
                !active && !done && { backgroundColor: colors.borderLight },
              ]}>
                {done && <Ionicons name="checkmark" size={10} color="#fff" />}
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepDotLine, { backgroundColor: i < stepIndex ? CultureTokens.indigo : colors.borderLight }]} />
              )}
            </View>
          );
        })}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
        >
          <Animated.View
            key={step}
            entering={FadeInDown.duration(220).springify().damping(22)}
            style={[styles.card, isDesktop && styles.cardDesktop, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >

            {/* Step header */}
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrap, { backgroundColor: CultureTokens.indigo + '20', borderColor: CultureTokens.indigo + '30' }]}>
                <Ionicons name={STEP_ICONS[step]} size={24} color={CultureTokens.saffron} />
              </View>
              <View>
                <Text style={[TextStyles.title2, { color: colors.text }]}>{STEP_TITLES[step]}</Text>
                <Text style={[TextStyles.callout, { color: colors.textSecondary }]}>{getStepSub(step)}</Text>
              </View>
            </View>

            {/* ── Basics ─────────────────────────────────────────────── */}
            {step === 'basics' && (
              <View style={styles.fields}>
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
                  <Input
                    value={form.description}
                    onChangeText={(v) => setField('description', v)}
                    placeholder="Tell people what this event is about…"
                    multiline
                    numberOfLines={4}
                    maxLength={1000}
                    inputStyle={styles.textArea}
                    textAlignVertical="top"
                    accessibilityLabel="Event description"
                  />
                </Field>

                <Field label="Event Type" colors={colors}>
                  <View style={styles.typeGrid}>
                    {EVENT_TYPES.map(({ id, label, emoji }) => {
                      const isSelected = form.eventType === id;
                      return (
                        <Pressable
                          key={id}
                          style={({ pressed }) => [
                            styles.typeChip,
                            { 
                              borderColor: isSelected ? CultureTokens.saffron : colors.border, 
                              backgroundColor: isSelected ? CultureTokens.saffron + '15' : colors.surfaceElevated 
                            },
                            pressed && { opacity: 0.8 },
                          ]}
                          onPress={() => { haptic(); setField('eventType', id); }}
                          accessibilityRole="radio"
                          accessibilityLabel={label}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text style={styles.typeEmoji}>{emoji}</Text>
                          <Text style={[TextStyles.labelSemibold, { color: isSelected ? CultureTokens.saffron : colors.text }]}>{label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
              </View>
            )}

            {/* ── Location ───────────────────────────────────────────── */}
            {step === 'location' && (
              <View style={styles.fields}>
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

                <View style={styles.row}>
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

            {/* ── Date & Time ────────────────────────────────────────── */}
            {step === 'datetime' && (
              <View style={styles.fields}>
                <Input
                  label="Date * (YYYY-MM-DD)"
                  value={form.date}
                  onChangeText={(v) => setField('date', v)}
                  placeholder="2026-09-12"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  accessibilityLabel="Event date"
                  containerStyle={{ marginBottom: 20 }}
                />

                <Input
                  label="Start Time (optional)"
                  value={form.time}
                  onChangeText={(v) => setField('time', v)}
                  placeholder="18:30"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  accessibilityLabel="Event time"
                  containerStyle={{ marginBottom: 20 }}
                />

                <View style={[styles.infoBox, { backgroundColor: CultureTokens.indigo + '10', borderColor: CultureTokens.indigo + '20' }]}>
                  <Ionicons name="information-circle-outline" size={18} color={CultureTokens.saffron} />
                  <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                    Date format: YYYY-MM-DD (e.g. 2026-09-12). Time format: HH:MM 24h (e.g. 18:30).
                  </Text>
                </View>
              </View>
            )}

            {/* ── Tickets ────────────────────────────────────────────── */}
            {step === 'tickets' && (
              <View style={styles.fields}>
                <View style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
                  <View>
                    <Text style={[TextStyles.headline, { color: colors.text }]}>Free event</Text>
                    <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>No ticket purchase required</Text>
                  </View>
                  <Switch
                    value={form.isFree}
                    onValueChange={(v) => { haptic(); setField('isFree', v); }}
                    trackColor={{ false: colors.border, true: CultureTokens.saffron }}
                    thumbColor="#fff"
                    accessibilityLabel="Free event toggle"
                  />
                </View>

                {!form.isFree && (
                  <View style={{ marginBottom: 20 }}>
                    <Input
                      label="Ticket Price (AUD)"
                      value={form.priceCents}
                      onChangeText={(v) => setField('priceCents', v.replace(/[^0-9.]/g, ''))}
                      placeholder="25.00"
                      keyboardType="decimal-pad"
                      leftIcon="cash-outline"
                      accessibilityLabel="Ticket price"
                    />
                  </View>
                )}

                <Input
                  label="Capacity (optional)"
                  value={form.capacity}
                  onChangeText={(v) => setField('capacity', v.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 200"
                  keyboardType="number-pad"
                  leftIcon="people-outline"
                  accessibilityLabel="Event capacity"
                />
              </View>
            )}

            {/* ── Culture ────────────────────────────────────────────── */}
            {step === 'culture' && (
              <View style={styles.fields}>
                <Text style={[styles.sectionNote, { color: colors.textSecondary }]}>
                  Tag this event so people from specific cultures can discover it.
                </Text>

                <Field label="Culture Tags" colors={colors}>
                  <View style={styles.tagGrid}>
                    {availableCultures.slice(0, 20).map((c) => {
                      const isSelected = form.cultureTagIds.includes(c.id);
                      return (
                        <Pressable
                          key={c.id}
                          style={({ pressed }) => [
                            styles.tagChip,
                            { borderColor: isSelected ? CultureTokens.saffron : colors.border, backgroundColor: isSelected ? CultureTokens.saffron + '22' : colors.background },
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => toggleCultureTag(c.id)}
                          accessibilityRole="checkbox"
                          accessibilityLabel={c.label}
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text style={styles.tagEmoji}>{c.emoji}</Text>
                          <Text style={[styles.tagLabel, { color: isSelected ? CultureTokens.saffron : colors.text }]}>{c.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>

                <Field label="Language Tags" colors={colors}>
                  <View style={styles.tagGrid}>
                    {COMMON_LANGUAGES.slice(0, 16).map((l) => {
                      const isSelected = form.languageTagIds.includes(l.id);
                      return (
                        <Pressable
                          key={l.id}
                          style={({ pressed }) => [
                            styles.tagChip,
                            { borderColor: isSelected ? CultureTokens.teal : colors.border, backgroundColor: isSelected ? CultureTokens.teal + '22' : colors.background },
                            pressed && { opacity: 0.7 },
                          ]}
                          onPress={() => toggleLanguageTag(l.id)}
                          accessibilityRole="checkbox"
                          accessibilityLabel={l.name}
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text style={[styles.tagLabel, { color: isSelected ? CultureTokens.teal : colors.text }]}>{l.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>
              </View>
            )}

            {/* ── Review ─────────────────────────────────────────────── */}
            {step === 'review' && (
              <View style={styles.fields}>
                <ReviewRow label="Title" value={form.title} colors={colors} />
                <ReviewRow label="Type" value={EVENT_TYPES.find((t) => t.id === form.eventType)?.label ?? '—'} colors={colors} />
                <ReviewRow label="Location" value={[form.venue, form.city, form.country].filter(Boolean).join(', ')} colors={colors} />
                <ReviewRow label="Date" value={[form.date, form.time].filter(Boolean).join(' at ')} colors={colors} />
                <ReviewRow label="Tickets" value={form.isFree ? 'Free' : `$${parseFloat(form.priceCents || '0').toFixed(2)} AUD`} colors={colors} />
                {form.cultureTagIds.length > 0 && (
                  <ReviewRow
                    label="Cultures"
                    value={form.cultureTagIds.map((id) => availableCultures.find((c) => c.id === id)?.label ?? id).join(', ')}
                    colors={colors}
                  />
                )}
                {form.languageTagIds.length > 0 && (
                  <ReviewRow
                    label="Languages"
                    value={form.languageTagIds.map((id) => COMMON_LANGUAGES.find((l) => l.id === id)?.name ?? id).join(', ')}
                    colors={colors}
                  />
                )}

                <View style={[styles.infoBox, { backgroundColor: CultureTokens.saffron + '15', borderColor: CultureTokens.saffron + '40', marginTop: 8 }]}>
                  <Ionicons name="rocket-outline" size={18} color={CultureTokens.saffron} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Your event will be published immediately and appear in Discover.
                  </Text>
                </View>
              </View>
            )}

            {/* ── Navigation ─────────────────────────────────────────── */}
            <View style={styles.navRow}>
              {stepIndex > 0 && (
                <Button variant="outline" size="lg" onPress={goBack} style={styles.navBack}>
                  Back
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth={stepIndex === 0}
                rightIcon={step === 'review' ? undefined : 'arrow-forward'}
                onPress={goNext}
                disabled={isPending}
                style={[styles.navNext, { backgroundColor: CultureTokens.saffron, flex: stepIndex > 0 ? 1 : undefined }]}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : step === 'review' ? (
                  'Publish Event'
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
  root:         { flex: 1 },
  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topCenter:    { flex: 1, alignItems: 'center' },
  topTitle:     { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  topStep:      { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  stepDots:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 12, gap: 0 },
  stepDotWrap:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot:      { width: 10, height: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  stepDotLine:  { flex: 1, height: 2, marginHorizontal: 4 },
  scroll:       { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 60 },
  scrollDesktop:{ paddingHorizontal: 0, maxWidth: 700, alignSelf: 'center' as const, width: '100%' },
  card:         { borderRadius: CardTokens.radius, borderWidth: 1, padding: CardTokens.padding + 4, gap: 0 },
  cardDesktop:  { borderRadius: 20 },
  stepHeader:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  stepIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stepTitle:    { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  fields:       { gap: 0 },
  input:        { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  textArea:     { minHeight: 100, paddingTop: 12 },
  row:          { flexDirection: 'row', gap: 12 },
  typeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  typeEmoji:    { fontSize: 16 },
  typeLabel:    { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 },
  toggleLabel:  { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  toggleSub:    { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceDollar:  { fontSize: 20, fontFamily: 'Poppins_600SemiBold', paddingBottom: 2 },
  priceInput:   { flex: 1 },
  tagGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  tagEmoji:     { fontSize: 15 },
  tagLabel:     { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  sectionNote:  { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 16, lineHeight: 20 },
  infoBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 14 },
  infoText:     { fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 18 },
  navRow:       { flexDirection: 'row', gap: 12, marginTop: 28 },
  navBack:      { flex: 0, minWidth: 90 },
  navNext:      { height: 56, borderRadius: 16 },
});

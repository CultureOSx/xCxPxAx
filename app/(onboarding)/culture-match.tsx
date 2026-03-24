import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  TextInput, KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useCallback, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens, gradients, CardTokens, glass, shadows } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { routeWithRedirect, sanitizeInternalRedirect } from '@/lib/routes';
import {
  ALL_NATIONALITIES,
  getCulturesForNationality,
  getDiasporaGroupsForNationality,
  searchNationalities,
  type Nationality,
  type Culture,
} from '@/constants/cultures';
import { COMMON_LANGUAGES, searchLanguages, type Language } from '@/constants/languages';

type Step = 'nationality' | 'culture' | 'language';

const STEP_LABELS: Record<Step, string> = {
  nationality: 'Where are you from?',
  culture:     'Your cultural roots',
  language:    'Languages you speak',
};

const STEP_SUBTITLES: Record<Step, string> = {
  nationality: 'Select your nationality. This personalises your event feed and community matching.',
  culture:     'Select your specific culture(s). You can pick multiple.',
  language:    'Which languages do you speak? We\'ll show events in your languages.',
};

const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  nationality: 'flag-outline',
  culture:     'people-circle-outline',
  language:    'chatbubbles-outline',
};

export default function CultureMatchScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const {
    state,
    setNationalityId,
    setCultureIds,
    setLanguageIds,
    setDiasporaGroupIds,
    setEthnicityText,
    setLanguages,
  } = useOnboarding();

  const [step, setStep] = useState<Step>('nationality');
  const [nationalityQuery, setNationalityQuery] = useState('');
  const [cultureQuery, setCultureQuery] = useState('');
  const [languageQuery, setLanguageQuery] = useState('');

  const [selectedNationality, setSelectedNationality] = useState<Nationality | null>(
    state.nationalityId ? (ALL_NATIONALITIES.find((n) => n.id === state.nationalityId) ?? null) : null,
  );
  const [selectedCultureIds, setSelectedCultureIds] = useState<string[]>(state.cultureIds ?? []);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>(state.languageIds ?? []);

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredNationalities = useMemo(
    () => searchNationalities(nationalityQuery),
    [nationalityQuery],
  );

  const availableCultures = useMemo(
    () => selectedNationality ? getCulturesForNationality(selectedNationality.id) : [],
    [selectedNationality],
  );

  const filteredCultures = useMemo(() => {
    const needle = cultureQuery.trim().toLowerCase();
    if (!needle) return availableCultures;
    return availableCultures.filter((c) => c.label.toLowerCase().includes(needle));
  }, [availableCultures, cultureQuery]);

  const filteredLanguages = useMemo(() => {
    const pool = languageQuery.trim().length >= 2 ? searchLanguages(languageQuery) : COMMON_LANGUAGES;
    return pool.filter((l) => !selectedLanguageIds.includes(l.id));
  }, [languageQuery, selectedLanguageIds]);

  const selectedLanguageObjects = useMemo(
    () => selectedLanguageIds.map((id) => COMMON_LANGUAGES.find((l) => l.id === id) ?? searchLanguages(id)[0]).filter(Boolean) as Language[],
    [selectedLanguageIds],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const haptic = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

  const pickNationality = useCallback((nat: Nationality) => {
    haptic();
    setSelectedNationality(nat);
    setNationalityId(nat.id);
    // auto-advance
    setStep('culture');
    // reset cultures since nationality changed
    setSelectedCultureIds([]);
  }, [setNationalityId]);

  const toggleCulture = useCallback((culture: Culture) => {
    haptic();
    setSelectedCultureIds((prev) =>
      prev.includes(culture.id) ? prev.filter((id) => id !== culture.id) : [...prev, culture.id],
    );
  }, []);

  const toggleLanguage = useCallback((lang: Language) => {
    haptic();
    setSelectedLanguageIds((prev) =>
      prev.includes(lang.id) ? prev.filter((id) => id !== lang.id) : [...prev, lang.id],
    );
  }, []);

  const removeLanguage = useCallback((langId: string) => {
    haptic();
    setSelectedLanguageIds((prev) => prev.filter((id) => id !== langId));
  }, []);

  const goBack = useCallback(() => {
    if (step === 'culture') { setStep('nationality'); return; }
    if (step === 'language') { setStep('culture'); return; }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(routeWithRedirect('/(onboarding)/communities', redirectTo) as any);
    }
  }, [step, redirectTo]);

  const goNext = useCallback(() => {
    if (step === 'nationality') { setStep('culture'); return; }
    if (step === 'culture') { setStep('language'); return; }

    // Final step — persist & continue
    setCultureIds(selectedCultureIds);
    setLanguageIds(selectedLanguageIds);

    // Derive diaspora groups from nationality
    const diasporaGroups = selectedNationality
      ? getDiasporaGroupsForNationality(selectedNationality.id).map((g) => g.id)
      : [];
    setDiasporaGroupIds(diasporaGroups);

    // Keep legacy fields in sync for backward compat
    setEthnicityText(selectedNationality?.label ?? '');
    setLanguages(selectedLanguageObjects.map((l) => l.name));

    router.push(routeWithRedirect('/(onboarding)/interests', redirectTo) as any);
  }, [step, selectedCultureIds, selectedLanguageIds, selectedNationality, selectedLanguageObjects, setCultureIds, setLanguageIds, setDiasporaGroupIds, setEthnicityText, setLanguages, redirectTo]);

  const stepIndex = step === 'nationality' ? 0 : step === 'culture' ? 1 : 2;
  const canProceed =
    step === 'nationality' ? !!selectedNationality :
    step === 'culture' ? selectedCultureIds.length > 0 :
    selectedLanguageIds.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />

      {Platform.OS === 'web' && (
        <>
          <View style={[styles.orb, { top: -100, right: -50, backgroundColor: CultureTokens.indigo, opacity: 0.5, filter: 'blur(50px)' } as any]} />
          <View style={[styles.orb, { bottom: -50, left: -50, backgroundColor: CultureTokens.saffron, opacity: 0.3, filter: 'blur(50px)' } as any]} />
        </>
      )}

      {/* Header row */}
      {!isDesktop ? (
        <View style={[styles.mobileHeader, { paddingTop: topInset + 12 }]}>
          <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={28} color={colors.textInverse} />
          </Pressable>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>3 of 4</Text>
        </View>
      ) : (
        <View style={styles.desktopBackRow}>
          <Pressable onPress={goBack} hitSlop={8} style={[styles.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: colors.border }]}>
            <Ionicons name="chevron-back" size={18} color={colors.textInverse} />
            <Text style={[styles.desktopBackText, { color: colors.textInverse }]}>Back</Text>
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop, !isDesktop && { paddingTop: 20 }]}
        >
          <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop, { borderRadius: CardTokens.radiusLarge }]}>
            {Platform.OS === 'ios' || Platform.OS === 'web' ? (
              <BlurView intensity={isDesktop ? 60 : 40} tint="dark" style={[StyleSheet.absoluteFill, styles.formBlur, { borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.formBlur, { backgroundColor: glass.dark.backgroundColor, borderRadius: CardTokens.radiusLarge, borderColor: colors.borderLight }]} />
            )}

            <View style={[styles.formContent, { padding: CardTokens.paddingLarge * 2 }]}>

              {/* Step indicator dots */}
              <View style={styles.dotRow}>
                {(['nationality', 'culture', 'language'] as Step[]).map((s, i) => (
                  <View key={s} style={[styles.dot, i === stepIndex && styles.dotActive]} />
                ))}
              </View>

              {/* Icon + title */}
              <View style={styles.headerBlock}>
                <View style={[styles.iconWrapper, { backgroundColor: colors.overlay, borderColor: colors.borderLight }]}>
                  <Ionicons name={STEP_ICONS[step]} size={28} color={colors.textInverse} />
                </View>
                <Text style={[styles.title, { color: colors.textInverse }]}>{STEP_LABELS[step]}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{STEP_SUBTITLES[step]}</Text>
              </View>

              {/* ── Step: Nationality ─────────────────────────────────── */}
              {step === 'nationality' && (
                <View>
                  <TextInput
                    value={nationalityQuery}
                    onChangeText={setNationalityQuery}
                    placeholder="Search nationality…"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { borderColor: colors.borderLight, color: colors.textInverse, backgroundColor: colors.overlay }]}
                    autoCapitalize="words"
                    returnKeyType="search"
                    accessibilityLabel="Search nationality"
                  />
                  <View style={styles.chipGrid}>
                    {filteredNationalities.map((nat) => {
                      const isSelected = selectedNationality?.id === nat.id;
                      return (
                        <Pressable
                          key={nat.id}
                          style={({ pressed }) => [
                            styles.natChip,
                            { borderColor: isSelected ? CultureTokens.saffron : colors.borderLight, backgroundColor: isSelected ? `${CultureTokens.saffron}33` : colors.overlay },
                            pressed && { opacity: 0.75 },
                          ]}
                          onPress={() => pickNationality(nat)}
                          accessibilityRole="button"
                          accessibilityLabel={nat.label}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text style={styles.natEmoji}>{nat.emoji}</Text>
                          <Text style={[styles.natLabel, { color: colors.textInverse }]} numberOfLines={1}>{nat.label}</Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={14} color={CultureTokens.saffron} style={styles.natCheck} />}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* ── Step: Culture ─────────────────────────────────────── */}
              {step === 'culture' && (
                <View>
                  {selectedNationality && (
                    <View style={[styles.selectedNatBadge, { borderColor: CultureTokens.saffron, backgroundColor: `${CultureTokens.saffron}20` }]}>
                      <Text style={styles.selectedNatEmoji}>{selectedNationality.emoji}</Text>
                      <Text style={[styles.selectedNatLabel, { color: CultureTokens.saffron }]}>{selectedNationality.label}</Text>
                      <Pressable onPress={() => setStep('nationality')} hitSlop={8}>
                        <Ionicons name="pencil-outline" size={14} color={CultureTokens.saffron} />
                      </Pressable>
                    </View>
                  )}

                  {availableCultures.length > 5 && (
                    <TextInput
                      value={cultureQuery}
                      onChangeText={setCultureQuery}
                      placeholder="Search cultures…"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.searchInput, { borderColor: colors.borderLight, color: colors.textInverse, backgroundColor: colors.overlay, marginBottom: 16 }]}
                      autoCapitalize="words"
                      returnKeyType="search"
                    />
                  )}

                  <View style={styles.chipGrid}>
                    {filteredCultures.map((culture) => {
                      const isSelected = selectedCultureIds.includes(culture.id);
                      return (
                        <Pressable
                          key={culture.id}
                          style={({ pressed }) => [
                            styles.cultureChip,
                            { borderColor: isSelected ? CultureTokens.saffron : colors.borderLight, backgroundColor: isSelected ? `${CultureTokens.saffron}33` : colors.overlay },
                            pressed && { opacity: 0.75 },
                          ]}
                          onPress={() => toggleCulture(culture)}
                          accessibilityRole="checkbox"
                          accessibilityLabel={culture.label}
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text style={styles.cultureEmoji}>{culture.emoji}</Text>
                          <Text style={[styles.cultureLabel, { color: colors.textInverse }]}>{culture.label}</Text>
                          {isSelected && <Ionicons name="checkmark" size={16} color={CultureTokens.saffron} />}
                        </Pressable>
                      );
                    })}
                  </View>

                  {availableCultures.length === 0 && (
                    <Text style={[styles.emptyNote, { color: colors.textSecondary }]}>
                      No specific cultures listed — tap Continue to proceed.
                    </Text>
                  )}
                </View>
              )}

              {/* ── Step: Language ────────────────────────────────────── */}
              {step === 'language' && (
                <View>
                  {/* Selected chips */}
                  {selectedLanguageObjects.length > 0 && (
                    <View style={styles.selectedLangWrap}>
                      {selectedLanguageObjects.map((lang) => (
                        <Pressable
                          key={lang.id}
                          style={styles.selectedLangChip}
                          onPress={() => removeLanguage(lang.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${lang.name}`}
                        >
                          <Text style={[styles.selectedLangText, { color: colors.textInverse }]}>{lang.name}</Text>
                          <Ionicons name="close" size={14} color={colors.textInverse} />
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <TextInput
                    value={languageQuery}
                    onChangeText={setLanguageQuery}
                    placeholder="Search languages…"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { borderColor: colors.borderLight, color: colors.textInverse, backgroundColor: colors.overlay }]}
                    autoCapitalize="words"
                    returnKeyType="search"
                  />

                  {languageQuery.trim().length < 2 && (
                    <Text style={[styles.helper, { color: colors.textSecondary }]}>Popular languages shown. Type to search all.</Text>
                  )}

                  <View style={styles.chipGrid}>
                    {filteredLanguages.map((lang) => (
                      <Pressable
                        key={lang.id}
                        style={({ pressed }) => [
                          styles.langChip,
                          { borderColor: colors.borderLight, backgroundColor: colors.overlay },
                          pressed && { opacity: 0.75 },
                        ]}
                        onPress={() => toggleLanguage(lang)}
                        accessibilityRole="button"
                        accessibilityLabel={lang.name}
                      >
                        <Text style={[styles.langLabel, { color: colors.textInverse }]}>{lang.name}</Text>
                        {lang.nativeName && lang.nativeName !== lang.name && (
                          <Text style={[styles.langNative, { color: colors.textSecondary }]}>{lang.nativeName}</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* ── Actions ───────────────────────────────────────────── */}
              <View style={styles.actions}>
                {step !== 'nationality' && (
                  <Button
                    variant="outline"
                    size="lg"
                    onPress={goBack}
                    style={styles.skipBtn}
                  >
                    Back
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth={step === 'nationality'}
                  rightIcon={step === 'language' ? undefined : 'arrow-forward'}
                  onPress={canProceed ? goNext : goNext}
                  style={[styles.submitBtn, shadows.medium, { backgroundColor: CultureTokens.saffron, flex: step !== 'nationality' ? 1 : undefined }]}
                >
                  {step === 'language' ? 'Continue' : 'Next'}
                </Button>
              </View>

              {/* Skip link */}
              <Pressable
                onPress={() => {
                  if (step === 'nationality') setStep('culture');
                  else if (step === 'culture') setStep('language');
                  else router.push(routeWithRedirect('/(onboarding)/interests', redirectTo) as any);
                }}
                style={styles.skipLink}
                accessibilityRole="button"
                accessibilityLabel="Skip this step"
              >
                <Text style={[styles.skipLinkText, { color: colors.textSecondary }]}>Skip this step</Text>
              </Pressable>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:            { flex: 1 },
  gradientBg:           { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.85 },
  orb:                  { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  keyboardAvoid:        { flex: 1 },
  mobileHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  stepText:             { fontSize: 13, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, textTransform: 'uppercase' },
  desktopBackRow:       { position: 'absolute', top: 32, left: 40, zIndex: 10 },
  desktopBackBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1 },
  desktopBackText:      { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  scrollContent:        { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },
  formContainer:        { width: '100%', maxWidth: 580, alignSelf: 'center', overflow: 'hidden' },
  formContainerDesktop: { maxWidth: 640 },
  formBlur:             { borderWidth: 1 },
  formContent:          { paddingTop: 40 },

  // Step dots
  dotRow:       { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive:    { width: 24, backgroundColor: CultureTokens.saffron },

  // Header
  headerBlock:  { alignItems: 'center', marginBottom: 28 },
  iconWrapper:  { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1 },
  title:        { fontSize: 28, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  subtitle:     { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 20 },

  // Search input
  searchInput:  { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, fontFamily: 'Poppins_400Regular', marginBottom: 16 },
  helper:       { fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 12 },

  // Nationality chips
  chipGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  natChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, maxWidth: '48%' },
  natEmoji:     { fontSize: 18 },
  natLabel:     { fontSize: 13, fontFamily: 'Poppins_500Medium', flex: 1 },
  natCheck:     { marginLeft: 2 },

  // Selected nationality badge
  selectedNatBadge:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 16 },
  selectedNatEmoji:  { fontSize: 18 },
  selectedNatLabel:  { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  // Culture chips
  cultureChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  cultureEmoji: { fontSize: 16 },
  cultureLabel: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
  emptyNote:    { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginVertical: 16 },

  // Language selection
  selectedLangWrap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  selectedLangChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: CultureTokens.saffron, backgroundColor: `${CultureTokens.saffron}26`, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  selectedLangText:   { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  langChip:     { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  langLabel:    { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  langNative:   { fontSize: 11, fontFamily: 'Poppins_400Regular' },

  // Actions
  actions:      { flexDirection: 'row', gap: 12, marginTop: 28 },
  skipBtn:      { flex: 0, minWidth: 90 },
  submitBtn:    { height: 56, borderRadius: 16 },
  skipLink:     { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  skipLinkText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

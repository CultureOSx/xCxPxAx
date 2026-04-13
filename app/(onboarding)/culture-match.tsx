import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import {
  CultureTokens,
  gradients,
  CardTokens,
  glass,
  shadows,
  FontFamily,
  FontSize,
  TextStyles,
  Spacing,
  IconSize,
} from '@/constants/theme';

import { Button } from '@/components/ui/Button';
import { useLayout } from '@/hooks/useLayout';
import { type Step, useCultureMatch } from '@/hooks/useCultureMatch';

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS: Step[] = ['nationality', 'culture', 'language'];
const STEP_LABELS: Record<Step, string> = {
  nationality: 'Your nationality',
  culture: 'Cultural roots',
  language: 'Languages you speak',
};
const STEP_SUBTITLES: Record<Step, string> = {
  nationality: 'Select your nationality to personalise your event feed and community matching.',
  culture: 'Pick the specific culture(s) you identify with. You can select multiple.',
  language: 'Which languages do you speak? We\'ll surface events in your languages.',
};
const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  nationality: 'flag-outline',
  culture: 'people-circle-outline',
  language: 'chatbubbles-outline',
};

// Hardcoded white-based palette for the always-dark glass card
const ON_DARK = {
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.70)',
  textDim: 'rgba(255,255,255,0.45)',
  chipBorder: 'rgba(255,255,255,0.14)',
  chipBg: 'rgba(255,255,255,0.06)',
  chipBgActive: `${CultureTokens.gold}2E`,
  chipBorderActive: `${CultureTokens.gold}90`,
  inputBg: 'rgba(255,255,255,0.07)',
  inputBorder: 'rgba(255,255,255,0.16)',
  placeholder: 'rgba(255,255,255,0.35)',
  iconWrapperBg: `${CultureTokens.teal}18`,
  iconWrapperBorder: CultureTokens.teal,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CultureMatchScreen() {
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const {
    step,
    stepIndex,
    nationalityQuery,
    setNationalityQuery,
    cultureQuery,
    setCultureQuery,
    languageQuery,
    setLanguageQuery,
    selectedNationality,
    selectedCultureIds,
    filteredNationalities,
    availableCultures,
    filteredCultures,
    filteredLanguages,
    selectedLanguageObjects,
    pickNationality,
    toggleCulture,
    toggleLanguage,
    removeLanguage,
    goBack,
    goNext,
    skipStep,
  } = useCultureMatch();

  // Animated sub-step progress bar (nationality=1/3, culture=2/3, language=3/3)
  const progressAnim = useSharedValue((stepIndex + 1) / STEPS.length);
  React.useEffect(() => {
    progressAnim.value = withTiming((stepIndex + 1) / STEPS.length, {
      duration: 340,
      easing: Easing.out(Easing.cubic),
    });
  }, [stepIndex, progressAnim]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%` as any,
  }));

  return (
    <View style={s.container}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBg}
      />

      {/* Decorative orbs — web only */}
      {Platform.OS === 'web' && (
        <>
          <View style={[s.orb, { top: -40, right: -60, backgroundColor: CultureTokens.indigo, opacity: 0.4 }]} />
          <View style={[s.orb, { bottom: -80, left: -40, backgroundColor: CultureTokens.gold, opacity: 0.25 }]} />
        </>
      )}

      {/* Desktop Back */}
      {isDesktop && (
        <View style={s.desktopBackRow}>
          <Pressable
            onPress={goBack}
            hitSlop={Spacing.sm}
            style={[s.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: 'rgba(255,255,255,0.20)' }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={IconSize.md - 2} color="#FFFFFF" />
            <Text style={[s.desktopBackText, { color: '#FFFFFF' }]}>Back</Text>
          </Pressable>
        </View>
      )}

      {/* Mobile Header */}
      {!isDesktop && (
        <View style={[s.mobileHeader, { paddingTop: insets.top + Spacing.sm + 4 }]}>
          <Pressable
            onPress={goBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={s.mobileBackBtn}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </Pressable>

            <View style={[s.formContent, { padding: CardTokens.paddingLarge * 2 }]}> 
              {/* Step indicator dots */}
              <View style={s.dotRow}>
                {(['nationality', 'culture', 'language'] as Step[]).map((st, i) => (
                  <View
                    key={st}
                    style={[
                      s.dot,
                      i === stepIndex && s.dotActive,
                      i < stepIndex && { backgroundColor: `${CultureTokens.gold}80` },
                    ]}
                  >
                    {i === stepIndex && (
                      <LinearGradient
                        colors={[CultureTokens.gold, CultureTokens.gold]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <LinearGradient
                        colors={[CultureTokens.gold, '#FFD700']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
=======
          <View style={s.stepIndicatorWrap}>
            <Text style={s.stepText}>Step 3 of 4</Text>
            {/* Outer progress bar: step 3/4 = 75% */}
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: '75%' }]} />
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInUp.springify().damping(16).duration(600)}
          style={[s.formContainer, isDesktop && s.formContainerDesktop]}
        >
          {/* Glass card */}
          <View style={[StyleSheet.absoluteFill, s.formBlur]} />

          <View style={s.formContent}>

            {/* Sub-step progress segments */}
            <View style={s.subStepRow}>
              {STEPS.map((st, i) => {
                const isDone = i < stepIndex;
                const isActive = i === stepIndex;
                return (
                  <View key={st} style={[s.subStepSegment, isDone && s.subStepDone, isActive && s.subStepActive]}>
                    {isActive && (
                      <Animated.View style={[StyleSheet.absoluteFill, s.subStepActiveFill, progressStyle]} />
                    )}
                    {isDone && (
                      <Animated.View entering={FadeIn.duration(200)} style={s.subStepCheckWrap}>
                        <Ionicons name="checkmark" size={9} color="#fff" />
                      </Animated.View>
>>>>>>> cursor/onboarding-brand-lint-fixes
                    )}
                  </View>
                );
              })}
            </View>

            {/* Sub-step labels */}
            <View style={s.subStepLabels}>
              {STEPS.map((st, i) => (
                <Text
                  key={st}
                  style={[
                    s.subStepLabel,
                    i === stepIndex && s.subStepLabelActive,
                    i < stepIndex && s.subStepLabelDone,
                  ]}
                  numberOfLines={1}
                >
                  {STEP_LABELS[st]}
                </Text>
              ))}
            </View>

            {/* Header */}
            <View style={s.headerBlock}>
              <View style={[s.iconWrapper, { backgroundColor: ON_DARK.iconWrapperBg, borderColor: ON_DARK.iconWrapperBorder }]}>
                <Animated.View key={step} entering={FadeIn.duration(180)}>
                  <Ionicons name={STEP_ICONS[step]} size={30} color={CultureTokens.teal} />
                </Animated.View>
              </View>
              <Text style={s.title}>{STEP_LABELS[step]}</Text>
              <Text style={s.subtitle}>{STEP_SUBTITLES[step]}</Text>
            </View>

            {/* ── Nationality Step ── */}
            {step === 'nationality' && (
              <Animated.View entering={FadeInRight.springify().damping(15)} exiting={FadeOutLeft}>
                <View style={s.searchWrap}>
                  <Ionicons name="search" size={18} color={ON_DARK.textDim} />
                  <TextInput
                    value={nationalityQuery}
                    onChangeText={setNationalityQuery}
                    placeholder="Search nationality…"
                    placeholderTextColor={ON_DARK.placeholder}
                    style={s.searchInput}
                    autoCapitalize="words"
                    returnKeyType="search"
                    accessibilityLabel="Search nationality"
                    selectionColor={CultureTokens.gold}
                    underlineColorAndroid="transparent"
                  />
                  {nationalityQuery.length > 0 && (
                    <Pressable onPress={() => setNationalityQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                      <Ionicons name="close-circle" size={18} color={ON_DARK.textDim} />
                    </Pressable>
                  )}
                </View>

                <View style={s.chipGrid}>
                  {filteredNationalities.map((nat) => {
                    const isSelected = selectedNationality?.id === nat.id;
                    return (
                      <Pressable
                        key={nat.id}
                        style={({ pressed }) => [
                          s.natChip,
                          {
                            borderColor: isSelected ? ON_DARK.chipBorderActive : ON_DARK.chipBorder,
                            backgroundColor: isSelected
                              ? ON_DARK.chipBgActive
                              : pressed ? 'rgba(255,255,255,0.10)' : ON_DARK.chipBg,
                            borderWidth: isSelected ? 1.5 : 1,
                          },
                        ]}
                        onPress={() => pickNationality(nat)}
                        accessibilityRole="radio"
                        accessibilityLabel={nat.label}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text style={s.chipEmoji}>{nat.emoji}</Text>
                        <Text style={[s.chipLabel, isSelected && { color: CultureTokens.gold }]} numberOfLines={1}>
                          {nat.label}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color={CultureTokens.gold} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── Culture Step ── */}
            {step === 'culture' && (
              <Animated.View entering={FadeInRight.springify().damping(15)} exiting={FadeOutLeft}>
                {selectedNationality && (
                  <Animated.View entering={FadeIn.duration(220)} style={s.selectedNatBadge}>
                    <Text style={s.chipEmoji}>{selectedNationality.emoji}</Text>
                    <Text style={[s.badgeLabel, { color: CultureTokens.gold }]} numberOfLines={1}>
                      {selectedNationality.label}
                    </Text>
                    <Pressable
                      onPress={skipStep}
                      hitSlop={Spacing.sm}
                      accessibilityRole="button"
                      accessibilityLabel="Change nationality"
                      style={s.badgeEditBtn}
                    >
                      <Ionicons name="pencil-outline" size={14} color={`${CultureTokens.gold}CC`} />
                      <Text style={s.badgeEditText}>Change</Text>
                    </Pressable>
                  </Animated.View>
                )}

                {availableCultures.length > 5 && (
                  <View style={[s.searchWrap, { marginBottom: Spacing.md }]}>
                    <Ionicons name="search" size={18} color={ON_DARK.textDim} />
                    <TextInput
                      value={cultureQuery}
                      onChangeText={setCultureQuery}
                      placeholder="Search cultures…"
                      placeholderTextColor={ON_DARK.placeholder}
                      style={s.searchInput}
                      autoCapitalize="words"
                      returnKeyType="search"
                      accessibilityLabel="Search cultures"
                      selectionColor={CultureTokens.gold}
                      underlineColorAndroid="transparent"
                    />
                    {cultureQuery.length > 0 && (
                      <Pressable onPress={() => setCultureQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                        <Ionicons name="close-circle" size={18} color={ON_DARK.textDim} />
                      </Pressable>
                    )}
                  </View>
                )}

                {selectedCultureIds.length > 0 && (
                  <Text style={s.selectionCount}>
                    {selectedCultureIds.length} selected
                  </Text>
                )}

                <View style={s.chipGrid}>
                  {filteredCultures.map((culture) => {
                    const isSelected = selectedCultureIds.includes(culture.id);
                    return (
                      <Pressable
                        key={culture.id}
                        style={({ pressed }) => [
                          s.cultureChip,
                          {
                            borderColor: isSelected ? ON_DARK.chipBorderActive : ON_DARK.chipBorder,
                            backgroundColor: isSelected
                              ? ON_DARK.chipBgActive
                              : pressed ? 'rgba(255,255,255,0.10)' : ON_DARK.chipBg,
                            borderWidth: isSelected ? 1.5 : 1,
                          },
                        ]}
                        onPress={() => toggleCulture(culture)}
                        accessibilityRole="checkbox"
                        accessibilityLabel={culture.label}
                        accessibilityState={{ checked: isSelected }}
                      >
                        <Text style={s.chipEmoji}>{culture.emoji}</Text>
                        <Text style={[s.chipLabel, isSelected && { color: CultureTokens.gold }]} numberOfLines={1}>
                          {culture.label}
                        </Text>
                        {isSelected && <Ionicons name="checkmark" size={14} color={CultureTokens.gold} />}
                      </Pressable>
                    );
                  })}
                </View>

                {availableCultures.length === 0 && (
                  <Text style={s.emptyNote}>
                    No specific cultures listed — tap Continue to proceed.
                  </Text>
                )}
              </Animated.View>
            )}

            {/* ── Language Step ── */}
            {step === 'language' && (
              <Animated.View entering={FadeInRight.springify().damping(15)} exiting={FadeOutLeft}>
                {/* Selected language pills */}
                {selectedLanguageObjects.length > 0 && (
                  <View style={s.selectedLangWrap}>
                    {selectedLanguageObjects.map((lang) => (
                      <Pressable
                        key={lang.id}
                        style={s.selectedLangPill}
                        onPress={() => removeLanguage(lang.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${lang.name}`}
                      >
                        <Text style={s.selectedLangText}>{lang.name}</Text>
                        <Ionicons name="close" size={13} color={CultureTokens.gold} />
                      </Pressable>
                    ))}
                  </View>
                )}

                <View style={s.searchWrap}>
                  <Ionicons name="search" size={18} color={ON_DARK.textDim} />
                  <TextInput
                    value={languageQuery}
                    onChangeText={setLanguageQuery}
                    placeholder="Search languages…"
                    placeholderTextColor={ON_DARK.placeholder}
                    style={s.searchInput}
                    autoCapitalize="words"
                    returnKeyType="search"
                    accessibilityLabel="Search languages"
                    selectionColor={CultureTokens.gold}
                    underlineColorAndroid="transparent"
                  />
                  {languageQuery.length > 0 && (
                    <Pressable onPress={() => setLanguageQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                      <Ionicons name="close-circle" size={18} color={ON_DARK.textDim} />
                    </Pressable>
                  )}
                </View>

                {languageQuery.trim().length < 2 && (
                  <Text style={s.helper}>Popular languages shown · type to search all</Text>
                )}

                <View style={s.chipGrid}>
                  {filteredLanguages.map((lang) => (
                    <Pressable
                      key={lang.id}
                      style={({ pressed }) => [
                        s.langChip,
                        {
                          borderColor: ON_DARK.chipBorder,
                          backgroundColor: pressed ? 'rgba(255,255,255,0.10)' : ON_DARK.chipBg,
                        },
                      ]}
                      onPress={() => toggleLanguage(lang)}
                      accessibilityRole="button"
                      accessibilityLabel={lang.name}
                    >
                      <Text style={s.chipLabel}>{lang.name}</Text>
                      {lang.nativeName && lang.nativeName !== lang.name && (
                        <Text style={s.langNative}>{lang.nativeName}</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Action Buttons */}
            <View style={s.actions}>
              {step !== 'nationality' && (
                <Button
                  variant="outline"
                  size="lg"
                  onPress={goBack}
                  style={s.backBtn}
                >
                  Back
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth={step === 'nationality'}
                rightIcon={step === 'language' ? undefined : 'arrow-forward'}
                onPress={goNext}
                style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold }]}
              >
                {step === 'language' ? 'Continue' : 'Next'}
              </Button>
            </View>

            {/* Skip */}
            <Animated.View entering={FadeInDown.springify().damping(16).delay(250)}>
              <Pressable
                onPress={skipStep}
                style={s.skipLink}
                accessibilityRole="button"
                accessibilityLabel="Skip this step"
              >
                <Text style={s.skipLinkText}>Skip this step</Text>
              </Pressable>
            </Animated.View>

          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.85 },

  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    ...Platform.select({ web: { filter: 'blur(50px)' } as any }),
  },

  // ── Layout ──
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 80, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 80 },

  // ── Desktop back ──
  desktopBackRow: { position: 'absolute', top: Spacing.xl, left: Spacing.xxl, zIndex: 10 },
  desktopBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
  },
  desktopBackText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },

  // ── Mobile header ──
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Spacing.sm + 4,
    gap: 12,
  },
  mobileBackBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  stepIndicatorWrap: { flex: 1, alignItems: 'flex-end', gap: 6 },
  stepText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.60)',
  },
  progressTrack: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: CultureTokens.gold },

  // ── Form card ──
  formContainer: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 32,
  },
  formContainerDesktop: { maxWidth: 640 },
  formBlur: {
    backgroundColor: 'rgba(20,20,35,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 32,
  },
  formContent: { padding: 28 },

  // ── Sub-step progress ──
  subStepRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  subStepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subStepDone: { backgroundColor: CultureTokens.teal },
  subStepActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  subStepActiveFill: { backgroundColor: CultureTokens.gold, borderRadius: 2 },
  subStepCheckWrap: { position: 'absolute' },

  subStepLabels: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  subStepLabel: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.30)',
    textAlign: 'center',
  },
  subStepLabelActive: {
    color: CultureTokens.gold,
    fontFamily: FontFamily.semibold,
  },
  subStepLabelDone: {
    color: CultureTokens.teal,
    fontFamily: FontFamily.medium,
  },

  // ── Header block ──
  headerBlock: { alignItems: 'center', marginBottom: 22 },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
  },
  title: {
    ...TextStyles.display,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 320,
  },

  // ── Search bar (shared) ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: ON_DARK.inputBorder,
    borderRadius: CardTokens.radius,
    backgroundColor: ON_DARK.inputBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    marginBottom: Spacing.md,
    minHeight: 50,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    color: '#FFFFFF',
    padding: 0,
  },

  // ── Chip grid ──
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Nationality chip
  natChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: '48%',
    minHeight: 48,
  },
  chipEmoji: { fontSize: 20 },
  chipLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.body2,
    color: '#FFFFFF',
    flex: 1,
  },

  // Culture chip
  cultureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },

  // Language chip
  langChip: {
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 3,
    minHeight: 48,
  },
  langNative: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.45)',
  },

  selectionCount: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: CultureTokens.gold,
    marginBottom: 10,
  },
  emptyNote: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.callout,
    textAlign: 'center',
    marginVertical: 20,
    color: 'rgba(255,255,255,0.55)',
  },
  helper: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: Spacing.sm + 4,
  },

  // Selected nationality badge
  selectedNatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: `${CultureTokens.gold}80`,
    backgroundColor: `${CultureTokens.gold}18`,
    borderRadius: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.callout,
    flex: 1,
  },
  badgeEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeEditText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: `${CultureTokens.gold}CC`,
  },

  // Selected language pills
  selectedLangWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  selectedLangPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: `${CultureTokens.gold}80`,
    backgroundColor: `${CultureTokens.gold}20`,
    borderRadius: Spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  selectedLangText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.body2,
    color: CultureTokens.gold,
  },

  // Actions
  actions: { flexDirection: 'row', gap: Spacing.sm + 4, marginTop: Spacing.xl },
  backBtn: { flex: 0, minWidth: 100, borderRadius: CardTokens.radius },
  submitBtn: { height: 58, borderRadius: 20 },

  // Skip link — generous touch target
  skipLink: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: 14,
    minHeight: 48,
  },
  skipLinkText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body2,
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 0.2,
  },
});

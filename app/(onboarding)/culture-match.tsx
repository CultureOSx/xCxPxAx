import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useCallback, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { type Step, useCultureMatch } from '@/hooks/useCultureMatch';
import Animated, { FadeInDown, FadeInUp, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

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
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const {
    step,
    stepIndex,
    canProceed,
    nationalityQuery, setNationalityQuery,
    cultureQuery, setCultureQuery,
    languageQuery, setLanguageQuery,
    selectedNationality,
    selectedCultureIds,
    selectedLanguageIds,
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
    skipStep
  } = useCultureMatch();

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientBg}
      />

      {Platform.OS === 'web' && (
        <>
          <View style={[s.orb, { top: -40, right: -60, backgroundColor: CultureTokens.indigo, opacity: 0.4 }]} />
          <View style={[s.orb, { bottom: -80, left: -40, backgroundColor: CultureTokens.gold, opacity: 0.25 }]} />
        </>
      )}

      {!isDesktop ? (
        <View style={[s.mobileHeader, { paddingTop: topInset + Spacing.sm + 4 }]}>
          <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={28} color={colors.textInverse} />
          </Pressable>
          <Text style={[s.stepText, { color: colors.textSecondary }]}>3 of 4</Text>
        </View>
      ) : (
        <View style={s.desktopBackRow}>
          <Pressable
            onPress={goBack}
            hitSlop={Spacing.sm}
            style={[s.desktopBackBtn, { backgroundColor: glass.overlay.backgroundColor, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={IconSize.md - 2} color={colors.textInverse} />
            <Text style={[s.desktopBackText, { color: colors.textInverse }]}>Back</Text>
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView style={s.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.scrollContent, isDesktop && s.scrollContentDesktop, !isDesktop && { paddingTop: 20 }]}
        >
          <Animated.View entering={FadeInUp.springify().damping(16).duration(600)} style={[s.formContainer, isDesktop && s.formContainerDesktop, { borderRadius: 32 }]}>
            {Platform.OS === 'ios' || Platform.OS === 'web' ? (
              <BlurView
                intensity={isDesktop ? 80 : 60}
                tint="dark"
                style={[StyleSheet.absoluteFill, s.formBlur, { borderRadius: 32, borderColor: 'rgba(255,255,255,0.15)' }]}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.formBlur, { backgroundColor: 'rgba(20,20,35,0.85)', borderRadius: 32, borderColor: 'rgba(255,255,255,0.15)' }]} />
            )}

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
                        colors={[CultureTokens.gold, '#FFD700']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                  </View>
                ))}
              </View>

              <View style={s.headerBlock}>
                <View style={[s.iconWrapper, { backgroundColor: colors.overlay, borderColor: colors.borderLight }]}>
                  <Ionicons name={STEP_ICONS[step]} size={28} color={colors.textInverse} />
                </View>
                <Text style={[s.title, { color: colors.textInverse }]}>{STEP_LABELS[step]}</Text>
                <Text style={[s.subtitle, { color: colors.textSecondary }]}>{STEP_SUBTITLES[step]}</Text>
              </View>

              {/* Nationality step */}
              {step === 'nationality' && (
                <Animated.View entering={FadeInRight.springify().damping(15)} exiting={FadeOutLeft.duration(200)}>
                  <TextInput
                    value={nationalityQuery}
                    onChangeText={setNationalityQuery}
                    placeholder="Search nationality..."
                    placeholderTextColor={colors.textSecondary}
                    style={[s.searchInput, { borderColor: colors.borderLight, color: colors.textInverse, backgroundColor: colors.overlay }]}
                    autoCapitalize="words"
                    returnKeyType="search"
                    accessibilityLabel="Search nationality"
                  />
                  <View style={s.chipGrid}>
                    {filteredNationalities.map((nat) => {
                      const isSelected = selectedNationality?.id === nat.id;
                      return (
                        <Pressable
                          key={nat.id}
                          style={({ pressed }) => [
                            s.natChip,
                            { borderColor: isSelected ? CultureTokens.gold : colors.borderLight, backgroundColor: isSelected ? `${CultureTokens.gold}33` : colors.overlay },
                            pressed && { opacity: 0.75 },
                          ]}
                          onPress={() => pickNationality(nat)}
                          accessibilityRole="button"
                          accessibilityLabel={nat.label}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text style={s.natEmoji}>{nat.emoji}</Text>
                          <Text style={[s.natLabel, { color: colors.textInverse }]} numberOfLines={1}>{nat.label}</Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={FontSize.body2} color={CultureTokens.gold} style={s.natCheck} />}
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              )}

              {/* Culture step */}
              {step === 'culture' && (
                <Animated.View entering={FadeInRight.springify().damping(15)} exiting={FadeOutLeft.duration(200)}>
                  {selectedNationality && (
                    <View style={[s.selectedNatBadge, { borderColor: CultureTokens.gold, backgroundColor: `${CultureTokens.gold}20` }]}>
                      <Text style={s.selectedNatEmoji}>{selectedNationality.emoji}</Text>
                      <Text style={[s.selectedNatLabel, { color: CultureTokens.gold }]}>{selectedNationality.label}</Text>
                      <Pressable onPress={() => skipStep()} hitSlop={Spacing.sm} accessibilityRole="button" accessibilityLabel="Change nationality">
                        <Ionicons name="pencil-outline" size={FontSize.body2} color={CultureTokens.gold} />
                      </Pressable>
                    </View>
                  )}

                  {availableCultures.length > 5 && (
                    <TextInput
                      value={cultureQuery}
                      onChangeText={setCultureQuery}
                      placeholder="Search cultures..."
                      placeholderTextColor={colors.textSecondary}
                      style={[s.searchInput, { borderColor: colors.borderLight, color: colors.textInverse, backgroundColor: colors.overlay, marginBottom: Spacing.md }]}
                      autoCapitalize="words"
                      returnKeyType="search"
                      accessibilityLabel="Search cultures"
                    />
                  )}

                  <View style={s.chipGrid}>
                    {filteredCultures.map((culture) => {
                      const isSelected = selectedCultureIds.includes(culture.id);
                      return (
                        <Pressable
                          key={culture.id}
                          style={({ pressed }) => [
                            s.cultureChip,
                            { borderColor: isSelected ? CultureTokens.gold : colors.borderLight, backgroundColor: isSelected ? `${CultureTokens.gold}33` : colors.overlay },
                            pressed && { opacity: 0.75 },
                          ]}
                          onPress={() => toggleCulture(culture)}
                          accessibilityRole="checkbox"
                          accessibilityLabel={culture.label}
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text style={s.cultureEmoji}>{culture.emoji}</Text>
                          <Text style={[s.cultureLabel, { color: colors.textInverse }]}>{culture.label}</Text>
                          {isSelected && <Ionicons name="checkmark" size={IconSize.sm} color={CultureTokens.gold} />}
                        </Pressable>
                      );
                    })}
                  </View>

                  {availableCultures.length === 0 && (
                    <Text style={[s.emptyNote, { color: colors.textSecondary }]}>
                      No specific cultures listed -- tap Continue to proceed.
                    </Text>
                  )}
                </Animated.View>
              )}

              {/* Language step */}
              {step === 'language' && (
                <Animated.View entering={FadeInRight.springify().damping(15)} exiting={FadeOutLeft.duration(200)}>
                  {selectedLanguageObjects.length > 0 && (
                    <View style={s.selectedLangWrap}>
                      {selectedLanguageObjects.map((lang) => (
                        <Pressable
                          key={lang.id}
                          style={s.selectedLangChip}
                          onPress={() => removeLanguage(lang.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${lang.name}`}
                        >
                          <Text style={[s.selectedLangText, { color: colors.textInverse }]}>{lang.name}</Text>
                          <Ionicons name="close" size={FontSize.body2} color={colors.textInverse} />
                        </Pressable>
                      ))}
                    </View>
                  )}

                  <TextInput
                    value={languageQuery}
                    onChangeText={setLanguageQuery}
                    placeholder="Search languages..."
                    placeholderTextColor={colors.textSecondary}
                    style={[s.searchInput, { borderColor: colors.borderLight, color: colors.textInverse, backgroundColor: colors.overlay }]}
                    autoCapitalize="words"
                    returnKeyType="search"
                    accessibilityLabel="Search languages"
                  />

                  {languageQuery.trim().length < 2 && (
                    <Text style={[s.helper, { color: colors.textSecondary }]}>Popular languages shown. Type to search all.</Text>
                  )}

                  <View style={s.chipGrid}>
                    {filteredLanguages.map((lang) => (
                      <Pressable
                        key={lang.id}
                        style={({ pressed }) => [
                          s.langChip,
                          { borderColor: colors.borderLight, backgroundColor: colors.overlay },
                          pressed && { opacity: 0.75 },
                        ]}
                        onPress={() => toggleLanguage(lang)}
                        accessibilityRole="button"
                        accessibilityLabel={lang.name}
                      >
                        <Text style={[s.langLabel, { color: colors.textInverse }]}>{lang.name}</Text>
                        {lang.nativeName && lang.nativeName !== lang.name && (
                          <Text style={[s.langNative, { color: colors.textSecondary }]}>{lang.nativeName}</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Actions */}
              <View style={s.actions}>
                {step !== 'nationality' && (
                  <Button variant="outline" size="lg" onPress={goBack} style={s.skipBtn}>
                    Back
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth={step === 'nationality'}
                  rightIcon={step === 'language' ? undefined : 'arrow-forward'}
                  onPress={goNext}
                  style={[s.submitBtn, shadows.medium, { backgroundColor: CultureTokens.gold, flex: step !== 'nationality' ? 1 : undefined }]}
                >
                  {step === 'language' ? 'Continue' : 'Next'}
                </Button>
              </View>

              <Animated.View entering={FadeInDown.springify().damping(16).delay(250)}>
                <Pressable
                  onPress={skipStep}
                  style={s.skipLink}
                  accessibilityRole="button"
                  accessibilityLabel="Skip this step"
                >
                  <Text style={[s.skipLinkText, { color: colors.textSecondary }]}>Skip this step</Text>
                </Pressable>
              </Animated.View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles -- static StyleSheet
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container:            { flex: 1 },
  gradientBg:           { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.85 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    ...Platform.select({
      web: { filter: 'blur(50px)' } as Record<string, string>,
      default: {},
    }),
  },
  keyboardAvoid:        { flex: 1 },
  mobileHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: Spacing.sm + 4 },
  stepText:             { fontFamily: FontFamily.semibold, fontSize: FontSize.chip, letterSpacing: 1, textTransform: 'uppercase' },
  desktopBackRow:       { position: 'absolute', top: Spacing.xl, left: Spacing.xxl, zIndex: 10 },
  desktopBackBtn:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Spacing.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, borderWidth: 1 },
  desktopBackText:      { fontFamily: FontFamily.medium, fontSize: FontSize.body2 },
  scrollContent:        { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },
  formContainer:        { width: '100%', maxWidth: 580, alignSelf: 'center', overflow: 'hidden' },
  formContainerDesktop: { maxWidth: 640 },
  formBlur:             { borderWidth: 1 },
  formContent:          { paddingTop: Spacing.xxl },

  dotRow:       { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  dotActive:    { width: 32 },

  headerBlock:  { alignItems: 'center', marginBottom: 28 },
  iconWrapper:  { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, borderWidth: 1.5 },
  title: {
    ...TextStyles.display,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.callout,
    textAlign: 'center',
    opacity: 0.8,
  },

  searchInput: {
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.callout,
    marginBottom: Spacing.md,
  },
  helper: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginBottom: Spacing.sm + 4, opacity: 0.7 },

  chipGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  natChip:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Spacing.lg, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '48%' },
  natEmoji:     { fontSize: FontSize.title2 },
  natLabel:     { fontFamily: FontFamily.semibold, fontSize: FontSize.body2, flex: 1 },
  natCheck:     { marginLeft: Spacing.xs },

  selectedNatBadge:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: Spacing.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, alignSelf: 'flex-start', marginBottom: 20 },
  selectedNatEmoji:  { fontSize: FontSize.title2 },
  selectedNatLabel:  { fontFamily: FontFamily.bold, fontSize: FontSize.callout },

  cultureChip:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Spacing.lg, paddingHorizontal: 14, paddingVertical: 10 },
  cultureEmoji: { fontSize: FontSize.title3 },
  cultureLabel: { fontFamily: FontFamily.semibold, fontSize: FontSize.callout },
  emptyNote:    { fontFamily: FontFamily.regular, fontSize: FontSize.callout, textAlign: 'center', marginVertical: 20 },

  selectedLangWrap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  selectedLangChip:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: CultureTokens.gold, backgroundColor: `${CultureTokens.gold}26`, borderRadius: Spacing.lg, paddingHorizontal: 14, paddingVertical: Spacing.sm },
  selectedLangText:   { fontFamily: FontFamily.semibold, fontSize: FontSize.body2 },
  langChip:     { borderWidth: 1, borderRadius: CardTokens.radius, paddingHorizontal: 14, paddingVertical: 10, gap: Spacing.xs },
  langLabel:    { fontFamily: FontFamily.semibold, fontSize: FontSize.body2 },
  langNative:   { fontFamily: FontFamily.regular, fontSize: FontSize.caption, opacity: 0.7 },

  actions:      { flexDirection: 'row', gap: Spacing.sm + 4, marginTop: Spacing.xl },
  skipBtn:      { flex: 0, minWidth: 100, borderRadius: CardTokens.radius },
  submitBtn:    { height: 60, borderRadius: 20 },
  skipLink:     { alignItems: 'center', marginTop: Spacing.lg, paddingVertical: Spacing.sm },
  skipLinkText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2, letterSpacing: 0.2 },
});

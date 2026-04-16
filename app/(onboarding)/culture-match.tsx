import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Platform,
  TextInput, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CultureTokens,
  CardTokens,
  shadows,
  FontFamily,
  FontSize,
  TextStyles,
  Spacing,
  IconSize,
} from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { type Step, useCultureMatch } from '@/hooks/useCultureMatch';
import Animated, {
  FadeInDown, FadeInUp, FadeInRight, FadeOutLeft, FadeIn,
} from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Per-step design tokens
// ---------------------------------------------------------------------------

const STEP_ACCENT: Record<Step, string> = {
  nationality: CultureTokens.gold,
  culture:     CultureTokens.teal,
  language:    CultureTokens.purple,
};

const STEP_LABELS: Record<Step, string> = {
  nationality: 'Where are you from?',
  culture:     'Your cultural roots',
  language:    'Languages you speak',
};

const STEP_SUBTITLES: Record<Step, string> = {
  nationality: 'Select your nationality to personalise your feed and community matches.',
  culture:     'Pick your specific culture(s). You can choose more than one.',
  language:    'Which languages do you speak? We\'ll show events in your languages.',
};

const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  nationality: 'flag',
  culture:     'people-circle',
  language:    'chatbubbles',
};

const STEP_NUMBERS: Record<Step, string> = {
  nationality: '1',
  culture:     '2',
  language:    '3',
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CultureMatchScreen() {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const {
    step, stepIndex,
    nationalityQuery, setNationalityQuery,
    cultureQuery, setCultureQuery,
    languageQuery, setLanguageQuery,
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

  const accent = STEP_ACCENT[step];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Mobile header */}
      {!isDesktop && (
        <View style={[s.mobileHeader, { paddingTop: topInset + Spacing.sm }]}>
          <Pressable
            onPress={goBack}
            hitSlop={12}
            style={s.mobileBackBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={s.mobileStepIndicator}>
            <Text style={s.mobileStepLabel}>Step 3 of 4</Text>
            <View style={s.mobileProgressTrack}>
              <View style={[s.mobileProgressFill, { width: `${((stepIndex + 1) / 3) * 100}%` as any, backgroundColor: accent }]} />
            </View>
          </View>
        </View>
      )}

      {/* Desktop back */}
      {isDesktop && (
        <View style={s.desktopBackRow}>
          <Pressable
            onPress={goBack}
            hitSlop={Spacing.sm}
            style={[s.desktopBackBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={IconSize.md - 2} color={colors.text} />
            <Text style={[s.desktopBackText, { color: colors.text }]}>Back</Text>
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.scrollContent,
            isDesktop && s.scrollContentDesktop,
            !isDesktop && { paddingTop: 16 },
          ]}
        >
          <Animated.View
            entering={FadeInUp.springify().damping(18).duration(500)}
            style={[s.card, isDesktop && s.cardDesktop]}
          >
            {/* Glass surface */}
            <View style={[StyleSheet.absoluteFill, s.cardSurface]} />

            {/* Accent top bar */}
            <View style={[s.accentBar, { backgroundColor: accent }]} />

            <View style={s.cardContent}>

              {/* ── Progress stepper ── */}
              <View style={s.stepper}>
                {(['nationality', 'culture', 'language'] as Step[]).map((st, i) => {
                  const isDone = i < stepIndex;
                  const isActive = i === stepIndex;
                  const stAccent = STEP_ACCENT[st];
                  return (
                    <React.Fragment key={st}>
                      <View style={s.stepperItem}>
                        <View style={[
                          s.stepperCircle,
                          isDone && { backgroundColor: stAccent, borderColor: stAccent },
                          isActive && { borderColor: accent, borderWidth: 2.5 },
                          !isDone && !isActive && s.stepperCircleInactive,
                        ]}>
                          {isDone ? (
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          ) : (
                            <Text style={[
                              s.stepperNum,
                              isActive && { color: accent },
                            ]}>
                              {STEP_NUMBERS[st]}
                            </Text>
                          )}
                        </View>
                        <Text style={[
                          s.stepperName,
                          isActive && { color: '#FFFFFF', fontFamily: FontFamily.semibold },
                          isDone && { color: stAccent },
                        ]}>
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </Text>
                      </View>
                      {i < 2 && (
                        <View style={[s.stepperLine, isDone && { backgroundColor: stAccent }]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>

              {/* ── Step header ── */}
              <Animated.View key={step} entering={FadeIn.duration(220)} style={s.headerBlock}>
                <View style={[s.iconRing, { borderColor: `${accent}60`, backgroundColor: `${accent}18` }]}>
                  <Ionicons name={STEP_ICONS[step]} size={32} color={accent} />
                </View>
                <Text style={s.title}>{STEP_LABELS[step]}</Text>
                <Text style={s.subtitle}>{STEP_SUBTITLES[step]}</Text>
              </Animated.View>

              {/* ── Nationality step ── */}
              {step === 'nationality' && (
                <Animated.View entering={FadeInRight.duration(260).springify().damping(22)}>
                  {/* Search */}
                  <View style={s.searchWrap}>
                    <Ionicons name="search" size={18} color="rgba(255,255,255,0.45)" />
                    <TextInput
                      value={nationalityQuery}
                      onChangeText={setNationalityQuery}
                      placeholder="Search nationality…"
                      placeholderTextColor="rgba(255,255,255,0.38)"
                      style={s.searchInput}
                      autoCapitalize="words"
                      returnKeyType="search"
                      selectionColor={CultureTokens.gold}
                      underlineColorAndroid="transparent"
                      accessibilityLabel="Search nationality"
                    />
                    {nationalityQuery.length > 0 && (
                      <Pressable onPress={() => setNationalityQuery('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                      </Pressable>
                    )}
                  </View>

                  {/* Nationality grid */}
                  <View style={s.natGrid}>
                    {filteredNationalities.map((nat) => {
                      const isSelected = selectedNationality?.id === nat.id;
                      return (
                        <Pressable
                          key={nat.id}
                          style={({ pressed }) => [
                            s.natCard,
                            isSelected && { backgroundColor: `${CultureTokens.gold}28`, borderColor: CultureTokens.gold, borderWidth: 2 },
                            !isSelected && { backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)', borderColor: pressed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)' },
                          ]}
                          onPress={() => pickNationality(nat)}
                          accessibilityRole="radio"
                          accessibilityLabel={nat.label}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text style={s.natEmoji}>{nat.emoji}</Text>
                          <Text
                            style={[
                              s.natLabel,
                              { color: isSelected ? CultureTokens.gold : '#FFFFFF' },
                            ]}
                            numberOfLines={2}
                          >
                            {nat.label}
                          </Text>
                          {isSelected && (
                            <View style={[s.natCheckBadge, { backgroundColor: CultureTokens.gold }]}>
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                    {filteredNationalities.length === 0 && (
                      <Text style={s.emptyText}>{`No results for "${nationalityQuery}"`}</Text>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* ── Culture step ── */}
              {step === 'culture' && (
                <Animated.View
                  entering={FadeInRight.duration(260).springify().damping(22)}
                  exiting={FadeOutLeft}
                >
                  {/* Nationality context badge */}
                  {selectedNationality && (
                    <Animated.View entering={FadeIn.duration(200)} style={[s.contextBadge, { borderColor: `${CultureTokens.gold}70`, backgroundColor: `${CultureTokens.gold}18` }]}>
                      <Text style={s.contextBadgeEmoji}>{selectedNationality.emoji}</Text>
                      <View style={s.contextBadgeText}>
                        <Text style={s.contextBadgeEyebrow}>Your nationality</Text>
                        <Text style={[s.contextBadgeName, { color: CultureTokens.gold }]}>{selectedNationality.label}</Text>
                      </View>
                      <Pressable
                        onPress={goBack}
                        hitSlop={Spacing.sm}
                        style={[s.contextBadgeChange, { borderColor: `${CultureTokens.gold}55` }]}
                        accessibilityRole="button"
                        accessibilityLabel="Change nationality"
                      >
                        <Text style={[s.contextBadgeChangeText, { color: CultureTokens.gold }]}>Change</Text>
                      </Pressable>
                    </Animated.View>
                  )}

                  {/* Culture search */}
                  {availableCultures.length > 4 && (
                    <View style={s.searchWrap}>
                      <Ionicons name="search" size={18} color="rgba(255,255,255,0.45)" />
                      <TextInput
                        value={cultureQuery}
                        onChangeText={setCultureQuery}
                        placeholder="Search cultures…"
                        placeholderTextColor="rgba(255,255,255,0.38)"
                        style={s.searchInput}
                        autoCapitalize="words"
                        returnKeyType="search"
                        selectionColor={CultureTokens.teal}
                        underlineColorAndroid="transparent"
                        accessibilityLabel="Search cultures"
                      />
                      {cultureQuery.length > 0 && (
                        <Pressable onPress={() => setCultureQuery('')} hitSlop={8}>
                          <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                        </Pressable>
                      )}
                    </View>
                  )}

                  {/* Selection count */}
                  {selectedCultureIds.length > 0 && (
                    <Animated.View entering={FadeIn.duration(180)} style={[s.selectionCount, { backgroundColor: `${CultureTokens.teal}20`, borderColor: `${CultureTokens.teal}50` }]}>
                      <Ionicons name="checkmark-circle" size={15} color={CultureTokens.teal} />
                      <Text style={[s.selectionCountText, { color: CultureTokens.teal }]}>
                        {selectedCultureIds.length} selected
                      </Text>
                    </Animated.View>
                  )}

                  {/* Culture chips */}
                  <View style={s.chipWrap}>
                    {filteredCultures.map((culture) => {
                      const isSelected = selectedCultureIds.includes(culture.id);
                      return (
                        <Pressable
                          key={culture.id}
                          style={({ pressed }) => [
                            s.cultureChip,
                            isSelected && {
                              backgroundColor: `${CultureTokens.teal}28`,
                              borderColor: CultureTokens.teal,
                              borderWidth: 1.5,
                            },
                            !isSelected && {
                              backgroundColor: pressed ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
                              borderColor: pressed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                              borderWidth: 1,
                            },
                          ]}
                          onPress={() => toggleCulture(culture)}
                          accessibilityRole="checkbox"
                          accessibilityLabel={culture.label}
                          accessibilityState={{ checked: isSelected }}
                        >
                          <Text style={s.cultureEmoji}>{culture.emoji}</Text>
                          <Text style={[
                            s.cultureLabel,
                            { color: isSelected ? CultureTokens.teal : '#FFFFFF' },
                          ]}>
                            {culture.label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color={CultureTokens.teal} />
                          )}
                        </Pressable>
                      );
                    })}
                    {filteredCultures.length === 0 && availableCultures.length === 0 && (
                      <View style={s.emptyWrap}>
                        <Ionicons name="sparkles-outline" size={28} color="rgba(255,255,255,0.3)" />
                        <Text style={s.emptyText}>No specific sub-cultures listed — tap Continue.</Text>
                      </View>
                    )}
                    {filteredCultures.length === 0 && availableCultures.length > 0 && (
                      <Text style={s.emptyText}>{`No cultures match "${cultureQuery}"`}</Text>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* ── Language step ── */}
              {step === 'language' && (
                <Animated.View
                  entering={FadeInRight.duration(260).springify().damping(22)}
                  exiting={FadeOutLeft}
                >
                  {/* Selected languages */}
                  {selectedLanguageObjects.length > 0 && (
                    <Animated.View entering={FadeIn.duration(200)} style={s.selectedLangRow}>
                      {selectedLanguageObjects.map((lang) => (
                        <Pressable
                          key={lang.id}
                          style={[s.selectedLangPill, { backgroundColor: `${CultureTokens.purple}28`, borderColor: CultureTokens.purple }]}
                          onPress={() => removeLanguage(lang.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${lang.name}`}
                        >
                          <Text style={[s.selectedLangText, { color: CultureTokens.purple }]}>{lang.name}</Text>
                          <View style={[s.selectedLangX, { backgroundColor: `${CultureTokens.purple}40` }]}>
                            <Ionicons name="close" size={10} color={CultureTokens.purple} />
                          </View>
                        </Pressable>
                      ))}
                    </Animated.View>
                  )}

                  {/* Language search */}
                  <View style={s.searchWrap}>
                    <Ionicons name="search" size={18} color="rgba(255,255,255,0.45)" />
                    <TextInput
                      value={languageQuery}
                      onChangeText={setLanguageQuery}
                      placeholder="Search languages…"
                      placeholderTextColor="rgba(255,255,255,0.38)"
                      style={s.searchInput}
                      autoCapitalize="words"
                      returnKeyType="search"
                      selectionColor={CultureTokens.purple}
                      underlineColorAndroid="transparent"
                      accessibilityLabel="Search languages"
                    />
                    {languageQuery.length > 0 && (
                      <Pressable onPress={() => setLanguageQuery('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                      </Pressable>
                    )}
                  </View>

                  {languageQuery.trim().length < 2 && (
                    <Text style={s.helperText}>Popular languages shown · type to search all</Text>
                  )}

                  {/* Language grid */}
                  <View style={s.langGrid}>
                    {filteredLanguages.map((lang) => (
                      <Pressable
                        key={lang.id}
                        style={({ pressed }) => [
                          s.langCard,
                          {
                            backgroundColor: pressed ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
                            borderColor: pressed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
                          },
                        ]}
                        onPress={() => toggleLanguage(lang)}
                        accessibilityRole="button"
                        accessibilityLabel={lang.name}
                      >
                        <Text style={s.langName}>{lang.name}</Text>
                        {lang.nativeName && lang.nativeName !== lang.name && (
                          <Text style={s.langNative}>{lang.nativeName}</Text>
                        )}
                      </Pressable>
                    ))}
                    {filteredLanguages.length === 0 && languageQuery.trim().length >= 2 && (
                      <Text style={s.emptyText}>{`No languages match "${languageQuery}"`}</Text>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* ── Actions ── */}
              <View style={s.actions}>
                {step !== 'nationality' && (
                  <Pressable
                    onPress={goBack}
                    style={({ pressed }) => [
                      s.backBtn,
                      { backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)', borderColor: pressed ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.18)' },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                  >
                    <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
                    <Text style={s.backBtnText}>Back</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={goNext}
                  style={({ pressed }) => [
                    s.nextBtn,
                    { backgroundColor: pressed ? `${accent}CC` : accent, flex: step !== 'nationality' ? 1 : undefined, width: step === 'nationality' ? '100%' : undefined },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={step === 'language' ? 'Continue' : 'Next step'}
                >
                  <Text style={s.nextBtnText}>
                    {step === 'language' ? 'Continue' : 'Next'}
                  </Text>
                  {step !== 'language' && (
                    <Ionicons name="arrow-forward" size={18} color="#000000AA" />
                  )}
                </Pressable>
              </View>

              {/* Skip link */}
              <Animated.View entering={FadeInDown.delay(200).springify().damping(16)}>
                <Pressable
                  onPress={skipStep}
                  style={({ pressed }) => [s.skipLink, { opacity: pressed ? 0.5 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Skip this step"
                >
                  <Text style={s.skipLinkText}>Skip this step</Text>
                  <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.35)" />
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
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container:  { flex: 1 },
  flex:       { flex: 1 },

  // ── Mobile header ──
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Spacing.sm + 4,
    gap: 12,
  },
  mobileBackBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  mobileStepIndicator: { flex: 1, alignItems: 'flex-end', gap: 6 },
  mobileStepLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.chip,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mobileProgressTrack: { width: 80, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  mobileProgressFill:  { height: '100%', borderRadius: 2 },

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
  desktopBackText: { fontFamily: FontFamily.medium, fontSize: FontSize.body2, color: '#FFFFFF' },

  // ── Scroll ──
  scrollContent:        { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 60, justifyContent: 'center' },
  scrollContentDesktop: { paddingVertical: 60 },

  // ── Card ──
  card: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderRadius: 32,
    overflow: 'hidden',
  },
  cardDesktop: { maxWidth: 620 },
  cardSurface: {
    backgroundColor: 'rgba(14,14,26,0.93)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  accentBar: { height: 4, width: '100%' },
  cardContent: { padding: 28 },

  // ── Step progress ──
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 0,
  },
  stepperItem:  { alignItems: 'center', gap: 5 },
  stepperCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCircleInactive: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stepperNum: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
  stepperName: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.3,
  },
  stepperLine: {
    width: 44,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 18,
    marginHorizontal: 4,
  },

  // ── Step header ──
  headerBlock: { alignItems: 'center', marginBottom: 24 },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...TextStyles.display,
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 340,
  },

  // ── Search bar ──
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: CardTokens.radius,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    color: '#FFFFFF',
    padding: 0,
  },

  // ── Nationality grid ──
  natGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  natCard: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    position: 'relative',
  },
  natEmoji:  { fontSize: 24, lineHeight: 28 },
  natLabel:  { flex: 1, fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 17 },
  natCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Culture context badge ──
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  contextBadgeEmoji:       { fontSize: 22 },
  contextBadgeText:        { flex: 1 },
  contextBadgeEyebrow:     { fontFamily: FontFamily.medium, fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5, textTransform: 'uppercase' },
  contextBadgeName:        { fontFamily: FontFamily.bold, fontSize: FontSize.body2 },
  contextBadgeChange:      { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  contextBadgeChangeText:  { fontFamily: FontFamily.semibold, fontSize: 11 },

  // ── Selection count ──
  selectionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  selectionCountText: { fontFamily: FontFamily.semibold, fontSize: 12 },

  // ── Culture chips ──
  chipWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cultureChip:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  cultureEmoji: { fontSize: 20 },
  cultureLabel: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2, lineHeight: 18 },

  // ── Selected language pills ──
  selectedLangRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  selectedLangPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  selectedLangText: { fontFamily: FontFamily.semibold, fontSize: 13 },
  selectedLangX: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Helper text ──
  helperText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: 'rgba(255,255,255,0.40)',
    marginBottom: 12,
    marginTop: -4,
  },

  // ── Language grid ──
  langGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  langCard:  {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 100,
    gap: 2,
  },
  langName:   { fontFamily: FontFamily.semibold, fontSize: FontSize.body2, color: '#FFFFFF', lineHeight: 18 },
  langNative: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, color: 'rgba(255,255,255,0.48)', lineHeight: 16 },

  // ── Empty state ──
  emptyWrap: { width: '100%', alignItems: 'center', gap: 10, paddingVertical: 24 },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body2,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    paddingVertical: 8,
    width: '100%',
  },

  // ── Actions ──
  actions: { flexDirection: 'row', gap: 10, marginTop: 28 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 56,
    minWidth: 100,
  },
  backBtnText: { fontFamily: FontFamily.semibold, fontSize: FontSize.body2, color: '#FFFFFF' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    height: 56,
    minWidth: 120,
    ...shadows.medium,
  },
  nextBtnText: { fontFamily: FontFamily.bold, fontSize: FontSize.callout, color: '#1A1000' },

  // ── Skip link ──
  skipLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
    paddingVertical: Spacing.sm,
  },
  skipLinkText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.body2,
    color: 'rgba(255,255,255,0.35)',
  },
});

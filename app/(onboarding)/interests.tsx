import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  interestCategories,
  interestIcons,
  popularInterestsSydney,
  type InterestCategory,
} from '@/constants/onboardingInterests';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { sanitizeInternalRedirect } from '@/lib/routes';
import type { User } from '@/shared/schema';
import { Button } from '@/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens, gradients, shadows } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';


const MIN_REQUIRED = 5;

const INITIALLY_OPEN = new Set(['cultural', 'arts']);

const CATEGORY_EMOJI: Record<string, string> = {
  cultural: '🎭',
  arts:     '🎨',
  food:     '🍛',
  business: '💼',
  family:   '👨‍👩‍👧',
  civic:    '🏙️',
  wellness: '🧘',
  format:   '🎟️',
};

// ---------------------------------------------------------------------------
// InterestChip — reused for both popular and category grids
// ---------------------------------------------------------------------------
function InterestChip({
  interest, icon, isSelected, accentColor, onPress, colors, styles,
}: {
  interest: string;
  icon: string;
  isSelected: boolean;
  accentColor: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isSelected
          ? { backgroundColor: accentColor, borderColor: 'transparent' }
          : {
              backgroundColor: pressed ? `${colors.text}12` : `${colors.text}0A`,
              borderColor: `${colors.text}21`,
            },
        pressed && !isSelected && { transform: [{ scale: 0.97 }] },
      ]}
      accessibilityRole="checkbox"
      accessibilityLabel={interest}
      accessibilityState={{ checked: isSelected }}
    >
      <Ionicons
        name={icon as never}
        size={14}
        color={isSelected ? colors.background : accentColor}
      />
      <Text style={[styles.chipText, { color: isSelected ? colors.background : `${colors.text}CC` }]}>
        {interest}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark" size={11} color={`${colors.background}A6`} />
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function InterestsScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const searchParams = useLocalSearchParams();
  const redirectTo = sanitizeInternalRedirect(searchParams.redirectTo ?? searchParams.redirect);

  const { user } = useAuth();
  const { state, setInterests: setSelectedInterests, completeOnboarding } = useOnboarding();

  const [selected, setSelected] = useState<string[]>(state.interests || []);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(interestCategories.map(c => [c.id, INITIALLY_OPEN.has(c.id)]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryByInterest = useMemo(() => {
    const map = new Map<string, InterestCategory>();
    for (const cat of interestCategories) {
      for (const interest of cat.interests) map.set(interest, cat);
    }
    return map;
  }, []);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (interest: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleAll = (category: InterestCategory) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allSelected = category.interests.every(i => selectedSet.has(i));
    if (allSelected) {
      setSelected(prev => prev.filter(i => !category.interests.includes(i)));
    } else {
      setSelected(prev => [...new Set([...prev, ...category.interests])]);
    }
  };

  const toggleSection = (categoryId: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setExpanded(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleFinish = async () => {
    if (selected.length < MIN_REQUIRED) {
      Alert.alert('Select more interests', `Please select at least ${MIN_REQUIRED} interests to continue.`);
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelectedInterests(selected);

    if (user?.id) {
      const selectedCategoryIds = [...new Set(
        selected
          .map(interest => categoryByInterest.get(interest)?.id)
          .filter((id): id is string => Boolean(id)),
      )];
      const profilePayload: Partial<User> & {
        languages?: string[];
        ethnicityText?: string;
        communities?: string[];
        interestCategoryIds?: string[];
      } = {
        city: state.city || undefined,
        country: state.country || undefined,
        communities: state.communities,
        interests: selected,
        interestCategoryIds: selectedCategoryIds,
        languages: state.languages,
        ethnicityText: state.ethnicityText || undefined,
        // Cultural Identity Layer
        culturalIdentity: {
          nationalityId: state.nationalityId || undefined,
          cultureIds: state.cultureIds.length > 0 ? state.cultureIds : undefined,
          languageIds: state.languageIds.length > 0 ? state.languageIds : undefined,
          diasporaGroupIds: state.diasporaGroupIds.length > 0 ? state.diasporaGroupIds : undefined,
        },
      };
      try { await api.users.update(user.id, profilePayload); } catch { /* non-fatal */ }
    }

    try {
      await completeOnboarding();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(redirectTo ?? '/(tabs)');
    } catch (error) {
      if (__DEV__) console.warn('[onboarding] failed to complete onboarding:', error);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Could not finish onboarding', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReady = selected.length >= MIN_REQUIRED;
  const progressFill = Math.min(1, selected.length / MIN_REQUIRED);
  const remaining = MIN_REQUIRED - selected.length;

  return (
    <View style={s.root}>
      {/* Background */}
      <LinearGradient
        colors={gradients.culturepassBrand}
        style={StyleSheet.absoluteFillObject}
      />
      {Platform.OS === 'web' && (
        <>
          <View style={[s.orb, { top: -80, right: -60, backgroundColor: CultureTokens.indigo }] as never} />
          <View style={[s.orb, { bottom: 100, left: -80, backgroundColor: CultureTokens.gold, opacity: 0.25 }] as never} />
        </>
      )}
      {/* Header */}
      <View style={[s.header, { paddingTop: topInset + 14 }]}> 
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(onboarding)/communities')}
          style={s.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[s.stepLabel, { color: colors.textSecondary }]}>STEP 4 OF 4</Text>
        <View style={s.backBtn} />
      </View>

      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          s.scrollContent,
          isDesktop && s.scrollContentDesktop,
          { paddingBottom: bottomInset + 130 },
        ]}
      >
        <View style={isDesktop ? s.desktopCard : undefined}>

          {/* Title */}
          <View style={s.titleBlock}>
            <Text style={[s.title, { color: colors.text }]}>What interests{'\n'}you?</Text>
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              Pick at least {MIN_REQUIRED} to personalise your CulturePass feed
            </Text>
          </View>

          {/* Progress bar */}
          <View style={s.progressBlock}>
            <View style={[s.progressTrack, { backgroundColor: `${colors.textInverse}14` }]}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${progressFill * 100}%` as never,
                    backgroundColor: isReady ? CultureTokens.teal : CultureTokens.gold,
                  },
                ]}
              />
            </View>
            <Text style={[s.progressLabel, { color: isReady ? CultureTokens.teal : colors.textSecondary }]}>
              {isReady ? `${selected.length} selected ✓` : `${selected.length} / ${MIN_REQUIRED}`}
            </Text>
          </View>

          {/* Popular picks */}
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>⚡  Popular near you</Text>
            <View style={s.chipWrap}>
              {popularInterestsSydney.map(interest => {
                const cat = categoryByInterest.get(interest);
                const accent = cat?.accentColor ?? CultureTokens.gold;
                const icon = (interestIcons[interest] as string | undefined) ?? 'star';
                return (
                  <InterestChip
                    key={interest}
                    interest={interest}
                    icon={icon}
                    isSelected={selectedSet.has(interest)}
                    accentColor={accent}
                    onPress={() => toggle(interest)}
                    colors={colors}
                    styles={s}
                  />
                );
              })}
            </View>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Category accordions */}
          {interestCategories.map(category => {
            const isOpen = expanded[category.id] ?? false;
            const countInCat = category.interests.filter(i => selectedSet.has(i)).length;
            const allSelected = category.interests.every(i => selectedSet.has(i));
            const accent = category.accentColor;
            const emoji = CATEGORY_EMOJI[category.id] ?? '•';

            return (
              <View key={category.id} style={s.categoryBlock}>

                {/* Category header row */}
                {/* Category header row */}
                <View style={s.categoryHeader}>
                  <Pressable
                    style={({ pressed }) => [{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }, pressed && { opacity: 0.75 }]}
                    onPress={() => toggleSection(category.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${category.title}, ${countInCat} selected`}
                    accessibilityState={{ expanded: isOpen }}
                  >
                    {/* Icon + title */}
                    <View style={[s.categoryIconWrap, { backgroundColor: `${accent}2A` }]}>
                      <Text style={s.categoryEmoji}>{emoji}</Text>
                    </View>
                    <View style={s.categoryTitleBlock}>
                      <Text style={[s.categoryTitle, { color: colors.textInverse }]}>{category.title}</Text>
                      {countInCat > 0 && (
                        <Text style={[s.categoryCount, { color: accent }]}>
                          {countInCat} selected
                        </Text>
                      )}
                    </View>
                  </Pressable>

                  {/* Select All / Clear */}
                  {isOpen && (
                    <Pressable
                      onPress={e => { e.stopPropagation?.(); toggleAll(category); }}
                      style={[s.selectAllBtn, { backgroundColor: accent + '18', borderColor: accent + '35' }]}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={allSelected ? `Clear all ${category.title}` : `Select all ${category.title}`}
                    >
                      <Text style={[s.selectAllText, { color: accent }]}>
                        {allSelected ? 'Clear' : 'All'}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable onPress={() => toggleSection(category.id)} hitSlop={10} style={{ paddingLeft: 12 }}>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textTertiary}
                      />
                  </Pressable>
                </View>

                {/* Chips grid */}
                {isOpen && (
                  <View style={s.chipWrap}>
                    {category.interests.map(interest => {
                      const icon = (interestIcons[interest] as string | undefined) ?? 'star';
                      return (
                        <InterestChip
                          key={interest}
                          interest={interest}
                          icon={icon}
                          isSelected={selectedSet.has(interest)}
                          accentColor={accent}
                          onPress={() => toggle(interest)}
                          colors={colors}
                          styles={s}
                        />
                      );
                    })}
                  </View>
                )}

                <View style={[s.categoryDivider, { backgroundColor: `${colors.textInverse}0D` }]} />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <LinearGradient
        colors={['transparent', gradients.culturepassBrand[0]]}
        style={[s.bottomFade, { pointerEvents: 'none' }]}
      />
      <View style={[s.bottomBar, { paddingBottom: bottomInset + 16 }]}>
        {!isReady && (
          <Text style={[s.remainingText, { color: colors.textSecondary }]}>
            {remaining === 1
              ? '1 more interest to go'
              : `${remaining} more interests to go`}
          </Text>
        )}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={isReady ? 'sparkles' : undefined}
          disabled={!isReady || isSubmitting}
          onPress={handleFinish}
          style={[
            s.ctaBtn,
            isReady && { backgroundColor: CultureTokens.gold },
            shadows.large,
          ]}
        >
          {isSubmitting ? 'Starting…' : isReady ? 'Start Exploring' : `Select ${MIN_REQUIRED - selected.length} more`}
        </Button>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  root: { flex: 1 },

  orb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.35,
    ...Platform.select({
      web: { filter: 'blur(80px)' as never },
      default: {},
    }),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stepLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  scrollContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  // Desktop card wrapper
  desktopCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 32,
    marginTop: 8,
  },

  // Title
  titleBlock: {
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    color: colors.textInverse,
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Progress
  progressBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    minWidth: 90,
    textAlign: 'right',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },

  // Chip grid
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },

  // Chip
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },

  // Category accordion
  categoryBlock: {
    marginBottom: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryTitleBlock: {
    flex: 1,
    gap: 2,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.textInverse,
  },
  categoryCount: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  selectAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectAllText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  categoryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 10,
    marginBottom: 4,
    marginHorizontal: 4,
  },

  // Bottom bar
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    pointerEvents: 'none',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 8,
  },
  remainingText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  ctaBtn: {
    borderRadius: 18,
    height: 56,
  },
});

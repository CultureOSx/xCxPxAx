import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { LayoutRules, Spacing, gradients, TextStyles, CardTokens } from '@/constants/theme';
import { CardSurface } from '@/components/ui/CardSurface';
import { LocationPicker } from '@/components/LocationPicker';

export default function SettingsLocationScreen() {
  const colors = useColors();
  const styles = getStyles(colors);
  const insets = useSafeAreaInsets();
  const { state } = useOnboarding();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const currentLocation = state.city ? `${state.city}, ${state.country || 'Australia'}` : 'No location selected';

  return (
    <View style={[styles.container, { paddingTop: topInset, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={locAmbient.mesh}
        pointerEvents="none"
      />
      <View
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      >
        <View style={styles.headerShell}>
          <View style={styles.headerInner}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Location & City</Text>
              <Text style={[styles.headerSub, { color: colors.textTertiary }]}>
                Manage the city used for discovery, search, and nearby perks.
              </Text>
            </View>
            <View style={[styles.headerChip, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.headerChipText, { color: colors.textSecondary }]}>
                {state.city ? 'Set' : 'Unset'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.contentShell, { paddingBottom: 32 + bottomInset }]}>
        <CardSurface
          colors={colors}
          borderRadius={CardTokens.radius}
          style={styles.heroCard}
          contentStyle={styles.heroCardInner}
        >
          <View style={styles.locationSummaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
              <Ionicons name="navigate-circle-outline" size={22} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>Current location</Text>
              <Text style={[styles.current, { color: colors.text }]}>{currentLocation}</Text>
            </View>
          </View>
          <Text style={[styles.heroCopy, { color: colors.textSecondary }]}>
            Your location powers local discover rails, search results, community relevance, and nearby perks.
          </Text>
        </CardSurface>

        <CardSurface
          colors={colors}
          borderRadius={CardTokens.radius}
          style={styles.mainCard}
          contentStyle={styles.cardInner}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose your city</Text>
            <Text style={[styles.sectionSub, { color: colors.textTertiary }]}>
              Start with country, then region/state, then city.
            </Text>
          </View>

          <View style={[styles.tipPill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
            <Ionicons name="search-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.tipPillText, { color: colors.textSecondary }]}>
              Search is available on the country list
            </Text>
          </View>

          <View style={styles.pickerWrap}>
            <LocationPicker />
          </View>

          <View style={styles.helpBlock}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
            <Text style={[styles.help, { color: colors.textSecondary }]}>
              Pick your country first, then state or region and city. GPS auto-detect is available for Australia.
            </Text>
          </View>
        </CardSurface>

        <View style={styles.note}>
          <Ionicons name="compass-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.noteText, { color: colors.textTertiary }]}>
            Updating this setting changes which events, communities, and perks feel local across the app.
          </Text>
        </View>
      </View>
    </View>
  );
}

const locAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.07 },
});

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  headerShell: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LayoutRules.screenHorizontalPadding,
    paddingVertical: LayoutRules.iconTextGap,
  },
  backBtn: {
    width: LayoutRules.buttonHeight,
    height: LayoutRules.buttonHeight,
    borderRadius: LayoutRules.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 12,
  },
  headerTitle: {
    ...TextStyles.title3,
  },
  headerSub: {
    ...TextStyles.caption,
    marginTop: 2,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 12,
  },
  headerChipText: {
    ...TextStyles.badge,
  },
  contentShell: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: LayoutRules.screenHorizontalPadding,
    paddingTop: Spacing.sm,
  },
  heroCard: {
    marginTop: Spacing.xs,
  },
  heroCardInner: {
    padding: LayoutRules.cardPaddingMax,
    gap: 12,
  },
  locationSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroCopy: {
    ...TextStyles.bodyMedium,
    lineHeight: 22,
  },
  mainCard: {
    marginTop: Spacing.md,
  },
  cardInner: {
    padding: LayoutRules.cardPaddingMax,
    gap: 14,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    ...TextStyles.headline,
  },
  sectionSub: {
    ...TextStyles.caption,
    lineHeight: 18,
  },
  label: {
    ...TextStyles.captionSemibold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  current: {
    ...TextStyles.title3,
    fontSize: 20,
  },
  tipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tipPillText: {
    ...TextStyles.badge,
  },
  pickerWrap: {
    marginTop: 6,
  },
  helpBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: Spacing.sm,
  },
  help: {
    ...TextStyles.chip,
    flex: 1,
    lineHeight: 20,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 14,
  },
  noteText: {
    ...TextStyles.caption,
    flex: 1,
    lineHeight: 18,
  },
});

import { View, Text, Pressable, StyleSheet } from 'react-native';
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
  const webTop = 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTop, backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={locAmbient.mesh}
        pointerEvents="none"
      />
      <View
        style={{
          backgroundColor: colors.surface,
          borderBottomWidth: StyleSheet.hairlineWidth * 2,
          borderBottomColor: colors.borderLight,
        }}
      >
        <View style={styles.headerInner}>
          <Pressable style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Location & City</Text>
          <View style={{ width: LayoutRules.buttonHeight }} />
        </View>
      </View>

      <CardSurface
        colors={colors}
        borderRadius={CardTokens.radius}
        style={{ marginHorizontal: LayoutRules.screenHorizontalPadding, marginTop: Spacing.sm }}
        contentStyle={styles.cardInner}
      >
        <Text style={[styles.label, { color: colors.text }]}>Current location</Text>
        <Text style={[styles.current, { color: colors.textSecondary }]}>
          {state.city ? `${state.city}, ${state.country || 'Australia'}` : 'No location selected'}
        </Text>
        <Text style={[styles.pickerCue, { color: colors.textTertiary }]}>
          Open the picker → choose country first, then region and city. Search is available on the country list.
        </Text>

        <View style={styles.pickerWrap}>
          <LocationPicker />
        </View>

        <Text style={[styles.help, { color: colors.textSecondary }]}>
          Pick your country first, then state or region and city. This scopes search, discover, and nearby perks. GPS auto-detect
          is available for Australia.
        </Text>
      </CardSurface>
    </View>
  );
}

const locAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.07 },
});

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: { flex: 1 },
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
    backgroundColor: 'transparent',
  },
  headerTitle: {
    ...TextStyles.title3,
  },
  cardInner: {
    padding: LayoutRules.cardPaddingMax,
    gap: LayoutRules.iconTextGap,
  },
  label: {
    ...TextStyles.captionSemibold,
    fontSize: 13,
  },
  current: {
    ...TextStyles.bodyMedium,
  },
  pickerCue: {
    ...TextStyles.chip,
    lineHeight: 19,
  },
  pickerWrap: {
    marginTop: Spacing.sm,
  },
  help: {
    ...TextStyles.chip,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});

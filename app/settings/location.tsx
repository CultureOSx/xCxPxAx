import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { LayoutRules, Spacing, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
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
      <LiquidGlassPanel
        borderRadius={0}
        bordered={false}
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth * 2,
          borderBottomColor: colors.borderLight,
        }}
        contentStyle={styles.headerInner}
      >
        <Pressable style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Location & City</Text>
        <View style={{ width: LayoutRules.buttonHeight }} />
      </LiquidGlassPanel>

      <LiquidGlassPanel style={{ marginHorizontal: LayoutRules.screenHorizontalPadding, marginTop: Spacing.sm }} contentStyle={styles.cardInner}>
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
      </LiquidGlassPanel>
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
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  cardInner: {
    padding: LayoutRules.cardPaddingMax,
    gap: LayoutRules.iconTextGap,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  current: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  pickerCue: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins_400Regular',
  },
  pickerWrap: {
    marginTop: Spacing.sm,
  },
  help: {
    marginTop: Spacing.sm,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
});

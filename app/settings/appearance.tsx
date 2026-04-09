import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { goBackOrReplace } from '@/lib/navigation';
import { useAppAppearance, type AppearancePreference } from '@/hooks/useAppAppearance';

const OPTIONS: {
  key: AppearancePreference;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'system', title: 'System', subtitle: 'Automatically match your device theme', icon: 'phone-portrait-outline' },
  { key: 'dark', title: 'Dark', subtitle: 'Premium black-first look', icon: 'moon-outline' },
  { key: 'light', title: 'Light', subtitle: 'Bright surfaces with strong contrast', icon: 'sunny-outline' },
];

export default function AppearanceSettingsScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { preference, resolvedScheme, setPreference } = useAppAppearance();

  const onPick = async (next: AppearancePreference) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setPreference(next);
  };

  return (
    <View style={[s.container, { paddingTop: topInset }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={subAmbient.mesh}
        pointerEvents="none"
      />
      <LiquidGlassPanel
        borderRadius={0}
        bordered={false}
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth * 2,
          borderBottomColor: colors.borderLight,
        }}
        contentStyle={s.headerInner}
      >
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => goBackOrReplace('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Appearance</Text>
        <View style={{ width: 34 }} />
      </LiquidGlassPanel>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40 + (Platform.OS === 'web' ? 34 : insets.bottom),
          paddingTop: 16,
        }}
      >
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preview</Text>
          <LiquidGlassPanel borderRadius={20} contentStyle={{ padding: 14 }}>
            <View style={s.previewHeader}>
              <View style={[s.previewModeBadge, { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo + '55' }]}>
                <Ionicons
                  name={resolvedScheme === 'dark' ? 'moon' : 'sunny'}
                  size={12}
                  color={CultureTokens.indigo}
                />
                <Text style={s.previewModeText}>
                  Active: {resolvedScheme === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </View>
            </View>
            <View style={[s.previewCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
              <Text style={[s.previewTitle, { color: colors.text }]}>Sample Card</Text>
              <Text style={[s.previewSub, { color: colors.textSecondary }]}>
                This preview updates instantly when you change appearance.
              </Text>
              <View style={[s.previewChip, { backgroundColor: colors.primarySoft, borderColor: colors.borderLight }]}>
                <Text style={[s.previewChipText, { color: colors.text }]}>Primary Surface</Text>
              </View>
            </View>
          </LiquidGlassPanel>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Theme</Text>
          <LiquidGlassPanel borderRadius={20} contentStyle={{ padding: 0 }}>
            {OPTIONS.map((opt, i) => {
              const selected = preference === opt.key;
              return (
                <View key={opt.key}>
                  <Pressable
                    style={({ pressed }) => [
                      s.optionRow,
                      selected && { backgroundColor: CultureTokens.indigo + '14' },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => {
                      void onPick(opt.key);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${opt.title} appearance`}
                    accessibilityState={{ selected }}
                  >
                    <View style={[s.optionIcon, { backgroundColor: CultureTokens.indigo + '18' }]}>
                      <Ionicons name={opt.icon} size={18} color={CultureTokens.indigo} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.optionTitle}>{opt.title}</Text>
                      <Text style={s.optionSub}>{opt.subtitle}</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? CultureTokens.indigo : colors.textTertiary}
                    />
                  </Pressable>
                  {i < OPTIONS.length - 1 && <View style={s.divider} />}
                </View>
              );
            })}
          </LiquidGlassPanel>
        </View>

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
          <Text style={s.noteText}>
            Active appearance: <Text style={{ color: colors.text, fontFamily: 'Poppins_600SemiBold' }}>{resolvedScheme === 'dark' ? 'Dark' : 'Light'}</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const subAmbient = StyleSheet.create({
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.07 },
});

const getStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
    headerTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },

    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginLeft: 4, color: colors.textTertiary },

    optionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18, gap: 14 },
    optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    optionTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    optionSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 18, color: colors.textTertiary, width: '90%' },
    divider: { height: 1, marginLeft: 74, backgroundColor: colors.borderLight, opacity: 0.5 },

    note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 20, marginTop: 8 },
    noteText: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18, color: colors.textTertiary },
    previewHeader: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 },
    previewModeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    previewModeText: { fontSize: 11, fontFamily: 'Poppins_700Bold', color: CultureTokens.indigo },
    previewCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
    previewTitle: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
    previewSub: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
    previewChip: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginTop: 2,
    },
    previewChipText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  });

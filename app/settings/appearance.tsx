import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, TextStyles, CardTokens, FontFamily } from '@/constants/theme';
import { CardSurface } from '@/components/ui/CardSurface';
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
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const onPick = async (next: AppearancePreference) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setPreference(next);
  };

  const preferenceLabel = preference === 'system' ? 'System' : preference === 'dark' ? 'Dark' : 'Light';
  const resolvedLabel = resolvedScheme === 'dark' ? 'Dark' : 'Light';

  return (
    <View style={[s.container, { paddingTop: topInset }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={subAmbient.mesh}
        pointerEvents="none"
      />
      <View
        style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      >
        <View style={s.headerShell}>
          <View style={s.headerInner}>
          <Pressable
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => goBackOrReplace('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Appearance</Text>
            <Text style={s.headerSub}>Choose how CulturePass looks on this device.</Text>
          </View>
          <View style={[s.headerChip, { backgroundColor: CultureTokens.indigo + '12', borderColor: CultureTokens.indigo + '33' }]}>
            <Ionicons name={resolvedScheme === 'dark' ? 'moon' : 'sunny'} size={12} color={CultureTokens.indigo} />
            <Text style={s.headerChipText}>
              {preferenceLabel} · {resolvedLabel}
            </Text>
          </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40 + bottomInset,
          paddingTop: 16,
        }}
      >
        <View style={s.contentShell}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Preview</Text>
            <CardSurface colors={colors} borderRadius={CardTokens.radius} contentStyle={{ padding: 14 }}>
              <View style={s.previewHeader}>
                <View style={[s.previewModeBadge, { backgroundColor: CultureTokens.indigo + '18', borderColor: CultureTokens.indigo + '55' }]}>
                  <Ionicons
                    name={resolvedScheme === 'dark' ? 'moon' : 'sunny'}
                    size={12}
                    color={CultureTokens.indigo}
                  />
                  <Text style={s.previewModeText}>
                    Active: {resolvedLabel}
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
            </CardSurface>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Theme</Text>
            <CardSurface colors={colors} borderRadius={CardTokens.radius} contentStyle={{ padding: 0 }}>
              {OPTIONS.map((opt, i) => {
                const selected = preference === opt.key;
                const isActive = opt.key === 'system' ? true : opt.key === resolvedScheme;
                return (
                  <View key={opt.key}>
                    <Pressable
                      style={({ pressed }) => [
                        s.optionRow,
                        selected && { backgroundColor: CultureTokens.indigo + '14' },
                        pressed && { opacity: 0.85, transform: [{ scale: 0.997 }] },
                        Platform.OS === 'web' && { cursor: 'pointer' as any },
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
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        {isActive ? (
                          <View style={[s.activePill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight }]}>
                            <Text style={[s.activePillText, { color: colors.textSecondary }]}>Active</Text>
                          </View>
                        ) : null}
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={selected ? CultureTokens.indigo : colors.textTertiary}
                        />
                      </View>
                    </Pressable>
                    {i < OPTIONS.length - 1 && <View style={s.divider} />}
                  </View>
                );
              })}
            </CardSurface>
          </View>

          <View style={s.note}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
            <Text style={s.noteText}>
              Your current look is <Text style={{ color: colors.text, ...TextStyles.callout }}>{resolvedLabel}</Text>. If you pick System, CulturePass will follow your device theme.
            </Text>
          </View>
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
    header: {
      borderBottomWidth: StyleSheet.hairlineWidth * 2,
    },
    headerShell: {
      width: '100%',
      maxWidth: 920,
      alignSelf: 'center',
    },
    headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginRight: 12,
    },
    headerTitle: { ...TextStyles.title3, fontSize: 17, color: colors.text },
    headerSub: { ...TextStyles.caption, color: colors.textTertiary, marginTop: 2 },
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
    headerChipText: { ...TextStyles.badge, color: CultureTokens.indigo },

    contentShell: {
      width: '100%',
      maxWidth: 920,
      alignSelf: 'center',
    },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: { ...TextStyles.badge, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginLeft: 4, color: colors.textTertiary },

    optionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18, gap: 14 },
    optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    optionTitle: { ...TextStyles.headline, color: colors.text },
    optionSub: { ...TextStyles.chip, marginTop: 2, lineHeight: 18, color: colors.textTertiary, width: '90%' },
    divider: { height: 1, marginLeft: 74, backgroundColor: colors.borderLight, opacity: 0.5 },
    activePill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    activePillText: { ...TextStyles.badge },

    note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 20, marginTop: 8 },
    noteText: { ...TextStyles.caption, flex: 1, lineHeight: 18, color: colors.textTertiary },
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
    previewModeText: { ...TextStyles.badge, color: CultureTokens.indigo },
    previewCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
    previewTitle: { ...TextStyles.headline, fontFamily: FontFamily.bold },
    previewSub: { ...TextStyles.caption, lineHeight: 18 },
    previewChip: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginTop: 2,
    },
    previewChipText: { ...TextStyles.captionSemibold },
  });

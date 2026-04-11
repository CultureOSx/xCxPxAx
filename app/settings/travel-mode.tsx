import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients } from '@/constants/theme';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { goBackOrReplace } from '@/lib/navigation';
import { useAuth } from '@/lib/auth';
import {
  getLayoverPlannerPreferences,
  getTravelModeEnabled,
  saveLayoverPlannerPreferences,
  saveTravelModeEnabled,
  type LayoverPlannerPreferences,
} from '@/lib/storage';

const WINDOWS = [
  { id: '2_4', label: '2-4h' },
  { id: '4_8', label: '4-8h' },
  { id: '8_16', label: '8-16h' },
] as const;

const ANCHORS = [
  { id: 'city', label: 'City' },
  { id: 'airport', label: 'Airport' },
  { id: 'port', label: 'Port' },
] as const;

const ROUTES = [
  { id: 'fast', label: 'Fast' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'safe', label: 'Safe' },
] as const;

const DEFAULT_PREFS: LayoverPlannerPreferences = {
  layoverWindowId: '4_8',
  anchorId: 'city',
  routeProfileId: 'balanced',
  openNowOnly: false,
  quietOnly: false,
  crewFriendlyOnly: false,
};

export default function TravelModeSettingsScreen() {
  const colors = useColors();
  const s = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { userId } = useAuth();

  const [hydrated, setHydrated] = useState(false);
  const [travelModeEnabled, setTravelModeEnabled] = useState(false);
  const [prefs, setPrefs] = useState<LayoverPlannerPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [modeEnabled, savedPrefs] = await Promise.all([
        getTravelModeEnabled(userId),
        getLayoverPlannerPreferences(userId),
      ]);
      if (cancelled) return;
      setTravelModeEnabled(modeEnabled);
      if (savedPrefs) setPrefs(savedPrefs);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!hydrated) return;
    void saveTravelModeEnabled(travelModeEnabled, userId);
  }, [hydrated, travelModeEnabled, userId]);

  useEffect(() => {
    if (!hydrated) return;
    void saveLayoverPlannerPreferences(prefs, userId);
  }, [hydrated, prefs, userId]);

  const setWindow = (value: LayoverPlannerPreferences['layoverWindowId']) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPrefs((prev) => ({ ...prev, layoverWindowId: value }));
  };
  const setAnchor = (value: LayoverPlannerPreferences['anchorId']) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPrefs((prev) => ({ ...prev, anchorId: value }));
  };
  const setRoute = (value: LayoverPlannerPreferences['routeProfileId']) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPrefs((prev) => ({ ...prev, routeProfileId: value }));
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
        <Text style={s.headerTitle}>Travel Mode</Text>
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
          <Text style={s.sectionTitle}>Mode</Text>
          <LiquidGlassPanel borderRadius={20} contentStyle={{ padding: 0 }}>
            <View style={s.settingRow}>
              <View style={[s.settingIcon, { backgroundColor: CultureTokens.indigo + '18' }]}>
                <Ionicons name="airplane-outline" size={18} color={CultureTokens.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.settingLabel}>Dedicated Travel Mode</Text>
                <Text style={s.settingDesc}>Reorganize Discover for workers constantly on the move.</Text>
              </View>
              <Switch
                value={travelModeEnabled}
                onValueChange={(next) => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTravelModeEnabled(next);
                }}
                trackColor={{ false: colors.border, true: CultureTokens.indigo + '80' }}
                thumbColor={travelModeEnabled ? CultureTokens.indigo : colors.surface}
              />
            </View>
          </LiquidGlassPanel>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Layover Planner Defaults</Text>
          <LiquidGlassPanel borderRadius={20} contentStyle={s.groupWrap}>
            <Text style={s.groupLabel}>Window</Text>
            <View style={s.chipRow}>
              {WINDOWS.map((window) => (
                <Pressable
                  key={window.id}
                  onPress={() => setWindow(window.id)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: prefs.layoverWindowId === window.id ? colors.primarySoft : colors.surfaceSecondary,
                      borderColor: prefs.layoverWindowId === window.id ? colors.primary : colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[s.chipText, { color: prefs.layoverWindowId === window.id ? colors.primary : colors.textSecondary }]}>
                    {window.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.groupLabel}>Transit anchor</Text>
            <View style={s.chipRow}>
              {ANCHORS.map((anchor) => (
                <Pressable
                  key={anchor.id}
                  onPress={() => setAnchor(anchor.id)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: prefs.anchorId === anchor.id ? colors.primarySoft : colors.surfaceSecondary,
                      borderColor: prefs.anchorId === anchor.id ? colors.primary : colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[s.chipText, { color: prefs.anchorId === anchor.id ? colors.primary : colors.textSecondary }]}>
                    {anchor.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.groupLabel}>Route profile</Text>
            <View style={s.chipRow}>
              {ROUTES.map((route) => (
                <Pressable
                  key={route.id}
                  onPress={() => setRoute(route.id)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: prefs.routeProfileId === route.id ? colors.primarySoft : colors.surfaceSecondary,
                      borderColor: prefs.routeProfileId === route.id ? colors.primary : colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[s.chipText, { color: prefs.routeProfileId === route.id ? colors.primary : colors.textSecondary }]}>
                    {route.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </LiquidGlassPanel>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Filters</Text>
          <LiquidGlassPanel borderRadius={20} contentStyle={{ padding: 0 }}>
            {[
              { key: 'openNowOnly', title: 'Open now', icon: 'time-outline', color: CultureTokens.gold },
              { key: 'quietOnly', title: 'Quiet', icon: 'moon-outline', color: CultureTokens.teal },
              { key: 'crewFriendlyOnly', title: 'Crew-friendly', icon: 'shield-checkmark-outline', color: CultureTokens.indigo },
            ].map((item, index) => (
              <View key={item.key}>
                <View style={s.settingRow}>
                  <View style={[s.settingIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={item.color} />
                  </View>
                  <Text style={s.settingLabel}>{item.title}</Text>
                  <View style={{ flex: 1 }} />
                  <Switch
                    value={prefs[item.key as keyof LayoverPlannerPreferences] as boolean}
                    onValueChange={(next) => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setPrefs((prev) => ({ ...prev, [item.key]: next }));
                    }}
                    trackColor={{ false: colors.border, true: CultureTokens.indigo + '80' }}
                    thumbColor={(prefs[item.key as keyof LayoverPlannerPreferences] as boolean) ? CultureTokens.indigo : colors.surface}
                  />
                </View>
                {index < 2 ? <View style={s.divider} /> : null}
              </View>
            ))}
          </LiquidGlassPanel>
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
    headerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    headerTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Poppins_600SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 10,
      marginLeft: 4,
      color: colors.textTertiary,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 14,
    },
    settingIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingLabel: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
    settingDesc: {
      fontSize: 13,
      fontFamily: 'Poppins_400Regular',
      marginTop: 2,
      lineHeight: 18,
      color: colors.textTertiary,
      width: '90%',
    },
    divider: { height: 1, marginLeft: 74, backgroundColor: colors.borderLight, opacity: 0.5 },
    groupWrap: { padding: 12, gap: 10 },
    groupLabel: {
      fontSize: 12,
      fontFamily: 'Poppins_600SemiBold',
      color: colors.textSecondary,
      marginTop: 2,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      minHeight: 34,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipText: { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  });


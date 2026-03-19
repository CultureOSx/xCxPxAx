import { View, Text, Pressable, StyleSheet, ScrollView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';
import { goBackOrReplace } from '@/lib/navigation';

const NOTIFICATION_SETTINGS = [
  { key: 'eventReminders',   title: 'Event Reminders',    description: "Upcoming events you're interested in or have tickets for",          icon: 'calendar-outline' as const, color: CultureTokens.saffron },
  { key: 'communityUpdates', title: 'Community Updates',  description: 'New posts, events, and announcements from your communities',        icon: 'people-outline'   as const, color: CultureTokens.teal },
  { key: 'perkAlerts',       title: 'Perk Alerts',        description: 'New perks, discounts, and exclusive offers',                        icon: 'gift-outline'     as const, color: CultureTokens.gold },
  { key: 'marketingEmails',  title: 'Marketing Emails',   description: 'Newsletters, promotions, and personalised recommendations by email', icon: 'mail-outline'     as const, color: CultureTokens.coral },
];

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const s = getStyles(colors);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const [settings, setSettings] = useState<Record<string, boolean>>({
    eventReminders:   true,
    communityUpdates: true,
    perkAlerts:       true,
    marketingEmails:  false,
  });

  const toggle = (key: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={[s.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => goBackOrReplace('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + (Platform.OS === 'web' ? 34 : insets.bottom), paddingTop: 16 }}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>
          <View style={s.sectionCard}>
            {NOTIFICATION_SETTINGS.map((item, i) => (
              <View key={item.key}>
                <View style={s.settingRow}>
                  <View style={[s.settingIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.settingLabel}>{item.title}</Text>
                    <Text style={s.settingDesc}>{item.description}</Text>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: colors.border, true: CultureTokens.indigo + '80' }}
                    thumbColor={settings[item.key] ? CultureTokens.indigo : colors.surface}
                  />
                </View>
                {i < NOTIFICATION_SETTINGS.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
          <Text style={s.noteText}>
            Critical account and security notifications are always sent regardless of these preferences.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn:      { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  headerTitle:  { fontSize: 17, fontFamily: 'Poppins_700Bold', color: colors.text },

  section:      { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginLeft: 2, color: colors.textTertiary },
  sectionCard:  { borderRadius: 12, borderWidth: 1, overflow: 'hidden', backgroundColor: colors.surface, borderColor: colors.borderLight },
  settingRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  settingIcon:  { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: colors.text },
  settingDesc:  { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2, lineHeight: 16, color: colors.textTertiary },
  divider:      { height: 1, marginLeft: 62, backgroundColor: colors.borderLight },

  note:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 18, marginTop: 4 },
  noteText:     { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18, color: colors.textTertiary },
});

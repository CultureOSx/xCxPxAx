/**
 * Calendar Sync Settings
 * ----------------------
 * Lets users connect their device calendar (Apple / Google / Outlook)
 * to CulturePass so that:
 *   1. Their personal events appear as subtle "busy" blocks on the CulturePass calendar.
 *   2. CulturePass events (tickets) can be auto-exported to their device calendar.
 *   3. They can export individual or all events to any calendar app they use.
 */

import { useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Switch, Platform, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens, LayoutRules, Spacing } from '@/constants/theme';
import { BackButton } from '@/components/ui/BackButton';
import { TextStyles } from '@/constants/typography';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { useAuth } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CalendarProvider {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
  available: boolean;
  /** If present, tapping "Connect" opens this URL instead of native flow */
  linkUrl?: string;
}

const CALENDAR_PROVIDERS: CalendarProvider[] = [
  {
    id: 'device',
    label: Platform.OS === 'ios' ? 'Apple Calendar' : 'Device Calendar',
    icon: Platform.OS === 'ios' ? 'logo-apple' : 'calendar-outline',
    color: '#1C1C1E',
    description:
      Platform.OS === 'ios'
        ? 'iCloud Calendar, local calendars, and subscribed calendars on this iPhone'
        : 'Google Calendar, Exchange, and other calendars synced to this device',
    available: Platform.OS !== 'web',
  },
  {
    id: 'google',
    label: 'Google Calendar',
    icon: 'logo-google',
    color: '#4285F4',
    description: 'Open Google Calendar in your browser to import or subscribe',
    available: true,
    linkUrl: 'https://calendar.google.com',
  },
  {
    id: 'outlook',
    label: 'Outlook / Office 365',
    icon: 'mail-outline',
    color: '#0078D4',
    description: 'Import an ICS file into Outlook or subscribe via link',
    available: true,
    linkUrl: 'https://outlook.live.com/calendar',
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CalendarSyncScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { user } = useAuth();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const {
    prefs,
    isLoading,
    isSyncing,
    permissionGranted,
    connectDeviceCalendar,
    disconnectDeviceCalendar,
    setShowPersonalEvents,
    setAutoAddTickets,
  } = useCalendarSync();

  const s = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDeviceToggle = useCallback(async () => {
    haptic();
    if (prefs.deviceConnected) {
      Alert.alert(
        'Disconnect Calendar',
        'Your personal events will no longer appear on the CulturePass calendar.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: () => disconnectDeviceCalendar() },
        ],
      );
    } else {
      await connectDeviceCalendar();
    }
  }, [prefs.deviceConnected, connectDeviceCalendar, disconnectDeviceCalendar, haptic]);

  const handleProviderLink = useCallback((url: string, label: string) => {
    haptic();
    Alert.alert(
      `Open ${label}`,
      `You'll be taken to ${label} where you can subscribe to your CulturePass calendar or import events.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open', onPress: () => Linking.openURL(url) },
      ],
    );
  }, [haptic]);

  if (isLoading) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={CultureTokens.indigo} />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={s.header}>
        <BackButton fallback="/settings" style={s.backBtn} />
        <Text style={[TextStyles.headline, s.headerTitle]}>Calendar Sync</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
          paddingTop: 8,
        }}
      >
        {/* Hero banner */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient
            colors={
              isDark
                ? ['#0a1628', CultureTokens.indigo + '22']
                : [CultureTokens.indigo + '10', CultureTokens.teal + '10']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroBanner}
          >
            <View style={[s.heroIconWrap, { backgroundColor: CultureTokens.indigo + '20' }]}>
              <Ionicons name="calendar" size={36} color={CultureTokens.indigo} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.heroTitle, { color: colors.text }]}>
                {user?.displayName ? `${user.displayName.split(' ')[0]}'s Calendar` : 'Your Calendar'}
              </Text>
              <Text style={[s.heroSub, { color: colors.textSecondary }]}>
                Connect your calendars to see personal events alongside CulturePass events — no conflicts, full context.
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Connect Calendars */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={s.section}>
          <SectionTitle label="Connect Calendars" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            {CALENDAR_PROVIDERS.map((provider, idx) => {
              const isDevice = provider.id === 'device';
              const isConnected = isDevice ? prefs.deviceConnected : false;
              const isLast = idx === CALENDAR_PROVIDERS.length - 1;

              return (
                <View key={provider.id}>
                  <View style={s.providerRow}>
                    {/* Icon */}
                    <View style={[s.providerIcon, { backgroundColor: provider.color + '18' }]}>
                      <Ionicons name={provider.icon} size={22} color={provider.color} />
                    </View>

                    {/* Labels */}
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[s.providerLabel, { color: colors.text }]}>{provider.label}</Text>
                      <Text style={[s.providerDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {provider.description}
                      </Text>
                      {isConnected && (
                        <View style={s.connectedBadge}>
                          <Ionicons name="checkmark-circle" size={12} color={CultureTokens.teal} />
                          <Text style={[s.connectedText, { color: CultureTokens.teal }]}>Connected</Text>
                        </View>
                      )}
                    </View>

                    {/* Action */}
                    {isDevice ? (
                      provider.available ? (
                        <Switch
                          value={prefs.deviceConnected}
                          onValueChange={handleDeviceToggle}
                          trackColor={{ false: colors.borderLight, true: CultureTokens.indigo + '80' }}
                          thumbColor={prefs.deviceConnected ? CultureTokens.indigo : colors.textTertiary}
                          accessibilityLabel={`${provider.label} ${prefs.deviceConnected ? 'connected' : 'disconnected'}`}
                        />
                      ) : (
                        <Text style={[s.unavailableText, { color: colors.textTertiary }]}>Web only via ICS</Text>
                      )
                    ) : (
                      <Pressable
                        onPress={() => provider.linkUrl && handleProviderLink(provider.linkUrl, provider.label)}
                        style={({ pressed }) => [
                          s.linkBtn,
                          { borderColor: provider.color + '40', backgroundColor: provider.color + '10' },
                          pressed && { opacity: 0.7 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${provider.label}`}
                      >
                        <Ionicons name="open-outline" size={14} color={provider.color} />
                        <Text style={[s.linkBtnText, { color: provider.color }]}>Open</Text>
                      </Pressable>
                    )}
                  </View>
                  {!isLast && <View style={[s.divider, { backgroundColor: colors.borderLight }]} />}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Preferences (only shown when device calendar connected) */}
        {prefs.deviceConnected && (
          <Animated.View entering={FadeInDown.delay(140).duration(500)} style={s.section}>
            <SectionTitle label="Calendar Preferences" colors={colors} />
            <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <PreferenceRow
                icon="eye-outline"
                iconColor={CultureTokens.indigo}
                label="Show Personal Events"
                description="Display your personal events as busy blocks on the CulturePass calendar — event titles are private"
                value={prefs.showPersonalEvents}
                onToggle={(v) => { haptic(); setShowPersonalEvents(v); }}
                colors={colors}
              />
              <View style={[s.divider, { backgroundColor: colors.borderLight }]} />
              <PreferenceRow
                icon="add-circle-outline"
                iconColor={CultureTokens.teal}
                label="Auto-add Tickets to Calendar"
                description="Automatically add events when you purchase a ticket"
                value={prefs.autoAddTickets}
                onToggle={(v) => { haptic(); setAutoAddTickets(v); }}
                colors={colors}
              />
            </View>
          </Animated.View>
        )}

        {/* Export Options */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={s.section}>
          <SectionTitle label="Export & Share" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <ExportRow
              icon="download-outline"
              iconColor={CultureTokens.coral}
              label="Export My Events (.ics)"
              description="Download all your upcoming CulturePass events as a calendar file"
              onPress={() => {
                haptic();
                Alert.alert(
                  'Export Calendar',
                  'This will generate an ICS file with all your tickets and saved events.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Export',
                      onPress: async () => {
                        try {
                          // Optionally show a loading indicator here if needed
                          await exportAllTickets();
                        } catch (err) {
                          Alert.alert('Export Failed', 'Could not export your tickets. Please try again.');
                        }
                      }
                    },
                  ],
                );
              }}
              colors={colors}
            />
            <View style={[s.divider, { backgroundColor: colors.borderLight }]} />
            <ExportRow
              icon="share-outline"
              iconColor={CultureTokens.indigo}
              label="Share CulturePass Calendar"
              description="Share a link to your CulturePass events calendar with friends"
              onPress={() => {
                haptic();
                Alert.alert('Coming Soon', 'Calendar sharing will be available in an upcoming update.');
              }}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* How it works */}
        <Animated.View entering={FadeInDown.delay(260).duration(500)} style={s.section}>
          <SectionTitle label="How It Works" colors={colors} />
          <View style={[s.card, s.howItWorksCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            {HOW_IT_WORKS.map((item, idx) => (
              <View key={idx} style={s.howRow}>
                <View style={[s.howNumBadge, { backgroundColor: CultureTokens.indigo + '15' }]}>
                  <Text style={[s.howNum, { color: CultureTokens.indigo }]}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.howTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[s.howDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Privacy note */}
        <View style={s.privacyNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={CultureTokens.teal} />
          <Text style={[s.privacyText, { color: colors.textTertiary }]}>
            CulturePass never reads the titles or details of your personal calendar events. Personal events appear only as anonymous "busy" blocks.
          </Text>
        </View>
      </ScrollView>

      {/* Loading overlay when syncing */}
      {isSyncing && (
        <View style={s.syncOverlay}>
          <View style={[s.syncCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="small" color={CultureTokens.indigo} />
            <Text style={[s.syncText, { color: colors.text }]}>Syncing to Calendar…</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginLeft: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: CultureTokens.indigo }} />
      <Text style={{ fontSize: 13, fontFamily: 'Poppins_700Bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {label}
      </Text>
    </View>
  );
}

function PreferenceRow({
  icon, iconColor, label, description, value, onToggle, colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const isDark = useIsDark();
  return (
    <View style={prefStyles.row}>
      <View style={[prefStyles.icon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[prefStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[prefStyles.desc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.borderLight, true: iconColor + '80' }}
        thumbColor={value ? iconColor : colors.textTertiary}
      />
    </View>
  );
}

function ExportRow({
  icon, iconColor, label, description, onPress, colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  description: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        prefStyles.row,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[prefStyles.icon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[prefStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[prefStyles.desc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const prefStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  desc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 17,
  },
});

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const HOW_IT_WORKS = [
  {
    title: 'Connect your calendar',
    desc: 'Tap the toggle next to your preferred calendar app to grant access.',
  },
  {
    title: 'See all events in one place',
    desc: 'Your personal events appear as quiet "busy" blocks on the CulturePass calendar — no details shared.',
  },
  {
    title: 'Never double-book',
    desc: 'CulturePass highlights potential conflicts before you buy a ticket.',
  },
  {
    title: 'Auto-save your tickets',
    desc: 'Turn on "Auto-add Tickets" to instantly save purchased events to your calendar.',
  },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function getStyles(colors: ReturnType<typeof useColors>, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: LayoutRules.screenHorizontalPadding,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
    },

    heroBanner: {
      marginHorizontal: LayoutRules.screenHorizontalPadding,
      marginBottom: 28,
      marginTop: 16,
      borderRadius: 20,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
      borderWidth: 1,
      borderColor: CultureTokens.indigo + '20',
    },
    heroIconWrap: {
      width: 60,
      height: 60,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitle: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 18,
      letterSpacing: -0.3,
    },
    heroSub: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 13,
      lineHeight: 19,
    },

    section: {
      paddingHorizontal: LayoutRules.screenHorizontalPadding,
      marginBottom: 28,
    },

    card: {
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
      ...Platform.select({
        web: { boxShadow: '0px 4px 20px rgba(0,0,0,0.06)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 2,
        },
      }),
    },

    providerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      gap: 14,
    },
    providerIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    providerLabel: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 15,
    },
    providerDesc: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 12,
      lineHeight: 17,
    },
    connectedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    connectedText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 11,
    },
    linkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
    },
    linkBtnText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 12,
    },
    unavailableText: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 11,
      textAlign: 'right',
      maxWidth: 80,
    },

    divider: {
      height: 1,
      marginLeft: 82,
      opacity: 0.5,
    },

    howItWorksCard: {
      padding: 4,
    },
    howRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    howNumBadge: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    howNum: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 13,
    },
    howTitle: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 14,
    },
    howDesc: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 12,
      lineHeight: 17,
    },

    privacyNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginHorizontal: LayoutRules.screenHorizontalPadding,
      marginBottom: 32,
      padding: 14,
      borderRadius: 12,
      backgroundColor: CultureTokens.teal + '0A',
      borderWidth: 1,
      borderColor: CultureTokens.teal + '25',
    },
    privacyText: {
      flex: 1,
      fontFamily: 'Poppins_400Regular',
      fontSize: 12,
      lineHeight: 17,
    },

    syncOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    syncCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 16,
    },
    syncText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 14,
    },
  });
}

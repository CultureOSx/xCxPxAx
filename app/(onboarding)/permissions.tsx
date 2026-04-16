import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Button } from '@/components/ui/Button';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OlympicsColors } from '@/constants/theme';

const PERMISSIONS = [
  {
    id: 'location' as const,
    icon: 'location-outline' as const,
    title: 'Location',
    description: 'Discover events and communities near you. Uses LGA/council for proximity (metadata only — no continuous tracking).',
    action: async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    },
  },
  {
    id: 'notifications' as const,
    icon: 'notifications-outline' as const,
    title: 'Notifications',
    description: 'Receive updates on events, tickets, cultural news, and community activity (opt-out anytime).',
    action: async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    },
  },
  {
    id: 'contacts' as const,
    icon: 'people-outline' as const,
    title: 'Contacts',
    description: 'Optional — find friends already in the community (privacy-first, one-time scan).',
    action: async () => {
      // expo-contacts not in dependencies; placeholder for now (grant by default or implement if added)
      return true;
    },
  },
];

export default function PermissionsScreen() {
  const colors = useColors();
  const { setPermission } = useOnboarding();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();

  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const handlePermission = useCallback(async (p: typeof PERMISSIONS[0]) => {
    if (Platform.OS !== 'web') Haptics.impactAsync();
    setLoading(p.id);
    try {
      const success = await p.action();
      setGranted((prev) => ({ ...prev, [p.id]: success }));
      setPermission(p.id, success);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }, [setPermission]);

  const allGranted = PERMISSIONS.every((p) => granted[p.id] !== false); // allow partial

  const handleNext = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync();
    router.push('/(onboarding)/interests');
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LiquidGlassPanel style={styles.headerCard}>
          <Text style={[styles.title, { color: colors.text }]}>Permissions</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Optional permissions to personalize your experience. All privacy-first and revocable in settings.
          </Text>
        </LiquidGlassPanel>

        {PERMISSIONS.map((p) => {
          const isGranted = granted[p.id] === true;
          const isLoading = loading === p.id;
          return (
            <LiquidGlassPanel key={p.id} style={styles.permissionCard} bordered>
              <View style={styles.iconContainer}>
                <Ionicons name={p.icon} size={32} color={isGranted ? OlympicsColors.green : colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.permissionTitle, { color: colors.text }]}>{p.title}</Text>
                <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>{p.description}</Text>
              </View>
              <Button
                variant={isGranted ? 'secondary' : 'primary'}
                size="sm"
                onPress={() => handlePermission(p)}
                loading={isLoading}
                style={{ minWidth: 100 }}
                haptic
              >
                {isGranted ? 'Granted ✓' : 'Allow'}
              </Button>
            </LiquidGlassPanel>
          );
        })}
      </ScrollView>

      <Button
        variant="primary"
        onPress={handleNext}
        fullWidth
        style={styles.nextButton}
        haptic
        disabled={!allGranted}
      >
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 100, gap: 16 },
  headerCard: { padding: 24, gap: 8, marginBottom: 8 },
  title: { fontSize: 28, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  permissionCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  permissionTitle: { fontSize: 17, fontFamily: 'Poppins_600SemiBold' },
  permissionDesc: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  nextButton: { position: 'absolute', bottom: 20, left: 20, right: 20, borderRadius: 16 },
});

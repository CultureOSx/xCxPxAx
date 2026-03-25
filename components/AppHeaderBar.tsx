/**
 * AppHeaderBar — consistent gradient top bar across iOS, Android, Web.
 * Use on payment, tickets, profile, and other secondary screens.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { gradients } from '@/constants/theme';
import { goBackOrReplace } from '@/lib/navigation';

const isWeb = Platform.OS === 'web';

export interface AppHeaderBarProps {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Back fallback route when no history */
  backFallback?: string;
  /** Right action: icon + onPress */
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label?: string };
  /** Top padding for safe area (0 on web) */
  topInset?: number;
}

export function AppHeaderBar({
  title,
  subtitle,
  backFallback = '/(tabs)',
  rightAction,
  topInset = isWeb ? 0 : 10,
}: AppHeaderBarProps) {
  const handleBack = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goBackOrReplace(backFallback);
  };

  const handleRight = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rightAction?.onPress();
  };

  return (
    <LinearGradient
      colors={gradients.culturepassBrand as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { paddingTop: topInset ?? 10 }]}
    >
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {rightAction ? (
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
            onPress={handleRight}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={rightAction.label ?? 'Action'}
          >
            <Ionicons name={rightAction.icon} size={20} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.btnPlaceholder} />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  btnPlaceholder: { width: 36, height: 36 },
  center: { alignItems: 'center', gap: 2 },
  title: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#fff', letterSpacing: 0.2 },
  subtitle: { fontSize: 10, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.85)' },
});

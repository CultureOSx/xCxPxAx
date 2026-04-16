import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';

export default function SocialCallbackScreen() {
  const colors = useColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LiquidGlassPanel style={styles.card}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.text }]}>Completing sign in with social provider...</Text>
        <Text style={[styles.subtext, { color: colors.textSecondary }]}>This should only take a moment.</Text>
      </LiquidGlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { padding: 40, alignItems: 'center', gap: 16, maxWidth: 320 },
  text: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  subtext: { fontSize: 13, textAlign: 'center' },
});

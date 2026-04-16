import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';
import { OlympicsColors } from '@/constants/theme';

export default function VerifyOtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync();
    setLoading(true);
    // Firebase auth.verify or mock for now
    setTimeout(() => {
      router.replace('/(tabs)');
      setLoading(false);
    }, 1500);
  }, []);

  const handleResend = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync();
    // resend OTP logic
    alert('OTP resent (mock)');
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <LiquidGlassPanel style={styles.card}>
        <Text style={[styles.title, { color: colors.text }]}>Verify your code</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter the 6-digit code sent to your email or phone.</Text>

        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          value={otp}
          onChangeText={setOtp}
          placeholder="123456"
          keyboardType="numeric"
          maxLength={6}
          autoFocus
        />

        <Button variant="primary" onPress={handleVerify} loading={loading} fullWidth haptic>
          Verify
        </Button>

        <Button variant="ghost" onPress={handleResend} fullWidth style={{ marginTop: 8 }} haptic>
          Resend code
        </Button>

        <Button variant="outline" onPress={() => router.back()} fullWidth style={{ marginTop: 8 }}>
          Back
        </Button>
      </LiquidGlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { padding: 32, gap: 24, alignItems: 'center' },
  title: { fontSize: 24, fontFamily: 'Poppins_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  input: { height: 56, width: '100%', borderRadius: 12, borderWidth: 2, paddingHorizontal: 20, fontSize: 24, textAlign: 'center', letterSpacing: 8, fontFamily: 'Poppins_600SemiBold' },
});

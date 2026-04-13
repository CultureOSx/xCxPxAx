// @ts-nocheck
import { Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';

import {
  CultureTokens,
  gradients,
  LiquidGlassTokens,
} from '@/constants/theme';

import { LiquidGlassPanel } from '@/components/onboarding/LiquidGlassPanel';

export default function OnboardingLayout() {
  const colors = useColors();
  const { state, isLoading } = useOnboarding();
  const { userId } = useAuth();

  // Show loading state while onboarding context is initializing
  if (isLoading) {
    return (
      <View style={styles.loadRoot} accessibilityLabel="Loading onboarding">
        {/* Background Gradients */}
        <LinearGradient
          colors={[CultureTokens.indigo, colors.backgroundSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}
        />

        {/* Liquid Glass Loading Indicator */}
        <LiquidGlassPanel
          borderRadius={LiquidGlassTokens.corner.innerRow + 6}
          style={styles.loadGlass}
          contentStyle={styles.loadGlassInner}
        >
          <ActivityIndicator
            size="large"
            color={CultureTokens.gold}
            accessibilityLabel="Loading"
          />
        </LiquidGlassPanel>
      </View>
    );
  }

  // If user is fully onboarded → redirect to main app
  if (userId && state.isComplete) {
    return <Redirect href="/(tabs)" />;
  }

  // Onboarding flow stack
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
        // Optional: smooth gesture navigation
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="location" />
      <Stack.Screen name="communities" />
      <Stack.Screen name="culture-match" />
      <Stack.Screen name="interests" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Let gradients handle background
  },

  loadGlass: {
    padding: 0,
    minWidth: 120,
    minHeight: 120,
    // Optional: subtle shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      default: {},
    }),
  },

  loadGlassInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 32,
  },
});
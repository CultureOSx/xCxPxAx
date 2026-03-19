import { Stack, Redirect } from "expo-router";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { ActivityIndicator, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/lib/auth";

export default function OnboardingLayout() {
  const colors = useColors();
  const { state, isLoading } = useOnboarding();
  const { userId } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.textInverse} />
      </View>
    );
  }

  // Only authenticated users should be bounced out of onboarding.
  // Guests still need access to login/signup even if local onboarding state was completed earlier.
  if (userId && state.isComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
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

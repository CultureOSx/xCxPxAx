import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function AuthLayout() {
  const colors = useColors();
  const { userId, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loadRoot, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (userId) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="social-callback" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

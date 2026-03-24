import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import CultureImage from './CultureImage';
import { useColors } from '@/hooks/useColors';

export function HeaderAvatar() {
  const router = useRouter();
  const colors = useColors();
  const { userId } = useAuth();

  // Fetch user profile minimally for the avatar
  const { data: profile } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => {
      if (!userId) return null;
      return api.users?.get(userId);
    },
    enabled: !!userId,
    // Very long cache since avatars don't change constantly
    staleTime: 1000 * 60 * 60,
  });

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/profile');
  }, [router]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Go to Profile"
    >
      {(profile as any)?.photoURL ? (
        <CultureImage
          uri={(profile as any).photoURL}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.avatar, styles.fallbackRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="person" size={18} color={colors.textTertiary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 0,
    marginRight: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  fallbackRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * +handle resolver — catches paths like /jiobaba or /+jiobaba
 * Looks up the handle against users then profiles, then redirects.
 */
// @ts-nocheck

import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

export default function HandleResolverScreen() {
  const colors = useColors();
  const { handle: rawHandle } = useLocalSearchParams<{ handle: string }>();

  // Strip leading '+' if someone types it directly in the URL
  const handle = typeof rawHandle === 'string' ? rawHandle.replace(/^\+/, '') : '';

  useEffect(() => {
    if (!handle) {
      router.replace('/(tabs)');
      return;
    }

    let cancelled = false;

    async function resolve() {
      try {
        // Try user first
        const user = await api.users.getByHandle(handle).catch(() => null);
        if (!cancelled && user?.id) {
          router.replace({ pathname: '/user/[id]', params: { id: user.id } });
          return;
        }

        // Try profile (business / community / venue)
        const profileResult = await api.profiles.list({ search: handle, pageSize: 1 }).catch(() => null);
        const profile = (profileResult as any)?.profiles?.[0] ?? (Array.isArray(profileResult) ? profileResult[0] : null);
        if (!cancelled && profile?.id) {
          router.replace({ pathname: '/profile/[id]', params: { id: profile.id } });
          return;
        }

        // Not found — go home
        if (!cancelled) router.replace('/(tabs)');
      } catch {
        if (!cancelled) router.replace('/(tabs)');
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [handle]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>+{handle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 16, fontFamily: 'Poppins_500Medium' },
});

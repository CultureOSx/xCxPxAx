// app/dashboard/backstage/[id].tsx — organiser backstage (launch: no simulated stream or chat)
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { gradients, TextStyles } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { useColors } from '@/hooks/useColors';

export default function ArtistBackstagePortal() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { title } = useLocalSearchParams<{ id?: string; title?: string }>();
  const heading = typeof title === 'string' && title.trim() ? title.trim() : 'Backstage';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[...gradients.midnight]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.safe, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon="chevron-back"
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          accessibilityLabel="Go back"
        >
          Back
        </Button>

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>{heading}</Text>
          <Text style={[styles.copy, { color: colors.textSecondary }]}>
            Live stream and audience chat will appear here when your organiser runs a backstage session. There is nothing
            to preview until that experience is enabled for a real event.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 16, maxWidth: 520 },
  title: { ...TextStyles.title, fontSize: 28 },
  copy: { ...TextStyles.body, lineHeight: 24 },
});

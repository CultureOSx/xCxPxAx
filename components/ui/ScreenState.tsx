import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { ButtonTokens, CardTokens, CultureTokens, Spacing, TextStyles } from '@/constants/theme';

type Tone = 'default' | 'error' | 'success';

function toneColor(tone: Tone): string {
  if (tone === 'error') return CultureTokens.coral;
  if (tone === 'success') return CultureTokens.teal;
  return CultureTokens.indigo;
}

export function ScreenStateLoading({
  label = 'Loading...',
}: {
  label?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={CultureTokens.indigo} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function ScreenStateCard({
  icon = 'information-circle-outline',
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
  tone = 'default',
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  tone?: Tone;
}) {
  const colors = useColors();
  const accent = toneColor(tone);
  const iconSize = compact ? 24 : 34;
  const iconWrap = compact ? 56 : 76;

  return (
    <View
      style={[
        styles.card,
        compact ? styles.cardCompact : styles.cardRegular,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderLight,
        },
      ]}
    >
      <View style={[styles.iconWrap, { width: iconWrap, height: iconWrap, borderRadius: iconWrap / 2, backgroundColor: `${accent}1A` }]}>
        <Ionicons name={icon} size={iconSize} color={accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: accent, opacity: pressed ? 0.88 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    ...TextStyles.bodyMedium,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CardTokens.radiusLarge,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  cardRegular: {
    paddingVertical: Spacing.xl + 4,
    paddingHorizontal: CardTokens.paddingLarge,
    gap: Spacing.sm + 2,
  },
  cardCompact: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: CardTokens.padding,
    gap: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TextStyles.title3,
    textAlign: 'center',
  },
  message: {
    ...TextStyles.bodyMedium,
    textAlign: 'center',
  },
  actionBtn: {
    marginTop: Spacing.sm - 2,
    height: ButtonTokens.height.sm - 10,
    minWidth: 138,
    borderRadius: ButtonTokens.radius - 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  actionText: {
    color: '#fff',
    ...TextStyles.labelSemibold,
  },
});

/**
 * EmptyState — Consistent empty, error, and offline state component.
 *
 * Displays a centred icon + title + subtitle + optional CTA.
 * Used across all list screens, grids, and rails.
 *
 * Usage:
 *   <EmptyState
 *     icon="calendar-outline"
 *     title="No events yet"
 *     subtitle="Check back soon — your community is growing."
 *     action={{ label: 'Browse all events', onPress: handleBrowse }}
 *   />
 *
 *   <EmptyState
 *     icon="cloud-offline-outline"
 *     title="No connection"
 *     subtitle="Pull to refresh when you're back online."
 *     variant="offline"
 *   />
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { TextStyles, Spacing } from '@/constants/theme';
import { Button } from './Button';

type EmptyVariant = 'default' | 'error' | 'offline' | 'search';

interface EmptyAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface EmptyStateProps {
  /** Ionicons icon name */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Bold heading — use title2 style (20px) */
  title: string;
  /** Supporting description — use body style (16px) */
  subtitle?: string;
  /** Optional primary action button */
  action?: EmptyAction;
  /** Visual variant — affects icon color */
  variant?: EmptyVariant;
  /** Additional container style */
  style?: StyleProp<ViewStyle>;
}

const ICON_SIZE = 64;

const defaultIcons: Record<EmptyVariant, React.ComponentProps<typeof Ionicons>['name']> = {
  default: 'folder-open-outline',
  error: 'alert-circle-outline',
  offline: 'cloud-offline-outline',
  search: 'search-outline',
};

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  variant = 'default',
  style,
}: EmptyStateProps) {
  const colors = useColors();

  const resolvedIcon = icon ?? defaultIcons[variant];

  const iconColor =
    variant === 'error'
      ? colors.error
      : variant === 'offline'
      ? colors.textTertiary
      : colors.textTertiary;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWell,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        <Ionicons name={resolvedIcon} size={ICON_SIZE * 0.5} color={iconColor} />
      </View>

      <Text
        style={[TextStyles.title2, styles.title, { color: colors.text }]}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            TextStyles.body,
            styles.subtitle,
            { color: colors.textSecondary },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}

      {action ? (
        <Button
          variant={action.variant ?? 'primary'}
          onPress={action.onPress}
          style={styles.action}
        >
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  iconWell: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  action: {
    marginTop: Spacing.sm,
    minWidth: 180,
  },
});

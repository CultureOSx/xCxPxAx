/**
 * QueryStateView — shared loading / error / empty state wrapper.
 *
 * Eliminates the repeated if-isLoading / if-isError guard pattern
 * that previously appeared in every screen individually.
 *
 * Usage:
 *   <QueryStateView
 *     isLoading={isLoading}
 *     isError={isError || !data}
 *     loader={<MyScreenSkeleton />}
 *     errorMessage="This event is unavailable."
 *     onRetry={refetch}
 *   >
 *     {/* screen content *\/}
 *   </QueryStateView>
 *
 *   // Empty state:
 *   <QueryStateView ... isEmpty={data.length === 0} emptyTitle="No events" emptyMessage="...">
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { TextStyles } from '@/constants/typography';
import { Button } from '@/components/ui/Button';

interface QueryStateViewProps {
  isLoading: boolean;
  isError: boolean;
  /** Rendered while isLoading is true — pass your custom Skeleton component. */
  loader: React.ReactNode;
  /** Shown when isError is true. */
  errorTitle?: string;
  errorMessage?: string;
  /** Called when the user taps "Try Again". Omit to hide the button. */
  onRetry?: () => void;
  /** When true, renders the empty state instead of children. */
  isEmpty?: boolean;
  emptyIcon?: React.ComponentProps<typeof Ionicons>['name'];
  emptyTitle?: string;
  emptyMessage?: string;
  children: React.ReactNode;
}

export function QueryStateView({
  isLoading,
  isError,
  loader,
  errorTitle = 'Something went wrong',
  errorMessage = 'We couldn\'t load this content. Please try again.',
  onRetry,
  isEmpty = false,
  emptyIcon = 'search-outline',
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  children,
}: QueryStateViewProps) {
  const colors = useColors();

  if (isLoading) {
    return <>{loader}</>;
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.textTertiary} />
        <Text style={[TextStyles.title3, styles.title, { color: colors.text }]}>
          {errorTitle}
        </Text>
        <Text style={[TextStyles.body, styles.message, { color: colors.textSecondary }]}>
          {errorMessage}
        </Text>
        {onRetry && (
          <Button onPress={onRetry} variant="outline" size="md" leftIcon="refresh-outline">
            Try Again
          </Button>
        )}
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.center}>
        <Ionicons name={emptyIcon} size={56} color={colors.textTertiary} />
        <Text style={[TextStyles.title3, styles.title, { color: colors.text }]}>
          {emptyTitle}
        </Text>
        {emptyMessage && (
          <Text style={[TextStyles.body, styles.message, { color: colors.textSecondary }]}>
            {emptyMessage}
          </Text>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  title: {
    marginTop: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});

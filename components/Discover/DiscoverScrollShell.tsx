import React, { type ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

type DiscoverScrollShellProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Bottom inset (e.g. tab bar + safe area) */
  scrollBottomPad: number;
  /** Indices of direct children that should stick below the top bar. */
  stickyHeaderIndices?: number[];
};

/**
 * Discover tab scroll surface — shared mesh + scroll for iOS, Android, and web.
 */
export function DiscoverScrollShell({
  children,
  contentContainerStyle,
  refreshControl,
  scrollBottomPad,
  stickyHeaderIndices,
}: DiscoverScrollShellProps) {
  const colors = useColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradients.culturepassBrand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ambientMesh}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scrollTransparent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        stickyHeaderIndices={stickyHeaderIndices}
        contentContainerStyle={[{ paddingBottom: scrollBottomPad }, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  ambientMesh: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.045,
  },
  scrollTransparent: { flex: 1, backgroundColor: 'transparent' },
});

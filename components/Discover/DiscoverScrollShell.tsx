import React, { type ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, Vitrine } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useDiscoverVitrine } from '@/components/Discover/DiscoverVitrineContext';

type DiscoverScrollShellProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Bottom inset (e.g. tab bar + safe area) */
  scrollBottomPad: number;
};

/**
 * Discover tab scroll surface — shared mesh + scroll for iOS, Android, and web.
 */
export function DiscoverScrollShell({
  children,
  contentContainerStyle,
  refreshControl,
  scrollBottomPad,
}: DiscoverScrollShellProps) {
  const colors = useColors();
  const vitrine = useDiscoverVitrine();

  return (
    <View style={[styles.root, { backgroundColor: vitrine ? Vitrine.background : colors.background }]}>
      <LinearGradient
        colors={vitrine ? [...Vitrine.ambientMesh] : [...gradients.culturepassBrand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ambientMesh, vitrine && styles.ambientMeshVitrine]}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scrollTransparent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        scrollEventThrottle={16}
        refreshControl={refreshControl}
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
  ambientMeshVitrine: {
    opacity: 1,
  },
  scrollTransparent: { flex: 1, backgroundColor: 'transparent' },
});

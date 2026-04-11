/**
 * ScreenShell — Standard screen wrapper for all CulturePass screens.
 *
 * Applies:
 *  - SafeAreaView with correct edges
 *  - `colors.background` fill
 *  - Optional ambient gradient mesh (subtle brand gradient in the background)
 *  - Correct flex layout (flex: 1)
 *
 * Usage:
 *   <ScreenShell>…</ScreenShell>
 *   <ScreenShell edges={[]} ambient>…</ScreenShell>   ← hero screens (no top safe-area edge)
 *   <ScreenShell edges={['bottom']}>…</ScreenShell>  ← custom edge handling
 */
import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens } from '@/constants/theme';

interface ScreenShellProps {
  /**
   * Safe area edges to apply.
   * Default: ['top', 'bottom'] — covers all screens.
   * Pass [] for hero/immersive screens that manage insets manually.
   */
  edges?: Edge[];
  /**
   * Show a subtle ambient brand gradient mesh in the background.
   * Adds a very faint indigo→coral gradient that gives depth without decoration.
   * Default: false
   */
  ambient?: boolean;
  /** Additional style for the outer container */
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function ScreenShell({
  edges = ['top', 'bottom'],
  ambient = false,
  style,
  children,
}: ScreenShellProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const content = (
    <View style={[styles.inner, style]}>
      {ambient && (
        <LinearGradient
          colors={[
            isDark
              ? `${CultureTokens.indigo}14`  // 8% opacity in dark
              : `${CultureTokens.indigo}08`,  // 3% opacity in light
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );

  if (edges.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }, style]}>
        {ambient && (
          <LinearGradient
            colors={[
              isDark
                ? `${CultureTokens.indigo}14`
                : `${CultureTokens.indigo}08`,
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        )}
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
  },
});

/**
 * useColors — runtime color hook for CulturePass.
 *
 * Platform behaviour (per CLAUDE.md):
 *   • Native (iOS / Android): dark theme by default (night festival aesthetic).
 *     Respects the device color-scheme preference — if the user explicitly sets
 *     their device to light mode, light theme is returned.
 *   • Web: always light theme (white-first web surfaces).
 *
 * Usage:
 *   const colors = useColors();
 *   <View style={{ backgroundColor: colors.background }} />
 *   <Text style={{ color: colors.text }} />
 *
 * For static use (e.g. in StyleSheet.create at module level where hooks
 * cannot be called), import Colors directly:
 *   import Colors from '@/constants/colors';
 *   // Colors.primary, Colors.background, etc. (maps to light theme by default)
 *
 * Note:
 *   Use this hook for all runtime colors instead of hardcoding values in
 *   components. This remains the single switch point for any future theme changes.
 */

import { Platform, useColorScheme } from 'react-native';
import type { ColorTheme } from '@/constants/colors';
import { light, dark } from '@/constants/colors';

export function useColors(): ColorTheme {
  const scheme = useColorScheme();
  // Web always uses light. Native defaults to dark unless the user has
  // explicitly set their device to light mode.
  if (Platform.OS === 'web') return light;
  return scheme === 'light' ? light : dark;
}

// ---------------------------------------------------------------------------
// Selector variant — access a single token without re-rendering on
// unrelated color changes (useful for components that only use one color).
//
// Usage:
//   const primary = useColor('primary');
// ---------------------------------------------------------------------------
export function useColor<K extends keyof ColorTheme>(key: K): ColorTheme[K] {
  const colors = useColors();
  return colors[key];
}

// ---------------------------------------------------------------------------
// Utilities for inline platform-aware color decisions
// ---------------------------------------------------------------------------

/** Returns darkValue when a dark theme is active, lightValue otherwise. */
export function useSchemeValue<T>(darkValue: T, lightValue: T): T {
  const isDark = useIsDark();
  return isDark ? darkValue : lightValue;
}

/** Returns true when the dark theme is active (native non-light-mode). */
export function useIsDark(): boolean {
  const scheme = useColorScheme();
  return Platform.OS !== 'web' && scheme !== 'light';
}

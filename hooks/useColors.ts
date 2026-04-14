/**
 * useColors — runtime color hook for CulturePass.
 *
 * Platform behaviour (per CLAUDE.md):
 *   • Native (iOS / Android): dark theme by default (night festival aesthetic).
 *     Respects the device color-scheme preference — if the user explicitly sets
 *     their device to light mode, light theme is returned.
 *   • Web: follows the same appearance preference / system scheme as native (see useAppAppearance).
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

import type { ColorTheme } from '@/constants/colors';
import { light, dark } from '@/constants/colors';
import { useAppAppearance } from '@/hooks/useAppAppearance';

export function useColors(): ColorTheme {
  const { resolvedScheme } = useAppAppearance();
  return resolvedScheme === 'light' ? light : dark;
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

/** Returns true when the dark theme is active. */
export function useIsDark(): boolean {
  const { resolvedScheme } = useAppAppearance();
  return resolvedScheme === 'dark';
}

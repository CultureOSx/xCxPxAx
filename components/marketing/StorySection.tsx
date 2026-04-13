import React from 'react';
import { View, type ViewProps, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import {
  MarketingMaxWidth,
  SectionSpacing,
  marketingSurfaces,
} from '@/constants/theme';

export type StorySectionSize = keyof typeof SectionSpacing;
export type StorySectionMaxWidth = keyof typeof MarketingMaxWidth;

export type StorySectionProps = ViewProps & {
  /** Vertical padding band (default 80px) */
  size?: StorySectionSize;
  /** Muted band background */
  muted?: boolean;
  /**
   * `app` — `useColors()` surfaces (follows light/dark).
   * `marketing` — fixed light neutrals for campaign / landing strips.
   */
  variant?: 'app' | 'marketing';
  /** Center children with max-width column */
  contain?: boolean;
  maxWidth?: StorySectionMaxWidth;
};

const styles = StyleSheet.create({
  outer: { width: '100%', alignSelf: 'stretch' },
  inner: { width: '100%', alignSelf: 'center' },
});

/**
 * Full-width vertical band: headline + subcopy + CTA blocks (Apple-style “chapter” spacing).
 * Uses `useLayout().hPad` for horizontal inset parity with the rest of the app.
 */
export function StorySection({
  size = 'md',
  muted = false,
  variant = 'app',
  contain = true,
  maxWidth = 'reading',
  style,
  children,
  ...rest
}: StorySectionProps) {
  const colors = useColors();
  const { hPad } = useLayout();
  const py = SectionSpacing[size];
  const cap = MarketingMaxWidth[maxWidth];

  const backgroundColor =
    variant === 'marketing'
      ? (muted ? marketingSurfaces.band : marketingSurfaces.page)
      : muted
        ? colors.backgroundSecondary
        : colors.background;

  return (
    <View
      style={[styles.outer, { paddingVertical: py, paddingHorizontal: hPad, backgroundColor }, style]}
      {...rest}
    >
      {contain ? <View style={[styles.inner, { maxWidth: cap }]}>{children}</View> : children}
    </View>
  );
}

/**
 * SectionDivider — 32px vertical spacer for consistent section spacing.
 *
 * Replaces all ad-hoc `marginTop`, `paddingTop`, and `<View style={{ height: X }} />`
 * gaps between screen sections. Uses `LayoutRules.sectionSpacing` (32px).
 *
 * Usage:
 *   <SectionHeader title="Upcoming Events" />
 *   <EventRail … />
 *   <SectionDivider />          ← 32px gap
 *   <SectionHeader title="Communities" />
 *   <CommunityRail … />
 *   <SectionDivider size="sm" /> ← 16px gap (between tightly related items)
 */
import React from 'react';
import { View } from 'react-native';
import { LayoutRules, Spacing } from '@/constants/theme';

interface SectionDividerProps {
  /**
   * Height variant:
   * - 'sm' — 16px (Spacing.md): between related items in the same section
   * - 'md' — 32px (LayoutRules.sectionSpacing): between major screen sections (default)
   * - 'lg' — 48px (Spacing.xxxl): before/after hero sections
   */
  size?: 'sm' | 'md' | 'lg';
}

const HEIGHTS: Record<NonNullable<SectionDividerProps['size']>, number> = {
  sm: Spacing.md,
  md: LayoutRules.sectionSpacing,
  lg: Spacing.xxxl,
};

export function SectionDivider({ size = 'md' }: SectionDividerProps) {
  return <View style={{ height: HEIGHTS[size] }} accessibilityElementsHidden />;
}

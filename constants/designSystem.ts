/**
 * CulturePass production UI system — layout + marketing rhythm.
 *
 * Composes spacing, breakpoints, and brand tokens. Screens should import from
 * `@/constants/theme` (not this file directly) per culturepass-rules.
 *
 * Philosophy: Apple-level hierarchy + whitespace; CulturePass energy via
 * CultureTokens + gradients.discoveryMarketing — never ad-hoc hex in JSX.
 */

import { CultureTokens, marketingSurfaces } from './colors';
import { Breakpoints, Layout, SectionSpacing, Spacing } from './spacing';

/** Semantic version for design-system changelog discipline */
export const DesignSystemVersion = '1.0.0' as const;

/** Max content width presets for centered storytelling columns */
export const MarketingMaxWidth = {
  narrow: 640,
  reading: 800,
  feature: 960,
  wide: Layout.desktopMaxWidth,
} as const;

/** Block spacing inside a section (stacked headline → subcopy → CTA) */
export const ContentRhythm = {
  tight: Spacing.md,
  default: Spacing.lg,
  relaxed: Spacing.xl,
  loose: Spacing.xxl,
} as const;

/** Multi-column marketing grids (events / communities cards) */
export const MarketingGrid = {
  minCardWidth: 280,
  gap: { mobile: Spacing.md, tablet: Spacing.lg, desktop: Spacing.xl },
} as const;

/** Hero / fold helpers — pair with Image + LinearGradient overlays */
export const HeroLayout = {
  /** Suggested min heights as fraction of viewport (apply per platform) */
  minHeightFraction: { native: 0.42, webMobile: 0.72, webDesktop: 0.78 },
  overlayBottomWeight: 0.55,
} as const;

/** Web-only box-shadow strings — use with theme.webShadow() */
export const MarketingShadow = {
  card: '0 2px 12px rgba(0,0,0,0.06)',
  cardRaised: '0 8px 28px rgba(0,0,0,0.10)',
} as const;

/**
 * Single import for marketing section padding + widths in screens.
 */
export const MarketingLayout = {
  sectionPaddingY: SectionSpacing,
  maxWidth: MarketingMaxWidth,
  rhythm: ContentRhythm,
  grid: MarketingGrid,
  hero: HeroLayout,
  shadow: MarketingShadow,
  breakpoints: Breakpoints,
} as const;

/** Primary CTA on light marketing — aligns to Apple-style link blue; maps to brand indigo */
export const MarketingCTA = {
  fill: CultureTokens.indigo,
  onFill: marketingSurfaces.onPrimary,
} as const;

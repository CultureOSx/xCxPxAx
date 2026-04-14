/**
 * CulturePassAU Design System — Master Export
 * ============================================
 *
 * Import everything from this one file instead of hunting across
 * individual constants files:
 *
 *   import { Colors, TextStyles, Elevation, Spacing, ButtonTokens } from '@/constants/theme';
 *
 * ---------------------------------------------------------------------------
 * LAYOUT RULES — Web vs Mobile
 * ---------------------------------------------------------------------------
 *
 * Breakpoints:
 *   Mobile   < 768px   — single-column hero, 2-column grid, 16–20px h-padding
 *   Tablet   768–1023px — 2–3 column grid, 24px h-padding, 768px max-width
 *   Desktop  ≥ 1024px  — 3–4 column grid, 32px h-padding, 1280px max-width
 *
 * Web shell (app/_layout.tsx WebShell):
 *   Subtle brand-gradient ambient mesh behind content; base fill = colors.background.
 *   Desktop (≥1024px) → 240px WebSidebar + main column (see useLayout().sidebarWidth).
 *   Tablet / mobile web → full-width column; bottom tabs where the tabs layout applies.
 *
 * Navigation:
 *   Native + web (non-desktop) → bottom tab bar (TabBarTokens.heightMobile = 84).
 *   Desktop web → sidebar only; tabBarHeight = 0 in useLayout().
 *
 * Grid columns (Events screen):
 *   Mobile  → 2 columns
 *   Desktop → 3 columns
 *
 * Horizontal padding:
 *   Mobile  → 16–20px
 *   Tablet  → 24px
 *   Desktop → 32px
 *
 * Use the `useLayout()` hook (hooks/useLayout.ts) to get these values
 * reactively in any component:
 *
 *   const { isDesktop, numColumns, hPad } = useLayout();
 *
 * ---------------------------------------------------------------------------
 * COLOR ROLES
 * ---------------------------------------------------------------------------
 *
 * primary     — CTA buttons, links, active states
 * secondary   — Accent color (purple), secondary CTAs
 * accent      — Warning/highlight (orange)
 * gold        — Premium / membership tier
 *
 * background  — Page background
 * surface     — Card / modal background (elevated over background)
 * surfaceElevated — Further lifted surface (nested cards, inputs)
 *
 * text        — Primary readable text
 * textSecondary — Supporting text, captions
 * textTertiary  — Placeholder text, disabled labels
 *
 * border      — Standard border
 * borderLight — Hairline dividers, card outlines
 * divider     — Full-width separators
 *
 * success / warning / error / info — Status colors
 *
 * Use `useColors()` (hooks/useColors.ts) for runtime theme access:
 *
 *   const colors = useColors();
 *   <Text style={{ color: colors.primary }}>...</Text>
 */

import { CultureTokens } from './colors';
import { SpringConfig } from './animations';

// ---------------------------------------------------------------------------
// Re-exports — single import surface
// ---------------------------------------------------------------------------
export { default as Colors, light as lightColors, dark as darkColors, shadows, glass, gradients, neon, CultureTokens, CategoryColors, EntityTypeColors } from './colors';
export type { ColorTheme, ShadowStyle } from './colors';

export {
  Spacing,
  Radius,
  Breakpoints,
  Layout,
} from './spacing';

export {
  FontFamily,
  FontSize,
  LineHeight,
  LetterSpacing,
  TextStyles,
  DesktopTextStyles,
  Typography,          // legacy
} from './typography';

export {
  Elevation,
  ElevationAlias,
} from './elevation';

export {
  Duration,
  SpringConfig,
  prefersReducedMotion,
} from './animations';

// ---------------------------------------------------------------------------
// Component tokens
// Used to keep button heights, card paddings, input sizes consistent.
// ---------------------------------------------------------------------------

/**
 * Button component tokens.
 * Use these to build all button variants — never hardcode sizes.
 */
export const ButtonTokens = {
  height: {
    sm: 52,
    md: 52,
    lg: 52,
  },
  paddingH: {
    sm: 16,
    md: 20,
    lg: 28,
  },
  radius: 16,
  radiusPill: 9999,
  fontSize: {
    sm: 14,
    md: 15,
    lg: 16,
  },
  iconGap: 8,
} as const;

/**
 * Global layout rule tokens.
 * Mirrors APPLE_AIRBNB_UX_GUIDELINES.md for consistent implementation.
 */
export const LayoutRules = {
  screenHorizontalPadding: 16,
  cardPaddingMin: 16,
  cardPaddingMax: 20,
  sectionSpacing: 32,
  iconTextGap: 8,
  betweenCards: 16,
  buttonHeight: 52,
  borderRadius: 16,
} as const;

/**
 * Card component tokens.
 * Shared by EventCard, CommunityCard, CategoryCard etc.
 */
export const CardTokens = {
  radius: 16,
  radiusLarge: 20,
  padding: 16,
  paddingLarge: 20,
  imageHeight: {
    mobile: 120,
    tablet: 140,
    desktop: 160,
  },
  gap: {
    mobile: 16,
    desktop: 16,
  },
  minWidth: 160,
} as const;

/**
 * Input component tokens.
 * Text inputs, search bars, dropdowns.
 */
export const InputTokens = {
  height: 48,
  heightSearch: 44,
  radius: 16,
  fontSize: 16,
  paddingH: 16,
  paddingV: 12,
  iconSize: 20,
  iconGap: 8,
} as const;

/**
 * Chip / filter pill tokens.
 */
export const ChipTokens = {
  height: 36,
  paddingH: 16,
  paddingV: 8,
  radius: 50,
  fontSize: 13,
  gap: 8,
} as const;

/**
 * Header / Top Bar tokens.
 * Use for all screen headers and top bars.
 */
export const HeaderTokens = {
  height: 48, // Standardized header height
  paddingVertical: 12, // Standardized vertical padding
  paddingHorizontal: 20, // Standardized horizontal padding
  iconSize: 24,
  titleFontSize: 20,
  titleFontFamily: 'Poppins_700Bold',
} as const;

/**
 * Bottom sheet / modal tokens.
 */
export const SheetTokens = {
  borderRadius: 24,
  handleHeight: 4,
  handleWidth: 40,
  handleColor: 'rgba(0,0,0,0.2)',
  minHandleHitSlop: 20,
  headerHeight: 56,
} as const;

/**
 * Avatar / profile photo tokens.
 */
export const AvatarTokens = {
  size: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
    xxl: 96,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: 9999,      // Always circular
  badgeSize: 12,
  badgeOffset: 2,
} as const;

/**
 * Tab bar tokens (used by app/(tabs)/_layout.tsx).
 */
export const TabBarTokens = {
  heightMobile: 84,
  heightDesktop: 64,
  iconSize: 24,
  labelSize: 10,
  labelSizeDesktop: 11,
} as const;

/**
 * Section header tokens — "See All" rows, section titles.
 */
export const SectionTokens = {
  titleFontFamily: 'Poppins_700Bold',
  titleFontSize: 20,
  titleLineHeight: 28,
  iconSize: 22,
  verticalPadding: 8,
  mobileHorizontalPadding: 16,
  desktopHorizontalPadding: 16,
  sectionSpacing: 32,
} as const;

// ---------------------------------------------------------------------------
// Icon size scale — consistent icon sizing across all components
// ---------------------------------------------------------------------------
export const IconSize = {
  xs:   12,
  sm:   16,
  md:   20,
  lg:   24,
  xl:   32,
  xxl:  40,
} as const;

// ---------------------------------------------------------------------------
// Z-index scale — never use raw numbers for z-index
// ---------------------------------------------------------------------------
export const ZIndex = {
  base:       0,
  raised:     10,
  dropdown:   100,
  sticky:     200,
  overlay:    300,
  modal:      400,
  toast:      500,
  tooltip:    600,
} as const;

export const BorderTokens = {
  black: '#000000',
  white: '#FFFFFF',
  widthBold: 3,
  widthNormal: 1.5,
};

/**
 * Liquid Glass–aligned radii and fallback blur strengths.
 * Native liquid glass uses `expo-glass-effect` when the API is available; otherwise expo-blur / CSS.
 */
export const LiquidGlassTokens = {
  blurFallback: {
    ios: 56,
    android: 36,
    webPx: 44,
  },
  corner: {
    mainCard: 28,
    innerRow: 18,
    valueRibbon: 16,
  },
  parallaxFactor: 0.14,
  entranceSpring: SpringConfig.smooth,
} as const;

/** Saturated translucent wells for stacked glass rows (onboarding feature icons). */
export const LiquidGlassAccents = {
  eventIconWell: 'rgba(255, 140, 66, 0.18)',
  communityIconWell: 'rgba(255, 94, 91, 0.18)',
  perksIconWell: 'rgba(255, 200, 87, 0.2)',
  valueRibbonFill: 'rgba(255, 200, 87, 0.14)',
  valueRibbonBorder: `${CultureTokens.gold}55`,
  hostAccentBar: CultureTokens.teal,
  /** Inline validation / auth error callouts on glass forms */
  errorBannerFill: 'rgba(255, 94, 91, 0.16)',
  errorBannerBorder: `${CultureTokens.coral}55`,
} as const;

// ---------------------------------------------------------------------------
// Platform-safe web box-shadow helper
// ---------------------------------------------------------------------------
// Usage in Platform.select:
//   ...Platform.select({
//     ios: { shadowColor: '#000', ... },
//     android: { elevation: 3 },
//     web: webShadow('0 4px 12px rgba(0,0,0,0.08)'),
//   })
 
export function webShadow(shadow: string): { boxShadow: string } {
  return { boxShadow: shadow };
}

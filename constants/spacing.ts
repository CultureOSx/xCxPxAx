/**
 * Consistent spacing scale and layout constants.
 * Use these tokens instead of raw numbers for maintainable layouts.
 */

export const Spacing = {
  /** 2px — micro gap, icon badge offsets */
  '2xs': 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px — between sm and md; use for tight card padding, inner gaps */
  s12: 12,
  /** 16px */
  md: 16,
  /** 20px — between md and lg; section inner padding */
  s20: 20,
  /** 24px */
  lg: 24,
  /** 32px */
  xl: 32,
  /** 40px */
  xxl: 40,
  /** 48px */
  xxxl: 48,
  /** 56px */
  xxxxl: 56,
} as const;

/**
 * Vertical rhythm for marketing / storytelling sections (web-first, also usable natively).
 * Apple-like “chapter” spacing — multiples of 8px.
 */
export const SectionSpacing = {
  /** 64px */
  sm: 64,
  /** 80px */
  md: 80,
  /** 96px */
  lg: 96,
  /** 120px */
  xl: 120,
} as const;

export const Radius = {
  /** 4px — micro chips, status dots, tight badges */
  xs: 4,
  /** 8px — small tags, avatar rings, compact chips */
  sm: 8,
  /** 12px — standard inputs, compact cards, buttons */
  md: 12,
  /** 16px — standard cards, containers, modals */
  lg: 16,
  /** 20px — featured cards, large panels */
  xl: 20,
  /** 28px — bottom sheets, full-screen overlays */
  xxl: 28,
  /** 9999px — pills, avatars, FABs */
  full: 9999,
} as const;

export const Breakpoints = {
  /** Mobile → tablet transition */
  tablet: 768,
  /** Tablet → desktop transition */
  desktop: 1024,
  /** Desktop → wide-screen transition */
  wide: 1280,
} as const;

export const Layout = {
  /** Maximum content width for narrow mobile web */
  maxContentWidth: 480,
  /** Phone-shell max width on mobile web */
  mobileWebShell: 480,
  /** Tablet container max width */
  tabletMaxWidth: 768,
  /** Desktop container max width */
  desktopMaxWidth: 1280,
  /** Wider breakpoint for tablet / desktop */
  wideBreakpoint: 768,
  /** Tab bar approximate height for bottom padding */
  tabBarHeight: 84,
} as const;

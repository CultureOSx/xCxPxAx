/**
 * Consistent spacing scale and layout constants.
 * Use these tokens instead of raw numbers for maintainable layouts.
 */

export const Spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 16px */
  md: 16,
  /** 24px */
  lg: 24,
  /** 32px */
  xl: 32,
  /** 40px */
  xxl: 40,
  /** 48px */
  xxxl: 48,
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
  /** 16px — standardized corner radius */
  xs: 16,
  /** 16px — standardized corner radius */
  sm: 16,
  /** 16px — standardized corner radius */
  md: 16,
  /** 16px — standardized corner radius */
  lg: 16,
  /** 16px — standardized corner radius */
  xl: 16,
  /** 9999px — fully round (pills, avatars) */
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

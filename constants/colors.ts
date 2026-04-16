/**
 * CulturePass UI Token System
 * ===========================
 *
 * A comprehensive, theme-aware color system designed for cultural discovery.
 *
 * Core Brand Tokens:
 *   - CulturePass Blue (#0066CC) — primary brand identity
 *   - CulturePass Yellow (#FFCC00) — warm discovery experience
 *   - Movement Coral (#FF5E5B) — action and emotion
 *   - Temple Gold (#FFC857) — premium/cultural marker
 *   - Ocean Teal (#2EC4B6) — global belonging
 *
 * Design Principles:
 *   ✓ Black-first premium surfaces across all platforms
 *   ✓ Warm discovery + action-oriented CTAs
 *   ✓ Cultural authenticity over tech-startup aesthetics
 *   ✓ Accessible contrast ratios (WCAG AA minimum)
 *
 * Usage:
 *   import { useColors } from '@/hooks/useColors';
 *   const colors = useColors(); // Runtime theme access
 */

export interface ShadowStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
  boxShadow?: string;
}

const createShadow = (
  width: number,
  height: number,
  opacity: number,
  radius: number,
  elevation: number,
  color: string = "#000"
): any => {
  return {
    boxShadow: `${width}px ${height}px ${radius}px rgba(0, 0, 0, ${opacity})`,
  };
};

/**
 * Cultural Brand Tokens
 * Use these for primary interactions and cultural markers.
 */
export const CultureTokens = {
  // Core brand palette (2026 update from ui-ux-pro-max design system)
  indigo: "#0066CC",        // CulturePass Blue — primary brand
  violet: "#7C3AED",        // New Cultural Violet (richer identity, from skill)
  coral: "#FF5E5B",         // Movement Coral — action energy
  gold: "#FFC857",          // Temple Gold — premium/cultural marker
  teal: "#2EC4B6",          // Ocean Teal — global belonging
  emerald: "#22C55E",       // New CTA Green (growth, join, success — from skill)
  purple: "#AF52DE",        // Community Purple

  // Functional overrides (updated for new palette)
  event: "#7C3AED",         // Events use Violet for cultural vibrancy
  eventSoft: "#F3E8FF",     // Soft violet tint
  artist: "#FF5E5B",        // Artists use Coral
  artistSoft: "#FFF1F0",    // Artist background tint
  venue: "#2EC4B6",         // Venues use Teal
  venueSoft: "#F0FDFB",     // Venue background tint
  movie: "#AF52DE",         // Movies use Purple
  movieSoft: "#F5F3FF",     // Movie background tint
  community: "#7C3AED",     // Community use New Violet
  communitySoft: "#F3E8FF", // Community background tint

  // Status overrides (enhanced with new emerald)
  success: "#22C55E",       // Success = Emerald Green (from skill)
  warning: "#FFC857",       // Warning = Gold
  error: "#FF5E5B",         // Error = Coral
  info: "#2EC4B6",          // Info = Teal
} as const;

/** Olympics 5-ring colors for filter chips, buttons, and accents (mostly black/white base per request). */
export const OlympicsColors = {
  blue: '#0066CC',
  yellow: '#FFC857',
  black: '#000000',
  green: '#22C55E',
  red: '#FF5E5B',
} as const;

/**
 * Browse category colors — used for category chips, icons, and tints
 * across Discover, search, and filter screens.
 */
export const CategoryColors = {
  music:       OlympicsColors.red,
  dance:       OlympicsColors.blue,
  food:        OlympicsColors.yellow,
  art:         OlympicsColors.blue,
  wellness:    OlympicsColors.green,
  movies:      OlympicsColors.red,
  workshop:    OlympicsColors.black,
  heritage:    OlympicsColors.yellow,
  activities:  OlympicsColors.green,
  nightlife:   OlympicsColors.red,
  comedy:      OlympicsColors.yellow,
  sports:      OlympicsColors.blue,
  monuments:   OlympicsColors.black,
  artists:     OlympicsColors.yellow,
  shopping:    OlympicsColors.red,
} as const;

/**
 * Entity type colors — used in community/profile listings to
 * colour-code organisations, venues, artists, etc.
 */
export const EntityTypeColors = {
  community:    "#0081C8",  // Olympic Blue
  organisation: "#5856D6",  // Apple Indigo
  venue:        "#34C759",  // Apple Green
  council:      "#FF9500",  // Apple Orange
  government:   "#AF52DE",  // Apple Purple
  artist:       "#FF2D55",  // Apple Pink
  business:     "#5AC8FA",  // Apple Teal-Blue
  charity:      "#FF6B6B",  // Charity Red
} as const;

export type ColorTheme = {
  // Core brand
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  primarySoft: string;

  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  accent: string;
  accentLight: string;

  gold: string;

  // Backgrounds
  background: string;
  backgroundSecondary: string;

  surface: string;
  surfaceElevated: string;
  surfaceSecondary: string;

  // Borders
  border: string;
  borderLight: string;
  divider: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  /** High-contrast text on saturated brand gradients (hero ribbons, CTAs on color). */
  textOnBrandGradient: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Interaction
  overlay: string;
  tabIconDefault: string;
  tabIconSelected: string;
  card: string;
  cardBorder: string;

  // Tab bar
  tabBar: string;
  tabBarBorder: string;

  tint: string;

  // Cultural tokens (brand-aware)
  cultureBrand: string;
  culturePrimary: string;
  cultureSecondary: string;
  cultureAccent: string;
  cultureHighlight: string;
};

// Colors that stay exactly the same regardless of light/dark mode
const sharedBase = {
  secondary: "#18181B", // Black base
  secondaryLight: "#27272A",
  secondaryDark: "#0A0A0A",

  accent: OlympicsColors.black,
  accentLight: "#3F3F46",

  gold: OlympicsColors.yellow,

  success: OlympicsColors.green,
  warning: OlympicsColors.yellow,
  error: OlympicsColors.red,
  info: OlympicsColors.blue,

  overlay: "rgba(0,0,0,0.4)",
} as const;

/**
 * Light Mode Theme
 * For web and optional light mode support.
 */
export const light: ColorTheme = {
  ...sharedBase,

  // Primary - Black for light mode (high contrast black/white palette)
  primary: "#18181B",
  primaryLight: "#27272A",
  primaryDark: "#0A0A0A",
  primaryGlow: "rgba(24, 24, 27, 0.12)",
  primarySoft: "rgba(24, 24, 27, 0.06)",

  // Backgrounds - White base for light mode with high contrast
  background: "#FAFAFA",
  backgroundSecondary: "#F4F4F5",

  surface: "#FFFFFF",
  surfaceElevated: "#FAFAFA",
  surfaceSecondary: "#F4F4F5",

  border: "#E4E4E7",
  borderLight: "#D4D4D8",
  divider: "#E4E4E7",

  text: "#18181B", // black text on white for contrast
  textSecondary: "#3F3F46",
  textTertiary: "#71717A",
  textInverse: "#FAFAFA",
  textOnBrandGradient: "#FAFAFA",

  card: "#FFFFFF",
  cardBorder: "#D7E1EE",

  tabBar: "rgba(255,255,255,0.96)",
  tabBarBorder: "rgba(199,213,231,0.9)",
  tabIconDefault: "#64748B",
  tabIconSelected: "#18181B",

  tint: "#18181B",

  // Cultural brand tokens (black/white main with Olympics accents per request)
  cultureBrand: "#18181B",
  culturePrimary: "#18181B",
  cultureSecondary: OlympicsColors.black,
  cultureAccent: OlympicsColors.yellow,
  cultureHighlight: OlympicsColors.green,
};

/**
 * Dark Theme Tokens
 * Native default — “Night Festival” + OLED-friendly base (ui-ux-pro-max: deep black,
 * layered greys, brand accents; still CultureTokens-driven, not generic purple templates).
 *
 * Color hierarchy:
 *   True black / near-black — primary background (OLED power + contrast anchor)
 *   Lifted navy surfaces — cards and chrome
 *   CulturePass Blue (#0066CC) — elevated/active surfaces and accents
 */
export const dark: ColorTheme = {
  ...sharedBase,

  // Primary - White for dark mode (high contrast black/white palette)
  primary: "#FAFAFA",
  primaryLight: "#E4E4E7",
  primaryDark: "#A1A1AA",
  primaryGlow: "rgba(250, 250, 250, 0.25)",
  primarySoft: "rgba(250, 250, 250, 0.12)",

  // Backgrounds — Pure black OLED with white text for high contrast (per design system)
  background: "#000000",
  backgroundSecondary: "#18181B",

  surface: "#18181B",
  surfaceElevated: "#27272A",
  surfaceSecondary: "#3F3F46",

  border: "#3F3F46",
  borderLight: "#52525B",
  divider: "#3F3F46",

  text: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textTertiary: "#71717A",
  textInverse: "#18181B",
  textOnBrandGradient: "#FAFAFA",

  card: "#151C2E",
  cardBorder: "#243045",

  tabBar: "rgba(0, 0, 0, 0.94)",
  tabBarBorder: "rgba(36, 48, 69, 0.55)",
  tabIconDefault: "#8D8D8D",
  tabIconSelected: "#FAFAFA",

  tint: "#FAFAFA",

  // Cultural brand tokens (black/white main with Olympics accents per request)
  cultureBrand: "#FAFAFA",
  culturePrimary: "#FAFAFA",
  cultureSecondary: OlympicsColors.black,
  cultureAccent: OlympicsColors.yellow,
  cultureHighlight: OlympicsColors.green,
};

export const shadows = {
  small: createShadow(0, 1, 0.04, 3, 1),
  medium: createShadow(0, 2, 0.08, 8, 3),
  large: createShadow(0, 4, 0.12, 16, 6),
  heavy: createShadow(0, 8, 0.16, 24, 10),
};

/**
 * Glassmorphism and futuristic surface presets.
 * Use these on cards/modals for a modern frosted-glass feel.
 */
export const glass = {
  light: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderColor: "rgba(255,255,255,0.35)",
  },
  dark: {
    backgroundColor: "rgba(28,28,30,0.72)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  /** Semi-transparent overlay for modals/popovers */
  overlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  /** Ultra-clear glass — for hero sections and featured cards */
  ultraLight: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderColor: "rgba(255,255,255,0.5)",
  },
  /** Deep dark glass — for dark mode hero sections */
  ultraDark: {
    backgroundColor: "rgba(0,0,0,0.82)",
    borderColor: "rgba(255,255,255,0.06)",
  },
} as const;

/**
 * Gradient tuples ready for LinearGradient `colors` prop.
 * Each pair is [start, end] or triple for [start, middle, end].
 */
export const gradients = {
  /**
   * CulturePass Signature Gradient (2026 update)
   * Use for: hero banners, onboarding, flagship CTAs
   * Transitions from Cultural Violet (#7C3AED) → Emerald Green (#22C55E) per DESIGN_MANUAL.md
   */
  culturepassBrand: [
    CultureTokens.violet,
    CultureTokens.emerald,
  ] as [string, string],

  /** CulturePass Signature Gradient (reversed: Emerald → Violet) */
  culturepassBrandReversed: [
    CultureTokens.emerald,
    CultureTokens.violet,
  ] as [string, string],

  /** Primary brand gradient — CulturePass Blue to Deep Blue */
  primary: ["#0066CC", "#004EA8"] as [string, string],
  /** Warm accent gradient — Apple Orange to Yellow */
  accent: ["#FF9500", "#FFCC00"] as [string, string],
  /** Premium gold gradient for membership/pro badges */
  gold: ["#FFCC00", "#F4A100"] as [string, string],
  /** Dark surface gradient for cards on dark mode */
  darkSurface: ["#1C1C1E", "#2C2C2E"] as [string, string],
  /** Hero banner overlay (transparent → dark) */
  heroOverlay: ["transparent", "rgba(0,0,0,0.6)"] as [string, string],
  /** Success / positive action — Apple Green */
  success: ["#34C759", "#30D158"] as [string, string],
  /** Aurora — Apple Blue, Indigo, Purple */
  aurora: [
    "#007AFF",
    "#5856D6",
    "#AF52DE",
  ] as [string, string, string],
  /** Sunset — Red to Yellow */
  sunset: [
    "#FF3B30",
    "#FF9500",
    "#FFCC00",
  ] as [string, string, string],
  /** Midnight — deep dark */
  midnight: [
    "#000000",
    "#1C1C1E",
    "#2C2C2E",
  ] as [string, string, string],
  /** Festival / Apple brights */
  festival: [
    "#007AFF",
    "#34C759",
    "#FF3B30",
  ] as [string, string, string],
  /** Olympic — full rings (kept for compatibility) */
  olympic: [
    "#007AFF",
    "#FFCC00",
    "#FF3B30",
  ] as [string, string, string],
} as const;

/**
 * Neon glow tokens for interactive elements (futuristic highlights, active states).
 * Use sparingly — only on focal points, not general UI.
 */
export const neon = {
  blue: { color: "#007AFF", glow: "rgba(0, 122, 255, 0.45)" },
  purple: { color: "#AF52DE", glow: "rgba(175, 82, 222, 0.45)" },
  teal: { color: "#5AC8FA", glow: "rgba(90, 200, 250, 0.45)" },
  gold: { color: "#FFCC00", glow: "rgba(255, 204, 0, 0.50)" },
  coral: { color: "#FF3B30", glow: "rgba(255, 59, 48, 0.45)" },
} as const;

const Colors = {
  ...light, // Default export maps to light mode variables
  light,
  dark,
  shadow: shadows,
  shadows,
  glass,
  gradients,
  tokens: CultureTokens, // Cultural brand tokens
  cultureTokens: CultureTokens,
} as const;

export default Colors;

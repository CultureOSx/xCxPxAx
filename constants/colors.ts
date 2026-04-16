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
  // Core brand palette
  indigo: "#0066CC",        // CulturePass Blue — primary brand
  coral: "#FF5E5B",         // Movement Coral — action energy
  gold: "#0066CC",          // Remapped to blue for better text visibility
  teal: "#2EC4B6",          // Ocean Teal — global belonging
  purple: "#AF52DE",        // Community Purple

  // Functional overrides
  event: "#0066CC",         // Events now use Blue
  eventSoft: "#FFF8E1",     // Event background tint
  artist: "#FF5E5B",        // Artists use Coral
  artistSoft: "#FFF1F0",    // Artist background tint
  venue: "#2EC4B6",         // Venues use Teal
  venueSoft: "#F0FDFB",     // Venue background tint
  movie: "#AF52DE",         // Movies use Purple
  movieSoft: "#F5F3FF",     // Movie background tint
  community: "#0066CC",     // Community use Brand Blue
  communitySoft: "#EBF5FF", // Community background tint

  // Status overrides
  success: "#2EC4B6",       // Success = Teal
  warning: "#0066CC",       // Warning = Blue
  error: "#FF5E5B",         // Error = Coral
  info: "#0066CC",          // Info = Blue
} as const;

/**
 * Browse category colors — used for category chips, icons, and tints
 * across Discover, search, and filter screens.
 */
export const CategoryColors = {
  music:       "#FF6B6B",   // Warm Red
  dance:       "#4ECDC4",   // Teal-Cyan
  food:        "#FF9500",   // Apple Orange (matches sharedBase.accent)
  art:         "#A855F7",   // Vivid Purple
  wellness:    "#FF3B30",   // Apple Red
  movies:      "#5AC8FA",   // Apple Teal-Blue
  workshop:    "#FF9500",   // Apple Orange
  heritage:    "#8B6914",   // Heritage Bronze
  activities:  "#EC4899",   // Hot Pink
  nightlife:   "#6366F1",   // Indigo-Violet
  comedy:      "#F59E0B",   // Amber
  sports:      "#EF4444",   // Bright Red
  monuments:   "#94A3B8",   // Slate Gray
  artists:     "#FBBF24",   // Golden Yellow
  shopping:    "#AF52DE",   // Apple Purple
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
  secondary: "#5856D6", // Apple Indigo
  secondaryLight: "#7A78E0",
  secondaryDark: "#4A48B8",

  accent: "#FF9500", // Apple Orange
  accentLight: "#FFB340",

  gold: "#0066CC", // Remapped to blue for better text visibility

  success: "#34C759", // Apple Green
  warning: "#FF9500", // Apple Orange
  error: "#FF3B30", // Apple Red
  info: "#5AC8FA", // Apple Teal

  overlay: "rgba(0,0,0,0.4)",
} as const;

/**
 * Light Mode Theme
 * For web and optional light mode support.
 */
export const light: ColorTheme = {
  ...sharedBase,

  // Primary - CulturePass Blue
  primary: CultureTokens.indigo,
  primaryLight: "#3385D6",
  primaryDark: "#004EA8",
  primaryGlow: "rgba(0, 102, 204, 0.12)",
  primarySoft: "rgba(0, 102, 204, 0.06)",

  // Backgrounds - true light mode (clear visual difference from dark)
  background: "#F7F9FC",
  backgroundSecondary: "#EEF3FA",

  surface: "#FFFFFF",
  surfaceElevated: "#F3F7FF",
  surfaceSecondary: "#E9F0FA",

  border: "#D7E1EE",
  borderLight: "#C7D5E7",
  divider: "#D7E1EE",

  text: "#0F172A",
  textSecondary: "#334155",
  textTertiary: "#64748B",
  textInverse: "#0B0B14",
  textOnBrandGradient: "#FFFFFF",

  card: "#FFFFFF",
  cardBorder: "#D7E1EE",

  tabBar: "rgba(255,255,255,0.96)",
  tabBarBorder: "rgba(199,213,231,0.9)",
  tabIconDefault: "#64748B",
  tabIconSelected: CultureTokens.indigo,

  tint: CultureTokens.indigo,

  // Cultural brand tokens
  cultureBrand: CultureTokens.indigo,
  culturePrimary: CultureTokens.indigo,
  cultureSecondary: CultureTokens.coral,
  cultureAccent: CultureTokens.gold,
  cultureHighlight: CultureTokens.teal,
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

  // Primary - CulturePass Blue (Dark Mode Variant)
  primary: CultureTokens.indigo,
  primaryLight: "#3385D6",
  primaryDark: "#004EA8",
  primaryGlow: "rgba(0, 102, 204, 0.25)",
  primarySoft: "rgba(0, 102, 204, 0.12)",

  // Backgrounds — OLED base + festival navy lift on surfaces
  background: "#000000",
  backgroundSecondary: "#0A0E14",

  surface: "#121826",
  surfaceElevated: CultureTokens.indigo, // CulturePass Blue — active surfaces
  surfaceSecondary: "#0F2844",

  border: "#1A2436",
  borderLight: "#243045",
  divider: "#1A2436",

  text: "#F4F4F5",
  textSecondary: "#C9C9D6",
  textTertiary: "#8D8D8D",
  textInverse: "#0B0B14",
  textOnBrandGradient: "#FFFFFF",

  card: "#151C2E",
  cardBorder: "#243045",

  tabBar: "rgba(0, 0, 0, 0.94)",
  tabBarBorder: "rgba(36, 48, 69, 0.55)",
  tabIconDefault: "#8D8D8D",
  tabIconSelected: CultureTokens.indigo,

  tint: CultureTokens.indigo,

  // Cultural brand tokens
  cultureBrand: CultureTokens.indigo,
  culturePrimary: CultureTokens.indigo,
  cultureSecondary: CultureTokens.coral,
  cultureAccent: CultureTokens.gold,
  cultureHighlight: CultureTokens.teal,
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
   * CulturePass Signature Gradient
   * Use for: hero banners, onboarding, flagship CTAs
   * Transitions from Culture Indigo → Festival Saffron → Movement Coral
   */
  culturepassBrand: [
    CultureTokens.indigo,
    CultureTokens.coral,
  ] as [string, string],

  /** CulturePass Signature Gradient (reversed: Coral → Indigo) */
  culturepassBrandReversed: [
    CultureTokens.coral,
    CultureTokens.indigo,
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

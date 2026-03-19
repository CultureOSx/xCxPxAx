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
 *   ✓ White-first marketplace surfaces for the current product direction
 *   ✓ Warm discovery + action-oriented CTAs
 *   ✓ Cultural authenticity over tech-startup aesthetics
 *   ✓ Accessible contrast ratios (WCAG AA minimum)
 *
 * Usage:
 *   import { useColors } from '@/hooks/useColors';
 *   const colors = useColors(); // Runtime theme access
 */

import { Platform } from "react-native";

export interface ShadowStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
  boxShadow?: string;
}

/**
 * Cultural Brand Tokens
 * Use these for primary interactions and cultural markers.
 */
export const CultureTokens = {
  // Core brand palette
  indigo: "#0066CC",        // CulturePass Blue — primary brand
  saffron: "#FFCC00",       // CulturePass Yellow — discovery warmth
  coral: "#FF5E5B",         // Movement Coral — action energy
  gold: "#FFC857",          // Temple Gold — cultural premium
  teal: "#2EC4B6",          // Ocean Teal — global belonging

  // Functional overrides
  event: "#FFCC00",         // Events use Saffron
  eventSoft: "#FFE1CC",     // Event background tint
  artist: "#FF5E5B",        // Artists use Coral
  artistSoft: "#FFD6D5",    // Artist background tint
  venue: "#2EC4B6",         // Venues use Teal
  venueSoft: "#D7F5F1",     // Venue background tint
  movie: "#FFC857",         // Movies use Gold
  movieSoft: "#FFF3CC",     // Movie background tint
  community: "#3A86FF",     // Community use Bright Blue
  communitySoft: "#DCE8FF", // Community background tint

  // Status overrides
  success: "#2EC4B6",       // Success = Teal
  warning: "#FFC857",       // Warning = Gold
  error: "#FF5E5B",         // Error = Coral
  info: "#3A86FF",          // Info = Blue
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

  gold: "#FFCC00", // Apple Yellow

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

  // Backgrounds - Web-first clean light canvas
  background: "#FFFFFF",
  backgroundSecondary: "#FFFFFF",

  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceSecondary: "#FFFFFF",

  border: "#E6D3B3",
  borderLight: "#F0E8DC",
  divider: "#E6D3B3",

  text: "#1B0F2E",
  textSecondary: "#4A4A4A",
  textTertiary: "#8D8D8D",
  textInverse: "#FFFFFF",

  card: "#FFFFFF",
  cardBorder: "#E6D3B3",

  tabBar: "rgba(255,255,255,0.98)",
  tabBarBorder: "rgba(230,211,179,0.5)",
  tabIconDefault: "#8D8D8D",
  tabIconSelected: CultureTokens.saffron,

  tint: CultureTokens.indigo,

  // Cultural brand tokens
  cultureBrand: CultureTokens.indigo,
  culturePrimary: CultureTokens.saffron,
  cultureSecondary: CultureTokens.coral,
  cultureAccent: CultureTokens.gold,
  cultureHighlight: CultureTokens.teal,
};

/**
 * Dark Theme Tokens
 * Kept for compatibility and explicitly opt-in experiences only.
 *
 * Color hierarchy:
 *   Deep Space (#0B0B14) — primary background
 *   Midnight Plum (#1B0F2E) — secondary surfaces
 *   Rich Purple (#22203A) — card/component surfaces
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

  // Backgrounds - CulturePass Dark Palette (Navy Blue)
  background: "#060C16",       // Deep Navy — primary background
  backgroundSecondary: "#0A1628", // Dark Navy

  surface: "#0E2040",          // Navy — cards
  surfaceElevated: CultureTokens.indigo, // CulturePass Blue — active surfaces
  surfaceSecondary: "#003F80",

  border: "#0D2847",           // Navy border
  borderLight: "#1A3D60",      // Light navy border for dividers
  divider: "#0D2847",

  text: "#FFFFFF",             // Primary text
  textSecondary: "#C9C9D6",    // Secondary text
  textTertiary: "#8D8D8D",     // Muted text
  textInverse: "#0B0B14",

  card: "#22203A",
  cardBorder: "#2A2747",

  tabBar: "rgba(11, 11, 20, 0.95)",
  tabBarBorder: "rgba(42, 39, 71, 0.4)",
  tabIconDefault: "#8D8D8D",
  tabIconSelected: CultureTokens.saffron,

  tint: CultureTokens.indigo,

  // Cultural brand tokens
  cultureBrand: CultureTokens.indigo,
  culturePrimary: CultureTokens.saffron,
  cultureSecondary: CultureTokens.coral,
  cultureAccent: CultureTokens.gold,
  cultureHighlight: CultureTokens.teal,
};

export const shadows = {
  small: Platform.select({
    web: { boxShadow: '0px 1px 5px rgba(0,0,0,0.04)' },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
  }) as ShadowStyle,

  medium: Platform.select({
    web: { boxShadow: '0px 2px 12px rgba(0,0,0,0.08)' },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  }) as ShadowStyle,

  large: Platform.select({
    web: { boxShadow: '0px 4px 24px rgba(0,0,0,0.12)' },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
  }) as ShadowStyle,

  heavy: Platform.select({
    web: { boxShadow: '0px 8px 36px rgba(0,0,0,0.16)' },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 10,
    },
  }) as ShadowStyle,
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
    CultureTokens.saffron,
    CultureTokens.coral,
  ] as [string, string, string],

  /** CulturePass Signature Gradient (reversed: Coral → Saffron → Indigo) */
  culturepassBrandReversed: [
    CultureTokens.coral,
    CultureTokens.saffron,
    CultureTokens.indigo,
  ] as [string, string, string],

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

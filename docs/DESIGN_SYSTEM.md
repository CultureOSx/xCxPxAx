# CulturePass — Design System

> **Authoritative design reference for all engineers and AI agents.**
> Supersedes STYLE_GUIDE.md where values conflict.
> Source of truth for tokens: `constants/` — never duplicate values here, always reference them.

---

## 1. Brand Identity

### Mission
CulturePass celebrates the full mosaic of cultures that make Australia and the diaspora cities extraordinary. The visual language is warm, confident, and culturally rooted — not corporate, not generic.

### Five Core Brand Tokens

| Token | Hex | Meaning | When to use |
|---|---|---|---|
| `CultureTokens.indigo` | `#0066CC` | Trust, platform identity, primary CTAs | Buttons, active states, links, profile surfaces |
| `CultureTokens.coral` | `#FF5E5B` | Action energy, movement, urgency | Alerts, secondary CTAs, live badges, danger actions |
| `CultureTokens.gold` | `#FFC857` | Cultural premium, Temple Gold, CulturePass+ | Premium badges, indigenous content, membership tiers |
| `CultureTokens.teal` | `#2EC4B6` | Global belonging, venues, free | Free event badges, venue accent, belonging/success |
| `CultureTokens.purple` | `#AF52DE` | Community, creativity | Community rail, secondary tags, movie category |

**Import**: `import { CultureTokens } from '@/constants/colors';`
**Rule**: Never hardcode hex. If none of these tokens fits, use `useColors()`.

### Brand Gradient Signature

```typescript
import { gradients } from '@/constants/colors';

// Primary brand gradient — indigo → coral
gradients.culturepassBrand   // ['#0066CC', '#FF5E5B']

// Reversed — coral → indigo (for variety)
gradients.culturepassBrandReversed

// Use on: hero overlays, gradient buttons, brand wordmark backgrounds
```

---

## 2. Colour System

> Access via `useColors()` hook — **never** hardcode any value from this section.

### Light Theme

| Token | Value | Usage |
|---|---|---|
| `primary` | `#0066CC` | Primary CTAs, active states |
| `primaryLight` | `#3385D6` | Hover states, lighter accents |
| `primaryDark` | `#004EA8` | Pressed states, dark accents |
| `primaryGlow` | `rgba(0,102,204,0.12)` | Selected card BG, chip active BG |
| `primarySoft` | `rgba(0,102,204,0.06)` | Subtle tinted areas |
| `secondary` | `#5856D6` | Purple accent — communities, tags |
| `accent` | `#FF9500` | Orange — highlights, new badges |
| `gold` | `#FFCC00` | Premium glow |
| `background` | `#F7F9FC` | Screen background |
| `backgroundSecondary` | `#EEF3FA` | Secondary screen BG |
| `surface` | `#FFFFFF` | Cards, panels |
| `surfaceElevated` | `#F3F7FF` | Elevated surfaces |
| `surfaceSecondary` | `#E9F0FA` | Chip BG, badge BG |
| `border` | `#D7E1EE` | Standard borders |
| `borderLight` | `#C7D5E7` | Subtle borders |
| `divider` | `#D7E1EE` | Horizontal dividers |
| `text` | `#0F172A` | Primary text |
| `textSecondary` | `#334155` | Secondary text |
| `textTertiary` | `#64748B` | Placeholder, timestamps, captions |
| `card` | `#FFFFFF` | Card backgrounds |
| `cardBorder` | `#D7E1EE` | Card borders |

### Dark Theme ("Night Festival" — OLED Optimised)

| Token | Value | Usage |
|---|---|---|
| `background` | `#000000` | OLED black base |
| `backgroundSecondary` | `#0A0E14` | Secondary areas |
| `surface` | `#121826` | Card surfaces |
| `surfaceElevated` | `#0066CC` | Active/elevated surfaces (brand blue!) |
| `surfaceSecondary` | `#0F2844` | Secondary surface areas |
| `border` | `#1A2436` | Standard borders |
| `borderLight` | `#243045` | Subtle borders |
| `text` | `#F4F4F5` | Primary text |
| `textSecondary` | `#C9C9D6` | Secondary text |
| `textTertiary` | `#8D8D8D` | Placeholder, timestamps |
| `card` | `#151C2E` | Card backgrounds |

> **Dark mode tip**: In dark mode, `surfaceElevated` is the brand blue (#0066CC). Use it sparingly for truly elevated active surfaces.

### Category Colours

```typescript
import { CategoryColors } from '@/constants/colors';

CategoryColors.music      // #FF6B6B (red-coral)
CategoryColors.dance      // #4ECDC4 (teal)
CategoryColors.food       // #FF9500 (orange)
CategoryColors.art        // #A855F7 (purple)
CategoryColors.wellness   // #FF3B30 (red)
CategoryColors.movies     // #5AC8FA (sky blue)
CategoryColors.workshop   // #FF9500 (orange)
CategoryColors.heritage   // #8B6914 (warm brown)
CategoryColors.activities // #EC4899 (pink)
CategoryColors.nightlife  // #6366F1 (indigo)
CategoryColors.comedy     // #F59E0B (amber)
CategoryColors.sports     // #EF4444 (red)
CategoryColors.artists    // #FBBF24 (gold)
CategoryColors.shopping   // #AF52DE (purple)
```

### Semantic Colours

Use `useColors()` for all semantic tokens:
- `colors.error` / `colors.warning` / `colors.success` / `colors.info`

### Glass Morphism Tokens

```typescript
import { glass } from '@/constants/colors';

glass.light     // rgba(255,255,255,0.72) bg — use on light mode overlays
glass.dark      // rgba(28,28,30,0.72) bg — use on dark mode overlays
glass.overlay   // rgba(0,0,0,0.4) — scrim overlays
glass.ultraLight // rgba(255,255,255,0.85) — lighter variant
```

---

## 3. Typography

> Source: `constants/typography.ts` — import `TextStyles` from `constants/theme.ts`

### Text Style Reference

| Style | Weight | Size | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display` | Bold 700 | 32px | 40px | -0.5 | Marketing heroes, splash screens |
| `hero` | Bold 700 | 28px | 36px | -0.5 | Primary hero headings |
| `title` | Bold 700 | 24px | 32px | -0.5 | Screen-level headings |
| `title2` | Bold 700 | 20px | 28px | -0.5 | Section headings, modal titles |
| `title3` | SemiBold 600 | 18px | 28px | 0 | Card headers, sub-section titles |
| `headline` | SemiBold 600 | 16px | 24px | 0 | List item titles |
| `body` | Regular 400 | 16px | 24px | 0 | Body copy (primary reading) |
| `bodyMedium` | Medium 500 | 16px | 24px | 0 | Emphasized body |
| `callout` | Regular 400 | 15px | 22px | 0 | Supporting text, callouts |
| `cardTitle` | SemiBold 600 | 14px | 20px | 0 | Card titles (compact) |
| `cardBody` | Regular 400 | 14px | 20px | 0 | Card body (compact) |
| `label` | Medium 500 | 14px | 20px | 0 | Form labels, row labels |
| `labelSemibold` | SemiBold 600 | 14px | 20px | 0 | Active/selected labels |
| `chip` | Medium 500 | 13px | 20px | 0 | Filter chips, category pills |
| `caption` | Regular 400 | 12px | 16px | 0 | Timestamps, secondary metadata |
| `captionSemibold` | SemiBold 600 | 12px | 16px | 0 | Counted items, emphasis captions |
| `badge` | SemiBold 600 | 11px | 16px | 0.3 | Notification dots, status badges |
| `badgeCaps` | SemiBold 600 | 11px | 16px | 1.2 | ALL CAPS labels (LIVE, RSVP, SYD) |
| `tabLabel` | SemiBold 600 | 10px | 12px | 0 | Tab bar labels only |

### Desktop Overrides

On web at ≥1024px, typography scales up:
- `display`: 40px / 52lh
- `hero`: 36px / 44lh
- `title`: 28px / 36lh
- `title2`: 24px / 32lh

### Usage Rules

- **Screen titles**: `TextStyles.title` (24px Bold) in tab headers
- **Section headers**: `TextStyles.title2` (20px Bold) — see SectionTokens
- **Card titles**: `TextStyles.cardTitle` (14px SemiBold) for compact cards
- **Body copy**: `TextStyles.body` (16px Regular) for all reading text
- **ALL CAPS labels**: `TextStyles.badgeCaps` + uppercase transform
- **Never mix font families** — Poppins only, weight via TextStyles

---

## 4. Spacing System

> Source: `constants/spacing.ts` — import from `constants/theme.ts`

### Spacing Scale (4-point grid)

| Token | Value | Usage |
|---|---|---|
| `Spacing.xs` | 4px | Icon-text micro gaps |
| `Spacing.sm` | 8px | Small gaps, inner padding |
| `Spacing.md` | 16px | Base spacing — card padding, list gaps |
| `Spacing.lg` | 24px | Large section gaps |
| `Spacing.xl` | 32px | Section-to-section spacing |
| `Spacing.xxl` | 40px | Major separations |
| `Spacing.xxxl` | 48px | Screen-level spacing |

### Layout Constants

| Token | Value | Usage |
|---|---|---|
| `LayoutRules.screenHorizontalPadding` | 16px | All screen horizontal padding |
| `LayoutRules.cardPaddingMin` | 16px | Card inner padding (min) |
| `LayoutRules.cardPaddingMax` | 20px | Card inner padding (max, large cards) |
| `LayoutRules.sectionSpacing` | 32px | Between screen sections |
| `LayoutRules.iconTextGap` | 8px | Gap between icon and its label |
| `LayoutRules.betweenCards` | 16px | Gap between adjacent cards |
| `LayoutRules.buttonHeight` | 52px | All button heights |
| `LayoutRules.borderRadius` | 16px | Standard border radius |

### Border Radius

**Standard radius is 16px across the entire product.**

| Token | Value | Usage |
|---|---|---|
| `Radius.md` | 16px | **All** cards, buttons, inputs |
| `Radius.xl` | 16px | Large panels (same — 16px standard) |
| `SheetTokens.borderRadius` | 24px | Bottom sheets, drawers only |
| `LiquidGlassTokens.corner.mainCard` | 28px | LiquidGlassPanel main cards |
| `Radius.full` | 9999px | Pills (chips, avatars, badge counts) |

> **Rule**: Use 16px everywhere except: bottom sheets (24px), LiquidGlass cards (28px), and pills (9999px). Never use 4/8/12px radius.

### Breakpoints

| Name | Width | Layout |
|---|---|---|
| Mobile | < 768px | Single col, 16px hPad, bottom tabs |
| Tablet | 768–1023px | 2–3 col, 24px hPad, bottom tabs |
| Desktop | ≥ 1024px | Sidebar 240px + main col, 32px hPad |

```typescript
import { useLayout } from '@/hooks/useLayout';

const { isDesktop, isTablet, isMobile, numColumns, hPad, sidebarWidth } = useLayout();
// Always use this — never inline breakpoint checks
```

---

## 5. Elevation & Shadows

> Source: `constants/elevation.ts` — import `ElevationAlias` from `constants/theme.ts`

| Level | Alias | Value | Usage |
|---|---|---|---|
| 0 | `flat` | none | Flat surfaces, backgrounds |
| 1 | `card` | `0 1px 3px rgba(0,0,0,0.04)` | Cards at rest, list rows |
| 2 | `cardRaised` | `0 2px 8px rgba(0,0,0,0.07)` | Focused/active/hovered cards |
| 3 | `sticky` | `0 4px 14px rgba(0,0,0,0.10)` | Sticky headers, floating bars |
| 4 | `sheet` | `0 8px 24px rgba(0,0,0,0.14)` | Bottom sheets, drawers |
| 5 | `popover` | `0 16px 40px rgba(0,0,0,0.18)` | Toasts, tooltips, popovers |

**Dark mode**: multiply shadow opacity by ~3× (`isDark ? 0.42 : 0.14`).

---

## 6. Component Token Reference

> Source: `constants/theme.ts`

### Buttons

```
Height: 52px (ALL sizes — sm/md/lg)
Border radius: 16px (standard), 9999px (pill variant)
Font: Poppins_600SemiBold
Font sizes: sm=14px, md=15px, lg=16px
Horizontal padding: sm=16px, md=20px, lg=28px
Icon gap: 8px
```

**Variants**:
- `primary` — `colors.primary` bg, white text
- `secondary` — `colors.primaryGlow` bg, `colors.primary` text, primary border
- `ghost` — transparent bg, `colors.text` text, `colors.border` border
- `danger` — `CultureTokens.coral` bg, white text
- `gold` — `CultureTokens.gold` bg, dark text
- `gradient` — `gradients.culturepassBrand` by default

### Inputs

```
Height: 48px (default), 44px (search variant)
Border radius: 16px
Font: Poppins_400Regular 16px
Horizontal padding: 16px, Vertical padding: 12px
Icon size: 20px, Icon gap: 8px
Focus border: colors.primary
Error border: colors.error
```

### Cards

```
Border radius: 16px (standard), 20px (feature/large)
Inner padding: 16px (min), 20px (max)
Image height: 120px (mobile), 140px (tablet), 160px (desktop)
Gap between cards: 16px
Shadow: ElevationAlias.card at rest
```

### Chips / Filter Pills

```
Height: 36px
Horizontal padding: 16px, Vertical padding: 8px
Border radius: 9999px (pill)
Font: Poppins_500Medium 13px
Gap between chips: 8px
Active bg: colors.primaryGlow
Active text: colors.primary
```

### Avatars

```
Sizes: xs=24, sm=32, md=40, lg=56, xl=72, xxl=96 (px)
Border radius: 9999px (always circular)
Badge size: 12px
```

### Section Headers

```
Title: Poppins_700Bold 20px / 28lh
Icon: 22px
Vertical padding: 8px
Horizontal padding: 16px
Section spacing: 32px between sections
```

### Bottom Sheets / Modals

```
Border radius: 24px (top corners)
Handle: 40×4px, rgba(0,0,0,0.2), centered
Header height: 56px
```

---

## 7. Animation Standards

> Source: `constants/animations.ts`

### Duration Scale

| Token | Value | Usage |
|---|---|---|
| `Duration.instant` | 100ms | Toggles, checkboxes, micro-interactions |
| `Duration.fast` | 200ms | Chips, buttons, quick state changes |
| `Duration.normal` | 300ms | Cards, panels, standard transitions |
| `Duration.slow` | 500ms | Full-screen overlays, modals |
| `Duration.stagger` | 60ms | Per-item delay for list entry animations |

### Spring Presets

```typescript
import { SpringConfig } from '@/constants/animations';

SpringConfig.snappy   // { damping: 15, stiffness: 200, mass: 0.8 } — buttons, chips
SpringConfig.smooth   // { damping: 20, stiffness: 120, mass: 1 }   — card transitions
SpringConfig.bouncy   // { damping: 12, stiffness: 150, mass: 0.6 } — bouncy cards
SpringConfig.gentle   // { damping: 25, stiffness: 80, mass: 1.2 }  — gentle settling
```

### Standard Entry Animation (Lists)

```typescript
// Apply to every list/grid item
entering={FadeInDown.delay(index * Duration.stagger).springify()}
```

### Reduce Motion

Always gate animations:
```typescript
import { prefersReducedMotion } from '@/constants/animations';

entering={prefersReducedMotion ? undefined : FadeInDown.delay(index * 60)}
```

---

## 8. Glass Morphism (LiquidGlassPanel)

> Component: `components/onboarding/LiquidGlassPanel.tsx`

### When to Use Glass vs Solid

| Situation | Use |
|---|---|
| Header / sticky bars | Glass (blur) |
| Content cards on a coloured/image BG | Glass |
| Content cards on plain surface BG | Solid (`colors.card`) |
| Floating action buttons | Glass |
| Bottom sheet handles | Glass |
| Data tables, settings rows | Solid |

### Corner Radius Tokens for LiquidGlass

```typescript
import { LiquidGlassTokens } from '@/constants/theme';

LiquidGlassTokens.corner.mainCard   // 28px — primary glass cards
LiquidGlassTokens.corner.innerRow   // 18px — rows inside a glass card
LiquidGlassTokens.corner.valueRibbon // 16px — value strips
```

---

## 9. Dark Mode Rules

1. **OLED base**: `colors.background = #000000` in dark — never use `#1C1C1E` as a base.
2. **Surface hierarchy**: background → surface (#121826) → card (#151C2E)
3. **Elevated active surface**: `colors.surfaceElevated = #0066CC` (brand blue) — use for active/selected state surfaces only.
4. **Shadow opacity**: multiply by 3× in dark (`isDark ? 0.42 : 0.14`).
5. **Border opacity**: borders are very subtle in dark (`#1A2436`) — don't add extra borders.
6. **Premium dark**: use `colors.surface` (#121826) — NOT hardcoded `#1C1C1E`, `#2C2C2E`, `PREMIUM_BLACK`, etc.

```typescript
// Always theme-aware:
const isDark = useIsDark();
const colors = useColors();

// Shadow pattern:
shadowOpacity: isDark ? 0.42 : 0.14,
```

---

## 10. Platform Parity Rules

### Web Top Inset — CRITICAL

```typescript
// ✅ CORRECT:
const topInset = Platform.OS === 'web' ? 0 : insets.top;

// ❌ WRONG (dead code from old top bar):
const topInset = Platform.OS === 'web' ? 67 : insets.top;
```

### Layout Shell

| Platform | Navigation | Top inset |
|---|---|---|
| iOS native | Bottom tab bar (84px glass) | `insets.top` |
| Android native | Bottom tab bar (84px) | `insets.top` |
| Web tablet (768–1023px) | Bottom tab bar | `0` |
| Web desktop (≥1024px) | Sidebar 240px | `0` |

```typescript
const { isDesktop, sidebarWidth } = useLayout();
// sidebarWidth = 240 on desktop web, 0 everywhere else
```

### Platform-Specific Patterns

| Feature | iOS | Android | Web |
|---|---|---|---|
| Blur | `BlurView` | `rgba()` fallback | `backdrop-filter` via LiquidGlassPanel |
| Icons | SF Symbols (iOS 16+) + Ionicons fallback | Ionicons | Ionicons |
| Haptics | `expo-haptics` full | `expo-haptics` full | silent no-op |
| Shadow | `boxShadow` RN syntax | `boxShadow` RN syntax | CSS `boxShadow` |

---

## 11. Accessibility

- **Touch targets**: minimum 44×44pt. Add `hitSlop={12}` on small icons.
- **Colour contrast**: body text ≥ 7:1 (WCAG AAA), UI controls ≥ 4.5:1 (WCAG AA).
- **Labels**: all `Pressable` elements need `accessibilityLabel` + `accessibilityRole`.
- **Reduce motion**: gate all Reanimated animations with `prefersReducedMotion`.
- **Tab order**: logical reading order on web; test with keyboard navigation.

---

## 12. Screen Anatomy (Standard Layout)

```
┌────────────────────────────────────────┐
│  [Platform safe area top]              │
│  ─────────────────────────────────     │
│  Header (TabPrimaryHeader or           │
│           ProfileHeaderBar or          │
│           custom)                      │
│  ─────────────────────────────────     │
│  [Optional: FilterChips row — 36px]    │
│  ─────────────────────────────────     │
│                                        │
│  Content area (ScrollView / FlatList)  │
│  hPad: 16px (mobile) → 32px (desktop) │
│  Section spacing: 32px between groups  │
│                                        │
│  ─────────────────────────────────     │
│  [Bottom padding: 84px + insets.bottom │
│   to clear tab bar]                    │
└────────────────────────────────────────┘
```

### One Primary CTA Per Screen

- Never show two solid `primary` buttons simultaneously.
- If two actions are needed: primary (solid indigo) + secondary (outlined/ghost).
- Destructive actions: `danger` variant — **never** in the primary position.

---

## 13. Do / Don't Summary

### DO
- `import { CultureTokens, gradients, glass } from '@/constants/colors'` for brand values
- `useColors()` for all functional UI colors
- `useLayout()` for all responsive values (never hardcode widths/padding)
- `TextStyles.*` for all text — never raw `fontFamily` / `fontSize` in components
- `Spacing.*` for all gaps — never arbitrary pixel values
- `ElevationAlias.*` or `shadows.*` for all shadows
- `LiquidGlassPanel` for header bars, floating surfaces, premium card sections
- `Image` from `expo-image` — never from `react-native`
- `api.*` from `lib/api.ts` for all network calls
- `<ErrorBoundary>` around every screen with network calls

### DON'T
- Hardcode any hex color (`#007AFF`, `#1C1C1E`, `PREMIUM_BLACK`, etc.)
- Use `Platform.OS === 'web' ? 67 : insets.top` — web top inset is **always 0**
- Import from individual `constants/*.ts` — use `constants/theme.ts` as the single entry point
- Use `any` type in style-adjacent code
- Create `StyleSheet.create()` inside render functions — always at module level
- Add decorative gradients/blobs that don't serve the content
- Use `console.log` in production paths — wrap in `if (__DEV__)`

---

## 14. Related Documents

- [`docs/DESIGN_PRINCIPLES.md`](./DESIGN_PRINCIPLES.md) — Five core laws (Cultural Minimalism, Token Integrity, Platform Parity, Approachable Complexity, Technical Craftsmanship)
- [`docs/SCREEN_TEMPLATES.md`](./SCREEN_TEMPLATES.md) — 8 layout templates mapping every screen type
- [`docs/DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) — Raw token listings (legacy reference)
- [`culturepass-rules.md`](../culturepass-rules.md) — NEVER/ALWAYS coding rules
- [`CLAUDE.md`](../CLAUDE.md) — Full architecture, routing, API patterns

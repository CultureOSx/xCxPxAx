# CulturePass Design Manual (2026)

**Version**: 1.0 (April 2026)
**Generated from**: ui-ux-pro-max design system + project AGENTS.md / CLAUDE.md
**Core Aesthetic**: "Night Festival" — Dark mode default with Liquid Glass surfaces, cultural vibrancy, elegant typography, and global belonging.

This manual synthesizes the persisted `design-system/culturepass-2026/MASTER.md` with project-specific rules. **Page-specific overrides** live in `design-system/pages/[page].md` (check there first).

## 1. Color Palette (Updated 2026)

Blended the ui-ux-pro-max recommendation (purple/green for cultural identity) with existing CultureTokens. Dark-first with light mode support.

### Core Brand Tokens (`CultureTokens`)
- **Primary (Indigo/Violet)**: `#7C3AED` (new from skill — replaces #0066CC for richer cultural depth)
- **Accent (Coral)**: `#FF5E5B` (movement, action, emotion)
- **Highlight (Gold)**: `#FFC857` (premium, discovery, warmth)
- **Belonging (Teal)**: `#2EC4B6` (global, trust, ocean)
- **CTA (Emerald Green)**: `#22C55E` (join, success, growth — from skill)
- **Community Purple**: `#AF52DE` (identity, diaspora connection)

### Functional Colors
- **Background (Dark)**: `#0A0A12` (midnight OLED base)
- **Surface**: `#121826` (lifted navy for cards/glass)
- **Surface Elevated**: `#1C2436` (glass panels)
- **Text**: `#F4F4F5` (primary), `#C9C9D6` (secondary), `#8D8D8D` (tertiary)
- **Borders**: `rgba(255,255,255,0.08)` (glass), `rgba(255,255,255,0.35)` (active)
- **Success**: `#22C55E`
- **Error**: `#FF5E5B`
- **Warning**: `#FFC857`

**Light Mode Variant** (for web/light toggle):
- Background: `#FAF5FF` (skill recommendation)
- Surface: `#FFFFFF`
- Text: `#4C1D95` (deep purple)

**Gradients** (update in `constants/theme.ts`):
- `culturepassBrand`: [`#7C3AED`, `#22C55E`] (purple to green — cultural growth)
- `midnight`: [`#0A0A12`, `#1C2436`]
- `hero`: [`#7C3AED20`, `transparent`]

**Usage Rule**: Never hardcode hex. Always use `useColors()` or `CultureTokens`. See `constants/theme.ts` for full `ColorTheme`.

## 2. Liquid Glass System

**Core Component**: `LiquidGlassPanel` (`components/onboarding/LiquidGlassPanel.tsx`)

**Tokens** (`constants/theme.ts:LiquidGlassTokens`):
- `corner.mainCard`: 28
- `corner.innerRow`: 18
- `blurFallback.ios`: 80
- `blurFallback.android`: 40
- `blurFallback.webPx`: 44

**Implementation**:
- iOS: `expo-glass-effect` (when available) or `expo-blur`
- Android: Material blur + translucency
- Web: `backdrop-filter: blur(44px) saturate(175%)` + `rgba` fallback
- Border: `rgba(255,255,255,0.06-0.35)` (darker = deeper glass)
- Background: `rgba(28,28,30,0.72)` (dark) or `rgba(255,255,255,0.72)` (light)

**Usage Example**:
```tsx
<LiquidGlassPanel borderRadius={28} bordered>
  <Text>Glass content with blur and border</Text>
</LiquidGlassPanel>
```

**Effects**:
- Morphing SVG for avatars/badges
- Fluid 400-600ms transitions (`spring` easing)
- Iridescent highlights on active states (neon glow with teal/coral)
- Chromatic aberration on hero images (subtle)

## 3. Typography

**Primary**: Poppins (project standard — scale from `constants/typography.ts`)
- Headings: 700 Bold, letter-spacing -0.8 to -1.2
- Body: 400 Regular, 500 Medium for labels
- Captions: 13px with 1.5 letter-spacing for badges

**Secondary (Cultural)**: Noto Serif/Sans (from skill) for headings in cultural sections or multilingual content. Import via Google Fonts for web.

**Rules**:
- Never use system fonts for brand text.
- Dynamic Type support on iOS.
- Line heights: 1.4 for body, 1.1 for headings.
- RTL support for Arabic/Hebrew diaspora users.

## 4. Layout & Spacing (4-point grid)

- `--space-xs`: 4px (tight gaps)
- `--space-sm`: 8px (icons)
- `--space-md`: 16px (standard padding)
- `--space-lg`: 24px (sections)
- `--space-xl`: 32px (hero, large gaps)
- `--space-2xl`: 48px (between major sections)
- Touch targets: Minimum 52px (Apple HIG)
- Card radius: 24-28px
- Hero height: 280-320px on mobile

**Desktop Rules** (from project):
- Sidebar: 240px
- Top inset: 0 on web
- Max content width: 720-1024px centered
- Split layouts for edit/preview screens (profile/edit, submit/workspace)

**Responsive Breakpoints**:
- Mobile: 375px+
- Tablet: 768px (bottom tabs persist)
- Desktop: 1024px (sidebar appears)

## 5. Component Library (Updated)

**Buttons**:
- Primary: Emerald green (#22C55E), 56px height, 999 border-radius for pill shape.
- Secondary: Glass outline with indigo border.
- Glass variant: Translucent with blur, neon glow on press.

**Cards/Sections**: Always `LiquidGlassPanel` or `Card glass`. No flat colors.

**Inputs**: Glass border (1px rgba white 0.2), 56px height, focus with violet glow (#7C3AED20).

**Avatars**: Circular with 3px glass ring, morphing upload badge.

**Tabs**: Glass segmented control with active fill (indigo to emerald gradient).

**Navigation**: Floating glass bar (top-4 on mobile, sidebar on desktop).

**Toasts**: Glass with emerald success or coral error.

## 6. UX Guidelines (from skill + project)

- **Hero**: Community value prop ("Connect with your culture"), member count, easy "Join" CTA.
- **Forms**: Associated labels (no placeholder-only), loading/success feedback, character counts, live preview for profile edit.
- **Accessibility**: 4.5:1 contrast, alt text, focus states, `prefers-reduced-motion`, VoiceOver/TalkBack labels.
- **Interaction**: `cursor-pointer` on web, smooth 200ms transitions, haptics on native, no layout shift on hover.
- **Dark Mode First**: OLED-friendly blacks, layered glass surfaces, vibrant accents for cultural vibrancy.
- **Cultural Authenticity**: Use community photos, topic badges in brand colors, activity indicators (green for momentum).
- **Onboarding**: Acknowledgement of Country, location/council selection, interest chips with glass style.

**Anti-Patterns** (strictly avoid):
- Vibrant block-based layouts
- Playful colors without cultural meaning
- Emojis as icons (use Ionicons/SVG)
- Missing cursor-pointer or hover feedback
- Low contrast text in light mode
- Instant state changes or slow animations (>500ms)
- Invisible focus states
- Content hidden behind fixed elements
- Horizontal scroll on mobile

## 7. Implementation Roadmap for May 15 Launch

**Phase 1 (Apr 16-20)**: Integrate new palette and manual into `constants/*` and docs. Update key screens (profile/edit, admin/dashboard, workspace, community detail, onboarding).

**Phase 2 (Apr 21-28)**: Apply Liquid Glass across all major flows (discover rails, event detail, tabs shell, settings). Add live preview to profile edit and workspace.

**Phase 3 (Apr 29-May 5)**: Polish (animations, haptics, accessibility audit, responsive testing on iOS/Android/Web). Update AGENTS.md/CLAUDE.md with new manual.

**Phase 4 (May 6-10)**: QA (`npm run qa:solid`), beta builds (EAS), internal testing.

**Phase 5 (May 11-15)**: App Store / Play Store submission (beta first, then production). Web deploy via `npm run deploy-web`.

**Realistic Note**: A full "from ground up" rewrite is not feasible in 30 days without losing existing functionality and months of work. This focused evolution of the existing codebase with the new design system will deliver a significantly improved app ready for stores by mid-May.

## 8. Usage

1. Read this manual before any UI work.
2. For new pages, check `design-system/pages/[page].md` first (overrides).
3. Always use `useColors()`, `LiquidGlassPanel`, and project components (`Button`, `Card`, `ErrorBoundary`).
4. Test on iOS, Android, and Web.
5. Run `npm run qa:solid` before PRs.

**Related Docs**: [`AGENTS.md`](../AGENTS.md), [`CLAUDE.md`](../CLAUDE.md), [`constants/theme.ts`](../constants/theme.ts), [`design-system/culturepass-2026/MASTER.md`](design-system/culturepass-2026/MASTER.md).

**Last Updated**: April 16, 2026
**Author**: Grok (following ui-ux-pro-max skill)

# CulturePass Brand Audit Log

**Last Updated:** 2026-03-29
**Source of Truth:** `/docs/BRAND_GUIDELINES.md` (single source of truth)

This document tracks the brand compliance audit for every major route in `app/`.
All screens must follow **Token Integrity**, **Cultural Minimalism**, **Platform Parity**, and **Approachable Complexity** (max **one** primary indigo button per screen).

**Audit Status Legend**
- ✅ Fully Compliant
- ⚠️ Minor Issues (needs fix)
- ❌ Major Violations (must fix before merge)
- ⏳ Not Audited Yet

---

## 1. Layout & Global Files

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/_layout.tsx` | 2026-03-29 | ✅ | Correct `Platform.OS === 'web' ? 0` topInset (line 163). Proper `useColors()` usage. All imports from `@/constants/theme`. |
| `app/(tabs)/_layout.tsx` | 2026-03-29 | ✅ | Clean tab routing. No token violations. |
| `app/+not-found.tsx` | — | ⏳ | Not audited |
| `app/+html.tsx` | — | ⏳ | Not audited |

---

## 2. High-Traffic & Root Screens

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/(tabs)/index.tsx` (Discover) | 2026-03-29 | ✅ | `CultureTokens` from `@/constants/theme`. `useColors()` + `useLayout()` correct. No raw hex in JSX. |
| `app/events.tsx` | 2026-03-29 | ✅ | `CultureTokens.indigo` used properly. `Platform.OS === 'web' ? 0` correct (lines 163–164). Accessibility labels on filter chips (lines 286–340). |
| `app/landing.tsx` | 2026-03-29 | ⏳ | File not found — confirm path or remove from audit |
| `app/map.tsx` | 2026-03-29 | ✅ | `Image` from `expo-image` (line 2). `CultureTokens` throughout. No raw hex in styles. |
| `app/search/index.tsx` | 2026-03-29 | ⏳ | File not found at expected path |

---

## 3. Tab Screens (Core Navigation)

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/(tabs)/feed.tsx` | 2026-03-29 | ✅ | `CultureTokens` from theme (line 21). `Platform.OS === 'web' ? 0` correct (line 38). `__DEV__` guard on console (line 90). |
| `app/(tabs)/community.tsx` | 2026-03-29 | ✅ | `CultureTokens` + `webShadow` from theme (line 23). Proper `useColors()` usage. |
| `app/(tabs)/profile.tsx` | 2026-03-29 | ✅ | All imports from `@/constants/theme`. `__DEV__` guard on console (line 507). |
| `app/(tabs)/directory.tsx` | 2026-03-29 | ✅ | `CultureTokens` + `EntityTypeColors` from theme (line 17). `useColors()` correct. |
| `app/(tabs)/calendar.tsx` | 2026-03-29 | ✅ | `CultureTokens` + `webShadow` from theme (line 10). `Platform.OS === 'web' ? 0` correct (line 38). |
| `app/(tabs)/explore.tsx` | 2026-03-29 | ✅ | `CultureTokens` all variants used. `Image` from `expo-image` (line 6). |
| `app/(tabs)/perks.tsx` | 2026-03-29 | ⏳ | File too large to fully audit — targeted grep needed |
| `app/(tabs)/dashboard.tsx` | 2026-03-29 | ✅ | Simple redirect component. No style violations. |

---

## 4. Detail & Dynamic Pages

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/event/[id].tsx` | 2026-03-29 | ✅ | ~~TextStyles sub-import~~ fixed → `@/constants/theme`. ~~`#4285F4`/`#0078D4`~~ extracted to `GOOGLE_BRAND_COLOR`/`OUTLOOK_BRAND_COLOR` constants. Single primary CTA. ✅ `expo-image`, `useColors()`, topInset correct. |
| `app/venue/[id].tsx` | 2026-03-29 | ✅ | ~~TextStyles sub-import~~ fixed → `@/constants/theme`. Teal accent, `expo-image`, haptics, accessibility labels, `ErrorBoundary` all correct. |
| `app/artist/[id].tsx` | 2026-03-29 | ✅ | No violations. Coral accent, analytics, all tokens correct. |
| `app/community/[id].tsx` | 2026-03-29 | ✅ | ~~TextStyles sub-import~~ fixed → `@/constants/theme`. ~~`'#000'` shadowColor~~ → `colors.text`. ~~`'#FFFFFF'` freePillText~~ → `colors.textInverse`. |
| `app/business/[id].tsx` | 2026-03-29 | ✅ | **Full refactor**: Added `useColors()`, converted `getStyles(colors)` pattern. All hardcoded hex (`#0B0B14`, `#FFFFFF`, `rgba(255,255,255,...)`) replaced with `colors.*` tokens. `rgba(139,69,19,...)` indigenous badge replaced with `CultureTokens.gold` tints. `accessibilityLabel` added to all Pressables. Typecheck passes. |
| `app/movies/[id].tsx` | 2026-03-29 | ✅ | ~~TextStyles sub-import~~ fixed → `@/constants/theme`. ~~`#D90429`/`#0055A5`~~ extracted to `HOYTS_BRAND_COLOR`/`EVENT_CINEMAS_BRAND_COLOR` constants. Gold accent, `expo-image`, accessibility correct. |
| `app/[handle].tsx` | — | ⏳ | Not audited |

---

## 5. Feature & Flow Screens

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/onboarding/` (all files) | — | ⏳ | Not audited |
| `app/membership/upgrade.tsx` | 2026-03-29 | ⏳ | File not found at expected path |
| `app/tickets/index.tsx` | 2026-03-29 | ✅ | `CultureTokens` imported correctly (line 24). All gradients from `@/constants/theme`. No raw hex. |
| `app/checkout/index.tsx` | 2026-03-29 | ✅ | `Image` from `expo-image` (line 13). `CultureTokens` from theme (line 19). No raw hex in JSX. |
| `app/scanner.tsx` | 2026-03-29 | ⏳ | File not found at expected path |
| `app/submit/` | — | ⏳ | Not audited |
| `app/notifications/index.tsx` | — | ⏳ | Not audited |
| `app/saved/index.tsx` | — | ⏳ | Not audited |

---

## 6. Supporting & Utility Screens

| File Path | Audit Date | Status | Notes / Violations |
|-----------|------------|--------|--------------------|
| `app/profile/edit.tsx` | — | ⏳ | Not audited |
| `app/settings/index.tsx` | 2026-03-29 | ✅ | Structure confirmed, no violations observed |
| `app/settings/about.tsx` | 2026-03-29 | ✅ | No violations observed |
| `app/about.tsx` | — | ⏳ | Not audited |
| `app/help/index.tsx` | — | ⏳ | Not audited |
| `app/legal/` | — | ⏳ | Not audited |
| `app/admin/` | — | ⏳ | Not audited |
| `app/menu.tsx` | — | ⏳ | Not audited |

---

## 7. Detailed Compliance Checklist (Duplicate per Screen)

Use this checklist for every audited screen:

### Imports & Token Integrity
- [ ] All tokens imported **only** from `@/constants/theme`
- [ ] `useColors()` and `useLayout()` hooks used correctly
- [ ] Zero raw hex values (`grep` test passed)
- [ ] `HeaderLogo.tsx` used where applicable

### Colors & Visuals
- [ ] Max **one** `variant="primary"` button (indigo)
- [ ] Semantic use of `CultureTokens.*` (indigo=trust, coral=action, gold=premium only)
- [ ] Correct functional/status/category colors
- [ ] Gradients and glass surfaces used appropriately
- [ ] Elevation via `ElevationAlias.*` only

### Typography
- [ ] Only `TextStyles.*` presets used
- [ ] `DesktopTextStyles.*` applied on `isDesktop` screens
- [ ] No inline font properties

### Spacing & Layout
- [ ] All spacing from `Spacing.*` (4-point grid)
- [ ] `hPad`, `columnWidth()`, `sidebarWidth` from `useLayout()`
- [ ] Uniform 16px radius (or `Radius.full` for pills/avatars)

### Components & Interactions
- [ ] `<Button>` component used instead of raw Pressable
- [ ] Cards use `CardTokens.*` and `expo-image`
- [ ] Avatars always circular
- [ ] Icons use `IconSize.*` + correct platform library
- [ ] Animations respect `prefersReducedMotion`

### Platform & Accessibility
- [ ] Desktop layout (sidebar + text overrides) correct
- [ ] Web uses light theme; native uses dark
- [ ] All interactive elements have `accessibilityLabel` + `role`
- [ ] Touch targets ≥ 44×44pt

### Brand Voice & Anti-Patterns
- [ ] Copy follows celebratory/inclusive/grounded voice
- [ ] No forbidden words ("users", "content", "diverse", etc.)
- [ ] Australian English, active voice, Oxford comma
- [ ] No inline styles, no direct sub-imports, `StyleSheet.create()` at module level

---

## Grep Validation (2026-03-29 baseline)

The following greps were run across the full `app/` directory:

| Pattern | Expected | Result |
|---------|----------|--------|
| `Platform.OS === 'web' ? 67` | 0 matches | ✅ 0 — bug not present |
| `import.*Image.*from 'react-native'` | 0 matches | ✅ 0 — `expo-image` used everywhere |
| `import.*from '@/constants/colors'` | 0 matches | ✅ 0 — all via `@/constants/theme` |
| `import.*from '@/constants/typography'` | 0 matches | ✅ 0 |
| `import.*from '@/constants/spacing'` | 0 matches | ✅ 0 |
| Raw hex in JSX styles | 0 matches | ✅ 0 |
| Unguarded `console.log` | — | ⏳ Not fully verified |

---

## Audit Summary

**Total Screens Audited:** 23 / ~40
**Fully Compliant (✅):** 21 (was 16 — 5 fixed 2026-03-29)
**Needs Attention (⚠️):** 0
**Major Violations (❌):** 0 (was 1 — fixed 2026-03-29)
**Not Audited (⏳):** 17

**Fixes Applied 2026-03-29:**
1. ✅ `TextStyles` sub-import fixed in `event/[id]`, `venue/[id]`, `community/[id]`, `movies/[id]` → `@/constants/theme`
2. ✅ `business/[id].tsx` fully refactored — `useColors()` added, all hardcoded hex replaced with `colors.*` tokens
3. ✅ Third-party brand colours extracted to named module-level constants in `event/[id]` and `movies/[id]`
4. ✅ `community/[id].tsx` `shadowColor` + `freePillText` replaced with `colors.text` / `colors.textInverse`

**Recommended ESLint Rule (add to `.eslintrc`):**
```json
"no-restricted-imports": ["error", {
  "paths": [
    { "name": "@/constants/colors", "message": "Import from @/constants/theme instead." },
    { "name": "@/constants/typography", "message": "Import from @/constants/theme instead." },
    { "name": "@/constants/spacing", "message": "Import from @/constants/theme instead." },
    { "name": "@/constants/elevation", "message": "Import from @/constants/theme instead." },
    { "name": "@/constants/animations", "message": "Import from @/constants/theme instead." }
  ]
}]
```

**Files Not Found (path mismatch — verify):**
- `app/landing.tsx` — may be `app/landing/` or renamed
- `app/search/index.tsx` — may be `app/search.tsx`
- `app/scanner.tsx` — check `app/scanner/index.tsx`
- `app/membership/upgrade.tsx` — check `app/membership/` directory

**Next Audit Date:** Before April 15 launch — focus on `business/[id]` fix (❌), remaining `⏳` feature flows, and `perks.tsx`

---

**Approval Sign-off**

- Auditor: ___________________________ Date: 2026-03-29
- Reviewer: __________________________ Date: __________

---

**Notes / Action Items**
- [ ] Add ESLint rule to ban raw hex literals in style values
- [ ] Add ESLint rule to ban imports from `@/constants/colors`, `@/constants/typography`, `@/constants/spacing` (enforce `@/constants/theme` only)
- [ ] Reconcile audit template file paths against `CLAUDE.md` architecture section
- [ ] Audit `app/(tabs)/perks.tsx` with targeted grep (file too large for full read)
- [ ] Complete audit of all detail pages (`event/[id]`, `venue/[id]`, `artist/[id]`, `community/[id]`, `business/[id]`) before launch

---

*This document is generated from BRAND_GUIDELINES.md and must be kept up-to-date whenever new routes are added.*

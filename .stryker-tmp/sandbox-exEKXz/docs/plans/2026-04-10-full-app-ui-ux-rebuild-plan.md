# CulturePass Full App UI/UX Rebuild Plan

Date: 2026-04-10  
Scope: all app pages, with shared chrome focus: top bar, bottom tab, and content shell between them.

---

## 1. Objective

Rebuild the visual and interaction layer across the full app so every page follows one coherent standard:

- top chrome (web top bar + native page headers)
- bottom navigation tab behavior and styling
- consistent in-between page structure (hero, filters, lists, empty/loading/error states)

The result must preserve CulturePass product identity and existing route/business logic while raising UX consistency and quality.

---

## 2. Design System Inputs

- Primary project rules: `culturepass-rules.md`
- Agent style contract: `docs/AI_AGENT_STYLE_SHEET.md`
- Design principles: `docs/DESIGN_PRINCIPLES.md`
- Generated design-system reference: `design-system/culturepass-app-rebuild/MASTER.md`

Important alignment decision:
- keep CulturePass tokens as source of truth (indigo/coral/teal/gold rules)
- use skill output for interaction quality, rhythm, hierarchy, and anti-pattern avoidance
- do not replace brand colors with external palette defaults

---

## 3. Rebuild Architecture

## 3.1 Shared Chrome

- Web top bar: unify active state, contrast, spacing, icon rhythm, and hover/focus behavior.
- Native top headers: normalize back/action affordances, safe-area, and title/subtitle treatment.
- Bottom tab: ensure all tab screens use one visual language and predictable press/active states.

## 3.2 In-Between Content Shell

Standard page skeleton:
1. Hero/header block (context + CTA)
2. Filter/scope controls
3. Main content list/grid
4. Empty/loading/error states
5. Footer/meta status

All list pages must follow this template with tokenized spacing, typography, and motion.

---

## 4. Migration Batches (Route Groups)

## Batch A — Core shell + main tabs (highest impact)

- `app/(tabs)/index.tsx`
- `app/(tabs)/feed.tsx`
- `app/(tabs)/calendar.tsx`
- `app/(tabs)/community.tsx`
- `app/(tabs)/city.tsx`
- `app/(tabs)/perks.tsx`
- `app/(tabs)/menu.tsx`
- `app/(tabs)/profile.tsx`
- `components/web/WebTopBar.tsx`
- `components/tabs/CustomTabBar.tsx`
- `components/tabs/TabScreenShell.tsx`

Outcome:
- fully unified chrome and tab experiences
- baseline template used by all tab-root pages

## Batch B — Discover and listing ecosystems

- `app/events.tsx`
- `app/explore.tsx` and listing-style pages under tabs
- `app/activities/index.tsx`
- `app/communities/index.tsx`
- `app/shopping/index.tsx`
- `app/restaurants/index.tsx`
- `app/movies/index.tsx`
- shared listing cards/components in `components/Discover`, `components/feed`, `components/calendar`, `components/directory`

Outcome:
- all browse/list pages follow same filter/list/empty/loading conventions

## Batch C — Detail experiences

- `app/event/[id].tsx`
- `app/community/[id].tsx`
- `app/city/[name].tsx`
- `app/artist/[id].tsx`
- `app/venue/[id].tsx`
- `app/business/[id].tsx`
- `app/perks/[id].tsx`
- `app/profile/[id].tsx`, `app/user/[id].tsx`

Outcome:
- consistent hero treatment, action row, metadata, section rhythm

## Batch D — Onboarding + auth flows

- `app/(onboarding)/*`
- `app/login.tsx`, `app/signup.tsx`, `app/forgot-password.tsx`

Outcome:
- one onboarding visual system, clear progress flow, accessibility-safe forms

## Batch E — Dashboard + admin surfaces

- `app/dashboard/*`
- `app/admin/*`

Outcome:
- platform-grade operator UX with consistent controls and density

## Batch F — Utility flows

- `app/checkout/*`, `app/payment/*`, `app/tickets/*`, `app/notifications/*`, `app/settings/*`, `app/help/*`

Outcome:
- final consistency pass on transactional and utility screens

---

## 5. Execution Method Per Batch

For each batch:

1. Audit current pages and shared components.
2. Define batch-level page template deltas.
3. Implement shared component updates first.
4. Migrate each page to shared primitives.
5. Run validation:
   - `npm run typecheck`
   - `npm run lint`
6. Platform QA pass:
   - iOS
   - Android
   - Web

---

## 6. UX Quality Gates (Must Pass)

- No broken back navigation
- No content obscured by fixed top/bottom chrome
- All interactive controls have `accessibilityLabel` + role
- Loading + empty + error state present on data-driven pages
- Text contrast and spacing consistent with token rules
- No reintroduction of random glassmorphism/blur in product chrome

---

## 7. Rollout Recommendation

- Start with Batch A immediately (largest user-visible uplift and strongest foundation).
- Then run B -> C -> D -> E -> F.
- Commit at batch boundaries so QA and regression isolation stay manageable.


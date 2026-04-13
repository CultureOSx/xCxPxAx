# CulturePass AI Agent Style Sheet

> Purpose: a strict, practical implementation style sheet for AI agents modifying this repo.
> Pair with: `CLAUDE.md`, `AGENTS.md`, `culturepass-rules.md`, and `docs/DESIGN_PRINCIPLES.md`.

---

## 1) Non-Negotiable First Principles

- Ship clean, production-safe code: no placeholders, no half-finished refactors.
- Preserve product identity: CulturePass is a cultural marketplace, not a government workflow app.
- Prefer consistency over novelty: match existing patterns before introducing new ones.
- Use existing architecture and tokens; do not invent parallel systems.

---

## 2) Source Of Truth Order

When guidance conflicts, follow this order:

1. `culturepass-rules.md` (coding and UI operational rules)
2. `CLAUDE.md` (project architecture and runtime constraints)
3. `AGENTS.md` (engineering reference and boundaries)
4. Existing code in adjacent files/components
5. This style sheet

---

## 3) Code Style For Agents

- Use TypeScript strictly; avoid `any`.
- Keep components focused and composable.
- Avoid large inline style objects in JSX; use `StyleSheet.create`.
- Prefer early returns over deep nesting.
- Use explicit names (`nearbyEvents`, `selectedCulture`) over ambiguous (`data`, `item2`).
- Add comments only for non-obvious intent, not for obvious assignments.

### Required patterns

- API calls only via `api.*` from `lib/api.ts`.
- Server state only via React Query (`useQuery` / `useMutation`).
- Theme colors via `useColors()` and tokens via `@/constants/theme`.
- Images via `expo-image`.
- Use platform guards when behavior differs (`Platform.OS`, `.web.tsx`, `.native.tsx`).

---

## 4) UI Styling Contract

- Default visual language: solid surfaces, clear contrast, restrained depth.
- Avoid glassmorphism unless explicitly approved for a specific screen.
- Keep spacing on the 4pt scale and tokenized sizing.
- Maintain readable typography hierarchy with Poppins token styles.
- On web, top inset is always `0`; never revive old fixed top bar inset hacks.

### Color contract

- Never hardcode random hex colors in components.
- Use `CultureTokens` for brand/category accents.
- Use `useColors()` for surfaces, text, borders, and semantic states.
- Reserve gold for approved cultural/indigenous contexts per rules.

---

## 5) Accessibility + Interaction

- Every interactive element must include `accessibilityLabel`.
- Use correct `accessibilityRole` (`button`, `link`, `tab`, etc.).
- Preserve touch target quality (tokenized heights/radii).
- Haptics only on native platforms.

---

## 6) Performance + Reliability

- Avoid unnecessary memoization; add only when profiling indicates value.
- Use list virtualization correctly (`FlatList` keys, stable render item usage).
- Do not trigger authenticated queries before auth restoration completes.
- Handle empty, loading, and error states explicitly for data screens.

---

## 7) Change Discipline For AI Agents

- Keep changes scoped to user intent; do not perform unrelated refactors.
- If updating shared primitives, evaluate downstream usage impact.
- Do not silently alter behavior contracts in API, schema, or auth flows.
- Run validation before handoff: typecheck and lint at minimum.

---

## 8) Documentation Update Rule

When introducing or changing a project-wide pattern, update the relevant docs in the same change set:

- architecture/system behavior -> `CLAUDE.md` or `AGENTS.md`
- coding/UI rules -> `culturepass-rules.md`
- visual/design system behavior -> `docs/STYLE_GUIDE.md` or related docs

---

## 9) Definition Of Done (Agent Checklist)

- Build/typecheck passes.
- Lint passes (or warnings are acknowledged with reason).
- No secrets or environment leaks introduced.
- UX behavior verified for affected platforms.
- Changes remain consistent with existing CulturePass patterns.


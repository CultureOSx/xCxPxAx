# CulturePass Design Principles

> For AI code agents and engineers. These principles govern every UI decision in the CulturePass ecosystem.
> They bridge Jony Ive's minimalist philosophy with the platform's cultural identity and triple-platform architecture.

---

## 1. Cultural Minimalism ("Less but Better")

**Definition**: Strip away unnecessary interface clutter so cultural content—events, art, and community stories—takes center stage.

**Execution**:
- Use high-fidelity hero banners and Spotlight cards that focus on one flagship event at a time
- Reject excessive decoration (gradient orbs, decorative blobs, unsolicited drop shadows) in favour of clarity
- Every element must earn its place — if removing it doesn't break comprehension, remove it

**Aesthetic**:
- "Night Festival" dark mode is the **default** on native (iOS/Android)
- Web defaults to light mode via `useColors()` — never hardcode theme values

**Agent rule**: Before adding any decorative element, ask — does this serve the content, or decorate around it?

---

## 2. Integrity of Identity (Honesty in Materials)

**Definition**: In our digital world, "materials" are our **CultureTokens** — they are immutable brand signatures.

**The five core brand colors**:

| Token | Hex | Meaning |
|---|---|---|
| `CultureTokens.indigo` | `#2C2A72` | Primary CTA, trust, platform identity |
| `CultureTokens.gold` | `#FF8C42` | Warm discovery, festivals, events |
| `CultureTokens.coral` | `#FF5E5B` | Action energy, movement, urgency |
| `CultureTokens.gold` | `#FFC857` | Cultural premium, Temple Gold, CulturePass+ status |
| `CultureTokens.teal` | `#2EC4B6` | Global belonging, ocean, venues |

**Standard**:
- **Never** hardcode hex values in components — use `CultureTokens.*` for brand and `useColors()` for functional UI
- **Blue = Trust**: Use indigo in loyalty messaging, transactions, and profile surfaces to signal security
- **Gold = Status**: Use `CultureTokens.gold` for CulturePass+ membership tiers without cluttering the UI — a metallic accent, not a flood
- Colors must feel "true" to the platform lighting — `useColors()` returns the correct values per theme automatically

**Agent rule**: `grep -r "#[0-9A-Fa-f]\{6\}"` in any component you write. If you find one that isn't in a comment or string value, it's a bug.

---

## 3. Seamless Platform Parity (Hardware/Software Integration)

**Definition**: The experience must feel native to the physical device — MacBook Pro, iPhone, or Android tablet.

**Execution**:
- **iOS**: SF Symbols via `expo-symbols` (iOS 16+), BlurView for glass effects, `expo-haptics` for physical feedback
- **Android**: Ionicons, semi-transparent `rgba()` backgrounds instead of BlurView, same haptics API
- **Web**: Sidebar replaces tab bar at ≥1024px, `boxShadow` instead of `elevation`, no touch-only patterns
- Use `useLayout()` for all responsive values — never hardcode padding, columns, or widths
- Use `useSafeAreaInsets()` for native insets; **web top inset is always `0`**

**Correct pattern**:
```typescript
const insets = useSafeAreaInsets();
const topInset = Platform.OS === 'web' ? 0 : insets.top;  // ← always 0 on web
```

**Wrong pattern** (never do this):
```typescript
const topInset = Platform.OS === 'web' ? 67 : insets.top;  // ← 67 is dead code from old top bar
```

**Agent rule**: Test every layout change against the three form factors: iPhone notch, Android, and desktop web. If `useLayout()` doesn't cover a case, add it there — don't inline.

---

## 4. Approachable Complexity (User-Centric Empathy)

**Definition**: Make complex cultural governance — ticketing, council claims, membership — approachable and intuitive rather than intimidating.

**Execution**:
- Break complex flows into "atomic" steps with clear progress signals
- Use plain language in labels: "Live" not "PUBLISHED", "Draft" not "UNPUBLISHED"
- Destructive actions (delete, cancel subscription) require confirmation with explicit consequence language
- Empty states are invitations, not errors: "No events yet — create your first event to get started"
- Loading states must always be visible: `ActivityIndicator` or skeleton, never a blank screen

**Button hierarchy** (one primary CTA per screen):
```
Primary     → solid indigo background, white text, border-radius 8–12
Secondary   → backgroundSecondary fill, border, themed text
Destructive → coral tint background, coral text — never primary position
Ghost/Icon  → no background, icon only, for tertiary actions
```

**Agent rule**: No screen should have more than one primary (solid indigo) button visible at once. If you find two, one needs to become secondary.

---

## 5. Technical Craftsmanship (Inseparable Design & Manufacturing)

**Definition**: Code quality IS design quality. A visual decision not enforced in code is not a decision — it's a suggestion.

**The QA gate** (a design is not "finished" until it passes):
```bash
npm run typecheck   # zero errors
npm run lint        # zero warnings on new code
npm run qa:all      # full pipeline
```

**Code standards that enforce design**:
- `StyleSheet.create()` at module level — never inline style objects inside render
- No `any` types in style-adjacent code — type properly or use `ReturnType<typeof useColors>`
- No `console.log` in production paths — use `if (__DEV__)` guards
- Platform-divergent code in `.native.tsx` / `.web.tsx` file pairs, not `Platform.OS` chains longer than 3 branches
- `Image` from `expo-image` always — never `react-native` Image (caching, performance)

**Agent rule**: Run `npm run typecheck` before marking any task complete. A type error is a design defect.

---

## Strategic Implementation Checklist

For every new screen or component, verify:

- [ ] **Token usage**: No hardcoded hex — only `CultureTokens.*` and `useColors()`
- [ ] **Adaptive primitives**: Safe area insets handled, web top = 0, sidebar width from `useLayout()`
- [ ] **Visual hierarchy**: One primary CTA, gold only for status/premium, indigo for trust/action
- [ ] **Deep-linked interactions**: Every tap target navigates to a specific, meaningful route — no dead ends
- [ ] **Platform parity**: Renders correctly on iOS (notch), Android, and desktop web
- [ ] **Haptics**: `Haptics.impactAsync` on interactive elements (iOS/Android), silently ignored on web
- [ ] **Accessibility**: `accessibilityRole` and `accessibilityLabel` on all Pressable elements
- [ ] **QA gate**: `npm run typecheck` passes with zero errors

---

## Related Documents

- [`docs/DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) — Full token reference with usage examples
- [`docs/STYLE_GUIDE.md`](./STYLE_GUIDE.md) — Component patterns and composition rules
- [`CLAUDE.md`](../CLAUDE.md) — Full architecture, routing, API patterns, and never/always rules

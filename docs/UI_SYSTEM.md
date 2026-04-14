# CulturePass UI System (production)

**Version** — `DesignSystemVersion` in `@/constants/theme`  
**Principles** — [`DESIGN_PRINCIPLES.md`](./DESIGN_PRINCIPLES.md)  
**Rules** — [`culturepass-rules.md`](../culturepass-rules.md) (import UI tokens from **`@/constants/theme`** only)

---

## What this system is

- **Product chrome** — Dark-first **native** (`useColors()` dark), **light web** default; Poppins; `CultureTokens` for brand.
- **Marketing / storytelling** — Optional **fixed light** neutrals (`marketingSurfaces`) + larger type (`DesktopMarketingTextStyles`) + tall section rhythm (`SectionSpacing`).
- **Formula** — One clear headline, one supporting line, one primary CTA, generous space, content as hero (events / communities / culture).

---

## Imports (single surface)

```ts
import {
  DesignSystemVersion,
  MarketingLayout,
  SectionSpacing,
  MarketingMaxWidth,
  DesktopMarketingTextStyles,
  TextStyles,
  gradients,
  marketingSurfaces,
  MarketingCTA,
  webShadow,
  MarketingShadow,
} from '@/constants/theme';
```

---

## Layout

| Token | Use |
|--------|-----|
| `SectionSpacing.sm` … `xl` | Vertical padding for marketing bands (64–120px) |
| `MarketingMaxWidth.reading` | ~800px centered column for copy |
| `useLayout().hPad` | Horizontal inset — **always** use for page content |
| `MarketingGrid.minCardWidth` | ~280px min for 2–3 column card grids |
| `StorySection` | [`components/marketing/StorySection.tsx`](../components/marketing/StorySection.tsx) — band + optional `contain` + `variant="marketing"` |

---

## Color & gradients

- **Never** scatter hex in components — use `useColors()` + `CultureTokens` / theme exports.
- **Brand gradient** — `gradients.culturepassBrand` (indigo → coral).
- **Discovery / campaign ribbon** — `gradients.discoveryMarketing` (coral → gold → purple).
- **Light landing strips** — `marketingSurfaces.page` / `.band` / `.text` / `.textMuted` when building explicit light pages.

---

## Typography

- Base presets — `TextStyles.*` (Poppins).
- In-app desktop bumps — `DesktopTextStyles` (spread on base styles).
- Large web marketing — `DesktopMarketingTextStyles` (spread on `TextStyles.hero` or `TextStyles.display`).

Example:

```tsx
<Text
  style={[
    TextStyles.hero,
    isDesktop && DesktopMarketingTextStyles.heroLg,
    { color: colors.text },
  ]}
>
  Discover culture
</Text>
```

---

## Buttons & CTAs

- Use [`Button`](../components/ui/Button.tsx) — `ButtonTokens` for height/radius.
- Marketing solid fill reference — `MarketingCTA.fill` / `MarketingCTA.onFill` (indigo on white text).

---

## Web elevation

```tsx
Platform.OS === 'web' && webShadow(MarketingShadow.card)
```

---

## Platform parity

- Native **Night Festival** stays default; do not force `marketingSurfaces` on core app screens without intent.
- **Web** `topInset === 0`; use `useLayout()` for breakpoints and `useSafeAreaInsets()` on native only.

---

## Changelog

- **1.0.0** — `SectionSpacing`, `marketingSurfaces`, `gradients.discoveryMarketing`, `DesktopMarketingTextStyles`, `MarketingLayout` / `MarketingCTA`, `StorySection`.

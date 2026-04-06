# CulturePass

CulturePass is a **B2B2C cultural discovery marketplace** for events, communities, businesses, and ticketing—focused on **Australia** (First Nations spotlight, diaspora communities) with global availability. This repository is undergoing a **principal-grade cross-platform rebuild**: UI/UX aligned with **iOS 26 Liquid Glass** (WWDC 2025 design language), a modernized **API and offline-first data layer**, and **platform-parity** across iOS, Android, and Web.

> **Design north star**: The app should feel **indistinguishable from a first-party Apple product** on iOS 26—fluid, refractive, accessible, and joyful—while **Material You 3+** on Android and **CSS `backdrop-filter`–based glass** on Web keep the same information architecture and emotional quality.

---

## Rebuild programme (iterative)

Work proceeds **one screen at a time**. Each delivery includes: screen name, key improvements (UI/API/perf/a11y), updated code paths, new shared primitives, and integration notes. After each screen, implementation pauses until the next milestone is confirmed (**reply with `Next`** to continue).

### Screen priority order

1. **Splash / Onboarding Flow**
2. **Auth** — Login / Sign up (Apple, Google, email as applicable)
3. **Home / Discovery** — Event browsing, filters, search, Liquid Glass cards
4. **Event Detail** — Ticketing, map, Liquid Glass sheets
5. **Community Hub**
6. **Business Directory**
7. **Profile / Membership / Loyalty**
8. **Ticket Wallet / QR Scanner**
9. **Search + Filters** (global)
10. **Settings** and remaining surfaces

### Final programme deliverables (after core screens)

- Root app layout (`app/_layout.tsx` and related): tabs + stacks, theme provider, Query client, error boundaries, deep links / universal links preserved.
- **`constants/theme.ts`** and design system: Liquid Glass–aware tokens (adaptive color, blur intensities, elevation, motion).
- **`lib/api.ts`** (and services): modern `fetch`, structured errors, retries, deduplication, cache alignment with TanStack Query (and optional local persistence).
- Recommended **project structure** refinements.
- **Performance, deployment, and App Store** notes for iOS 26 and cross-platform release.

---

## iOS 26 Liquid Glass — design requirements

These constraints apply to all rebuilt surfaces unless a platform genuinely cannot support them (with documented fallback).

- **Material**: Liquid Glass everywhere it makes sense—tabs, sheets, cards, buttons, navigation chrome, controls: **translucent, refractive, dynamic blur** that responds to underlying content, light, and (where available) motion.
- **Depth**: Inspiration from **visionOS**—layering, subtle **parallax**, soft shadows, **adaptive vibrancy**.
- **Chrome**: Tab bars that **shrink or morph on scroll** while content remains readable through glass; **hardware-native corner radii**; **spring physics** micro-animations; **haptics** on meaningful interactions.
- **Typography**: System UI or **Poppins** with an **iOS 26–aligned type scale**; full **Dynamic Type** and accessibility labels.
- **Color**: **Dark mode** treated as first-class; intelligent contrast for glass-on-content scenarios.
- **Android**: **Material You 3+** with **subtle glassmorphism** where it supports brand consistency.
- **Web**: Modern CSS (**`backdrop-filter`**, containment, prefers-reduced-motion) to approximate Liquid Glass.

Product context is unchanged: cultural marketplace, councils as **LGA/location attributes** (not governance), Stripe-backed ticketing, membership tiers and perks.

---

## Technical modernization (2026 targets)

| Area | Direction |
|------|-----------|
| **Runtime** | Expo SDK **55+** (track latest), React Native **0.84+** where release alignment allows, **New Architecture** (Fabric + TurboModules) enabled when stable for the chosen SDK. |
| **Routing** | **Expo Router v5+**, file-based routes, **deep linking and universal links** preserved (`docs/URL_STRUCTURE.md`). |
| **Server state** | **TanStack Query 5**: background refetch, optimistic updates, stable query keys, error/retry policies aligned with API client. |
| **Client state** | **Zustand** or **Jotai** for UI and session-adjacent state; Context only where it remains the clearest fit. |
| **Persistence / offline** | **Offline-first** roadmap: local-first writes, sync, conflict strategy for events/tickets/saved items—**MMKV** / **Expo SQLite** / **WatermelonDB** (or equivalent) introduced per domain needs—not a single blanket choice. |
| **API client** | Rebuilt **`lib/api.ts`**: async/await, typed errors, exponential backoff, deduplication, integration with Query cache and optional local DB. |
| **Motion** | **Reanimated 4** worklets on the UI thread; avoid JS-thread layout animations. |
| **Images** | **`expo-image`**: priority, placeholders, glass-aware shimmer/skeleton loaders. |
| **Lists** | **FlashList** (or equivalent) for long lists; memoization and reduced re-renders. |
| **Payments** | **Stripe** retained; **Apple Pay / Google Pay** and **Wallet** integration expanded where product and platform policy allow. |
| **Accessibility & i18n** | VoiceOver/TalkBack, Dynamic Type, RTL, structure for **multi-language** (Australia + global). |
| **Observability** | **Sentry removed** per project rules—structured client logging and route/error capture patterns as documented in `AGENTS.md` / `culturepass-rules.md`. |

**Current pinned versions** (verify in `package.json` when implementing): React 19.x, RN ~0.83, Expo 55, Expo Router 5—upgrade paths belong in the rebuild milestones, not only in README.

---

## Platform coverage

| Platform | Technology | Distribution |
|----------|-----------|--------------|
| iOS | React Native (Expo) | App Store via EAS Build |
| Android | React Native (Expo) | Google Play via EAS Build |
| Web | Expo Web (same codebase) | Firebase Hosting |

---

## Architecture

```
Frontend (Expo + React Native)
├── app/              # File-based routing (Expo Router)
├── components/       # UI, Discover, Web, Tabs, etc.
├── constants/        # Design tokens → Liquid Glass–aware system (evolving)
├── contexts/         # Auth, onboarding, saved, contacts (some may migrate to stores)
├── hooks/            # Data and layout hooks
├── lib/              # API client, auth, config, utilities
└── shared/           # Shared TypeScript types / schema

Backend (Firebase Functions + Express)
├── functions/src/            # Express API + routes + services
├── functions/src/services/   # Firestore, search, cache, rollout
└── functions/src/middleware/ # Auth + moderation

Cloud (Firebase)
├── functions/        # API, triggers, Stripe webhooks
└── firebase.json     # Hosting + security headers
```

For a deeper system view see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Quick start

```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Quality checks
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run qa:all        # Unit + integration + E2E smoke tests (when configured)

# 3. Start development
npx expo start        # iOS / Android / Web
firebase emulators:start --only functions,firestore,auth,storage
```

### Environment variables

```bash
# Point the app at your API (emulator or production)
export EXPO_PUBLIC_API_URL=http://127.0.0.1:5001/<project>/us-central1/api/

# Feature rollout phase (server / tooling)
export ROLLOUT_PHASE=internal   # internal | pilot | half | full

# Optional Firebase emulator wiring in Expo dev
export EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
export EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1
```

Mirror **`EXPO_PUBLIC_*`** variables in `eas.json` for EAS builds. See `CLAUDE.md` for the full client vs secrets split.

---

## Build and deploy

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full instructions.

### iOS (App Store)

```bash
npm run build:ios:production
npm run submit:ios:production
```

### Android (Google Play)

```bash
npm run build:android:production
npm run submit:android:production
```

### Internal / preview builds

```bash
npm run build:ios:preview
npm run build:android:preview
npm run update:preview -- --message "QA update"
```

### Web (Firebase Hosting)

```bash
npm run build-web
firebase deploy --only hosting
```

**Deploy order**: Cloud Functions **before** client releases when API contracts change.

---

## Single app policy

- One **Expo** codebase serves iOS, Android, and Web (`app/`, `components/`, `lib/`, etc.).
- Do not add a separate production web app tree; web is exported (e.g. to `dist/`) and served by Firebase Hosting.
- Preserve **canonical routes** and **legacy remaps** across Expo Router, native intents, and hosting (`docs/URL_STRUCTURE.md`).

---

## Core product surface

- **Event discovery** — City, category, date, search, filters
- **Community hub** — Join and manage diaspora communities
- **Ticketing** — Purchase, QR, Wallet integration
- **Business directory** — Venues, restaurants, cultural businesses
- **Membership & perks** — Tiers, cashback, redemption flows
- **First Nations spotlight** — Indigenous Australian cultural surfacing
- **Location** — LGA / council as **proximity metadata**, not a governance product

---

## Engineering rules (non-negotiable)

- Use **`lib/api.ts`** (and successors) as the **only** app-level HTTP entry point.
- Use **`useColors()`** and **`constants/theme.ts`** (and related token files); **no arbitrary hex** in feature code.
- Use **`expo-image`** for networked images.
- Wrap async screens with **error boundaries** where the codebase establishes that pattern.
- **Sentry is not used** — follow project error-handling conventions.

Design laws and UI patterns: [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md), [`culturepass-rules.md`](culturepass-rules.md). Agent quick reference: [`CLAUDE.md`](CLAUDE.md), [`AGENTS.md`](AGENTS.md).

---

## Design system (transition)

| Module | File | Role |
|--------|------|------|
| Theme entry | `constants/theme.ts` | Single import surface for tokens (expanding for Liquid Glass) |
| Colors | `constants/colors.ts` | Palettes, glass, gradients |
| Typography | `constants/typography.ts` | Poppins + scale; Dynamic Type alignment |
| Spacing | `constants/spacing.ts` | Grid, radii, breakpoints |
| Animations | `constants/animations.ts` | Durations, springs, reduced-motion respect |

During the rebuild, new **blur / elevation / vibrancy** tokens will live alongside existing modules to avoid fragmenting imports.

---

## CI/CD

GitHub Actions (see repo workflows) typically covers:

- TypeScript **typecheck**
- **ESLint**
- **Unit tests**
- **Web export** compile check

---

## Documentation

| Document | Description |
|----------|-------------|
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design |
| [`APP_DOCUMENTATION.md`](docs/APP_DOCUMENTATION.md) | Feature guide |
| [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Build and release |
| [`PUBLISHING_READINESS.md`](docs/PUBLISHING_READINESS.md) | Store checklist |
| [`API_ENDPOINTS.md`](docs/API_ENDPOINTS.md) | REST reference |
| [`ROUTE_API_MATRIX.md`](docs/ROUTE_API_MATRIX.md) | Routes ↔ API |
| [`URL_STRUCTURE.md`](docs/URL_STRUCTURE.md) | Canonical URLs |
| [`PROJECT_ENHANCEMENT_PLAN.md`](docs/PROJECT_ENHANCEMENT_PLAN.md) | Roadmap |
| [`RELEASE_NOTES.md`](docs/RELEASE_NOTES.md) | Version history |
| [`MAINTENANCE.md`](docs/MAINTENANCE.md) | Maintenance guardrails |
| [`DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md) | UX laws |

---

## Tech stack (summary)

- **Frontend**: React 19.x, React Native (Expo SDK **55**), **Expo Router 5**, **Reanimated 4**
- **State**: **TanStack Query 5**; **Zustand / Jotai** (target for new client state); existing Context during migration
- **Backend**: Firebase Cloud Functions (Express), Node.js 22, TypeScript
- **Data**: Firestore
- **Payments**: Stripe; Apple / Google Pay and Wallet—expand per milestone
- **Hosting**: Firebase Hosting (web), EAS (native)

---

## License

Private — all rights reserved.

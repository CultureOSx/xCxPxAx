# CulturePass — Application Documentation

## 1. Product Overview

CulturePass is a cross-platform Expo + React Native application for **cultural discovery and ticketing** across **Australia** and diaspora-focused cities in **NZ, UAE, UK, and CA**. Users discover events, join communities, manage tickets and perks, and use a shared CulturePass identity on **iOS, Android, and Web** (static export + Firebase Hosting).

## 2. Platform Targets

The app is maintained as a single codebase and currently targets:

- iOS (EAS build + App Store workflow)
- Android (EAS build + Google Play workflow)
- Web (Expo static export + Firebase Hosting)

## 3. Core Tech Stack

### Frontend
- **Pinned (verify in `package.json`)**: Expo SDK **55**, React Native **~0.83**, React **19.x**, **Expo Router 5**, **Reanimated 4**
- Expo Router for file-based navigation and deep links
- TanStack Query for server-state caching and networking
- AsyncStorage + SecureStore for persistence (auth token path via `lib/query-client.ts`)

### Build/Tooling
- TypeScript
- ESLint (Expo config)
- EAS build/submit configuration
- Firebase-first backend and deployment tooling

## 4. Repository Structure (High-Level)

- `app/` — route screens (onboarding, tabs, detail pages, utility pages)
- `components/` — reusable UI pieces and boundaries
- `contexts/` — persisted client-side state (onboarding, saved items, contacts)
- `lib/` — shared runtime utilities (auth, API/query setup)
- `shared/` — shared domain interfaces used across the app
- `docs/` — architecture and deployment docs
- `functions/` — active Firebase Cloud Functions app, middleware, and Firestore services

## 5. Navigation & Screen Surface

The root layout registers onboarding, tab navigation, and many feature/detail screens through Expo Router stack configuration. Key areas include:

- Onboarding/auth (`(onboarding)/*`)
- Main tabs (`(tabs)/*`) — **Discover** (index), **Calendar**, **Community**, **Perks**, **Profile**, plus in-tab surfaces such as **Directory** and **Explore** where routed
- Event/community/business/artist/venue/user detail routes
- Tickets, payments, contacts, scanner, search, map, settings, legal pages

## 6. Application Runtime Architecture

CulturePass uses a layered setup:

1. **UI layer** via Expo Router routes and reusable components.
2. **State layer** with TanStack Query for network state and React Context for local persisted state.
3. **Data contracts** via shared interfaces in `shared/schema.ts`.

## 7. Auth & Session Handling

`lib/auth.tsx` provides session context with:

- In-memory auth state for runtime
- Native secure persistence using `expo-secure-store`
- Web-safe fallback persistence via AsyncStorage
- Session restoration on app launch
- `login` and `logout` helpers with storage synchronization

## 8. API Access & Query Behavior

`lib/query-client.ts` centralizes API URL resolution and request behavior:

- URL priority: `EXPO_PUBLIC_API_URL` → `EXPO_PUBLIC_DOMAIN` → same-origin web host → localhost fallback
- Shared `apiRequest` helper with JSON body support and error normalization
- React Query defaults tuned for practical caching (`staleTime`, `gcTime`, retry)
- App code should go through `lib/api.ts` instead of calling `fetch` directly

## 9. Persisted Client Contexts

### Onboarding context
Stores onboarding completion, location, communities, and interests in AsyncStorage.

### Saved context
Stores saved event IDs and joined community IDs in AsyncStorage.

### Contacts context
Stores and manages saved contact entries (CulturePass IDs and metadata) in AsyncStorage.

## 10. Domain Models

`shared/schema.ts` currently defines app-level interfaces such as:

- `User`
- `Profile` / `Community`
- `Membership` / `Wallet`
- `Review`
- `Ticket`

These are TypeScript interface contracts (not SQL schema definitions) and function as shared typing primitives across screens and data calls.

## 11. Styling & Visual System

Design tokens are **imported only from `constants/theme.ts`** (re-exports colors, typography, spacing, elevation). Use `useColors()` for theme-aware values. **Dark mode is default on native**; web follows product defaults for marketing surfaces. **Never hardcode hex** in feature code. Web desktop (**≥1024px**) uses a **240px left sidebar** (`components/web/WebSidebar.tsx`); **`topInset` on web is always `0`**.

## 12. Build, Scripts, and Operational Commands

Primary commands:

- `npx expo start` — local dev (iOS / Android / Web)
- `npm run lint`, `npm run typecheck` — quality gates
- `npm run test:unit`, `npm run test:integration` — automated tests
- `npm run functions:build` — compile Cloud Functions (`functions/lib/`) **before** Firebase emulators
- `npm run build-web` — static web export to `dist/`
- `npm run test:web:route-hygiene` — validates exported HTML (run after `build-web`)
- `npm run qa:solid` — full gate: lint, typecheck, `qa:all`, functions build, web export, route hygiene

**Cursor Cloud / agent VMs**: install + Functions compile order → `AGENTS.md` (Cursor Cloud section).

## 13. Deployment & Distribution

### Mobile
- EAS build profiles for `development`, `preview`, and `production`
- iOS submit placeholders (`appleId`, `ascAppId`, `appleTeamId`) to complete before release

### Web
- Firebase Hosting serves `dist/` from `expo export --platform web`; rewrites route HTML and API to Cloud Functions per `firebase.json`.

## 14. SEO, syndication & sharing

- **Metadata**: `lib/app-meta.ts`, `app/+html.tsx`, and per-route configuration in `app/_layout.tsx` (titles, Open Graph, Twitter cards, `robots`, canonical paths).
- **Crawlers**: `public/robots.txt`, root `robots.txt`, and `public/sitemap.xml` — update when public routes or disallow rules change.
- **Feeds (API)**: RSS and ICS under `/api/feeds/*`, including community **status** and **story** RSS — see `docs/API_ENDPOINTS.md`.
- **Social**: `lib/shareContent.ts` builds share links (Instagram, WhatsApp, Facebook, X, email) from a canonical URL.

## 15. Data & backend (source of truth)

- **Primary datastore**: Cloud Firestore (typed access via `functions/src/services/*`).
- **HTTP API**: Firebase Cloud Functions Express app in `functions/src/app.ts` and `functions/src/routes/*`.
- **Shared types**: `shared/schema.ts` and `shared/schema/*` — align client (`lib/api.ts`) and server contracts here.

## 16. Recommended documentation upkeep

1. When adding **public routes**, update `docs/URL_STRUCTURE.md` and sitemap/robots as needed.
2. When adding **API routes**, update `docs/API_ENDPOINTS.md` and integration tests under `scripts/tests/`.
3. Keep `README.md`, `CLAUDE.md`, and `AGENTS.md` in sync for bootstrap and QA commands.

# CulturePass AU — Master Engineer Reference (AGENTS.md)

> The definitive blueprint for CulturePass: architecture, tech stack, design laws, data models, and API patterns. **Read this before touching code.**
>
> **Last Updated**: April 2026
> **Related Docs**: [`CLAUDE.md`](CLAUDE.md) (Quickstart), [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md), [`culturepass-rules.md`](culturepass-rules.md).

---

## 1. Project Overview & Identity

CulturePass is a **B2B2C cultural lifestyle marketplace** for diaspora communities (AU, NZ, UAE, UK, CA).
- **Core Product**: Connects Users → Events / Businesses / Venues / Communities.
- **Council (LGA)**: Treated as a **location attribute** for proximity filtering, not a governance identity.
- **Design Philosophy**: "Night Festival" aesthetic (Dark mode default on native).

### Tech Stack (Exact Versions)
| Layer | Technology | Version |
|-------|------------|---------|
| **Mobile/Web** | React Native (Expo SDK 55) | 0.83 |
| **Router** | Expo Router | 5.x |
| **Animations** | Reanimated 4 | — |
| **State** | TanStack React Query 5 | — |
| **Backend** | Firebase Cloud Functions (Node 22) | — |
| **Database** | Cloud Firestore | 11.x |
| **Payments** | Stripe (stripe-js + stripe node) | — |
| **Design** | Poppins (Typography) + Ionicons/SF Symbols | — |

---

## 2. Architecture & Directory Structure

```
app/                    Expo Router screens
  (onboarding)/         Login, Signup, Location, Interests, Communities
  (tabs)/               Tabs: Discover, Calendar, Community, Perks, Profile
  event/                [id].tsx (Detail), create.tsx (9-step wizard)
  admin/                Platform management (users, logs, notifications)
  dashboard/            Organizer tools (events, venue analytics)
  payment/              Wallet, Stripe flows, success/cancel
  search/               Global Firestore search

components/
  ui/                   Button, Card, Badge, Input, Avatar (Atomic components)
  Discover/             Rails, Carousels, and Spotlight cards
  web/                  WebSidebar (240px desktop), WebTopBar
  tabs/                 Shells for consistent tab layouts
  AuthGuard.tsx         Protects private routes
  ErrorBoundary.tsx     Wraps async data screens

constants/
  theme.ts              SINGLE IMPORT POINT for all tokens (Colors, Spacing, etc.)
  colors.ts             CultureTokens, Gradients, Neon, Light/Dark palettes

functions/src/          Firebase Cloud Functions (Express)
  routes/               Domain-specific route files (events.ts, auth.ts, etc.)
  services/             Firestore abstraction, Cache, Rollout, Locations
  triggers.ts           Firestore hooks (e.g., onEventWritten syncs to feed)

shared/schema/          Master TypeScript types (Event, User, Ticket, etc.)
```

---

## 3. Design Token System (CultureTokens)

Never hardcode hex values. Use `useColors()` or `CultureTokens`.

### Core Brand
- `indigo`: `#0066CC` (Primary Brand)
- `coral`: `#FF5E5B` (Action/Movement)
- `gold`: `#FFC857` (Warmth/Discovery)
- `teal`: `#2EC4B6` (Global Belonging)

### Functional Sizing
- `ButtonTokens.height.md`: 52 (Apple HIG compliant)
- `CardTokens.radius`: 16
- `InputTokens.height`: 48
- `AvatarTokens.radius`: 9999 (Circular)

### Gradients
- `gradients.culturepassBrand`: [Indigo, Coral] — Banners & CTAs
- `gradients.midnight`: Deep indigo — Backgrounds

---

## 4. Web & Responsive Layout Rules

### Breakpoints
- **Tablet**: 768px (Bottom tabs persist)
- **Desktop**: 1024px (Left Sidebar appears, `sidebarWidth = 240`)

### The "Top Inset" Rule (CRITICAL)
- **Native**: `useSafeAreaInsets().top`
- **Web**: Always `0`. (The 64px header is replaced by Sidebar on Desktop).
- **Correct Usage**: `const topInset = Platform.OS === 'web' ? 0 : insets.top;`

---

## 5. Essential Coding Rules

### NEVER Do
- Call `useAuth()` or `useColors()` outside a React component.
- Use `any` type — use `Record<string, unknown>` or proper schema types.
- Write raw `<Pressable>` for buttons — use `<Button>`.
- Use `AsyncStorage` directly — use `lib/storage.ts` or Query Client helpers.
- Use `console.log` in prod — use `if (__DEV__)` guards.
- **Sentry is REMOVED**: Do not import or use `@sentry`. Use `console.error` + `captureRouteError`.

### ALWAYS Do
- Use `api.*` from `lib/api.ts` for all backend calls.
- Wrap screens with async data in `<ErrorBoundary>`.
- Handle 401 errors with `ApiError.isUnauthorized()`.
- Test on iOS, Android, and Web before PR.
- Add `accessibilityLabel` to interactive elements.
- Use `Image` from `expo-image` (Better caching/performance).

---

## 6. Backend & Data Flows

### API Pattern
We use a **Namespace Pattern** in `lib/api.ts`:
`api.events.list()`, `api.auth.me()`, `api.tickets.scan()`.

### Firestore Models (Summary)
- **users/{uid}**: Profile, membership tier, interests, culturePassId (`CP-USR-XXXX`).
- **events/{eventId}**: Title, geoHash, lgaCode, organizerId, category, priceCents.
- **tickets/{ticketId}**: User ownership, QR code token, payment status.
- **councils/{id}**: LGA data seeded from `AllCouncilsList.csv`.

### Stripe Payment Flow
1. Client calls `POST /api/events/:id/checkout`.
2. App opens Stripe-hosted URL in `WebBrowser`.
3. Webhook `checkout.session.completed` marks ticket as `paid` and increments event `attending`.

---

## 7. Special Logic: Council & Indigenous

- **Council (LGA)**: Proximity dimension only. `lgaCode` matches users to local events.
- **Indigenous Spotlight**: Special discover rail pulled from `api.indigenous.spotlight`.
- **Acknowledgement of Country**: Located in `lib/indigenous.ts` and shown on onboarding.

---

## 8. Build & Deployment

1. **Functions First**: Deploy backend before app when adding new endpoints.
2. **Environment**: `EXPO_PUBLIC_*` vars are baked into bundles.
3. **QA**: Run `npm run qa:solid` (Lint + Typecheck + Integration tests).
4. **Deploy Web**: `npm run deploy-web` (Expo Export → Hosting).
5. **Deploy Native**: `eas build --platform ios --profile production`.

---

## 9. Future Roadmap

- [ ] GeoHash backfill for all existing events.
- [ ] Push notification category opt-outs.
- [ ] Promotional code system (`promoCodes` collection).
- [ ] Apple/Google Pay wallet top-up integration.

---

## Cursor Cloud specific instructions

### Services overview

| Service | How to start | Port | Notes |
|---------|-------------|------|-------|
| Expo Dev (web) | `npx expo start --web --port 8081` | 8081 | Main app — web view |
| Firebase Auth emulator | `npx firebase emulators:start --only functions,firestore,auth,storage` | 9099 | All four emulators start together |
| Firebase Functions emulator | (same command) | 5001 | Express API at `/api/**` |
| Firebase Firestore emulator | (same command) | 8080 | |
| Firebase Storage emulator | (same command) | 9199 | |
| Emulator UI | (auto-started) | 4000 | Web UI for inspecting emulator data |

### Environment files

The app requires `.env` at root and `functions/.env`. Copy from `.env.example` / `functions/.env.example` and fill in mock values for emulator use. Key settings for local emulator development:

```
EXPO_PUBLIC_FIREBASE_PROJECT_ID=culturepass-4f264
EXPO_PUBLIC_API_URL=http://127.0.0.1:5001/culturepass-4f264/us-central1/api/
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1
```

Other `EXPO_PUBLIC_FIREBASE_*` keys can use any placeholder value when running against emulators.

### Seeding test data

With emulators running: `npm run emulator:seed:cap` creates a test organizer user, "The CAP" organisation profile, and 8 published events. Credentials default to `cap-emulator@test.local` / `CapEmulator1!` (override with `SEED_TEST_EMAIL` / `SEED_TEST_PASSWORD` env vars).

### Key commands

Standard commands are in `package.json` scripts — see `README.md` "Quick start" section. Non-obvious notes:

- **Lint**: `npm run lint` (runs `npx expo lint`; picks up `.env` automatically)
- **Typecheck**: `npm run typecheck` — there is 1 pre-existing TS error in `hooks/__tests__/useCalendarSync.native.test.ts` (duplicate property in object literal); this is not blocking.
- **Unit tests**: `npm run test:unit` — runs three `tsx` test scripts (services/middleware, locations, authz-policy)
- **Functions build**: `npm run functions:build` — must succeed before emulators can load functions
- **Web export build**: `npm run build-web` — uses mock fallbacks for Firebase env vars if not set
- **Full QA**: `npm run qa:solid` (lint + typecheck + unit + integration + web build + route hygiene)

### Gotchas

- The `postinstall` script runs `patch-package` and `scripts/fix-metro-core.js` (re-extracts metro-core 0.83.3 src files). If `npm install` fails on postinstall, check that network access is available for `npm pack metro-core@0.83.3`.
- Firebase CLI is installed as a local dependency (not global). Use `npx firebase ...` to run it.
- Emulators require JDK 11+. The environment has OpenJDK 21.
- The `server/` (Sharp image processor) and `pipeline/` (BullMQ event scraper) directories are independent services not required for main development or testing.

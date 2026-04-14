# CulturePass AU — Master Engineer Reference (AGENTS.md)

> The definitive blueprint for CulturePass: architecture, tech stack, design laws, data models, and API patterns. **Read this before touching code.**
>
> **Last Updated**: 14 April 2026
> **Related Docs**: [`CLAUDE.md`](CLAUDE.md) (Quickstart), [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md), [`docs/UI_SYSTEM.md`](docs/UI_SYSTEM.md) (tokens + marketing layout), [`culturepass-rules.md`](culturepass-rules.md), [`docs/AI_AGENT_STYLE_SHEET.md`](docs/AI_AGENT_STYLE_SHEET.md).

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
3. **QA**: Run `npm run qa:solid` (lint, typecheck, `qa:all` — package.json + deeplinks + unit + integration + e2e smoke — then `functions:build`, `build-web`, `test:web:route-hygiene`). For a lighter pass that still covers web export and API integration, run the commands in **Cursor Cloud → Full automated QA checklist** below.
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

These notes apply to **Cursor Cloud / agent VMs** and any environment where services start from a clean workspace. They complement `CLAUDE.md` local-dev steps.

### VM / workspace bootstrap (cold start)

Run once after clone or when the VM image starts without `node_modules` / `functions/lib`:

```bash
npm install
cd functions && npm install && npm run build && cd ..
```

- Root `npm install` runs `postinstall` (`patch-package`, Metro fix script).
- **`functions` must be built** before `firebase emulators:start`; the emulator serves compiled output from `functions/lib/`.

### Services overview

| Service | Command | Port | Required |
|---------|---------|------|----------|
| Expo Web Dev Server | `npx expo start --web --port 8081` | 8081 | Yes |
| Firebase Emulators | `npx firebase emulators:start --only functions,firestore,auth,storage` | 5001 (Functions), 8080 (Firestore), 9099 (Auth), 9199 (Storage), 4000 (UI) | Yes |

### Starting the dev environment

1. **Firebase emulators first**: Start emulators before the Expo dev server so the API is ready when the frontend loads. Functions must be built before starting emulators: `cd functions && npm run build && cd ..`.
2. **Expo web dev server**: `npx expo start --web --port 8081`. The `.env` file must exist with `EXPO_PUBLIC_*` Firebase config vars (even placeholder values work with emulators) and `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`.
3. **Health check**: `curl http://localhost:5001/culturepass-4f264/us-central1/api/health` should return `{"status":"ok"}`.

### Key gotchas

- **`.env` is required at startup**: The Expo bundler reads `EXPO_PUBLIC_*` vars at bundle time. If `.env` is missing or a required Firebase key is empty, the app throws immediately on load. Copy `.env.example` to `.env` and fill placeholder values.
- **Functions must be compiled**: The emulator loads from `functions/lib/`. Always run `cd functions && npm run build` after changing backend code. The `build:watch` script (`npm run build:watch` inside `functions/`) is useful for iterative backend development.
- **`postinstall` runs `patch-package`**: The root `npm install` automatically runs `patch-package` and `scripts/fix-metro-core.js`. If patches fail, check the `patches/` directory.
- **Protected routes**: Calendar, Community, Perks, and Profile tabs require authentication (`AuthGuard`). The Discover page and public event/profile detail pages are accessible without login.
- **`test:web:route-hygiene` needs a build**: This test validates the `dist/` output. Run `npm run build-web` first if `dist/` doesn't exist. The number of scanned HTML files matches the static route list from `expo export` and will change when routes are added or removed.
- **Firebase Emulator UI**: When emulators are running, open `http://localhost:4000` for the suite UI (Firestore, Auth, Functions, Storage tabs).

### Full automated QA checklist (recommended before merge)

Run in order (same shape as a typical Cloud agent verification pass):

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:unit`
4. `npm run test:integration`
5. `npm run functions:build` (or `cd functions && npm run build`)
6. `npm run build-web`
7. `npm run test:web:route-hygiene`

Stricter repo gate: `npm run qa:solid` (adds package.json validation, deeplink test, and e2e smoke on top of the above pattern).

### Manual smoke (web + emulators)

- Expo web: Discover loads with **desktop sidebar**, content rails, and city cards (`npx expo start --web --port 8081`).
- With emulators up: **Emulator UI** at `http://localhost:4000`.

### Commands quick reference

See `CLAUDE.md` "Local Development" section for emulator seeding and native commands. Key scripts:

- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Unit tests**: `npm run test:unit`
- **Integration tests**: `npm run test:integration`
- **Functions compile**: `npm run functions:build`
- **Web export**: `npm run build-web`
- **Static HTML hygiene**: `npm run test:web:route-hygiene`
- **Full QA**: `npm run qa:solid`

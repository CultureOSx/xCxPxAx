# CulturePass AU — Master Engineer Reference (AGENTS.md)

> The definitive blueprint for CulturePass: architecture, tech stack, design laws, data models, and API patterns. **Read this before touching code.**
>
> **Last Updated**: April 2026
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
3. **QA**: Run `npm run qa:solid` (Lint + Typecheck + Integration tests).
4. **Deploy Web**: `npm run deploy-web` (Expo Export → Hosting).
5. **Deploy Native**: `eas build --platform ios --profile production`.

---

## 9. Future Roadmap

- [ ] GeoHash backfill for all existing events.
- [ ] Push notification category opt-outs.
- [ ] Promotional code system (`promoCodes` collection).
- [ ] Apple/Google Pay wallet top-up integration.

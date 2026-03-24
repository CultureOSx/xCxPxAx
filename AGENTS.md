# CulturePass AU — AGENTS.md

Project guide for AI agents and engineers. Read this before touching code.

> **Design Principles**: Before writing any UI code, read [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md).
> It defines the five core CulturePass design laws (Cultural Minimalism, Token Integrity, Platform Parity,
> Approachable Complexity, Technical Craftsmanship) and the per-screen implementation checklist.

---

## Project Overview

Cross-platform cultural lifestyle marketplace for diaspora communities (AU, NZ, UAE, UK, CA).
**Stack**: Expo 55 + React 19.1.0 + React Native 0.83 + Expo Router 5 + Reanimated 4 + Firebase 11 (Auth + Firestore + Cloud Functions + Storage).
**Current date context**: Refer to `currentDate` in system prompt for today's date.
**App Store launch target**: 15 April 2026 — Sydney + Melbourne public launch.

### Product Identity
CulturePass is a **B2B2C marketplace** — not a government portal, not an NGO tool.
It connects Users → Events/Businesses/Venues/Communities in cultural diaspora cities.
Council (LGA) is a **location attribute** for proximity services, not a governance identity feature.

---

## Architecture

```
app/                    Expo Router screens
  (onboarding)/         Login, signup, location, interests, culture-match, communities
  (tabs)/               5-tab layout: Discover, Calendar, Community, Perks, Profile
                        + directory.tsx, explore.tsx, events.tsx inside tabs group
  event/[id].tsx        Event detail + ticket purchase
  event/create.tsx      9-step event creation wizard (basics, image, location, datetime,
                        entry type, tickets[conditional], team/artists/sponsors, culture, review)
  profile/, tickets/    User profile, ticket management
  admin/                Admin panels: dashboard.tsx, users.tsx, audit-logs.tsx, notifications.tsx
  dashboard/            Organizer panels: organizer.tsx, venue.tsx, sponsor.tsx
  payment/              Payment flows
  search/, saved/       Search results, saved items
  settings/             User settings
  membership/           Subscription management

components/
  ui/                   Button, Card, Badge, Input, Avatar, Checkbox, Skeleton, SocialButton,
                        BackButton, PasswordStrengthIndicator, InlinePopoverSelect
  Discover/             EventCard, WebHeroCarousel, WebRailSection, WebEventRailCard,
                        SpotlightCard, CommunityCard, CityCard, CategoryCard, SectionHeader
  web/                  WebSidebar.tsx (240px desktop sidebar), WebTopBar.tsx
  tabs/                 TabScreenShell.tsx, TabSectionShell.tsx
  calendar/             Filter, MonthGrid, event cards, map toggle (5 files)
  perks/                PerkCouponModal, PerkDetails, PerkHero, etc. (10 files)
  scanner/              Ticket result card, Scanner styles, utils, types (4 files)
  profile/              GuestProfileView, MenuItem
  user/                 UserProfileHero, Details, Identity, Tier, About, Social, utils (7 files)
  AuthGuard.tsx         Wraps protected screens — redirects to login if unauthenticated
  ErrorBoundary.tsx     Wrap every screen with async data in this
  BrowsePage.tsx        Browse/discovery page shell
  NativeMapView.tsx     Platform-specific map (.native.tsx / .web.tsx variants)
  FilterChip.tsx        Filter chip component
  FilterModal.tsx       Filter modal

constants/
  theme.ts              SINGLE IMPORT POINT — re-exports all tokens
  colors.ts             CultureTokens, light/dark themes, shadows, glass, gradients, neon
  typography.ts         Poppins scale + desktop overrides
  spacing.ts            4-point grid, Breakpoints, Layout
  elevation.ts          ButtonTokens, CardTokens, InputTokens, AvatarTokens, TabBarTokens
  animations.ts         Animation durations and easing
  locations.ts          City/country list with coordinates
  onboardingInterests.ts Interest categories + tags for onboarding

hooks/
  useColors.ts          Theme-aware color access (dark = default on native, light = web)
  useLayout.ts          Responsive layout values: isDesktop, numColumns, hPad, sidebarWidth, columnWidth()
  useRole.ts            Role checking: isOrganizer, isAdmin, hasMinRole()
  useProfile.ts         User profile loading with React Query
  useCouncil.ts         Council LGA data for location services (area events, civic reminders)
  useLocationFilter.ts  Location filtering logic
  useLocations.ts       Location list management
  useNearestCity.ts     Geolocation → nearest supported city
  useNearbyEvents.ts    GPS-based proximity event discovery (calls /api/events/nearby)
  useAlgolia.ts         Algolia search hook — useAlgoliaSearch({ indexName, query, city, council })
  usePushNotifications.ts  FCM token registration + notification handlers

lib/
  api.ts                Typed API client — ONLY way to call the backend (150+ endpoints)
  auth.tsx              Firebase Auth provider + useAuth() hook
  firebase.ts           Firebase SDK init (platform-aware: AsyncStorage on native, localStorage on web)
  query-client.ts       TanStack React Query setup + apiRequest()
  config.ts             App configuration — reads EXPO_PUBLIC_* env vars; no hardcoded fallbacks
  feature-flags.ts      Feature flag rollout system
  reporting.ts          Content moderation report system (submitReport, confirmAndReport, quickReport)
                        ← NOT Sentry. Sentry has been removed from this project entirely.
  navigation.ts         Navigation utilities
  image-manipulator.ts  Platform-specific image processing (.native.ts / .web.ts variants)

contexts/
  OnboardingContext     city, country, interests, isComplete — synced from auth user on login
  SavedContext          saved events, joined communities (local + API)
  ContactsContext       user contacts directory

shared/schema.ts        Shared TypeScript types — master re-export
shared/schema/          Domain schemas: event, user, ticket, profile, notification, perk,
                        wallet, social, media, moderation, common, entities

functions/src/
  app.ts                Express app — routes split across 19 route files (app.ts itself is ~112 lines)
  admin.ts              Firebase Admin SDK singleton
  index.ts              Cloud Functions entry point (exports `api` HTTP function + `onEventWritten` trigger)
  triggers.ts           Firestore trigger: onEventWritten → syncs to feed collection + Algolia index
  middleware/
    auth.ts             Firebase ID token verification + role guards (requireAuth, requireRole, etc.)
    moderation.ts       Content moderation (bad words, suspicious links, XSS, SQL injection)
  routes/               19 route files — one per domain
    admin.ts            Admin routes incl. POST /admin/algolia-backfill
    events.ts           Event CRUD + GET /api/events/nearby (geoHash proximity)
    search.ts           GET /api/search — Algolia first, Firestore fallback
    feed.ts             GET /api/feed — multi-signal server-side ranking
    auth.ts, tickets.ts, users.ts, profiles.ts, council.ts, perks.ts,
    membership.ts, social.ts, stripe.ts, discovery.ts, indigenous.ts,
    locations.ts, activities.ts, movies.ts, updates.ts, misc.ts, import.ts
  services/
    algolia.ts          Algolia index service:
                          algoliaEventsIndex.indexEvent() / .deleteEvent()
                          algoliaProfilesIndex.indexProfile() / .deleteProfile()
                          exports: searchClient, EVENTS_INDEX, PROFILES_INDEX
    firestore.ts        Typed Firestore data service (usersService, eventsService, etc.)
    search.ts           Weighted full-text + trigram Firestore search (fallback when Algolia absent)
    cache.ts            In-memory TTL cache (60s default)
    rollout.ts          Feature flag phased rollout
    locations.ts        Location and city management
  jobs/
    algoliaBackfill.ts  One-time backfill: indexes all published events + profiles into Algolia.
                        Checks algoliaIndexedAt to skip already-indexed docs. Exposed via admin route.
  data/
    AllCouncilsList.csv Council/LGA seed data (32KB) — used for location picker, directory cards
    seed-events.json    Sample events
    seed-communities.json Sample communities

server/                 Supplementary Docker service (image processing, job queue)
  src/index.ts          Express server entry
  src/routes/jobs.ts    Job processing
  src/routes/processImage.ts  Image processing with Sharp
  Dockerfile            Docker image config

dataconnect/            Firebase DataConnect (GraphQL schema — exploratory)
```

---

## Web Layout Architecture

### Desktop (≥ 1024px)
- **Left sidebar**: `components/web/WebSidebar.tsx` (240px fixed, collapsible)
- **No top bar**: The old 64px top nav bar is GONE — sidebar replaces it
- **Top inset**: `0` on all web layouts (no fixed nav at top)
- Content occupies `flex: 1` to the right of the sidebar

### Tablet (768–1023px) / Mobile Web
- **Bottom tab bar**: same as native mobile
- **Top inset**: `0` (safe area handled by `useSafeAreaInsets()`)

### Mobile Native (iOS / Android)
- **Bottom tab bar**: 84px with SF Symbols (iOS) / Ionicons (Android), glassmorphism blur on iOS
- **Top inset**: `useSafeAreaInsets().top` for notch/island handling

### Layout Hook
```typescript
const { isDesktop, isTablet, isMobile, numColumns, hPad, sidebarWidth, columnWidth, contentWidth } = useLayout();
```

**sidebarWidth**: 240 on desktop web, 0 elsewhere. Use when computing absolute widths.

**CRITICAL**: Never hardcode `topInset = Platform.OS === 'web' ? 67 : insets.top`.
Use: `const topInset = Platform.OS === 'web' ? 0 : insets.top;`

---

## Essential Rules

### NEVER Do
- Call `useAuth()`, `useColors()`, or any hook outside a React component — they are hooks, not utilities.
- Use `any` type — always type properly; use `Record<string, unknown>` + explicit casts or type narrowing.
- Hardcode hex colors, spacing numbers, or font sizes in components — use `useColors()`, `Spacing`, `TextStyles`, `CardTokens`, etc.
- Write `<Pressable><Text>button</Text></Pressable>` — always use `<Button>` from `components/ui`.
- Import from individual `constants/*.ts` files in screens — always import from `constants/theme` (the master re-export).
- Add duplicate routes to Cloud Functions route files — check the relevant route file first before adding.
- Hardcode `topInset = Platform.OS === 'web' ? 67 : insets.top` — this was the old top-bar value. Web top inset is `0`.
- Use raw `fetch()` for API calls — always use `api.*` from `lib/api.ts`.
- Directly import Firebase SDK in screens — use the typed helpers in `lib/api.ts` and `lib/auth.tsx`.
- Create ad-hoc StyleSheet objects inside render functions — use `StyleSheet.create()` at module level.
- Use `console.log` in production code — use `if (__DEV__)` guards.
- Commit API keys, Stripe keys, or `.env` files — use `EXPO_PUBLIC_*` vars baked in at build time.
- Use `AsyncStorage` directly for auth tokens — `lib/query-client.ts` `setAccessToken()` handles this.
- Import or reference `@sentry/node` or `@sentry/react-native` — **Sentry has been removed from this project**. Use `console.error` + `captureRouteError()` from `functions/src/routes/utils.ts` in Cloud Functions.
- Use `lib/reporting.ts` for error monitoring — it is a **user content report system** (spam, fake events, harassment), not an error logger.

### ALWAYS Do
- Use `api.*` from `lib/api.ts` for all backend calls.
- Use `useLayout()` for all responsive values (padding, columns, breakpoints, sidebarWidth).
- Use `useColors()` for theme-aware colors — never hardcode hex in JSX.
- Wrap new screens with async data in `<ErrorBoundary>`.
- Handle 401 errors with `ApiError.isUnauthorized()` — redirect to login.
- Use `useQuery` / `useMutation` from TanStack React Query for all server state.
- Use `useSafeAreaInsets()` for native bottom/top insets; web top inset is always `0`.
- Use `Haptics.*` (from `expo-haptics`) for tactile feedback on interactive elements (iOS/Android only).
- Use `Image` from `expo-image` (not `react-native`) for all image rendering — it has better caching.
- Test on all three platforms: iOS, Android, web — use `Platform.OS` guards when behaviour differs.
- Use `Platform.select()` or `.native.tsx` / `.web.tsx` file suffixes for large platform divergences.
- Check `isOrganizer` / `isAdmin` from `useRole()` before rendering sensitive UI.
- Add `accessibilityLabel` and `accessibilityRole` to all interactive elements.
- Run `npm run typecheck` and `npm run lint` before committing.
- In Cloud Functions route catch blocks, use `captureRouteError(err, 'ROUTE_NAME')` from `./utils`.

---

## Algolia Search

Algolia is the primary search engine. Firestore search is the fallback when Algolia credentials are absent.

### Indices
| Index | Contents | Facets |
|-------|----------|--------|
| `culturepass_events` | All published events | `city`, `country`, `category`, `cultureTag[]`, `entryType` (free/ticketed) |
| `culturepass_profiles` | All published profiles | `city`, `country`, `entityType`, `isVerified` |

### Client-side (React Native / Web)
```typescript
import { useAlgoliaSearch } from '@/hooks/useAlgolia';

const { results, loading, isConfigured } = useAlgoliaSearch({
  indexName: 'culturepass_events',
  query,
  city,          // facet filter
  council,       // facet filter
  hitsPerPage: 20,
});
// isConfigured = false when EXPO_PUBLIC_ALGOLIA_APP_ID is empty → use /api/search fallback
```

### Server-side (Cloud Functions)
```typescript
import { algoliaEventsIndex, algoliaProfilesIndex } from '../services/algolia';

// Index on publish/update:
await algoliaEventsIndex.indexEvent({ ...eventData, id: eventId });

// Remove on soft-delete:
await algoliaEventsIndex.deleteEvent(eventId);

// Index a profile:
await algoliaProfilesIndex.indexProfile({ id, name, entityType, city, ... });
```

### Backfill
Run once after setting `ALGOLIA_APP_ID` + `ALGOLIA_ADMIN_KEY` in Cloud Functions config:
```bash
curl -X POST https://us-central1-culturepass-b5f96.cloudfunctions.net/api/admin/algolia-backfill \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
# force: true → re-indexes everything, ignoring algoliaIndexedAt timestamp
```

### Env vars required
```bash
# Client (safe to bundle — search-only key)
EXPO_PUBLIC_ALGOLIA_APP_ID=
EXPO_PUBLIC_ALGOLIA_SEARCH_KEY=

# Cloud Functions only — never in EXPO_PUBLIC_*
ALGOLIA_APP_ID=
ALGOLIA_ADMIN_KEY=
```

---

## Design Token System

### Core Brand Tokens
```typescript
import { CultureTokens } from '@/constants/theme';

CultureTokens.indigo   // #2C2A72 — Culture Indigo (primary brand CTA)
CultureTokens.saffron  // #FF8C42 — Festival Saffron (warm discovery)
CultureTokens.coral    // #FF5E5B — Movement Coral (action energy)
CultureTokens.gold     // #FFC857 — Temple Gold (cultural premium)
CultureTokens.teal     // #2EC4B6 — Ocean Teal (global belonging)
```

### Functional Category Tokens
```typescript
CultureTokens.event      // Saffron — event listing
CultureTokens.artist     // Coral — artist profiles
CultureTokens.venue      // Teal — venues
CultureTokens.movie      // Gold — movies
CultureTokens.community  // Bright Blue — communities
```

### Component Tokens
```typescript
import { ButtonTokens, CardTokens, InputTokens, ChipTokens, AvatarTokens, TabBarTokens } from '@/constants/theme';

ButtonTokens.height.md    // 52 (Apple minimum touch target)
ButtonTokens.radius       // 16
CardTokens.radius         // 16
CardTokens.padding        // 16
InputTokens.height        // 48
AvatarTokens.size.md      // 40
TabBarTokens.heightMobile // 84 (includes safe area)
```

### Theme Colors
```typescript
import { useColors } from '@/hooks/useColors';

const colors = useColors();
// colors.background, colors.surface, colors.surfaceElevated
// colors.text, colors.textSecondary, colors.textTertiary
// colors.primary, colors.secondary, colors.accent, colors.gold
// colors.success, colors.warning, colors.error, colors.info
// colors.border, colors.borderLight, colors.divider
// colors.primaryGlow  // subtle background tint of primary color
```

Dark mode is the **default experience** (night festival aesthetic) on native.
Web uses light mode (`useColors()` always returns `light` theme on web).

### Gradients
```typescript
import { gradients } from '@/constants/theme';

gradients.culturepassBrand  // [Indigo, Saffron, Coral] — hero banners, CTAs
gradients.primary           // [Indigo, Blue] — tab bar active pill
gradients.aurora            // light blue/purple — backgrounds
gradients.sunset            // warm orange/coral — event cards
gradients.midnight          // deep indigo — dark backgrounds
```

### Neon (Use Sparingly)
```typescript
import { neon } from '@/constants/theme';

neon.blue, neon.purple, neon.teal  // focused/active states only
```

### Animations
```typescript
import { animations } from '@/constants/theme';

animations.duration.fast    // 150ms
animations.duration.normal  // 300ms
animations.duration.slow    // 500ms
animations.easing.default   // standard easing curve
```

**Full token docs**: `docs/DESIGN_TOKENS.md`

---

## Responsive Layout Patterns

### Breakpoints
```typescript
import { Breakpoints } from '@/constants/theme';

Breakpoints.tablet   // 768px — tablet cutoff
Breakpoints.desktop  // 1024px — desktop cutoff (sidebar appears)
Breakpoints.wide     // 1280px — wide screen
```

### Grid Pattern (Screens)
```typescript
const { numColumns, hPad, columnWidth, isDesktop, sidebarWidth } = useLayout();

// Event grid
<View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: hPad, gap: 14 }}>
  {events.map(event => (
    <View key={event.id} style={{ width: columnWidth() }}>
      <EventCard event={event} />
    </View>
  ))}
</View>
```

### Web Top Inset Pattern (Correct)
```typescript
// In any screen component:
const insets = useSafeAreaInsets();
const topInset = Platform.OS === 'web' ? 0 : insets.top;  // ← Always 0 on web
```

---

## Routing & Navigation

### File-Based Routes (Expo Router)
All routes are defined by file paths. New screens must be registered in `app/_layout.tsx`'s Stack.

### Navigating
```typescript
import { router } from 'expo-router';

router.push('/event/abc123');
router.replace('/(onboarding)/location');
router.back();

// Typed push with params:
router.push({ pathname: '/profile/[id]', params: { id: profile.id } });
```

### Route Guards
- `AuthGuard` component wraps protected screens — import from `components/AuthGuard`
- `useRole()` provides `isOrganizer`, `isAdmin`, `hasMinRole(role)`
- Redirects to `/(onboarding)/login?redirectTo=/protected-route` on 401

---

## Council as Location Service (LGA)

Council (Local Government Area) is a **location attribute**, not an identity or governance feature.
CulturePass is a marketplace — councils exist to power proximity-based services.

### What councils ARE in CulturePass
- A location dimension on events, businesses, and users (`lgaCode`, `councilId` fields)
- A browsable directory category (filter chip in `directory.tsx`)
- A context for "Events in Your Area" — discover rail shows events matching user's LGA
- An admin data set: ~1000 AU councils in `AllCouncilsList.csv` used as reference data

### What councils are NOT
- A governance/political feature
- A tab or major navigation destination
- Something users "claim" or "manage"
- A content type with its own detail pages

### Architecture
```typescript
// useCouncil — reads user's selected council LGA, used for local event filtering
import { useCouncil } from '@/hooks/useCouncil';
const { data: councilData } = useCouncil();
const council = councilData?.council;          // { id, name, lgaCode, suburb, state }

// Events filtered by council LGA:
events.filter(e => e.lgaCode === council.lgaCode || e.councilId === council.id)

// api.council.list — used by directory to show councils as browsable cards
api.council.list({ pageSize: 2000, sortBy: 'name' })
```

### Directory integration
- `ENTITY_FILTERS` in `directory.tsx` includes Council, Government, Charity as **browse filters**
- Council profiles are pulled from `api.council.list` and merged into the directory listing
- Users can browse local councils the same way they browse businesses or venues

### Data
- `functions/src/data/AllCouncilsList.csv` — ~1000 AU council LGAs (reference data)
- `councils/` Firestore collection — council records with `lgaCode`, `suburb`, `state`, `verificationStatus`
- Admin management: `app/admin/dashboard.tsx` → full admin panel (no dedicated council page)

---

## API Patterns

### Data Fetching (React Query)
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';

// Query
const { data: events, isLoading, error } = useQuery({
  queryKey: ['/api/events', city, country],
  queryFn: () => api.events.list({ city, country, pageSize: 50 }),
});

// Mutation
const { mutate: purchaseTicket } = useMutation({
  mutationFn: (data: PurchaseData) => api.tickets.purchase(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/tickets'] }),
  onError: (err) => {
    if (err instanceof ApiError && err.isUnauthorized()) router.push('/login');
  },
});
```

### Error Handling
```typescript
import { ApiError } from '@/lib/api';

try {
  await api.events.create(data);
} catch (err) {
  if (err instanceof ApiError) {
    if (err.isUnauthorized()) return router.push('/(onboarding)/login');
    if (err.isNotFound()) return setError('Event not found.');
    if (err.status === 429) return setError('Too many requests. Please slow down.');
    setError(err.message);
  }
}
```

### Cloud Functions — Route Error Logging
```typescript
// In every route catch block — do NOT use bare console.error
import { captureRouteError } from './utils';

} catch (err) {
  captureRouteError(err, 'GET /api/events/:id');
  return res.status(500).json({ error: 'Failed to fetch event' });
}
```

### Cache Invalidation
```typescript
import { queryClient } from '@/lib/query-client';

// After mutation, invalidate affected queries:
queryClient.invalidateQueries({ queryKey: ['/api/events'] });
queryClient.invalidateQueries({ queryKey: [`/api/tickets/${userId}`] });
```

---

## Authentication

### useAuth() Hook
```typescript
const { isAuthenticated, userId, user, accessToken, logout, hasRole } = useAuth();

// Check role:
if (!hasRole('organizer', 'admin')) return null;

// User shape:
user.id, user.username, user.email, user.role
user.city, user.country, user.subscriptionTier
user.isSydneyVerified, user.interests, user.communities
```

### Auth Flow
1. Firebase Auth (`firebase/auth`) handles login/signup/OAuth
2. `onAuthStateChanged` → fires on every auth state change
3. `api.auth.me()` → fetches full user profile from Cloud Functions
4. Token stored in query-client module store via `setAccessToken()`
5. `DataSync` component syncs `city`/`country` → `OnboardingContext`

### Social Sign-In
- **Web**: Firebase `signInWithPopup(auth, new GoogleAuthProvider())`
- **iOS/Android**: `@react-native-google-signin/google-signin` → Firebase credential
- **Apple (iOS only)**: `expo-apple-authentication` → `OAuthProvider('apple.com')` credential
- Configure `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` for native Google Sign-In

---

## State Management

| Concern | Solution |
|---------|----------|
| Server data | TanStack React Query (`useQuery`, `useMutation`) |
| Auth state | `AuthProvider` + `useAuth()` |
| Onboarding state | `OnboardingContext` (city, country, interests, isComplete) |
| Saved items | `SavedContext` (savedEvents, joinedCommunities) |
| Contacts | `ContactsContext` |
| UI state | `useState` / `useReducer` local to component |

---

## iOS-Specific Guidelines

- Always test on physical iOS device for: haptics, BlurView, SF Symbols, safe area insets
- Use `SymbolView` from `expo-symbols` for SF Symbols (iOS 16+); fall back to Ionicons
- `expo-haptics`: `selectionAsync()` for selection, `notificationAsync(Success/Error/Warning)` for feedback
- Minimum iOS target: 16.0 (set in `app.json` → `ios.minimumOsVersion`)
- BlurView intensity: 60–90 for frosted glass effect; wrap in `try/catch` on simulator
- Use `KeyboardAvoidingView` with `behavior="padding"` on iOS
- Apple Sign-In is **required** by App Store guidelines if you offer other social sign-in
- Push notifications: register FCM token via `expo-notifications` after login
- App Transport Security (ATS): all HTTP calls must go to HTTPS in production

---

## Android-Specific Guidelines

- Minimum SDK: 26 (Android 8.0), target SDK: 35 (set in `app.json`)
- `KeyboardAvoidingView` behavior: `"height"` on Android (not `"padding"`)
- `BlurView` not supported — use semi-transparent `rgba()` backgrounds instead
- Haptics: same `expo-haptics` API works on Android
- Google Sign-In: configure SHA-1 fingerprint in Firebase console for debug + release keystore
- `react-native-maps`: requires Google Maps API key (`EXPO_PUBLIC_GOOGLE_MAPS_KEY`)
- Status bar: use `expo-status-bar` with `style="light"` for dark backgrounds
- Edge-to-edge display: handle bottom navigation bar with `useSafeAreaInsets().bottom`

---

## Performance Guidelines

- **memoize** expensive computations: `useMemo(() => sortedEvents, [events, sortKey])`
- **memoize** callbacks passed to child components: `useCallback(() => handler, [deps])`
- **Lazy load** heavy screens with `React.lazy()` + `<Suspense>` on web
- **Image caching**: always use `expo-image` (not `react-native` `Image`) — it handles disk cache
- **List virtualization**: use `FlatList` with `keyExtractor` and `getItemLayout` for long lists
- **Avoid inline styles**: define `StyleSheet.create()` outside the component
- **React Compiler** is enabled (`babel-plugin-react-compiler`) — avoid manual `useMemo`/`useCallback` unless profiling shows a need
- **Bundle splitting**: `Platform.OS` guards tree-shake platform-specific code
- **Query stale time**: default is 0 (always refetch on mount) — set `staleTime: 60_000` for stable data

---

## Security Guidelines

- **Never** put `STRIPE_SECRET_KEY`, `ALGOLIA_ADMIN_KEY`, or other server secrets in `EXPO_PUBLIC_*` vars — they're bundled into the client
- **No hardcoded credentials** in `lib/config.ts` — all config via `EXPO_PUBLIC_*` env vars. Missing keys log a warning and Firebase fails gracefully on first use (correct behaviour — don't add fallbacks)
- **Input validation**: use `zod` for all user-controlled input before sending to API
- **XSS**: avoid `dangerouslySetInnerHTML` — use React Native `Text` which is XSS-safe
- **Deep links**: validate `redirectTo` params — only allow internal routes (`/` prefix, no `://`)
- **Image uploads**: validate MIME type + size on both client and server (Sharp processes server-side)
- **Rate limiting**: API has 200 req/min global rate limit (`express-rate-limit` in `functions/src/app.ts`)
- **Firestore rules**: `firestore.rules` enforces ownership — never bypass via Admin SDK on client
- **Token storage**: Firebase ID tokens only stored in memory + `AsyncStorage` — not `SecureStore` (short-lived, auto-refresh)
- **Role checks**: always use server-side role guards (`requireRole()` middleware) — client UI checks are for UX only
- **No Sentry**: error monitoring via `console.error` + Cloud Logging. `captureRouteError()` in Cloud Functions, `if (__DEV__) console.error()` in client code

---

## Testing

```bash
npm run test:unit          # Service + middleware unit tests
npm run test:integration   # API route integration tests (requires running server)
npm run test:e2e:smoke     # Critical path smoke tests
npm run qa:all             # All of the above + package.json validation
npm run typecheck          # TypeScript type check (no emits)
npm run lint               # ESLint check
npm run lint:fix           # ESLint auto-fix
```

### Testing Patterns
- Unit tests live in `__tests__/` subdirectories or `*.test.ts` siblings
- Use `@testing-library/react-native` for component tests
- Mock `lib/api.ts` at the module level for unit tests
- Integration tests run against the local Firebase emulator
- Don't test implementation details — test user-visible behavior

---

## Environment Variables

```bash
# Firebase (client SDK — baked into bundle at build time via EXPO_PUBLIC_*)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# API base URL — MUST be set in eas.json build.production.env for production builds
EXPO_PUBLIC_API_URL=https://us-central1-culturepass-b5f96.cloudfunctions.net/api/

# Algolia (client — search-only key, safe to bundle)
EXPO_PUBLIC_ALGOLIA_APP_ID=
EXPO_PUBLIC_ALGOLIA_SEARCH_KEY=

# Social Auth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=     # Google Sign-In web client ID (for native OAuth)
EXPO_PUBLIC_GOOGLE_MAPS_KEY=          # Google Maps API key (Android)

# Stripe (Cloud Functions ONLY — never in Expo bundle)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_YEARLY_ID=price_...

# Algolia (Cloud Functions ONLY — admin key, never in Expo bundle)
ALGOLIA_APP_ID=
ALGOLIA_ADMIN_KEY=
```

Mirror all `EXPO_PUBLIC_*` vars in `eas.json` under `build.*.env` for EAS builds.
`EXPO_PUBLIC_API_URL` is already set in `eas.json` `build.production.env`.

---

## Local Development

```bash
# Install
npm install
cd functions && npm install && cd ..

# Start Expo (native + web)
npx expo start

# Start web only
npx expo start --web

# Start Cloud Functions emulator
firebase emulators:start --only functions,firestore,auth,storage

# Type check (no output files)
npm run typecheck

# Lint
npm run lint
```

Set `EXPO_PUBLIC_API_URL=http://localhost:5001/culturepass-b5f96/us-central1/api/` when using the emulator.

### Supplementary Server (Image Processing)
```bash
# Docker-based Node.js server in server/
cd server && npm install
docker build -t culturepass-server .
docker run -p 3001:3001 culturepass-server
```
Used for Sharp-based image processing and background job queue. Not required for main app development.

---

## Building & Deploying

### iOS (App Store)
```bash
# 1. Bump version in app.json (version + ios.buildNumber)
eas build --platform ios --profile production
eas submit --platform ios
```

### Android (Google Play)
```bash
# 1. Bump version in app.json (version + android.versionCode)
eas build --platform android --profile production
eas submit --platform android
```

### Web (Firebase Hosting)
```bash
npm run build-web   # expo export --platform web → dist/
npm run deploy-web  # build-web + firebase deploy --only hosting
```

### Cloud Functions
```bash
cd functions && npm run build  # TypeScript → lib/
cd .. && firebase deploy --only functions
```

**Deploy order**: functions FIRST, then app — never the reverse when adding new endpoints.

---

## Firestore Data Model

```
users/{uid}
  username, displayName, email, city, country
  role: 'user' | 'organizer' | 'moderator' | 'admin' | 'cityAdmin' | 'platformAdmin'
  membership: { tier, expiresAt }
  stripeCustomerId, stripeSubscriptionId
  isSydneyVerified, interests[], culturePassId
  lgaCode?: string                          ← council LGA (written server-side on onboarding)
  createdAt, updatedAt

events/{eventId}
  title, description, venue, address, date, time, endDate?, endTime?, city, country
  imageUrl, heroImageUrl?, cultureTag[], tags[], category
  priceCents, tiers[], isFree, isFeatured
  entryType: 'ticketed' | 'free'           ← set during event creation wizard
  organizerId, capacity, attending
  artists?: EventArtist[]                   ← performers added in Core Team step
  eventSponsors?: EventSponsor[]            ← sponsors with tiers
  hostInfo?: EventHostInfo                  ← host name/email/phone
  status: 'draft' | 'published' | 'cancelled'
  lgaCode?: string                          ← council LGA for proximity filtering
  councilId?: string                        ← linked council record
  deletedAt (soft delete), publishedAt
  cpid (CP-EVT-xxx), geoHash, latitude, longitude
  algoliaIndexedAt?: number                 ← set by backfill/trigger; used to skip re-index

tickets/{ticketId}
  eventId, userId, status, paymentStatus
  qrCode, cpTicketId, priceCents
  cashbackCents, rewardPoints
  history[]: { action, timestamp, actorId }

profiles/{profileId}
  entityType: 'community' | 'business' | 'venue' | 'artist' | 'organisation'
  name, description, imageUrl, city, country
  ownerId, isVerified, rating
  lgaCode?: string                          ← council LGA for location services
  socialLinks: { website, instagram, facebook, twitter }
  algoliaIndexedAt?: number                 ← set by backfill; used to skip re-index

councils/{councilId}
  name, suburb, state, lgaCode, country
  websiteUrl?, phone?, addressLine1?
  verificationStatus: 'verified' | 'unverified'
  description?
```

### Security Rules
See `firestore.rules`:
- Users can read/write their own `users/{uid}` doc
- Events: anyone can read published; only organizer/admin can write
- Tickets: owner can read; Cloud Functions (Admin SDK) write — bypasses client rules
- Profiles: public read; owner + admin write

---

## Known Gaps (Production Readiness Checklist)

### Infrastructure ✅ Complete
- [x] Stripe real payment flow — subscription checkout, webhook handler, cancel → Firestore
- [x] Profiles/communities routes → `profilesService` (Firestore)
- [x] Custom Firebase claims — tier synced on subscribe/cancel
- [x] `api.membership.*` — subscribe, get, cancel, memberCount
- [x] WebSidebar integrated into desktop tab layout
- [x] Google Sign-In wired on iOS/Android (native Google SDK + Firebase credential)
- [x] Apple Sign-In wired on iOS (expo-apple-authentication + Firebase OAuthProvider)
- [x] Social sign-in on signup screen (Google + Apple)
- [x] AuthGuard component implemented across protected screens
- [x] Push notifications hook (`usePushNotifications.ts`) — FCM token registration + handlers
- [x] Express security headers + SSRF mitigations in Cloud Functions
- [x] Migrate remaining in-memory Maps (wallets, notifications, perks, tickets) → Firestore
- [x] Offline mutation queue (AsyncStorage → sync on reconnect)
- [x] Analytics (PostHog / Firebase Analytics)
- [x] Deep link testing (Universal Links on iOS, App Links on Android)
- [x] App Store screenshots and metadata
- [x] WCAG accessibility audit
- [x] Hardcoded Firebase credentials removed from `lib/config.ts`
- [x] `EXPO_PUBLIC_API_URL` added to `eas.json` production profile
- [x] Sentry removed — package uninstalled, all imports/calls cleaned from app.ts, utils.ts, algolia.ts, triggers.ts
- [x] Algolia service wired: events index + profiles index, Firestore trigger syncs on publish/update/delete
- [x] Algolia backfill job (`functions/src/jobs/algoliaBackfill.ts`) + admin route `POST /admin/algolia-backfill`
- [x] Search route upgraded: full facet support (city, country, category, cultureTag, entryType)
- [x] GeoHash proximity endpoint `GET /api/events/nearby` — wired and tested

### Architecture (2026-03 Rebuild) ✅ Complete
- [x] Council reframed as LGA location service (not governance tab)
- [x] Removed council governance screens: council/[id], council/claim, council/select, (tabs)/council, dashboard/council, admin/council-management, admin/council-claims
- [x] Council directory cards kept — browsable via Directory Council filter chip
- [x] "Events in Your Area" rail on Discover uses lgaCode proximity matching
- [x] Event creation 9-step wizard with entryType, artists, sponsors, hostInfo, heroImage
- [x] All Events page (app/events.tsx) — single-line filter bar (category + date + price)
- [x] Explore page 2-column grid fixed — explicit pixel widths via `useLayout().width`
- [x] Directory full category set: All / Events / Indigenous / Businesses / Venues / Organisations / Councils / Government / Charities
- [x] Server-side feed ranking (`GET /api/feed`) — 7-signal weighted algorithm

### Pending — Pre-Launch (April 15 target)
- [ ] **Algolia env vars**: set `EXPO_PUBLIC_ALGOLIA_APP_ID` + `EXPO_PUBLIC_ALGOLIA_SEARCH_KEY` in `.env` and `eas.json`; set `ALGOLIA_APP_ID` + `ALGOLIA_ADMIN_KEY` in Cloud Functions config; run backfill
- [ ] **GeoHash backfill**: events missing `latitude`/`longitude`/`geoHash` need geocoding script
- [ ] Council LGA auto-selection from user's city/GPS on onboarding (`/api/councils/nearest` + onboarding UI)

### Pending — Post-Launch Sprint (April–June 2026)
- [ ] Organiser event analytics dashboard (`dashboard/event-analytics/[eventId]`)
- [ ] Promotional codes (`promoCodes/` collection, checkout validation)
- [ ] Organiser attendee messaging (FCM multicast + email queue)
- [ ] Community posts + announcements (`communities/{id}/posts/` subcollection, feature-flagged)
- [ ] Rewards points redemption UI (balance chip on Perks tab, checkout toggle)
- [ ] Tiered perk gates (lock overlay + server-side 403 on `/api/perks/:id/redeem`)
- [ ] Push notification deep links + per-category opt-out settings
- [ ] Organiser public profile pages (`profile/organizer/[id].tsx`)
- [ ] NZ + UAE city grouping on onboarding (cities grouped by country with flags)
- [ ] Wallet top-up + Apple/Google Pay (Stripe PaymentIntent, `.pkpass` generation)
- [ ] Firebase DataConnect migration (GraphQL schema in `dataconnect/` — exploratory)

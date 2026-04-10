# CulturePass — CLAUDE.md

Project guide for AI agents. Read before touching code.

> **Design Principles**: `[docs/DESIGN_PRINCIPLES.md](docs/DESIGN_PRINCIPLES.md)` — five core laws (Cultural Minimalism, Token Integrity, Platform Parity, Approachable Complexity, Technical Craftsmanship).
> **Coding rules & UI patterns**: `[culturepass-rules.md](culturepass-rules.md)` — NEVER/ALWAYS, design tokens, events.tsx standard, API patterns.
> **AI implementation style sheet**: `[docs/AI_AGENT_STYLE_SHEET.md](docs/AI_AGENT_STYLE_SHEET.md)` — agent code quality, UI contract, change discipline, and definition of done.

---

## Project Overview

Cross-platform cultural lifestyle marketplace for diaspora communities (AU, NZ, UAE, UK, CA).
**Stack**: Expo 55 · React 19.1.0 · React Native 0.83 · Expo Router 5 · Reanimated 4 · Firebase 11
**Launch**: 15 April 2026 — iOS + Android + Web (Sydney + Melbourne)

CulturePass is a **B2B2C marketplace** — not a government portal.
Connects Users → Events / Businesses / Venues / Communities in cultural diaspora cities.
Council (LGA) = **location attribute** for proximity services, not a governance feature.

---

## Architecture

```
app/
  (onboarding)/         cultures.tsx, location.tsx
  (tabs)/               index.tsx (Discover), feed.tsx, calendar.tsx, community.tsx,
                        dashboard.tsx, directory.tsx, explore.tsx, perks.tsx, profile.tsx, _layout.tsx
  [handle].tsx          Public handle redirect (/@username)
  about.tsx / map.tsx / scanner.tsx / landing.tsx / menu.tsx

  activities/           [id].tsx, index.tsx
  admin/                dashboard.tsx, users.tsx, audit-logs.tsx, notifications.tsx,
                        data-compliance.tsx, discover.tsx, finance.tsx, handles.tsx,
                        import.tsx, moderation.tsx, platform.tsx, updates.tsx
  artist/[id].tsx · business/[id].tsx · organiser/[id].tsx · venue/[id].tsx
  checkout/index.tsx · city/[name].tsx
  communities/index.tsx · community/[id].tsx
  contacts/index.tsx, [cpid].tsx
  dashboard/            organizer.tsx, venue.tsx, sponsor.tsx, wallet-readiness.tsx,
                        widgets.tsx, backstage/[id].tsx
  event/[id].tsx · event/create.tsx (9-step wizard) · events.tsx (All Events — gold standard UI)
  help/index.tsx
  legal/                cookies.tsx, event-terms.tsx, guidelines.tsx, privacy.tsx, terms.tsx
  membership/upgrade.tsx
  movies/index.tsx, [id].tsx
  notifications/index.tsx
  payment/              cancel.tsx, methods.tsx, success.tsx, transactions.tsx, wallet.tsx
  perks/[id].tsx
  profile/              [id].tsx, edit.tsx, public.tsx, qr.tsx, _components/
  restaurants/index.tsx, [id].tsx
  saved/index.tsx · search/index.tsx · submit/index.tsx
  settings/             index.tsx, about.tsx, help.tsx, location.tsx, notifications.tsx, privacy.tsx
  shopping/index.tsx, [id].tsx
  tickets/              index.tsx, [id].tsx, print/
  updates/index.tsx, [id].tsx
  user/[id].tsx

components/
  ui/           Button, Card, Badge, Input, Avatar, Checkbox, Skeleton, SocialButton,
                BackButton, PasswordStrengthIndicator, InlinePopoverSelect,
                CultureImage, DatePickerInput, FilterChips, HeaderAvatar
  Discover/     HeroCarousel, EventRail, CommunityRail, CategoryRail, CityRail,
                ActivityRail, FeaturedArtistRail, HeritagePlaylistRail,
                IndigenousSpotlight, FeedCard, SpotlightCard, SuperAppLinks,
                SectionHeader, WebHeroCarousel, WebRailSection, WebEventRailCard,
                EventCard, CommunityCard, CityCard, CategoryCard, DiscoverHeader
  xDiscover/    Mirror of Discover/ — alternative discover layout
  browse/       BrowseCard, BrowseHeader, BrowseLayout, PromotedRail
  calendar/     CalendarFilters, CalendarMonthGrid, CalendarTabs, EventCard, MapToggle
  council/      RepresentativeCard
  dashboard/    DashboardNav, DashboardShell
  event-create/ StepBasics, StepImage, StepLocation, StepDatetime, StepEntry,
                StepTickets, StepTeam, StepCulture, StepReview, Field, ReviewRow
  perks/        PerkAbout, PerkAvailability, PerkCard, PerkCouponModal, PerkDetails,
                PerkHero, PerkIndigenousCard, PerkMembershipCard
  profile/      GuestProfileView, MenuItem, CultureWalletMap (.native.tsx / .web.tsx)
  profile-public/ BrandDots, DetailRow, LoadingSkeleton, ProfileBottomBar,
                ProfileEvents, ProfileReviews, ProfileSocials, ProfileStats,
                ProfileTags, SectionHeader, SocialCard, StatItem
  scanner/      TicketResultCard, Scanner.styles.ts, types.ts, utils.ts
  tabs/         CustomTabBar, TabScreenShell, TabSectionShell
  user/         UserProfileHero, UserProfileDetails, UserProfileIdentity,
                UserProfileTier, UserProfileAbout, UserProfileSocial
  web/          WebSidebar.tsx (240px desktop sidebar), WebTopBar.tsx
  widgets/      WidgetIdentityQRCard, WidgetNearbyEventsCard, WidgetSpotlightCard, WidgetUpcomingTicketCard
  AppHeaderBar.tsx · AuthGuard.tsx · BrowsePage.tsx · ErrorBoundary.tsx · ErrorFallback.tsx
  EventCard.tsx · EventCardSkeleton.tsx · FeedCardSkeleton.tsx · FilterChip.tsx · FilterModal.tsx
  HeaderLogo.tsx · KeyboardAwareScrollViewCompat.tsx · LocationPicker.tsx · NativeMapView.tsx
  ProfileHeaderBar.tsx · ProfileQuickMenu.tsx · SocialLinksBar.tsx · WidgetSync.tsx

constants/
  theme.ts          SINGLE IMPORT POINT — re-exports all tokens
  colors.ts         CultureTokens, light/dark themes, shadows, glass, gradients, neon
  typography.ts     Poppins scale + desktop overrides
  spacing.ts        4-point grid, Breakpoints, Layout
  elevation.ts      ButtonTokens, CardTokens, InputTokens, AvatarTokens, TabBarTokens
  animations.ts     durations + easing

hooks/
  useBrowseData.ts · useColors.ts · useCouncil.ts · useDiscoverData.ts
  useImageUpload.ts · useLayout.ts · useLocationFilter.ts · useLocations.ts
  useNearbyEvents.ts · useNearestCity.ts · useProfile.ts · usePushNotifications.ts · useRole.ts
  queries/          useEvents.ts, useExplore.ts, usePerks.ts

lib/
  api.ts            Typed API client — ONLY way to call the backend (150+ endpoints)
  auth.tsx          Firebase Auth provider + useAuth()
  analytics.ts · community.ts · config.ts · dateUtils.ts · feature-flags.ts
  feedService.ts · firebase.ts · firebase/explore.ts · image-manipulator.ts
  indigenous.ts · live-activity.ts · navigation.ts · push.ts · query-client.ts
  reporting.ts      ← User CONTENT REPORT system (spam/harassment), NOT an error logger
  routes.ts · storage.ts
  widgets/          register.ts, sync.ts, sync.types.ts

contexts/           OnboardingContext · SavedContext · ContactsContext
shared/schema.ts    Master TypeScript type re-exports
shared/schema/      activity, admin, booking, checkin, council, discover, entities, event,
                    feedItem, media, moderation, movie, notification, perk, profile, ticket,
                    update, user, wallet (+ others)

functions/src/
  app.ts            Express app (~112 lines)
  index.ts          Cloud Functions entry (exports `api` + `onEventWritten` trigger)
  triggers.ts       onEventWritten → feed collection sync
  middleware/       auth.ts (requireAuth, requireRole), moderation.ts
  routes/           22 route files — one per domain
    admin.ts · events.ts (GET /api/events/nearby)
    search.ts (Firestore global search) · feed.ts (7-signal ranking)
    discovery.ts · auth.ts · tickets.ts · users.ts · profiles.ts · council.ts
    perks.ts · membership.ts · social.ts · stripe.ts · indigenous.ts
    locations.ts · activities.ts · movies.ts · updates.ts · misc.ts · import.ts · utils.ts
  services/
    discoverCuration.ts featured artists + heritage playlists
    firestore.ts        typed data service
    search.ts · cache.ts · rollout.ts · locations.ts
    (+ activities, events, misc, movies, notifications, perks, profiles,
       tickets, updates, users, wallets, walletPasses, appleWalletWebService, importer)
  jobs/
    geohashBackfill.ts  AU postcode / coordinate backfill
  data/
    AllCouncilsList.csv  ~1000 AU council LGAs

server/   Docker image-processing service (Sharp + job queue) — not required for main dev
dataconnect/  Firebase DataConnect GraphQL schema (exploratory)
```

---

## Web Layout Architecture


| Breakpoint        | Layout                                                              |
| ----------------- | ------------------------------------------------------------------- |
| Desktop ≥1024px   | 240px left sidebar (`WebSidebar.tsx`), no top bar, `topInset = 0`   |
| Tablet 768–1023px | Bottom tab bar, `topInset = 0`                                      |
| Mobile native     | Bottom tab bar 84px (glassmorphism on iOS), `topInset = insets.top` |


```typescript
const { isDesktop, isTablet, isMobile, numColumns, hPad, sidebarWidth, columnWidth } = useLayout();
// sidebarWidth = 240 on desktop web, 0 elsewhere

// CORRECT — always:
const topInset = Platform.OS === 'web' ? 0 : insets.top;
// WRONG — never:
// const topInset = Platform.OS === 'web' ? 67 : insets.top;  ← old top-bar value
```

---

## Search

`GET /api/search` uses Firestore-backed `searchService.globalSearch` (bounded reads + in-memory match). Query params: `q`, `city`, `country`, `category`, `cultureTag`, `entryType`, `pageSize`. Returns `events`, `profiles`, `movies`, `users` (users currently empty).

---

## Council as Location Service (LGA)

Council = **location attribute only**. No governance, no detail pages, no user claims.

- `lgaCode` / `councilId` fields on events, businesses, users → proximity filtering
- Directory: browsable cards via Council filter chip (`api.council.list`)
- Discover: "Events in Your Area" rail uses `lgaCode` matching
- Admin data: `AllCouncilsList.csv` (~1000 AU LGAs), `councils/` Firestore collection

---

## State Management


| Concern     | Solution                                                   |
| ----------- | ---------------------------------------------------------- |
| Server data | TanStack React Query (`useQuery`, `useMutation`)           |
| Auth state  | `AuthProvider` + `useAuth()`                               |
| Onboarding  | `OnboardingContext` (city, country, interests, isComplete) |
| Saved items | `SavedContext` (savedEvents, joinedCommunities)            |
| Contacts    | `ContactsContext`                                          |
| UI state    | `useState` / `useReducer` local to component               |


---

## Firestore Data Model

```
users/{uid}
  username, displayName, email, city, country
  role: 'user' | 'organizer' | 'moderator' | 'admin' | 'cityAdmin' | 'platformAdmin'
  membership: { tier, expiresAt }
  stripeCustomerId, stripeSubscriptionId
  isSydneyVerified, interests[], culturePassId
  lgaCode?                    ← written server-side on onboarding

events/{eventId}
  title, description, venue, address, date, time, endDate?, endTime?, city, country
  imageUrl, heroImageUrl?, cultureTag[], tags[], category
  priceCents, tiers[], isFree, isFeatured
  entryType: 'ticketed' | 'free'
  organizerId, capacity, attending
  artists?: EventArtist[]
  eventSponsors?: EventSponsor[]
  hostInfo?: EventHostInfo
  status: 'draft' | 'published' | 'cancelled'
  lgaCode?, councilId?
  deletedAt, publishedAt, cpid, geoHash, latitude, longitude

tickets/{ticketId}
  eventId, userId, status, paymentStatus
  qrCode, cpTicketId, priceCents, cashbackCents, rewardPoints
  history[]: { action, timestamp, actorId }

profiles/{profileId}
  entityType: 'community' | 'business' | 'venue' | 'artist' | 'organisation'
  name, description, imageUrl, city, country
  ownerId, isVerified, rating, lgaCode?
  socialLinks: { website, instagram, facebook, twitter }

councils/{councilId}
  name, suburb, state, lgaCode, country
  websiteUrl?, phone?, addressLine1?
  verificationStatus: 'verified' | 'unverified'
```

Firestore rules: users own their doc; events/profiles public read, organizer/admin write; tickets owner-read only (Admin SDK writes).

---

## Environment Variables

```bash
# Client — baked into bundle (EXPO_PUBLIC_*)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_API_URL=https://us-central1-culturepass-4f264.cloudfunctions.net/api/
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=

# Cloud Functions ONLY — never in EXPO_PUBLIC_*
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_YEARLY_ID=price_...
APP_URL=https://culturepass.app
# Connect marketplace fee (optional; default 1000 bps = 10%)
STRIPE_CONNECT_PLATFORM_FEE_BPS=1000
```

# Local development seeding only

SEED_TEST_EMAIL=[testuser@example.com](mailto:testuser@example.com)   # for local development seeding only
SEED_TEST_PASSWORD=supersecret        # for local development seeding only

# Used by: npm run emulator:seed:cap

Mirror all `EXPO_PUBLIC_*` vars in `eas.json` `build.*.env`.

---

## Local Development

```bash
npm install && cd functions && npm install && cd ..
npx expo start            # native + web
npx expo start --web      # web only
firebase emulators:start --only functions,firestore,auth,storage
npm run emulator:seed:cap   # optional: Auth + Firestore emulator seed (The CAP org + 5 events); set SEED_TEST_EMAIL / SEED_TEST_PASSWORD
npm run typecheck
npm run lint
```

Emulator API URL: `EXPO_PUBLIC_API_URL=http://localhost:5001/culturepass-4f264/us-central1/api/`

---

## Building & Deploying

```bash
# iOS — bump app.json version + ios.buildNumber first
eas build --platform ios --profile production && eas submit --platform ios

# Android — bump app.json version + android.versionCode first
eas build --platform android --profile production && eas submit --platform android

# Web
npm run deploy-web   # expo export → dist/ + firebase deploy --only hosting

# Cloud Functions
cd functions && npm run build && cd .. && firebase deploy --only functions
```

**Deploy order**: functions FIRST, then app — never reverse when adding new endpoints.

---

## Pending — Pre-Launch Blockers (April 15 target)

- GeoHash backfill: geocode events missing `latitude`/`longitude`/`geoHash`
- Council LGA auto-select from GPS on onboarding (`/api/councils/nearest`)

## Pending — Post-Launch (April–June 2026)

- Organiser event analytics dashboard (`dashboard/event-analytics/[eventId]`)
- Promotional codes (`promoCodes/` collection, checkout validation)
- Organiser attendee messaging (FCM multicast + email queue)
- Community posts (`communities/{id}/posts/`, feature-flagged)
- Rewards points redemption UI (Perks tab balance chip + checkout toggle)
- Tiered perk gates (lock overlay + server-side 403 on `/api/perks/:id/redeem`)
- Push notification deep links + per-category opt-out
- NZ + UAE city grouping on onboarding
- Wallet top-up + Apple/Google Pay UI
- Firebase DataConnect migration (exploratory)


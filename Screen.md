# CulturePass Screen Blueprint

This document lists all current app screens/routes and what each one does, then defines a stronger product prompt you can use as a North Star for design, engineering, marketing, and AI generation.

---

## 1) App Shell, System, and Entry Routes


| Route                    | Screen                 | Function                                                                     |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------------- |
| `app/_layout.tsx`        | Root App Layout        | Global providers, navigation shell, auth/onboarding guards, shared overlays. |
| `app/+not-found.tsx`     | Not Found              | Handles unknown routes with recovery navigation.                             |
| `app/+native-intent.tsx` | Native Intent Handler  | Processes deep links/native intents and routes users correctly.              |
| `app/+html.tsx`          | Web HTML Wrapper       | Web-level HTML config and metadata wiring for Expo web.                      |
| `app/index.tsx`          | Root Entry             | Primary entry decision route (redirects to the correct experience).          |
| `app/landing.tsx`        | Marketing Landing      | Public web-facing brand/marketing entry.                                     |
| `app/about.tsx`          | About                  | Product/about page and trust context.                                        |
| `app/map.tsx`            | Global Map             | Geographic browsing of events/places.                                        |
| `app/menu.tsx`           | Global Menu            | Top-level menu/navigation shortcuts.                                         |
| `app/finder.tsx`         | Finder                 | Discovery helper/search utility screen.                                      |
| `app/get2know.tsx`       | Get to Know            | Intro/community education style content.                                     |
| `app/kerala.tsx`         | Regional Story Page    | Curated regional content/landing surface.                                    |
| `app/[handle].tsx`       | Public Handle Resolver | Resolves `@handle` style public profile routes.                              |
| `app/scanner.tsx`        | Scanner                | QR/ticket scan entry point for check-in workflows.                           |


---

## 2) Onboarding and Authentication


| Route                                  | Screen                     | Function                                                       |
| -------------------------------------- | -------------------------- | -------------------------------------------------------------- |
| `app/(onboarding)/_layout.tsx`         | Onboarding Layout          | Shared onboarding shell, transitions, and route grouping.      |
| `app/(onboarding)/index.tsx`           | Onboarding Welcome         | Brand intro and first-step onboarding CTA.                     |
| `app/(onboarding)/login.tsx`           | Login                      | Email/social authentication and account access.                |
| `app/(onboarding)/signup.tsx`          | Sign Up                    | Account creation, role selection, password setup.              |
| `app/(onboarding)/forgot-password.tsx` | Forgot Password            | Password reset flow via email link.                            |
| `app/(onboarding)/location.tsx`        | Location Setup             | Captures city/country for personalization and local relevance. |
| `app/(onboarding)/culture-match.tsx`   | Culture Match              | Collects nationality/culture/language preferences.             |
| `app/(onboarding)/interests.tsx`       | Interest Selection         | Topic/category interests to tune recommendation engine.        |
| `app/(onboarding)/communities.tsx`     | Community Join Suggestions | Suggests and joins relevant communities during onboarding.     |
| `app/onboarding/location.tsx`          | Legacy Location Entry      | Alternate/legacy location onboarding route.                    |
| `app/onboarding/cultures.tsx`          | Legacy Culture Entry       | Alternate/legacy culture onboarding route.                     |


---

## 3) Primary Tab Experience


| Route                      | Screen        | Function                                            |
| -------------------------- | ------------- | --------------------------------------------------- |
| `app/(tabs)/_layout.tsx`   | Tab Layout    | Main bottom-tab or desktop sidebar shell.           |
| `app/(tabs)/index.tsx`     | Discover Home | Personalized feed rails, trends, spotlight modules. |
| `app/(tabs)/feed.tsx`      | Social Feed   | Community/activity feed with interactions.          |
| `app/(tabs)/calendar.tsx`  | Calendar      | Date-based event planning and schedule view.        |
| `app/(tabs)/community.tsx` | Community Hub | Community-centric feed and engagement entry.        |
| `app/(tabs)/perks.tsx`     | Perks Tab     | Perk discovery, redemption entry, member value.     |
| `app/(tabs)/profile.tsx`   | My Profile    | Account, identity, and user-owned content.          |
| `app/(tabs)/explore.tsx`   | Explore       | Broader browse/explore content surface.             |
| `app/(tabs)/directory.tsx` | Directory     | Browse entities/businesses/venues.                  |
| `app/(tabs)/city.tsx`      | City Lens     | City-oriented content curation entry.               |
| `app/(tabs)/menu.tsx`      | Tab Menu      | Utility/secondary navigation in tab context.        |
| `app/(tabs)/dashboard.tsx` | Dashboard Tab | Role-based dashboard shortcut from tab area.        |


---

## 4) Discovery, Events, and Content Consumption


| Route                         | Screen              | Function                                                         |
| ----------------------------- | ------------------- | ---------------------------------------------------------------- |
| `app/events.tsx`              | All Events          | Full event listing with filters and browse states.               |
| `app/event/[id].tsx`          | Event Detail        | Full event detail, RSVP/ticketing, host info, related discovery. |
| `app/event/create.tsx`        | Event Create Wizard | Multi-step event publishing flow for organizers/admin.           |
| `app/city/[name].tsx`         | City Detail         | City-specific event and culture content aggregation.             |
| `app/search/index.tsx`        | Global Search       | Cross-entity search with filters and result sections.            |
| `app/saved/index.tsx`         | Saved               | User saved events/content list.                                  |
| `app/submit/index.tsx`        | Submit              | User/creator submission flow for content or listings.            |
| `app/offerings/index.tsx`     | Offerings           | Unified browse for deals/menu/activity style offerings.          |
| `app/notifications/index.tsx` | Notifications       | In-app notification inbox and message state.                     |
| `app/updates/index.tsx`       | Updates Feed        | Product/community updates stream.                                |
| `app/updates/[id].tsx`        | Update Detail       | Single update/article detail view.                               |


---

## 5) Entity Profiles and Community Surfaces


| Route                             | Screen                 | Function                                            |
| --------------------------------- | ---------------------- | --------------------------------------------------- |
| `app/artist/[id].tsx`             | Artist Profile         | Public artist profile with events/identity details. |
| `app/business/[id].tsx`           | Business Profile       | Business detail and commerce/community context.     |
| `app/organiser/[id].tsx`          | Organizer Profile      | Organizer brand, events, and trust details.         |
| `app/venue/[id].tsx`              | Venue Profile          | Venue details, map/location, and hosted events.     |
| `app/community/[id].tsx`          | Community Detail       | Community profile, posts, member context.           |
| `app/communities/index.tsx`       | Communities Directory  | Browse and discover communities.                    |
| `app/community/create.tsx`        | Create Community       | New community creation/setup flow.                  |
| `app/user/[id].tsx`               | Public User Profile    | Public-facing user identity and activity.           |
| `app/profile/index.tsx`           | Profile Landing        | Internal profile entry and account shortcuts.       |
| `app/profile/[id].tsx`            | Profile Detail         | Rich profile page by user/profile id.               |
| `app/profile/edit.tsx`            | Edit Profile           | Editable account/profile details and media.         |
| `app/profile/public.tsx`          | Public Profile Preview | Public presentation profile mode.                   |
| `app/profile/qr.tsx`              | Profile QR             | QR identity/share/check-in support.                 |
| `app/culture/index.tsx`           | Culture Index          | Culture taxonomy/entry selection list.              |
| `app/culture/[slug].tsx`          | Culture Detail         | Culture-specific content lane.                      |
| `app/hub/_layout.tsx`             | Hub Layout             | Country/state hub shell.                            |
| `app/hub/[country]/[state].tsx`   | Hub Region Page        | Region-specific hub content route.                  |
| `app/hubs/_layout.tsx`            | Hubs Layout            | Language/state hubs shell.                          |
| `app/hubs/[state]/[language].tsx` | Hub Language Page      | Regional-language curation experience.              |


---

## 6) Tickets, Checkout, Wallet, and Payments


| Route                          | Screen             | Function                                        |
| ------------------------------ | ------------------ | ----------------------------------------------- |
| `app/checkout/index.tsx`       | Checkout           | Payment/session initiation for ticket purchase. |
| `app/tickets/index.tsx`        | Ticket List        | User ticket inventory (upcoming/past).          |
| `app/tickets/[id].tsx`         | Ticket Detail      | Ticket status, QR, metadata, and actions.       |
| `app/tickets/print/[id].tsx`   | Ticket Print       | Printable/shareable ticket presentation.        |
| `app/payment/success.tsx`      | Payment Success    | Return state after successful payment flow.     |
| `app/payment/cancel.tsx`       | Payment Cancel     | Cancellation/failure return state.              |
| `app/payment/methods.tsx`      | Payment Methods    | Manage saved payment instruments.               |
| `app/payment/wallet.tsx`       | Wallet             | Wallet balance/state and actions.               |
| `app/payment/transactions.tsx` | Transactions       | Transaction history and finance log for user.   |
| `app/membership/upgrade.tsx`   | Membership Upgrade | Upgrade tier/subscription conversion screen.    |


---

## 7) Vertical Content Modules


| Route                       | Screen                | Function                                    |
| --------------------------- | --------------------- | ------------------------------------------- |
| `app/perks/[id].tsx`        | Perk Detail           | Perk info, eligibility, and redemption CTA. |
| `app/movies/index.tsx`      | Movies Directory      | Movie listings and discovery.               |
| `app/movies/[id].tsx`       | Movie Detail          | Movie/showtime style detail page.           |
| `app/restaurants/index.tsx` | Restaurants Directory | Restaurant list and discovery filters.      |
| `app/restaurants/[id].tsx`  | Restaurant Detail     | Restaurant profile/detail.                  |
| `app/shopping/index.tsx`    | Shopping Directory    | Retail/shop listing browse.                 |
| `app/shopping/[id].tsx`     | Shop Detail           | Individual shop/store profile.              |
| `app/activities/index.tsx`  | Activities Directory  | Activities list/browse.                     |
| `app/activities/[id].tsx`   | Activity Detail       | Activity profile and actions.               |


---

## 8) Contacts and Utility


| Route                     | Screen         | Function                               |
| ------------------------- | -------------- | -------------------------------------- |
| `app/contacts/index.tsx`  | Contacts       | CulturePass contacts/connections list. |
| `app/contacts/[cpid].tsx` | Contact Detail | Contact detail via CPID route.         |
| `app/help/index.tsx`      | Help Center    | User support FAQs and help entry.      |


---

## 9) Settings and Preferences


| Route                            | Screen                 | Function                               |
| -------------------------------- | ---------------------- | -------------------------------------- |
| `app/settings/index.tsx`         | Settings Home          | Settings category launcher.            |
| `app/settings/about.tsx`         | Settings About         | In-app about/product details.          |
| `app/settings/help.tsx`          | Settings Help          | Settings-scoped help/support route.    |
| `app/settings/location.tsx`      | Settings Location      | User location preference management.   |
| `app/settings/notifications.tsx` | Settings Notifications | Notification controls and preferences. |
| `app/settings/privacy.tsx`       | Settings Privacy       | Privacy control center.                |
| `app/settings/appearance.tsx`    | Settings Appearance    | Theme and display preferences.         |
| `app/settings/calendar-sync.tsx` | Calendar Sync          | Calendar integration and sync options. |


---

## 10) Legal and Policy


| Route                       | Screen               | Function                                      |
| --------------------------- | -------------------- | --------------------------------------------- |
| `app/legal/terms.tsx`       | Terms of Service     | Legal terms presentation.                     |
| `app/legal/privacy.tsx`     | Privacy Policy       | Privacy disclosures and policy details.       |
| `app/legal/cookies.tsx`     | Cookie Policy        | Cookie usage and consent context.             |
| `app/legal/event-terms.tsx` | Event Terms          | Terms specific to event participation.        |
| `app/legal/guidelines.tsx`  | Community Guidelines | Platform conduct and moderation expectations. |


---

## 11) Creator and Partner Dashboards


| Route                                | Screen              | Function                                          |
| ------------------------------------ | ------------------- | ------------------------------------------------- |
| `app/dashboard/_layout.tsx`          | Dashboard Layout    | Shared shell for organizer/venue/sponsor modules. |
| `app/dashboard/organizer.tsx`        | Organizer Dashboard | Organizer operations and event controls.          |
| `app/dashboard/venue.tsx`            | Venue Dashboard     | Venue-side operations dashboard.                  |
| `app/dashboard/sponsor.tsx`          | Sponsor Dashboard   | Sponsor-facing dashboard utilities.               |
| `app/dashboard/widgets.tsx`          | Widgets Dashboard   | Widget management and layout state.               |
| `app/dashboard/content-studio.tsx`   | Content Studio      | Creator/admin content production workspace.       |
| `app/dashboard/wallet-readiness.tsx` | Wallet Readiness    | Wallet/pass readiness diagnostics and setup.      |
| `app/dashboard/backstage/[id].tsx`   | Backstage Detail    | Event backstage/control room for operators.       |


---

## 12) Admin Command Surfaces


| Route                                  | Screen                  | Function                                            |
| -------------------------------------- | ----------------------- | --------------------------------------------------- |
| `app/admin/dashboard/index.tsx`        | Admin Dashboard         | Admin home overview and quick operations.           |
| `app/admin/cockpit.tsx`                | Admin Cockpit           | Root command center for system-critical controls.   |
| `app/admin/events.tsx`                 | Admin Events            | Event governance and moderation controls.           |
| `app/admin/users.tsx`                  | Admin Users             | User management, role/verification operations.      |
| `app/admin/profiles.tsx`               | Admin Profiles          | Profile entity moderation and admin edits.          |
| `app/admin/communities.tsx`            | Admin Communities       | Community oversight and policy controls.            |
| `app/admin/tickets.tsx`                | Admin Tickets           | Ticket operations and issue handling.               |
| `app/admin/perks.tsx`                  | Admin Perks             | Perk catalog and redemption governance.             |
| `app/admin/shopping.tsx`               | Admin Shopping          | Retail listing management.                          |
| `app/admin/import.tsx`                 | Admin Import            | Data import/ingestion management.                   |
| `app/admin/dashboard/event-ingest.tsx` | Event Ingestion Console | Ingestion pipeline control and status.              |
| `app/admin/moderation.tsx`             | Moderation Queue        | Flagged content review and actions.                 |
| `app/admin/audit-logs.tsx`             | Audit Logs              | Immutable admin/action logs and traceability.       |
| `app/admin/handles.tsx`                | Handle Governance       | Username/handle approvals and moderation.           |
| `app/admin/discover.tsx`               | Discover Curation       | Curated rails/spotlight configuration.              |
| `app/admin/notifications.tsx`          | Notification Ops        | Broadcast/targeted notification operations.         |
| `app/admin/finance.tsx`                | Finance Ops             | Revenue, subscription, and Stripe performance view. |
| `app/admin/platform.tsx`               | Platform Controls       | Feature flags, maintenance, and critical switches.  |
| `app/admin/data-compliance.tsx`        | Data Compliance         | Compliance checks and data governance.              |
| `app/admin/locations.tsx`              | Locations Admin         | City/state/council location data management.        |
| `app/admin/taxonomy.tsx`               | Taxonomy Admin          | Category/tag taxonomy management.                   |
| `app/admin/updates.tsx`                | Updates Admin           | Product update publishing workflow.                 |


---

## 13) CulturePass Prompt v2 (North Star)

Use this as a design/strategy prompt for product, brand, and implementation teams.

```text
Design and build CulturePass as the command layer for cultural life in diaspora cities.

Core product truth:
CulturePass is not only an events app. It is a trust-backed cultural operating system connecting People, Places, and Participation:
- People: users, communities, creators, organizers
- Places: venues, businesses, cities, neighborhoods
- Participation: discovery, booking, entry, sharing, loyalty

Experience mandate:
Every screen must reduce friction and increase belonging.
If a user opens the app with only 20 seconds of attention, they should immediately know:
1) what matters near them now,
2) what to do next,
3) why they can trust the action.

Interaction principles:
- Concierge over clutter: present the best next action, not every possible action.
- Cultural confidence: premium, warm, and globally aware visual language.
- Momentum by design: each screen should create a clean transition to the next meaningful step.
- Trust visible everywhere: host identity, pricing clarity, policy clarity, and moderation signals.
- Platform parity: same intent across iOS, Android, and web; adapt layout, not logic.

Screen architecture requirements:
- Discovery layer: personalized feed + city/culture rails + urgency signals (“ending soon”, “tonight”).
- Decision layer: event/place details with compact “at a glance” facts and one dominant CTA.
- Transaction layer: secure booking/payment/wallet with transparent state and fallback recovery.
- Community layer: social proof, circles, profile identity, and contribution loops.
- Operations layer: admin command center with critical alerts, auditability, and rapid controls.

Brand tone:
Sophisticated but human.
Culturally celebratory, never exclusionary.
Confident enough for institutions, accessible enough for first-time attendees.

Security and integrity:
- Pass issuance and verification must be tamper-resistant.
- Audit trails must be immutable for admin-critical actions.
- Verification flows must support both partner-operator scanning and user self-service recovery.

Success criteria:
- Time to first meaningful action < 30 seconds for new users.
- Event detail conversion (RSVP/ticket) improves without increasing cognitive load.
- Admin can detect and act on platform risk from one cockpit view.
- Users describe the app as “easy, trustworthy, and made for my culture.”
```

---

## 14) Implementation Notes for Venue Verification

Recommended approach:

- **Primary:** Dedicated partner/operator scan experience (`scanner` + potential partner mode).
- **Fallback:** Existing venue scanner integrations via secure API/webhooks when needed.
- **Policy:** Keep verification logic server-authoritative (no client-only acceptance decisions).
- **UX:** Always provide clear scan result states: valid, already used, expired, or needs manual review.

---

## 15) Ground-Up Upgrade: Constant-Travel Worker Mode

This is the blueprint to make CulturePass highly useful for:

- air crew (cabin crew, pilots, airport ops),
- shipworkers/seafarers,
- consultants/contractors who are always moving.

### A) Why this matters

Frequent-travel workers have short windows, irregular schedules, fatigue, and poor connectivity.  
A standard “browse events” app is too slow for them. CulturePass should act like a local concierge that works in under 2 minutes.

### B) New Core Persona Layer

Add a **Travel Work Mode** toggle during onboarding/profile:

- `Crew / Maritime / Constant traveler / Local resident`
- Typical availability windows:
  - `Layover 2-4h`
  - `Layover 4-8h`
  - `Overnight 8-16h`
  - `Off-day`
- Rest preference:
  - `Quiet / Nature / Food / Culture / Social`
- Budget preference:
  - `Free`, `Low`, `Mid`, `Premium`

### C) Product Features (from ground up)

1. **Layover Mode (Primary CTA on Home)**
  - “I have 3 hours in Sydney” quick planner.
  - One-tap itinerary: nearest culturally meaningful experiences + travel time + return buffer.
  - Auto-filter out options that risk lateness.
2. **Port/Transit Safe Radius**
  - Dynamic “safe return radius” around airport/port/hotel.
  - Shows only places reachable and returnable within user’s available window.
3. **Offline-First Travel Pack**
  - Save itinerary, ticket QR, maps, venue notes offline.
  - Critical because shipworkers/crew often lose signal.
4. **Time-Zone Intelligent Scheduling**
  - All times shown in local + home timezone if needed.
  - Fatigue-aware reminders: “Leave now”, “Boarding buffer”, “Rest window.”
5. **Crew-Verified Picks**
  - Badges like “Crew-friendly”, “Late-night open”, “Fast entry”, “Quiet zone.”
  - Community-sourced reliability scores for quick trust.
6. **Fast Actions**
  - “Book in 2 taps”
  - “Navigate now”
  - “Quick bite + culture in 90 mins”
  - “Solo-safe nearby”
7. **Work-Rotation Memory**
  - Learns recurring routes (e.g., SYD → MEL → AKL) and preloads recommendations.
  - “Welcome back” cards for frequent cities.

### D) Screen-Level Changes

- **Home (`/(tabs)/index`)**
  - Add top module: `Layover Planner`.
  - Add cards: `Under 90 mins`, `Near port/airport`, `Open now`.
- **Search (`/search/index`)**
  - Add filter group: `Time window`, `Transit distance`, `Crew-friendly`, `Offline available`.
- **Event Detail (`/event/[id]`)**
  - Add compact row: `Door-to-door estimate`, `Return risk`, `Quick-entry confidence`.
  - Keep “At a glance” minimal for fast decision-making.
- **Wallet/Tickets (`/tickets`, `/payment/wallet`)**
  - “Offline-ready” status chip.
  - Emergency fallback: manual code + support action.
- **Profile (`/profile`)**
  - Add travel profile: route patterns, rest preferences, city history.

### E) Accessibility and Inclusion Upgrade (for everyone)

- One-handed usage priority (thumb-zone actions).
- High-contrast and low-light modes for night shifts.
- Reduced-motion and low-cognitive-load mode.
- Multilingual quick summaries for cross-border crews.
- “No-plan mode”: app makes one best suggestion instantly.

### F) Admin/Operations changes needed

- Add tags in admin taxonomy:
  - `crew_friendly`, `quick_entry`, `quiet_space`, `late_open`, `offline_supported`.
- Add moderation checks for safety and opening-hour reliability.
- Add dashboard KPI:
  - “Layover conversion rate”
  - “On-time return confidence”
  - “Frequent traveler retention”

### G) Success Metrics

- First useful action for travel workers: **< 60 seconds**.
- Plan completion within available window: **> 85%**.
- Repeat usage by rotating workers in same city: **+30%**.
- Ticket/pass failures while offline: **near zero**.

### H) Prompt Add-on (for design/AI planning)

```text
Design CulturePass for people with limited time and unstable context.
The app must work for users who are tired, moving fast, and unfamiliar with the city.
Every screen should answer:
1) What can I do safely right now?
2) Can I complete this without missing work?
3) Can I trust this plan even if I go offline?

Prioritize speed, reliability, return-to-work safety, and emotional comfort.
Culture should feel accessible in small windows, not only in long leisure blocks.
```


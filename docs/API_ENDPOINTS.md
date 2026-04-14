# CulturePass API Endpoints

This document describes the live Firebase Functions API surface in this repository.

## Base URL
- Local Functions dev: `http://127.0.0.1:5001/<project>/us-central1/api/`
- Hosted web / production: same-origin `/api/**` via Firebase Hosting rewrites or the deployed Functions URL

## Health
- `GET /health`
- `GET /api/rollout/config?userId=<id>`

## Users
- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id` (moderation checks applied)

## Discovery Content
- `GET /api/events`
- `GET /api/events/:id`
- `GET /api/communities`
- `GET /api/communities/:id`
- `GET /api/profiles`
- `GET /api/profiles/:id`
- `POST /api/profiles`
- `GET /api/businesses/:id`

## Syndication Feeds
- `GET /api/feeds/:scope/:value.rss`
- `GET /api/feeds/:scope/:value.ics`
- `GET /api/feeds/rss/:scope/:value`
- `GET /api/feeds/ical/:scope/:value`

### Feed scopes
- `community` — events with matching `communityId`
- `host` — events matched by `publisherProfileId`, `organizerId`, or legacy host metadata
- `city` — events in a city; optional `country`
- `state` — events in a state or territory; accepts codes like `NSW` and names like `New South Wales`; optional `country`
- `artist` — events where `artists[].profileId` or artist name matches
- `venue` — events matched by `venueProfileId` or venue name
- `tag` — events matched across `tags`, `cultureTag`, `cultureTags`, `languageTags`, and `indigenousTags`

### Feed query params
- `country` — optional country disambiguator for `city` and `state` feeds
- `limit` — optional item cap, default `50`, max `200`

## Entertainment & Browse Collections
- `GET /api/movies`
- `GET /api/movies/:id`
- `GET /api/restaurants`
- `GET /api/restaurants/:id`
- `GET /api/activities`
- `GET /api/activities/:id`
- `GET /api/shopping`
- `GET /api/shopping/:id`
- `GET /api/offerings` — aggregated unified browse rows (deals, menu highlights, activities, movie showtimes). Query: `city`, `country`, `kinds` (comma-separated), `domains` (comma-separated), `limit` (default 80, max 200). See `shared/schema/offering.ts`.

## Wallet, Membership, and Payments
- `GET /api/wallet/:userId`
- `POST /api/wallet/:userId/topup`
- `GET /api/transactions/:userId`
- `GET /api/payment-methods/:userId`
- `POST /api/payment-methods`
- `DELETE /api/payment-methods/:id`
- `PUT /api/payment-methods/:userId/default/:methodId`
- `GET /api/membership/:userId`
- `GET /api/membership/member-count`
- `POST /api/membership/subscribe`
- `POST /api/membership/cancel-subscription`

## Tickets
- `GET /api/tickets/:userId`
- `GET /api/tickets/:userId/count`
- `GET /api/ticket/:id`
- `POST /api/tickets`
- `PUT /api/tickets/:id/cancel`
- `POST /api/tickets/scan`
- `GET /api/tickets/:id/history`
- `GET /api/tickets/admin/scan-events`
- `GET /api/tickets/:id/wallet/apple`
- `GET /api/tickets/:id/wallet/google`

## Perks and Reviews
- `GET /api/perks`
- `GET /api/perks/:id`
- `POST /api/perks`
- `POST /api/perks/:id/redeem`
- `GET /api/redemptions`
- `GET /api/reviews/:profileId`

## Notifications and Privacy
- `GET /api/notifications/:userId`
- `GET /api/notifications/:userId/unread-count`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/:userId/read-all`
- `DELETE /api/notifications/:id`
- `GET /api/privacy/settings/:userId`
- `PUT /api/privacy/settings/:userId`

## Governance and moderation reporting
- `POST /api/reports`
- `GET /api/admin/reports`
- `PUT /api/admin/reports/:id/review`

- `POST /api/notifications/:userId/:id/read`

## CPID and Discover
- `GET /api/cpid/lookup/:cpid`
- `GET /api/indigenous/traditional-lands`
- `GET /api/indigenous/spotlights`
- `GET /api/discover/:userId`

## Search
- `GET /api/search?q=...&type=all|event|community|business|profile&city=...&country=...&tags=a,b&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&page=1&pageSize=20`
- `GET /api/search/suggest?q=...`

### Search implementation notes
- Weighted ranking in service layer (`title > subtitle > description`).
- Trigram-style fuzzy matching approximation for typo tolerance.
- Location relevance boost by city/country match.
- In-memory TTL cache abstraction with Redis-compatible API surface.


## Media upload and image pipeline
- `POST /api/uploads/image` (multipart field: `image`)
- `POST /api/media/attach`
- `GET /api/media/:targetType/:targetId`
## Stripe
- `POST /api/stripe/create-checkout-session`
- `POST /api/stripe/refund`
- `POST /api/stripe/webhook`

## Moderation and governance baseline
- IP-based rate limiting middleware on API requests.
- Profanity moderation on write-heavy endpoints.
- Suspicious-link heuristic moderation for user-submitted content.
- Basic profanity moderation on write-heavy endpoints.

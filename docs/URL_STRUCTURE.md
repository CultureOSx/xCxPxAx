# URL Structure

This document defines canonical public routes and where legacy remaps must be maintained.

## Canonical Routes

- `/` -> Discover shell
- `/event/[id]`
- `/community/[id]`
- `/artist/[id]`
- `/business/[id]`
- `/venue/[id]`
- `/profile/[id]`
- `/user/[id]`
- `/tickets/[id]`
- `/perks/[id]`

## Legacy Remaps

- `/events/:id` -> `/event/:id`
- `/artists/:id` -> `/artist/:id`
- `/communities/:id` -> `/community/:id`
- `/profiles/:id` -> `/profile/:id`
- `/users/:id` -> `/user/:id`
- `/businesses/:id` -> `/business/:id`

## Syndication & calendar (API — not SPA routes)

Public **RSS and ICS** URLs are served by Cloud Functions, not static HTML files:

- Pattern: `/api/feeds/<scope>/<value>.rss` and `.ics` (see `docs/API_ENDPOINTS.md`).
- Global community update feeds: `/api/feeds/status.rss`, `/api/feeds/story.rss` (optional `communityId` query).
- Scoped: `/api/feeds/community/<communityId>/status.rss`, `.../story.rss`.

Document new feed paths in `docs/API_ENDPOINTS.md` and extend `scripts/tests/integration-api-routes.ts` when adding handlers.

## Sources Of Truth

- `app/+native-intent.tsx` for native and deep-link remaps
- `firebase.json` for hosting rewrites
- Expo Router route files in `app/`
- Route smoke coverage in repo test scripts (`npm run test:web:route-hygiene` after `npm run build-web`)

## Guardrails

- Never remove a legacy alias without updating remaps and smoke coverage together.
- Never document legacy aliases as canonical app routes.
- If a new public route is introduced, add it here in the same change.

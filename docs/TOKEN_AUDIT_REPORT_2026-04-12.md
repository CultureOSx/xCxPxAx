# Token Audit Report (2026-04-12)

Scope: full repository scan of `app/` + `components/` (plus broad pass on repo) for style literals not yet standardized via theme tokens.

## Method

- Hardcoded visual values:
  - Numeric style literals (e.g. `borderRadius: 20`, `padding: 16`, `fontSize: 14`)
  - Direct color literals (`#...`, `rgb(...)`, `rgba(...)`)
  - Raw `fontFamily: '...'` assignments
- Tools used: `rg` count scans across `*.ts`, `*.tsx`, `*.js`, `*.jsx`
- Notes:
  - This is a static regex audit (includes intentional literals in some places)
  - Files in `constants/` are expected to contain base tokens and may appear in broad scans

## Executive Summary

- Token standardization is progressing, but there are still several large hotspots with many hardcoded layout/text values.
- Biggest remaining gaps are concentrated in:
  - Admin screens
  - Older composite style files
  - Dense list/feed components
- Priority should be **high-count shared files first**, then high-traffic app screens.

## Top Hotspots (Numeric Style Literals)

These files reported the highest numeric literal counts in the scan:

- `components/feed/FeedComponents.tsx` (168)
- `components/event-create/styles.ts` (161)
- `app/admin/users.tsx` (152)
- `components/event-detail/styles.ts` (138)
- `components/community-create/styles.ts` (135)
- `app/admin/notifications.tsx` (126)
- `app/payment/wallet.tsx` (126)
- `components/directory/DirectoryComponents.tsx` (120)
- `app/about.tsx` (109)
- `app/admin/audit-logs.tsx` (104)
- `app/get2know.tsx` (103)
- `app/contacts/index.tsx` (103)
- `app/contacts/[cpid].tsx` (96)
- `app/admin/moderation.tsx` (94)
- `app/admin/locations.tsx` (93)

## Top Hotspots (Hardcoded Color Literals)

High concentration of direct color values remains in:

- `components/tabs/TabHeaderChrome.tsx`
- `components/event-detail/styles.ts`
- `components/Discover/EventCard.tsx`
- `components/web/WebTopBar.tsx`
- `components/web/WebSidebar.tsx`
- `app/notifications/index.tsx`
- `app/profile/[id].tsx`
- `app/(tabs)/explore.tsx`
- `app/submit/index.tsx`
- `components/profile-public/styles.ts`

## Top Hotspots (Raw `fontFamily` Literals)

High concentration of font literals remains in:

- `app/updates/index.tsx`
- `app/travel.tsx`
- `app/get2know.tsx`
- `app/profile/public.tsx`
- `app/movies/[id].tsx`
- `components/profile-public/LoadingSkeleton.tsx`
- `components/Discover/ComingSoonRail.tsx`
- `components/user/UserProfileHero.tsx`
- `components/feed/FeedEmptyState.tsx`
- `components/community/CommunityGridCard.tsx`

## Phase 4 Coverage Completed

As part of current standardization work, these areas were aligned to tokens/shared primitives:

- `components/ui/ScreenState.tsx`
- `app/notifications/index.tsx`
- `components/event-detail/EventDetailSkeleton.tsx`
- Discover primitives and rail/header tokenization from prior phases

## Recommended Next Sweep (Phase 5 Candidate)

1. **Shared style hubs first**
   - `components/feed/FeedComponents.tsx`
   - `components/event-create/styles.ts`
   - `components/event-detail/styles.ts`
   - `components/directory/DirectoryComponents.tsx`
2. **Admin shell consistency**
   - `app/admin/users.tsx`
   - `app/admin/notifications.tsx`
   - `app/admin/audit-logs.tsx`
   - `app/admin/moderation.tsx`
3. **Profile/contact flow consistency**
   - `app/contacts/index.tsx`
   - `app/contacts/[cpid].tsx`
   - `app/profile/[id].tsx`
4. **Color/font cleanup pass**
   - Remove remaining hardcoded `#...` and `fontFamily` literals where token aliases exist

## Suggested Enforcement

- Add lint rules (or custom checks) for:
  - disallowing raw hex colors outside token files
  - disallowing raw fontFamily literals outside typography/token files
  - warning on high-frequency numeric style literals (threshold-based)


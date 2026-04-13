# CulturePass — Quick Rules

> Full rules + code examples → [`culturepass-rules.md`](culturepass-rules.md)
> Full project structure → [`CLAUDE.md`](CLAUDE.md)
> Design principles → [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md)

---

## NEVER Do

- Call hooks (`useAuth`, `useColors`, etc.) outside a React component
- Use `any` type — use `Record<string, unknown>` + explicit casts or type narrowing
- Hardcode hex colors, spacing, or font sizes — use `useColors()`, `Spacing`, token constants
- Write `<Pressable><Text>` — always use `<Button>` from `components/ui`
- Import from `constants/*.ts` directly in screens — always import from `constants/theme`
- Hardcode `topInset = Platform.OS === 'web' ? 67 : insets.top` — web inset is always `0`
- Use raw `fetch()` — always use `api.*` from `lib/api.ts`
- Import Firebase SDK directly in screens — use `lib/api.ts` and `lib/auth.tsx`
- Create `StyleSheet` objects inside render functions — use module-level `StyleSheet.create()`
- Use `console.log` in production — guard with `if (__DEV__)`
- Commit API keys, Stripe keys, or `.env` files
- Use `AsyncStorage` directly for auth tokens — `lib/query-client.ts` `setAccessToken()` handles this
- Import `@sentry/node` or `@sentry/react-native` — **Sentry is fully removed**
- Use `lib/reporting.ts` for errors — it is a **user content report system** (spam/harassment), not error logging
- Add duplicate routes to Cloud Functions route files — check the file first

---

## ALWAYS Do

- Use `api.*` from `lib/api.ts` for all backend calls
- Use `useLayout()` for all responsive values (padding, columns, breakpoints, sidebarWidth)
- Use `useColors()` for theme-aware colors — never hardcode hex in JSX
- Wrap screens with async data in `<ErrorBoundary>`
- Handle 401 with `ApiError.isUnauthorized()` → redirect to login
- Use `useQuery` / `useMutation` (TanStack React Query) for all server state
- Use `useSafeAreaInsets()` for native insets; web top inset is always `0`
- Use `Haptics.*` (expo-haptics) for tactile feedback — iOS/Android only
- Use `Image` from `expo-image` (not `react-native`) for all images
- Test on iOS, Android, and web — use `Platform.OS` guards when behaviour differs
- Use `Platform.select()` or `.native.tsx` / `.web.tsx` suffixes for large platform divergences
- Check `isOrganizer` / `isAdmin` from `useRole()` before rendering sensitive UI
- Add `accessibilityLabel` and `accessibilityRole` to all interactive elements
- Run `npm run typecheck` and `npm run lint` before committing
- In Cloud Functions catch blocks: `captureRouteError(err, 'ROUTE_NAME')` from `./utils`

---

## UI Standard — events.tsx Pattern

`app/events.tsx` is the **gold-standard listing screen**. Apply to every listing/browsable screen.

**Structure**: Header → Filter Row (animated FilterChips) → FlatList grid (Reanimated FadeInDown) → Skeleton loading → Empty state → Paginating footer

See [`culturepass-rules.md#ui-design-standard`](culturepass-rules.md) for full code.

---

## Badge & Chip Color Rules

| Use case | Token | Note |
|----------|-------|------|
| FREE badge on event cards | `CultureTokens.teal` | Gold clashes with indigo brand |
| LIVE / AVAILABLE badges | `CultureTokens.teal` | Positive state = teal |
| Price chips on cards | `CultureTokens.teal` | Non-indigenous accent |
| Active filter chip | `CultureTokens.indigo` | Primary brand color |
| Indigenous banners / 🪃 badges | `CultureTokens.gold` | Cultural choice — keep gold |
| Indigenous section accents | `CultureTokens.gold` | Cultural choice — keep gold |

> **Gold (`#FFC857`) is reserved exclusively for indigenous content.** Use teal everywhere else.

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/api.ts` | Typed API client — only way to call backend |
| `lib/auth.tsx` | Firebase Auth provider + `useAuth()` |
| `constants/theme.ts` | Single import for all design tokens |
| `hooks/useColors.ts` | Theme-aware colors |
| `hooks/useLayout.ts` | Responsive layout values |
| `shared/schema.ts` | Master TypeScript type re-exports |
| `functions/src/routes/utils.ts` | `captureRouteError()` — use in all catch blocks |
| `app/events.tsx` | Gold-standard listing screen UI pattern |

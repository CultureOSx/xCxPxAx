## 2025-04-13 - Parallelize bulk calendar exports

**Learning:** When performing bulk native operations like syncing multiple calendar events, running them sequentially via a `for...of` loop can be slow due to bridge latency. However, attempting to parallelize with `Promise.all` for bulk native database writes or web file downloads is an anti-pattern. Doing so can cause SQLite "database is locked" errors on native and trigger spam-protection download blocks in browsers. Native loops that hit device APIs or trigger file downloads should be executed sequentially, or using a dedicated bulk-insert module method if available.

**Action:** Avoid using `Promise.all` for looping native module side-effects or browser downloads. Stick to sequential operations for reliability unless the API is explicitly designed for concurrent writes.

## 2025-04-13 - Replace FlatList with FlashList

**Learning:** When rendering long lists of standard content items (like feeds or offers), `FlatList` can struggle with memory management and scrolling performance. `@shopify/flash-list` provides a drop-in replacement that uses cell recycling to massively improve performance and reduce memory overhead, making the UI much snappier. Note that `FlashList` does not natively support the `gap` style property on `contentContainerStyle`, so you must use an `ItemSeparatorComponent` for spacing.

**Action:** Look for `FlatList` usages rendering feeds or lists of cards and migrate them to `FlashList` with an appropriate `estimatedItemSize`. Remember to replace `gap` with `ItemSeparatorComponent`.
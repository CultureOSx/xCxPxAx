## 2024-05-14 - [O(N) nested array lookup optimization in useDiscoverData]
**Learning:** In `hooks/useDiscoverData.ts`, `distanceSortedEvents` iterates over `allEvents` and calls `cityToCoordinates(event.city)` for each. `cityToCoordinates` calls `getPostcodesByPlace` which does a string comparison across all Australian postcodes. This is highly inefficient because it repeatedly looks up the same cities.
**Action:** Use a `Map` or a simple object inside the `useMemo` to cache the coordinates of cities encountered while reducing `allEvents`.

# Deduplication Engine

This module provides deduplication logic for event objects.

- Uses string similarity on title, startTime, and venue name.
- Exports `isDuplicate(a, b)` for dedup checks.

Extend as needed for more advanced deduplication.

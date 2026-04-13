# Firestore Integration

This module provides helpers for writing normalized event data to Firestore.

- Uses `firebase-admin`.
- Upserts events using a doc ID derived from the event source URL.
- Expects Google Cloud credentials via `GOOGLE_APPLICATION_CREDENTIALS`.

See `index.js` for usage.

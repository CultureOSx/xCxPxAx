# Normalizer

This module normalizes raw event data from various sources to the CulturePass Firestore schema.

- Each source has its own normalizer (e.g., `cityofsydney.js`).
- Central entry point: `index.js`.

Extend with more normalizers as you add sources.

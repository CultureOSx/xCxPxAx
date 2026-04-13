# CulturePass Event Ingestion Pipeline

This directory contains the full ingestion pipeline for cultural event data, including:
- Scraper workers (City of Sydney, Eventbrite, Meetup, etc.)
- Queue (BullMQ)
- Normalizer layer
- Deduplication engine
- Firestore integration

## Pipeline Architecture

```
[Scraper Workers]
      ↓
[Queue (BullMQ)]
      ↓
[Normalizer Layer]
      ↓
[Dedup Engine]
      ↓
[Firestore]
      ↓
[CultureFeeds Algorithm]
```

## Setup

1. `npm install` (installs all dependencies)
2. Configure Firestore credentials in `.env`
3. Run the pipeline: `npm run pipeline`

## Components
- `scrapers/` — Source-specific scrapers
- `queue/` — BullMQ job queue
- `normalizer/` — Schema normalization
- `dedup/` — Deduplication logic
- `firestore/` — Firestore write helpers

---

See each subfolder for details and usage.

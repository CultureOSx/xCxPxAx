# Queue (BullMQ)

This module manages the event ingestion job queue using BullMQ and Redis.

- `addEventJob(data)`: Add a new event ingestion job
- `createEventWorker(processor)`: Start a worker to process jobs

Configure Redis with `REDIS_URL` in your `.env` file.

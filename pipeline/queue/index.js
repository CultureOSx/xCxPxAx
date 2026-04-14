// BullMQ queue setup for event ingestion pipeline
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

/** Exported for tests (mock IORedis) and graceful shutdown. */
export const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
export const eventQueue = new Queue('event-ingest', { connection });

const workers = new Set();

export function addEventJob(data) {
  return eventQueue.add('ingest', data);
}

export function createEventWorker(processor) {
  const worker = new Worker('event-ingest', processor, { connection });
  workers.add(worker);
  return worker;
}

/**
 * Close all workers, the queue, and the Redis connection. Call from tests (afterAll)
 * or process shutdown to avoid open handles.
 */
export async function closeQueueConnections() {
  const closes = [...workers].map((w) => (typeof w.close === 'function' ? w.close() : Promise.resolve()));
  workers.clear();
  await Promise.all(closes);
  if (typeof eventQueue.close === 'function') {
    await eventQueue.close();
  }
  if (typeof connection.quit === 'function') {
    await connection.quit();
  } else if (typeof connection.disconnect === 'function') {
    connection.disconnect();
  }
}

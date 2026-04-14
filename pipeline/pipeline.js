// Main pipeline runner: Scrape, normalize, dedup, and ingest events
import {
  scrapeCityOfSydneyEvent,
  scrapeEventbriteEvent,
  scrapeMeetupEvent
} from './scrapers/index.js';
import { isDuplicate } from './dedup/engine.js';
import { upsertEvent } from './firestore/index.js';
import { addEventJob, createEventWorker } from './queue/index.js';

// Enqueue jobs
export async function enqueueCityOfSydneyEvent(url) {
  await addEventJob({ source: 'cityofsydney', url });
}

export async function enqueueEventbriteEvent(url) {
  await addEventJob({ source: 'eventbrite', url });
}

export async function enqueueMeetupEvent(url) {
  await addEventJob({ source: 'meetup', url });
}

export async function enqueueEventJob(source, url) {
  await addEventJob({ source, url });
}

// Worker: Process event jobs
createEventWorker(async job => {
  const { source, url } = job.data;
  let event;
  if (source === 'cityofsydney') {
    event = await scrapeCityOfSydneyEvent(url);
  } else if (source === 'eventbrite') {
    event = await scrapeEventbriteEvent(url);
  } else if (source === 'meetup') {
    event = await scrapeMeetupEvent(url);
  } else {
    throw new Error(`Unknown source: ${source}`);
  }
  // Normalize already handled in scraper/normalizer

  // Deduplication: Check Firestore for similar events (simplified)
  // In production, use a more efficient query/index
  // For demo, just upsert
  await upsertEvent(event);
  return { status: 'ingested', url, source };
});

// CLI usage example
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.argv[2];
  const source = process.argv[3] || 'cityofsydney';

  if (!url) {
    console.error('Usage: node pipeline/pipeline.js <event-url> [source]');
    console.error('Supported sources: cityofsydney, eventbrite, meetup');
    process.exit(1);
  }
  enqueueEventJob(source, url).then(() => {
    console.log(`Job enqueued for ${source} with url ${url}`);
    process.exit(0);
  });
}

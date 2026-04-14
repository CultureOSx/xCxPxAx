// Main pipeline runner: Scrape, normalize, dedup, and ingest events
import { scrapeCityOfSydneyEvent } from './scrapers/cityofsydney.js';
import { isDuplicate } from './dedup/engine.js';
import { upsertEvent } from './firestore/index.js';
import { addEventJob, createEventWorker } from './queue/index.js';

// Example: Add a job to scrape a City of Sydney event
export async function enqueueCityOfSydneyEvent(url) {
  await addEventJob({ source: 'cityofsydney', url });
}

// Worker: Process event jobs
createEventWorker(async job => {
  const { source, url } = job.data;
  let event;
  if (source === 'cityofsydney') {
    event = await scrapeCityOfSydneyEvent(url);
  }
  // TODO: Add more sources here
  // Normalize already handled in scraper/normalizer

  // Deduplication: Check Firestore for similar events (simplified)
  // In production, use a more efficient query/index
  // For demo, just upsert
  await upsertEvent(event);
  return { status: 'ingested', url };
});

// CLI usage example
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node pipeline/pipeline.js <event-url>');
    process.exit(1);
  }
  enqueueCityOfSydneyEvent(url).then(() => {
    console.log('Job enqueued for', url);
    process.exit(0);
  });
}

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from '../admin';
import * as logger from 'firebase-functions/logger';

/**
 * Scheduled function to automatically sync events from City of Sydney What's On.
 * Target: https://whatson.cityofsydney.nsw.gov.au/tags/culture
 * Runs daily at 2 AM.
 */
export const syncSydneyWhatsOn = onSchedule('every 12 hours', async (event) => {
  logger.info('Starting Sydney What’s On sync for [culture] tag');

  try {
    const response = await fetch('https://whatson.cityofsydney.nsw.gov.au/tags/culture');
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const html = await response.text();
    
    // Extract Next.js data block holding the Algolia hits
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) {
        throw new Error('Next.js __NEXT_DATA__ block not found in page HTML.');
    }

    const jsonData = JSON.parse(match[1]);
    const hits = jsonData?.props?.pageProps?.events?.hits;
    
    if (!hits || !Array.isArray(hits)) {
        throw new Error('No Algolia hits found in the events payload.');
    }

    logger.info(`Found ${hits.length} culture events from What's On.`);

    const batch = db.batch();
    const eventsRef = db.collection('events');
    let count = 0;

    for (const hit of hits) {
      if (!hit.objectID || !hit.name) continue;

      // Extract high quality image
      let imageUrl = '';
      if (hit.tileImageCloudinary && hit.tileImageCloudinary.length > 0) {
         imageUrl = hit.tileImageCloudinary[0].url;
      }

      // Format Date
      let eventDate = new Date().toISOString().split('T')[0];
      if (hit.upcomingDate) {
         eventDate = new Date(hit.upcomingDate).toISOString().split('T')[0];
      }

      // Map Categories
      const externalCategories = Array.isArray(hit.categories) ? hit.categories : [];
      let mappedCategory = 'community';
      if (externalCategories.includes('festivals')) mappedCategory = 'festival';
      else if (externalCategories.includes('exhibitions')) mappedCategory = 'exhibition';
      else if (externalCategories.includes('food-drink')) mappedCategory = 'food';
      else if (externalCategories.includes('markets')) mappedCategory = 'market';
      else if (externalCategories.includes('classes-workshops')) mappedCategory = 'workshop';

      // Idempotent ID prefix
      const eventId = `cpass_wt_${hit.objectID}`;
      
      const docRef = eventsRef.doc(eventId);
      
      const eventData = {
        id: eventId,
        cpid: eventId,
        title: hit.name,
        description: hit.strapline || '',
        venue: hit.venueName || hit.suburbs?.[0] || 'Sydney',
        address: hit.suburbName || 'Sydney Area',
        date: eventDate,
        time: hit.eventUpcomingTime || 'Time TBA',
        city: 'Sydney',
        country: 'Australia',
        imageUrl: imageUrl,
        cultureTag: externalCategories.map((c: string) => c.toLowerCase()),
        tags: ['whatson', 'sydney', ...externalCategories],
        category: mappedCategory,
        priceCents: hit.freeEvent ? 0 : 1000, // Placeholder if not free
        isFree: !!hit.freeEvent,
        isFeatured: false,
        organizerId: 'admin_sys',
        capacity: 1000, // Sync default
        attending: 0,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Merge creates or updates silently via Algolia objectID match
      batch.set(docRef, eventData, { merge: true });
      count++;
    }

    await batch.commit();
    logger.info(`Successfully synced ${count} events to Firestore.`);
  } catch (err) {
    logger.error('Error during Sydney What’s On event sync:', err);
  }
});

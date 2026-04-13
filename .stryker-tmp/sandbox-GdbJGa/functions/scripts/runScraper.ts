// @ts-nocheck
import { db } from '../src/admin';
import * as logger from 'firebase-functions/logger';

async function runScraper() {
  console.log('Starting Sydney What’s On sync for [culture] tag...');

  try {
    const response = await fetch('https://whatson.cityofsydney.nsw.gov.au/tags/culture');
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const html = await response.text();
    
    // Extract Next.js data block holding embedded event hits
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) {
        throw new Error('Next.js __NEXT_DATA__ block not found in page HTML.');
    }

    const jsonData = JSON.parse(match[1]);
    const hits = jsonData?.props?.pageProps?.events?.hits;
    
    if (!hits || !Array.isArray(hits)) {
        throw new Error('No event hits found in the scraped payload.');
    }

    console.log(`Found ${hits.length} culture events from What's On.`);

    const batch = db.batch();
    const eventsRef = db.collection('events');
    let count = 0;

    for (const hit of hits) {
      if (!hit.objectID || !hit.name) continue;

      let imageUrl = '';
      if (hit.tileImageCloudinary && hit.tileImageCloudinary.length > 0) {
         imageUrl = hit.tileImageCloudinary[0].url;
      }

      let eventDate = new Date().toISOString().split('T')[0];
      if (hit.upcomingDate) {
         eventDate = new Date(hit.upcomingDate).toISOString().split('T')[0];
      }

      const externalCategories = Array.isArray(hit.categories) ? hit.categories : [];
      let mappedCategory = 'community';
      if (externalCategories.includes('festivals')) mappedCategory = 'festival';
      else if (externalCategories.includes('exhibitions')) mappedCategory = 'exhibition';
      else if (externalCategories.includes('food-drink')) mappedCategory = 'food';
      else if (externalCategories.includes('markets')) mappedCategory = 'market';
      else if (externalCategories.includes('classes-workshops')) mappedCategory = 'workshop';

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
        priceCents: hit.freeEvent ? 0 : 1000,
        isFree: !!hit.freeEvent,
        isFeatured: false,
        organizerId: 'admin_sys',
        capacity: 1000,
        attending: 0,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(docRef, eventData, { merge: true });
      count++;
    }

    await batch.commit();
    console.log(`Successfully synced ${count} events to Firestore.`);
    process.exit(0);
  } catch (err) {
    console.error('Error during Sydney What’s On event sync:', err);
    process.exit(1);
  }
}

runScraper();

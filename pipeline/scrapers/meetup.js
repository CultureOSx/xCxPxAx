// Scraper for Meetup events
import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeMeetupEvent } from '../normalizer/meetup.js';

export async function scrapeMeetupEvent(url) {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // Simplistic extraction logic for demonstration
    const title = $('h1').first().text().trim();
    const description = $('p').map((i, el) => $(el).text()).get().join('\n');
    const venueName = $('.venueDisplay-name').first().text().trim();
    const address = $('.venueDisplay-address').first().text().trim();
    const prices = []; // Often free or needs deeper parsing
    const tags = $('.topic-tag').map((i, el) => $(el).text()).get();

    // We try to find schema.org Event JSON-LD if available
    let startTime = null;
    let endTime = null;
    let image = null;
    let organizerName = null;

    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const parsed = JSON.parse($(el).html());
        if (parsed["@type"] === "Event") {
          if (parsed.startDate) startTime = parsed.startDate;
          if (parsed.endDate) endTime = parsed.endDate;
          if (parsed.image) {
              image = Array.isArray(parsed.image) ? parsed.image[0] : parsed.image;
          }
          if (parsed.organizer && parsed.organizer.name) {
              organizerName = parsed.organizer.name;
          }
        }
      } catch (e) {}
    });

    const data = {
      title,
      description,
      venueName,
      address,
      startTime,
      endTime,
      prices,
      tags,
      image,
      organizerName,
    };

    return normalizeMeetupEvent(data, url);
  } catch (error) {
    console.error(`Error scraping Meetup event at ${url}:`, error.message);
    throw error;
  }
}

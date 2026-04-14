// Scraper for Eventbrite events
import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeEventbriteEvent } from '../normalizer/eventbrite.js';

export async function scrapeEventbriteEvent(url) {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    // Simplistic extraction logic for demonstration
    const title = $('h1').first().text().trim();
    const description = $('p').map((i, el) => $(el).text()).get().join('\n');
    const venueName = $('.venue-name').first().text().trim();
    const address = $('.venue-address').first().text().trim();
    const prices = $('body').text().match(/\$\d+\.\d+/g) || [];
    const tags = $('.tags-list a').map((i, el) => $(el).text()).get();

    // We try to find schema.org Event JSON-LD if available
    let startTime = null;
    let endTime = null;
    let image = null;
    let organizerName = null;

    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const parsed = JSON.parse($(el).html());
        const events = Array.isArray(parsed) ? parsed : [parsed];
        const event = events.find(e => e["@type"] === "Event" || e["@type"] === "EducationEvent" || e["@type"] === "BusinessEvent" || e["@type"] === "SportsEvent");

        if (event) {
          if (event.startDate) startTime = event.startDate;
          if (event.endDate) endTime = event.endDate;
          if (event.image) {
              image = Array.isArray(event.image) ? event.image[0] : event.image;
          }
          if (event.organizer && event.organizer.name) {
              organizerName = event.organizer.name;
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

    return normalizeEventbriteEvent(data, url);
  } catch (error) {
    console.error(`Error scraping Eventbrite event at ${url}:`, error.message);
    throw error;
  }
}

// @ts-nocheck
// Scraper for City of Sydney events
import axios from 'axios';
import cheerio from 'cheerio';
import { normalizeCityOfSydneyEvent } from '../normalizer/cityofsydney';

export async function scrapeCityOfSydneyEvent(url) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  // 1. Try JSON-LD
  let jsonLd;
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const parsed = JSON.parse($(el).html());
      if (parsed["@type"] === "Event") {
        jsonLd = parsed;
      }
    } catch (e) {}
  });
  if (jsonLd) {
    return normalizeCityOfSydneyEvent(jsonLd, url);
  }

  // 2. Fallback: DOM scraping
  const title = $("h1").first().text().trim();
  const description = $("p").map((i, el) => $(el).text()).get().join("\n");
  const venue = $("a[href*='venues']").first().text().trim();
  const address = $("a[href*='maps']").prev().text().trim();
  const dateText = $("body").text().match(/Saturday.*pm/)?.[0] || "";
  const prices = $("body").text().match(/\$\d+\.\d+/g) || [];
  const tags = $("a[href*='/tags']").map((i, el) => $(el).text()).get();

  return {
    title,
    description,
    venue,
    address,
    dateText,
    prices,
    tags,
    sourceUrl: url,
    source: "cityofsydney",
  };
}

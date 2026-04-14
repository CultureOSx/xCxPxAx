import axios from 'axios';
import { scrapeCityOfSydneyEvent } from '../cityofsydney';
import { normalizeCityOfSydneyEvent } from '../../normalizer/cityofsydney';

jest.mock('axios', () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn(),
    },
  };
});

jest.mock('cheerio', () => {
  const actualCheerio = jest.requireActual('cheerio');
  return {
    __esModule: true,
    default: {
      load: actualCheerio.load || actualCheerio.default.load,
    },
  };
});

jest.mock('../../normalizer/cityofsydney');

describe('scrapeCityOfSydneyEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error when the network request fails', async () => {
    const mockError = new Error('Network Error');
    axios.get.mockRejectedValueOnce(mockError);

    await expect(scrapeCityOfSydneyEvent('https://example.com/event')).rejects.toThrow('Network Error');
    expect(axios.get).toHaveBeenCalledWith('https://example.com/event');
  });

  it('should fall back to DOM scraping when JSON-LD parsing fails', async () => {
    const htmlWithInvalidJsonLd = `
      <html>
        <head>
          <script type="application/ld+json">
            { invalid json }
          </script>
        </head>
        <body>
          <h1>DOM Title</h1>
          <p>DOM Description</p>
          <a href="/venues/some-venue">Venue Name</a>
          <span>Some text before maps</span><a href="/maps/some-map">Map</a>
          Saturday 8:00pm
          $10.00
          <a href="/tags/tag1">Tag1</a>
        </body>
      </html>
    `;
    axios.get.mockResolvedValueOnce({ data: htmlWithInvalidJsonLd });

    const result = await scrapeCityOfSydneyEvent('https://example.com/event');

    expect(result).toEqual({
      title: 'DOM Title',
      description: 'DOM Description',
      venue: 'Venue Name',
      address: 'Some text before maps',
      dateText: 'Saturday 8:00pm',
      prices: ['$10.00'],
      tags: ['Tag1'],
      sourceUrl: 'https://example.com/event',
      source: 'cityofsydney',
    });
    expect(normalizeCityOfSydneyEvent).not.toHaveBeenCalled();
  });

  it('should use JSON-LD when parsing succeeds', async () => {
    const validJsonLd = {
      "@type": "Event",
      "name": "JSON-LD Title",
    };
    const htmlWithValidJsonLd = `
      <html>
        <head>
          <script type="application/ld+json">
            ${JSON.stringify(validJsonLd)}
          </script>
        </head>
        <body>
          <h1>DOM Title</h1>
        </body>
      </html>
    `;
    axios.get.mockResolvedValueOnce({ data: htmlWithValidJsonLd });

    const mockNormalizedEvent = { title: 'Normalized Title' };
    normalizeCityOfSydneyEvent.mockReturnValueOnce(mockNormalizedEvent);

    const result = await scrapeCityOfSydneyEvent('https://example.com/event');

    expect(result).toEqual(mockNormalizedEvent);
    expect(normalizeCityOfSydneyEvent).toHaveBeenCalledWith(validJsonLd, 'https://example.com/event');
  });
});

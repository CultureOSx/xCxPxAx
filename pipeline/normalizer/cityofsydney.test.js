import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCityOfSydneyEvent } from './cityofsydney.js';

test('normalizeCityOfSydneyEvent - fully populated happy path', () => {
  const mockJson = {
    name: 'Sydney Night Market',
    description: 'A great night market',
    startDate: '2023-10-01T18:00:00Z',
    endDate: '2023-10-01T22:00:00Z',
    location: {
      name: 'Town Hall',
      address: {
        streetAddress: '483 George St, Sydney NSW 2000'
      },
      geo: {
        latitude: -33.873,
        longitude: 151.206
      }
    },
    offers: [
      { name: 'Adult', price: 20 },
      { price: 10 } // Missing name, should default to 'General'
    ],
    keywords: ['market', 'night'],
    eventType: 'Festival',
    organizer: {
      name: 'City of Sydney',
      url: 'https://whatson.cityofsydney.nsw.gov.au'
    },
    image: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
  };

  const url = 'https://whatson.cityofsydney.nsw.gov.au/events/sydney-night-market';

  const result = normalizeCityOfSydneyEvent(mockJson, url);

  assert.equal(result.title, 'Sydney Night Market');
  assert.equal(result.description, 'A great night market');
  assert.equal(result.startTime, '2023-10-01T18:00:00Z');
  assert.equal(result.endTime, '2023-10-01T22:00:00Z');

  assert.deepEqual(result.venue, {
    name: 'Town Hall',
    address: '483 George St, Sydney NSW 2000',
    lat: -33.873,
    lng: 151.206
  });

  assert.deepEqual(result.pricing, [
    { label: 'Adult', price: 20 },
    { label: 'General', price: 10 }
  ]);

  assert.deepEqual(result.tags, ['market', 'night']);
  assert.deepEqual(result.categories, ['Festival']);
  assert.deepEqual(result.cultureTags, []);

  assert.deepEqual(result.organizer, {
    name: 'City of Sydney',
    website: 'https://whatson.cityofsydney.nsw.gov.au'
  });

  assert.deepEqual(result.media, {
    image: 'https://example.com/image1.jpg'
  });

  assert.deepEqual(result.source, {
    platform: 'cityofsydney',
    url
  });

  // createdAt and updatedAt should be valid ISO strings
  assert.ok(!Number.isNaN(Date.parse(result.createdAt)));
  assert.ok(!Number.isNaN(Date.parse(result.updatedAt)));
});

test('normalizeCityOfSydneyEvent - minimal missing fields', () => {
  const mockJson = {
    name: 'Minimal Event',
    description: 'Minimal description',
    startDate: '2023-10-01T18:00:00Z',
    endDate: '2023-10-01T22:00:00Z'
  };

  const url = 'https://whatson.cityofsydney.nsw.gov.au/events/minimal';

  const result = normalizeCityOfSydneyEvent(mockJson, url);

  assert.equal(result.title, 'Minimal Event');
  assert.deepEqual(result.venue, {
    name: undefined,
    address: undefined,
    lat: null,
    lng: null
  });

  assert.deepEqual(result.pricing, []);
  assert.deepEqual(result.tags, []);
  assert.deepEqual(result.categories, []);
  assert.deepEqual(result.cultureTags, []);

  assert.deepEqual(result.organizer, {
    name: undefined,
    website: undefined
  });

  assert.deepEqual(result.media, {
    image: undefined
  });
});

test('normalizeCityOfSydneyEvent - single string image', () => {
  const mockJson = {
    name: 'Image Event',
    image: 'https://example.com/single.jpg'
  };

  const result = normalizeCityOfSydneyEvent(mockJson, 'url');

  assert.deepEqual(result.media, {
    image: 'https://example.com/single.jpg'
  });
});

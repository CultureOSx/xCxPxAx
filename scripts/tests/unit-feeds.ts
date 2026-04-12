import assert from 'node:assert/strict';
import type { FirestoreEvent } from '../../functions/src/services/events';
import type { BuiltFeed, FeedMatchContext } from '../../functions/src/services/feeds';
import {
  buildICalFeed,
  buildRssFeed,
  filterEventsForFeed,
} from '../../functions/src/services/feeds';

function eventFixture(
  id: string,
  overrides: Record<string, unknown> = {},
): FirestoreEvent {
  return {
    id,
    title: `Event ${id}`,
    description: `Description for ${id}`,
    communityId: '',
    venue: 'Town Hall',
    date: '2026-05-01',
    time: '19:30',
    city: 'Sydney',
    state: 'NSW',
    country: 'Australia',
    status: 'published',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-02T10:00:00.000Z',
    ...overrides,
  } as unknown as FirestoreEvent;
}

const events: FirestoreEvent[] = [
  eventFixture('community-1', { communityId: 'community-123' }),
  eventFixture('host-1', {
    publisherProfileId: 'host-profile-1',
    organizerId: 'user-123',
    organizer: 'Host Name',
  }),
  eventFixture('host-2', {
    organizerId: 'legacy-host-owner',
    hostName: 'Legacy Host',
  }),
  eventFixture('artist-1', {
    artists: [{ name: 'Artist Name', profileId: 'artist-profile-1' }],
  }),
  eventFixture('venue-1', {
    venueProfileId: 'venue-profile-1',
    venue: 'Venue Name',
  }),
  eventFixture('tag-1', {
    tags: ['Night Market'],
    cultureTag: ['Malayali'],
    languageTags: ['Malayalam'],
  }),
  eventFixture('state-1', {
    city: 'Melbourne',
    state: 'VIC',
  }),
];

const communityContext: FeedMatchContext = {
  scope: 'community',
  value: 'community-123',
};
assert.deepEqual(
  filterEventsForFeed(events, communityContext).map((event) => event.id),
  ['community-1'],
);

const hostContext: FeedMatchContext = {
  scope: 'host',
  value: 'host-profile-1',
  profile: {
    id: 'host-profile-1',
    name: 'Host Name',
    entityType: 'organisation',
    ownerId: 'legacy-host-owner',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};
assert.deepEqual(
  filterEventsForFeed(events, hostContext).map((event) => event.id),
  ['host-1', 'host-2'],
);

const artistContext: FeedMatchContext = {
  scope: 'artist',
  value: 'artist-profile-1',
  profile: {
    id: 'artist-profile-1',
    name: 'Artist Name',
    entityType: 'artist',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};
assert.deepEqual(
  filterEventsForFeed(events, artistContext).map((event) => event.id),
  ['artist-1'],
);

const venueContext: FeedMatchContext = {
  scope: 'venue',
  value: 'venue-profile-1',
  profile: {
    id: 'venue-profile-1',
    name: 'Venue Name',
    entityType: 'venue',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};
assert.deepEqual(
  filterEventsForFeed(events, venueContext).map((event) => event.id),
  ['venue-1'],
);

const cityContext: FeedMatchContext = {
  scope: 'city',
  value: 'Sydney',
  country: 'Australia',
};
assert.deepEqual(
  filterEventsForFeed(events, cityContext).map((event) => event.id),
  ['community-1', 'host-1', 'host-2', 'artist-1', 'venue-1', 'tag-1'],
);

const stateContext: FeedMatchContext = {
  scope: 'state',
  value: 'Victoria',
  country: 'Australia',
};
assert.deepEqual(
  filterEventsForFeed(events, stateContext).map((event) => event.id),
  ['state-1'],
);

const tagContext: FeedMatchContext = {
  scope: 'tag',
  value: 'Malayalam',
};
assert.deepEqual(
  filterEventsForFeed(events, tagContext).map((event) => event.id),
  ['tag-1'],
);

const builtFeed: BuiltFeed = {
  title: 'Sydney Events | CulturePass',
  description: 'Upcoming public events happening in Sydney on CulturePass.',
  scope: 'city',
  value: 'Sydney',
  country: 'Australia',
  websiteUrl: 'https://culturepass.app/city/Sydney?country=Australia',
  feedUrl: 'https://culturepass.app/api/feeds/city/Sydney.rss?country=Australia',
  origin: 'https://culturepass.app',
  events: [events[0]],
  updatedAt: '2026-04-02T10:00:00.000Z',
};

const rss = buildRssFeed(builtFeed);
assert.ok(rss.includes('<rss version="2.0"'));
assert.ok(rss.includes('<title>Sydney Events | CulturePass</title>'));
assert.ok(rss.includes('<item>'));
assert.ok(rss.includes('https://culturepass.app/event/community-1'));

const ical = buildICalFeed(builtFeed);
assert.ok(ical.includes('BEGIN:VCALENDAR'));
assert.ok(ical.includes('BEGIN:VEVENT'));
assert.ok(ical.includes('SUMMARY:Event community-1'));
assert.ok(ical.includes('DTSTART:20260501T193000'));

console.log('unit feed checks passed');

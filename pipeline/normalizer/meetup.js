// Normalizer for Meetup events to Firestore schema
export function normalizeMeetupEvent(data, url) {
  return {
    title: data.title || '',
    description: data.description || '',
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    venue: {
      name: data.venueName || null,
      address: data.address || null,
      lat: data.lat || null,
      lng: data.lng || null,
    },
    pricing: data.prices ? data.prices.map(price => ({ label: 'General', price })) : [],
    tags: data.tags || [],
    categories: [],
    cultureTags: [], // Enrich later
    organizer: {
      name: data.organizerName || null,
      website: null,
    },
    media: {
      image: data.image || null,
    },
    source: {
      platform: 'meetup',
      url,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

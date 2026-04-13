// @ts-nocheck
// Normalizer for City of Sydney event JSON-LD to Firestore schema
export function normalizeCityOfSydneyEvent(json, url) {
  return {
    title: json.name,
    description: json.description,
    startTime: json.startDate,
    endTime: json.endDate,
    venue: {
      name: json.location?.name,
      address: json.location?.address?.streetAddress,
      lat: json.location?.geo?.latitude || null,
      lng: json.location?.geo?.longitude || null,
    },
    pricing: Array.isArray(json.offers)
      ? json.offers.map(o => ({ label: o.name || 'General', price: o.price }))
      : [],
    tags: Array.isArray(json.keywords) ? json.keywords : [],
    categories: json.eventType ? [json.eventType] : [],
    cultureTags: [], // Enrich later
    organizer: {
      name: json.organizer?.name,
      website: json.organizer?.url,
    },
    media: {
      image: Array.isArray(json.image) ? json.image[0] : json.image,
    },
    source: {
      platform: 'cityofsydney',
      url,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

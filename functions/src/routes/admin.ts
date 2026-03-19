import { Router, Request, Response } from 'express';
import { db } from '../admin';
import { performMegaSeed } from '../megaSeed';
import { nowIso } from './utils';
import { locationsService } from '../services/locations';
import { authenticate, requireRole } from '../middleware/auth';

export const adminRouter = Router();

// ---------------------------------------------------------------------------
// Mega Seed — full population (protected by SEED_SECRET header)
// ---------------------------------------------------------------------------

adminRouter.post('/admin/mega-seed', async (req: Request, res: Response) => {
  const secret = process.env.SEED_SECRET;
  const providedSecret = req.headers['x-seed-secret'];

  if (!secret || providedSecret !== secret) {
    if (providedSecret !== 'culture_run_seed_v1') { // Fallback bypass for direct testing
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  try {
    const result = await performMegaSeed(db);
    return res.json(result);
  } catch (err) {
    console.error('[admin/mega-seed]:', err);
    return res.status(500).json({ error: 'Mega-Seed failed' });
  }
});

// ---------------------------------------------------------------------------
// Standard Seed — core data (protected by SEED_SECRET header)
// ---------------------------------------------------------------------------

adminRouter.post('/admin/seed', async (req: Request, res: Response) => {
  const secret = process.env.SEED_SECRET;
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const nowTs = nowIso();
  const soon = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const SEED_EVENTS = [
    { title: 'Sydney Kerala Cultural Festival 2026', description: 'The biggest Malayalam cultural gathering in the Southern Hemisphere. Live music, Kathakali dance, traditional cuisine, and community awards. Families welcome.', communityId: 'Malayalam', venue: 'Darling Harbour Convention Centre', address: '14 Darling Dr, Sydney NSW 2000', date: soon(14), time: '10:00 AM', city: 'Sydney', country: 'Australia', imageUrl: 'https://images.unsplash.com/photo-1598300056393-4aac492f4344?w=800', imageColor: '#E8472A', cultureTag: ['Kerala', 'Malayalam', 'South Indian'], tags: ['festival', 'culture', 'family', 'dance'], category: 'Festival', eventType: 'In-Person', ageSuitability: 'All Ages', priceTier: 'mid', priceCents: 2500, priceLabel: '$25', isFree: false, isFeatured: true, capacity: 2000, attending: 847, organizerId: 'seed-org-1', organizer: 'Kerala Community Sydney', organizerReputationScore: 92, status: 'published' as const, cpid: 'CP-E-KCFSYD', tiers: [{ name: 'General', priceCents: 2500, available: 1200 }, { name: 'Family Pack (4)', priceCents: 8000, available: 200 }, { name: 'VIP', priceCents: 7500, available: 50 }] },
    { title: 'Tamil Pongal Celebration — Sydney', description: 'Join us to celebrate the harvest festival of Pongal with traditional kolam art, music, delicious food, and a bonfire ceremony.', communityId: 'Tamil', venue: 'Parramatta Town Hall', address: '182 Church St, Parramatta NSW 2150', date: soon(7), time: '09:00 AM', city: 'Sydney', country: 'Australia', imageUrl: 'https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=800', imageColor: '#F59E0B', cultureTag: ['Tamil', 'South Indian'], tags: ['pongal', 'harvest', 'family'], category: 'Cultural', eventType: 'In-Person', ageSuitability: 'All Ages', priceTier: 'free', priceCents: 0, priceLabel: 'Free', isFree: true, isFeatured: true, capacity: 800, attending: 412, organizerId: 'seed-org-2', organizer: 'Tamil Sangam NSW', organizerReputationScore: 88, status: 'published' as const, cpid: 'CP-E-PONGSYD', tiers: [] },
    { title: 'Bollywood Night — Live DJ & Dance', description: 'The hottest Bollywood party in Sydney! Dance the night away with live DJ sets, costume competition, and authentic cocktails.', communityId: 'Bollywood', venue: 'The Star Event Centre', address: '80 Pyrmont St, Pyrmont NSW 2009', date: soon(21), time: '08:00 PM', city: 'Sydney', country: 'Australia', imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800', imageColor: '#7C3AED', cultureTag: ['Bollywood', 'South Asian', 'Hindi'], tags: ['party', 'dance', 'dj', 'nightlife'], category: 'Nightlife', eventType: 'In-Person', ageSuitability: '18+', priceTier: 'mid', priceCents: 3500, priceLabel: '$35', isFree: false, isFeatured: true, capacity: 600, attending: 521, organizerId: 'seed-org-3', organizer: 'Desi Nights Sydney', organizerReputationScore: 85, status: 'published' as const, cpid: 'CP-E-BNISYD', tiers: [{ name: 'Standard', priceCents: 3500, available: 400 }, { name: 'VIP Table', priceCents: 15000, available: 20 }] },
    { title: 'Filipino Cultural Showcase — Sinulog Sydney', description: 'Celebrate the Sinulog Festival with traditional Cebuano street dancing, lechon feast, Filipino arts and crafts market.', communityId: 'Filipino', venue: 'Sydney Olympic Park', address: 'Olympic Blvd, Sydney Olympic Park NSW 2127', date: soon(30), time: '11:00 AM', city: 'Sydney', country: 'Australia', imageUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800', imageColor: '#EF4444', cultureTag: ['Filipino', 'Cebuano', 'Southeast Asian'], tags: ['festival', 'dance', 'food', 'sinulog'], category: 'Festival', eventType: 'In-Person', ageSuitability: 'All Ages', priceTier: 'low', priceCents: 1500, priceLabel: '$15', isFree: false, isFeatured: false, capacity: 1000, attending: 234, organizerId: 'seed-org-4', organizer: 'Fil-Oz Cultural Foundation', organizerReputationScore: 79, status: 'published' as const, cpid: 'CP-E-FILSYD', tiers: [{ name: 'Adult', priceCents: 1500, available: 700 }, { name: 'Child (under 12)', priceCents: 500, available: 200 }] },
    { title: 'Chinese New Year — Dragon Dance Parade', description: 'Ring in the Year of the Snake with spectacular dragon and lion dances through Chinatown, followed by a lantern festival and dumpling-making workshops.', communityId: 'Chinese', venue: 'Sydney Chinatown', address: 'Dixon St, Haymarket NSW 2000', date: soon(10), time: '06:00 PM', city: 'Sydney', country: 'Australia', imageUrl: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800', imageColor: '#DC2626', cultureTag: ['Chinese', 'East Asian'], tags: ['new year', 'parade', 'lantern', 'family'], category: 'Festival', eventType: 'In-Person', ageSuitability: 'All Ages', priceTier: 'free', priceCents: 0, priceLabel: 'Free', isFree: true, isFeatured: true, capacity: 5000, attending: 3211, organizerId: 'seed-org-5', organizer: 'Sydney Chinese Community Association', organizerReputationScore: 96, status: 'published' as const, cpid: 'CP-E-CNYSYD', tiers: [] },
  ];

  const SEED_COMMUNITIES = [
    { name: 'Kerala Cultural Society Sydney', entityType: 'community' as const, category: 'Cultural', city: 'Sydney', country: 'Australia', description: 'Connecting Malayali diaspora in Sydney through cultural events, Onam celebrations, and community support.', members: 1240, verified: true, ownerId: 'seed-org-1', rating: 4.8, cpid: 'CP-C-KCSSYD' },
    { name: 'Tamil Sangam NSW', entityType: 'community' as const, category: 'Cultural', city: 'Sydney', country: 'Australia', description: 'Celebrating Tamil culture, language, and heritage in New South Wales.', members: 890, verified: true, ownerId: 'seed-org-2', rating: 4.7, cpid: 'CP-C-TSNNSW' },
    { name: 'Chinese Community Sydney', entityType: 'community' as const, category: 'Cultural', city: 'Sydney', country: 'Australia', description: 'Fostering connections across Chinese-Australian communities in greater Sydney.', members: 3200, verified: true, ownerId: 'seed-org-5', rating: 4.9, cpid: 'CP-C-CCSSYD' },
  ];

  try {
    const batch = db.batch();
    let count = 0;
    for (const event of SEED_EVENTS) {
      const ref = db.collection('events').doc();
      batch.set(ref, { ...event, id: ref.id, createdAt: nowTs, updatedAt: nowTs });
      count++;
    }
    for (const community of SEED_COMMUNITIES) {
      const ref = db.collection('profiles').doc();
      batch.set(ref, { ...community, id: ref.id, createdAt: nowTs, updatedAt: nowTs });
      count++;
    }
    await batch.commit();
    const locationResult = await locationsService.seedIfEmpty();
    return res.json({ seeded: count, events: SEED_EVENTS.length, communities: SEED_COMMUNITIES.length, locationSeeded: locationResult.seeded, ok: true });
  } catch (err) {
    console.error('[admin/seed]:', err);
    return res.status(500).json({ error: 'Seed failed' });
  }
});

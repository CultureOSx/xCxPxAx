import { CultureTokens } from '@/constants/theme';
import type { Profile } from '@/shared/schema';

export type DiscoverFocus =
  | 'all'
  | 'indigenous'
  | 'music'
  | 'dance'
  | 'food'
  | 'art'
  | 'wellness'
  | 'film'
  | 'workshop'
  | 'heritage'
  | 'nightlife';

type DiscoverArtistRoute =
  | { type: 'artist'; id: string }
  | { type: 'explore'; focus: DiscoverFocus };

export interface DiscoverArtistHighlight {
  id: string;
  name: string;
  subtitle: string;
  meta: string;
  imageUrl?: string;
  accentColor: string;
  ctaLabel: string;
  route: DiscoverArtistRoute;
}

interface FallbackArtistSeed {
  id: string;
  name: string;
  subtitle: string;
  meta: string;
  imageUrl: string;
  accentColor: string;
  focus: DiscoverFocus;
}

export interface HeritagePlaylistItem {
  id: string;
  title: string;
  artist: string;
  culture: string;
  imageUrl: string;
  typeLabel: 'Music' | 'Podcast' | 'Story';
  accentColor: string;
  focus: DiscoverFocus;
  isLive?: boolean;
  matchKeys?: string[];
}

export const FEATURED_ARTIST: FallbackArtistSeed[] = [
  {
    id: 'fallback-aarav',
    name: 'Aarav Shrivastav',
    subtitle: 'Tabla Maestro',
    meta: 'Classical Sessions',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    accentColor: CultureTokens.saffron,
    focus: 'music',
  },
  {
    id: 'fallback-suki',
    name: 'Suki Park',
    subtitle: 'K-Pop Voyager',
    meta: 'Dance and pop culture',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800&auto=format&fit=crop',
    accentColor: CultureTokens.coral,
    focus: 'dance',
  },
  {
    id: 'fallback-zainab',
    name: 'Zainab Al-Fayed',
    subtitle: 'Oud Artisan',
    meta: 'Traditional soundscapes',
    imageUrl: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=800&auto=format&fit=crop',
    accentColor: CultureTokens.teal,
    focus: 'music',
  },
];

export const HERITAGE_PLAYLIST: HeritagePlaylistItem[] = [
  {
    id: 'playlist-sitar',
    title: 'Soul of the Sitar',
    artist: 'Ravi Shankar',
    culture: 'India',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop',
    typeLabel: 'Music',
    accentColor: CultureTokens.saffron,
    focus: 'music',
    matchKeys: ['indian', 'hindi', 'punjabi', 'tamil', 'bengali', 'south_asian_diaspora'],
  },
  {
    id: 'playlist-seoul',
    title: 'Neo-Trad Seoul',
    artist: 'Leenalchi',
    culture: 'South Korea',
    imageUrl: 'https://images.unsplash.com/photo-1542152352-8418086054f7?q=80&w=800&auto=format&fit=crop',
    typeLabel: 'Music',
    accentColor: CultureTokens.coral,
    focus: 'dance',
    isLive: true,
    matchKeys: ['korean', 'east_asian_diaspora'],
  },
  {
    id: 'playlist-aegean',
    title: 'Aegean Echoes',
    artist: 'Yanni',
    culture: 'Greece',
    imageUrl: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=800&auto=format&fit=crop',
    typeLabel: 'Podcast',
    accentColor: CultureTokens.indigo,
    focus: 'heritage',
    matchKeys: ['greek', 'mediterranean_diaspora'],
  },
  {
    id: 'playlist-oral-history',
    title: 'Diaspora Dinner Table',
    artist: 'CulturePass Radio',
    culture: 'Global Diaspora',
    imageUrl: 'https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?q=80&w=800&auto=format&fit=crop',
    typeLabel: 'Story',
    accentColor: CultureTokens.gold,
    focus: 'heritage',
  },
];

function getProfileImage(profile: Profile): string | undefined {
  return profile.coverImageUrl || profile.avatarUrl || profile.imageUrl;
}

export function buildFeaturedArtists(artists: Profile[]): DiscoverArtistHighlight[] {
  if (artists.length > 0) {
    return artists.slice(0, 6).map((artist, index) => ({
      id: artist.id,
      name: artist.name,
      subtitle: artist.category || artist.title || artist.subCategory || 'Featured artist',
      meta: [artist.city, artist.country].filter(Boolean).join(', ') || 'CulturePass artist',
      imageUrl: getProfileImage(artist),
      accentColor: artist.color || FEATURED_ARTIST[index % FEATURED_ARTIST.length].accentColor,
      ctaLabel: 'View artist',
      route: { type: 'artist', id: artist.id },
    }));
  }

  return FEATURED_ARTIST.map((artist) => ({
    id: artist.id,
    name: artist.name,
    subtitle: artist.subtitle,
    meta: artist.meta,
    imageUrl: artist.imageUrl,
    accentColor: artist.accentColor,
    ctaLabel: 'Explore more',
    route: { type: 'explore', focus: artist.focus },
  }));
}

export function buildHeritagePlaylist(cultureIds: string[] = []): HeritagePlaylistItem[] {
  if (cultureIds.length === 0) {
    return HERITAGE_PLAYLIST;
  }

  const lowered = cultureIds.map((cultureId) => cultureId.toLowerCase());

  return [...HERITAGE_PLAYLIST].sort((left, right) => {
    const leftMatch = left.matchKeys?.some((key) => lowered.includes(key.toLowerCase())) ? 1 : 0;
    const rightMatch = right.matchKeys?.some((key) => lowered.includes(key.toLowerCase())) ? 1 : 0;
    return rightMatch - leftMatch;
  });
}

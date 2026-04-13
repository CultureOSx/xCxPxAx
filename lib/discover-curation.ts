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

const ACCENT_CYCLE = [CultureTokens.gold, CultureTokens.coral, CultureTokens.teal, CultureTokens.indigo];

function getProfileImage(profile: Profile): string | undefined {
  return profile.coverImageUrl || profile.avatarUrl || profile.imageUrl;
}

export function buildFeaturedArtists(artists: Profile[]): DiscoverArtistHighlight[] {
  if (artists.length === 0) return [];

  return artists.slice(0, 6).map((artist, index) => ({
    id: artist.id,
    name: artist.name,
    subtitle: artist.category || artist.title || artist.subCategory || 'Featured artist',
    meta: [artist.city, artist.country].filter(Boolean).join(', ') || 'CulturePass artist',
    imageUrl: getProfileImage(artist),
    accentColor: artist.color || ACCENT_CYCLE[index % ACCENT_CYCLE.length],
    ctaLabel: 'View artist',
    route: { type: 'artist', id: artist.id },
  }));
}

/** Returns curated items only; platform defaults ship empty — use API curation or admin config. */
export function buildHeritagePlaylist(_cultureIds: string[] = []): HeritagePlaylistItem[] {
  return [];
}

import type { EntityType, SocialLinks } from './common';

export interface Profile {
  id: string;
  name: string;
  slug?: string;
  /** CulturePass handle for this entity — displayed as +handle */
  handle?: string;
  /** Whether this handle has been approved by admin (default: 'pending' on creation) */
  handleStatus?: 'pending' | 'approved' | 'rejected';
  title?: string;
  type?: EntityType;
  entityType: 'community' | 'business' | 'venue' | 'artist' | 'organizer' | 'restaurant' | 'brand';
  description?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  avatarUrl?: string;
  gallery?: string[];
  city?: string;
  country?: string;
  location?: { lat: number; lng: number };
  geoHash?: string;
  status?: 'draft' | 'published' | 'suspended';
  visibility?: 'public' | 'private' | 'community_only';
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  reportCount?: number;
  isClaimed?: boolean;
  isVerified?: boolean;
  followersCount?: number;
  views?: number;
  likes?: number;
  eventsCount?: number;
  membersCount?: number;
  reviewsCount?: number;
  rating?: number;
  category?: string;
  subCategory?: string;
  tags?: string[];
  /** Legacy free-text culture tags */
  cultureTags?: string[];
  /** Legacy free-text language list */
  languages?: string[];
  // ── Cultural Identity Layer ───────────────────────────────────────────────
  /** Typed nationality FK, e.g. 'indian' */
  nationalityId?: string;
  /** Typed culture FKs, e.g. ['malayali'] */
  cultureIds?: string[];
  /** ISO 639-3 language FKs, e.g. ['mal', 'eng'] */
  languageIds?: string[];
  /** Cross-national diaspora group FKs */
  diasporaGroupIds?: string[];
  website?: string;
  contactEmail?: string;
  phone?: string;
  socialLinks?: SocialLinks;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  spotify?: string;
  tiktok?: string;
  councilId?: string;
  parentCommunityId?: string;
  upcomingEventsCount?: number;
  pastEventsCount?: number;
  perksAvailable?: number;
  membershipRequired?: boolean;
  sponsorLevel?: string;
  bio?: string;
  address?: string;
  openingHours?: string;
  hours?: string;
  priceRange?: string;
  priceLabel?: string;
  color?: string;
  icon?: string;
  isOpen?: boolean;
  cuisine?: string;
  menuHighlights?: string[];
  deals?: string[];
  deliveryAvailable?: boolean;
  reservationAvailable?: boolean;
  reviews?: { id: string; userId: string; rating: number; comment?: string; createdAt?: string }[];
  services?: string[];
  isIndigenousOwned?: boolean;
  indigenousCategory?: string;
  supplyNationRegistered?: boolean;
  genre?: string[];
  director?: string;
  cast?: string[];
  duration?: string;
  language?: string;
  imdbScore?: number;
  posterColor?: string;
  showtimes?: { time: string; cinema?: string; date?: string; price?: number }[];

  isPopular?: boolean;
  ageGroup?: string;
  highlights?: string[];
  features?: string[];

  isSponsored?: boolean;
  sponsorTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CommunityCategory =
  | 'cultural'
  | 'business'
  | 'council'
  | 'charity'
  | 'club'
  | 'professional';

export type CommunityMemberRole = 'member' | 'moderator' | 'admin' | 'organizer';

// ---------------------------------------------------------------------------
// Civic governance types
// ---------------------------------------------------------------------------

/** Australian government tier — local is the primary focus for CulturePass */
export type CivicTier = 'federal' | 'state' | 'local' | 'ward';

/** Role a representative holds in a civic or cultural context */
export type RepresentativeRole =
  | 'federal_mp'        // Federal MP / Senator
  | 'state_mp'          // State MLA / MLC
  | 'mayor'             // Local Council Mayor
  | 'deputy_mayor'      // Deputy Mayor
  | 'councillor'        // Ward Councillor
  | 'community_leader'  // Head of cultural organisation
  | 'artist';           // Creative / cultural artist

/** Civic color token mapping — drives UI badge and card styling */
export const CIVIC_TIER_COLORS: Record<CivicTier, string> = {
  federal: '#0066CC', // CultureTokens.indigo — highest authority
  state:   '#0066CC', // CultureTokens.indigo
  local:   '#2EC4B6', // CultureTokens.teal — most relevant for CulturePass
  ward:    '#2EC4B6', // CultureTokens.teal
};

export const REPRESENTATIVE_ROLE_COLORS: Record<RepresentativeRole, string> = {
  federal_mp:       '#0066CC', // Indigo — trust
  state_mp:         '#0066CC', // Indigo
  mayor:            '#2EC4B6', // Teal — stewardship
  deputy_mayor:     '#2EC4B6',
  councillor:       '#2EC4B6',
  community_leader: '#2EC4B6', // Teal — community
  artist:           '#FF5E5B', // Coral — creative energy
};

export const CIVIC_TIER_LABELS: Record<CivicTier, string> = {
  federal: 'Federal',
  state:   'State',
  local:   'Council',
  ward:    'Ward',
};

export const REPRESENTATIVE_ROLE_LABELS: Record<RepresentativeRole, string> = {
  federal_mp:       'Federal MP',
  state_mp:         'State MP',
  mayor:            'Mayor',
  deputy_mayor:     'Deputy Mayor',
  councillor:       'Councillor',
  community_leader: 'Community Leader',
  artist:           'Artist',
};

/** Slim representative record embedded in a Community or returned from the API */
export interface RepresentativeProfile {
  id: string;
  /** Optional link to a real user account if the rep has claimed their profile */
  userId?: string;
  name: string;
  role: RepresentativeRole;
  /** Human-readable title, e.g. "Mayor of Parramatta" */
  title: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  officeAddress?: string;
  contactEmail?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  verified: boolean;
  /** Parent community / LGA this rep serves */
  communityId?: string;
  /** Civic tier this representative belongs to */
  civicTier?: CivicTier;
  termExpiry?: string;
  /** Number of communities this rep serves */
  communitiesServed?: number;
  /** Number of events this rep has hosted via the platform */
  eventsHosted?: number;
  /** Whether this profile has been claimed by a verified .gov.au email */
  isClaimed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityLink {
  title: string;
  url: string;
  /** Ionicons name */
  icon: string;
}

export type CommunityActivityLevel = 'new' | 'steady' | 'active' | 'thriving';
export type CommunityJoinMode = 'open' | 'request' | 'invite';
export type CommunityCadence = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'seasonal';

export interface CommunityHealthSnapshot {
  memberGrowth30d?: number;
  activeMembers7d?: number;
  weeklyPosts?: number;
  engagementScore?: number;
  responseRate?: number;
  upcomingEventsCount?: number;
}

export interface CommunityTrustSignals {
  moderationEnabled?: boolean;
  safeSpacePolicy?: boolean;
  verifiedLeadersCount?: number;
  codeOfConductUrl?: string;
  responseRate?: number;
}

export interface CommunityDiscoverySignals {
  matchScore?: number;
  mutualMembersCount?: number;
  featuredReason?: string;
}

export interface Community extends Omit<Profile, 'type'> {
  type: 'community';
  membersCount?: number;
  memberCount?: number;
  category?: string;
  communityType?: string;
  communityCategory?: CommunityCategory;
  iconEmoji?: string;
  isIndigenous?: boolean;
  countryOfOrigin?: string;
  /** Cultural tags, e.g. ['Malayali', 'South Indian'] — legacy free-text */
  cultures?: string[];
  // ── Cultural Identity Layer ───────────────────────────────────────────────
  /** Typed nationality FK, e.g. 'indian' — from constants/cultures.ts NATIONALITIES */
  nationalityId?: string;
  /** Typed culture FKs, e.g. ['malayali', 'tamil'] — from constants/cultures.ts CULTURES */
  cultureIds?: string[];
  /** ISO 639-3 language FKs, e.g. ['mal', 'eng'] — from constants/languages.ts */
  languageIds?: string[];
  /** Cross-national diaspora group FKs, e.g. ['south_asian_diaspora'] */
  diasporaGroupIds?: string[];
  /** Link hub — up to 10 entries (Linktree-style) */
  links?: CommunityLink[];
  /** Authenticated user's role in this community (populated per-request) */
  memberRole?: CommunityMemberRole;
  /** Short one-line positioning for cards and rails */
  headline?: string;
  /** Clear statement of purpose or promise */
  mission?: string;
  /** Primary language label for display */
  primaryLanguageLabel?: string;
  /** Number of city chapters represented by this community */
  chapterCount?: number;
  /** City names where the community is active */
  chapterCities?: string[];
  /** How often the community gathers or programs */
  meetingCadence?: CommunityCadence;
  /** Whether members can join directly or require approval */
  joinMode?: CommunityJoinMode;
  /** Overall momentum classification for ranking and UI */
  activityLevel?: CommunityActivityLevel;
  /** Health and engagement metrics */
  communityHealth?: CommunityHealthSnapshot;
  /** Trust and safety metadata */
  trustSignals?: CommunityTrustSignals;
  /** Personalization and discovery metadata */
  discoverySignals?: CommunityDiscoverySignals;

  // ── Civic governance fields ──────────────────────────────────────────────
  /** Australian government tier — present on civic/council communities */
  civicTier?: CivicTier;
  /** LGA code, electorate code, or ward identifier from official data */
  lgaCode?: string;
  /** Parent community ID — e.g. a Ward points to its Council */
  parentCivicCommunityId?: string;
  /** Representative(s) for this civic community (populated per-request) */
  representatives?: RepresentativeProfile[];
  /** Primary representative (Mayor, MP, etc.) */
  representative?: Pick<RepresentativeProfile, 'id' | 'name' | 'role' | 'title' | 'avatarUrl' | 'verified'>;
}

export interface Review {
  id: string;
  profileId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string | null;
}

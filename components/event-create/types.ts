import { EventType, EntryType, SponsorTier } from '@/shared/schema';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Draft interfaces (local form state — not the final API payload)
// ---------------------------------------------------------------------------
export interface ArtistDraft { name: string; role: string; profileId?: string; imageUrl?: string }
export interface SponsorDraft { name: string; tier: SponsorTier; websiteUrl?: string; logoUrl?: string }
export interface HostDraft { name: string; contactEmail: string; contactPhone: string; websiteUrl?: string }
export interface TierDraft { name: string; priceCents: string; capacity: string }

export interface FormData {
  title: string;
  description: string;
  eventType: EventType | '';
  heroImageUrl: string;
  /** Directory profile shown as canonical publisher (optional). */
  publisherProfileId: string;
  /** Cached label for review UI */
  publisherLabel: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  /** Link to a venue-style profile (optional; one-off address when unset). */
  venueProfileId: string;
  venueProfileLabel: string;
  useLinkedVenue: boolean;
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  entryType: EntryType;
  isFree: boolean;
  priceCents: string;
  capacity: string;
  tiers: TierDraft[];
  artists: ArtistDraft[];
  sponsors: SponsorDraft[];
  hostInfo: HostDraft;
  cultureTagIds: string[];
  languageTagIds: string[];
  accessibilityIds: string[];
  /** Adds server tag `CultureToday` for the global calendar */
  cultureTodayPromo: boolean;
}

export const defaultForm: FormData = {
  title: '',
  description: '',
  eventType: '',
  heroImageUrl: '',
  publisherProfileId: '',
  publisherLabel: '',
  venue: '',
  address: '',
  city: '',
  country: 'Australia',
  venueProfileId: '',
  venueProfileLabel: '',
  useLinkedVenue: false,
  date: '',
  endDate: '',
  time: '',
  endTime: '',
  entryType: 'free_open',
  isFree: true,
  priceCents: '',
  capacity: '',
  tiers: [{ name: 'General Admission', priceCents: '', capacity: '' }],
  artists: [],
  sponsors: [],
  hostInfo: { name: '', contactEmail: '', contactPhone: '', websiteUrl: '' },
  cultureTagIds: [],
  languageTagIds: [],
  accessibilityIds: [],
  cultureTodayPromo: false,
};

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------
export type Step = 'basics' | 'publishing' | 'image' | 'location' | 'datetime' | 'entry' | 'tickets' | 'team' | 'culture' | 'review';

export const ALL_STEPS: Step[] = ['basics', 'publishing', 'image', 'location', 'datetime', 'entry', 'tickets', 'team', 'culture', 'review'];

export const STEP_TITLES: Record<Step, string> = {
  basics:   'Event Details',
  publishing: 'Publishing as',
  image:    'Event Image',
  location: 'Where is it?',
  datetime: 'When is it?',
  entry:    'Entry Type',
  tickets:  'Ticketing',
  team:     'Core Team',
  culture:  'Cultural Tags',
  review:   'Review & Publish',
};

export const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  basics:   'create-outline',
  publishing: 'business-outline',
  image:    'image-outline',
  location: 'location-outline',
  datetime: 'calendar-outline',
  entry:    'ticket-outline',
  tickets:  'cash-outline',
  team:     'people-outline',
  culture:  'globe-outline',
  review:   'checkmark-circle-outline',
};

export function getStepSub(step: Step): string {
  switch (step) {
    case 'basics':   return 'Name and describe your event';
    case 'publishing': return 'Choose the profile that appears as the organiser';
    case 'image':    return 'Add a hero image for your event';
    case 'location': return "Tell us where it's happening";
    case 'datetime': return 'Set the date and start time';
    case 'entry':    return 'Ticketed or free open entry?';
    case 'tickets':  return 'Configure pricing and capacity';
    case 'team':     return 'Artists, sponsors, and host info';
    case 'culture':  return 'Add cultural and language tags';
    case 'review':   return 'Check everything before publishing';
    default:         return '';
  }
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
export const EVENT_TYPES: { id: EventType; label: string; emoji: string }[] = [
  { id: 'festival',    label: 'Festival',      emoji: '🎉' },
  { id: 'concert',     label: 'Concert',       emoji: '🎵' },
  { id: 'food',        label: 'Food',          emoji: '🍜' },
  { id: 'cultural',    label: 'Cultural',      emoji: '🎭' },
  { id: 'workshop',    label: 'Workshop',      emoji: '🛠️' },
  { id: 'community',   label: 'Community',     emoji: '👥' },
  { id: 'sports',      label: 'Sports',        emoji: '⚽' },
  { id: 'conference',  label: 'Conference',    emoji: '🎤' },
  { id: 'exhibition',  label: 'Exhibition',    emoji: '🖼️' },
  { id: 'puja',        label: 'Puja / Prayer', emoji: '🙏' },
  { id: 'other',       label: 'Other',         emoji: '✨' },
];

export const SPONSOR_TIERS: { id: SponsorTier; label: string; color: string }[] = [
  { id: 'title',  label: 'Title Sponsor', color: '#FFC857' },
  { id: 'gold',   label: 'Gold',          color: '#FF8C42' },
  { id: 'silver', label: 'Silver',        color: '#9CA3AF' },
  { id: 'bronze', label: 'Bronze',        color: '#B45309' },
];

export const ACCESSIBILITY_OPTIONS = [
  { id: 'wheelchair', label: 'Wheelchair Accessible', icon: 'body' },
  { id: 'hearing', label: 'Hearing Loop', icon: 'ear' },
  { id: 'sign', label: 'Sign Language', icon: 'hand-left' },
  { id: 'quiet', label: 'Quiet Zones', icon: 'volume-mute' },
  { id: 'visual', label: 'Braille/Audio', icon: 'eye' },
];

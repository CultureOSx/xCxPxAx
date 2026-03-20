/**
 * Canonical CulturePass event category list.
 * Used by the filter UI and the import normalizer.
 */

export type EventCategory =
  | 'Children & Family'
  | 'Community & Causes'
  | 'Exhibitions'
  | 'Festival'
  | 'Food & Drink'
  | 'Music'
  | 'Nightlife'
  | 'Shopping, Markets & Fairs'
  | 'Sport & Fitness'
  | 'Talks, Courses & Workshops'
  | 'Theatre, Dance & Film'
  | 'Tours & Experiences';

export const EVENT_CATEGORIES: { id: EventCategory; icon: string }[] = [
  { id: 'Children & Family',          icon: 'people-outline'      },
  { id: 'Community & Causes',         icon: 'heart-outline'       },
  { id: 'Exhibitions',                icon: 'image-outline'       },
  { id: 'Festival',                   icon: 'sparkles-outline'    },
  { id: 'Food & Drink',               icon: 'restaurant-outline'  },
  { id: 'Music',                      icon: 'musical-notes-outline'},
  { id: 'Nightlife',                  icon: 'moon-outline'        },
  { id: 'Shopping, Markets & Fairs',  icon: 'bag-handle-outline'  },
  { id: 'Sport & Fitness',            icon: 'fitness-outline'     },
  { id: 'Talks, Courses & Workshops', icon: 'school-outline'      },
  { id: 'Theatre, Dance & Film',      icon: 'film-outline'        },
  { id: 'Tours & Experiences',        icon: 'compass-outline'     },
];

/**
 * Maps common external category strings (from scraped sources) to our canonical categories.
 * Case-insensitive matching is applied at usage time.
 */
export const CATEGORY_MAP: Record<string, EventCategory> = {
  // Children / Family
  'children and family':          'Children & Family',
  'children & family':            'Children & Family',
  'family':                       'Children & Family',
  'kids':                         'Children & Family',

  // Community
  'community':                    'Community & Causes',
  'community & causes':           'Community & Causes',
  'community and causes':         'Community & Causes',
  'cultural':                     'Community & Causes',
  'charity':                      'Community & Causes',
  'causes':                       'Community & Causes',
  'civil':                        'Community & Causes',

  // Exhibitions
  'exhibitions':                  'Exhibitions',
  'exhibition':                   'Exhibitions',
  'gallery':                      'Exhibitions',
  'art':                          'Exhibitions',
  'arts and culture':             'Exhibitions',
  'arts & culture':               'Exhibitions',

  // Festival
  'festival':                     'Festival',
  'festivals':                    'Festival',
  'heritage':                     'Festival',

  // Food & Drink
  'food and drink':               'Food & Drink',
  'food & drink':                 'Food & Drink',
  'food':                         'Food & Drink',
  'drink':                        'Food & Drink',
  'dining':                       'Food & Drink',
  'markets':                      'Shopping, Markets & Fairs',

  // Music
  'music':                        'Music',
  'live music':                   'Music',
  'concert':                      'Music',
  'gig':                          'Music',

  // Nightlife
  'nightlife':                    'Nightlife',
  'night life':                   'Nightlife',
  'party':                        'Nightlife',
  'club':                         'Nightlife',

  // Shopping
  'shopping, markets & fairs':    'Shopping, Markets & Fairs',
  'shopping markets and fairs':   'Shopping, Markets & Fairs',
  'shopping':                     'Shopping, Markets & Fairs',
  'market':                       'Shopping, Markets & Fairs',
  'fair':                         'Shopping, Markets & Fairs',

  // Sport & Fitness
  'sport and fitness':            'Sport & Fitness',
  'sport & fitness':              'Sport & Fitness',
  'sport':                        'Sport & Fitness',
  'fitness':                      'Sport & Fitness',
  'sports':                       'Sport & Fitness',
  'outdoor':                      'Sport & Fitness',
  'recreation':                   'Sport & Fitness',

  // Talks, Courses & Workshops
  'talks, courses & workshops':   'Talks, Courses & Workshops',
  'talks courses and workshops':  'Talks, Courses & Workshops',
  'talks and workshops':          'Talks, Courses & Workshops',
  'workshop':                     'Talks, Courses & Workshops',
  'workshops':                    'Talks, Courses & Workshops',
  'talk':                         'Talks, Courses & Workshops',
  'course':                       'Talks, Courses & Workshops',
  'education':                    'Talks, Courses & Workshops',
  'seminar':                      'Talks, Courses & Workshops',
  'lecture':                      'Talks, Courses & Workshops',

  // Theatre, Dance & Film
  'theatre, dance & film':        'Theatre, Dance & Film',
  'theatre dance and film':       'Theatre, Dance & Film',
  'theatre':                      'Theatre, Dance & Film',
  'theater':                      'Theatre, Dance & Film',
  'dance':                        'Theatre, Dance & Film',
  'film':                         'Theatre, Dance & Film',
  'cinema':                       'Theatre, Dance & Film',
  'performance':                  'Theatre, Dance & Film',

  // Tours & Experiences
  'tours & experiences':          'Tours & Experiences',
  'tours and experiences':        'Tours & Experiences',
  'tour':                         'Tours & Experiences',
  'tours':                        'Tours & Experiences',
  'experience':                   'Tours & Experiences',
};

export function normalizeCategory(raw: string | undefined): EventCategory | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase();
  return CATEGORY_MAP[key];
}

// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { CultureTokens } from '@/constants/theme';
import type { Profile } from '@/shared/schema';
export type DiscoverFocus = 'all' | 'indigenous' | 'music' | 'dance' | 'food' | 'art' | 'wellness' | 'film' | 'workshop' | 'heritage' | 'nightlife';
type DiscoverArtistRoute = {
  type: 'artist';
  id: string;
} | {
  type: 'explore';
  focus: DiscoverFocus;
};
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
export const FEATURED_ARTIST: FallbackArtistSeed[] = stryMutAct_9fa48("2811") ? [] : (stryCov_9fa48("2811"), [stryMutAct_9fa48("2812") ? {} : (stryCov_9fa48("2812"), {
  id: stryMutAct_9fa48("2813") ? "" : (stryCov_9fa48("2813"), 'fallback-aarav'),
  name: stryMutAct_9fa48("2814") ? "" : (stryCov_9fa48("2814"), 'Aarav Shrivastav'),
  subtitle: stryMutAct_9fa48("2815") ? "" : (stryCov_9fa48("2815"), 'Tabla Maestro'),
  meta: stryMutAct_9fa48("2816") ? "" : (stryCov_9fa48("2816"), 'Classical Sessions'),
  imageUrl: stryMutAct_9fa48("2817") ? "" : (stryCov_9fa48("2817"), 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop'),
  accentColor: CultureTokens.gold,
  focus: stryMutAct_9fa48("2818") ? "" : (stryCov_9fa48("2818"), 'music')
}), stryMutAct_9fa48("2819") ? {} : (stryCov_9fa48("2819"), {
  id: stryMutAct_9fa48("2820") ? "" : (stryCov_9fa48("2820"), 'fallback-suki'),
  name: stryMutAct_9fa48("2821") ? "" : (stryCov_9fa48("2821"), 'Suki Park'),
  subtitle: stryMutAct_9fa48("2822") ? "" : (stryCov_9fa48("2822"), 'K-Pop Voyager'),
  meta: stryMutAct_9fa48("2823") ? "" : (stryCov_9fa48("2823"), 'Dance and pop culture'),
  imageUrl: stryMutAct_9fa48("2824") ? "" : (stryCov_9fa48("2824"), 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800&auto=format&fit=crop'),
  accentColor: CultureTokens.coral,
  focus: stryMutAct_9fa48("2825") ? "" : (stryCov_9fa48("2825"), 'dance')
}), stryMutAct_9fa48("2826") ? {} : (stryCov_9fa48("2826"), {
  id: stryMutAct_9fa48("2827") ? "" : (stryCov_9fa48("2827"), 'fallback-zainab'),
  name: stryMutAct_9fa48("2828") ? "" : (stryCov_9fa48("2828"), 'Zainab Al-Fayed'),
  subtitle: stryMutAct_9fa48("2829") ? "" : (stryCov_9fa48("2829"), 'Oud Artisan'),
  meta: stryMutAct_9fa48("2830") ? "" : (stryCov_9fa48("2830"), 'Traditional soundscapes'),
  imageUrl: stryMutAct_9fa48("2831") ? "" : (stryCov_9fa48("2831"), 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=800&auto=format&fit=crop'),
  accentColor: CultureTokens.teal,
  focus: stryMutAct_9fa48("2832") ? "" : (stryCov_9fa48("2832"), 'music')
})]);
export const HERITAGE_PLAYLIST: HeritagePlaylistItem[] = stryMutAct_9fa48("2833") ? [] : (stryCov_9fa48("2833"), [stryMutAct_9fa48("2834") ? {} : (stryCov_9fa48("2834"), {
  id: stryMutAct_9fa48("2835") ? "" : (stryCov_9fa48("2835"), 'playlist-sitar'),
  title: stryMutAct_9fa48("2836") ? "" : (stryCov_9fa48("2836"), 'Soul of the Sitar'),
  artist: stryMutAct_9fa48("2837") ? "" : (stryCov_9fa48("2837"), 'Ravi Shankar'),
  culture: stryMutAct_9fa48("2838") ? "" : (stryCov_9fa48("2838"), 'India'),
  imageUrl: stryMutAct_9fa48("2839") ? "" : (stryCov_9fa48("2839"), 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop'),
  typeLabel: stryMutAct_9fa48("2840") ? "" : (stryCov_9fa48("2840"), 'Music'),
  accentColor: CultureTokens.gold,
  focus: stryMutAct_9fa48("2841") ? "" : (stryCov_9fa48("2841"), 'music'),
  matchKeys: stryMutAct_9fa48("2842") ? [] : (stryCov_9fa48("2842"), [stryMutAct_9fa48("2843") ? "" : (stryCov_9fa48("2843"), 'indian'), stryMutAct_9fa48("2844") ? "" : (stryCov_9fa48("2844"), 'hindi'), stryMutAct_9fa48("2845") ? "" : (stryCov_9fa48("2845"), 'punjabi'), stryMutAct_9fa48("2846") ? "" : (stryCov_9fa48("2846"), 'tamil'), stryMutAct_9fa48("2847") ? "" : (stryCov_9fa48("2847"), 'bengali'), stryMutAct_9fa48("2848") ? "" : (stryCov_9fa48("2848"), 'south_asian_diaspora')])
}), stryMutAct_9fa48("2849") ? {} : (stryCov_9fa48("2849"), {
  id: stryMutAct_9fa48("2850") ? "" : (stryCov_9fa48("2850"), 'playlist-seoul'),
  title: stryMutAct_9fa48("2851") ? "" : (stryCov_9fa48("2851"), 'Neo-Trad Seoul'),
  artist: stryMutAct_9fa48("2852") ? "" : (stryCov_9fa48("2852"), 'Leenalchi'),
  culture: stryMutAct_9fa48("2853") ? "" : (stryCov_9fa48("2853"), 'South Korea'),
  imageUrl: stryMutAct_9fa48("2854") ? "" : (stryCov_9fa48("2854"), 'https://images.unsplash.com/photo-1542152352-8418086054f7?q=80&w=800&auto=format&fit=crop'),
  typeLabel: stryMutAct_9fa48("2855") ? "" : (stryCov_9fa48("2855"), 'Music'),
  accentColor: CultureTokens.coral,
  focus: stryMutAct_9fa48("2856") ? "" : (stryCov_9fa48("2856"), 'dance'),
  isLive: stryMutAct_9fa48("2857") ? false : (stryCov_9fa48("2857"), true),
  matchKeys: stryMutAct_9fa48("2858") ? [] : (stryCov_9fa48("2858"), [stryMutAct_9fa48("2859") ? "" : (stryCov_9fa48("2859"), 'korean'), stryMutAct_9fa48("2860") ? "" : (stryCov_9fa48("2860"), 'east_asian_diaspora')])
}), stryMutAct_9fa48("2861") ? {} : (stryCov_9fa48("2861"), {
  id: stryMutAct_9fa48("2862") ? "" : (stryCov_9fa48("2862"), 'playlist-aegean'),
  title: stryMutAct_9fa48("2863") ? "" : (stryCov_9fa48("2863"), 'Aegean Echoes'),
  artist: stryMutAct_9fa48("2864") ? "" : (stryCov_9fa48("2864"), 'Yanni'),
  culture: stryMutAct_9fa48("2865") ? "" : (stryCov_9fa48("2865"), 'Greece'),
  imageUrl: stryMutAct_9fa48("2866") ? "" : (stryCov_9fa48("2866"), 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=800&auto=format&fit=crop'),
  typeLabel: stryMutAct_9fa48("2867") ? "" : (stryCov_9fa48("2867"), 'Podcast'),
  accentColor: CultureTokens.indigo,
  focus: stryMutAct_9fa48("2868") ? "" : (stryCov_9fa48("2868"), 'heritage'),
  matchKeys: stryMutAct_9fa48("2869") ? [] : (stryCov_9fa48("2869"), [stryMutAct_9fa48("2870") ? "" : (stryCov_9fa48("2870"), 'greek'), stryMutAct_9fa48("2871") ? "" : (stryCov_9fa48("2871"), 'mediterranean_diaspora')])
}), stryMutAct_9fa48("2872") ? {} : (stryCov_9fa48("2872"), {
  id: stryMutAct_9fa48("2873") ? "" : (stryCov_9fa48("2873"), 'playlist-oral-history'),
  title: stryMutAct_9fa48("2874") ? "" : (stryCov_9fa48("2874"), 'Diaspora Dinner Table'),
  artist: stryMutAct_9fa48("2875") ? "" : (stryCov_9fa48("2875"), 'CulturePass Radio'),
  culture: stryMutAct_9fa48("2876") ? "" : (stryCov_9fa48("2876"), 'Global Diaspora'),
  imageUrl: stryMutAct_9fa48("2877") ? "" : (stryCov_9fa48("2877"), 'https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?q=80&w=800&auto=format&fit=crop'),
  typeLabel: stryMutAct_9fa48("2878") ? "" : (stryCov_9fa48("2878"), 'Story'),
  accentColor: CultureTokens.gold,
  focus: stryMutAct_9fa48("2879") ? "" : (stryCov_9fa48("2879"), 'heritage')
})]);
function getProfileImage(profile: Profile): string | undefined {
  if (stryMutAct_9fa48("2880")) {
    {}
  } else {
    stryCov_9fa48("2880");
    return stryMutAct_9fa48("2883") ? (profile.coverImageUrl || profile.avatarUrl) && profile.imageUrl : stryMutAct_9fa48("2882") ? false : stryMutAct_9fa48("2881") ? true : (stryCov_9fa48("2881", "2882", "2883"), (stryMutAct_9fa48("2885") ? profile.coverImageUrl && profile.avatarUrl : stryMutAct_9fa48("2884") ? false : (stryCov_9fa48("2884", "2885"), profile.coverImageUrl || profile.avatarUrl)) || profile.imageUrl);
  }
}
export function buildFeaturedArtists(artists: Profile[]): DiscoverArtistHighlight[] {
  if (stryMutAct_9fa48("2886")) {
    {}
  } else {
    stryCov_9fa48("2886");
    if (stryMutAct_9fa48("2890") ? artists.length <= 0 : stryMutAct_9fa48("2889") ? artists.length >= 0 : stryMutAct_9fa48("2888") ? false : stryMutAct_9fa48("2887") ? true : (stryCov_9fa48("2887", "2888", "2889", "2890"), artists.length > 0)) {
      if (stryMutAct_9fa48("2891")) {
        {}
      } else {
        stryCov_9fa48("2891");
        return stryMutAct_9fa48("2892") ? artists.map((artist, index) => ({
          id: artist.id,
          name: artist.name,
          subtitle: artist.category || artist.title || artist.subCategory || 'Featured artist',
          meta: [artist.city, artist.country].filter(Boolean).join(', ') || 'CulturePass artist',
          imageUrl: getProfileImage(artist),
          accentColor: artist.color || FEATURED_ARTIST[index % FEATURED_ARTIST.length].accentColor,
          ctaLabel: 'View artist',
          route: {
            type: 'artist',
            id: artist.id
          }
        })) : (stryCov_9fa48("2892"), artists.slice(0, 6).map(stryMutAct_9fa48("2893") ? () => undefined : (stryCov_9fa48("2893"), (artist, index) => stryMutAct_9fa48("2894") ? {} : (stryCov_9fa48("2894"), {
          id: artist.id,
          name: artist.name,
          subtitle: stryMutAct_9fa48("2897") ? (artist.category || artist.title || artist.subCategory) && 'Featured artist' : stryMutAct_9fa48("2896") ? false : stryMutAct_9fa48("2895") ? true : (stryCov_9fa48("2895", "2896", "2897"), (stryMutAct_9fa48("2899") ? (artist.category || artist.title) && artist.subCategory : stryMutAct_9fa48("2898") ? false : (stryCov_9fa48("2898", "2899"), (stryMutAct_9fa48("2901") ? artist.category && artist.title : stryMutAct_9fa48("2900") ? false : (stryCov_9fa48("2900", "2901"), artist.category || artist.title)) || artist.subCategory)) || (stryMutAct_9fa48("2902") ? "" : (stryCov_9fa48("2902"), 'Featured artist'))),
          meta: stryMutAct_9fa48("2905") ? [artist.city, artist.country].filter(Boolean).join(', ') && 'CulturePass artist' : stryMutAct_9fa48("2904") ? false : stryMutAct_9fa48("2903") ? true : (stryCov_9fa48("2903", "2904", "2905"), (stryMutAct_9fa48("2906") ? [artist.city, artist.country].join(', ') : (stryCov_9fa48("2906"), (stryMutAct_9fa48("2907") ? [] : (stryCov_9fa48("2907"), [artist.city, artist.country])).filter(Boolean).join(stryMutAct_9fa48("2908") ? "" : (stryCov_9fa48("2908"), ', ')))) || (stryMutAct_9fa48("2909") ? "" : (stryCov_9fa48("2909"), 'CulturePass artist'))),
          imageUrl: getProfileImage(artist),
          accentColor: stryMutAct_9fa48("2912") ? artist.color && FEATURED_ARTIST[index % FEATURED_ARTIST.length].accentColor : stryMutAct_9fa48("2911") ? false : stryMutAct_9fa48("2910") ? true : (stryCov_9fa48("2910", "2911", "2912"), artist.color || FEATURED_ARTIST[stryMutAct_9fa48("2913") ? index * FEATURED_ARTIST.length : (stryCov_9fa48("2913"), index % FEATURED_ARTIST.length)].accentColor),
          ctaLabel: stryMutAct_9fa48("2914") ? "" : (stryCov_9fa48("2914"), 'View artist'),
          route: stryMutAct_9fa48("2915") ? {} : (stryCov_9fa48("2915"), {
            type: stryMutAct_9fa48("2916") ? "" : (stryCov_9fa48("2916"), 'artist'),
            id: artist.id
          })
        }))));
      }
    }
    return FEATURED_ARTIST.map(stryMutAct_9fa48("2917") ? () => undefined : (stryCov_9fa48("2917"), artist => stryMutAct_9fa48("2918") ? {} : (stryCov_9fa48("2918"), {
      id: artist.id,
      name: artist.name,
      subtitle: artist.subtitle,
      meta: artist.meta,
      imageUrl: artist.imageUrl,
      accentColor: artist.accentColor,
      ctaLabel: stryMutAct_9fa48("2919") ? "" : (stryCov_9fa48("2919"), 'Explore more'),
      route: stryMutAct_9fa48("2920") ? {} : (stryCov_9fa48("2920"), {
        type: stryMutAct_9fa48("2921") ? "" : (stryCov_9fa48("2921"), 'explore'),
        focus: artist.focus
      })
    })));
  }
}
export function buildHeritagePlaylist(cultureIds: string[] = stryMutAct_9fa48("2922") ? ["Stryker was here"] : (stryCov_9fa48("2922"), [])): HeritagePlaylistItem[] {
  if (stryMutAct_9fa48("2923")) {
    {}
  } else {
    stryCov_9fa48("2923");
    if (stryMutAct_9fa48("2926") ? cultureIds.length !== 0 : stryMutAct_9fa48("2925") ? false : stryMutAct_9fa48("2924") ? true : (stryCov_9fa48("2924", "2925", "2926"), cultureIds.length === 0)) {
      if (stryMutAct_9fa48("2927")) {
        {}
      } else {
        stryCov_9fa48("2927");
        return HERITAGE_PLAYLIST;
      }
    }
    const lowered = cultureIds.map(stryMutAct_9fa48("2928") ? () => undefined : (stryCov_9fa48("2928"), cultureId => stryMutAct_9fa48("2929") ? cultureId.toUpperCase() : (stryCov_9fa48("2929"), cultureId.toLowerCase())));
    return stryMutAct_9fa48("2930") ? [...HERITAGE_PLAYLIST] : (stryCov_9fa48("2930"), (stryMutAct_9fa48("2931") ? [] : (stryCov_9fa48("2931"), [...HERITAGE_PLAYLIST])).sort((left, right) => {
      if (stryMutAct_9fa48("2932")) {
        {}
      } else {
        stryCov_9fa48("2932");
        const leftMatch = (stryMutAct_9fa48("2934") ? left.matchKeys.some(key => lowered.includes(key.toLowerCase())) : stryMutAct_9fa48("2933") ? left.matchKeys?.every(key => lowered.includes(key.toLowerCase())) : (stryCov_9fa48("2933", "2934"), left.matchKeys?.some(stryMutAct_9fa48("2935") ? () => undefined : (stryCov_9fa48("2935"), key => lowered.includes(stryMutAct_9fa48("2936") ? key.toUpperCase() : (stryCov_9fa48("2936"), key.toLowerCase())))))) ? 1 : 0;
        const rightMatch = (stryMutAct_9fa48("2938") ? right.matchKeys.some(key => lowered.includes(key.toLowerCase())) : stryMutAct_9fa48("2937") ? right.matchKeys?.every(key => lowered.includes(key.toLowerCase())) : (stryCov_9fa48("2937", "2938"), right.matchKeys?.some(stryMutAct_9fa48("2939") ? () => undefined : (stryCov_9fa48("2939"), key => lowered.includes(stryMutAct_9fa48("2940") ? key.toUpperCase() : (stryCov_9fa48("2940"), key.toLowerCase())))))) ? 1 : 0;
        return stryMutAct_9fa48("2941") ? rightMatch + leftMatch : (stryCov_9fa48("2941"), rightMatch - leftMatch);
      }
    }));
  }
}
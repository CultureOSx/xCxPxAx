import { CultureTokens } from '@/constants/theme';
import type React from 'react';
import type { Ionicons } from '@expo/vector-icons';

export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

export function initials(name: string): string {
  return (name || 'U').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function memberDate(d?: string | Date | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export const TIER_CFG: Record<string, { color: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  free:    { color: '#94A3B8',           label: 'Standard', icon: 'shield-outline' },
  plus:    { color: CultureTokens.teal,  label: 'Plus',     icon: 'star'           },
  pro:     { color: '#7C3AED',           label: 'Pro',      icon: 'flash'          },
  premium: { color: CultureTokens.coral, label: 'Premium',  icon: 'diamond'        },
  vip:     { color: CultureTokens.gold,  label: 'VIP',      icon: 'trophy'         },
};

export const NAT_COORDS: Record<string, { lat: number; lng: number }> = {
  indian:      { lat: 20.5937,  lng: 78.9629   },
  chinese:     { lat: 35.8617,  lng: 104.1954  },
  korean:      { lat: 35.9078,  lng: 127.7669  },
  japanese:    { lat: 36.2048,  lng: 138.2529  },
  vietnamese:  { lat: 14.0583,  lng: 108.2772  },
  filipino:    { lat: 12.8797,  lng: 121.7740  },
  greek:       { lat: 39.0742,  lng: 21.8243   },
  italian:     { lat: 41.8719,  lng: 12.5674   },
  lebanese:    { lat: 33.8547,  lng: 35.8623   },
  egyptian:    { lat: 26.8206,  lng: 30.8025   },
  nigerian:    { lat: 9.0820,   lng: 8.6753    },
  mexican:     { lat: 23.6345,  lng: -102.5528 },
  brazilian:   { lat: -14.2350, lng: -51.9253  },
  kiwi:        { lat: -40.9006, lng: 174.8860  },
  aboriginal:  { lat: -25.2744, lng: 133.7751  },
  maori:       { lat: -40.9006, lng: 174.8860  },
  indonesian:  { lat: -0.7893,  lng: 113.9213  },
  thai:        { lat: 15.8700,  lng: 100.9925  },
  malay:       { lat: 4.2105,   lng: 101.9758  },
  spanish:     { lat: 40.4637,  lng: -3.7492   },
  somali:      { lat: 5.1521,   lng: 46.1996   },
  ethiopian:   { lat: 9.1450,   lng: 40.4897   },
  colombian:   { lat: 4.5709,   lng: -74.2973  },
  ghanaian:    { lat: 7.9465,   lng: -1.0232   },
};

export const SOCIAL_DEFS = [
  { key: 'instagram', icon: 'logo-instagram' as const, label: 'Instagram', color: '#E1306C' },
  { key: 'twitter',   icon: 'logo-twitter'   as const, label: 'Twitter',   color: '#1DA1F2' },
  { key: 'linkedin',  icon: 'logo-linkedin'  as const, label: 'LinkedIn',  color: '#0A66C2' },
  { key: 'facebook',  icon: 'logo-facebook'  as const, label: 'Facebook',  color: '#1877F2' },
];

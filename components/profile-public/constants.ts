import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, OlympicsColors } from '@/constants/theme';

export const CP = {
  teal:       CultureTokens.teal,
  tealDark:   '#00A882',
  purple:     CultureTokens.violet,
  purpleDark: '#5B21B6',
  ember:      OlympicsColors.red,
  gold:       OlympicsColors.yellow,
  dark:       '#18181B',
  darkMid:    '#F4F4F5',
  darkRaised: '#FFFFFF',
  muted:      '#71717A',
  border:     '#E4E4E7',
  bg:         '#FAFAFA',
  surface:    '#FFFFFF',
  text:       '#18181B',
  success:    OlympicsColors.green,
  info:       OlympicsColors.blue,
} as const;

export const ACCENT_COLORS = [CP.teal, CP.purple, CP.ember, CP.gold, CP.info] as const;

export const SOCIAL_ICONS = [
  { key: 'instagram', icon: 'logo-instagram' as const, label: 'Instagram', color: CP.ember     },
  { key: 'twitter',   icon: 'logo-twitter'   as const, label: 'Twitter',   color: CP.info      },
  { key: 'linkedin',  icon: 'logo-linkedin'  as const, label: 'LinkedIn',  color: CP.purple    },
  { key: 'facebook',  icon: 'logo-facebook'  as const, label: 'Facebook',  color: CP.info      },
] as const;

export const TIER_CONFIG: Record<string, {
  color: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  free:    { color: CP.muted,      label: 'Standard', icon: 'shield-outline' },
  plus:    { color: CP.teal,       label: 'Plus',     icon: 'star'           },
  pro:     { color: CP.purple,     label: 'Pro',      icon: 'star'           },
  premium: { color: CP.ember,      label: 'Premium',  icon: 'diamond'        },
  vip:     { color: CP.gold,       label: 'VIP',      icon: 'diamond'        },
};

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return n.toString();
}

export function formatMemberDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

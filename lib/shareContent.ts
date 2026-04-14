import { Platform, Share } from 'react-native';

export type ShareLinkOptions = {
  title?: string;
  /** Primary text (without URL is fine if `url` is set). */
  message: string;
  /** Optional link; merged into the payload so Messages / WhatsApp / Mail receive a tappable link on iOS. */
  url?: string;
};

export type SocialShareNetwork = 'instagram' | 'whatsapp' | 'facebook' | 'x' | 'email';

export type SocialShareUrls = Record<SocialShareNetwork, string>;

/**
 * System share sheet tuned for iOS: many apps only consume a single well-formed `message`
 * string; passing `url` alone often yields empty content in Messages/WhatsApp.
 */
export async function shareLinkContent(opts: ShareLinkOptions): Promise<void> {
  const url = (opts.url ?? '').trim();
  const msg = opts.message.trim();
  const combined =
    url && !msg.includes(url) ? (msg ? `${msg}\n\n${url}` : url).trim() : msg || url;

  if (!combined) return;

  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({
        title: opts.title,
        text: combined,
        ...(url ? { url } : {}),
      });
      return;
    }
    if (url && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  if (Platform.OS === 'ios') {
    await Share.share({
      title: opts.title,
      message: combined,
    });
    return;
  }

  await Share.share({
    title: opts.title ?? 'CulturePass',
    message: combined,
    ...(url ? { url } : {}),
  });
}

function composeShareText(opts: ShareLinkOptions): string {
  const url = (opts.url ?? '').trim();
  const msg = opts.message.trim();
  return url && !msg.includes(url) ? (msg ? `${msg}\n\n${url}` : url).trim() : msg || url;
}

/**
 * Builds web URLs for social share targets.
 *
 * Note: Instagram does not currently support prefilled web-based link sharing,
 * so we direct to story creation as the closest supported web entry point.
 */
export function buildSocialShareUrls(opts: ShareLinkOptions): SocialShareUrls {
  const title = (opts.title ?? '').trim();
  const url = (opts.url ?? '').trim();
  const text = composeShareText(opts);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(title || 'CulturePass');
  const emailBody = encodeURIComponent(text || url);

  return {
    instagram: 'https://www.instagram.com/create/story/',
    whatsapp: `https://wa.me/?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://x.com/intent/tweet?text=${encodedText}${url ? `&url=${encodedUrl}` : ''}`,
    email: `mailto:?subject=${encodedTitle}&body=${emailBody}`,
  };
}

export function getSocialShareUrl(network: SocialShareNetwork, opts: ShareLinkOptions): string {
  return buildSocialShareUrls(opts)[network];
}

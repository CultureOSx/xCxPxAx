// @ts-nocheck
import { Platform, Share } from 'react-native';

export type ShareLinkOptions = {
  title?: string;
  /** Primary text (without URL is fine if `url` is set). */
  message: string;
  /** Optional link; merged into the payload so Messages / WhatsApp / Mail receive a tappable link on iOS. */
  url?: string;
};

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

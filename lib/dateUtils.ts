function toDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatEventDateTime(date: string, time?: string): string {
  const day = toDate(date);
  if (!day) return date;

  const dateLabel = day.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  if (!time) return dateLabel;
  return `${dateLabel} • ${time}`;
}

export function formatEventDateTimeBadge(date: string, time?: string): string {
  const day = toDate(date);
  if (!day) return time ? `${date} • ${time}` : date;

  const dateLabel = day.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });

  return time ? `${dateLabel} • ${time}` : dateLabel;
}

export function timeAgo(date: string | Date | null | undefined): string {
  const from = toDate(date);
  if (!from) return 'just now';

  const seconds = Math.max(1, Math.floor((Date.now() - from.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

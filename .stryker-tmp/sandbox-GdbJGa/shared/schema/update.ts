// @ts-nocheck
export type UpdateCategory = 'release' | 'announcement' | 'feature' | 'fix';
export type UpdateStatus = 'draft' | 'published';

/**
 * CulturePass microblog post — used for release notes, announcements, and feature highlights.
 * Admin-created, publicly readable.
 */
export interface AppUpdate {
  id: string;
  title: string;
  /** URL-safe slug, e.g. "v1-1-0-event-creation-wizard" */
  slug: string;
  /** Full post body (plain text or light markdown) */
  body: string;
  /** App version this post relates to, e.g. "1.1.0" */
  version?: string;
  category: UpdateCategory;
  authorId: string;
  authorName?: string;
  status: UpdateStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

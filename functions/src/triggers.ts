import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as Sentry from '@sentry/node';
import { db } from './admin';
import { algoliaEventsIndex } from './services/algolia';
import type { FirestoreEvent } from './services/firestore';

/**
 * Trigger: onEventWritten
 * Maintains the 'feed' collection by automatically creating, updating, or 
 * soft-deleting FeedItem documents whenever an event is modified.
 * Also syncs published events directly to Algolia for fast geo-discovery.
 */
export const onEventWritten = onDocumentWritten('events/{eventId}', async (event) => {
  const change = event.data;
  if (!change) return;

  const after = change.after.data();
  const eventId = event.params.eventId;

  try {
    // ── Deletion or Soft-Delete ─────────────────────────────────────────────
    if (!after || after.status === 'deleted') {
      const existingFeed = await db.collection('feed').where('referenceId', '==', eventId).get();
      const batch = db.batch();
      existingFeed.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      await algoliaEventsIndex.deleteEvent(eventId);
      return;
    }

    // Only sync published events
    if (after.status !== 'published') {
      if (change.before.exists && change.before.data()?.status === 'published') {
        await algoliaEventsIndex.deleteEvent(eventId);
      }
      return;
    }

    // ── 1. Sync to Global Feed ────────────────────────────────────────────
    const feedItemRef = db.collection('feed').doc(`evt_${eventId}`);

    const itemData: Record<string, unknown> = {
      type: 'event_created',
      communityId: after.communityId || 'General',
      city: after.city || 'General',
      referenceId: eventId,
      updatedAt: new Date().toISOString(),
      payload: {
        title: after.title,
        description: after.description,
        imageUrl: after.imageUrl,
        date: after.date,
        venue: after.venue || after.city,
      },
    };

    if (!change.before.exists) {
      itemData.createdAt = new Date().toISOString();
    } else {
      const existingDoc = await feedItemRef.get();
      itemData.createdAt = existingDoc.exists
        ? existingDoc.data()?.createdAt
        : new Date().toISOString();
    }

    await feedItemRef.set(itemData, { merge: true });

    // ── 2. Sync to Algolia ────────────────────────────────────────────────
    const eventForAlgolia = after as FirestoreEvent;
    await algoliaEventsIndex.indexEvent({ ...eventForAlgolia, id: eventId });

  } catch (err) {
    console.error('[onEventWritten] trigger error:', err);
    Sentry.captureException(err, { extra: { eventId } });
  }
});

import { db } from '../admin';

type EmailMessagePayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  metadata?: Record<string, string>;
};

function normalizeRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to];
  return Array.from(
    new Set(
      list
        .map((entry) => String(entry).trim().toLowerCase())
        .filter((entry) => entry.length > 3 && entry.includes('@')),
    ),
  );
}

/**
 * Queues a transactional email in Firestore for Firebase Trigger Email extension.
 * Extension default collection: "mail". Override with EMAIL_QUEUE_COLLECTION.
 */
export async function enqueueTransactionalEmail(payload: EmailMessagePayload): Promise<boolean> {
  const recipients = normalizeRecipients(payload.to);
  if (recipients.length === 0) return false;

  const collection = String(process.env.EMAIL_QUEUE_COLLECTION ?? 'mail').trim() || 'mail';

  await db.collection(collection).add({
    to: recipients.length === 1 ? recipients[0] : recipients,
    message: {
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    },
    metadata: payload.metadata ?? {},
    createdAt: new Date().toISOString(),
  });

  return true;
}

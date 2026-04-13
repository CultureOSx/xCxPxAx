// @ts-nocheck
// Firestore integration for event ingestion
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
dotenv.config();

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

export async function upsertEvent(event) {
  const ref = db.collection('events').doc(event.source.url.replace(/[^a-zA-Z0-9]/g, ''));
  await ref.set(event, { merge: true });
  return ref.id;
}

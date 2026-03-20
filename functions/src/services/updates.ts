import { db } from '../admin';
import type { UpdateCategory, UpdateStatus } from '../../../shared/schema/update';

export interface FirestoreUpdate {
  id: string;
  title: string;
  slug: string;
  body: string;
  version?: string;
  category: UpdateCategory;
  authorId: string;
  authorName?: string;
  status: UpdateStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const updatesCol = () => db.collection('updates');

export const updatesService = {
  async getById(id: string): Promise<FirestoreUpdate | null> {
    const snap = await updatesCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestoreUpdate;
  },

  async getBySlug(slug: string): Promise<FirestoreUpdate | null> {
    const snap = await updatesCol().where('slug', '==', slug).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as FirestoreUpdate;
  },

  async list(filters: {
    status?: UpdateStatus;
    category?: UpdateCategory;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ items: FirestoreUpdate[]; total: number }> {
    let query = updatesCol() as FirebaseFirestore.Query;

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }

    const snap = await query.get();
    let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreUpdate));

    // Sort by publishedAt desc (most recent first)
    items.sort((a, b) => {
      const dateA = a.publishedAt ?? a.createdAt;
      const dateB = b.publishedAt ?? b.createdAt;
      return dateB.localeCompare(dateA);
    });

    const total = items.length;
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 20;
    items = items.slice(offset, offset + limit);

    return { items, total };
  },

  async create(data: Omit<FirestoreUpdate, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreUpdate> {
    const now = new Date().toISOString();
    const ref = updatesCol().doc();
    const update: FirestoreUpdate = { ...data, id: ref.id, createdAt: now, updatedAt: now };
    await ref.set(update);
    return update;
  },

  async update(id: string, data: Partial<FirestoreUpdate>): Promise<FirestoreUpdate | null> {
    const ref = updatesCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const now = new Date().toISOString();
    await ref.update({ ...data, updatedAt: now });
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirestoreUpdate;
  },

  async delete(id: string): Promise<void> {
    await updatesCol().doc(id).delete();
  },

  async publish(id: string): Promise<FirestoreUpdate | null> {
    return this.update(id, { status: 'published', publishedAt: new Date().toISOString() });
  },
};

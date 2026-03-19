import { db } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface FirestorePerk {
  id: string;
  title: string;
  description: string;
  perkType: string;
  discountPercent: number | null;
  discountFixedCents: number | null;
  providerType: string;
  providerId: string;
  providerName: string;
  category: string;
  isMembershipRequired: boolean;
  requiredMembershipTier: string;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  status: 'active' | 'inactive' | 'expired';
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export interface FirestoreRedemption {
  id: string;
  perkId: string;
  userId: string;
  redeemedAt: string;
}

const perksCol = () => db.collection('perks');
const redemptionsCol = () => db.collection('redemptions');

export const perksService = {
  async list(filters: { status?: FirestorePerk['status']; category?: string } = {}): Promise<FirestorePerk[]> {
    let query: FirebaseFirestore.Query = perksCol();
    if (filters.status) query = query.where('status', '==', filters.status);
    else query = query.where('status', '==', 'active');
    
    if (filters.category) query = query.where('category', '==', filters.category);
    
    const snap = await query.get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestorePerk[];
  },

  async getById(id: string): Promise<FirestorePerk | null> {
    const snap = await perksCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestorePerk;
  },

  async create(data: Omit<FirestorePerk, 'id' | 'createdAt' | 'usedCount'>): Promise<FirestorePerk> {
    const now = new Date().toISOString();
    const ref = perksCol().doc();
    const perk: FirestorePerk = { ...data, id: ref.id, createdAt: now, usedCount: 0 };
    await ref.set(perk);
    return perk;
  },

  async incrementUsed(id: string): Promise<void> {
    await perksCol().doc(id).update({ usedCount: FieldValue.increment(1) });
  },
};

export const redemptionsService = {
  async listForUser(userId: string): Promise<FirestoreRedemption[]> {
    const snap = await redemptionsCol()
      .where('userId', '==', userId)
      .orderBy('redeemedAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreRedemption[];
  },

  async countForUserAndPerk(userId: string, perkId: string): Promise<number> {
    const snap = await redemptionsCol()
      .where('userId', '==', userId)
      .where('perkId', '==', perkId)
      .count()
      .get();
    return snap.data().count;
  },

  async create(data: Omit<FirestoreRedemption, 'id' | 'redeemedAt'>): Promise<FirestoreRedemption> {
    const now = new Date().toISOString();
    const ref = redemptionsCol().doc();
    const redemption: FirestoreRedemption = { ...data, id: ref.id, redeemedAt: now };
    await ref.set(redemption);
    return redemption;
  },
};

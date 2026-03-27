import { db } from '../admin';

export interface FirestoreProfile {
  id: string;
  name: string;
  entityType: 'community' | 'business' | 'venue' | 'artist' | 'organisation' | 'council' | 'government' | 'charity';
  description?: string;
  imageUrl?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  postcode?: number;
  latitude?: number;
  longitude?: number;
  country?: string;
  category?: string;
  tags?: string[];
  // Cultural identity (typed IDs; shared schema)
  nationalityId?: string;
  cultureIds?: string[];
  languageIds?: string[];
  diasporaGroupIds?: string[];
  isVerified?: boolean;
  memberCount?: number;
  followerCount?: number;
  ownerId?: string;
  socialLinks?: Record<string, string>;
  contactEmail?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  telegram?: string;
  joinMode?: 'open' | 'request' | 'invite';
  status?: 'draft' | 'published' | 'suspended';
  handle?: string;
  handleStatus?: 'pending' | 'approved' | 'rejected';
  viewCount?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const profilesCol = () => db.collection('profiles');

export const profilesService = {
  async getById(id: string): Promise<FirestoreProfile | null> {
    const snap = await profilesCol().doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as FirestoreProfile;
  },

  async list(filters: { city?: string; country?: string; entityType?: string } = {}): Promise<FirestoreProfile[]> {
    let query: FirebaseFirestore.Query = profilesCol();
    if (filters.entityType) query = query.where('entityType', '==', filters.entityType);
    if (filters.city) query = query.where('city', '==', filters.city);
    if (filters.country) query = query.where('country', '==', filters.country);
    
    const snap = await query.limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as FirestoreProfile[];
  },

  async create(data: Omit<FirestoreProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreProfile> {
    const now = new Date().toISOString();
    const ref = profilesCol().doc();
    const profile: FirestoreProfile = { ...data, id: ref.id, createdAt: now, updatedAt: now };
    await ref.set(profile);
    return profile;
  },

  async update(id: string, data: Partial<FirestoreProfile>): Promise<FirestoreProfile | null> {
    const ref = profilesCol().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    
    const updates = { ...data, updatedAt: new Date().toISOString() };
    await ref.update(updates);
    
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as FirestoreProfile;
  },

  async delete(id: string): Promise<void> {
    await profilesCol().doc(id).delete();
  },
};

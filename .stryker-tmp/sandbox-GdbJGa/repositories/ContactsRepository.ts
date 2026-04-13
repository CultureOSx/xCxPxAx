// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedContact {
  cpid: string;
  name: string;
  username?: string;
  tier?: string;
  org?: string;
  avatarUrl?: string;
  city?: string;
  country?: string;
  bio?: string;
  email?: string;
  phone?: string;
  savedAt: string;
  userId?: string;
  fromPhone?: boolean;
  interests?: string[];
  communities?: string[];
}

const INDEX_KEY = '@culturepass_contacts_index';
const CHUNK_PREFIX = '@culturepass_contacts_chunk_';
const CHUNK_SIZE = 50; 
const INVITED_CONTACTS_KEY = '@culturepass_invited_contacts';

export class ContactsRepository {
  async getAllContacts(): Promise<SavedContact[]> {
    try {
      const indexStr = await AsyncStorage.getItem(INDEX_KEY);
      if (!indexStr) {
        // Fallback for legacy exact key before chunking
        const legacy = await AsyncStorage.getItem('@culturepass_saved_contacts');
        if (legacy) {
          const parsed = JSON.parse(legacy) as SavedContact[];
          await this.saveAllContacts(parsed); // auto-migrate to chunked
          return parsed;
        }
        return [];
      }

      const numChunks = parseInt(indexStr, 10);
      if (isNaN(numChunks) || numChunks === 0) return [];

      const keysToFetch = Array.from({ length: numChunks }, (_, i) => `${CHUNK_PREFIX}${i}`);
      const chunks = await Promise.all(keysToFetch.map(k => AsyncStorage.getItem(k)));

      let allContacts: SavedContact[] = [];
      for (const value of chunks) {
        if (value) {
          try {
            allContacts = allContacts.concat(JSON.parse(value));
          } catch {}
        }
      }
      return allContacts;
    } catch {
      return [];
    }
  }

  async saveAllContacts(contacts: SavedContact[]): Promise<void> {
    try {
      const chunks: SavedContact[][] = [];
      for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
        chunks.push(contacts.slice(i, i + CHUNK_SIZE));
      }

      const pairs: [string, string][] = chunks.map((chunk, i) => [
        `${CHUNK_PREFIX}${i}`,
        JSON.stringify(chunk),
      ]);
      
      // Cleanup old chunks if the list shrank
      const oldIndexStr = await AsyncStorage.getItem(INDEX_KEY);
      const oldNumChunks = oldIndexStr ? parseInt(oldIndexStr, 10) : 0;
      const keysToRemove: string[] = [];
      if (oldNumChunks > chunks.length) {
        for (let i = chunks.length; i < oldNumChunks; i++) {
          keysToRemove.push(`${CHUNK_PREFIX}${i}`);
        }
      }

      // Add index key update to pairs
      pairs.push([INDEX_KEY, chunks.length.toString()]);

      // Execute storage ops
      if (keysToRemove.length > 0) {
        await Promise.all(keysToRemove.map(k => AsyncStorage.removeItem(k)));
      }
      await Promise.all(pairs.map(([k, v]) => AsyncStorage.setItem(k, v)));
      
      // Delete legacy key just in case
      await AsyncStorage.removeItem('@culturepass_saved_contacts');
    } catch (e) {
      console.error('Failed to save chunked contacts:', e);
    }
  }

  async clearAllContacts(): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem(INDEX_KEY);
      const numChunks = indexStr ? parseInt(indexStr, 10) : 0;
      const keysToRemove = Array.from({ length: numChunks }, (_, i) => `${CHUNK_PREFIX}${i}`);
      keysToRemove.push(INDEX_KEY);
      keysToRemove.push('@culturepass_saved_contacts');
      await Promise.all(keysToRemove.map(k => AsyncStorage.removeItem(k)));
    } catch {}
  }

  // Invited Contacts (Simple single set, typically small enough to not exceed 2MB)
  async getInvitedIds(): Promise<Set<string>> {
    try {
      const stored = await AsyncStorage.getItem(INVITED_CONTACTS_KEY);
      if (stored) return new Set(JSON.parse(stored));
      return new Set();
    } catch {
      return new Set();
    }
  }

  async addInvitedId(id: string): Promise<Set<string>> {
    try {
      const set = await this.getInvitedIds();
      set.add(id);
      await AsyncStorage.setItem(INVITED_CONTACTS_KEY, JSON.stringify(Array.from(set)));
      return set;
    } catch {
      return new Set([id]);
    }
  }
}

export const contactsRepository = new ContactsRepository();

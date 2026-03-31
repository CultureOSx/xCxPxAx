import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
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
  /** true if imported from phone contacts */
  fromPhone?: boolean;
  interests?: string[];
  communities?: string[];
}

export interface PhoneContact {
  /** expo-contacts id */
  id: string;
  name: string;
  phoneNumbers?: string[];
  emails?: string[];
  /** matched CulturePass user — populated after server lookup */
  matched?: {
    cpid: string;
    userId: string;
    username?: string;
    avatarUrl?: string;
    tier?: string;
    city?: string;
  } | null;
  invited?: boolean;
}

interface ContactsContextValue {
  contacts: SavedContact[];
  addContact: (contact: Omit<SavedContact, 'savedAt'>) => void;
  removeContact: (cpid: string) => void;
  isContactSaved: (cpid: string) => boolean;
  getContact: (cpid: string) => SavedContact | undefined;
  updateContact: (cpid: string, updates: Partial<SavedContact>) => void;
  clearContacts: () => void;
  /** Phone-synced contacts (raw from device) */
  phoneContacts: PhoneContact[];
  setPhoneContacts: (contacts: PhoneContact[]) => void;
  markInvited: (phoneContactId: string) => void;
  /** cpids of users already imported from phone */
  importedFromPhone: Set<string>;
}

const CONTACTS_KEY = '@culturepass_saved_contacts';
const PHONE_CONTACTS_KEY = '@culturepass_phone_contacts';

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [phoneContacts, setPhoneContactsState] = useState<PhoneContact[]>([]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(CONTACTS_KEY),
      AsyncStorage.getItem(PHONE_CONTACTS_KEY),
    ]).then(([stored, storedPhone]) => {
      if (stored) {
        try { setContacts(JSON.parse(stored)); } catch {}
      }
      if (storedPhone) {
        try { setPhoneContactsState(JSON.parse(storedPhone)); } catch {}
      }
    });
  }, []);

  const persist = useCallback((updated: SavedContact[]) => {
    AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
  }, []);

  const addContact = useCallback((contact: Omit<SavedContact, 'savedAt'>) => {
    setContacts(prev => {
      const exists = prev.find(c => c.cpid === contact.cpid);
      if (exists) {
        const updated = prev.map(c =>
          c.cpid === contact.cpid ? { ...c, ...contact, savedAt: c.savedAt } : c
        );
        persist(updated);
        return updated;
      }
      const newContact: SavedContact = { ...contact, savedAt: new Date().toISOString() };
      const updated = [newContact, ...prev];
      persist(updated);
      return updated;
    });
  }, [persist]);

  const removeContact = useCallback((cpid: string) => {
    setContacts(prev => {
      const updated = prev.filter(c => c.cpid !== cpid);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const isContactSaved = useCallback((cpid: string) => contacts.some(c => c.cpid === cpid), [contacts]);

  const getContact = useCallback((cpid: string) => contacts.find(c => c.cpid === cpid), [contacts]);

  const updateContact = useCallback((cpid: string, updates: Partial<SavedContact>) => {
    setContacts(prev => {
      const updated = prev.map(c => c.cpid === cpid ? { ...c, ...updates } : c);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clearContacts = useCallback(() => {
    setContacts([]);
    AsyncStorage.removeItem(CONTACTS_KEY);
  }, []);

  const setPhoneContacts = useCallback((updated: PhoneContact[]) => {
    setPhoneContactsState(updated);
    AsyncStorage.setItem(PHONE_CONTACTS_KEY, JSON.stringify(updated));
  }, []);

  const markInvited = useCallback((phoneContactId: string) => {
    setPhoneContactsState(prev => {
      const updated = prev.map(c =>
        c.id === phoneContactId ? { ...c, invited: true } : c
      );
      AsyncStorage.setItem(PHONE_CONTACTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const importedFromPhone = useMemo<Set<string>>(
    () => new Set(contacts.filter(c => c.fromPhone).map(c => c.cpid)),
    [contacts]
  );

  const value = useMemo(() => ({
    contacts,
    addContact,
    removeContact,
    isContactSaved,
    getContact,
    updateContact,
    clearContacts,
    phoneContacts,
    setPhoneContacts,
    markInvited,
    importedFromPhone,
  }), [
    contacts, addContact, removeContact, isContactSaved, getContact,
    updateContact, clearContacts, phoneContacts, setPhoneContacts,
    markInvited, importedFromPhone,
  ]);

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (!context) throw new Error('useContacts must be used within ContactsProvider');
  return context;
}

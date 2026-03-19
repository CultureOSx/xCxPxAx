import type { EventData } from './event';

export interface CouncilData {
  id: string;
  name: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';
  lgaCode: string;
  websiteUrl?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  suburb: string;
  postcode: number;
  country: string;
  description?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  openingHours?: string;
  logoUrl?: string;
  bannerUrl?: string;
  socialLinks?: Partial<Record<'facebook' | 'instagram' | 'linkedin' | 'youtube', string>>;
  emergencyNumbers?: { label: string; phone: string }[];
  following?: boolean;
  isPrimary?: boolean;
}

export interface CouncilWasteSchedule {
  id: string;
  institutionId: string;
  postcode: number;
  suburb: string;
  generalWasteDay: string;
  recyclingDay: string;
  greenWasteDay?: string;
  frequencyGeneral: string;
  frequencyRecycling: string;
  frequencyGreen?: string;
  notes?: string;
}

export interface CouncilAlert {
  id: string;
  institutionId: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startAt: string;
  endAt?: string;
  status: 'active' | 'expired' | 'archived';
}

export interface CouncilFacility {
  id: string;
  institutionId?: string;
  name?: string;
  category?: string;
  city?: string;
  country?: string;
  isCouncilOwned?: boolean;
  facilityType?: string;
}

export interface CouncilGrant {
  id: string;
  institutionId: string;
  title: string;
  description: string;
  category: string;
  fundingMin?: number;
  fundingMax?: number;
  opensAt?: string;
  closesAt?: string;
  applicationUrl?: string;
  status: 'upcoming' | 'open' | 'closed';
}

export interface CouncilLink {
  id: string;
  institutionId: string;
  title: string;
  url: string;
  type: string;
}

export interface CouncilPreference {
  category: string;
  enabled: boolean;
}

export interface CouncilWasteReminder {
  userId: string;
  institutionId: string;
  postcode?: number;
  suburb?: string;
  reminderTime: string;
  enabled: boolean;
  updatedAt: string;
}

export interface CouncilDashboard {
  council: CouncilData;
  waste: CouncilWasteSchedule | null;
  alerts: CouncilAlert[];
  events: EventData[];
  facilities: CouncilFacility[];
  grants: CouncilGrant[];
  links: CouncilLink[];
  preferences: CouncilPreference[];
  reminder: CouncilWasteReminder | null;
  following: boolean;
}

export interface CouncilListResponse {
  councils: CouncilData[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  source?: 'firestore' | 'mock';
}

export interface CouncilClaim {
  id: string;
  councilId: string;
  userId: string;
  workEmail: string;
  roleTitle: string;
  note?: string;
  websiteDomain: string;
  emailDomain: string;
  domainMatch: boolean;
  status: 'pending_admin_review' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouncilClaimLetter {
  id: string;
  councilId: string;
  recipientEmail: string;
  claimUrl: string;
  subject: string;
  body: string;
  sentBy: string;
  sentAt: string;
}

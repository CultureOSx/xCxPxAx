// @ts-nocheck
export type TransactionType = 'charge' | 'refund' | 'debit' | 'cashback' | 'topup' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountCents: number;
  currency?: string;
  description: string;
  referenceId?: string;
  referenceType?: 'ticket' | 'perk' | 'membership' | 'topup';
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'topup' | 'payment' | 'refund' | 'cashback';
  amount: number;
  amountCents: number;
  currency: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  category: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface RewardsSummary {
  userId: string;
  points: number;
  pointsPerDollar: number;
  tier: 'silver' | 'gold' | 'diamond';
  tierLabel: string;
  nextTier: 'gold' | 'diamond' | null;
  nextTierLabel: string | null;
  pointsToNextTier: number;
  progressPercent: number;
  /** Count of perks redeemed (server-computed from redemptions collection). */
  perksRedeemed?: number;
}

export interface WalletSummary {
  id: string;
  userId: string;
  balance: number;
  balanceCents: number;
  currency: string;
  points: number;
  rewards?: RewardsSummary;
  transactions: WalletTransaction[];
}

export interface WalletPassLinkResponse {
  url: string;
  provider: 'apple' | 'google';
  userId?: string;
  ticketId?: string;
}

export interface GoogleWalletClassBootstrapResponse {
  success: boolean;
  classId: string;
  created: boolean;
}

export interface WalletBusinessCardReadinessResponse {
  success: boolean;
  ready: boolean;
  apple: {
    ready: boolean;
    missing: string[];
  };
  google: {
    ready: boolean;
    missing: string[];
  };
}

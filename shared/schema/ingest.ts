export type IngestScheduleInterval = 'hourly' | 'every6h' | 'every12h' | 'daily' | 'weekly';

export interface IngestSource {
  id: string;
  name: string;
  url: string;
  city: string;
  country: string;
  enabled: boolean;
  scheduleInterval: IngestScheduleInterval | null;
  lastRunAt: string | null;
  lastJobId: string | null;
  lastStatus: 'success' | 'error' | 'running' | null;
  errorCount: number;
  totalImported: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface IngestionJob {
  id: string;
  sourceId: string | null;
  sourceUrl: string;
  city: string;
  country: string;
  status: 'pending' | 'running' | 'success' | 'error';
  triggeredBy: 'admin' | 'scheduler';
  triggeredByUserId: string | null;
  startedAt: string;
  completedAt: string | null;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
  retryCount: number;
  parentJobId: string | null;
  createdAt: string;
}

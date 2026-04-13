// @ts-nocheck
export interface AdminAuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  endpoint: string;
  dryRun: boolean;
  targetedCount: number;
  filters: Record<string, unknown>;
  createdAt: string;
}

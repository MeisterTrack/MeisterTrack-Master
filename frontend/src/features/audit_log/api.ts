import { apiClient } from "../../lib/apiClient";

export interface AuditLogItem {
  id: number;
  actor_id: number;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: number;
  created_at: string;
}

export async function listAuditLogs(): Promise<AuditLogItem[]> {
  const { data } = await apiClient.get("/audit-logs");
  return data;
}

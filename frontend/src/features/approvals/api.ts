import { apiClient } from "../../lib/apiClient";

export interface QueueItem {
  id: number;
  student_id: number;
  student_name: string;
  domain: string;
  criterion_id: number;
  criterion_name: string;
  max_score: number;
  file_path: string | null;
  self_reported_text: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export async function getPendingQueue(): Promise<QueueItem[]> {
  const { data } = await apiClient.get("/approvals/queue");
  return data;
}

export async function decideSubmission(
  submissionId: number,
  approve: boolean,
  options?: { rejectReason?: string; awardedScore?: number },
) {
  const { data } = await apiClient.post(`/approvals/${submissionId}/decision`, {
    approve,
    reject_reason: options?.rejectReason,
    awarded_score: options?.awardedScore,
  });
  return data;
}

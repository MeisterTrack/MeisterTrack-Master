import { apiClient } from "../../lib/apiClient";
import { Submission } from "../submissions/api";

export async function getPendingQueue(): Promise<Submission[]> {
  const { data } = await apiClient.get("/approvals/queue");
  return data;
}

export async function decideSubmission(submissionId: number, approve: boolean, rejectReason?: string): Promise<Submission> {
  const { data } = await apiClient.post(`/approvals/${submissionId}/decision`, {
    approve,
    reject_reason: rejectReason,
  });
  return data;
}

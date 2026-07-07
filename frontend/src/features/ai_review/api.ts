import { apiClient } from "../../lib/apiClient";

export interface AiReviewResult {
  id: number;
  submission_id: number;
  suggested_criterion_id: number | null;
  confidence: number;
  flag: string | null;
}

export async function getAiReviewResult(submissionId: number): Promise<AiReviewResult | null> {
  try {
    const { data } = await apiClient.get(`/ai-review/submissions/${submissionId}`);
    return data;
  } catch {
    return null;
  }
}

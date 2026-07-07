import { apiClient } from "../../lib/apiClient";

export interface ScoringCriterion {
  id: number;
  domain: string;
  name: string;
  max_score: number;
  applicable_grade: number | null;
}

export async function listScoringCriteria(domain?: string): Promise<ScoringCriterion[]> {
  const { data } = await apiClient.get("/scoring/criteria", { params: domain ? { domain } : {} });
  return data;
}

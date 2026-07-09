import { apiClient } from "../../lib/apiClient";

export interface ScoringCriterion {
  id: number;
  domain: string;
  name: string;
  max_score: number;
  applicable_grade: number | null;
  owner_department: string | null;
}

export async function listScoringCriteria(domain?: string): Promise<ScoringCriterion[]> {
  const { data } = await apiClient.get("/scoring/criteria", { params: domain ? { domain } : {} });
  return data;
}

export async function createScoringCriterion(payload: {
  domain: string;
  name: string;
  max_score: number;
  applicable_grade?: number | null;
  owner_department?: string | null;
}): Promise<ScoringCriterion> {
  const { data } = await apiClient.post("/scoring/criteria", payload);
  return data;
}

export async function updateScoringCriterion(
  id: number,
  payload: Partial<{ name: string; max_score: number; applicable_grade: number | null; owner_department: string | null }>,
): Promise<ScoringCriterion> {
  const { data } = await apiClient.put(`/scoring/criteria/${id}`, payload);
  return data;
}

export async function deleteScoringCriterion(id: number): Promise<void> {
  await apiClient.delete(`/scoring/criteria/${id}`);
}

export interface GradeThreshold {
  id: number;
  domain: string;
  grade: "S" | "A" | "B";
  min_score: number;
}

export async function listGradeThresholds(domain?: string): Promise<GradeThreshold[]> {
  const { data } = await apiClient.get("/scoring/grade-thresholds", { params: domain ? { domain } : {} });
  return data;
}

export async function createGradeThreshold(payload: {
  domain: string;
  grade: "S" | "A" | "B";
  min_score: number;
}): Promise<GradeThreshold> {
  const { data } = await apiClient.post("/scoring/grade-thresholds", payload);
  return data;
}

export async function updateGradeThreshold(id: number, minScore: number): Promise<GradeThreshold> {
  const { data } = await apiClient.put(`/scoring/grade-thresholds/${id}`, { min_score: minScore });
  return data;
}

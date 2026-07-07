import { apiClient } from "../../lib/apiClient";

export interface DomainScore {
  domain: string;
  total_score: number;
  grade: "S" | "A" | "B" | null;
}

export interface StudentDashboard {
  student_id: number;
  domain_scores: DomainScore[];
}

export async function getMyDashboard(): Promise<StudentDashboard> {
  const { data } = await apiClient.get("/dashboard/student/me");
  return data;
}

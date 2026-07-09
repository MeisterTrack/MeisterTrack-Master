import { apiClient } from "../../lib/apiClient";

export interface DomainScore {
  domain: string;
  total_score: number;
  max_score: number;
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

export interface SubmissionDetailItem {
  id: number;
  criterion_name: string;
  status: "pending" | "approved" | "rejected";
  awarded_score: number | null;
  max_score: number;
  created_at: string;
}

export interface DomainDetail {
  domain: string;
  total_score: number;
  max_score: number;
  grade: "S" | "A" | "B" | null;
  submissions: SubmissionDetailItem[];
}

export interface AiRecommendationItem {
  domain: string;
  kind: "grade_gap" | "max_grade" | "slow_progress";
  message: string;
}

export interface StudentDetail {
  student_id: number;
  name: string;
  grade: number | null;
  class_no: number | null;
  student_no: string | null;
  overall_progress_pct: number;
  cumulative_score: number;
  cumulative_max: number;
  grade_a_or_above_count: number;
  domains: DomainDetail[];
  recommendations: AiRecommendationItem[];
}

export async function getStudentDetail(studentId: number): Promise<StudentDetail> {
  const { data } = await apiClient.get(`/dashboard/student/${studentId}`);
  return data;
}

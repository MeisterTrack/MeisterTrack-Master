import { apiClient } from "../../lib/apiClient";

export interface TeacherDomainSummary {
  domain: string;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  average_score: number;
  max_score: number;
  grade: "S" | "A" | "B" | null;
}

export interface TeacherOverview {
  role: string;
  pending_count: number;
  reviewed_today_count: number;
  assigned_domains: string[];
  homeroom_grade: number | null;
  homeroom_class_no: number | null;
  class_student_count: number | null;
  class_submitted_count: number | null;
  class_not_submitted_count: number | null;
  domain_summaries: TeacherDomainSummary[];
}

export async function getTeacherOverview(): Promise<TeacherOverview> {
  const { data } = await apiClient.get("/dashboard/teacher/overview");
  return data;
}

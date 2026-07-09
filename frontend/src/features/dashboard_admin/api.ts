import { apiClient } from "../../lib/apiClient";

export interface DomainAverage {
  domain: string;
  average_score: number;
  max_score: number;
  submission_count: number;
  grade: "S" | "A" | "B" | null;
}

export interface AdminOverview {
  total_students: number;
  submitted_students: number;
  not_submitted_count: number;
  total_submissions: number;
  pending_count: number;
  domain_averages: DomainAverage[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const { data } = await apiClient.get("/dashboard/admin/overview");
  return data;
}

export interface RecentSubmission {
  id: number;
  student_id: number;
  student_name: string;
  criterion_name: string;
  domain: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export async function getRecentSubmissions(): Promise<RecentSubmission[]> {
  const { data } = await apiClient.get("/dashboard/admin/recent-submissions");
  return data;
}

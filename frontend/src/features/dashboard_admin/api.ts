import { apiClient } from "../../lib/apiClient";

export interface DomainAverage {
  domain: string;
  average_score: number;
  submission_count: number;
}

export interface AdminOverview {
  total_students: number;
  submitted_students: number;
  not_submitted_count: number;
  domain_averages: DomainAverage[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const { data } = await apiClient.get("/dashboard/admin/overview");
  return data;
}

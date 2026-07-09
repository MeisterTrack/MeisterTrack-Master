import { apiClient } from "../../lib/apiClient";

export interface LoginResult {
  status: "ok" | "pending" | "needs_onboarding";
  access_token: string | null;
  token_type: string;
  email: string;
  name: string;
}

export async function mockGoogleLogin(email: string, name: string): Promise<LoginResult> {
  const { data } = await apiClient.post("/auth/google/mock-login", { email, name });
  return data;
}

export interface OnboardingPayload {
  email: string;
  name: string;
  role: "student" | "teacher";
  grade?: number;
  class_no?: number;
  student_no?: string;
  department?: string;
}

export async function submitOnboarding(payload: OnboardingPayload) {
  const { data } = await apiClient.post("/auth/onboarding", payload);
  return data;
}

export interface OnboardingRequestItem {
  id: number;
  email: string;
  name: string;
  role: string;
  approval_status: string;
}

export async function listOnboardingRequests(): Promise<OnboardingRequestItem[]> {
  const { data } = await apiClient.get("/auth/onboarding-requests");
  return data;
}

export async function decideOnboardingRequest(userId: number, approve: boolean) {
  const { data } = await apiClient.post(`/auth/onboarding-requests/${userId}/decision`, { approve });
  return data;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
  role: string;
  grade: number | null;
  class_no: number | null;
  student_no: string | null;
  department: string | null;
}

export async function getMe(): Promise<CurrentUser> {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

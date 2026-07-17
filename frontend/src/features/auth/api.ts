import { apiClient } from "../../lib/apiClient";

export interface LoginResult {
  status: "ok" | "pending" | "needs_onboarding";
  access_token: string | null;
  token_type: string;
  email: string;
  name: string;
}

export async function mockGoogleLogin(email: string, name: string, secret: string): Promise<LoginResult> {
  const { data } = await apiClient.post("/auth/google/mock-login", { email, name, secret });
  return data;
}

export interface AuthConfig {
  google_client_id: string;
  mock_enabled: boolean;
}

export async function getAuthConfig(): Promise<AuthConfig> {
  const { data } = await apiClient.get("/auth/config");
  return data;
}

export async function googleCallbackLogin(idToken: string): Promise<LoginResult> {
  const { data } = await apiClient.post("/auth/google/callback", { id_token: idToken });
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
  subject?: string;
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
  subject: string | null;
}

export async function getMe(): Promise<CurrentUser> {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

export interface TeacherAdminItem {
  id: number;
  email: string;
  name: string;
  role: string;
  department: string | null;
  subject: string | null;
  grade: number | null;
  class_no: number | null;
  approval_status: "pending" | "approved" | "rejected";
}

export async function listTeachers(): Promise<TeacherAdminItem[]> {
  const { data } = await apiClient.get("/auth/teachers");
  return data;
}

export async function listAllTeachers(): Promise<TeacherAdminItem[]> {
  const { data } = await apiClient.get("/auth/teachers", { params: { include_inactive: true } });
  return data;
}

export interface TeacherCreatePayload {
  email: string;
  name: string;
  department?: string;
  subject?: string;
  grade?: number;
  class_no?: number;
}

export async function createTeacher(payload: TeacherCreatePayload): Promise<TeacherAdminItem> {
  const { data } = await apiClient.post("/auth/teachers", payload);
  return data;
}

export async function updateTeacher(
  teacherId: number,
  name: string,
  department: string | undefined,
  subject: string | undefined,
): Promise<TeacherAdminItem> {
  const { data } = await apiClient.put(`/auth/teachers/${teacherId}`, { name, department, subject });
  return data;
}

export async function deactivateTeacher(teacherId: number): Promise<TeacherAdminItem> {
  const { data } = await apiClient.post(`/auth/teachers/${teacherId}/deactivate`);
  return data;
}

export async function reactivateTeacher(teacherId: number): Promise<TeacherAdminItem> {
  const { data } = await apiClient.post(`/auth/teachers/${teacherId}/reactivate`);
  return data;
}

export async function setHomeroom(teacherId: number, grade: number, classNo: number): Promise<TeacherAdminItem> {
  const { data } = await apiClient.put(`/auth/teachers/${teacherId}/homeroom`, { grade, class_no: classNo });
  return data;
}

export async function clearHomeroom(teacherId: number): Promise<TeacherAdminItem> {
  const { data } = await apiClient.delete(`/auth/teachers/${teacherId}/homeroom`);
  return data;
}

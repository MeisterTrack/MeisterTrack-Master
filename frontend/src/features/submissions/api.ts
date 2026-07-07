import { apiClient } from "../../lib/apiClient";

export interface Submission {
  id: number;
  domain: string;
  criterion_id: number;
  file_path: string | null;
  self_reported_text: string | null;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  created_at: string;
}

export async function listMySubmissions(): Promise<Submission[]> {
  const { data } = await apiClient.get("/submissions/me");
  return data;
}

export async function createSubmission(form: {
  domain: string;
  criterion_id: number;
  self_reported_text?: string;
  file?: File | null;
}): Promise<Submission> {
  const formData = new FormData();
  formData.append("domain", form.domain);
  formData.append("criterion_id", String(form.criterion_id));
  if (form.self_reported_text) formData.append("self_reported_text", form.self_reported_text);
  if (form.file) formData.append("file", form.file);

  const { data } = await apiClient.post("/submissions", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

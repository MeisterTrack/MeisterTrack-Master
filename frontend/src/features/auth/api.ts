import { apiClient } from "../../lib/apiClient";

export async function login(loginId: string, password: string) {
  const { data } = await apiClient.post("/auth/login", { login_id: loginId, password });
  return data as { access_token: string; token_type: string };
}

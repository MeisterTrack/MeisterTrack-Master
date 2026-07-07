const TOKEN_KEY = "access_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getRole(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).role ?? null;
  } catch {
    return null;
  }
}

export function homeRouteForRole(role: string | null): string {
  switch (role) {
    case "student":
      return "/dashboard/student";
    case "area_teacher":
    case "homeroom_teacher":
      return "/approvals";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/";
  }
}

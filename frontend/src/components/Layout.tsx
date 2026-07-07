import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getRole, logout } from "../lib/auth";

const ROLE_LABEL: Record<string, string> = {
  student: "학생",
  homeroom_teacher: "담임교사",
  area_teacher: "영역담당교사",
  admin: "관리자",
};

const NAV_BY_ROLE: Record<string, { to: string; label: string }[]> = {
  student: [
    { to: "/dashboard/student", label: "내 대시보드" },
    { to: "/submissions", label: "증빙 제출" },
  ],
  homeroom_teacher: [{ to: "/approvals", label: "승인 대기" }],
  area_teacher: [{ to: "/approvals", label: "승인 대기" }],
  admin: [{ to: "/dashboard/admin", label: "관리자 대시보드" }],
};

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const role = getRole();
  const navLinks = role ? NAV_BY_ROLE[role] ?? [] : [];

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div>
      <header
        style={{
          background: "var(--color-primary)",
          color: "white",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <strong>MeisterTrack</strong>
          <nav style={{ display: "flex", gap: 16 }}>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} style={{ color: "white" }}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {role && <span>{ROLE_LABEL[role] ?? role}</span>}
          <button onClick={handleLogout}>로그아웃</button>
        </div>
      </header>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}

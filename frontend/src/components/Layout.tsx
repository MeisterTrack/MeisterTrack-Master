import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getMe } from "../features/auth/api";
import { getRole, logout } from "../lib/auth";

const ROLE_LABEL: Record<string, string> = {
  student: "학생",
  teacher: "교사",
  admin: "관리자",
};

const STUDENT_NAV = [
  { to: "/dashboard/student", label: "대시보드" },
  { to: "/submissions", label: "제출하기" },
];
const TEACHER_NAV = [
  { to: "/dashboard/teacher", label: "대시보드" },
  { to: "/approvals", label: "승인함" },
  { to: "/bulk-grant", label: "일괄 부여" },
];
const ADMIN_NAV = [
  { to: "/dashboard/admin", label: "대시보드" },
  { to: "/bulk-grant", label: "일괄 부여" },
  { to: "/scoring-rules", label: "배점 규칙" },
  { to: "/teacher-management", label: "교사 관리" },
  { to: "/homeroom-assignment", label: "담임 배정" },
  { to: "/audit-log", label: "감사 로그" },
];

function navForRole(role: string | null) {
  if (role === "student") return STUDENT_NAV;
  if (role === "admin") return ADMIN_NAV;
  return TEACHER_NAV;
}

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getRole();
  const isStaff = role !== "student";

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe, enabled: !!role });

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = me?.name ? me.name.slice(0, 2) : "";
  const subLine =
    me?.role === "student"
      ? [me.grade ? `${me.grade}학년` : null, me.class_no ? `${me.class_no}반` : null, me.student_no]
          .filter(Boolean)
          .join(" · ")
      : me?.role === "teacher"
        ? [me.department, me.subject, me.grade && me.class_no ? `${me.grade}학년 ${me.class_no}반 담임` : null]
            .filter(Boolean)
            .join(" · ")
        : "";

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="side-brand">
          <span className="side-dot" />
          MeisterTrack
        </Link>
        {role && <span className={`role-badge ${isStaff ? "staff" : ""}`}>{ROLE_LABEL[role] ?? role}</span>}

        <nav>
          {navForRole(role).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`side-link ${location.pathname === item.to ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="side-profile">
          <div className="side-avatar">{initials}</div>
          <div>
            <b>{me?.name ?? ""}</b>
            <span>{subLine}</span>
          </div>
        </div>
        <button className="side-logout" onClick={handleLogout}>
          로그아웃
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

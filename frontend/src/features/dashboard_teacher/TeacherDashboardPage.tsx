import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import Layout from "../../components/Layout";
import { DOMAIN_LABEL, GRADE_COLOR } from "../../lib/domains";
import { getTeacherOverview } from "./api";

export default function TeacherDashboardPage() {
  const { data } = useQuery({ queryKey: ["teacher-overview"], queryFn: getTeacherOverview });
  const isHomeroom = data?.role === "homeroom_teacher";

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>{isHomeroom ? "담임 대시보드" : "영역 담당 대시보드"}</h1>
          <div className="sub">
            {isHomeroom && data?.homeroom_grade
              ? `${data.homeroom_grade}학년 ${data.homeroom_class_no}반 담임`
              : "2026학년도 1학기"}
          </div>
        </div>
        <Link to="/approvals" className="tbtn solid">
          승인함 바로가기
        </Link>
      </div>

      <div className="metric-row">
        <div className="card metric-card">
          <div className="l">승인 대기</div>
          <div className="v mono warn">{data?.pending_count ?? "-"}</div>
        </div>
        <div className="card metric-card">
          <div className="l">오늘 처리 건수</div>
          <div className="v mono">{data?.reviewed_today_count ?? "-"}</div>
        </div>
        {isHomeroom ? (
          <>
            <div className="card metric-card">
              <div className="l">우리 반 학생 수</div>
              <div className="v mono">{data?.class_student_count ?? "-"}</div>
            </div>
            <div className="card metric-card">
              <div className="l">미제출자</div>
              <div className="v mono warn">{data?.class_not_submitted_count ?? "-"}</div>
            </div>
          </>
        ) : (
          <div className="card metric-card">
            <div className="l">담당 영역 수</div>
            <div className="v mono">{data?.assigned_domains.length ?? "-"}</div>
          </div>
        )}
      </div>

      <div className="card domain-list">
        <h3>담당 영역별 진행률</h3>
        {data?.domain_summaries.map((d) => {
          const pct = d.max_score > 0 ? Math.min(100, (d.average_score / d.max_score) * 100) : 0;
          const fillClass = pct >= 90 ? "good" : pct < 50 ? "warn" : "";
          return (
            <div className="d-row" key={d.domain}>
              <div className="name">{DOMAIN_LABEL[d.domain]}</div>
              <div className="track">
                <div className={`fill ${fillClass}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="pct mono">
                {d.average_score.toFixed(1)}/{d.max_score.toFixed(0)}
              </div>
              <div className="grade" style={{ color: d.grade ? GRADE_COLOR[d.grade] : "var(--color-gray-400)" }}>
                {d.grade ?? "-"}
              </div>
            </div>
          );
        })}
        {data && data.domain_summaries.length === 0 && (
          <div style={{ color: "var(--color-gray-400)", fontSize: 13, padding: "8px 0" }}>
            아직 배정된 담당 영역이 없습니다.
          </div>
        )}
      </div>

      <div className="card table-card">
        <div className="table-toolbar">
          <h3>영역별 승인 현황</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>영역</th>
              <th>대기</th>
              <th>승인</th>
              <th>반려</th>
            </tr>
          </thead>
          <tbody>
            {data?.domain_summaries.map((d) => (
              <tr key={d.domain}>
                <td style={{ fontWeight: 700 }}>{DOMAIN_LABEL[d.domain]}</td>
                <td className="mono">{d.pending_count}</td>
                <td className="mono">{d.approved_count}</td>
                <td className="mono">{d.rejected_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

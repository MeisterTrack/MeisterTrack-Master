import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import Layout from "../../components/Layout";
import { decideOnboardingRequest, listOnboardingRequests } from "../auth/api";
import { DOMAIN_LABEL, GRADE_BG_COLOR, GRADE_COLOR, STATUS_BG_COLOR, STATUS_COLOR, STATUS_LABEL } from "../../lib/domains";
import { getAdminOverview, getRecentSubmissions } from "./api";

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-overview"], queryFn: getAdminOverview });
  const { data: recent = [] } = useQuery({ queryKey: ["admin-recent-submissions"], queryFn: getRecentSubmissions });
  const { data: onboardingRequests = [] } = useQuery({
    queryKey: ["onboarding-requests"],
    queryFn: listOnboardingRequests,
  });

  const decisionMutation = useMutation({
    mutationFn: ({ userId, approve }: { userId: number; approve: boolean }) => decideOnboardingRequest(userId, approve),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-requests"] }),
  });

  const overallPct =
    data && data.total_students > 0 ? Math.round((data.submitted_students / data.total_students) * 100) : 0;

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>마이스터 역량 인증 현황</h1>
          <div className="sub">2026학년도 1학기</div>
        </div>
        <Link to="/scoring-rules" className="tbtn solid">
          배점 규칙 관리
        </Link>
      </div>

      <div className="card hero-metric">
        <div>
          <div className="l">전교생 제출 진행률</div>
          <div className="v mono">
            {overallPct}
            <span>%</span>
          </div>
        </div>
      </div>

      <div className="metric-row">
        <div className="card metric-card">
          <div className="l">전체 학생 수</div>
          <div className="v mono">{data?.total_students ?? "-"}</div>
        </div>
        <div className="card metric-card">
          <div className="l">전체 제출 건수</div>
          <div className="v mono">{data?.total_submissions ?? "-"}</div>
        </div>
        <div className="card metric-card">
          <div className="l">승인 대기</div>
          <div className="v mono warn">{data?.pending_count ?? "-"}</div>
        </div>
        <div className="card metric-card">
          <div className="l">미제출자</div>
          <div className="v mono warn">{data?.not_submitted_count ?? "-"}</div>
        </div>
      </div>

      <div className="card domain-list">
        <h3>영역별 평균 진행률</h3>
        {data?.domain_averages.map((d) => {
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
              <div
                className="grade"
                style={{ color: d.grade ? GRADE_COLOR[d.grade] : "var(--color-gray-400)" }}
              >
                {d.grade ?? "-"}
              </div>
            </div>
          );
        })}
      </div>

      {onboardingRequests.length > 0 && (
        <div className="card table-card" style={{ marginBottom: 20 }}>
          <div className="table-toolbar">
            <h3>가입 승인 대기 (교사)</h3>
          </div>
          {onboardingRequests.map((req) => (
            <div className="h-row" key={req.id}>
              <div>
                <div className="h-name">{req.name}</div>
                <div className="h-sub">{req.email}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="tbtn" onClick={() => decisionMutation.mutate({ userId: req.id, approve: false })}>
                  반려
                </button>
                <button
                  className="tbtn solid"
                  onClick={() => decisionMutation.mutate({ userId: req.id, approve: true })}
                >
                  승인
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card table-card">
        <div className="table-toolbar">
          <h3>제출 내역 조회</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>학생</th>
              <th>항목</th>
              <th>영역</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700 }}>
                  <Link to={`/students/${r.student_id}`} style={{ color: "var(--color-ink)", textDecoration: "none", borderBottom: "1px dashed var(--color-gray-400)" }}>
                    {r.student_name}
                  </Link>
                </td>
                <td>{r.criterion_name}</td>
                <td>{DOMAIN_LABEL[r.domain]}</td>
                <td>
                  <span className="status" style={{ background: STATUS_BG_COLOR[r.status], color: STATUS_COLOR[r.status] }}>
                    <span className="dot" style={{ background: STATUS_COLOR[r.status] }} />
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

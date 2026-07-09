import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import Layout from "../../components/Layout";
import { getMe } from "../auth/api";
import { DOMAIN_LABEL, GRADE_BG_COLOR, GRADE_COLOR, STATUS_BG_COLOR, STATUS_COLOR, STATUS_LABEL } from "../../lib/domains";
import { listMySubmissions } from "../submissions/api";
import { getMyDashboard } from "./api";

export default function StudentDashboardPage() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data } = useQuery({ queryKey: ["student-dashboard"], queryFn: getMyDashboard });
  const { data: submissions = [] } = useQuery({ queryKey: ["my-submissions"], queryFn: listMySubmissions });

  const domainScores = data?.domain_scores ?? [];
  const cumulativeScore = domainScores.reduce((sum, d) => sum + d.total_score, 0);
  const cumulativeMax = domainScores.reduce((sum, d) => sum + d.max_score, 0);
  const overallPct = cumulativeMax > 0 ? Math.round((cumulativeScore / cumulativeMax) * 100) : 0;
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>안녕하세요, {me?.name ?? ""} 님</h1>
          <div className="sub">2026학년도 1학기</div>
        </div>
        <Link to="/submissions" className="tbtn solid">
          증빙 제출하기
        </Link>
      </div>

      <div className="card hero-metric">
        <div>
          <div className="l">내 전체 인증 진행률</div>
          <div className="v mono">
            {overallPct}
            <span>%</span>
          </div>
        </div>
        <div className="grade-mini-row">
          {domainScores.map((d) => (
            <div className="grade-mini" key={d.domain}>
              <div
                className="g"
                style={{
                  background: d.grade ? GRADE_BG_COLOR[d.grade] : "var(--color-gray-100)",
                  color: d.grade ? GRADE_COLOR[d.grade] : "var(--color-gray-400)",
                }}
              >
                {d.grade ?? "-"}
              </div>
              <div className="n">{DOMAIN_LABEL[d.domain]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="metric-row">
        <div className="card metric-card">
          <div className="l">누적 취득 점수</div>
          <div className="v mono">
            {cumulativeScore.toFixed(0)} <span style={{ fontSize: 12, color: "var(--color-gray-400)" }}>/ {cumulativeMax.toFixed(0)}</span>
          </div>
        </div>
        <div className="card metric-card">
          <div className="l">승인 대기</div>
          <div className="v warn">{pendingCount}건</div>
        </div>
      </div>

      <div className="card domain-list">
        <h3>영역별 진행률</h3>
        {domainScores.map((d) => {
          const pct = d.max_score > 0 ? Math.min(100, (d.total_score / d.max_score) * 100) : 0;
          const fillClass = pct >= 90 ? "good" : pct < 50 ? "warn" : "";
          return (
            <div className="d-row" key={d.domain}>
              <div className="name">{DOMAIN_LABEL[d.domain]}</div>
              <div className="track">
                <div className={`fill ${fillClass}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="pct mono">
                {d.total_score.toFixed(0)}/{d.max_score.toFixed(0)}
              </div>
              <div className="grade">{d.grade ?? "-"}</div>
            </div>
          );
        })}
      </div>

      <div className="card table-card">
        <div className="table-toolbar">
          <h3>최근 제출 내역</h3>
          <Link to="/submissions" className="tbtn">
            전체보기
          </Link>
        </div>
        {submissions.slice(0, 5).map((s) => (
          <div className="h-row" key={s.id}>
            <div>
              <div className="h-name">{s.self_reported_text ?? (s.file_path ? "파일 첨부" : DOMAIN_LABEL[s.domain])}</div>
              <div className="h-sub">
                {DOMAIN_LABEL[s.domain]} · {new Date(s.created_at).toLocaleDateString()} 제출
              </div>
            </div>
            <span className="status" style={{ background: STATUS_BG_COLOR[s.status], color: STATUS_COLOR[s.status] }}>
              <span className="dot" style={{ background: STATUS_COLOR[s.status] }} />
              {STATUS_LABEL[s.status]}
            </span>
          </div>
        ))}
        {submissions.length === 0 && (
          <div style={{ padding: 22, fontSize: 13, color: "var(--color-gray-400)" }}>아직 제출한 증빙이 없습니다.</div>
        )}
      </div>
    </Layout>
  );
}

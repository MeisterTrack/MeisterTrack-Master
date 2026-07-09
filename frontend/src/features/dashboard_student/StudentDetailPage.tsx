import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import Layout from "../../components/Layout";
import { DOMAIN_LABEL, GRADE_COLOR, STATUS_BG_COLOR, STATUS_COLOR, STATUS_LABEL } from "../../lib/domains";
import { getStudentDetail } from "./api";

const REC_ICON: Record<string, string> = {
  grade_gap: "🎯",
  max_grade: "⭐",
  slow_progress: "⏱",
};

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [openDomain, setOpenDomain] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["student-detail", studentId],
    queryFn: () => getStudentDetail(Number(studentId)),
    enabled: !!studentId,
  });

  if (!data) {
    return (
      <Layout>
        <p>불러오는 중...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ fontSize: 12, color: "var(--color-gray-400)", marginBottom: 14 }}>
        <Link to="/dashboard/admin" style={{ color: "var(--color-gray-400)" }}>
          관리자 대시보드
        </Link>{" "}
        / <b style={{ color: "var(--color-gray-600)" }}>{data.name}</b>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--color-accent)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {data.name.slice(0, 2)}
          </div>
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>{data.name}</h1>
            <div className="sub">
              {data.grade}학년 {data.class_no}반 · {data.student_no}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, color: "var(--color-gray-400)", marginBottom: 6 }}>전체 진행률</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
            {data.overall_progress_pct}%
          </div>
        </div>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, color: "var(--color-gray-400)", marginBottom: 6 }}>누적 취득 점수</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
            {data.cumulative_score.toFixed(0)} / {data.cumulative_max.toFixed(0)}
          </div>
        </div>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, color: "var(--color-gray-400)", marginBottom: 6 }}>A등급 이상 영역</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
            {data.grade_a_or_above_count} / 5
          </div>
        </div>
      </div>

      {data.recommendations.length > 0 && (
        <div className="card" style={{ padding: "20px 22px", marginBottom: 20, border: "1px solid var(--color-accent-bg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                background: "var(--color-ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✨
            </div>
            <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: 0 }}>AI 준비 가이드</h3>
          </div>
          {data.recommendations.map((rec, idx) => (
            <div key={idx} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--color-gray-100)" }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {REC_ICON[rec.kind] ?? "💡"}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--color-gray-600)", lineHeight: 1.6, margin: 0 }}>{rec.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
        {data.domains.map((d) => {
          const pct = d.max_score > 0 ? Math.min(100, (d.total_score / d.max_score) * 100) : 0;
          const fillClass = pct >= 90 ? "good" : pct < 50 ? "warn" : "";
          const isOpen = openDomain === d.domain;
          return (
            <div key={d.domain}>
              <div className="acc-head" onClick={() => setOpenDomain(isOpen ? null : d.domain)}>
                <div className="acc-name">{DOMAIN_LABEL[d.domain]}</div>
                <div className="track" style={{ flex: 1, height: 6, background: "var(--color-gray-100)", borderRadius: 999, overflow: "hidden" }}>
                  <div className={`fill ${fillClass}`} style={{ height: "100%", width: `${pct}%` }} />
                </div>
                <div className="mono" style={{ fontSize: 12, fontWeight: 700, width: 70, textAlign: "right" }}>
                  {d.total_score.toFixed(0)}/{d.max_score.toFixed(0)}
                </div>
                <div style={{ width: 22, textAlign: "center", fontSize: 12, fontWeight: 700, color: d.grade ? GRADE_COLOR[d.grade] : "var(--color-gray-400)" }}>
                  {d.grade ?? "-"}
                </div>
                <div style={{ width: 16, fontSize: 11, color: "var(--color-gray-400)" }}>{isOpen ? "▲" : "▼"}</div>
              </div>
              {isOpen && (
                <div className="acc-body" style={{ display: "block" }}>
                  {d.submissions.length === 0 && (
                    <div style={{ padding: "10px 0", fontSize: 12.5, color: "var(--color-gray-400)" }}>제출 항목이 없습니다.</div>
                  )}
                  {d.submissions.map((s) => (
                    <div className="acc-item" key={s.id}>
                      <div>
                        <div className="name">{s.criterion_name}</div>
                        <div className="meta" style={{ fontSize: 11, color: "var(--color-gray-400)" }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          className="status"
                          style={{ background: STATUS_BG_COLOR[s.status], color: STATUS_COLOR[s.status], fontSize: 10.5 }}
                        >
                          {STATUS_LABEL[s.status]}
                        </span>
                        <span className="pts mono">
                          {s.awarded_score ?? "-"}/{s.max_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import Layout from "../../components/Layout";
import { DEPARTMENT_OPTIONS, DOMAINS, DOMAIN_LABEL, SUBJECT_OPTIONS } from "../../lib/domains";

// 배점 규칙의 "입력 담당" 표시용 — 실제 권한 체계와 무관한 자유 라벨이라 담임까지 포함한 전체 목록을 보여준다.
const OWNER_DEPARTMENT_OPTIONS = ["담임교사", ...DEPARTMENT_OPTIONS, ...SUBJECT_OPTIONS];
import {
  createGradeThreshold,
  createScoringCriterion,
  deleteScoringCriterion,
  listGradeThresholds,
  listScoringCriteria,
  updateGradeThreshold,
} from "./api";

export default function ScoringRulesPage() {
  const queryClient = useQueryClient();
  const [activeDomain, setActiveDomain] = useState(DOMAINS[0]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [name, setName] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [ownerDepartment, setOwnerDepartment] = useState(OWNER_DEPARTMENT_OPTIONS[0]);
  const [applicableGrade, setApplicableGrade] = useState("");

  const { data: criteria = [] } = useQuery({
    queryKey: ["scoring-criteria", activeDomain],
    queryFn: () => listScoringCriteria(activeDomain),
  });
  const { data: thresholds = [] } = useQuery({
    queryKey: ["grade-thresholds", activeDomain],
    queryFn: () => listGradeThresholds(activeDomain),
  });

  const createMutation = useMutation({
    mutationFn: createScoringCriterion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring-criteria", activeDomain] });
      setShowAddPanel(false);
      setName("");
      setMaxScore("");
      setApplicableGrade("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScoringCriterion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scoring-criteria", activeDomain] }),
  });

  const thresholdMutation = useMutation({
    mutationFn: ({ id, minScore }: { id: number; minScore: number }) => updateGradeThreshold(id, minScore),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grade-thresholds", activeDomain] }),
  });

  const createThresholdMutation = useMutation({
    mutationFn: createGradeThreshold,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["grade-thresholds", activeDomain] }),
  });

  function handleAddSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name || !maxScore) return;
    createMutation.mutate({
      domain: activeDomain,
      name,
      max_score: Number(maxScore),
      owner_department: ownerDepartment,
      applicable_grade: applicableGrade ? Number(applicableGrade) : null,
    });
  }

  function handleThresholdChange(grade: "S" | "A" | "B", value: string) {
    if (value === "") return;
    const existing = thresholds.find((t) => t.grade === grade);
    if (existing) {
      thresholdMutation.mutate({ id: existing.id, minScore: Number(value) });
    } else {
      createThresholdMutation.mutate({ domain: activeDomain, grade, min_score: Number(value) });
    }
  }

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>배점 규칙 관리</h1>
          <div className="sub">인증 항목·배점을 코드 배포 없이 추가/수정합니다</div>
        </div>
        <button className="tbtn solid" onClick={() => setShowAddPanel((v) => !v)}>
          + 항목 추가
        </button>
      </div>

      <div className="chip-row" style={{ margin: "0 0 16px" }}>
        {DOMAINS.map((d) => (
          <div key={d} className={`chip ${activeDomain === d ? "active" : ""}`} onClick={() => setActiveDomain(d)}>
            {DOMAIN_LABEL[d]}
          </div>
        ))}
      </div>

      {showAddPanel && (
        <form onSubmit={handleAddSubmit} className="card" style={{ padding: "22px 24px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>새 평가요소 추가 — {DOMAIN_LABEL[activeDomain]}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>평가요소명</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 신규 클라우드 자격증" required />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>배점</label>
              <input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} required />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>입력 담당</label>
              <select value={ownerDepartment} onChange={(e) => setOwnerDepartment(e.target.value)}>
                {OWNER_DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>적용 학년 (선택)</label>
              <select value={applicableGrade} onChange={(e) => setApplicableGrade(e.target.value)}>
                <option value="">전체 학년</option>
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="tbtn" onClick={() => setShowAddPanel(false)}>
              취소
            </button>
            <button type="submit" className="tbtn solid">
              저장
            </button>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: "18px 22px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{DOMAIN_LABEL[activeDomain]} 등급 커트라인</h3>
        <div style={{ display: "flex", gap: 10 }}>
          {(["S", "A", "B"] as const).map((grade) => {
            const threshold = thresholds.find((t) => t.grade === grade);
            return (
              <div key={grade} style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "var(--color-gray-400)", marginBottom: 4, display: "block" }}>{grade}등급 최소 점수</label>
                <input
                  type="number"
                  className="mono"
                  defaultValue={threshold?.min_score ?? ""}
                  onBlur={(e) => handleThresholdChange(grade, e.target.value)}
                  style={{ width: "100%", textAlign: "center", padding: "9px 12px", border: "1px solid var(--color-gray-200)", borderRadius: 8 }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>평가요소</th>
              <th>배점</th>
              <th>입력 담당</th>
              <th>적용 학년</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700 }}>{c.name}</td>
                <td className="mono">{c.max_score}</td>
                <td>
                  {c.owner_department && (
                    <span style={{ fontSize: 11.5, color: "var(--color-gray-600)", background: "var(--color-gray-100)", padding: "3px 9px", borderRadius: 7 }}>
                      {c.owner_department}
                    </span>
                  )}
                </td>
                <td>{c.applicable_grade ? `${c.applicable_grade}학년` : "전체"}</td>
                <td>
                  <button
                    className="tbtn"
                    style={{ padding: "5px 10px" }}
                    onClick={() => deleteMutation.mutate(c.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {criteria.length === 0 && (
          <div style={{ padding: 22, fontSize: 13, color: "var(--color-gray-400)" }}>등록된 항목이 없습니다.</div>
        )}
      </div>
    </Layout>
  );
}

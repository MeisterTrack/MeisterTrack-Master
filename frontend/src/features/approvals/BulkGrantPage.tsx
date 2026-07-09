import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import Layout from "../../components/Layout";
import { DOMAINS, DOMAIN_LABEL } from "../../lib/domains";
import { listScoringCriteria } from "../scoring/api";
import { apiClient } from "../../lib/apiClient";

interface BulkGrantCandidate {
  id: number;
  name: string;
  grade: number | null;
  class_no: number | null;
  student_no: string | null;
}

interface BulkGrantHistoryItem {
  id: number;
  criterion_id: number;
  domain: string;
  score_per_student: number;
  note: string | null;
  created_at: string;
  student_count: number;
  students: BulkGrantCandidate[];
}

async function searchCandidates(keyword: string, grade: string): Promise<BulkGrantCandidate[]> {
  const { data } = await apiClient.get("/approvals/bulk-grants/candidates", {
    params: { keyword: keyword || undefined, grade: grade || undefined },
  });
  return data;
}

async function createBulkGrant(payload: {
  criterion_id: number;
  domain: string;
  score_per_student: number;
  note?: string;
  student_ids: number[];
}) {
  const { data } = await apiClient.post("/approvals/bulk-grants", payload);
  return data;
}

async function listBulkGrants(): Promise<BulkGrantHistoryItem[]> {
  const { data } = await apiClient.get("/approvals/bulk-grants");
  return data;
}

export default function BulkGrantPage() {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [criterionId, setCriterionId] = useState<number | "">("");
  const [scorePerStudent, setScorePerStudent] = useState<string>("");
  const [note, setNote] = useState("");
  const [keyword, setKeyword] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);

  const { data: criteria = [] } = useQuery({
    queryKey: ["scoring-criteria", domain],
    queryFn: () => listScoringCriteria(domain),
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["bulk-grant-candidates", keyword, gradeFilter],
    queryFn: () => searchCandidates(keyword, gradeFilter),
  });

  const { data: history = [] } = useQuery({ queryKey: ["bulk-grants"], queryFn: listBulkGrants });

  const submitMutation = useMutation({
    mutationFn: createBulkGrant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulk-grants"] });
      setSelectedIds(new Set());
      setNote("");
    },
  });

  function toggleStudent(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (criterionId === "" || !scorePerStudent || selectedIds.size === 0) return;
    submitMutation.mutate({
      criterion_id: Number(criterionId),
      domain,
      score_per_student: Number(scorePerStudent),
      note: note || undefined,
      student_ids: Array.from(selectedIds),
    });
  }

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>일괄 점수 부여</h1>
          <div className="sub">동일한 항목(대회 참가, 캠프 등)을 여러 학생에게 한 번에 부여합니다</div>
        </div>
      </div>

      <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 16 }}>1. 부여할 항목 선택</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>영역</label>
            <select
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setCriterionId("");
              }}
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {DOMAIN_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>평가요소</label>
            <select value={criterionId} onChange={(e) => setCriterionId(Number(e.target.value))}>
              <option value="">선택하세요</option>
              {criteria.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>인당 부여 점수</label>
            <input type="number" value={scorePerStudent} onChange={(e) => setScorePerStudent(e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>공통 증빙자료 설명 (참가자 명단 등)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 2026 교내 SW 경진대회 참가자 명단" />
        </div>
      </div>

      <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 16 }}>2. 대상 학생 선택</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            className="mono"
            style={{ flex: 1, fontSize: 13, padding: "10px 14px", border: "1px solid var(--color-gray-200)", borderRadius: 9 }}
            placeholder="이름/학번 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} style={{ width: 120 }}>
            <option value="">전체 학년</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
        </div>
        <div style={{ border: "1px solid var(--color-gray-200)", borderRadius: 10, maxHeight: 260, overflowY: "auto" }}>
          {candidates.map((c) => (
            <label
              key={c.id}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid var(--color-gray-100)" }}
            >
              <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleStudent(c.id)} />
              <span style={{ fontWeight: 700, fontSize: 13, width: 70 }}>{c.name}</span>
              <span style={{ fontSize: 11.5, color: "var(--color-gray-400)", flex: 1 }}>
                {c.grade}학년 {c.class_no}반 · {c.student_no}
              </span>
            </label>
          ))}
          {candidates.length === 0 && (
            <div style={{ padding: 22, fontSize: 13, color: "var(--color-gray-400)" }}>검색 결과가 없습니다.</div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-gray-100)" }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            선택됨: <span className="mono" style={{ color: "var(--color-accent)" }}>{selectedIds.size}</span>명
          </span>
        </div>
      </div>

      {selectedIds.size > 0 && criterionId !== "" && scorePerStudent && (
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "center",
            padding: "18px 22px",
            background: "var(--color-accent-bg)",
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: "var(--color-accent)" }}>
            {selectedIds.size * Number(scorePerStudent)}
          </div>
          <div style={{ fontSize: 13 }}>
            <b>{selectedIds.size}명</b>에게 <b>{scorePerStudent}점</b>씩, 총 <b>{selectedIds.size * Number(scorePerStudent)}점</b> 부여됩니다.
          </div>
        </div>
      )}

      <button
        className="btn-primary"
        style={{ width: "100%", marginBottom: 24 }}
        disabled={criterionId === "" || !scorePerStudent || selectedIds.size === 0 || submitMutation.isPending}
        onClick={handleSubmit}
      >
        {submitMutation.isPending ? "처리 중..." : "일괄 반영"}
      </button>

      <div className="card table-card">
        <div className="table-toolbar">
          <h3>최근 일괄 부여 내역</h3>
        </div>
        {history.map((h) => (
          <div key={h.id} style={{ borderBottom: "1px solid var(--color-gray-100)" }}>
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", cursor: "pointer" }}
              onClick={() => setExpandedHistoryId(expandedHistoryId === h.id ? null : h.id)}
            >
              <div>
                <b style={{ fontSize: 13, display: "block" }}>
                  {h.note ?? DOMAIN_LABEL[h.domain]} ({h.score_per_student}점)
                </b>
                <span style={{ fontSize: 11.5, color: "var(--color-gray-400)" }}>{new Date(h.created_at).toLocaleString()}</span>
              </div>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--color-accent)", background: "var(--color-accent-bg)", padding: "4px 10px", borderRadius: 999 }}>
                {h.student_count}명
              </span>
            </div>
            {expandedHistoryId === h.id && (
              <div style={{ padding: "0 22px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {h.students.map((s) => (
                  <span key={s.id} style={{ fontSize: 11.5, padding: "5px 10px", borderRadius: 999, background: "var(--color-gray-50)", border: "1px solid var(--color-gray-200)" }}>
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {history.length === 0 && (
          <div style={{ padding: 22, fontSize: 13, color: "var(--color-gray-400)" }}>아직 일괄 부여 이력이 없습니다.</div>
        )}
      </div>
    </Layout>
  );
}

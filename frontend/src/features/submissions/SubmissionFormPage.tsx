import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import Layout from "../../components/Layout";
import { DOMAINS, DOMAIN_LABEL, STATUS_BG_COLOR, STATUS_COLOR, STATUS_LABEL } from "../../lib/domains";
import { listScoringCriteria } from "../scoring/api";
import { createSubmission, listMySubmissions } from "./api";

export default function SubmissionFormPage() {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [criterionId, setCriterionId] = useState<number | "">("");
  const [selfReportedText, setSelfReportedText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: criteria = [] } = useQuery({
    queryKey: ["scoring-criteria", domain],
    queryFn: () => listScoringCriteria(domain),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: listMySubmissions,
  });

  const submitMutation = useMutation({
    mutationFn: createSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      setSelfReportedText("");
      setFile(null);
      setCriterionId("");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (criterionId === "") return;
    submitMutation.mutate({
      domain,
      criterion_id: Number(criterionId),
      self_reported_text: selfReportedText || undefined,
      file,
    });
  }

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>증빙 제출</h1>
          <div className="sub">인증 항목을 선택하고 증빙자료를 업로드하세요</div>
        </div>
      </div>

      <div className="domain-picker">
        {DOMAINS.map((d) => (
          <div
            key={d}
            className={`domain-chip ${d === domain ? "active" : ""}`}
            onClick={() => {
              setDomain(d);
              setCriterionId("");
            }}
          >
            {DOMAIN_LABEL[d]}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: "24px 26px", marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{DOMAIN_LABEL[domain]} — 증빙 제출</h3>
        <div style={{ fontSize: 12.5, color: "var(--color-gray-400)", marginBottom: 20 }}>
          해당 영역의 세부 평가요소를 선택하고 증빙을 첨부하세요
        </div>

        <div className="field">
          <label>세부 평가요소</label>
          <select value={criterionId} onChange={(e) => setCriterionId(Number(e.target.value))} required>
            <option value="">선택하세요</option>
            {criteria.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.max_score}점)
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>자기입력 (봉사시간, 대회 입상 내역, 독후감 등)</label>
          <textarea value={selfReportedText} onChange={(e) => setSelfReportedText(e.target.value)} rows={5} />
        </div>

        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>증빙 파일</label>
        {file ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--color-gray-50)",
              border: "1px solid var(--color-gray-200)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 20,
            }}
          >
            <span style={{ color: "var(--color-success)" }}>✓</span>
            <div>
              <b style={{ fontSize: 12.5, display: "block" }}>{file.name}</b>
              <span style={{ fontSize: 11, color: "var(--color-gray-400)" }}>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", color: "var(--color-gray-400)" }}
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="dropzone" style={{ display: "block", cursor: "pointer" }}>
            <b>파일을 클릭해서 업로드</b>
            <span>JPG, PNG, PDF · 최대 10MB</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        <button type="submit" className="btn-primary" disabled={submitMutation.isPending}>
          제출하기
        </button>
        {submitMutation.isError && (
          <p style={{ color: "var(--color-danger)", fontSize: 12.5, marginTop: 10 }}>제출 중 오류가 발생했습니다.</p>
        )}
      </form>

      <div className="card table-card">
        <div className="table-toolbar">
          <h3>내 제출 내역</h3>
        </div>
        {submissions.map((s) => (
          <div className="h-row" key={s.id}>
            <div>
              <div className="h-name">{s.self_reported_text ?? (s.file_path ? "파일 첨부" : DOMAIN_LABEL[s.domain])}</div>
              <div className="h-sub">
                {DOMAIN_LABEL[s.domain]} · {new Date(s.created_at).toLocaleDateString()} 제출
                {s.status === "rejected" && s.reject_reason ? ` · 사유: ${s.reject_reason}` : ""}
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

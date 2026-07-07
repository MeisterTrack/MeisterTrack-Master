import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CSSProperties, FormEvent, useState } from "react";

import Layout from "../../components/Layout";
import { DOMAINS, DOMAIN_LABEL, STATUS_COLOR, STATUS_LABEL } from "../../lib/domains";
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
      <h1>증빙 제출</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
        <label>
          영역
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
        </label>

        <label>
          세부 평가요소
          <select value={criterionId} onChange={(e) => setCriterionId(Number(e.target.value))}>
            <option value="">선택하세요</option>
            {criteria.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.max_score}점)
              </option>
            ))}
          </select>
        </label>

        <label>
          자기입력 (봉사시간, 대회 입상 내역, 독후감 등)
          <textarea
            value={selfReportedText}
            onChange={(e) => setSelfReportedText(e.target.value)}
            rows={5}
          />
        </label>

        <label>
          증빙 파일 (이미지/PDF)
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>

        <button type="submit" disabled={submitMutation.isPending} style={{ background: "var(--color-primary)", color: "white", padding: 8 }}>
          제출
        </button>
        {submitMutation.isError && <p style={{ color: "var(--color-danger)" }}>제출 중 오류가 발생했습니다.</p>}
      </form>

      <h2 style={{ marginTop: 32 }}>내 제출 이력</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={cellStyle}>영역</th>
            <th style={cellStyle}>내용</th>
            <th style={cellStyle}>상태</th>
            <th style={cellStyle}>반려 사유</th>
            <th style={cellStyle}>제출일</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td style={cellStyle}>{DOMAIN_LABEL[s.domain]}</td>
              <td style={cellStyle}>{s.self_reported_text ?? (s.file_path ? "파일 첨부" : "-")}</td>
              <td style={{ ...cellStyle, color: STATUS_COLOR[s.status] }}>{STATUS_LABEL[s.status]}</td>
              <td style={cellStyle}>{s.reject_reason ?? "-"}</td>
              <td style={cellStyle}>{new Date(s.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

const cellStyle: CSSProperties = {
  border: "1px solid #ddd",
  padding: 8,
  textAlign: "left",
};

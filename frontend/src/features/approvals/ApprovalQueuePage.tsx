import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import Layout from "../../components/Layout";
import { DOMAIN_LABEL } from "../../lib/domains";
import { getAiReviewResult } from "../ai_review/api";
import { Submission } from "../submissions/api";
import { decideSubmission, getPendingQueue } from "./api";

function QueueRow({ submission }: { submission: Submission }) {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const { data: aiResult } = useQuery({
    queryKey: ["ai-review", submission.id],
    queryFn: () => getAiReviewResult(submission.id),
  });

  const decisionMutation = useMutation({
    mutationFn: (params: { approve: boolean; reason?: string }) =>
      decideSubmission(submission.id, params.approve, params.reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["approval-queue"] }),
  });

  return (
    <tr>
      <td style={cellStyle}>{DOMAIN_LABEL[submission.domain]}</td>
      <td style={cellStyle}>{submission.self_reported_text ?? (submission.file_path ? "파일 첨부" : "-")}</td>
      <td style={cellStyle}>
        {aiResult ? (
          <span>
            추천 항목 #{aiResult.suggested_criterion_id ?? "-"} (신뢰도 {(aiResult.confidence * 100).toFixed(0)}%)
            {aiResult.flag && <span style={{ color: "var(--color-danger)" }}> · {aiResult.flag}</span>}
          </span>
        ) : (
          <span style={{ color: "var(--color-text-muted)" }}>분석 대기중</span>
        )}
      </td>
      <td style={cellStyle}>
        <button onClick={() => decisionMutation.mutate({ approve: true })}>승인</button>
        <button onClick={() => setShowReject((v) => !v)} style={{ marginLeft: 8 }}>
          반려
        </button>
        {showReject && (
          <div style={{ marginTop: 8 }}>
            <input
              placeholder="반려 사유"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <button
              onClick={() => decisionMutation.mutate({ approve: false, reason: rejectReason })}
              style={{ marginLeft: 8, background: "var(--color-danger)", color: "white" }}
            >
              반려 확정
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function ApprovalQueuePage() {
  const { data: queue = [] } = useQuery({
    queryKey: ["approval-queue"],
    queryFn: getPendingQueue,
  });

  return (
    <Layout>
      <h1>승인 대기 목록</h1>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={cellStyle}>영역</th>
            <th style={cellStyle}>내용</th>
            <th style={cellStyle}>AI 추천</th>
            <th style={cellStyle}>처리</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((s) => (
            <QueueRow key={s.id} submission={s} />
          ))}
        </tbody>
      </table>
      {queue.length === 0 && <p>대기 중인 항목이 없습니다.</p>}
    </Layout>
  );
}

const cellStyle = {
  border: "1px solid #ddd",
  padding: 8,
  textAlign: "left" as const,
};

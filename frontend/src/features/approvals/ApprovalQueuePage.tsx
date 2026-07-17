import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import Layout from "../../components/Layout";
import { getAiReviewResult } from "../ai_review/api";
import { decideOnboardingRequest, getMe, listOnboardingRequests } from "../auth/api";
import { DOMAIN_LABEL } from "../../lib/domains";
import { decideSubmission, getPendingQueue, QueueItem } from "./api";

export default function ApprovalQueuePage() {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const isHomeroom = me?.grade != null && me?.class_no != null;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [awardedScore, setAwardedScore] = useState<string>("");
  const [selectedQueueIds, setSelectedQueueIds] = useState<Set<number>>(new Set());
  const [selectedOnboardingIds, setSelectedOnboardingIds] = useState<Set<number>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  const { data: queue = [] } = useQuery({ queryKey: ["approval-queue"], queryFn: getPendingQueue });
  const selected = queue.find((item) => item.id === selectedId) ?? queue[0] ?? null;

  useEffect(() => {
    setAwardedScore(selected ? String(selected.max_score) : "");
  }, [selected?.id]);

  const { data: aiResult } = useQuery({
    queryKey: ["ai-review", selected?.id],
    queryFn: () => getAiReviewResult(selected!.id),
    enabled: !!selected,
  });

  const { data: onboardingRequests = [] } = useQuery({
    queryKey: ["onboarding-requests"],
    queryFn: listOnboardingRequests,
    enabled: isHomeroom,
  });

  const onboardingDecisionMutation = useMutation({
    mutationFn: ({ userId, approve }: { userId: number; approve: boolean }) => decideOnboardingRequest(userId, approve),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["onboarding-requests"] }),
  });

  const decisionMutation = useMutation({
    mutationFn: (params: { approve: boolean; reason?: string; score?: number }) =>
      decideSubmission(selected!.id, params.approve, { rejectReason: params.reason, awardedScore: params.score }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-queue"] });
      setSelectedId(null);
      setShowReject(false);
      setRejectReason("");
      setAwardedScore("");
    },
  });

  function selectItem(item: QueueItem) {
    setSelectedId(item.id);
    setShowReject(false);
    setRejectReason("");
  }

  function toggleOnboardingSelection(id: number) {
    setSelectedOnboardingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnboarding() {
    setSelectedOnboardingIds((prev) =>
      prev.size === onboardingRequests.length ? new Set() : new Set(onboardingRequests.map((r) => r.id)),
    );
  }

  async function handleBulkApproveOnboarding() {
    setBulkApproving(true);
    try {
      await Promise.all(Array.from(selectedOnboardingIds).map((id) => decideOnboardingRequest(id, true)));
      setSelectedOnboardingIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["onboarding-requests"] });
    } finally {
      setBulkApproving(false);
    }
  }

  function toggleQueueSelection(id: number) {
    setSelectedQueueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllQueue() {
    setSelectedQueueIds((prev) => (prev.size === queue.length ? new Set() : new Set(queue.map((q) => q.id))));
  }

  async function handleBulkApproveQueue() {
    setBulkApproving(true);
    try {
      await Promise.all(
        Array.from(selectedQueueIds).map((id) => {
          const item = queue.find((q) => q.id === id);
          return decideSubmission(id, true, { awardedScore: item?.max_score });
        }),
      );
      setSelectedQueueIds(new Set());
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["approval-queue"] });
    } finally {
      setBulkApproving(false);
    }
  }

  return (
    <Layout>
      {isHomeroom && onboardingRequests.length > 0 && (
        <div className="card table-card" style={{ marginBottom: 20 }}>
          <div className="table-toolbar">
            <h3>가입 승인 대기 (학생)</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={selectedOnboardingIds.size === onboardingRequests.length}
                  onChange={toggleAllOnboarding}
                />
                전체 선택
              </label>
              <button
                className="tbtn solid"
                disabled={selectedOnboardingIds.size === 0 || bulkApproving}
                onClick={handleBulkApproveOnboarding}
              >
                선택 {selectedOnboardingIds.size}건 일괄 승인
              </button>
            </div>
          </div>
          {onboardingRequests.map((req) => (
            <div className="h-row" key={req.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={selectedOnboardingIds.has(req.id)}
                  onChange={() => toggleOnboardingSelection(req.id)}
                />
                <div>
                  <div className="h-name">{req.name}</div>
                  <div className="h-sub">{req.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="tbtn" onClick={() => onboardingDecisionMutation.mutate({ userId: req.id, approve: false })}>
                  반려
                </button>
                <button
                  className="tbtn solid"
                  onClick={() => onboardingDecisionMutation.mutate({ userId: req.id, approve: true })}
                >
                  승인
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="approvals-main card" style={{ minHeight: 500 }}>
        <div className="queue-col">
          <div className="queue-head">
            <h1>승인 대기</h1>
            <div className="sub">{queue.length}건 대기중</div>
          </div>
          {queue.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 12px" }}>
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" checked={selectedQueueIds.size === queue.length} onChange={toggleAllQueue} />
                전체 선택
              </label>
              <button
                className="tbtn solid"
                style={{ fontSize: 11.5, padding: "6px 10px" }}
                disabled={selectedQueueIds.size === 0 || bulkApproving}
                onClick={handleBulkApproveQueue}
              >
                {selectedQueueIds.size}건 일괄 승인
              </button>
            </div>
          )}
          {queue.map((item) => (
            <div
              key={item.id}
              className={`q-item ${selected?.id === item.id ? "selected" : ""}`}
              onClick={() => selectItem(item)}
            >
              <div className="q-top">
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedQueueIds.has(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleQueueSelection(item.id)}
                  />
                  <span className="q-name">{item.student_name}</span>
                </span>
                <span className="q-time">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <div className="q-meta">
                {item.criterion_name} · {DOMAIN_LABEL[item.domain]}
              </div>
            </div>
          ))}
          {queue.length === 0 && (
            <div style={{ padding: 22, fontSize: 13, color: "var(--color-gray-400)" }}>대기 중인 항목이 없습니다.</div>
          )}
        </div>

        {selected && (
          <div className="detail">
            <div className="d-head">
              <div>
                <h2>
                  {selected.student_name} · {selected.criterion_name}
                </h2>
                <div className="sub">
                  {DOMAIN_LABEL[selected.domain]} · {new Date(selected.created_at).toLocaleString()} 제출 · #SUB-
                  {selected.id}
                </div>
              </div>
            </div>

            {selected.self_reported_text && (
              <div className="card" style={{ padding: "16px 20px", marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
                {selected.self_reported_text}
              </div>
            )}
            {selected.file_path && (
              <div
                className="card"
                style={{
                  height: 160,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-gray-400)",
                  fontSize: 12.5,
                }}
              >
                증빙 파일 첨부됨 ({selected.file_path.split("/").pop()})
              </div>
            )}

            <div className="card ai-panel">
              <h4>AI 1차 검증 결과</h4>
              {aiResult ? (
                <>
                  <div className="ai-row">
                    <span className="lbl">매칭 신뢰도</span>
                    <span className="v mono">{(aiResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="ai-row">
                    <span className="lbl">추천 항목 ID</span>
                    <span className="v">{aiResult.suggested_criterion_id ?? "-"}</span>
                  </div>
                  {aiResult.flag && (
                    <div className="ai-row">
                      <span className="lbl">플래그</span>
                      <span className="v" style={{ color: "var(--color-danger)" }}>
                        {aiResult.flag}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: "var(--color-gray-400)" }}>AI 분석 대기중</div>
              )}
            </div>

            <div className="card score-editor">
              <label>확정 배점</label>
              <input type="number" value={awardedScore} onChange={(e) => setAwardedScore(e.target.value)} />
              <span className="of">/ {selected.max_score}점 만점</span>
            </div>

            {showReject && (
              <div className="field" style={{ marginBottom: 12 }}>
                <input
                  placeholder="반려 사유를 입력하세요"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}

            <div className="action-row">
              {!showReject ? (
                <button className="btn reject" onClick={() => setShowReject(true)}>
                  반려하기
                </button>
              ) : (
                <button
                  className="btn reject"
                  onClick={() => decisionMutation.mutate({ approve: false, reason: rejectReason })}
                  disabled={!rejectReason}
                >
                  반려 확정
                </button>
              )}
              <button
                className="btn approve"
                onClick={() => decisionMutation.mutate({ approve: true, score: Number(awardedScore) })}
              >
                {awardedScore}점으로 승인
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import Layout from "../../components/Layout";
import { listAuditLogs } from "./api";

const ACTION_LABEL: Record<string, string> = {
  approve: "승인",
  reject: "반려",
  bulk_grant: "일괄 부여",
};

const ACTION_COLOR: Record<string, { bg: string; fg: string }> = {
  approve: { bg: "var(--color-success-bg)", fg: "var(--color-success)" },
  reject: { bg: "var(--color-danger-bg)", fg: "var(--color-danger)" },
  bulk_grant: { bg: "var(--color-accent-bg)", fg: "var(--color-accent)" },
};

const TARGET_TYPE_LABEL: Record<string, string> = {
  submission: "제출건",
};

export default function AuditLogPage() {
  const { data: logs = [] } = useQuery({ queryKey: ["audit-logs"], queryFn: listAuditLogs });
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? logs : logs.filter((log) => log.action === filter);

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>감사 로그</h1>
          <div className="sub">전체 승인·반려·수정 이력 추적</div>
        </div>
      </div>

      <div className="chip-row" style={{ marginBottom: 16 }}>
        {["all", "approve", "reject", "bulk_grant"].map((action) => (
          <div key={action} className={`chip ${filter === action ? "active" : ""}`} onClick={() => setFilter(action)}>
            {action === "all" ? "전체" : ACTION_LABEL[action]}
          </div>
        ))}
      </div>

      <div className="card">
        {filtered.map((log) => {
          const color = ACTION_COLOR[log.action] ?? { bg: "var(--color-gray-100)", fg: "var(--color-gray-600)" };
          return (
            <div className="log-row" key={log.id}>
              <div className="log-icon" style={{ background: color.bg, color: color.fg }}>
                ●
              </div>
              <div className="log-body">
                <div className="log-line">
                  <b>{log.actor_name}</b>님이 {TARGET_TYPE_LABEL[log.target_type] ?? log.target_type} #{log.target_id}를{" "}
                  <b style={{ color: color.fg }}>{ACTION_LABEL[log.action] ?? log.action}</b>했습니다
                </div>
                <div className="log-meta">{new Date(log.created_at).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 22, fontSize: 13, color: "var(--color-gray-400)" }}>기록이 없습니다.</div>
        )}
      </div>
    </Layout>
  );
}

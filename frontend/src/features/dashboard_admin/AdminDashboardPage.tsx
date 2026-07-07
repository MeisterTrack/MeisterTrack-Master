import { useQuery } from "@tanstack/react-query";

import Layout from "../../components/Layout";
import { DOMAIN_LABEL } from "../../lib/domains";
import { getAdminOverview } from "./api";

export default function AdminDashboardPage() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: getAdminOverview,
  });

  return (
    <Layout>
      <h1>관리자 대시보드</h1>
      {data && (
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <StatCard label="전체 학생" value={data.total_students} />
          <StatCard label="제출한 학생" value={data.submitted_students} />
          <StatCard label="미제출자" value={data.not_submitted_count} color="var(--color-danger)" />
        </div>
      )}

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={cellStyle}>영역</th>
            <th style={cellStyle}>평균 점수</th>
            <th style={cellStyle}>제출 건수</th>
          </tr>
        </thead>
        <tbody>
          {data?.domain_averages.map((d) => (
            <tr key={d.domain}>
              <td style={cellStyle}>{DOMAIN_LABEL[d.domain]}</td>
              <td style={cellStyle}>{d.average_score}</td>
              <td style={cellStyle}>{d.submission_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: "var(--color-bg-tint)", borderRadius: 8, padding: 16, minWidth: 120 }}>
      <div style={{ color: "var(--color-text-muted)" }}>{label}</div>
      <div style={{ fontSize: 28, color: color ?? "var(--color-primary)" }}>{value}</div>
    </div>
  );
}

const cellStyle = {
  border: "1px solid #ddd",
  padding: 8,
  textAlign: "left" as const,
};

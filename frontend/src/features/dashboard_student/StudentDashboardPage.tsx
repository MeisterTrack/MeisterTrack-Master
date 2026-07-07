import { useQuery } from "@tanstack/react-query";

import Layout from "../../components/Layout";
import { DOMAIN_LABEL, GRADE_COLOR } from "../../lib/domains";
import { getMyDashboard } from "./api";

export default function StudentDashboardPage() {
  const { data } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getMyDashboard,
  });

  return (
    <Layout>
      <h1>내 대시보드</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {data?.domain_scores.map((ds) => (
          <div
            key={ds.domain}
            style={{
              background: "var(--color-bg-tint)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h3 style={{ margin: 0 }}>{DOMAIN_LABEL[ds.domain]}</h3>
            <p style={{ fontSize: 24, margin: "8px 0", color: "var(--color-primary)" }}>{ds.total_score}점</p>
            <span
              style={{
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 12,
                background: ds.grade ? GRADE_COLOR[ds.grade] : "#ccc",
                color: "white",
                fontWeight: "bold",
              }}
            >
              {ds.grade ?? "미달"}
            </span>
          </div>
        ))}
      </div>
    </Layout>
  );
}

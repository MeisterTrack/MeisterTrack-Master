import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 32px", textAlign: "center" }}>
      <div
        style={{
          display: "inline-block",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--color-accent)",
          background: "var(--color-accent-bg)",
          padding: "5px 12px",
          borderRadius: 999,
          marginBottom: 22,
        }}
      >
        부산소프트웨어마이스터고 · 2026
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.3, margin: "0 0 18px" }}>
        마이스터 역량 인증,
        <br />
        <span style={{ color: "var(--color-accent)" }}>흩어진 확인 과정</span>을 하나로
      </h1>
      <p style={{ fontSize: 16, color: "var(--color-gray-600)", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.6 }}>
        증빙 제출부터 승인, 실시간 집계까지 — 5개 영역을 한 시스템에서 관리하고 AI가 1차 검증을 돕습니다.
      </p>
      <Link to="/login" className="btn-primary" style={{ textDecoration: "none" }}>
        지금 시작하기
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 0,
          marginTop: 56,
          borderTop: "1px solid var(--color-gray-200)",
          borderBottom: "1px solid var(--color-gray-200)",
        }}
      >
        {[
          ["300", "대상 학생 (명)"],
          ["5", "인증 영역"],
          ["AI", "1차 검증 보조"],
          ["0", "제출 누락"],
        ].map(([n, l]) => (
          <div key={l} style={{ flex: 1, maxWidth: 160, textAlign: "center", padding: "20px 10px" }}>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
              {n}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--color-gray-400)", marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 60, textAlign: "left" }}>
        {[
          ["AI 1차 검증", "자격증·상장 이미지를 OCR로 읽어 인증기준표와 자동 매칭하고, 독후감은 분량·유사도를 검사합니다."],
          ["승인 큐", "담당 항목만 필터링해 빠르게 확인합니다."],
          ["실시간 대시보드", "5개 영역 등급을 실시간으로 확인합니다."],
          ["감사 로그", "모든 입력·수정 이력이 투명하게 남습니다."],
        ].map(([title, desc]) => (
          <div key={title} style={{ background: "var(--color-gray-50)", border: "1px solid var(--color-gray-200)", borderRadius: 14, padding: 22 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{title}</h4>
            <p style={{ fontSize: 12.5, color: "var(--color-gray-600)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>

      <footer style={{ marginTop: 80, paddingTop: 24, borderTop: "1px solid var(--color-gray-200)", fontSize: 12, color: "var(--color-gray-400)" }}>
        MeisterTrack — 2026 BSSM 마이스터 역량 시스템 AI Challenge · 부산소프트웨어마이스터고등학교
      </footer>
    </div>
  );
}

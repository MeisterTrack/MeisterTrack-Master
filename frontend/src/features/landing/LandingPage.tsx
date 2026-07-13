import { Link } from "react-router-dom";

import { DOMAIN_LABEL, GRADE_COLOR } from "../../lib/domains";

const STATS: [string, string][] = [
  ["300", "대상 학생 (명)"],
  ["5", "인증 영역"],
  ["AI", "1차 검증 보조"],
  ["0", "제출 누락"],
];

const MOCK_GRADES: Record<string, "S" | "A" | "B"> = {
  basic_job_competency: "A",
  technical_competency: "S",
  character_work_ethic: "A",
  humanities_literacy: "B",
  foreign_language: "A",
};

const FEATURES: [JSX.Element, string, string][] = [
  [
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" />,
    "AI 1차 검증",
    "자격증·상장 이미지를 OCR로 읽어 인증기준표와 자동 매칭하고, 독후감은 분량·유사도를 검사합니다.",
  ],
  [
    <path d="M9 12l2 2 4-4M21 12a9 9 0 11-9-9 9 9 0 019 9z" />,
    "승인 큐",
    "담당 항목만 필터링해 빠르게 확인합니다.",
  ],
  [<path d="M3 3v18h18M7 15l4-5 3 3 5-7" />, "실시간 대시보드", "5개 영역 등급을 실시간으로 확인합니다."],
  [
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />,
    "감사 로그",
    "모든 입력·수정 이력이 투명하게 남습니다.",
  ],
];

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link to="/" className="brand">
          <span className="dot" />
          MeisterTrack
        </Link>
        <div className="landing-nav-links">
          <a href="#features">기능</a>
          <a href="#how">작동 방식</a>
        </div>
        <Link to="/login" className="landing-nav-cta">
          로그인
        </Link>
      </nav>

      <section className="landing-hero">
        <div className="landing-glow" />
        <div className="landing-badge">부산소프트웨어마이스터고 · 2026</div>
        <h1>
          마이스터 역량 인증,
          <br />
          <span className="accent">흩어진 확인 과정</span>을 하나로
        </h1>
        <p className="landing-hero-sub">
          증빙 제출부터 승인, 실시간 집계까지 — 5개 영역을 한 시스템에서 관리하고 AI가 1차 검증을 돕습니다.
        </p>
        <div className="landing-cta-row">
          <Link to="/login" className="btn-primary" style={{ textDecoration: "none" }}>
            지금 시작하기
          </Link>
          <a href="#how" className="link-secondary">
            작동 방식 보기 →
          </a>
        </div>

        <div className="landing-stats">
          {STATS.map(([n, l]) => (
            <div key={l} className="stat">
              <div className="n">{n}</div>
              <div className="l">{l}</div>
            </div>
          ))}
        </div>

        <div className="landing-shot-wrap">
          <div className="landing-browser">
            <div className="landing-browser-bar">
              <div className="d" />
              <div className="d" />
              <div className="d" />
              <span className="u">meistertrack.imjemin.co.kr/dashboard</span>
            </div>
            <div className="landing-browser-body">
              <div className="landing-bs-topbar">
                <div className="title">학생 대시보드</div>
                <div className="pill">AI 검토 대기 2건</div>
              </div>
              <div className="landing-bs-metric">
                <div className="l">전체 인증 진행률</div>
                <div className="v">
                  68<span>%</span>
                </div>
              </div>
              <div className="landing-bs-grid">
                {Object.entries(MOCK_GRADES).map(([domain, grade]) => (
                  <div className="landing-bs-card" key={domain}>
                    <div className="l">{DOMAIN_LABEL[domain]}</div>
                    <div className="v" style={{ color: GRADE_COLOR[grade] }}>
                      {grade}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-features">
        {FEATURES.map(([icon, title, desc]) => (
          <div key={title}>
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {icon}
              </svg>
            </div>
            <h4>{title}</h4>
            <p>{desc}</p>
          </div>
        ))}
      </section>

      <footer id="how" className="landing-footer">
        MeisterTrack — 2026 BSSM 마이스터 역량 시스템 AI Challenge · 부산소프트웨어마이스터고등학교
      </footer>
    </div>
  );
}

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

const CHECK_LIST = [
  "본인 담당 항목만 필터링된 승인 큐",
  "AI 추천값 + 신뢰도, 최종 확정은 사람이",
  "누가 언제 무엇을 승인했는지 감사 로그",
];

const LIGHT_SHOT_ROWS: [string, string, "ok" | "wait"][] = [
  ["정보처리산업기사 자격증", "전문기술역량 · 신뢰도 96%", "ok"],
  ["권장도서 독후감 3권", "인문학적 소양 · 신뢰도 88%", "wait"],
  ["TOEIC 855점 성적표", "외국어 능력 · 신뢰도 99%", "ok"],
];

const STEPS: [string, string][] = [
  ["증빙 제출", "영역을 선택하고 자격증·상장 이미지나 자기입력을 업로드합니다."],
  ["AI 1차 검증", "OCR로 인증기준표와 자동 매칭하고 신뢰도를 계산합니다 (백그라운드 처리)."],
  ["담당교사 승인", "본인 담당 항목만 필터링된 큐에서 확정 배점을 입력합니다."],
  ["실시간 반영", "승인 즉시 학생 대시보드의 진행률·등급이 갱신됩니다."],
];

const ROLES: {
  cls: string;
  tag: string;
  title: string;
  items: string[];
}[] = [
  {
    cls: "student",
    tag: "학생",
    title: "내 진행 상황을 실시간으로",
    items: ["5개 영역 누적 점수·등급 즉시 확인", "부족한 영역은 AI가 다음 행동 추천", "반려 사유까지 투명하게 확인"],
  },
  {
    cls: "teacher",
    tag: "담당교사",
    title: "내 담당 항목만 빠르게",
    items: ["본인 담당 영역만 필터링된 승인 큐", "체크박스로 여러 건 한 번에 승인", "대회·캠프 참가자 일괄 점수 부여"],
  },
  {
    cls: "admin",
    tag: "관리자",
    title: "코드 배포 없이 규칙 관리",
    items: ["전교생 진행 현황·미제출자 한눈에", "배점 규칙·등급 커트라인 화면에서 수정", "반별 담임 배정, 전체 감사 로그 추적"],
  },
];

const FEATURES: [JSX.Element, string, string, boolean, number?][] = [
  [
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z" />,
    "AI 1차 검증",
    "자격증·상장 이미지를 OCR로 읽어 인증기준표와 자동 매칭하고, 독후감은 분량·유사도를 검사합니다.",
    true,
    92,
  ],
  [
    <path d="M9 12l2 2 4-4M21 12a9 9 0 11-9-9 9 9 0 019 9z" />,
    "승인 큐",
    "담당 항목만 필터링해 빠르게 확인합니다.",
    false,
  ],
  [<path d="M3 3v18h18M7 15l4-5 3 3 5-7" />, "실시간 대시보드", "5개 영역 등급을 실시간으로 확인합니다.", false],
  [
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
    "일괄 부여",
    "대회 참가·캠프 등은 여러 학생에게 한 번에 점수를 부여합니다.",
    false,
  ],
  [
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />,
    "감사 로그",
    "모든 입력·수정 이력이 투명하게 남습니다.",
    false,
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
          <a href="#how">작동 방식</a>
          <a href="#roles">이용 대상</a>
          <a href="#features">기능</a>
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

      <section className="landing-split">
        <div>
          <div className="landing-split-label">// PROBLEM → SOLUTION</div>
          <h2>
            담당자 확인을
            <br />
            기다리는 시간을 줄입니다
          </h2>
          <p>
            증빙 확인이 담임·전문교육부·체육교사·영어교과 등으로 흩어져 있던 방식에서, 하나의 승인 큐로 모았습니다.
            AI가 먼저 매칭 신뢰도를 계산해 담당교사의 확인 시간을 줄여줍니다.
          </p>
          <div className="landing-check-list">
            {CHECK_LIST.map((item) => (
              <div className="item" key={item}>
                <span className="ck">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="landing-light-shot">
          {LIGHT_SHOT_ROWS.map(([name, sub, status]) => (
            <div className="landing-ls-row" key={name}>
              <div>
                <div className="landing-ls-name">{name}</div>
                <div className="landing-ls-sub">{sub}</div>
              </div>
              <span
                className="status"
                style={{
                  background: status === "ok" ? "var(--color-success-bg)" : "var(--color-warning-bg)",
                  color: status === "ok" ? "var(--color-success)" : "var(--color-warning)",
                }}
              >
                <span className="dot" style={{ background: status === "ok" ? "var(--color-success)" : "var(--color-warning)" }} />
                {status === "ok" ? "승인완료" : "AI 검토중"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="landing-steps-wrap">
        <div className="landing-section-head">
          <div className="landing-split-label" style={{ textAlign: "center" }}>
            // HOW IT WORKS
          </div>
          <h2>4단계면 끝납니다</h2>
        </div>
        <div className="landing-steps">
          {STEPS.map(([title, desc], i) => (
            <div className="landing-step" key={title}>
              <div className="n">{i + 1}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="landing-roles">
        {ROLES.map((role) => (
          <div className={`landing-role-card ${role.cls}`} key={role.tag}>
            <span className="role-tag">{role.tag}</span>
            <h4>{role.title}</h4>
            <ul>
              {role.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section id="features" className="landing-features">
        {FEATURES.map(([icon, title, desc, big, pct]) => (
          <div key={title} className={big ? "big" : undefined}>
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {icon}
              </svg>
            </div>
            <h4>{title}</h4>
            <p>{desc}</p>
            {big && pct !== undefined && (
              <div className="landing-mini-bar">
                <div className="lbl">매칭 신뢰도</div>
                <div className="landing-mini-track">
                  <div className="landing-mini-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="landing-cta-banner">
        <h2>학교 계정으로 3분이면 시작합니다</h2>
        <p>별도 회원가입 없이, 학교 Google 계정으로 바로 로그인하세요.</p>
        <Link to="/login" className="btn-primary" style={{ textDecoration: "none" }}>
          지금 시작하기
        </Link>
      </section>

      <footer className="landing-footer">
        <span>MeisterTrack — 2026 BSSM 마이스터 역량 시스템 AI Challenge</span>
        <span>부산소프트웨어마이스터고등학교</span>
      </footer>
    </div>
  );
}

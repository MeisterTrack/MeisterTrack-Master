import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getRole, homeRouteForRole, setToken } from "../../lib/auth";
import { getAuthConfig, googleCallbackLogin, mockGoogleLogin } from "./api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const { data: config } = useQuery({ queryKey: ["auth-config"], queryFn: getAuthConfig });
  const useRealGoogleLogin = !!config?.google_client_id;

  function handleLoginResult(result: { status: string; access_token: string | null; email: string; name: string }) {
    if (result.status === "ok" && result.access_token) {
      setToken(result.access_token);
      navigate(homeRouteForRole(getRole()));
    } else if (result.status === "needs_onboarding") {
      navigate("/onboarding", { state: { email: result.email, name: result.name } });
    } else {
      setPendingMessage("가입 요청이 아직 승인 대기 중입니다. 담임교사 또는 관리자 승인 후 이용할 수 있어요.");
    }
  }

  useEffect(() => {
    if (!useRealGoogleLogin || !config || !window.google || !googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: config.google_client_id,
      callback: async (response) => {
        setError(null);
        setPendingMessage(null);
        try {
          const result = await googleCallbackLogin(response.credential);
          handleLoginResult(result);
        } catch {
          setError("로그인에 실패했습니다. 학교 계정(@bssm.hs.kr)인지 확인해주세요.");
        }
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "signin_with",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useRealGoogleLogin, config]);

  async function handleMockSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPendingMessage(null);
    setSubmitting(true);
    try {
      const result = await mockGoogleLogin(email, name, secret);
      handleLoginResult(result);
    } catch {
      setError("로그인에 실패했습니다. 학교 계정(@bssm.hs.kr)이고 접근 코드가 맞는지 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell">
      <div
        style={{
          width: 440,
          flexShrink: 0,
          background: "var(--color-primary)",
          color: "#fff",
          padding: "44px 40px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 15, marginBottom: 64 }}>
          <span className="side-dot" />
          MeisterTrack
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.4, letterSpacing: "-0.02em", marginBottom: 14 }}>
          마이스터 역량,
          <br />
          이제 한 곳에서
        </div>
        <div style={{ fontSize: 13.5, color: "#8CA0C4", lineHeight: 1.7, marginBottom: 36, maxWidth: 300 }}>
          증빙 제출부터 승인, 실시간 집계까지 — 부산소마고 마이스터 역량 인증제를 위한 시스템입니다.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: "auto" }}>
          {["5개 영역 실시간 확인", "AI 1차 검증으로 대기시간 단축", "투명한 승인 이력 관리"].map((text) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#C7D3E8" }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  background: "rgba(84,184,181,.16)",
                  color: "var(--color-success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 11,
                }}
              >
                ✓
              </span>
              {text}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#5D739E" }}>© 2026 부산소프트웨어마이스터고등학교</div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "var(--color-accent-bg)",
              color: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 22,
            }}
          >
            🔒
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 8 }}>로그인</h1>
          <div style={{ fontSize: 13, color: "var(--color-gray-600)", lineHeight: 1.6, marginBottom: 32 }}>
            학교 구글 계정으로만 로그인할 수 있어요.
            <br />
            별도의 회원가입 절차는 없습니다.
          </div>

          {useRealGoogleLogin ? (
            <div style={{ display: "flex", justifyContent: "center" }} ref={googleButtonRef} />
          ) : (
            <form onSubmit={handleMockSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
              <div className="field">
                <label>학교 이메일</label>
                <input
                  type="email"
                  placeholder="student@bssm.hs.kr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>이름</label>
                <input type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="field">
                <label>접근 코드</label>
                <input
                  type="password"
                  placeholder="팀 내부 공유 코드"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? "로그인 중..." : "학교 Google 계정으로 로그인"}
              </button>
              <div style={{ fontSize: 10.5, color: "var(--color-gray-400)", textAlign: "center" }}>
                (Google OAuth 미연동 — 개발용 임시 로그인)
              </div>
            </form>
          )}

          {error && <p style={{ color: "var(--color-danger)", fontSize: 12.5, marginTop: 12 }}>{error}</p>}
          {pendingMessage && <p style={{ color: "var(--color-warning)", fontSize: 12.5, marginTop: 12 }}>{pendingMessage}</p>}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              fontSize: 12,
              color: "var(--color-gray-400)",
              background: "var(--color-gray-50)",
              border: "1px solid var(--color-gray-200)",
              borderRadius: 10,
              padding: "10px 14px",
              marginTop: 20,
            }}
          >
            <b className="mono" style={{ color: "var(--color-gray-600)" }}>
              @bssm.hs.kr
            </b>
            학교 이메일만 로그인 가능
          </div>

          <div style={{ fontSize: 11.5, color: "var(--color-gray-400)", lineHeight: 1.6, marginTop: 18 }}>
            처음 로그인하면 학번·학년·반 정보 입력 화면으로
            <br />
            자동 이동합니다.
          </div>
        </div>
      </div>
    </div>
  );
}

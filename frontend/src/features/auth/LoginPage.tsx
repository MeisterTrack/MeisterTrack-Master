import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getRole, homeRouteForRole, setToken } from "../../lib/auth";
import { login } from "./api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const { access_token } = await login(loginId, password);
      setToken(access_token);
      navigate(homeRouteForRole(getRole()));
    } catch {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: "80px auto", padding: 24 }}>
      <h1 style={{ color: "var(--color-primary)" }}>MeisterTrack 로그인</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="아이디" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
        />
        {error && <p style={{ color: "var(--color-danger)", margin: 0 }}>{error}</p>}
        <button type="submit" style={{ background: "var(--color-primary)", color: "white", padding: 8 }}>
          로그인
        </button>
      </form>
    </div>
  );
}

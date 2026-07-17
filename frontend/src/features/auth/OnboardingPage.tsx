import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { DEPARTMENT_OPTIONS, SUBJECT_OPTIONS } from "../../lib/domains";
import { submitOnboarding } from "./api";

interface LocationState {
  email?: string;
  name?: string;
}

export default function OnboardingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as LocationState) ?? {};

  const [role, setRole] = useState<"student" | "teacher">("student");
  const [grade, setGrade] = useState(1);
  const [classNo, setClassNo] = useState(1);
  const [studentNo, setStudentNo] = useState("");
  const [isHomeroom, setIsHomeroom] = useState(false);
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!state.email || !state.name) {
    return (
      <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
        <p>로그인 정보가 없습니다. 다시 로그인해주세요.</p>
        <Link to="/login" className="tbtn solid">
          로그인으로 이동
        </Link>
      </div>
    );
  }

  const showHomeroomFields = role === "student" || (role === "teacher" && isHomeroom);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitOnboarding({
        email: state.email!,
        name: state.name!,
        role,
        grade: showHomeroomFields ? grade : undefined,
        class_no: showHomeroomFields ? classNo : undefined,
        student_no: role === "student" ? studentNo : undefined,
        department: role === "teacher" && department ? department : undefined,
        subject: role === "teacher" && subject ? subject : undefined,
      });
      setSubmitted(true);
    } catch {
      setError("가입 요청 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 420, margin: "100px auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 10 }}>가입 요청을 보냈어요</h1>
        <p style={{ fontSize: 13, color: "var(--color-gray-600)", lineHeight: 1.7, marginBottom: 24 }}>
          {role === "student"
            ? "담임교사 확인 후 MeisterTrack 이용이 시작됩니다."
            : "관리자 확인 후 MeisterTrack 이용이 시작됩니다."}
        </p>
        <Link to="/login" className="tbtn solid">
          로그인 화면으로
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: "0 24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--color-gray-50)",
          border: "1px solid var(--color-gray-200)",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "var(--color-accent)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {state.name.slice(0, 2)}
        </div>
        <div>
          <b style={{ fontSize: 13, display: "block" }}>{state.name}</b>
          <span className="mono" style={{ fontSize: 11, color: "var(--color-gray-400)" }}>
            {state.email}
          </span>
        </div>
        <span style={{ marginLeft: "auto", color: "var(--color-success)" }}>✓</span>
      </div>

      <h1 style={{ fontSize: 21, fontWeight: 700, marginBottom: 6 }}>추가 정보 입력</h1>
      <div style={{ fontSize: 13, color: "var(--color-gray-600)", marginBottom: 26 }}>
        학교 구글 계정에는 없는 정보만 입력하면 돼요
      </div>

      <div style={{ display: "flex", background: "var(--color-gray-100)", borderRadius: 10, padding: 4, marginBottom: 22 }}>
        {(["student", "teacher"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 12.5,
              fontWeight: 700,
              padding: "9px 0",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: role === r ? "#fff" : "transparent",
              color: role === r ? "var(--color-ink)" : "var(--color-gray-600)",
              boxShadow: role === r ? "0 1px 2px rgba(14,20,32,.08)" : "none",
            }}
          >
            {r === "student" ? "학생" : "교사"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {role === "student" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>학년</label>
                <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                  <option value={1}>1학년</option>
                  <option value={2}>2학년</option>
                  <option value={3}>3학년</option>
                </select>
              </div>
              <div className="field">
                <label>반</label>
                <select value={classNo} onChange={(e) => setClassNo(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}반
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>학번</label>
              <input
                type="text"
                placeholder="20261014"
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {role === "teacher" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14 }}>
              <input type="checkbox" checked={isHomeroom} onChange={(e) => setIsHomeroom(e.target.checked)} />
              담임을 맡고 있어요
            </label>
            {isHomeroom && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>담당 학년</label>
                  <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
                    <option value={1}>1학년</option>
                    <option value={2}>2학년</option>
                    <option value={3}>3학년</option>
                  </select>
                </div>
                <div className="field">
                  <label>담당 반</label>
                  <select value={classNo} onChange={(e) => setClassNo(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}반
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label>담당 부서 (선택)</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">없음</option>
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>담당 교과 (선택)</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">없음</option>
                  {SUBJECT_OPTIONS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {error && <p style={{ color: "var(--color-danger)", fontSize: 12.5 }}>{error}</p>}

        <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "100%", marginTop: 8 }}>
          {submitting ? "처리 중..." : "가입 요청 보내기"}
        </button>
      </form>

      <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--color-gray-400)", marginTop: 18, lineHeight: 1.6 }}>
        입력하신 정보는 {role === "student" ? "담임교사" : "관리자"}에게 전달되어 확인 후
        <br />
        MeisterTrack 이용이 시작됩니다.
      </div>
    </div>
  );
}

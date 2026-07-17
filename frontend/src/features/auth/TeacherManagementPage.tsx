import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import Layout from "../../components/Layout";
import { DEPARTMENT_OPTIONS, SUBJECT_OPTIONS } from "../../lib/domains";
import {
  createTeacher,
  deactivateTeacher,
  listAllTeachers,
  reactivateTeacher,
  TeacherAdminItem,
  updateTeacher,
} from "./api";

const GRADES = [1, 2, 3];
const CLASSES = [1, 2, 3, 4, 5, 6];

export default function TeacherManagementPage() {
  const queryClient = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ["all-teachers"], queryFn: listAllTeachers });

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [isHomeroom, setIsHomeroom] = useState(false);
  const [grade, setGrade] = useState<number | "">("");
  const [classNo, setClassNo] = useState<number | "">("");
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSubject, setEditSubject] = useState("");

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["all-teachers"] });
    queryClient.invalidateQueries({ queryKey: ["teachers"] });
  }

  const createMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setEmail("");
      setName("");
      setDepartment("");
      setSubject("");
      setIsHomeroom(false);
      setGrade("");
      setClassNo("");
      setFormError(null);
    },
    onError: (err: any) => setFormError(err?.response?.data?.error ?? "생성에 실패했습니다."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, department, subject }: { id: number; name: string; department: string; subject: string }) =>
      updateTeacher(id, name, department || undefined, subject || undefined),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateTeacher,
    onSuccess: invalidate,
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateTeacher,
    onSuccess: invalidate,
  });

  function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate({
      email,
      name,
      department: department || undefined,
      subject: subject || undefined,
      grade: isHomeroom && grade !== "" ? Number(grade) : undefined,
      class_no: isHomeroom && classNo !== "" ? Number(classNo) : undefined,
    });
  }

  function startEdit(t: TeacherAdminItem) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditDepartment(t.department ?? "");
    setEditSubject(t.subject ?? "");
  }

  function saveEdit(id: number) {
    updateMutation.mutate({ id, name: editName, department: editDepartment, subject: editSubject });
  }

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>교사 계정 관리</h1>
          <div className="sub">교사 계정을 추가·수정하고 비활성화할 수 있습니다</div>
        </div>
        <button className="tbtn solid" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "닫기" : "+ 교사 추가"}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ padding: 20, marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }} onSubmit={handleCreateSubmit}>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>학교 이메일</label>
              <input type="email" placeholder="teacher@bssm.hs.kr" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>이름</label>
              <input type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>담당 부서 (선택)</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">없음</option>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>담당 교과 (선택)</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="">없음</option>
                {SUBJECT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={isHomeroom} onChange={(e) => setIsHomeroom(e.target.checked)} />
            담임 겸직 (부서/교과와 별개로 학급을 함께 배정할 수 있습니다)
          </label>
          {isHomeroom && (
            <div style={{ display: "flex", gap: 10 }}>
              <div className="field">
                <label>학년</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">선택</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}학년
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>반</label>
                <select value={classNo} onChange={(e) => setClassNo(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">선택</option>
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}반
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {formError && <p style={{ color: "var(--color-danger)", fontSize: 12.5 }}>{formError}</p>}
          <button type="submit" className="tbtn solid" disabled={createMutation.isPending} style={{ alignSelf: "flex-start" }}>
            {createMutation.isPending ? "생성 중..." : "계정 생성"}
          </button>
        </form>
      )}

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>담당 부서</th>
              <th>담당 교과</th>
              <th>담임 학급</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => {
              const isEditing = editingId === t.id;
              const isActive = t.approval_status === "approved";
              return (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700 }}>
                    {isEditing ? (
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: 100 }} />
                    ) : (
                      t.name
                    )}
                  </td>
                  <td style={{ color: "var(--color-gray-400)" }}>{t.email}</td>
                  <td>
                    {isEditing ? (
                      <select value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)}>
                        <option value="">없음</option>
                        {DEPARTMENT_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    ) : (
                      t.department ?? "-"
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select value={editSubject} onChange={(e) => setEditSubject(e.target.value)}>
                        <option value="">없음</option>
                        {SUBJECT_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      t.subject ?? "-"
                    )}
                  </td>
                  <td>{t.grade && t.class_no ? `${t.grade}학년 ${t.class_no}반` : "-"}</td>
                  <td>
                    <span
                      className="status"
                      style={{
                        background: isActive ? "var(--color-success-bg)" : "var(--color-gray-100)",
                        color: isActive ? "var(--color-success)" : "var(--color-gray-400)",
                      }}
                    >
                      <span className="dot" style={{ background: isActive ? "var(--color-success)" : "var(--color-gray-400)" }} />
                      {isActive ? "활성" : "비활성화"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    {isEditing ? (
                      <>
                        <button className="tbtn solid" onClick={() => saveEdit(t.id)}>
                          저장
                        </button>
                        <button className="tbtn" onClick={() => setEditingId(null)}>
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="tbtn" onClick={() => startEdit(t)}>
                          수정
                        </button>
                        {isActive ? (
                          <button className="tbtn" onClick={() => deactivateMutation.mutate(t.id)}>
                            비활성화
                          </button>
                        ) : (
                          <button className="tbtn solid" onClick={() => reactivateMutation.mutate(t.id)}>
                            재활성화
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import Layout from "../../components/Layout";
import { clearHomeroom, listTeachers, setHomeroom, TeacherAdminItem } from "./api";

const GRADES = [1, 2, 3];
const CLASSES = [1, 2, 3, 4, 5, 6];

export default function HomeroomAssignmentPage() {
  const queryClient = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: listTeachers });
  const [pendingSelection, setPendingSelection] = useState<Record<string, string>>({});

  const assignMutation = useMutation({
    mutationFn: ({ teacherId, grade, classNo }: { teacherId: number; grade: number; classNo: number }) =>
      setHomeroom(teacherId, grade, classNo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });

  const clearMutation = useMutation({
    mutationFn: (teacherId: number) => clearHomeroom(teacherId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });

  function currentHomeroom(grade: number, classNo: number): TeacherAdminItem | undefined {
    return teachers.find((t) => t.role === "homeroom_teacher" && t.grade === grade && t.class_no === classNo);
  }

  function handleAssign(grade: number, classNo: number) {
    const key = `${grade}-${classNo}`;
    const teacherId = Number(pendingSelection[key]);
    if (!teacherId) return;
    assignMutation.mutate({ teacherId, grade, classNo });
  }

  return (
    <Layout>
      <div className="topbar">
        <div>
          <h1>담임 배정 관리</h1>
          <div className="sub">학년·반별로 담임교사를 지정하거나 해제합니다</div>
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>학급</th>
              <th>현재 담임</th>
              <th>담임 지정</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {GRADES.flatMap((grade) =>
              CLASSES.map((classNo) => {
                const key = `${grade}-${classNo}`;
                const current = currentHomeroom(grade, classNo);
                return (
                  <tr key={key}>
                    <td style={{ fontWeight: 700 }}>
                      {grade}학년 {classNo}반
                    </td>
                    <td>
                      {current ? (
                        <span>
                          {current.name} <span style={{ color: "var(--color-gray-400)" }}>({current.email})</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-gray-400)" }}>미배정</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={pendingSelection[key] ?? ""}
                        onChange={(e) => setPendingSelection((prev) => ({ ...prev, [key]: e.target.value }))}
                      >
                        <option value="">교사 선택</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.department ?? t.role})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button className="tbtn solid" onClick={() => handleAssign(grade, classNo)}>
                        배정
                      </button>
                      {current && (
                        <button className="tbtn" onClick={() => clearMutation.mutate(current.id)}>
                          해제
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

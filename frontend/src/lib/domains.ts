export const DOMAIN_LABEL: Record<string, string> = {
  basic_job_competency: "직업기초능력",
  technical_competency: "전문기술역량",
  character_work_ethic: "인성/직업의식",
  humanities_literacy: "인문학적 소양",
  foreign_language: "외국어 능력",
};

export const DOMAINS = Object.keys(DOMAIN_LABEL);

export const DEPARTMENT_OPTIONS = ["산학협력부", "전문교육부"];
export const SUBJECT_OPTIONS = ["국어", "영어", "체육"];

export const GRADE_COLOR: Record<string, string> = {
  S: "var(--color-success)",
  A: "var(--color-success)",
  B: "var(--color-warning)",
};

export const GRADE_BG_COLOR: Record<string, string> = {
  S: "var(--color-success-bg)",
  A: "var(--color-success-bg)",
  B: "var(--color-warning-bg)",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "승인 대기",
  approved: "승인완료",
  rejected: "반려",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "var(--color-warning)",
  approved: "var(--color-success)",
  rejected: "var(--color-danger)",
};

export const STATUS_BG_COLOR: Record<string, string> = {
  pending: "var(--color-warning-bg)",
  approved: "var(--color-success-bg)",
  rejected: "var(--color-danger-bg)",
};

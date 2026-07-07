export const DOMAIN_LABEL: Record<string, string> = {
  basic_job_competency: "직업기초능력",
  technical_competency: "전문기술역량",
  character_work_ethic: "인성/직업의식",
  humanities_literacy: "인문학적 소양",
  foreign_language: "외국어 능력",
};

export const DOMAINS = Object.keys(DOMAIN_LABEL);

export const GRADE_COLOR: Record<string, string> = {
  S: "var(--color-success)",
  A: "var(--color-success)",
  B: "var(--color-warning)",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "승인 대기",
  approved: "승인",
  rejected: "반려",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "var(--color-warning)",
  approved: "var(--color-success)",
  rejected: "var(--color-danger)",
};

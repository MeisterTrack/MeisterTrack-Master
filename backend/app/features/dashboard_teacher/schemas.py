from pydantic import BaseModel

from app.common.enums import Domain, Grade


class TeacherDomainSummary(BaseModel):
    domain: Domain
    pending_count: int
    approved_count: int
    rejected_count: int
    average_score: float
    max_score: float
    grade: Grade | None


class TeacherOverviewResponse(BaseModel):
    pending_count: int
    reviewed_today_count: int
    is_homeroom: bool  # 담임 여부는 role이 아니라 grade/class_no 값으로 판단 (담당 영역과 겸직 가능)
    assigned_domains: list[Domain]  # 부서/교과 배정을 통해 담당하는 영역
    homeroom_grade: int | None = None
    homeroom_class_no: int | None = None
    class_student_count: int | None = None
    class_submitted_count: int | None = None
    class_not_submitted_count: int | None = None
    domain_summaries: list[TeacherDomainSummary]

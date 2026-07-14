from pydantic import BaseModel

from app.common.enums import Domain, Grade, Role


class TeacherDomainSummary(BaseModel):
    domain: Domain
    pending_count: int
    approved_count: int
    rejected_count: int
    average_score: float
    max_score: float
    grade: Grade | None


class TeacherOverviewResponse(BaseModel):
    role: Role
    pending_count: int
    reviewed_today_count: int
    assigned_domains: list[Domain]
    homeroom_grade: int | None = None
    homeroom_class_no: int | None = None
    class_student_count: int | None = None
    class_submitted_count: int | None = None
    class_not_submitted_count: int | None = None
    domain_summaries: list[TeacherDomainSummary]

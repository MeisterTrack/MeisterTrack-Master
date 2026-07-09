from datetime import datetime

from pydantic import BaseModel

from app.common.enums import ApprovalStatus, Domain, Grade
from app.features.scoring.schemas import DomainScoreResponse


class StudentDashboardResponse(BaseModel):
    student_id: int
    domain_scores: list[DomainScoreResponse]


class SubmissionDetailItem(BaseModel):
    id: int
    criterion_name: str
    status: ApprovalStatus
    awarded_score: float | None
    max_score: float
    created_at: datetime


class DomainDetail(BaseModel):
    domain: Domain
    total_score: float
    max_score: float
    grade: Grade | None
    submissions: list[SubmissionDetailItem]


class AiRecommendationItem(BaseModel):
    domain: Domain
    kind: str
    message: str


class StudentDetailResponse(BaseModel):
    student_id: int
    name: str
    grade: int | None
    class_no: int | None
    student_no: str | None
    overall_progress_pct: float
    cumulative_score: float
    cumulative_max: float
    grade_a_or_above_count: int
    domains: list[DomainDetail]
    recommendations: list[AiRecommendationItem]

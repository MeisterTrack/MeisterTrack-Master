from datetime import datetime

from pydantic import BaseModel

from app.common.enums import ApprovalStatus, Domain, Grade


class DomainAverage(BaseModel):
    domain: Domain
    average_score: float
    max_score: float
    submission_count: int
    grade: Grade | None


class AdminOverviewResponse(BaseModel):
    total_students: int
    submitted_students: int
    not_submitted_count: int
    total_submissions: int
    pending_count: int
    domain_averages: list[DomainAverage]


class RecentSubmissionItem(BaseModel):
    id: int
    student_id: int
    student_name: str
    criterion_name: str
    domain: Domain
    status: ApprovalStatus
    created_at: datetime

from pydantic import BaseModel

from app.common.enums import Domain


class DomainAverage(BaseModel):
    domain: Domain
    average_score: float
    submission_count: int


class AdminOverviewResponse(BaseModel):
    total_students: int
    submitted_students: int
    not_submitted_count: int
    domain_averages: list[DomainAverage]

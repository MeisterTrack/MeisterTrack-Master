from app.features.scoring.schemas import DomainScoreResponse
from pydantic import BaseModel


class StudentDashboardResponse(BaseModel):
    student_id: int
    domain_scores: list[DomainScoreResponse]

from pydantic import BaseModel

from app.common.enums import Domain, Grade


class ScoringCriterionResponse(BaseModel):
    id: int
    domain: Domain
    name: str
    max_score: float
    applicable_grade: int | None

    model_config = {"from_attributes": True}


class DomainScoreResponse(BaseModel):
    domain: Domain
    total_score: float
    grade: Grade | None

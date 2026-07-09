from pydantic import BaseModel

from app.common.enums import Domain, Grade


class ScoringCriterionResponse(BaseModel):
    id: int
    domain: Domain
    name: str
    max_score: float
    applicable_grade: int | None
    owner_department: str | None

    model_config = {"from_attributes": True}


class ScoringCriterionCreate(BaseModel):
    domain: Domain
    name: str
    max_score: float
    applicable_grade: int | None = None
    owner_department: str | None = None


class ScoringCriterionUpdate(BaseModel):
    name: str | None = None
    max_score: float | None = None
    applicable_grade: int | None = None
    owner_department: str | None = None


class GradeThresholdResponse(BaseModel):
    id: int
    domain: Domain
    grade: Grade
    min_score: float

    model_config = {"from_attributes": True}


class GradeThresholdCreate(BaseModel):
    domain: Domain
    grade: Grade
    min_score: float


class GradeThresholdUpdate(BaseModel):
    min_score: float


class DomainScoreResponse(BaseModel):
    domain: Domain
    total_score: float
    max_score: float
    grade: Grade | None

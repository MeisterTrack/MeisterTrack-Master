from pydantic import BaseModel


class AiReviewResultResponse(BaseModel):
    id: int
    submission_id: int
    suggested_criterion_id: int | None
    confidence: float
    flag: str | None

    model_config = {"from_attributes": True}

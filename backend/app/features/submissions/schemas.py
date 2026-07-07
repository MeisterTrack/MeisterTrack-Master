from datetime import datetime

from pydantic import BaseModel

from app.common.enums import ApprovalStatus, Domain


class SubmissionCreate(BaseModel):
    domain: Domain
    criterion_id: int
    self_reported_text: str | None = None


class SubmissionResponse(BaseModel):
    id: int
    domain: Domain
    criterion_id: int
    file_path: str | None
    self_reported_text: str | None
    status: ApprovalStatus
    reject_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

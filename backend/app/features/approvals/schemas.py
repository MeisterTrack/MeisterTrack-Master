from pydantic import BaseModel

from app.common.enums import Domain


class ApprovalDecision(BaseModel):
    approve: bool
    reject_reason: str | None = None


class TeacherDomainAssignmentCreate(BaseModel):
    teacher_id: int
    domain: Domain


class TeacherDomainAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    domain: Domain

    model_config = {"from_attributes": True}

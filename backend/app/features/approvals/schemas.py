from datetime import datetime

from pydantic import BaseModel

from app.common.enums import ApprovalStatus, Domain


class ApprovalDecision(BaseModel):
    approve: bool
    reject_reason: str | None = None
    awarded_score: float | None = None  # 미지정 시 criterion.max_score 그대로 확정


class QueueItemResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    domain: Domain
    criterion_id: int
    criterion_name: str
    max_score: float
    file_path: str | None
    self_reported_text: str | None
    status: ApprovalStatus
    created_at: datetime


class TeacherDomainAssignmentCreate(BaseModel):
    teacher_id: int
    domain: Domain


class TeacherDomainAssignmentResponse(BaseModel):
    id: int
    teacher_id: int
    domain: Domain

    model_config = {"from_attributes": True}


class BulkGrantCandidate(BaseModel):
    id: int
    name: str
    grade: int | None
    class_no: int | None
    student_no: str | None

    model_config = {"from_attributes": True}


class BulkGrantCreate(BaseModel):
    criterion_id: int
    domain: Domain
    score_per_student: float
    note: str | None = None
    student_ids: list[int]


class BulkGrantResponse(BaseModel):
    id: int
    criterion_id: int
    domain: Domain
    score_per_student: float
    note: str | None
    granted_by: int
    created_at: str
    student_count: int
    students: list[BulkGrantCandidate]

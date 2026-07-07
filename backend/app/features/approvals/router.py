from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.core.deps import get_db, require_role
from app.features.approvals import service
from app.features.approvals.schemas import (
    ApprovalDecision,
    TeacherDomainAssignmentCreate,
    TeacherDomainAssignmentResponse,
)
from app.features.submissions.schemas import SubmissionResponse

router = APIRouter()


@router.get("/queue", response_model=list[SubmissionResponse])
def get_pending_queue(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.AREA_TEACHER, Role.HOMEROOM_TEACHER)),
) -> list[SubmissionResponse]:
    return service.list_pending_queue(db, teacher_id=int(claims["sub"]), role=claims["role"])


@router.post("/{submission_id}/decision", response_model=SubmissionResponse)
def decide_submission(
    submission_id: int,
    decision: ApprovalDecision,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.AREA_TEACHER, Role.HOMEROOM_TEACHER)),
) -> SubmissionResponse:
    return service.decide(db, submission_id, reviewer_id=int(claims["sub"]), decision=decision)


@router.post("/assignments", response_model=TeacherDomainAssignmentResponse)
def create_assignment(
    payload: TeacherDomainAssignmentCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> TeacherDomainAssignmentResponse:
    return service.assign_domain(db, payload)

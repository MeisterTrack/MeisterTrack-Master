from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.core.deps import get_db, require_role
from app.features.approvals import service
from app.features.approvals.schemas import (
    ApprovalDecision,
    BulkGrantCandidate,
    BulkGrantCreate,
    BulkGrantResponse,
    QueueItemResponse,
    TeacherDomainAssignmentCreate,
    TeacherDomainAssignmentResponse,
)
from app.features.submissions.schemas import SubmissionResponse

router = APIRouter()

BULK_GRANT_ROLES = (Role.TEACHER, Role.ADMIN)


@router.get("/queue", response_model=list[QueueItemResponse])
def get_pending_queue(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.TEACHER)),
) -> list[QueueItemResponse]:
    return service.build_queue_response(db, teacher_id=int(claims["sub"]))


@router.post("/{submission_id}/decision", response_model=SubmissionResponse)
def decide_submission(
    submission_id: int,
    decision: ApprovalDecision,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.TEACHER)),
) -> SubmissionResponse:
    return service.decide(db, submission_id, reviewer_id=int(claims["sub"]), decision=decision)


@router.post("/assignments", response_model=TeacherDomainAssignmentResponse)
def create_assignment(
    payload: TeacherDomainAssignmentCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> TeacherDomainAssignmentResponse:
    return service.assign_domain(db, payload)


@router.get("/bulk-grants/candidates", response_model=list[BulkGrantCandidate])
def search_bulk_grant_candidates(
    keyword: str | None = None,
    grade: int | None = None,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(*BULK_GRANT_ROLES)),
) -> list[BulkGrantCandidate]:
    return service.search_bulk_grant_candidates(db, keyword, grade)


@router.post("/bulk-grants", response_model=BulkGrantResponse)
def create_bulk_grant(
    payload: BulkGrantCreate,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(*BULK_GRANT_ROLES)),
) -> BulkGrantResponse:
    grant = service.create_bulk_grant(db, granter_id=int(claims["sub"]), payload=payload)
    students = service.get_bulk_grant_students(db, grant.id)
    return BulkGrantResponse(
        id=grant.id,
        criterion_id=grant.criterion_id,
        domain=grant.domain,
        score_per_student=grant.score_per_student,
        note=grant.note,
        granted_by=grant.granted_by,
        created_at=grant.created_at.isoformat(),
        student_count=len(students),
        students=students,
    )


@router.get("/bulk-grants", response_model=list[BulkGrantResponse])
def list_bulk_grants(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(*BULK_GRANT_ROLES)),
) -> list[BulkGrantResponse]:
    grants = service.list_bulk_grants(db)
    result = []
    for grant in grants:
        students = service.get_bulk_grant_students(db, grant.id)
        result.append(
            BulkGrantResponse(
                id=grant.id,
                criterion_id=grant.criterion_id,
                domain=grant.domain,
                score_per_student=grant.score_per_student,
                note=grant.note,
                granted_by=grant.granted_by,
                created_at=grant.created_at.isoformat(),
                student_count=len(students),
                students=students,
            )
        )
    return result

from sqlalchemy.orm import Session

from app.common.enums import ApprovalStatus, Domain, Role
from app.common.exceptions import InvalidStateError, NotFoundError
from app.features.approvals.models import TeacherDomainAssignment
from app.features.approvals.schemas import ApprovalDecision, TeacherDomainAssignmentCreate
from app.features.audit_log.service import record_audit_log
from app.features.auth.models import User
from app.features.submissions.models import Submission

# 담임교사가 승인하는 영역 — "학교생활·봉사활동·인문 분야" (역할 매트릭스 기준)
HOMEROOM_DOMAINS = [Domain.CHARACTER_WORK_ETHIC, Domain.HUMANITIES_LITERACY]


def get_assigned_domains(db: Session, teacher_id: int) -> list[Domain]:
    rows = db.query(TeacherDomainAssignment.domain).filter(TeacherDomainAssignment.teacher_id == teacher_id).all()
    return [row[0] for row in rows]


def assign_domain(db: Session, payload: TeacherDomainAssignmentCreate) -> TeacherDomainAssignment:
    assignment = TeacherDomainAssignment(teacher_id=payload.teacher_id, domain=payload.domain)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def list_pending_for_area_teacher(db: Session, teacher_id: int) -> list[Submission]:
    domains = get_assigned_domains(db, teacher_id)
    if not domains:
        return []
    return (
        db.query(Submission)
        .filter(Submission.domain.in_(domains), Submission.status == ApprovalStatus.PENDING)
        .order_by(Submission.created_at.asc())
        .all()
    )


def list_pending_for_homeroom_teacher(db: Session, teacher_id: int) -> list[Submission]:
    teacher = db.get(User, teacher_id)
    if teacher is None or teacher.grade is None or teacher.class_no is None:
        return []
    return (
        db.query(Submission)
        .join(User, Submission.student_id == User.id)
        .filter(
            Submission.domain.in_(HOMEROOM_DOMAINS),
            Submission.status == ApprovalStatus.PENDING,
            User.grade == teacher.grade,
            User.class_no == teacher.class_no,
        )
        .order_by(Submission.created_at.asc())
        .all()
    )


def list_pending_queue(db: Session, teacher_id: int, role: str) -> list[Submission]:
    if role == Role.AREA_TEACHER.value:
        return list_pending_for_area_teacher(db, teacher_id)
    if role == Role.HOMEROOM_TEACHER.value:
        return list_pending_for_homeroom_teacher(db, teacher_id)
    return []


def decide(db: Session, submission_id: int, reviewer_id: int, decision: ApprovalDecision) -> Submission:
    submission = db.get(Submission, submission_id)
    if submission is None:
        raise NotFoundError(f"submission {submission_id} not found")
    if submission.status != ApprovalStatus.PENDING:
        raise InvalidStateError("이미 처리된 제출건입니다.")

    submission.status = ApprovalStatus.APPROVED if decision.approve else ApprovalStatus.REJECTED
    submission.reject_reason = None if decision.approve else decision.reject_reason
    db.commit()
    db.refresh(submission)

    record_audit_log(
        db,
        actor_id=reviewer_id,
        action="approve" if decision.approve else "reject",
        target_type="submission",
        target_id=submission.id,
    )
    return submission

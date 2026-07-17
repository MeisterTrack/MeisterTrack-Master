from sqlalchemy.orm import Session

from app.common.enums import ApprovalStatus, Domain, Role
from app.common.exceptions import InvalidStateError, NotFoundError
from app.features.approvals.models import BulkGrant, BulkGrantTarget, TeacherDomainAssignment
from app.features.approvals.schemas import ApprovalDecision, BulkGrantCreate, QueueItemResponse, TeacherDomainAssignmentCreate
from app.features.audit_log.service import record_audit_log
from app.features.auth.models import User
from app.features.scoring.models import ScoringCriterion
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


def list_pending_for_assigned_domains(db: Session, teacher_id: int) -> list[Submission]:
    """부서/교과 배정(TeacherDomainAssignment)에 따른 담당 영역 승인 대기 건."""
    domains = get_assigned_domains(db, teacher_id)
    if not domains:
        return []
    return (
        db.query(Submission)
        .filter(Submission.domain.in_(domains), Submission.status == ApprovalStatus.PENDING)
        .all()
    )


def list_pending_for_homeroom_class(db: Session, teacher_id: int) -> list[Submission]:
    """담임 학급(grade/class_no) 학생의 학교생활·인문 분야 승인 대기 건. 담임 여부는 role이 아닌 grade/class_no로 판단."""
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
        .all()
    )


def list_pending_queue(db: Session, teacher_id: int) -> list[Submission]:
    """담당 영역(부서/교과) 배정분과 담임 학급분을 합쳐서 반환 — 겸직 가능하므로 역할 분기 없이 합집합."""
    merged: dict[int, Submission] = {
        s.id: s for s in [*list_pending_for_assigned_domains(db, teacher_id), *list_pending_for_homeroom_class(db, teacher_id)]
    }
    return sorted(merged.values(), key=lambda s: s.created_at)


def build_queue_response(db: Session, teacher_id: int) -> list[QueueItemResponse]:
    submissions = list_pending_queue(db, teacher_id)
    if not submissions:
        return []

    student_ids = {s.student_id for s in submissions}
    criterion_ids = {s.criterion_id for s in submissions}
    students = {u.id: u for u in db.query(User).filter(User.id.in_(student_ids)).all()}
    criteria = {c.id: c for c in db.query(ScoringCriterion).filter(ScoringCriterion.id.in_(criterion_ids)).all()}

    return [
        QueueItemResponse(
            id=s.id,
            student_id=s.student_id,
            student_name=students[s.student_id].name if s.student_id in students else "알 수 없음",
            domain=s.domain,
            criterion_id=s.criterion_id,
            criterion_name=criteria[s.criterion_id].name if s.criterion_id in criteria else "알 수 없음",
            max_score=float(criteria[s.criterion_id].max_score) if s.criterion_id in criteria else 0.0,
            file_path=s.file_path,
            self_reported_text=s.self_reported_text,
            status=s.status,
            created_at=s.created_at,
        )
        for s in submissions
    ]


def decide(db: Session, submission_id: int, reviewer_id: int, decision: ApprovalDecision) -> Submission:
    submission = db.get(Submission, submission_id)
    if submission is None:
        raise NotFoundError(f"submission {submission_id} not found")
    if submission.status != ApprovalStatus.PENDING:
        raise InvalidStateError("이미 처리된 제출건입니다.")

    submission.status = ApprovalStatus.APPROVED if decision.approve else ApprovalStatus.REJECTED
    submission.reject_reason = None if decision.approve else decision.reject_reason
    if decision.approve:
        if decision.awarded_score is not None:
            submission.awarded_score = decision.awarded_score
        else:
            criterion = db.get(ScoringCriterion, submission.criterion_id)
            submission.awarded_score = float(criterion.max_score) if criterion else None
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


def search_bulk_grant_candidates(db: Session, keyword: str | None, grade: int | None) -> list[User]:
    query = db.query(User).filter(User.role == Role.STUDENT, User.approval_status == ApprovalStatus.APPROVED)
    if keyword:
        like = f"%{keyword}%"
        query = query.filter((User.name.ilike(like)) | (User.student_no.ilike(like)))
    if grade is not None:
        query = query.filter(User.grade == grade)
    return query.order_by(User.grade, User.class_no, User.student_no).all()


def create_bulk_grant(db: Session, granter_id: int, payload: BulkGrantCreate) -> BulkGrant:
    if not payload.student_ids:
        raise InvalidStateError("대상 학생을 1명 이상 선택해야 합니다.")

    grant = BulkGrant(
        criterion_id=payload.criterion_id,
        domain=payload.domain,
        score_per_student=payload.score_per_student,
        note=payload.note,
        granted_by=granter_id,
    )
    db.add(grant)
    db.flush()  # grant.id 확보

    for student_id in payload.student_ids:
        submission = Submission(
            student_id=student_id,
            domain=payload.domain,
            criterion_id=payload.criterion_id,
            self_reported_text=payload.note,
            status=ApprovalStatus.APPROVED,
            awarded_score=payload.score_per_student,
        )
        db.add(submission)
        db.flush()

        db.add(BulkGrantTarget(bulk_grant_id=grant.id, student_id=student_id, submission_id=submission.id))
        record_audit_log(
            db,
            actor_id=granter_id,
            action="bulk_grant",
            target_type="submission",
            target_id=submission.id,
        )

    db.commit()
    db.refresh(grant)
    return grant


def list_bulk_grants(db: Session) -> list[BulkGrant]:
    return db.query(BulkGrant).order_by(BulkGrant.created_at.desc()).all()


def get_bulk_grant_students(db: Session, bulk_grant_id: int) -> list[User]:
    return (
        db.query(User)
        .join(BulkGrantTarget, BulkGrantTarget.student_id == User.id)
        .filter(BulkGrantTarget.bulk_grant_id == bulk_grant_id)
        .all()
    )

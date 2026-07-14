from datetime import datetime, time

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.common.enums import ApprovalStatus, Domain, Role
from app.features.approvals import service as approvals_service
from app.features.audit_log.models import AuditLog
from app.features.auth.models import User
from app.features.dashboard_teacher.schemas import TeacherDomainSummary, TeacherOverviewResponse
from app.features.scoring import service as scoring_service
from app.features.submissions.models import Submission


def _domain_summary(db: Session, domain: Domain, student_ids: list[int] | None) -> TeacherDomainSummary:
    max_score = scoring_service.calculate_domain_max(db, domain)

    if student_ids is not None and not student_ids:
        return TeacherDomainSummary(
            domain=domain,
            pending_count=0,
            approved_count=0,
            rejected_count=0,
            average_score=0.0,
            max_score=max_score,
            grade=None,
        )

    query = db.query(Submission).filter(Submission.domain == domain)
    if student_ids is not None:
        query = query.filter(Submission.student_id.in_(student_ids))

    pending_count = query.filter(Submission.status == ApprovalStatus.PENDING).count()
    approved_count = query.filter(Submission.status == ApprovalStatus.APPROVED).count()
    rejected_count = query.filter(Submission.status == ApprovalStatus.REJECTED).count()

    ids = student_ids if student_ids is not None else [
        row[0] for row in db.query(User.id).filter(User.role == Role.STUDENT).all()
    ]
    average_score = (sum(scoring_service.calculate_domain_total(db, sid, domain) for sid in ids) / len(ids)) if ids else 0.0

    return TeacherDomainSummary(
        domain=domain,
        pending_count=pending_count,
        approved_count=approved_count,
        rejected_count=rejected_count,
        average_score=round(average_score, 1),
        max_score=max_score,
        grade=scoring_service.resolve_grade(db, domain, average_score) if ids else None,
    )


def build_overview(db: Session, teacher: User) -> TeacherOverviewResponse:
    pending_count = len(approvals_service.list_pending_queue(db, teacher.id, teacher.role.value))

    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    reviewed_today_count = (
        db.query(func.count(AuditLog.id))
        .filter(
            AuditLog.actor_id == teacher.id,
            AuditLog.action.in_(["approve", "reject"]),
            AuditLog.created_at >= today_start,
        )
        .scalar()
        or 0
    )

    class_student_count = None
    class_submitted_count = None
    if teacher.role == Role.HOMEROOM_TEACHER:
        domains = approvals_service.HOMEROOM_DOMAINS
        student_ids = [
            row[0]
            for row in db.query(User.id)
            .filter(User.role == Role.STUDENT, User.grade == teacher.grade, User.class_no == teacher.class_no)
            .all()
        ]
        class_student_count = len(student_ids)
        class_submitted_count = (
            db.query(func.count(func.distinct(Submission.student_id)))
            .filter(Submission.student_id.in_(student_ids or [-1]))
            .scalar()
            or 0
        )
    else:
        domains = approvals_service.get_assigned_domains(db, teacher.id)
        student_ids = None  # 전교생 대상 (영역 담당교사는 반 구분 없이 담당 영역 전체를 봄)

    domain_summaries = [_domain_summary(db, domain, student_ids) for domain in domains]

    return TeacherOverviewResponse(
        role=teacher.role,
        pending_count=pending_count,
        reviewed_today_count=reviewed_today_count,
        assigned_domains=domains,
        homeroom_grade=teacher.grade if teacher.role == Role.HOMEROOM_TEACHER else None,
        homeroom_class_no=teacher.class_no if teacher.role == Role.HOMEROOM_TEACHER else None,
        class_student_count=class_student_count,
        class_submitted_count=class_submitted_count,
        class_not_submitted_count=(
            max(class_student_count - class_submitted_count, 0) if class_student_count is not None else None
        ),
        domain_summaries=domain_summaries,
    )

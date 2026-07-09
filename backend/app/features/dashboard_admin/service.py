from sqlalchemy import func
from sqlalchemy.orm import Session

from app.common.enums import ApprovalStatus, Domain, Role
from app.features.auth.models import User
from app.features.dashboard_admin.schemas import AdminOverviewResponse, DomainAverage, RecentSubmissionItem
from app.features.scoring import service as scoring_service
from app.features.scoring.models import ScoringCriterion
from app.features.submissions.models import Submission


def build_overview(db: Session) -> AdminOverviewResponse:
    total_students = db.query(func.count(User.id)).filter(User.role == Role.STUDENT).scalar() or 0
    submitted_students = db.query(func.count(func.distinct(Submission.student_id))).scalar() or 0
    total_submissions = db.query(func.count(Submission.id)).scalar() or 0
    pending_count = (
        db.query(func.count(Submission.id)).filter(Submission.status == ApprovalStatus.PENDING).scalar() or 0
    )

    student_ids = [row[0] for row in db.query(User.id).filter(User.role == Role.STUDENT).all()]

    domain_averages = []
    for domain in Domain:
        submission_count = db.query(func.count(Submission.id)).filter(Submission.domain == domain).scalar() or 0
        max_score = scoring_service.calculate_domain_max(db, domain)

        if student_ids:
            total = sum(scoring_service.calculate_domain_total(db, sid, domain) for sid in student_ids)
            average_score = total / len(student_ids)
        else:
            average_score = 0.0

        domain_averages.append(
            DomainAverage(
                domain=domain,
                average_score=round(average_score, 1),
                max_score=max_score,
                submission_count=submission_count,
                grade=scoring_service.resolve_grade(db, domain, average_score),
            )
        )

    return AdminOverviewResponse(
        total_students=total_students,
        submitted_students=submitted_students,
        not_submitted_count=max(total_students - submitted_students, 0),
        total_submissions=total_submissions,
        pending_count=pending_count,
        domain_averages=domain_averages,
    )


def list_recent_submissions(db: Session, limit: int = 20) -> list[RecentSubmissionItem]:
    rows = (
        db.query(Submission, User, ScoringCriterion)
        .join(User, User.id == Submission.student_id)
        .join(ScoringCriterion, ScoringCriterion.id == Submission.criterion_id)
        .order_by(Submission.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        RecentSubmissionItem(
            id=submission.id,
            student_id=user.id,
            student_name=user.name,
            criterion_name=criterion.name,
            domain=submission.domain,
            status=submission.status,
            created_at=submission.created_at,
        )
        for submission, user, criterion in rows
    ]

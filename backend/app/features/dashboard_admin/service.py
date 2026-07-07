from sqlalchemy import func
from sqlalchemy.orm import Session

from app.common.enums import Domain, Role
from app.features.auth.models import User
from app.features.dashboard_admin.schemas import AdminOverviewResponse, DomainAverage
from app.features.submissions.models import Submission


def build_overview(db: Session) -> AdminOverviewResponse:
    total_students = db.query(func.count(User.id)).filter(User.role == Role.STUDENT).scalar() or 0
    submitted_students = (
        db.query(func.count(func.distinct(Submission.student_id))).scalar() or 0
    )

    domain_averages = []
    for domain in Domain:
        rows = db.query(Submission).filter(Submission.domain == domain).all()
        domain_averages.append(
            DomainAverage(domain=domain, average_score=0.0, submission_count=len(rows))
        )  # TODO: scoring 연동해 실제 평균 점수 계산

    return AdminOverviewResponse(
        total_students=total_students,
        submitted_students=submitted_students,
        not_submitted_count=max(total_students - submitted_students, 0),
        domain_averages=domain_averages,
    )

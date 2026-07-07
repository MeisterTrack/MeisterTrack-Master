from sqlalchemy.orm import Session

from app.common.enums import ApprovalStatus, Domain, Grade
from app.features.scoring.models import GradeThreshold
from app.features.submissions.models import Submission


def calculate_domain_total(db: Session, student_id: int, domain: Domain) -> float:
    approved = (
        db.query(Submission)
        .filter(
            Submission.student_id == student_id,
            Submission.domain == domain,
            Submission.status == ApprovalStatus.APPROVED,
        )
        .all()
    )
    # TODO: criterion.max_score/증빙별 실 배점 로직 연동. 현재는 승인 건수 기준 placeholder.
    return float(len(approved))


def resolve_grade(db: Session, domain: Domain, score: float) -> Grade | None:
    thresholds = (
        db.query(GradeThreshold)
        .filter(GradeThreshold.domain == domain)
        .order_by(GradeThreshold.min_score.desc())
        .all()
    )
    for threshold in thresholds:
        if score >= float(threshold.min_score):
            return threshold.grade
    return None

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.common.enums import ApprovalStatus, Domain, Grade
from app.common.exceptions import NotFoundError
from app.features.scoring.models import GradeThreshold, ScoringCriterion
from app.features.scoring.schemas import (
    GradeThresholdCreate,
    GradeThresholdUpdate,
    ScoringCriterionCreate,
    ScoringCriterionUpdate,
)
from app.features.submissions.models import Submission


def calculate_domain_total(db: Session, student_id: int, domain: Domain) -> float:
    total = (
        db.query(func.sum(func.coalesce(Submission.awarded_score, ScoringCriterion.max_score)))
        .join(ScoringCriterion, ScoringCriterion.id == Submission.criterion_id)
        .filter(
            Submission.student_id == student_id,
            Submission.domain == domain,
            Submission.status == ApprovalStatus.APPROVED,
        )
        .scalar()
    )
    return float(total or 0)


def calculate_domain_max(db: Session, domain: Domain) -> float:
    total = db.query(func.sum(ScoringCriterion.max_score)).filter(ScoringCriterion.domain == domain).scalar()
    return float(total or 0)


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


def next_grade_gap(db: Session, domain: Domain, score: float) -> tuple[Grade, float] | None:
    """다음 등급까지 남은 점수. 이미 최고 등급이면 None."""
    thresholds = (
        db.query(GradeThreshold)
        .filter(GradeThreshold.domain == domain, GradeThreshold.min_score > score)
        .order_by(GradeThreshold.min_score.asc())
        .first()
    )
    if thresholds is None:
        return None
    return thresholds.grade, float(thresholds.min_score) - score


def create_criterion(db: Session, payload: ScoringCriterionCreate) -> ScoringCriterion:
    criterion = ScoringCriterion(**payload.model_dump())
    db.add(criterion)
    db.commit()
    db.refresh(criterion)
    return criterion


def update_criterion(db: Session, criterion_id: int, payload: ScoringCriterionUpdate) -> ScoringCriterion:
    criterion = db.get(ScoringCriterion, criterion_id)
    if criterion is None:
        raise NotFoundError(f"scoring criterion {criterion_id} not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(criterion, field, value)
    db.commit()
    db.refresh(criterion)
    return criterion


def delete_criterion(db: Session, criterion_id: int) -> None:
    criterion = db.get(ScoringCriterion, criterion_id)
    if criterion is None:
        raise NotFoundError(f"scoring criterion {criterion_id} not found")
    db.delete(criterion)
    db.commit()


def create_grade_threshold(db: Session, payload: GradeThresholdCreate) -> GradeThreshold:
    threshold = GradeThreshold(**payload.model_dump())
    db.add(threshold)
    db.commit()
    db.refresh(threshold)
    return threshold


def update_grade_threshold(db: Session, threshold_id: int, payload: GradeThresholdUpdate) -> GradeThreshold:
    threshold = db.get(GradeThreshold, threshold_id)
    if threshold is None:
        raise NotFoundError(f"grade threshold {threshold_id} not found")
    threshold.min_score = payload.min_score
    db.commit()
    db.refresh(threshold)
    return threshold


def delete_grade_threshold(db: Session, threshold_id: int) -> None:
    threshold = db.get(GradeThreshold, threshold_id)
    if threshold is None:
        raise NotFoundError(f"grade threshold {threshold_id} not found")
    db.delete(threshold)
    db.commit()


def list_grade_thresholds(db: Session, domain: Domain | None = None) -> list[GradeThreshold]:
    query = db.query(GradeThreshold)
    if domain is not None:
        query = query.filter(GradeThreshold.domain == domain)
    return query.order_by(GradeThreshold.domain, GradeThreshold.min_score.desc()).all()

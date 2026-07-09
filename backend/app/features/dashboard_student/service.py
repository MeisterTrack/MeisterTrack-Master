from sqlalchemy.orm import Session

from app.common.enums import Domain, Grade
from app.common.exceptions import NotFoundError
from app.features.ai_review.recommendation_service import generate_recommendations
from app.features.auth.models import User
from app.features.dashboard_student.schemas import (
    AiRecommendationItem,
    DomainDetail,
    StudentDashboardResponse,
    StudentDetailResponse,
    SubmissionDetailItem,
)
from app.features.scoring import service as scoring_service
from app.features.scoring.models import ScoringCriterion
from app.features.scoring.schemas import DomainScoreResponse
from app.features.submissions.models import Submission


def build_dashboard(db: Session, student_id: int) -> StudentDashboardResponse:
    domain_scores = []
    for domain in Domain:
        total = scoring_service.calculate_domain_total(db, student_id, domain)
        max_score = scoring_service.calculate_domain_max(db, domain)
        grade = scoring_service.resolve_grade(db, domain, total)
        domain_scores.append(DomainScoreResponse(domain=domain, total_score=total, max_score=max_score, grade=grade))
    return StudentDashboardResponse(student_id=student_id, domain_scores=domain_scores)


def build_student_detail(db: Session, student_id: int) -> StudentDetailResponse:
    student = db.get(User, student_id)
    if student is None:
        raise NotFoundError(f"student {student_id} not found")

    domains: list[DomainDetail] = []
    cumulative_score = 0.0
    cumulative_max = 0.0
    grade_a_or_above_count = 0

    for domain in Domain:
        total = scoring_service.calculate_domain_total(db, student_id, domain)
        max_score = scoring_service.calculate_domain_max(db, domain)
        grade = scoring_service.resolve_grade(db, domain, total)
        cumulative_score += total
        cumulative_max += max_score
        if grade in (Grade.S, Grade.A):
            grade_a_or_above_count += 1

        rows = (
            db.query(Submission, ScoringCriterion)
            .join(ScoringCriterion, ScoringCriterion.id == Submission.criterion_id)
            .filter(Submission.student_id == student_id, Submission.domain == domain)
            .order_by(Submission.created_at.desc())
            .all()
        )
        submissions = [
            SubmissionDetailItem(
                id=submission.id,
                criterion_name=criterion.name,
                status=submission.status,
                awarded_score=submission.awarded_score,
                max_score=float(criterion.max_score),
                created_at=submission.created_at,
            )
            for submission, criterion in rows
        ]

        domains.append(
            DomainDetail(domain=domain, total_score=total, max_score=max_score, grade=grade, submissions=submissions)
        )

    recommendations = [
        AiRecommendationItem(domain=rec.domain, kind=rec.kind, message=rec.message)
        for rec in generate_recommendations(db, student_id)
    ]

    return StudentDetailResponse(
        student_id=student.id,
        name=student.name,
        grade=student.grade,
        class_no=student.class_no,
        student_no=student.student_no,
        overall_progress_pct=round(cumulative_score / cumulative_max * 100, 1) if cumulative_max else 0.0,
        cumulative_score=cumulative_score,
        cumulative_max=cumulative_max,
        grade_a_or_above_count=grade_a_or_above_count,
        domains=domains,
        recommendations=recommendations,
    )

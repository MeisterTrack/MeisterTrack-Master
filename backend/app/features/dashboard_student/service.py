from sqlalchemy.orm import Session

from app.common.enums import Domain
from app.features.dashboard_student.schemas import StudentDashboardResponse
from app.features.scoring import service as scoring_service
from app.features.scoring.schemas import DomainScoreResponse


def build_dashboard(db: Session, student_id: int) -> StudentDashboardResponse:
    domain_scores = []
    for domain in Domain:
        total = scoring_service.calculate_domain_total(db, student_id, domain)
        grade = scoring_service.resolve_grade(db, domain, total)
        domain_scores.append(DomainScoreResponse(domain=domain, total_score=total, grade=grade))
    return StudentDashboardResponse(student_id=student_id, domain_scores=domain_scores)

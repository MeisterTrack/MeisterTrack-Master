from app.common.enums import ApprovalStatus, Domain, Grade
from app.features.scoring import service as scoring_service
from app.features.scoring.models import GradeThreshold
from app.features.submissions.models import Submission


def _make_submission(db, student_id, domain, status):
    submission = Submission(student_id=student_id, domain=domain, criterion_id=1, status=status)
    db.add(submission)
    db.commit()
    return submission


def test_calculate_domain_total_counts_only_approved(db):
    _make_submission(db, 1, Domain.TECHNICAL_COMPETENCY, ApprovalStatus.APPROVED)
    _make_submission(db, 1, Domain.TECHNICAL_COMPETENCY, ApprovalStatus.APPROVED)
    _make_submission(db, 1, Domain.TECHNICAL_COMPETENCY, ApprovalStatus.PENDING)
    _make_submission(db, 1, Domain.TECHNICAL_COMPETENCY, ApprovalStatus.REJECTED)
    _make_submission(db, 2, Domain.TECHNICAL_COMPETENCY, ApprovalStatus.APPROVED)  # 다른 학생

    total = scoring_service.calculate_domain_total(db, student_id=1, domain=Domain.TECHNICAL_COMPETENCY)

    assert total == 2


def test_calculate_domain_total_ignores_other_domains(db):
    _make_submission(db, 1, Domain.TECHNICAL_COMPETENCY, ApprovalStatus.APPROVED)
    _make_submission(db, 1, Domain.FOREIGN_LANGUAGE, ApprovalStatus.APPROVED)

    total = scoring_service.calculate_domain_total(db, student_id=1, domain=Domain.TECHNICAL_COMPETENCY)

    assert total == 1


def _seed_thresholds(db, domain):
    db.add_all(
        [
            GradeThreshold(domain=domain, grade=Grade.S, min_score=90),
            GradeThreshold(domain=domain, grade=Grade.A, min_score=80),
            GradeThreshold(domain=domain, grade=Grade.B, min_score=70),
        ]
    )
    db.commit()


def test_resolve_grade_picks_highest_matching_threshold(db):
    _seed_thresholds(db, Domain.HUMANITIES_LITERACY)

    assert scoring_service.resolve_grade(db, Domain.HUMANITIES_LITERACY, 95) == Grade.S
    assert scoring_service.resolve_grade(db, Domain.HUMANITIES_LITERACY, 85) == Grade.A
    assert scoring_service.resolve_grade(db, Domain.HUMANITIES_LITERACY, 70) == Grade.B


def test_resolve_grade_returns_none_below_lowest_threshold(db):
    _seed_thresholds(db, Domain.HUMANITIES_LITERACY)

    assert scoring_service.resolve_grade(db, Domain.HUMANITIES_LITERACY, 10) is None

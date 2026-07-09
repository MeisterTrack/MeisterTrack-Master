from app.common.enums import ApprovalStatus, Domain, Grade
from app.features.scoring import service as scoring_service
from app.features.scoring.models import GradeThreshold, ScoringCriterion
from app.features.submissions.models import Submission


def _make_criterion(db, domain, max_score):
    criterion = ScoringCriterion(domain=domain, name="테스트 항목", max_score=max_score)
    db.add(criterion)
    db.commit()
    db.refresh(criterion)
    return criterion


def _make_submission(db, student_id, criterion, status, awarded_score=None):
    submission = Submission(
        student_id=student_id,
        domain=criterion.domain,
        criterion_id=criterion.id,
        status=status,
        awarded_score=awarded_score,
    )
    db.add(submission)
    db.commit()
    return submission


def test_calculate_domain_total_sums_only_approved(db):
    c1 = _make_criterion(db, Domain.TECHNICAL_COMPETENCY, max_score=10)
    c2 = _make_criterion(db, Domain.TECHNICAL_COMPETENCY, max_score=5)
    _make_submission(db, 1, c1, ApprovalStatus.APPROVED, awarded_score=10)
    _make_submission(db, 1, c2, ApprovalStatus.APPROVED, awarded_score=5)
    _make_submission(db, 1, c1, ApprovalStatus.PENDING)
    _make_submission(db, 1, c1, ApprovalStatus.REJECTED)
    _make_submission(db, 2, c1, ApprovalStatus.APPROVED, awarded_score=10)  # 다른 학생

    total = scoring_service.calculate_domain_total(db, student_id=1, domain=Domain.TECHNICAL_COMPETENCY)

    assert total == 15


def test_calculate_domain_total_falls_back_to_criterion_max_when_awarded_score_missing(db):
    c1 = _make_criterion(db, Domain.TECHNICAL_COMPETENCY, max_score=10)
    _make_submission(db, 1, c1, ApprovalStatus.APPROVED, awarded_score=None)

    total = scoring_service.calculate_domain_total(db, student_id=1, domain=Domain.TECHNICAL_COMPETENCY)

    assert total == 10


def test_calculate_domain_total_ignores_other_domains(db):
    c1 = _make_criterion(db, Domain.TECHNICAL_COMPETENCY, max_score=10)
    c2 = _make_criterion(db, Domain.FOREIGN_LANGUAGE, max_score=10)
    _make_submission(db, 1, c1, ApprovalStatus.APPROVED, awarded_score=10)
    _make_submission(db, 1, c2, ApprovalStatus.APPROVED, awarded_score=10)

    total = scoring_service.calculate_domain_total(db, student_id=1, domain=Domain.TECHNICAL_COMPETENCY)

    assert total == 10


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


def test_next_grade_gap_returns_points_needed(db):
    _seed_thresholds(db, Domain.HUMANITIES_LITERACY)

    grade, gap = scoring_service.next_grade_gap(db, Domain.HUMANITIES_LITERACY, 74)

    assert grade == Grade.A
    assert gap == 6


def test_next_grade_gap_is_none_at_top_grade(db):
    _seed_thresholds(db, Domain.HUMANITIES_LITERACY)

    assert scoring_service.next_grade_gap(db, Domain.HUMANITIES_LITERACY, 95) is None

from app.common.enums import ApprovalStatus, Domain
from app.features.ai_review.similarity_service import check_book_report
from app.features.submissions.models import Submission


def _make_submission(db, text, criterion_id=1):
    submission = Submission(
        student_id=1,
        domain=Domain.HUMANITIES_LITERACY,
        criterion_id=criterion_id,
        status=ApprovalStatus.PENDING,
        self_reported_text=text,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def test_short_text_flagged_below_min_length(db):
    result = check_book_report(db, submission_id=1, text="너무 짧은 독후감", criterion_id=1)

    assert result.flag == "below_min_length"


def test_long_unique_text_has_no_flag(db):
    long_text = " ".join(f"고유한단어{i}" for i in range(200))

    result = check_book_report(db, submission_id=1, text=long_text, criterion_id=1)

    assert result.flag is None


def test_near_duplicate_text_flagged_as_plagiarism_suspected(db):
    long_text = " ".join(f"동일한단어{i}" for i in range(200))
    other = _make_submission(db, long_text, criterion_id=1)

    result = check_book_report(db, submission_id=other.id + 1, text=long_text, criterion_id=1)

    assert result.flag == "plagiarism_suspected"

from sqlalchemy.orm import Session

from app.common.enums import Domain
from app.db.session import SessionLocal
from app.features.ai_review.models import AiReviewResult
from app.features.ai_review.ocr_service import recommend_criterion_from_image
from app.features.ai_review.similarity_service import check_book_report
from app.features.submissions.models import Submission


def get_result_for_submission(db: Session, submission_id: int) -> AiReviewResult | None:
    return db.query(AiReviewResult).filter(AiReviewResult.submission_id == submission_id).first()


def run_ai_review(db: Session, submission_id: int) -> AiReviewResult | None:
    """제출 직후 백그라운드에서 실행되는 AI 1차 검증. 추천값+신뢰도만 저장하고 최종 확정은 담당교사가 한다."""
    submission = db.get(Submission, submission_id)
    if submission is None:
        return None

    if submission.domain == Domain.HUMANITIES_LITERACY and submission.self_reported_text:
        check = check_book_report(
            db, submission.id, submission.self_reported_text, submission.criterion_id
        )
        result = AiReviewResult(
            submission_id=submission.id,
            suggested_criterion_id=None,
            confidence=check.confidence,
            flag=check.flag,
            raw_model_output=check.raw_model_output,
        )
    elif submission.file_path:
        recommendation = recommend_criterion_from_image(db, submission.file_path, submission.domain)
        result = AiReviewResult(
            submission_id=submission.id,
            suggested_criterion_id=recommendation.suggested_criterion_id,
            confidence=recommendation.confidence,
            flag=None,
            raw_model_output=recommendation.raw_model_output,
        )
    else:
        return None

    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def run_ai_review_in_background(submission_id: int) -> None:
    """BackgroundTasks에서 호출. 요청 스코프 세션이 이미 닫힌 뒤 실행되므로 별도 세션을 연다."""
    db = SessionLocal()
    try:
        run_ai_review(db, submission_id)
    finally:
        db.close()

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.features.submissions.models import Submission

MIN_BOOK_REPORT_LENGTH = 500  # 글자 수 기준. TODO: config 테이블로 이전
SIMILARITY_FLAG_THRESHOLD = 0.6


@dataclass
class BookReportCheckResult:
    confidence: float
    flag: str | None
    raw_model_output: str | None


def check_book_report(db: Session, submission_id: int, text: str, criterion_id: int) -> BookReportCheckResult:
    """독후감 분량/유사도(표절 의심) 검사. 기준 미달/유사도 초과 시 플래그를 반환.

    유사도는 임베딩 없이 자카드 유사도로 근사한다 (외부 API 키 없이도 동작). 정밀 검사는 NIM 임베딩 연동 시 교체.
    """
    if len(text) < MIN_BOOK_REPORT_LENGTH:
        return BookReportCheckResult(confidence=0.2, flag="below_min_length", raw_model_output=None)

    others = (
        db.query(Submission)
        .filter(
            Submission.criterion_id == criterion_id,
            Submission.id != submission_id,
            Submission.self_reported_text.isnot(None),
        )
        .all()
    )

    max_similarity = 0.0
    for other in others:
        max_similarity = max(max_similarity, _jaccard_similarity(text, other.self_reported_text or ""))

    if max_similarity >= SIMILARITY_FLAG_THRESHOLD:
        return BookReportCheckResult(
            confidence=1 - max_similarity,
            flag="plagiarism_suspected",
            raw_model_output=f"max_jaccard_similarity={max_similarity:.2f}",
        )

    return BookReportCheckResult(confidence=0.9, flag=None, raw_model_output=None)


def _jaccard_similarity(a: str, b: str) -> float:
    set_a, set_b = set(a.split()), set(b.split())
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)

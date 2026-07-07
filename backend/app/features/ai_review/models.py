from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AiReviewResult(Base):
    """AI 1차 검증 결과 — 추천값 + 신뢰도만 저장. 최종 점수 확정은 담당교사 승인(approvals)에서 수행."""

    __tablename__ = "ai_review_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id"), index=True)
    suggested_criterion_id: Mapped[int | None] = mapped_column(ForeignKey("scoring_criteria.id"), nullable=True)
    confidence: Mapped[float] = mapped_column(Numeric(4, 3))  # 0.000 ~ 1.000
    flag: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 예: below_min_length, plagiarism_suspected
    raw_model_output: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

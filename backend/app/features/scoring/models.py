from sqlalchemy import Enum, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.common.enums import Domain, Grade
from app.db.base import Base


class ScoringCriterion(Base):
    """영역별 세부 평가요소 및 배점 — 운영계획서 II장을 데이터화한 테이블. 코드에 배점 하드코딩 금지."""

    __tablename__ = "scoring_criteria"

    id: Mapped[int] = mapped_column(primary_key=True)
    domain: Mapped[Domain] = mapped_column(Enum(Domain))
    name: Mapped[str] = mapped_column(String(200))  # 예: "정보처리산업기사"
    max_score: Mapped[float] = mapped_column(Numeric(6, 2))
    applicable_grade: Mapped[int | None] = mapped_column(nullable=True)  # 학년 제한 없으면 NULL


class GradeThreshold(Base):
    """영역별 S/A/B 등급 산정 기준 점수"""

    __tablename__ = "grade_thresholds"

    id: Mapped[int] = mapped_column(primary_key=True)
    domain: Mapped[Domain] = mapped_column(Enum(Domain))
    grade: Mapped[Grade] = mapped_column(Enum(Grade))
    min_score: Mapped[float] = mapped_column(Numeric(6, 2))

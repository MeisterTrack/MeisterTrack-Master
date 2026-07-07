from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.common.enums import ApprovalStatus, Domain
from app.db.base import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    domain: Mapped[Domain] = mapped_column(Enum(Domain))
    criterion_id: Mapped[int] = mapped_column(ForeignKey("scoring_criteria.id"))  # 인증기준표 세부 평가요소
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    self_reported_text: Mapped[str | None] = mapped_column(Text, nullable=True)  # 봉사시간/대회 입상 내역 등 자기입력
    status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

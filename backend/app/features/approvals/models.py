from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.common.enums import Domain
from app.db.base import Base


class TeacherDomainAssignment(Base):
    """영역담당교사가 담당하는 영역 매핑 — 운영계획서 II장 입력담당 기준을 데이터로 관리한다.

    한 교사가 여러 영역을 담당할 수 있어 (teacher_id, domain) 쌍으로 저장.
    """

    __tablename__ = "teacher_domain_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    domain: Mapped[Domain] = mapped_column(Enum(Domain))


class BulkGrant(Base):
    """일괄 점수 부여 이력 (F-7) — 대회 참가/캠프 등 다수 학생에게 동일 항목을 한 번에 부여."""

    __tablename__ = "bulk_grants"

    id: Mapped[int] = mapped_column(primary_key=True)
    criterion_id: Mapped[int] = mapped_column(ForeignKey("scoring_criteria.id"))
    domain: Mapped[Domain] = mapped_column(Enum(Domain))
    score_per_student: Mapped[float] = mapped_column(Numeric(6, 2))
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)  # 공통 증빙자료 설명 (참가자 명단 등)
    granted_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class BulkGrantTarget(Base):
    """일괄 부여 대상 학생별 상세 — 실제로는 개별 Submission을 만들어 연결한다."""

    __tablename__ = "bulk_grant_targets"

    id: Mapped[int] = mapped_column(primary_key=True)
    bulk_grant_id: Mapped[int] = mapped_column(ForeignKey("bulk_grants.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id"))

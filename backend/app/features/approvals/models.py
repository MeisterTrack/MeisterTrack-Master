from sqlalchemy import Enum, ForeignKey
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

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.common.enums import ApprovalStatus, Role
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)  # 학교 Google 계정 (@bssm.hs.kr)
    name: Mapped[str] = mapped_column(String(50))
    role: Mapped[Role] = mapped_column(Enum(Role))
    grade: Mapped[int | None] = mapped_column(nullable=True)  # 학생: 학년(1/2/3) / 담임교사: 담당 학급 학년
    class_no: Mapped[int | None] = mapped_column(nullable=True)  # 학생: 반 / 담임교사: 담당 학급 반
    student_no: Mapped[str | None] = mapped_column(String(20), nullable=True)  # 학생: 학번
    department: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 교사: 담당 부서 (산학협력부/전문교육부 등)
    subject: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 교사: 담당 교과 (국어/영어/체육 등)
    approval_status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)

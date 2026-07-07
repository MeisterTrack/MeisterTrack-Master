from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.common.enums import Role
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    login_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(50))
    role: Mapped[Role] = mapped_column(Enum(Role))
    grade: Mapped[int | None] = mapped_column(nullable=True)  # 학생: 학년(1/2/3)
    class_no: Mapped[int | None] = mapped_column(nullable=True)  # 학생: 반

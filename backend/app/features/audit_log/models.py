from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(50))  # 예: approve, reject, score_update
    target_type: Mapped[str] = mapped_column(String(50))  # 예: submission
    target_id: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

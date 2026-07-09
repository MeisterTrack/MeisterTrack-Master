from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.core.deps import get_db, require_role
from app.features.audit_log.models import AuditLog
from app.features.audit_log.schemas import AuditLogResponse
from app.features.auth.models import User

router = APIRouter()


@router.get("", response_model=list[AuditLogResponse])
def list_audit_logs(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> list[AuditLogResponse]:
    rows = (
        db.query(AuditLog, User)
        .join(User, User.id == AuditLog.actor_id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        AuditLogResponse(
            id=log.id,
            actor_id=log.actor_id,
            actor_name=user.name,
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            created_at=log.created_at,
        )
        for log, user in rows
    ]

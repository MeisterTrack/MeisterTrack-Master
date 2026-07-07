from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.common.enums import Role
from app.core.deps import get_db, require_role
from app.features.audit_log.models import AuditLog
from app.features.audit_log.schemas import AuditLogResponse

router = APIRouter()


@router.get("", response_model=list[AuditLogResponse])
def list_audit_logs(
    db: Session = Depends(get_db),
    claims: dict = Depends(require_role(Role.ADMIN)),
) -> list[AuditLogResponse]:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()

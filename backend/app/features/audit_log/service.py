from sqlalchemy.orm import Session

from app.features.audit_log.models import AuditLog


def record_audit_log(db: Session, actor_id: int, action: str, target_type: str, target_id: int) -> AuditLog:
    log = AuditLog(actor_id=actor_id, action=action, target_type=target_type, target_id=target_id)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

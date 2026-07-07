from app.features.audit_log.models import AuditLog
from app.features.audit_log.service import record_audit_log


def test_record_audit_log_persists_fields(db):
    record_audit_log(db, actor_id=1, action="approve", target_type="submission", target_id=42)

    entries = db.query(AuditLog).all()
    assert len(entries) == 1
    assert entries[0].actor_id == 1
    assert entries[0].action == "approve"
    assert entries[0].target_type == "submission"
    assert entries[0].target_id == 42

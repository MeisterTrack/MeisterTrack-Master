from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    actor_id: int
    actor_name: str
    action: str
    target_type: str
    target_id: int
    created_at: datetime

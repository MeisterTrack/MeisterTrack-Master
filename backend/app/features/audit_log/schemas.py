from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    actor_id: int
    action: str
    target_type: str
    target_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

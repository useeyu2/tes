from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from typing import Optional, Any

class AuditLogCreate(BaseModel):
    action: str
    target_resource: str
    target_id: Optional[str] = None
    actor_id: str
    details: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AuditLogInDB(AuditLogCreate):
    id: Optional[str] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

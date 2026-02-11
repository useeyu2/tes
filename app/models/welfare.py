from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
from bson import ObjectId

class RequestType(str, Enum):
    MEDICAL = "Medical Emergency"
    BEREAVEMENT = "Bereavement"
    WEDDING = "Wedding"
    JOB_LOSS = "Job Loss"
    OTHER = "Other"

class RequestStatus(str, Enum):
    Submitted = "Submitted"
    Under_Review = "Under Review"
    Approved = "Approved"
    Rejected = "Rejected"
    Disbursed = "Disbursed"

class WelfareRequestBase(BaseModel):
    user_id: str
    request_type: RequestType
    amount_requested: float
    description: str
    admin_comments: Optional[str] = None
    status: RequestStatus = RequestStatus.Submitted

class WelfareRequestCreate(WelfareRequestBase):
    pass

class WelfareRequestInDB(WelfareRequestBase):
    id: Optional[str] = Field(alias="_id", default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
from bson import ObjectId

class ContributionStatus(str, Enum):
    PENDING = "Pending"
    PAID = "Paid"
    LATE = "Late"
    WAIVED = "Waived"

class ContributionBase(BaseModel):
    user_id: str
    month: int
    year: int
    amount_due: float = 1000.00
    status: ContributionStatus = ContributionStatus.PENDING
    due_date: datetime

class ContributionCreate(ContributionBase):
    pass

class ContributionUpdate(BaseModel):
    status: Optional[ContributionStatus] = None
    amount_paid: Optional[float] = None
    paid_at: Optional[datetime] = None

class ContributionInDB(ContributionBase):
    id: Optional[str] = Field(alias="_id", default=None)
    amount_paid: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    paid_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
from bson import ObjectId

class PaymentMethod(str, Enum):
    BANK_TRANSFER = "Bank Transfer"
    CASH = "Cash"
    ONLINE = "Online"  # Paystack/Flutterwave

class TransactionStatus(str, Enum):
    PENDING = "Pending"
    VERIFIED = "Verified"
    REJECTED = "Rejected"

class TransactionBase(BaseModel):
    user_id: str
    contribution_id: Optional[str] = None  # Specific contribution being paid for (optional, could be bulk)
    amount: float
    payment_method: PaymentMethod
    reference_number: Optional[str] = None # Bank ref or Transaction ID
    proof_url: Optional[str] = None # URL to uploaded image
    status: TransactionStatus = TransactionStatus.PENDING
    remarks: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionInDB(TransactionBase):
    id: Optional[str] = Field(alias="_id", default=None)
    verified_by: Optional[str] = None # Admin User ID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    verified_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

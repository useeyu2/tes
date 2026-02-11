from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from enum import Enum
from datetime import datetime
from bson import ObjectId

class Role(str, Enum):
    SUPER_ADMIN = "Super Admin"
    CHAIRMAN = "Chairman"
    TREASURER = "Treasurer"
    SECRETARY = "Secretary"
    AUDITOR = "Auditor"
    MEMBER = "Member"

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        json_schema = handler(core_schema)
        json_schema.update(type="string")
        return json_schema

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    graduation_year: Optional[int] = None
    contribution_score: int = 0
    role: Role = Role.MEMBER
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    graduation_year: Optional[int] = None
    role: Optional[Role] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: Optional[str] = Field(alias="_id", default=None)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

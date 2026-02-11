from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core import security, deps
from app.core.config import settings
from app.models.user import UserCreate, UserInDB, UserBase
from app.db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()

@router.post("/login", response_model=dict)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await db.users.find_one({"email": form_data.username})
    if not user or not security.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.get("is_active", True):
         raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user["email"], "role": user.get("role")}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "contribution_score": user.get("contribution_score", 0)
        }
    }

@router.get("/me", response_model=UserInDB)
async def read_users_me(current_user: UserInDB = Depends(deps.get_current_active_user)):
    """
    Get current user details.
    """
    return current_user

@router.post("/register", response_model=UserBase)
async def register_user(
    user_in: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    """
    Create new user without the need to be logged in (Open registration).
    For a closed system, this might be restricted to Admins.
    """
    user = await db.users.find_one({"email": user_in.email})
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    
    user_data = user_in.dict()
    hashed_password = security.get_password_hash(user_in.password)
    del user_data["password"]
    user_data["hashed_password"] = hashed_password
    
    new_user = await db.users.insert_one(user_data)
    created_user = await db.users.find_one({"_id": new_user.inserted_id})
    
    if "_id" in created_user:
        created_user["_id"] = str(created_user["_id"])
        
    return UserBase(**created_user)

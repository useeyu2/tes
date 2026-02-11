from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core import deps, security
from app.models.user import UserInDB, UserUpdate, UserBase, UserCreate, Role
from app.db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pymongo import ReturnDocument

router = APIRouter()

@router.get("/members", response_model=List[UserInDB])
async def list_members(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: UserInDB = Depends(deps.get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {}
    if search:
        query = {
            "$or": [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}}
            ]
        }
    
    users_cursor = db.users.find(query).skip(skip).limit(limit)
    users = await users_cursor.to_list(length=limit)
    
    # Fix ObjectId serialization
    results = []
    for user in users:
        if "_id" in user:
            user["_id"] = str(user["_id"])
        results.append(UserInDB(**user))
        
    return results

@router.post("/members", response_model=UserInDB)
async def create_member(
    user_in: UserCreate,
    current_user: UserInDB = Depends(deps.get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user = await db.users.find_one({"email": user_in.email})
    if user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists",
        )
    
    user_data = user_in.dict()
    hashed_password = security.get_password_hash(user_in.password)
    del user_data["password"]
    user_data["hashed_password"] = hashed_password
    
    new_user = await db.users.insert_one(user_data)
    created_user = await db.users.find_one({"_id": new_user.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    
    return UserInDB(**created_user)

@router.put("/members/{user_id}", response_model=UserInDB)
async def update_member(
    user_id: str,
    user_in: UserUpdate,
    current_user: UserInDB = Depends(deps.get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID")
        
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        hashed_password = security.get_password_hash(update_data["password"])
        update_data["hashed_password"] = hashed_password
        del update_data["password"]
        
    updated_user = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    
    updated_user["_id"] = str(updated_user["_id"])
    return UserInDB(**updated_user)

@router.delete("/members/{user_id}", response_model=dict)
async def deactivate_member(
    user_id: str,
    current_user: UserInDB = Depends(deps.get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Instead of deleting, we might want to just deactivate
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid User ID")
        
    await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False}}
    )
    
    return {"status": "success", "message": "Member deactivated"}

@router.post("/trigger-reminders", dependencies=[Depends(deps.get_current_admin_user)])
async def trigger_reminders(
    current_user: UserInDB = Depends(deps.get_current_admin_user)
):
    from app.services import notification_service
    count = await notification_service.send_reminders()
    return {"message": f"Reminders triggered for {count} members"}

@router.get("/transactions", response_model=List[dict])
async def list_transactions(
    status: Optional[str] = None,
    current_user: UserInDB = Depends(deps.get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {}
    if status:
        query["status"] = status
        
    cursor = db.transactions.find(query).sort("created_at", -1)
    transactions = await cursor.to_list(length=100)
    
    # Enrich with user details (email) for UI display
    # This is a basic N+1 approximation, better to use aggregation in real prod
    results = []
    for tx in transactions:
        tx["_id"] = str(tx["_id"])
        if tx.get("user_id"):
            try:
                user = await db.users.find_one({"_id": ObjectId(tx["user_id"])})
                if user:
                    tx["user_email"] = user.get("email")
                    tx["user_full_name"] = user.get("full_name")
            except:
                pass
        results.append(tx)
        
    return results

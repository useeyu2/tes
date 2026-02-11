from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core import deps
from app.models.user import UserInDB
from app.models.welfare import WelfareRequestInDB, WelfareRequestCreate, RequestStatus
from app.db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from app.services import audit_service

router = APIRouter()

@router.post("/request", response_model=WelfareRequestInDB)
async def create_welfare_request(
    request: WelfareRequestCreate,
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    request.user_id = current_user.id
    new_request = await db.welfare.insert_one(request.dict())
    
    created = await db.welfare.find_one({"_id": new_request.inserted_id})
    created["_id"] = str(created["_id"])
    
    await audit_service.log_action(
        actor_id=current_user.id,
        action="SUBMIT_WELFARE_REQUEST",
        resource="welfare",
        target_id=str(new_request.inserted_id)
    )
    
    return WelfareRequestInDB(**created)

@router.get("/my-requests", response_model=List[WelfareRequestInDB])
async def get_my_requests(
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    cursor = db.welfare.find({"user_id": current_user.id}).sort("created_at", -1)
    requests = await cursor.to_list(length=100)
    
    results = []
    for r in requests:
        r["_id"] = str(r["_id"])
        results.append(WelfareRequestInDB(**r))
    return results

@router.get("/all", dependencies=[Depends(deps.get_current_admin_user)], response_model=List[dict])
async def get_all_requests(
    status: str = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {}
    if status:
        query["status"] = status
        
    cursor = db.welfare.find(query).sort("created_at", -1)
    requests = await cursor.to_list(length=100)
    
    results = []
    for r in requests:
        r["_id"] = str(r["_id"])
        # Enrich with user details
        user = await db.users.find_one({"_id": ObjectId(r["user_id"])})
        if user:
            r["user_name"] = user.get("full_name")
            r["user_email"] = user.get("email")
        results.append(r)
    return results

@router.post("/{request_id}/status", dependencies=[Depends(deps.get_current_admin_user)])
async def update_request_status(
    request_id: str,
    status: RequestStatus,
    comment: str = None,
    current_user: UserInDB = Depends(deps.get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow()
    }
    if comment:
        update_data["admin_comments"] = comment
        
    await db.welfare.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": update_data}
    )
    
    await audit_service.log_action(
        actor_id=current_user.id,
        action=f"WELFARE_UPDATE_{status}",
        resource="welfare",
        target_id=request_id,
        details={"comment": comment}
    )
    
    return {"message": "Status updated"}

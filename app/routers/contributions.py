from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from app.core import deps
from app.models.user import UserInDB, Role
from app.models.contribution import ContributionInDB, ContributionUpdate, ContributionStatus
from app.models.transaction import TransactionInDB, TransactionCreate, TransactionStatus
from app.services import contribution_service, audit_service
from app.db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

router = APIRouter()

# --- Contribution Endpoints ---

@router.post("/generate-monthly", dependencies=[Depends(deps.get_current_admin_user)])
async def trigger_monthly_generation(
    current_user: UserInDB = Depends(deps.get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Admin Trigger: Generate monthly dues for all members manually.
    """
    await contribution_service.generate_monthly_contributions(db)
    await audit_service.log_action(
        actor_id=current_user.id,
        action="GENERATE_CONTRIBUTIONS",
        resource="contributions",
        details={"status": "success"}
    )
    return {"message": "Monthly contribution generation triggered successfully"}

@router.get("/my-contributions", response_model=List[ContributionInDB])
async def get_my_contributions(
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    cursor = db.contributions.find({"user_id": current_user.id}).sort([("year", -1), ("month", -1)])
    contributions = await cursor.to_list(length=100)
    
    results = []
    for c in contributions:
        c["_id"] = str(c["_id"])
        results.append(ContributionInDB(**c))
    return results

# --- Payment/Transaction Endpoints ---

@router.post("/pay", response_model=TransactionInDB)
async def submit_payment(
    transaction: TransactionCreate,
    current_user: UserInDB = Depends(deps.get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Member submits a payment proof or record.
    """
    # Enforce user_id match
    transaction.user_id = current_user.id
    
    # Save Transaction
    tx_data = transaction.dict()
    new_tx = await db.transactions.insert_one(tx_data)
    
    created_tx = await db.transactions.find_one({"_id": new_tx.inserted_id})
    created_tx["_id"] = str(created_tx["_id"])
    
    return TransactionInDB(**created_tx)

@router.post("/verify-payment/{transaction_id}", dependencies=[Depends(deps.get_current_admin_user)])
async def verify_payment(
    transaction_id: str,
    action: str = Query(..., regex="^(approve|reject)$"),
    current_user: UserInDB = Depends(deps.get_current_admin_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not ObjectId.is_valid(transaction_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    tx = await db.transactions.find_one({"_id": ObjectId(transaction_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    new_status = TransactionStatus.VERIFIED if action == "approve" else TransactionStatus.REJECTED
    
    await db.transactions.update_one(
        {"_id": ObjectId(transaction_id)},
        {
            "$set": {
                "status": new_status,
                "verified_by": current_user.id,
                "verified_at": datetime.utcnow()
            }
        }
    )

    # Audit Log
    await audit_service.log_action(
        actor_id=current_user.id,
        action=f"PAYMENT_{action.upper()}",
        resource="transactions",
        target_id=transaction_id,
        details={"amount": tx["amount"], "method": tx["payment_method"]}
    )

    # If approved, update the Contribution record status
    if new_status == TransactionStatus.VERIFIED and tx.get("contribution_id"):
        contribution = await db.contributions.find_one({"_id": ObjectId(tx["contribution_id"])})
        
        await db.contributions.update_one(
            {"_id": ObjectId(tx["contribution_id"])},
            {
                "$set": {
                    "status": ContributionStatus.PAID,
                    "amount_paid": tx["amount"],
                    "paid_at": datetime.utcnow()
                }
            }
        )
        
        # --- Update Contribution Score ---
        points = 0
        if contribution:
            paid_at = datetime.utcnow()
            # Ensure due_date is naive or aware consistent (MongoDB stores naive UTC usually)
            due_date = contribution["due_date"] 
            
            if paid_at <= due_date:
                points = 10 # On Time
            else:
                points = 5 # Late but paid
                
            # Update User Score
            await db.users.update_one(
                {"_id": ObjectId(tx["user_id"])},
                {"$inc": {"contribution_score": points}}
            )
            
            # Log Score Update
            await audit_service.log_action(
                actor_id=current_user.id,
                action="UPDATE_SCORE",
                resource="users",
                target_id=tx["user_id"],
                details={"points_added": points, "reason": "Payment Verified"}
            )
    
    return {"message": f"Payment {action}d successfully"}

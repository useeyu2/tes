from datetime import datetime, timedelta
from app.db.mongodb import get_database
from app.models.contribution import ContributionCreate, ContributionStatus
from app.models.user import Role
from motor.motor_asyncio import AsyncIOMotorDatabase

async def generate_monthly_contributions(db: AsyncIOMotorDatabase):
    """
    Generates contribution records for all active members for the current month.
    Should be run via a scheduler or admin trigger.
    """
    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year
    
    # Establish due date (e.g., 5th of the next month or specific config)
    # User requirement: "Configurable due date". Defaulting to 1st of month creation for now.
    # Logic: Created on 1st, Due on 15th maybe?
    due_date = now + timedelta(days=14) # Simple 2 week grace?
    
    # Find all active members
    async for user in db.users.find({"is_active": True, "role": Role.MEMBER}):
        user_id = str(user["_id"])
        
        # Check if exists
        existing = await db.contributions.find_one({
            "user_id": user_id,
            "month": current_month,
            "year": current_year
        })
        
        if not existing:
            contribution = ContributionCreate(
                user_id=user_id,
                month=current_month,
                year=current_year,
                amount_due=1000.00,
                status=ContributionStatus.PENDING,
                due_date=due_date
            )
            await db.contributions.insert_one(contribution.dict())
            print(f"Generated contribution for User {user_id} - {current_month}/{current_year}")

async def check_late_contributions(db: AsyncIOMotorDatabase):
    """
    Update Pending contributions post-due-date to Late.
    """
    now = datetime.utcnow()
    await db.contributions.update_many(
        {
            "status": ContributionStatus.PENDING,
            "due_date": {"$lt": now}
        },
        {"$set": {"status": ContributionStatus.LATE}}
    )

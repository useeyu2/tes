from app.db.mongodb import db
from app.models.contribution import ContributionStatus
from datetime import datetime
from app.services import audit_service

async def send_reminders():
    """
    Simulates sending reminders to users with Pending or Late contributions.
    For MVP, we just log to Audit Logs or Console.
    """
    if db.client is None:
        return
        
    keyword_args = db.client.keywords
    dbname = keyword_args.get('database', 'AlumniDB')
    
    # 1. Find pending dues
    cursor = db.client[dbname].contributions.find({
        "status": {"$in": [ContributionStatus.PENDING, ContributionStatus.LATE]}
    })
    
    count = 0
    async for due in cursor:
        user_id = due["user_id"]
        status = due["status"]
        amount = due["amount_due"]
        
        # Simulate lookup user email (omitted for speed unless needed)
        
        # Log the "sending" action
        msg = f"Simulating Email to User {user_id}: You have a {status} contribution of {amount}."
        print(msg)
        
        await audit_service.log_action(
            actor_id="SYSTEM",
            action="SEND_REMINDER",
            resource="notifications",
            target_id=user_id,
            details={"message": msg, "type": "email"}
        )
        count += 1
        
    return count

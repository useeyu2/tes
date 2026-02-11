from app.db.mongodb import db
from app.models.audit import AuditLogCreate
from datetime import datetime

async def log_action(actor_id: str, action: str, resource: str, target_id: str = None, details: dict = None):
    """
    Logs an action to the audit collection.
    """
    if db.client is None:
        return # DB not connected

    log_entry = AuditLogCreate(
        actor_id=actor_id,
        action=action,
        target_resource=resource,
        target_id=target_id,
        details=details,
        created_at=datetime.utcnow()
    )
    
    await db.client[db.client.keywords.get('database', 'AlumniDB')].audit_logs.insert_one(log_entry.dict())

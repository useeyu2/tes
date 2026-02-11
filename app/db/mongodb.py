from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None

    def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGODB_URL)
        print("Connected to MongoDB via Motor")

    def split_db_from_uri(self):
        """
        Helper to extract db name if needed, but we use settings.DATABASE_NAME
        """
        pass

    def close(self):
        if self.client:
            self.client.close()
            print("Closed MongoDB connection")

db = Database()

async def get_database():
    return db.client[settings.DATABASE_NAME]

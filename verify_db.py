import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def ping_server():
    mongo_url = os.getenv("MONGODB_URL")
    if not mongo_url:
        print("MONGODB_URL not found in .env")
        return

    print(f"Connecting to... {mongo_url[:20]}...")
    client = AsyncIOMotorClient(mongo_url)
    try:
        await client.admin.command('ping')
        print("PING SUCCESS: Successfully connected to MongoDB!")
    except Exception as e:
        print(f"PING FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(ping_server())

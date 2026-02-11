from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.mongodb import db
from app.routers import auth, admin, contributions, views, welfare
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db.connect()
    yield
    # Shutdown
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["authentication"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(contributions.router, prefix=f"{settings.API_V1_STR}/contributions", tags=["contributions"])
app.include_router(welfare.router, prefix=f"{settings.API_V1_STR}/welfare", tags=["welfare"])
app.include_router(views.router, tags=["views"])

@app.get("/health")
async def health_check():
    try:
        # Ping database
        await db.client.admin.command('ping')
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}

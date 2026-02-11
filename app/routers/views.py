from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="app/templates")

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request})

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request})

@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("auth/register.html", {"request": request})

@router.get("/dashboard", response_class=HTMLResponse)
async def member_dashboard(request: Request):
    return templates.TemplateResponse("member/dashboard.html", {"request": request})

@router.get("/admin/dashboard", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    return templates.TemplateResponse("admin/members.html", {"request": request})

@router.get("/admin/payments", response_class=HTMLResponse)
async def admin_payments(request: Request):
    return templates.TemplateResponse("admin/payments.html", {"request": request})

@router.get("/welfare", response_class=HTMLResponse)
async def member_welfare(request: Request):
    return templates.TemplateResponse("member/welfare.html", {"request": request})

@router.get("/admin/welfare", response_class=HTMLResponse)
async def admin_welfare(request: Request):
    return templates.TemplateResponse("admin/welfare.html", {"request": request})

from fastapi import APIRouter, HTTPException, status

from app.schemas.admin import AdminLoginRequest, AdminLoginResponse


router = APIRouter()

# Фиксированные креденшалы для админа
ADMIN_LOGIN = "admin"
ADMIN_PASSWORD = "admin123"
ADMIN_TOKEN = "simple_admin_token_cybertrax_2025"


@router.post("/login", response_model=AdminLoginResponse)
def adminLogin(payload: AdminLoginRequest) -> AdminLoginResponse:
    if payload.login != ADMIN_LOGIN or payload.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid credentials"}
        )
    return AdminLoginResponse(token=ADMIN_TOKEN, admin_id=1)


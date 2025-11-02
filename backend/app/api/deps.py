from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session

from app.infra.db import getSession
from app.infra.security import verifyPassword
from app.repositories.admin_repo import AdminRepository


security = HTTPBasic()

# Фиксированный токен для админа
ADMIN_TOKEN = "simple_admin_token_cybertrax_2025"


def requireAdmin(
    credentials: HTTPBasicCredentials = Depends(security),
    session: Session = Depends(getSession),
) -> None:
    repo = AdminRepository(session)
    admin = repo.getByLogin(credentials.username)
    if admin is None or not verifyPassword(credentials.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "Unauthorized"})
    return None


def requireAdminToken(authorization: str = Header(default=None)) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Missing or invalid authorization header"}
        )
    token = authorization.replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Invalid token"}
        )
    return None



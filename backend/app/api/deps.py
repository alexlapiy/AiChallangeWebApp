from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session

from app.infra.db import getSession
from app.infra.security import verifyPassword
from app.repositories.admin_repo import AdminRepository


security = HTTPBasic()


def requireAdmin(
    credentials: HTTPBasicCredentials = Depends(security),
    session: Session = Depends(getSession),
) -> None:
    repo = AdminRepository(session)
    admin = repo.getByLogin(credentials.username)
    if admin is None or not verifyPassword(credentials.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"error": "Unauthorized"})
    return None



from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.infra.db import getSession
from app.repositories.models import User
from app.schemas.user import UserCreate, UserDto


router = APIRouter()


@router.post("", response_model=UserDto, status_code=status.HTTP_201_CREATED)
def createUser(payload: UserCreate, session: Session = Depends(getSession)) -> UserDto:
    obj = User(full_name=payload.full_name, phone=payload.phone)
    session.add(obj)
    session.flush()
    return UserDto.model_validate(obj)


@router.get("", response_model=list[UserDto])
def listUsers(session: Session = Depends(getSession)) -> list[UserDto]:
    items = session.query(User).order_by(User.id.desc()).all()
    return [UserDto.model_validate(x) for x in items]


@router.get("/{user_id}", response_model=UserDto)
def getUser(user_id: int, session: Session = Depends(getSession)) -> UserDto:
    obj = session.get(User, user_id)
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    return UserDto.model_validate(obj)



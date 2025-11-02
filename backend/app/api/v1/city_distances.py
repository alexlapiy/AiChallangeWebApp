from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.infra.db import getSession
from app.repositories.city_distance_repo import CityDistanceRepository
from app.schemas.city_distance import CityDistanceDto, CityDistanceCreate, CityDistanceUpdate
from app.api.deps import requireAdmin

router = APIRouter()


@router.get("", response_model=list[CityDistanceDto])
def listDistances(session: Session = Depends(getSession)) -> list[CityDistanceDto]:
    repo = CityDistanceRepository(session)
    items = repo.listAll()
    return [CityDistanceDto.model_validate(x) for x in items]


@router.post("", response_model=CityDistanceDto, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requireAdmin)])
def createDistance(payload: CityDistanceCreate, session: Session = Depends(getSession)) -> CityDistanceDto:
    repo = CityDistanceRepository(session)
    
    # Проверяем, не существует ли уже расстояние между этими городами
    existing = repo.find(payload.from_city_id, payload.to_city_id)
    if existing:
        raise HTTPException(status_code=400, detail={"error": "Distance between these cities already exists"})
    
    obj = repo.create(
        from_city_id=payload.from_city_id,
        to_city_id=payload.to_city_id,
        distance_km=payload.distance_km,
        is_manual=payload.is_manual
    )
    return CityDistanceDto.model_validate(obj)


@router.put("/{distance_id}", response_model=CityDistanceDto, dependencies=[Depends(requireAdmin)])
def updateDistance(distance_id: int, payload: CityDistanceUpdate, session: Session = Depends(getSession)) -> CityDistanceDto:
    from app.repositories.models import CityDistance
    
    obj = session.get(CityDistance, distance_id)
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Distance not found"})
    
    if payload.distance_km is not None:
        obj.distance_km = payload.distance_km
    if payload.is_manual is not None:
        obj.is_manual = payload.is_manual
    
    session.add(obj)
    session.flush()
    return CityDistanceDto.model_validate(obj)


@router.delete("/{distance_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(requireAdmin)])
def deleteDistance(distance_id: int, session: Session = Depends(getSession)) -> None:
    repo = CityDistanceRepository(session)
    repo.delete(distance_id)


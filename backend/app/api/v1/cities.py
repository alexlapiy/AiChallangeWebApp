from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.infra.db import getSession
from app.repositories.models import City
from app.repositories.city_repo import CityRepository
from app.schemas.city import CityCreate, CityDto, CityUpdate
from app.api.deps import requireAdmin


router = APIRouter()


@router.get("", response_model=list[CityDto])
def listCities(session: Session = Depends(getSession)) -> list[CityDto]:
    repo = CityRepository(session)
    items = repo.listAll()
    return [CityDto.model_validate(x) for x in items]


@router.post("", response_model=CityDto, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requireAdmin)])
def createCity(payload: CityCreate, session: Session = Depends(getSession)) -> CityDto:
    obj = City(
        name=payload.name,
        is_active=payload.is_active,
        latitude=payload.latitude,
        longitude=payload.longitude
    )
    session.add(obj)
    session.flush()
    return CityDto.model_validate(obj)


@router.put("/{city_id}", response_model=CityDto, dependencies=[Depends(requireAdmin)])
def updateCity(city_id: int, payload: CityUpdate, session: Session = Depends(getSession)) -> CityDto:
    obj = session.get(City, city_id)
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "City not found"})
    if payload.name is not None:
        obj.name = payload.name
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    if payload.latitude is not None:
        obj.latitude = payload.latitude
    if payload.longitude is not None:
        obj.longitude = payload.longitude
    session.add(obj)
    session.flush()
    return CityDto.model_validate(obj)


@router.delete("/{city_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(requireAdmin)])
def deleteCity(city_id: int, session: Session = Depends(getSession)) -> None:
    obj = session.get(City, city_id)
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "City not found"})
    session.delete(obj)



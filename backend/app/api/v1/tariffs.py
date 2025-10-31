from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.infra.db import getSession
from app.repositories.models import Tariff
from app.schemas.tariff import TariffCreate, TariffDto, TariffUpdate


router = APIRouter()


@router.get("", response_model=list[TariffDto])
def listTariffs(session: Session = Depends(getSession)) -> list[TariffDto]:
    items = session.query(Tariff).order_by(Tariff.month.asc()).all()
    return [TariffDto.model_validate(x) for x in items]


@router.post("", response_model=TariffDto, status_code=status.HTTP_201_CREATED)
def createTariff(payload: TariffCreate, session: Session = Depends(getSession)) -> TariffDto:
    obj = Tariff(
        month=payload.month,
        price_per_km_le_1000=payload.price_per_km_le_1000,
        price_per_km_gt_1000=payload.price_per_km_gt_1000,
    )
    session.add(obj)
    session.flush()
    return TariffDto.model_validate(obj)


@router.put("/{tariff_id}", response_model=TariffDto)
def updateTariff(tariff_id: int, payload: TariffUpdate, session: Session = Depends(getSession)) -> TariffDto:
    obj = session.get(Tariff, tariff_id)
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Tariff not found"})
    if payload.month is not None:
        obj.month = payload.month
    if payload.price_per_km_le_1000 is not None:
        obj.price_per_km_le_1000 = payload.price_per_km_le_1000
    if payload.price_per_km_gt_1000 is not None:
        obj.price_per_km_gt_1000 = payload.price_per_km_gt_1000
    session.add(obj)
    session.flush()
    return TariffDto.model_validate(obj)


@router.delete("/{tariff_id}", status_code=status.HTTP_204_NO_CONTENT)
def deleteTariff(tariff_id: int, session: Session = Depends(getSession)) -> None:
    obj = session.get(Tariff, tariff_id)
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Tariff not found"})
    session.delete(obj)



from datetime import date
from typing import Iterable

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.infra.db import getSession
from app.infra.distance.provider import OfflineMatrixProvider
from app.repositories.models import Order, PaymentStatus
from app.repositories.order_repo import OrderRepository
from app.schemas.order import (
    OrderCreate,
    OrderDto,
    OrderPreviewRequest,
    OrderPreviewResponse,
)
from app.services.pricing_service import PricingService


router = APIRouter()


@router.post("/preview", response_model=OrderPreviewResponse)
def previewOrder(payload: OrderPreviewRequest, session: Session = Depends(getSession)) -> OrderPreviewResponse:
    provider = OfflineMatrixProvider()
    service = PricingService(session, provider)
    res = service.preview(payload.start_date, payload.from_city, payload.to_city)
    return OrderPreviewResponse(**res.__dict__)


@router.post("", response_model=OrderDto, status_code=status.HTTP_201_CREATED)
def createOrder(payload: OrderCreate, session: Session = Depends(getSession)) -> OrderDto:
    provider = OfflineMatrixProvider()
    service = PricingService(session, provider)
    order = service.createOrder(
        user_id=payload.user_id,
        car_brand_model=payload.car_brand_model,
        start_date=payload.start_date,
        from_city_id=payload.from_city_id,
        to_city_id=payload.to_city_id,
        from_city_name=payload.from_city,
        to_city_name=payload.to_city,
    )
    session.flush()
    return OrderDto.model_validate(order)


@router.get("", response_model=list[OrderDto])
def listOrders(
    start_from: date | None = Query(default=None),
    start_to: date | None = Query(default=None),
    from_city_id: int | None = Query(default=None),
    to_city_id: int | None = Query(default=None),
    payment_status: PaymentStatus | None = Query(default=None),
    order_by_cost: bool = Query(default=False),
    session: Session = Depends(getSession),
) -> Iterable[OrderDto]:
    repo = OrderRepository(session)
    items = repo.query(
        start_from=start_from,
        start_to=start_to,
        from_city_id=from_city_id,
        to_city_id=to_city_id,
        payment_status=payment_status,
        order_by_cost=order_by_cost,
    )
    return [OrderDto.model_validate(x) for x in items]


@router.get("/{order_id}", response_model=OrderDto)
def getOrder(order_id: int, session: Session = Depends(getSession)) -> OrderDto:
    obj = session.get(Order, order_id)
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    return OrderDto.model_validate(obj)


@router.post("/{order_id}/pay", response_model=OrderDto)
def payOrder(order_id: int, session: Session = Depends(getSession)) -> OrderDto:
    obj = session.get(Order, order_id)
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    obj.payment_status = PaymentStatus.PAID
    session.add(obj)
    session.flush()
    return OrderDto.model_validate(obj)


@router.patch("/{order_id}/payment-status", response_model=OrderDto)
def setPaymentStatus(
    order_id: int,
    new_status: PaymentStatus,
    session: Session = Depends(getSession),
) -> OrderDto:
    obj = session.get(Order, order_id)
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    obj.payment_status = new_status
    session.add(obj)
    session.flush()
    return OrderDto.model_validate(obj)



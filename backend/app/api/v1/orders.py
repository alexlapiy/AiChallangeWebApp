from datetime import date
from typing import Iterable

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.infra.db import getSession
from app.infra.distance.provider import HybridDistanceProvider
from app.repositories.models import Order, PaymentStatus
from app.repositories.order_repo import OrderRepository
from app.schemas.order import (
    OrderCreate,
    OrderDto,
    OrderPreviewRequest,
    OrderPreviewResponse,
    PaginatedOrdersResponse,
)
from app.services.pricing_service import PricingService
from app.api.deps import requireAdmin, requireAdminToken


router = APIRouter()


@router.post("/preview", response_model=OrderPreviewResponse)
def previewOrder(payload: OrderPreviewRequest, session: Session = Depends(getSession)) -> OrderPreviewResponse:
    provider = HybridDistanceProvider(session)
    service = PricingService(session, provider)
    res = service.preview(payload.start_date, payload.from_city, payload.to_city)
    return OrderPreviewResponse(**res.__dict__)


@router.post("", response_model=OrderDto, status_code=status.HTTP_201_CREATED)
def createOrder(payload: OrderCreate, session: Session = Depends(getSession)) -> OrderDto:
    from app.repositories.models import User
    
    provider = HybridDistanceProvider(session)
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
    
    # Загружаем данные пользователя
    user = session.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail={"error": "User not found"})
    
    return OrderDto(
        id=order.id,
        created_at=order.created_at,
        updated_at=order.updated_at,
        user_id=order.user_id,
        user_full_name=user.full_name,
        user_phone=user.phone,
        car_brand_model=order.car_brand_model,
        from_city_id=order.from_city_id,
        to_city_id=order.to_city_id,
        start_date=order.start_date,
        distance_km=order.distance_km,
        applied_price_per_km=order.applied_price_per_km,
        is_fixed_route=order.is_fixed_route,
        transport_price=order.transport_price,
        insurance_price=order.insurance_price,
        duration_hours=order.duration_hours,
        duration_days=order.duration_days,
        duration_hours_remainder=order.duration_hours_remainder,
        eta_date=order.eta_date,
        payment_status=order.payment_status,
    )


@router.get("", response_model=PaginatedOrdersResponse)
def listOrders(
    user_id: int | None = Query(default=None),
    start_from: date | None = Query(default=None),
    start_to: date | None = Query(default=None),
    from_city_id: int | None = Query(default=None),
    to_city_id: int | None = Query(default=None),
    payment_status: PaymentStatus | None = Query(default=None),
    order_by_cost: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(getSession),
) -> PaginatedOrdersResponse:
    repo = OrderRepository(session)
    result = repo.query(
        user_id=user_id,
        start_from=start_from,
        start_to=start_to,
        from_city_id=from_city_id,
        to_city_id=to_city_id,
        payment_status=payment_status,
        order_by_cost=order_by_cost,
        page=page,
        limit=limit,
    )
    
    items_dto = []
    for order in result.items:
        dto_dict = {
            "id": order.id,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "user_id": order.user_id,
            "user_full_name": order.user.full_name,
            "user_phone": order.user.phone,
            "car_brand_model": order.car_brand_model,
            "from_city_id": order.from_city_id,
            "to_city_id": order.to_city_id,
            "start_date": order.start_date,
            "distance_km": order.distance_km,
            "applied_price_per_km": order.applied_price_per_km,
            "is_fixed_route": order.is_fixed_route,
            "transport_price": order.transport_price,
            "insurance_price": order.insurance_price,
            "duration_hours": order.duration_hours,
            "duration_days": order.duration_days,
            "duration_hours_remainder": order.duration_hours_remainder,
            "eta_date": order.eta_date,
            "payment_status": order.payment_status,
        }
        items_dto.append(OrderDto(**dto_dict))
    
    total_pages = (result.total + limit - 1) // limit
    
    return PaginatedOrdersResponse(
        items=items_dto,
        total=result.total,
        page=page,
        limit=limit,
        pages=total_pages,
    )


@router.get("/{order_id}", response_model=OrderDto)
def getOrder(order_id: int, session: Session = Depends(getSession)) -> OrderDto:
    repo = OrderRepository(session)
    obj = session.query(Order).filter(Order.id == order_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    
    dto_dict = {
        "id": obj.id,
        "created_at": obj.created_at,
        "updated_at": obj.updated_at,
        "user_id": obj.user_id,
        "user_full_name": obj.user.full_name,
        "user_phone": obj.user.phone,
        "car_brand_model": obj.car_brand_model,
        "from_city_id": obj.from_city_id,
        "to_city_id": obj.to_city_id,
        "start_date": obj.start_date,
        "distance_km": obj.distance_km,
        "applied_price_per_km": obj.applied_price_per_km,
        "is_fixed_route": obj.is_fixed_route,
        "transport_price": obj.transport_price,
        "insurance_price": obj.insurance_price,
        "duration_hours": obj.duration_hours,
        "duration_days": obj.duration_days,
        "duration_hours_remainder": obj.duration_hours_remainder,
        "eta_date": obj.eta_date,
        "payment_status": obj.payment_status,
    }
    return OrderDto(**dto_dict)


@router.post("/{order_id}/pay", response_model=OrderDto)
def payOrder(order_id: int, session: Session = Depends(getSession)) -> OrderDto:
    obj = session.query(Order).filter(Order.id == order_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    obj.payment_status = PaymentStatus.PAID
    session.add(obj)
    session.flush()
    
    dto_dict = {
        "id": obj.id,
        "created_at": obj.created_at,
        "updated_at": obj.updated_at,
        "user_id": obj.user_id,
        "user_full_name": obj.user.full_name,
        "user_phone": obj.user.phone,
        "car_brand_model": obj.car_brand_model,
        "from_city_id": obj.from_city_id,
        "to_city_id": obj.to_city_id,
        "start_date": obj.start_date,
        "distance_km": obj.distance_km,
        "applied_price_per_km": obj.applied_price_per_km,
        "is_fixed_route": obj.is_fixed_route,
        "transport_price": obj.transport_price,
        "insurance_price": obj.insurance_price,
        "duration_hours": obj.duration_hours,
        "duration_days": obj.duration_days,
        "duration_hours_remainder": obj.duration_hours_remainder,
        "eta_date": obj.eta_date,
        "payment_status": obj.payment_status,
    }
    return OrderDto(**dto_dict)


@router.patch("/{order_id}/payment-status", response_model=OrderDto, dependencies=[Depends(requireAdminToken)])
def setPaymentStatus(
    order_id: int,
    new_status: PaymentStatus,
    session: Session = Depends(getSession),
) -> OrderDto:
    obj = session.query(Order).filter(Order.id == order_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    obj.payment_status = new_status
    session.add(obj)
    session.flush()
    
    dto_dict = {
        "id": obj.id,
        "created_at": obj.created_at,
        "updated_at": obj.updated_at,
        "user_id": obj.user_id,
        "user_full_name": obj.user.full_name,
        "user_phone": obj.user.phone,
        "car_brand_model": obj.car_brand_model,
        "from_city_id": obj.from_city_id,
        "to_city_id": obj.to_city_id,
        "start_date": obj.start_date,
        "distance_km": obj.distance_km,
        "applied_price_per_km": obj.applied_price_per_km,
        "is_fixed_route": obj.is_fixed_route,
        "transport_price": obj.transport_price,
        "insurance_price": obj.insurance_price,
        "duration_hours": obj.duration_hours,
        "duration_days": obj.duration_days,
        "duration_hours_remainder": obj.duration_hours_remainder,
        "eta_date": obj.eta_date,
        "payment_status": obj.payment_status,
    }
    return OrderDto(**dto_dict)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(requireAdmin)])
def deleteOrder(order_id: int, session: Session = Depends(getSession)) -> None:
    obj = session.query(Order).filter(Order.id == order_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    session.delete(obj)



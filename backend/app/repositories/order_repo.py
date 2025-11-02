from datetime import date
from typing import Optional
import math

from sqlalchemy.orm import Session, joinedload

from app.repositories.base import SqlAlchemyRepository
from app.repositories.models import Order, PaymentStatus, User


class OrderQueryResult:
    def __init__(self, items: list[Order], total: int):
        self.items = items
        self.total = total


class OrderRepository(SqlAlchemyRepository[Order]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Order)

    def query(
        self,
        user_id: Optional[int] = None,
        start_from: Optional[date] = None,
        start_to: Optional[date] = None,
        from_city_id: Optional[int] = None,
        to_city_id: Optional[int] = None,
        payment_status: Optional[PaymentStatus] = None,
        order_by_cost: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> OrderQueryResult:
        q = self.session.query(Order).options(joinedload(Order.user))
        
        if user_id is not None:
            q = q.filter(Order.user_id == user_id)
        if start_from is not None:
            q = q.filter(Order.start_date >= start_from)
        if start_to is not None:
            q = q.filter(Order.start_date <= start_to)
        if from_city_id is not None:
            q = q.filter(Order.from_city_id == from_city_id)
        if to_city_id is not None:
            q = q.filter(Order.to_city_id == to_city_id)
        if payment_status is not None:
            q = q.filter(Order.payment_status == payment_status)
        
        # Получаем общее количество
        total = q.count()
        
        # Сортировка
        if order_by_cost:
            q = q.order_by(Order.transport_price.desc())
        else:
            q = q.order_by(Order.start_date.desc())
        
        # Пагинация
        offset = (page - 1) * limit
        items = q.offset(offset).limit(limit).all()
        
        return OrderQueryResult(items=items, total=total)



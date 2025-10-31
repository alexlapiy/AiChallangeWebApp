from datetime import date
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.repositories.base import SqlAlchemyRepository
from app.repositories.models import Order, PaymentStatus


class OrderRepository(SqlAlchemyRepository[Order]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Order)

    def query(
        self,
        start_from: Optional[date] = None,
        start_to: Optional[date] = None,
        from_city_id: Optional[int] = None,
        to_city_id: Optional[int] = None,
        payment_status: Optional[PaymentStatus] = None,
        order_by_cost: bool = False,
    ) -> Iterable[Order]:
        q = self.session.query(Order)
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
        if order_by_cost:
            q = q.order_by(Order.transport_price.desc())
        else:
            q = q.order_by(Order.start_date.desc())
        return q.all()



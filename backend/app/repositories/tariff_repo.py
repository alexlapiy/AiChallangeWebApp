from datetime import date

from sqlalchemy.orm import Session

from app.repositories.base import SqlAlchemyRepository
from app.repositories.models import Tariff


class TariffRepository(SqlAlchemyRepository[Tariff]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Tariff)

    def getForDate(self, start_date: date) -> Tariff | None:
        month = start_date.month
        return (
            self.session.query(Tariff)
            .filter(Tariff.month == month)
            .order_by(Tariff.id.desc())
            .first()
        )



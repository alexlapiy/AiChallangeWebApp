from typing import Iterable

from sqlalchemy.orm import Session

from app.repositories.base import SqlAlchemyRepository
from app.repositories.models import City


class CityRepository(SqlAlchemyRepository[City]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, City)

    def listActive(self) -> Iterable[City]:
        return self.session.query(City).filter(City.is_active.is_(True)).all()


